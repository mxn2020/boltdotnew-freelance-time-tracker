/*
  # Analytics and Goals Schema

  1. New Tables
    - `goals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text)
      - `description` (text, optional)
      - `type` (enum: hours, earnings, projects, clients, productivity)
      - `target_value` (numeric)
      - `current_value` (numeric, calculated)
      - `target_date` (date)
      - `status` (enum: active, completed, paused, cancelled)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `productivity_insights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (enum: recommendation, achievement, warning, trend)
      - `title` (text)
      - `description` (text)
      - `impact` (enum: high, medium, low)
      - `actionable` (boolean)
      - `action_text` (text, optional)
      - `data` (jsonb, optional)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access only their own data

  3. Functions
    - Goal progress calculation
    - Productivity insights generation
*/

-- Create custom types
CREATE TYPE goal_type AS ENUM ('hours', 'earnings', 'projects', 'clients', 'productivity');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'paused', 'cancelled');
CREATE TYPE insight_type AS ENUM ('recommendation', 'achievement', 'warning', 'trend');
CREATE TYPE impact_level AS ENUM ('high', 'medium', 'low');

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type goal_type NOT NULL,
  target_value numeric(10,2) NOT NULL,
  current_value numeric(10,2) DEFAULT 0,
  target_date date NOT NULL,
  status goal_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Productivity insights table
CREATE TABLE IF NOT EXISTS productivity_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type insight_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  impact impact_level NOT NULL,
  actionable boolean DEFAULT false,
  action_text text,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for goals
CREATE POLICY "Users can manage own goals"
  ON goals
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for productivity_insights
CREATE POLICY "Users can read own insights"
  ON productivity_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert insights"
  ON productivity_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON productivity_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_target_date ON goals(target_date);
CREATE INDEX IF NOT EXISTS idx_productivity_insights_user_id ON productivity_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_insights_type ON productivity_insights(type);
CREATE INDEX IF NOT EXISTS idx_productivity_insights_created_at ON productivity_insights(created_at);

-- Add triggers for updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate goal progress
CREATE OR REPLACE FUNCTION calculate_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  calculated_value numeric(10,2) := 0;
  start_date date;
  end_date date;
BEGIN
  -- Set date range for calculation (from goal creation to target date)
  start_date := NEW.created_at::date;
  end_date := LEAST(NEW.target_date, CURRENT_DATE);
  
  -- Calculate current value based on goal type
  CASE NEW.type
    WHEN 'hours' THEN
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600), 0)
      INTO calculated_value
      FROM time_entries
      WHERE user_id = NEW.user_id
        AND start_time::date >= start_date
        AND start_time::date <= end_date;
        
    WHEN 'earnings' THEN
      SELECT COALESCE(SUM(
        CASE 
          WHEN is_billable AND duration IS NOT NULL THEN
            (duration / 3600.0) * COALESCE(hourly_rate, 
              (SELECT hourly_rate FROM projects WHERE id = project_id),
              (SELECT hourly_rate FROM users WHERE id = NEW.user_id)
            )
          ELSE 0
        END
      ), 0)
      INTO calculated_value
      FROM time_entries
      WHERE user_id = NEW.user_id
        AND start_time::date >= start_date
        AND start_time::date <= end_date;
        
    WHEN 'projects' THEN
      SELECT COUNT(DISTINCT project_id)
      INTO calculated_value
      FROM time_entries
      WHERE user_id = NEW.user_id
        AND start_time::date >= start_date
        AND start_time::date <= end_date;
        
    WHEN 'clients' THEN
      SELECT COUNT(DISTINCT p.client_id)
      INTO calculated_value
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      WHERE te.user_id = NEW.user_id
        AND p.client_id IS NOT NULL
        AND te.start_time::date >= start_date
        AND te.start_time::date <= end_date;
        
    WHEN 'productivity' THEN
      -- Calculate productivity as billable hours / total hours * 100
      WITH productivity_calc AS (
        SELECT 
          SUM(CASE WHEN is_billable THEN EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600 ELSE 0 END) as billable_hours,
          SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600) as total_hours
        FROM time_entries
        WHERE user_id = NEW.user_id
          AND start_time::date >= start_date
          AND start_time::date <= end_date
      )
      SELECT CASE 
        WHEN total_hours > 0 THEN (billable_hours / total_hours) * 100
        ELSE 0
      END
      INTO calculated_value
      FROM productivity_calc;
  END CASE;
  
  -- Update current value
  NEW.current_value := calculated_value;
  
  -- Update status if goal is reached
  IF NEW.current_value >= NEW.target_value AND NEW.status = 'active' THEN
    NEW.status := 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for goal progress calculation
