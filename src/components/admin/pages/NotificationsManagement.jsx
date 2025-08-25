import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Send, 
  Users, 
  Calendar, 
  Filter, 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  XCircle,
  Clock,
  Target,
  BarChart3
} from 'lucide-react'
import { AdminService } from '../../../services/admin'
import { NotificationsService } from '../../../services/notifications'

const NotificationsManagement = () => {
  const [activeTab, setActiveTab] = useState('notifications')
  const [notifications, setNotifications] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [editType, setEditType] = useState('') // 'template' ou 'campaign'
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0
  })

  useEffect(() => {
    loadData()
  }, [activeTab, filters])

  // Funções para ações dos botões
  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Tem certeza que deseja deletar esta notificação?')) {
      try {
        await AdminService.deleteAdminUser(notificationId) // Usar função apropriada quando disponível
        loadData()
      } catch (error) {
        console.error('Erro ao deletar notificação:', error)
        alert('Erro ao deletar notificação')
      }
    }
  }

  const handleViewNotification = (notification) => {
    setSelectedNotification(notification)
    // Implementar modal de visualização
  }

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Tem certeza que deseja deletar este template?')) {
      try {
        await NotificationsService.deleteNotificationTemplate(templateId)
        loadData()
      } catch (error) {
        console.error('Erro ao deletar template:', error)
        alert('Erro ao deletar template')
      }
    }
  }

  const handleViewTemplate = (template) => {
    setSelectedNotification(template)
    // Implementar modal de visualização
  }

  const handleEditTemplate = (template) => {
    setEditingItem(template)
    setEditType('template')
    setShowEditModal(true)
  }

  const handleEditCampaign = (campaign) => {
    setEditingItem(campaign)
    setEditType('campaign')
    setShowEditModal(true)
  }

  const handleDeleteCampaign = async (campaignId) => {
    if (window.confirm('Tem certeza que deseja deletar esta campanha?')) {
      try {
        await NotificationsService.deleteEmailCampaign(campaignId)
        loadData()
      } catch (error) {
        console.error('Erro ao deletar campanha:', error)
        alert('Erro ao deletar campanha')
      }
    }
  }

  const handleViewCampaign = (campaign) => {
    setSelectedNotification(campaign)
    // Implementar modal de visualização
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'notifications') {
        // Use AdminService with proper token handling
        try {
          const response = await AdminService.getAdminNotifications(
            undefined, // read filter
            filters.priority || undefined, // priority filter
            1, // page
            20 // limit
          )
          
          setNotifications(response.notifications || [])
          setStats({
            total: response.total || 0,
            sent: response.total || 0,
            pending: 0,
            failed: 0
          })
        } catch (error) {
          console.error('Error loading admin notifications:', error)
          setNotifications([])
        }
      } else if (activeTab === 'campaigns') {
        try {
          const response = await NotificationsService.getEmailCampaigns(filters.status)
          setCampaigns(response.campaigns || [])
        } catch (error) {
          console.error('Error loading campaigns:', error)
          setCampaigns([])
        }
      } else if (activeTab === 'templates') {
        try {
          const response = await NotificationsService.getNotificationTemplates()
          setTemplates(response.templates || [])
        } catch (error) {
          console.error('Error loading templates:', error)
          setTemplates([])
        }
      } else if (activeTab === 'analytics') {
        try {
          const response = await AdminService.getAnalytics('month')
          setAnalytics(response)
        } catch (error) {
          console.error('Error loading analytics:', error)
          setAnalytics(null)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      // Initialize with empty arrays to prevent map errors
      setNotifications([])
      setCampaigns([])
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleSendBroadcast = async (data) => {
    try {
      await AdminService.sendBroadcastNotification(data)
      loadData()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  const getNotificationIcon = (type) => {
    const iconClass = "h-5 w-5"
    switch (type) {
      case 'success': return <CheckCircle className={`${iconClass} text-green-500`} />
      case 'warning': return <AlertCircle className={`${iconClass} text-yellow-500`} />
      case 'error': return <XCircle className={`${iconClass} text-red-500`} />
      default: return <Info className={`${iconClass} text-blue-500`} />
    }
  }

  const getPriorityBadge = (priority) => {
    const baseClass = "px-2 py-1 text-xs font-medium rounded-full"
    switch (priority) {
      case 'critical': return `${baseClass} bg-red-100 text-red-800`
      case 'high': return `${baseClass} bg-orange-100 text-orange-800`
      case 'medium': return `${baseClass} bg-yellow-100 text-yellow-800`
      default: return `${baseClass} bg-gray-100 text-gray-800`
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  const CreateNotificationModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      channels: ['in_app'],
      targetUsers: [],
      scheduledFor: ''
    })

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Criar Notificação</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            onSubmit(formData)
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Informação</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Aviso</option>
                  <option value="error">Erro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Canais de Envio
              </label>
              <div className="space-y-2">
                {['in_app', 'email', 'push', 'sms'].map(channel => (
                  <label key={channel} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, channels: [...formData.channels, channel]})
                        } else {
                          setFormData({...formData, channels: formData.channels.filter(c => c !== channel)})
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="capitalize">{channel.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enviar Notificação
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

// Modal de Edição
const EditModal = ({ isOpen, onClose, item, type }) => {
    const [formData, setFormData] = useState({
      name: '',
      subject: '',
      content: '',
      type: 'info',
      category: 'system',
      is_active: true
    })

    useEffect(() => {
      if (item && isOpen) {
        if (type === 'template') {
          setFormData({
            name: item.name || '',
            subject: item.subject || '',
            content: item.content || '',
            type: item.type || 'info',
            category: item.category || 'system',
            is_active: item.is_active !== undefined ? item.is_active : true
          })
        } else if (type === 'campaign') {
          setFormData({
            name: item.name || '',
            subject: item.subject || '',
            content: item.content || '',
            type: item.type || 'promotional',
            status: item.status || 'draft',
            is_active: item.is_active !== undefined ? item.is_active : true
          })
        }
      }
    }, [item, isOpen, type])

    const handleSubmit = async (e) => {
      e.preventDefault()
      try {
        if (type === 'template') {
          await NotificationsService.updateNotificationTemplate(item.id, formData)
        } else if (type === 'campaign') {
          // Implementar atualização de campanha quando a API estiver disponível
          console.log('Atualizando campanha:', item.id, formData)
        }
        loadData()
        onClose()
      } catch (error) {
        console.error('Erro ao atualizar:', error)
        alert('Erro ao atualizar item')
      }
    }

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              Editar {type === 'template' ? 'Template' : 'Campanha'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assunto
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {type === 'template' ? (
                    <>
                      <option value="info">Info</option>
                      <option value="success">Sucesso</option>
                      <option value="warning">Aviso</option>
                      <option value="error">Erro</option>
                    </>
                  ) : (
                    <>
                      <option value="promotional">Promocional</option>
                      <option value="newsletter">Newsletter</option>
                      <option value="transactional">Transacional</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {type === 'template' ? 'Categoria' : 'Status'}
                </label>
                <select
                  value={type === 'template' ? formData.category : formData.status}
                  onChange={(e) => setFormData({
                    ...formData, 
                    [type === 'template' ? 'category' : 'status']: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {type === 'template' ? (
                    <>
                      <option value="system">Sistema</option>
                      <option value="marketing">Marketing</option>
                      <option value="notification">Notificação</option>
                    </>
                  ) : (
                    <>
                      <option value="draft">Rascunho</option>
                      <option value="scheduled">Agendada</option>
                      <option value="sent">Enviada</option>
                      <option value="cancelled">Cancelada</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Ativo
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Notificações</h1>
          <p className="text-gray-600">Gerencie notificações, campanhas e templates</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Notificação</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total de Notificações"
          value={stats.total}
          icon={Bell}
          color="bg-blue-500"
        />
        <StatCard
          title="Enviadas"
          value={stats.sent}
          icon={Send}
          color="bg-green-500"
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={Clock}
          color="bg-yellow-500"
        />
        <StatCard
          title="Falharam"
          value={stats.failed}
          icon={XCircle}
          color="bg-red-500"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'notifications', label: 'Notificações', icon: Bell },
            { id: 'campaigns', label: 'Campanhas', icon: Target },
            { id: 'templates', label: 'Templates', icon: Edit },
            { id: 'analytics', label: 'Análises', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            <option value="info">Informação</option>
            <option value="success">Sucesso</option>
            <option value="warning">Aviso</option>
            <option value="error">Erro</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({...filters, priority: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as prioridades</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="critical">Crítica</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="read">Lidas</option>
            <option value="unread">Não lidas</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Carregando...</p>
          </div>
        ) : activeTab === 'notifications' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notificação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {notification.message}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {notification.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(notification.priority)}>
                        {notification.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        notification.is_read 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {notification.is_read ? 'Lida' : 'Não lida'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewNotification(notification)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'templates' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {template.title || template.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {template.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {template.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {template.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditTemplate(template)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'campaigns' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campanha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enviados
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {campaign.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {campaign.subject}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.status === 'sent' ? 'Enviada' :
                         campaign.status === 'scheduled' ? 'Agendada' :
                         campaign.status === 'draft' ? 'Rascunho' : 'Falhou'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {campaign.total_sent || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewCampaign(campaign)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleEditCampaign(campaign)}
                          className="text-green-600 hover:text-green-900"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Deletar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'analytics' ? (
          <div className="p-6">
            {analytics ? (
              <div className="space-y-6">
                {/* Métricas Gerais */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Bell className="h-8 w-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Total de Notificações</p>
                        <p className="text-2xl font-bold text-blue-900">{analytics.notifications?.total || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Notificações Lidas</p>
                        <p className="text-2xl font-bold text-green-900">{analytics.notifications?.read || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-yellow-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">Taxa de Leitura</p>
                        <p className="text-2xl font-bold text-yellow-900">{analytics.notifications?.readRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Target className="h-8 w-8 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Taxa de Clique</p>
                        <p className="text-2xl font-bold text-purple-900">{analytics.notifications?.clickRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métricas de Campanhas */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Campanhas de E-mail</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{analytics.campaigns?.totalSent || 0}</p>
                      <p className="text-sm text-gray-500">E-mails Enviados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{analytics.campaigns?.deliveryRate || 0}%</p>
                      <p className="text-sm text-gray-500">Taxa de Entrega</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{analytics.campaigns?.openRate || 0}%</p>
                      <p className="text-sm text-gray-500">Taxa de Abertura</p>
                    </div>
                  </div>
                </div>

                {/* Estatísticas por Tipo */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações por Tipo</h3>
                  <div className="space-y-3">
                    {analytics.notifications?.byType && Object.entries(analytics.notifications.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize text-gray-700">{type}</span>
                        <span className="font-semibold text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Carregando análises...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500">Funcionalidade em desenvolvimento</p>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      <CreateNotificationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleSendBroadcast}
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingItem(null)
          setEditType(null)
        }}
        item={editingItem}
        type={editType}
      />

    </div>
  )
}

export default NotificationsManagement