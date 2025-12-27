import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SpeakerWaveIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { NotificationsService } from '../../../services/notifications';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'info',
    priority: 'normal',
    targetAudience: 'all',
    startDate: '',
    expiresAt: '',
    isActive: true
  });
  const [filters, setFilters] = useState({ status: 'all', startDate: '', endDate: '' });
  const [statsById, setStatsById] = useState({});
  const [loadingStatsId, setLoadingStatsId] = useState(null);

  // Helpers de mapeamento
  const mapPriorityToUI = (p) => {
    if (!p) return 'normal';
    switch (p) {
      case 'high':
      case 'urgent':
        return 'high';
      case 'low':
        return 'low';
      default:
        return 'normal';
    }
  };

  const mapPriorityToAdmin = (p) => {
    switch (p) {
      case 'high':
        return 'high';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  };

  const toUI = (a) => ({
    id: a.id,
    title: a.title,
    content: a.message || a.content || '',
    type: a.type || 'info',
    priority: mapPriorityToUI(a.priority),
    targetAudience: a.target_audience?.type || a.targetAudience || 'all',
    isActive: Boolean(a.is_active ?? a.active ?? true),
    isArchived: Boolean(a.is_archived ?? false),
    createdAt: a.created_at ? new Date(a.created_at) : new Date(),
    startDate: a.start_date ? new Date(a.start_date) : null,
    expiresAt: a.end_date ? new Date(a.end_date) : null,
    author: a.created_by?.username || a.author || 'Admin'
  });

  const toAdminPayload = (fd) => ({
    title: fd.title,
    message: fd.content,
    type: fd.type,
    priority: mapPriorityToAdmin(fd.priority),
    target_audience: { type: fd.targetAudience || 'all' },
    start_date: fd.startDate ? new Date(fd.startDate).toISOString() : undefined,
    end_date: fd.expiresAt ? new Date(fd.expiresAt).toISOString() : undefined,
    is_active: fd.isActive
  });

  // Função para carregar anúncios da API
  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      let params = {};
      
      if (filters.status === 'archived') {
        params.archived = true;
      } else if (filters.status === 'active') {
        params.active = true;
      } else if (filters.status === 'inactive') {
        params.active = false;
      }
      // 'all' sends no params, which defaults to all non-archived
      
      const data = await NotificationsService.listAdminAnnouncements(params);
      setAnnouncements((data || []).map(toUI));
    } catch (err) {
      console.error('Erro ao carregar anúncios:', err);
      setError('Erro ao carregar anúncios. Tente novamente.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [filters.status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        const updated = await NotificationsService.updateAdminAnnouncement(
          editingAnnouncement.id,
          toAdminPayload(formData)
        );
        setAnnouncements(prev => prev.map(ann =>
          ann.id === editingAnnouncement.id ? toUI(updated) : ann
        ));
      } else {
        const created = await NotificationsService.createAdminAnnouncement(
          toAdminPayload(formData)
        );
        setAnnouncements(prev => [toUI(created), ...prev]);
      }
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar anúncio:', err);
      setError(err.response?.data?.error || err.message || 'Não foi possível salvar o anúncio. Verifique os dados e tente novamente.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'info',
      priority: 'normal',
      targetAudience: 'all',
      expiresAt: '',
      isActive: true
    });
    setEditingAnnouncement(null);
    setShowModal(false);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      startDate: announcement.startDate ? announcement.startDate.toISOString().split('T')[0] : '',
      expiresAt: announcement.expiresAt ? announcement.expiresAt.toISOString().split('T')[0] : '',
      isActive: announcement.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este anúncio?')) return;
    try {
      await NotificationsService.deleteAdminAnnouncement(id);
      setAnnouncements(prev => prev.filter(ann => ann.id !== id));
    } catch (err) {
      console.error('Erro ao excluir anúncio:', err);
      setError('Falha ao excluir anúncio. Tente novamente.');
    }
  };

  const handleArchive = async (announcement) => {
    try {
      if (announcement.isArchived) {
        await NotificationsService.unarchiveAdminAnnouncement(announcement.id);
      } else {
        await NotificationsService.archiveAdminAnnouncement(announcement.id);
      }
      // Reload or update local state
      // Simplest is to remove from list if current filter hides it, or update isArchived
      if (filters.status === 'archived' && announcement.isArchived) {
        // Was archived, now unarchived -> remove from 'archived' view
        setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
      } else if (filters.status !== 'archived' && !announcement.isArchived) {
        // Was not archived, now archived -> remove from 'all/active/inactive' view
        setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
      } else {
        // Just toggle state
        setAnnouncements(prev => prev.map(a => 
          a.id === announcement.id 
            ? { ...a, isArchived: !a.isArchived } 
            : a
        ));
      }
    } catch (err) {
      console.error('Erro ao arquivar/desarquivar anúncio:', err);
      setError('Falha ao alterar status de arquivamento.');
    }
  };

  const toggleActive = async (id) => {
    try {
      const current = announcements.find(a => a.id === id);
      const res = await NotificationsService.toggleAdminAnnouncementActive(
        id,
        { active: !current?.isActive }
      );
      const newActive = typeof res.active === 'boolean' ? res.active : !current?.isActive;
      setAnnouncements(prev => prev.map(ann =>
        ann.id === id ? { ...ann, isActive: newActive } : ann
      ));
    } catch (err) {
      console.error('Erro ao alternar status do anúncio:', err);
      setError('Não foi possível alterar o status. Tente novamente.');
    }
  };

  const loadStats = async (id) => {
    try {
      setLoadingStatsId(id);
      const stats = await NotificationsService.getAnnouncementBannerStats(id);
      setStatsById(prev => ({ ...prev, [id]: stats }));
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
      setError('Falha ao carregar estatísticas do anúncio.');
    } finally {
      setLoadingStatsId(null);
    }
  };

  const filteredAnnouncements = announcements.filter((a) => {
    let ok = true;
    if (filters.startDate) {
      const sd = new Date(filters.startDate);
      ok = ok && a.createdAt >= sd;
    }
    if (filters.endDate) {
      const ed = new Date(filters.endDate);
      ok = ok && a.createdAt <= new Date(new Date(ed).setHours(23,59,59,999));
    }
    return ok;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Gerenciar Anúncios
            </h3>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Anúncio
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="archived">Arquivados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Início (criação)</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fim (criação)</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => loadAnnouncements()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Lista de Anúncios */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">Carregando anúncios...</div>
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="text-center py-8">
                <SpeakerWaveIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum anúncio</h3>
                <p className="mt-1 text-sm text-gray-500">Comece criando um novo anúncio.</p>
              </div>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`border rounded-lg p-4 ${getTypeColor(announcement.type)} ${
                    !announcement.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(announcement.type)}
                        <h4 className="text-lg font-medium text-gray-900">
                          {announcement.title}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(announcement.priority)}`}>
                          {announcement.priority === 'high' ? 'Alta' : 
                           announcement.priority === 'normal' ? 'Normal' : 'Baixa'}
                        </span>
                        {!announcement.isActive && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inativo
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3">
                        {announcement.content}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Por: {announcement.author}</span>
                        <span>Criado: {announcement.createdAt.toLocaleDateString('pt-BR')}</span>
                        {announcement.expiresAt && (
                          <span>Expira: {announcement.expiresAt.toLocaleDateString('pt-BR')}</span>
                        )}
                        <span className="capitalize">
                          Público: {announcement.targetAudience === 'all' ? 'Todos' : 
                                   announcement.targetAudience === 'users' ? 'Usuários' : 'Admins'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <button
                          onClick={() => {
                            if (!statsById[announcement.id]) {
                              loadStats(announcement.id);
                            }
                            setStatsById(prev => ({ ...prev, __expanded: { ...(prev.__expanded || {}), [announcement.id]: !(prev.__expanded?.[announcement.id]) } }));
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Ver estatísticas
                        </button>
                      </div>
                      {statsById.__expanded?.[announcement.id] && (
                        <div className="mt-3 text-sm bg-white/60 border rounded p-3">
                          {loadingStatsId === announcement.id ? (
                            <div className="text-gray-500">Carregando estatísticas...</div>
                          ) : (
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div><span className="text-gray-500">Views:</span> {statsById[announcement.id]?.views ?? '-'}</div>
                              <div><span className="text-gray-500">Cliques:</span> {statsById[announcement.id]?.clicks ?? '-'}</div>
                              <div><span className="text-gray-500">Dispensas:</span> {statsById[announcement.id]?.dismissals ?? '-'}</div>
                              <div><span className="text-gray-500">CTR:</span> {statsById[announcement.id]?.clickRate != null ? `${(statsById[announcement.id]?.clickRate * 100).toFixed(2)}%` : '-'}</div>
                              <div><span className="text-gray-500">Taxa de dispensa:</span> {statsById[announcement.id]?.dismissalRate != null ? `${(statsById[announcement.id]?.dismissalRate * 100).toFixed(2)}%` : '-'}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
      <button
        onClick={() => handleArchive(announcement)}
        className={`p-2 rounded-md ${
          announcement.isArchived 
            ? 'text-purple-600 hover:bg-purple-100' 
            : 'text-gray-400 hover:bg-gray-100'
        }`}
        title={announcement.isArchived ? 'Desarquivar' : 'Arquivar'}
      >
        {announcement.isArchived ? <ArrowPathIcon className="h-4 w-4" /> : <ArchiveBoxIcon className="h-4 w-4" />}
      </button>

      <button
        onClick={() => toggleActive(announcement.id)}
                        className={`p-2 rounded-md ${
                          announcement.isActive 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={announcement.isActive ? 'Desativar' : 'Ativar'}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-md"
                        title="Editar"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-md"
                        title="Excluir"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingAnnouncement ? 'Editar Anúncio' : 'Novo Anúncio'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conteúdo
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    required
                    rows={4}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="info">Informação</option>
                      <option value="success">Sucesso</option>
                      <option value="warning">Aviso</option>
                      <option value="error">Erro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Público Alvo
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="users">Usuários</option>
                      <option value="admins">Administradores</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Expiração
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Anúncio ativo
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingAnnouncement ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;