CREATE TRIGGER calculate_goal_progress_trigger
  BEFORE INSERT OR UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_goal_progress();

-- Function to generate productivity insights
CREATE OR REPLACE FUNCTION generate_productivity_insights(user_uuid uuid)
RETURNS void AS $$
DECLARE
  total_hours numeric;
  billable_hours numeric;
  productivity_rate numeric;
  avg_session_length numeric;
  recent_trend numeric;
  insight_record record;
BEGIN
  -- Calculate recent productivity metrics (last 30 days)
  SELECT 
    SUM(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600) as total,
    SUM(CASE WHEN is_billable THEN EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600 ELSE 0 END) as billable,
    AVG(EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600) as avg_length
  INTO total_hours, billable_hours, avg_session_length
  FROM time_entries
  WHERE user_id = user_uuid
    AND start_time >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate productivity rate
  productivity_rate := CASE 
    WHEN total_hours > 0 THEN (billable_hours / total_hours) * 100
    ELSE 0
  END;
  
  -- Generate insights based on metrics
  
  -- High productivity achievement
  IF productivity_rate >= 80 THEN
    INSERT INTO productivity_insights (user_id, type, title, description, impact, actionable)
    VALUES (
      user_uuid,
      'achievement',
      'Excellent Productivity!',
      format('Your productivity rate is %.1f%% - well above the 70%% target. Keep up the great work!', productivity_rate),
      'high',
      false
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Low productivity warning
  IF productivity_rate < 50 AND total_hours > 10 THEN
    INSERT INTO productivity_insights (user_id, type, title, description, impact, actionable, action_text)
    VALUES (
      user_uuid,
      'warning',
      'Productivity Below Target',
      format('Your productivity rate is %.1f%%. Consider reviewing your time allocation and focusing on billable work.', productivity_rate),
      'high',
      true,
      'Review recent time entries and identify non-billable activities that could be optimized'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Session length recommendations
  IF avg_session_length < 1 THEN
    INSERT INTO productivity_insights (user_id, type, title, description, impact, actionable, action_text)
    VALUES (
      user_uuid,
      'recommendation',
      'Consider Longer Work Sessions',
      format('Your average session length is %.1f hours. Longer focused sessions often lead to higher productivity.', avg_session_length),
      'medium',
      true,
      'Try time-blocking techniques to create longer, uninterrupted work periods'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Weekly hours trend
  WITH weekly_comparison AS (
    SELECT 
      SUM(CASE WHEN start_time >= CURRENT_DATE - INTERVAL '7 days' THEN EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600 ELSE 0 END) as this_week,
      SUM(CASE WHEN start_time >= CURRENT_DATE - INTERVAL '14 days' AND start_time < CURRENT_DATE - INTERVAL '7 days' THEN EXTRACT(EPOCH FROM (COALESCE(end_time, now()) - start_time)) / 3600 ELSE 0 END) as last_week
    FROM time_entries
    WHERE user_id = user_uuid
  )
  SELECT 
    CASE 
      WHEN last_week > 0 THEN ((this_week - last_week) / last_week) * 100
      ELSE 0
    END as trend
  INTO recent_trend
  FROM weekly_comparison;
  
  -- Positive trend insight
  IF recent_trend > 20 THEN
    INSERT INTO productivity_insights (user_id, type, title, description, impact, actionable)
    VALUES (
      user_uuid,
      'trend',
      'Increasing Work Volume',
      format('Your work hours increased by %.1f%% this week compared to last week. Great momentum!', recent_trend),
      'medium',
      false
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Negative trend warning
  IF recent_trend < -30 THEN
    INSERT INTO productivity_insights (user_id, type, title, description, impact, actionable, action_text)
    VALUES (
      user_uuid,
      'warning',
      'Declining Work Volume',
      format('Your work hours decreased by %.1f%% this week. Consider reviewing your schedule and commitments.', ABS(recent_trend)),
      'medium',
      true,
      'Review your project pipeline and consider reaching out to existing clients'
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
END;
$$ language 'plpgsql';