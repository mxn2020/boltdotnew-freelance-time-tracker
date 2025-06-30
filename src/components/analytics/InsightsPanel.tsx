// src/components/analytics/InsightsPanel.tsx
import React from 'react'
import { useProductivityInsights } from '../../hooks/useProductivityInsights'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  RefreshCw, 
  Eye, 
  X,
  CheckCircle
} from 'lucide-react'
import { ProductivityInsight } from '../../types/analytics'
import { format } from 'date-fns'

export const InsightsPanel: React.FC = () => {
  const { 
    insights, 
    loading, 
    generateInsights, 
    markInsightAsRead, 
    markAllInsightsAsRead,
    dismissInsight,
    getUnreadCount,
    getHighImpactInsights
  } = useProductivityInsights()

  const getInsightIcon = (type: ProductivityInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return Lightbulb
      case 'achievement':
        return Award
      case 'warning':
        return AlertTriangle
      case 'trend':
        return TrendingUp
      default:
        return Lightbulb
    }
  }

  const getInsightColor = (type: ProductivityInsight['type'], impact: ProductivityInsight['impact']) => {
    switch (type) {
      case 'recommendation':
        return impact === 'high' ? 'text-blue-600 bg-blue-100' : 'text-blue-500 bg-blue-50'
      case 'achievement':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return impact === 'high' ? 'text-red-600 bg-red-100' : 'text-yellow-600 bg-yellow-100'
      case 'trend':
        return 'text-purple-600 bg-purple-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getImpactBadge = (impact: ProductivityInsight['impact']) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[impact]
  }

  const unreadCount = getUnreadCount()
  const highImpactInsights = getHighImpactInsights()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Productivity Insights</h2>
          <p className="text-gray-600">
            AI-powered recommendations to improve your productivity
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {unreadCount} new
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCircle}
              onClick={markAllInsightsAsRead}
            >
              Mark All Read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={generateInsights}
            loading={loading}
          >
            Refresh Insights
          </Button>
        </div>
      </div>

      {/* High Impact Insights */}
      {highImpactInsights.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              High Priority Insights
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {highImpactInsights.slice(0, 3).map((insight) => {
              const Icon = getInsightIcon(insight.type)
              return (
                <div key={insight.id} className="p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Icon className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        {insight.actionable && insight.action_text && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                            <strong>Action:</strong> {insight.action_text}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => markInsightAsRead(insight.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={() => dismissInsight(insight.id)}
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Generating insights...</p>
        </div>
      ) : insights.length === 0 ? (
        <Card className="text-center py-12">
          <Lightbulb className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-500 mb-4">Start tracking time to get personalized productivity insights</p>
          <Button
            icon={RefreshCw}
            onClick={generateInsights}
            loading={loading}
          >
            Generate Insights
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights.map((insight) => {
            const Icon = getInsightIcon(insight.type)
            const colorClasses = getInsightColor(insight.type, insight.impact)
            
            return (
              <Card 
                key={insight.id} 
                className={`${!insight.is_read ? 'border-blue-200 bg-blue-50' : ''} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${colorClasses}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{insight.title}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactBadge(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                        {!insight.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      
                      {insight.actionable && insight.action_text && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-start space-x-2">
                            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-blue-900">Recommended Action:</p>
                              <p className="text-sm text-blue-800">{insight.action_text}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {format(new Date(insight.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!insight.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Eye}
                        onClick={() => markInsightAsRead(insight.id)}
                        className="text-blue-600 hover:text-blue-700"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={X}
                      onClick={() => dismissInsight(insight.id)}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}