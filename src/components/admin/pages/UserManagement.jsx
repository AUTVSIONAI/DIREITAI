import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Ban, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Crown,
  Shield,
  User,
  Download,
  Plus,
  Eye,
  Trash2,
  Loader2,
  Zap,
  Trophy,
  Star
} from 'lucide-react';
import { AdminService } from '../../../services/admin';
import { useSearchParams } from 'react-router-dom'

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showActions, setShowActions] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    full_name: '',
    username: '',
    role: 'user',
    plan: 'gratuito',
    city: '',
    state: ''
  })
  const [allUsers, setAllUsers] = useState([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [syncing, setSyncing] = useState(false)
  const [syncSummary, setSyncSummary] = useState(null)

  // Função para carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      if (selectedPlan !== 'all') filters.plan = selectedPlan;
      if (selectedStatus !== 'all') filters.status = selectedStatus;
      if (searchTerm) filters.search = searchTerm;
      
      const baseFilters = {
        search: searchTerm || undefined,
        plan: selectedPlan !== 'all' ? selectedPlan : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined
      }
      const serverLimit = 100
      const first = await AdminService.getAdminUsers(baseFilters, 1, serverLimit)
      let accumulated = Array.isArray(first?.users) ? first.users : []
      const tp = Math.max(1, Number(first?.totalPages || 1))
      for (let p = 2; p <= tp; p++) {
        try {
          const resp = await AdminService.getAdminUsers(baseFilters, p, serverLimit)
          if (Array.isArray(resp?.users) && resp.users.length > 0) {
            accumulated = accumulated.concat(resp.users)
          }
        } catch {}
      }
      setAllUsers(accumulated)
      setUsers(accumulated)
      const filteredCount = accumulated.filter(user => {
        const matchesSearch = (user.full_name?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                              (user.email?.toLowerCase() || '').includes((searchTerm || '').toLowerCase()) ||
                              (user.username?.toLowerCase() || '').includes((searchTerm || '').toLowerCase())
        const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan
        const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
        return matchesSearch && matchesPlan && matchesStatus
      }).length
      const tpClient = Math.max(1, Math.ceil(filteredCount / limit))
      setTotal(filteredCount)
      setTotalPages(tpClient)
    } catch (err) {
      setError('Erro ao carregar usuários');
      console.error('Erro ao carregar usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
     loadUsers();
   }, []);

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const qp = params.get('search');
    if (qp && qp !== searchTerm) {
      setSearchTerm(qp);
    }
    const qs = params.get('status');
    const validStatus = ['all', 'active', 'inactive', 'banned'];
    if (qs) {
      if (validStatus.includes(qs)) {
        if (qs !== selectedStatus) setSelectedStatus(qs);
      } else {
        // normaliza inválido
        if (selectedStatus !== 'all') setSelectedStatus('all');
        params.delete('status');
        setSearchParams(params);
      }
    }
    const qpPlan = params.get('plan');
    const validPlans = ['all', 'gratuito', 'patriota', 'cidadao', 'engajado', 'lider', 'elite'];
    if (qpPlan) {
      if (validPlans.includes(qpPlan)) {
        if (qpPlan !== selectedPlan) setSelectedPlan(qpPlan);
      } else {
        // normaliza inválido
        if (selectedPlan !== 'all') setSelectedPlan('all');
        params.delete('plan');
        setSearchParams(params);
      }
    }
  }, [searchParams]);

  // Sincroniza URL quando filtros mudam
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    const currentSearch = params.get('search') || '';
    const desiredSearch = searchTerm || '';
    if (desiredSearch) {
      if (currentSearch !== desiredSearch) { params.set('search', desiredSearch); changed = true; }
    } else if (currentSearch) { params.delete('search'); changed = true; }

    const currentStatus = params.get('status') || '';
    const desiredStatus = selectedStatus;
    if (desiredStatus && desiredStatus !== 'all') {
      if (currentStatus !== desiredStatus) { params.set('status', desiredStatus); changed = true; }
    } else if (currentStatus) { params.delete('status'); changed = true; }

    const currentPlan = params.get('plan') || '';
    const desiredPlan = selectedPlan;
    if (desiredPlan && desiredPlan !== 'all') {
      if (currentPlan !== desiredPlan) { params.set('plan', desiredPlan); changed = true; }
    } else if (currentPlan) { params.delete('plan'); changed = true; }

    if (changed) setSearchParams(params);
  }, [searchTerm, selectedStatus, selectedPlan]);
 
   // Recarregar quando filtros mudarem
   useEffect(() => {
     const timeoutId = setTimeout(() => {
       loadUsers();
     }, 500); // Debounce de 500ms
     
     return () => clearTimeout(timeoutId);
  }, [selectedPlan, selectedStatus, searchTerm, page, limit]);

  useEffect(() => {
    setPage(1)
  }, [selectedPlan, selectedStatus, searchTerm])



  const getPlanBadge = (plan) => {
    const badges = {
      gratuito: { color: 'bg-gray-100 text-gray-800', icon: User, label: 'Gratuito' },
      patriota: { color: 'bg-blue-100 text-blue-800', icon: Star, label: 'Patriota' },
      cidadao: { color: 'bg-blue-200 text-blue-900', icon: Star, label: 'Cidadão' },
      engajado: { color: 'bg-indigo-100 text-indigo-800', icon: Shield, label: 'Engajado' },
      lider: { color: 'bg-purple-100 text-purple-800', icon: Crown, label: 'Líder' },
      elite: { color: 'bg-yellow-100 text-yellow-800', icon: Trophy, label: 'Elite' }
    }
    return badges[plan] || badges.gratuito
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      inactive: { color: 'bg-gray-100 text-gray-800', label: 'Inativo' },
      banned: { color: 'bg-red-100 text-red-800', label: 'Banido' }
    }
    return badges[status] || badges.active
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    const matchesPlan = selectedPlan === 'all' || user.plan === selectedPlan
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus
    
    return matchesSearch && matchesPlan && matchesStatus
  })
  const paginatedUsers = filteredUsers.slice((page - 1) * limit, (page - 1) * limit + limit)

  const handleViewUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleEditUser = (user) => {
    setEditingUser({
      id: user.id,
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      plan: user.plan || 'gratuito',
      city: user.city || '',
      state: user.state || ''
    })
    setShowEditModal(true)
    setShowActions(null)
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    if (!editingUser.full_name || !editingUser.email) {
      alert('Nome e email são obrigatórios')
      return
    }

    try {
      setIsUpdating(true)
      
      // Chamar o backend para atualizar o usuário
      await AdminService.updateUser(editingUser.id, {
        full_name: editingUser.full_name,
        username: editingUser.username,
        email: editingUser.email,
        city: editingUser.city,
        state: editingUser.state,
        plan: editingUser.plan
      })
      
      // Atualizar a lista de usuários
      await loadUsers()
      
      setShowEditModal(false)
      setEditingUser(null)
      alert('Usuário atualizado com sucesso!')
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
      alert('Erro ao atualizar usuário')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditInputChange = (field, value) => {
    setEditingUser(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBanUser = async (user) => {
    if (window.confirm(`Tem certeza que deseja banir o usuário ${user.full_name || user.email}?`)) {
      try {
        setShowActions(null) // Fechar menu imediatamente
        await AdminService.banUser(user.id)
        
        // Atualizar o usuário localmente primeiro para feedback imediato
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id 
              ? { ...u, status: 'banned', banned: true }
              : u
          )
        )
        
        // Recarregar lista completa
        await loadUsers()
        alert('Usuário banido com sucesso!')
      } catch (error) {
        console.error('Erro ao banir usuário:', error)
        alert('Erro ao banir usuário. Tente novamente.')
        // Recarregar lista em caso de erro para garantir consistência
        await loadUsers()
      }
    }
  }

  const handleDeleteUser = async (user) => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o usuário ${user.full_name || user.email}? Esta ação não pode ser desfeita.`)) {
      try {
        setShowActions(null) // Fechar menu imediatamente
        await AdminService.deleteUser(user.id)
        
        // Remover usuário localmente primeiro para feedback imediato
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id))
        
        // Recarregar lista completa
        await loadUsers()
        alert('Usuário excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        alert('Erro ao excluir usuário. Tente novamente.')
        // Recarregar lista em caso de erro para garantir consistência
        await loadUsers()
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600">Gerencie todos os usuários da plataforma</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={async () => {
              try {
                setSyncing(true)
                setSyncSummary(null)
                const result = await AdminService.syncAuthUsers()
                setSyncSummary(result?.summary || null)
                if (result?.success) {
                  alert('Sincronização concluída com sucesso')
                  await loadUsers()
                } else {
                  alert(result?.error || 'Falha na sincronização')
                }
              } catch (err) {
                console.error('Erro ao sincronizar usuários:', err)
                alert('Erro ao sincronizar usuários')
              } finally {
                setSyncing(false)
              }
            }}
            className={`btn-secondary flex items-center ${syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Sincronizar Auth → Public
              </>
            )}
          </button>
          <button className="btn-secondary flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Usuários</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Premium</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.plan === 'premium').length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Banidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'banned').length}
              </p>
            </div>
            <Ban className="h-8 w-8 text-red-500" />
          </div>
        </div>
        {syncSummary && (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resumo da Sincronização</p>
                <p className="text-sm text-gray-900">Auth: {syncSummary?.totalAuth ?? 0}</p>
                <p className="text-sm text-gray-900">Inseridos: {syncSummary?.inserted ?? 0}</p>
                <p className="text-sm text-gray-900">Atualizados: {syncSummary?.updated ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todos os Planos</option>
              <option value="gratuito">Gratuito</option>
              <option value="patriota">Patriota</option>
              <option value="cidadao">Cidadão</option>
              <option value="engajado">Engajado</option>
              <option value="lider">Líder</option>
              <option value="elite">Elite</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="banned">Banido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Atividade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estatísticas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary-600 mr-2" />
                      <span className="text-gray-500">Carregando usuários...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-red-600">
                      <p className="mb-2">{error}</p>
                      <button
                        onClick={loadUsers}
                        className="btn-primary"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && !error && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
              {!loading && !error && paginatedUsers.length > 0 && paginatedUsers.map((user) => {
                const planBadge = getPlanBadge(user.plan)
                const statusBadge = getStatusBadge(user.status)
                const PlanIcon = planBadge.icon

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-medium text-sm">
                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name || 'Nome não informado'}</div>
                          <div className="text-sm text-gray-500">@{user.username || 'username'}</div>
                          <div className="text-xs text-gray-500">Role: {user.role || 'user'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-400" />
                        {user.email || 'Email não informado'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                        {user.city && user.state ? `${user.city}, ${user.state}` : 'Localização não informada'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${planBadge.color}`}>
                        <PlanIcon className="h-3 w-3 mr-1" />
                        {planBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Entrou: {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Data não informada'}</div>
                      <div>Último acesso: {user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{user.points || 0} pontos</div>
                      <div>{user.stats?.checkins || 0} check-ins</div>
                      <div>{user.stats?.conversations || 0} conversas IA</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === user.id ? null : user.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        
                        {showActions === user.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <div className="py-1">
                              <button
                                onClick={() => handleViewUser(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Eye className="h-4 w-4 mr-3" />
                                Ver Detalhes
                              </button>
                              <button
                                onClick={() => handleEditUser(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4 mr-3" />
                                Editar
                              </button>
                              {user.status !== 'banned' && (
                                <button
                                  onClick={() => handleBanUser(user)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  <Ban className="h-4 w-4 mr-3" />
                                  Banir
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Excluir
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">Página {page} de {totalPages} • Total {total}</div>
          <div className="flex items-center space-x-2">
            <select
              value={limit}
              onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-gray-300 rounded"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="btn-secondary"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="btn-secondary"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalhes do Usuário</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-xl">
                    {(selectedUser.full_name || selectedUser.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUser.full_name || 'Nome não informado'}</h4>
                  <p className="text-gray-600">@{selectedUser.username || 'username'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedUser.email || 'Email não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  <p className="text-sm text-gray-900">{selectedUser.phone || 'Telefone não informado'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Localização</label>
                  <p className="text-sm text-gray-900">{selectedUser.location || 'Localização não informada'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
                  <p className="text-sm text-gray-900">
                    {selectedUser.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString('pt-BR') : 'Data não informada'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pontos</label>
                  <p className="text-sm text-gray-900">{selectedUser.points || 0}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-ins</label>
                  <p className="text-sm text-gray-900">{selectedUser.checkins || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-secondary"
              >
                Fechar
              </button>
              <button className="btn-primary">
                Editar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Novo Usuário</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!createForm.email || !createForm.password) {
                  alert('Email e senha são obrigatórios')
                  return
                }
                try {
                  setCreating(true)
                  const resp = await AdminService.createAuthUser(createForm)
                  if (resp) {
                    alert('Usuário criado com sucesso!')
                    setShowCreateModal(false)
                    setCreateForm({ email: '', password: '', full_name: '', username: '', role: 'user', plan: 'gratuito', city: '', state: '' })
                    await loadUsers()
                  } else {
                    alert(resp?.error || 'Falha ao criar usuário')
                  }
                } catch (err) {
                  console.error('Erro ao criar usuário:', err)
                  alert('Erro ao criar usuário')
                } finally {
                  setCreating(false)
                }
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Senha *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plano</label>
                  <select
                    value={createForm.plan}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="gratuito">Gratuito</option>
                    <option value="patriota">Patriota</option>
                    <option value="cidadao">Cidadão</option>
                    <option value="engajado">Engajado</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    type="text"
                    value={createForm.city}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    type="text"
                    value={createForm.state}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button onClick={() => setShowCreateModal(false)} type="button" className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={creating} className="btn-primary">
                  {creating ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Usuário</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  <input
                    type="text"
                    value={editingUser.full_name}
                    onChange={(e) => handleEditInputChange('full_name', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nome completo do usuário"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome de Usuário</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => handleEditInputChange('username', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Nome de usuário"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => handleEditInputChange('email', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Email do usuário"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cidade</label>
                  <input
                    type="text"
                    value={editingUser.city}
                    onChange={(e) => handleEditInputChange('city', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Cidade"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <input
                    type="text"
                    value={editingUser.state}
                    onChange={(e) => handleEditInputChange('state', e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Estado"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Plano</label>
                <select
                  value={editingUser.plan}
                  onChange={(e) => handleEditInputChange('plan', e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="gratuito">Gratuito</option>
                  <option value="patriota">Patriota</option>
                  <option value="cidadao">Cidadão</option>
                  <option value="engajado">Engajado (Legado)</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingUser(null)
                  }}
                  className="btn-secondary"
                  disabled={isUpdating}
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex items-center"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
