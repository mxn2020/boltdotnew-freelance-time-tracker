//src/pages/ClientsPage.tsx
import React, { useState } from 'react'
import { useClients } from '../hooks/useClients'
import { ClientForm } from '../components/clients/ClientForm'
import { Button } from '../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Plus, Users, Mail, Phone, Building, DollarSign, Edit, Trash2 } from 'lucide-react'
import { Client, CreateClientData } from '../types/projects'
import { formatCurrency } from '../utils/timeUtils'

export const ClientsPage: React.FC = () => {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients()
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const handleCreateClient = async (data: CreateClientData) => {
    await createClient(data)
    setShowForm(false)
  }

  const handleUpdateClient = async (data: CreateClientData) => {
    if (editingClient) {
      await updateClient(editingClient.id, data)
      setEditingClient(null)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const handleDeleteClient = async (client: Client) => {
    if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
      await deleteClient(client.id)
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingClient(null)
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h1>
        </div>

        <ClientForm
          client={editingClient || undefined}
          onSubmit={editingClient ? handleUpdateClient : handleCreateClient}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your client relationships</p>
        </div>
        <Button
          icon={Plus}
          onClick={() => setShowForm(true)}
        >
          Add Client
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-4">Add your first client to get started</p>
          <Button
            icon={Plus}
            onClick={() => setShowForm(true)}
          >
            Add Client
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Edit}
                    onClick={() => handleEditClient(client)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDeleteClient(client)}
                    className="text-red-600 hover:text-red-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {client.company && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-2" />
                    <span>{client.company}</span>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{client.email}</span>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2" />
                    <span>{client.phone}</span>
                  </div>
                )}

                {client.hourly_rate && (
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-2" />
                    <span>{formatCurrency(client.hourly_rate)}/hour</span>
                  </div>
                )}

                {client.address && (
                  <div className="text-sm text-gray-600 mt-2">
                    <p className="line-clamp-2">{client.address}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}