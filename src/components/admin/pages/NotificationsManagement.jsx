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
  BarChart3,
  Archive,
  ArchiveRestore,
  Megaphone
} from 'lucide-react'
import { AdminService } from '../../../services/admin'
import { NotificationsService } from '../../../services/notifications'

const NotificationsManagement = () => {
  const [activeTab, setActiveTab] = useState('notifications')
  const [notifications, setNotifications] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [templates, setTemplates] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    type: '',
    priority: '',
    status: ''
  })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false)
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
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewItem, setViewItem] = useState(null)
  const [viewType, setViewType] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData()
    }, 500)
    return () => clearTimeout(timer)
  }, [activeTab, filters, searchTerm])

  // Funções para ações dos botões
  const handleDeleteNotification = async (notificationId) => {
    if (window.confirm('Tem certeza que deseja deletar esta notificação?')) {
      try {
        await NotificationsService.deleteNotification(notificationId)
        loadData()
      } catch (error) {
        console.error('Erro ao deletar notificação:', error)
        alert('Erro ao deletar notificação')
      }
    }
  }

  const handleArchiveNotification = async (notificationId) => {
    if (window.confirm('Tem certeza que deseja arquivar esta notificação?')) {
      try {
        await NotificationsService.archiveNotification(notificationId)
        loadData()
      } catch (error) {
        console.error('Erro ao arquivar notificação:', error)
        alert('Erro ao arquivar notificação')
      }
    }
  }

  const handleViewNotification = (notification) => {
    setViewItem(notification)
    setViewType('notification')
    setShowViewModal(true)
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
    setViewItem(template)
    setViewType('template')
    setShowViewModal(true)
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
    setViewItem(campaign)
    setViewType('campaign')
    setShowViewModal(true)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'notifications') {
        // Use AdminService with proper token handling
        try {
          const isRead = filters.status === 'read' ? true : filters.status === 'unread' ? false : undefined;
          const response = await AdminService.getAdminNotifications(
            isRead, // read filter
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
          const isActive = filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined;
          const response = await NotificationsService.getNotificationTemplates(
            filters.type || undefined,
            undefined, // category
            searchTerm || undefined,
            isActive
          )
          setTemplates(response.templates || [])
        } catch (error) {
          console.error('Error loading templates:', error)
          setTemplates([])
        }
      } else if (activeTab === 'announcements') {
        try {
          const isActive = filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined;
          const isArchived = filters.status === 'archived' ? true : undefined;
          const response = await NotificationsService.listAdminAnnouncements({
            active: isActive,
            archived: isArchived
          })
          setAnnouncements(response || [])
        } catch (error) {
          console.error('Error loading announcements:', error)
          setAnnouncements([])
        }
      } else if (activeTab === 'analytics') {
        try {
          const response = await NotificationsService.getNotificationStats('month')
          
          // Mapear resposta do backend para estrutura esperada pelo frontend
          const mappedAnalytics = {
            notifications: {
              total: response.totalSent || 0,
              read: response.totalRead || 0,
              readRate: response.readRate || 0,
              clickRate: response.clickRate || 0,
              byType: response.byType || {}
            },
            campaigns: {
              totalSent: 0, // Backend ainda não retorna stats de campanhas
              deliveryRate: 0,
              openRate: 0
            }
          }
          
          setAnalytics(mappedAnalytics)
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
      // Map target_audience to targetRoles
      let targetRoles = undefined;
      if (data.target_audience === 'lawyers') targetRoles = ['lawyer'];
      else if (data.target_audience === 'clients') targetRoles = ['client', 'user'];
      else if (data.target_audience === 'admins') targetRoles = ['admin'];
      
      const payload = {
        ...data,
        targetRoles
      };
      
      // Remove target_audience from payload sent to API as it expects targetRoles
      delete payload.target_audience;

      await AdminService.sendBroadcastNotification(payload)
      loadData()
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erro ao enviar notificação:', error)
    }
  }

  const handleSaveAnnouncement = async (data) => {
    try {
      const payload = {
        ...data,
        target_audience: typeof data.target_audience === 'string' 
          ? { type: data.target_audience } 
          : data.target_audience
      }
      await NotificationsService.createAdminAnnouncement(payload)
      loadData()
      setShowCreateAnnouncementModal(false)
    } catch (error) {
      console.error('Erro ao criar anúncio:', error)
      alert('Erro ao criar anúncio. Verifique o console para mais detalhes.')
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
      category: 'system',
      priority: 'medium',
      channels: ['in_app'],
      targetUsers: [],
      target_audience: 'all',
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
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="system">Sistema</option>
                  <option value="event">Eventos</option>
                  <option value="store">Loja</option>
                  <option value="ai">IA</option>
                  <option value="gamification">Gamificação</option>
                  <option value="social">Social</option>
                  <option value="security">Segurança</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Público Alvo
                </label>
                <select
                  value={formData.target_audience}
                  onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os Usuários</option>
                  <option value="lawyers">Advogados</option>
                  <option value="clients">Clientes</option>
                  <option value="admins">Administradores</option>
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

  // Modal de Criação de Anúncio
  const CreateAnnouncementModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      title: '',
      message: '',
      type: 'info',
      priority: 'normal',
      target_audience: 'all',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      active: true
    })

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Criar Novo Anúncio</h3>
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
                  <option value="warning">Aviso</option>
                  <option value="success">Sucesso</option>
                  <option value="error">Erro</option>
                  <option value="maintenance">Manutenção</option>
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
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="critical">Crítica</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Fim (Opcional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Público Alvo
              </label>
              <select
                value={formData.target_audience}
                onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os Usuários</option>
                <option value="lawyers">Advogados</option>
                <option value="clients">Clientes</option>
                <option value="admins">Administradores</option>
              </select>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Configurações de Exibição</h4>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                  <select
                    value={formData.style}
                    onChange={(e) => setFormData({...formData, style: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="banner">Banner</option>
                    <option value="modal">Modal</option>
                    <option value="toast">Toast</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Posição</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="top">Topo</option>
                    <option value="bottom">Rodapé</option>
                    <option value="center">Centro (Modal)</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="create_is_dismissible"
                    checked={formData.is_dismissible}
                    onChange={(e) => setFormData({...formData, is_dismissible: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="create_is_dismissible" className="text-sm font-medium text-gray-700">Permitir fechar</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="create_is_persistent"
                    checked={formData.is_persistent}
                    onChange={(e) => setFormData({...formData, is_persistent: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="create_is_persistent" className="text-sm font-medium text-gray-700">Persistente</label>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="create_active"
                checked={formData.active}
                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="create_active" className="text-sm font-medium text-gray-700">
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
                Criar Anúncio
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
      is_active: true,
      // Announcement fields
      title: '',
      message: '',
      priority: 'normal',
      target_audience: 'all',
      start_date: '',
      end_date: '',
      active: true,
      style: 'banner',
      position: 'top',
      is_dismissible: true,
      is_persistent: false
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
        } else if (type === 'announcement') {
          setFormData({
            title: item.title || '',
            message: item.message || '',
            type: item.type || 'info',
            priority: item.priority || 'normal',
            target_audience: item.target_audience || 'all',
            start_date: item.start_date ? item.start_date.split('T')[0] : '',
            end_date: item.end_date ? item.end_date.split('T')[0] : '',
            active: item.active !== undefined ? item.active : true,
            style: item.style || 'banner',
            position: item.position || 'top',
            is_dismissible: item.is_dismissible !== undefined ? item.is_dismissible : true,
            is_persistent: item.is_persistent || false
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
          await NotificationsService.updateEmailCampaign(item.id, formData)
        } else if (type === 'announcement') {
          await NotificationsService.updateAdminAnnouncement(item.id, {
            title: formData.title,
            message: formData.message,
            type: formData.type,
            priority: formData.priority,
            target_audience: typeof formData.target_audience === 'string' 
              ? { type: formData.target_audience } 
              : formData.target_audience,
            start_date: formData.start_date,
            end_date: formData.end_date,
            active: formData.active,
            style: formData.style,
            position: formData.position,
            is_dismissible: formData.is_dismissible,
            is_persistent: formData.is_persistent
          })
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
              Editar {type === 'template' ? 'Template' : type === 'announcement' ? 'Anúncio' : 'Campanha'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'announcement' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mensagem</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="info">Informação</option>
                      <option value="warning">Aviso</option>
                      <option value="success">Sucesso</option>
                      <option value="error">Erro</option>
                      <option value="maintenance">Manutenção</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Público Alvo</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({...formData, target_audience: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="all">Todos os Usuários</option>
                    <option value="lawyers">Advogados</option>
                    <option value="clients">Clientes</option>
                    <option value="admins">Administradores</option>
                  </select>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Configurações de Exibição</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estilo</label>
                      <select
                        value={formData.style}
                        onChange={(e) => setFormData({...formData, style: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="banner">Banner</option>
                        <option value="modal">Modal</option>
                        <option value="toast">Toast</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Posição</label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="top">Topo</option>
                        <option value="bottom">Rodapé</option>
                        <option value="center">Centro (Modal)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex space-x-6">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="edit_is_dismissible"
                        checked={formData.is_dismissible}
                        onChange={(e) => setFormData({...formData, is_dismissible: e.target.checked})}
                        className="mr-2"
                      />
                      <label htmlFor="edit_is_dismissible" className="text-sm font-medium text-gray-700">Permitir fechar</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="edit_is_persistent"
                        checked={formData.is_persistent}
                        onChange={(e) => setFormData({...formData, is_persistent: e.target.checked})}
                        className="mr-2"
                      />
                      <label htmlFor="edit_is_persistent" className="text-sm font-medium text-gray-700">Persistente</label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="edit_active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="edit_active" className="text-sm font-medium text-gray-700">Ativo</label>
                </div>
              </div>
            ) : (
              <>
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
            </>
            )}

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

  // Modal de Visualização
  const ViewModal = ({ isOpen, onClose, item, type }) => {
    const [detailedStats, setDetailedStats] = useState(null);

    useEffect(() => {
      if (isOpen && item && type === 'announcement') {
        NotificationsService.getAnnouncementBannerStats(item.id)
          .then(stats => setDetailedStats(stats))
          .catch(err => console.error('Error fetching stats:', err));
      } else {
        setDetailedStats(null);
      }
    }, [isOpen, item, type]);

    if (!isOpen || !item) return null

    const renderContent = () => {
      switch (type) {
        case 'notification':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Título</label>
                <p className="mt-1 text-gray-900">{item.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Mensagem</label>
                <p className="mt-1 text-gray-900">{item.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${item.type === 'error' ? 'bg-red-100 text-red-800' :
                      item.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      item.type === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'}`}>
                    {item.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prioridade</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${item.priority === 'high' || item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}>
                    {item.priority}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Data de Envio</label>
                <p className="mt-1 text-gray-900">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )
        case 'template':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nome</label>
                <p className="mt-1 text-gray-900">{item.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Assunto</label>
                <p className="mt-1 text-gray-900">{item.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Conteúdo</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                  {item.content}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <p className="mt-1 text-gray-900 capitalize">{item.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Categoria</label>
                  <p className="mt-1 text-gray-900 capitalize">{item.category}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                  ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {item.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          )
        case 'campaign':
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Nome</label>
                <p className="mt-1 text-gray-900">{item.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Assunto</label>
                <p className="mt-1 text-gray-900">{item.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                  ${item.status === 'sent' ? 'bg-green-100 text-green-800' :
                    item.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'}`}>
                  {item.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Enviados</p>
                  <p className="font-semibold">{item.stats?.sent || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Aberturas</p>
                  <p className="font-semibold">{item.stats?.opened || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Cliques</p>
                  <p className="font-semibold">{item.stats?.clicked || 0}</p>
                </div>
              </div>
            </div>
          )
        case 'announcement':
          const viewCount = detailedStats ? detailedStats.views : (item.view_count || 0);
          const clickCount = detailedStats ? detailedStats.clicks : (item.click_count || 0);
          const dismissCount = detailedStats ? detailedStats.dismissals : (item.dismiss_count || 0);
          // Backend já retorna percentual (0-100), não multiplicar novamente
          const clickRate = detailedStats ? Number(detailedStats.clickRate || detailedStats.ctr || detailedStats.click_rate || 0).toFixed(2) : '0.00';
          const dismissalRate = detailedStats ? Number(detailedStats.dismissalRate || detailedStats.dismiss_rate || 0).toFixed(2) : '0.00';
          
          return (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Título</label>
                <p className="mt-1 text-gray-900">{item.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Mensagem</label>
                <p className="mt-1 text-gray-900">{item.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${item.type === 'error' ? 'bg-red-100 text-red-800' :
                      item.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      item.type === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'}`}>
                    {item.type}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prioridade</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                    ${item.priority === 'high' || item.priority === 'critical' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'}`}>
                    {item.priority}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Vigência</label>
                <p className="mt-1 text-gray-900">
                  {new Date(item.start_date).toLocaleDateString('pt-BR')}
                  {item.end_date ? ` - ${new Date(item.end_date).toLocaleDateString('pt-BR')}` : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
                  ${item.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {item.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Visualizações</p>
                  <p className="font-semibold">{viewCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Clicks</p>
                  <p className="font-semibold">{clickCount} ({clickRate}%)</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Dispensados</p>
                  <p className="font-semibold">{dismissCount} ({dismissalRate}%)</p>
                </div>
              </div>
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold capitalize">
              Detalhes da {type === 'notification' ? 'Notificação' : type === 'template' ? 'Template' : 'Campanha'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-6 w-6" />
            </button>
          </div>
          {renderContent()}
          <div className="flex justify-end pt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Fechar
            </button>
          </div>
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
        <div className="flex space-x-2">
          {activeTab === 'notifications' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Notificação</span>
            </button>
          )}
          {activeTab === 'announcements' && (
            <button
              onClick={() => setShowCreateAnnouncementModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Anúncio</span>
            </button>
          )}
        </div>
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
            { id: 'announcements', label: 'Anúncios', icon: Megaphone },
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
            {activeTab === 'notifications' && (
              <>
                <option value="read">Lidas</option>
                <option value="unread">Não lidas</option>
              </>
            )}
            {activeTab === 'templates' && (
              <>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </>
            )}
            {activeTab === 'campaigns' && (
              <>
                <option value="draft">Rascunho</option>
                <option value="scheduled">Agendada</option>
                <option value="sent">Enviada</option>
                <option value="cancelled">Cancelada</option>
              </>
            )}
            {activeTab === 'announcements' && (
              <>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="archived">Arquivados</option>
              </>
            )}
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
        ) : activeTab === 'announcements' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anúncio
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
                    Vigência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {announcement.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {announcement.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-gray-900">
                        {announcement.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getPriorityBadge(announcement.priority)}>
                        {announcement.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        announcement.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(announcement.start_date).toLocaleDateString('pt-BR')}
                      {announcement.end_date ? ` - ${new Date(announcement.end_date).toLocaleDateString('pt-BR')}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleToggleAnnouncementActive(announcement.id, announcement.active)}
                          className={`${announcement.active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                          title={announcement.active ? 'Desativar' : 'Ativar'}
                        >
                          {announcement.active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        {announcement.is_archived ? (
                          <button 
                            onClick={() => handleUnarchiveAnnouncement(announcement.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Desarquivar"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleArchiveAnnouncement(announcement.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Arquivar"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
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

      {/* Create Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={showCreateAnnouncementModal}
        onClose={() => setShowCreateAnnouncementModal(false)}
        onSubmit={handleSaveAnnouncement}
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

      <ViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        item={viewItem}
        type={viewType}
      />

    </div>
  )
}

export default NotificationsManagement
