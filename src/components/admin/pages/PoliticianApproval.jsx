import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import { 
  User, 
  MapPin, 
  Calendar, 
  Check, 
  X, 
  Eye, 
  Clock,
  Users,
  AlertCircle,
  MessageSquare,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';

const PoliticianApproval = () => {
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedPolitician, setSelectedPolitician] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtros
  const [filters, setFilters] = useState({
    party: '',
    state: '',
    position: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPoliticians();
  }, [selectedTab, currentPage, filters]);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/politicians/stats/approval');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const fetchPoliticians = async () => {
    try {
      setLoading(true);
      const endpoint = selectedTab === 'pending' 
        ? '/admin/politicians/pending'
        : `/admin/politicians/all?status=${selectedTab}`;
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value))
      });
      
      const response = await apiClient.get(`${endpoint}?${params.toString()}`);
      if (response.data.success) {
        setPoliticians(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Erro ao carregar políticos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ party: '', state: '', position: '', search: '' });
    setCurrentPage(1);
  };

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const commonParties = [
    'PL', 'PP', 'REPUBLICANOS', 'UNIÃO', 'PSD', 'MDB', 'PSDB',
    'PODEMOS', 'PDT', 'PSB', 'SOLIDARIEDADE', 'NOVO', 'PATRIOTA',
    'PROS', 'AVANTE', 'PMN', 'CIDADANIA', 'PV', 'REDE', 'PSL'
  ];

  const handleAction = async (politician, action) => {
    setSelectedPolitician(politician);
    setActionType(action);
    setShowModal(true);
    setComment('');
    setReason('');
  };

  const confirmAction = async () => {
    if (!selectedPolitician) return;
    
    if (actionType === 'reject' && !reason.trim()) {
      alert('Motivo da rejeição é obrigatório');
      return;
    }

    try {
      setProcessing(true);
      const endpoint = `/admin/politicians/${selectedPolitician.id}/${actionType}`;
      const payload = actionType === 'approve' 
        ? { comment: comment.trim() }
        : { reason: reason.trim() };

      const response = await apiClient.post(endpoint, payload);
      
      if (response.data.success) {
        alert(`Político ${actionType === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso!`);
        setShowModal(false);
        fetchStats();
        fetchPoliticians();
      }
    } catch (error) {
      console.error(`Erro ao ${actionType === 'approve' ? 'aprovar' : 'rejeitar'} político:`, error);
      alert(`Erro ao ${actionType === 'approve' ? 'aprovar' : 'rejeitar'} político`);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Aprovação de Políticos</h1>
        <p className="text-gray-600">Gerencie os cadastros de políticos pendentes de aprovação</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <Check className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-green-800">Aprovados</p>
              <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <X className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Rejeitados</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'pending', label: 'Pendentes', count: stats.pending },
            { key: 'approved', label: 'Aprovados', count: stats.approved },
            { key: 'rejected', label: 'Rejeitados', count: stats.rejected }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedTab(tab.key);
                setCurrentPage(1);
              }}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  selectedTab === tab.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filtros</span>
            <span className="text-sm text-gray-500">
              ({Object.values(filters).filter(Boolean).length} ativos)
            </span>
          </button>
        </div>
        
        {showFilters && (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nome do político..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Partido */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partido
                </label>
                <select
                  value={filters.party}
                  onChange={(e) => handleFilterChange('party', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Todos os partidos</option>
                  {commonParties.map(party => (
                    <option key={party} value={party}>{party}</option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.state}
                  onChange={(e) => handleFilterChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Todos os estados</option>
                  {brazilianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Posição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo
                </label>
                <select
                  value={filters.position}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Todos os cargos</option>
                  <option value="senador">Senador</option>
                  <option value="deputado">Deputado Federal</option>
                  <option value="deputado estadual">Deputado Estadual</option>
                  <option value="governador">Governador</option>
                  <option value="prefeito">Prefeito</option>
                  <option value="vereador">Vereador</option>
                </select>
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {politicians.length} político(s) encontrado(s)
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" />
                  Limpar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Separação por Cargo */}
      {!loading && politicians.length > 0 && (
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleFilterChange('position', '')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !filters.position
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({politicians.length})
            </button>
            <button
              onClick={() => handleFilterChange('position', 'senador')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filters.position === 'senador'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Senadores ({politicians.filter(p => p.position?.toLowerCase().includes('senador')).length})
            </button>
            <button
              onClick={() => handleFilterChange('position', 'deputado')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                filters.position === 'deputado'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Deputados ({politicians.filter(p => p.position?.toLowerCase().includes('deputado')).length})
            </button>
          </div>
        </div>
      )}

      {/* Lista de Políticos */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Carregando políticos...</span>
        </div>
      ) : politicians.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum político encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedTab === 'pending' 
              ? 'Não há políticos pendentes de aprovação no momento.'
              : selectedTab === 'approved'
              ? 'Não há políticos aprovados no momento.'
              : 'Não há políticos rejeitados no momento.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Político
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo/Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Partido
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
                {politicians.map((politician) => (
                  <tr key={politician.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {politician.photo_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover mr-3"
                            src={politician.photo_url}
                            alt={politician.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {politician.name}
                          </div>
                          {politician.short_bio && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {politician.short_bio.substring(0, 50)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{politician.position}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {politician.state}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{politician.party}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        getStatusColor(politician.status)
                      }`}>
                        {getStatusText(politician.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(politician.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {politician.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(politician, 'approve')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleAction(politician, 'reject')}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Rejeitar
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPolitician(politician);
                            setActionType('view');
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Página <span className="font-medium">{currentPage}</span> de{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedPolitician && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'view' ? 'Detalhes do Político' : 
                 actionType === 'approve' ? 'Aprovar Político' : 'Rejeitar Político'}
              </h3>
              
              {/* Detalhes do político */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-3">
                  {selectedPolitician.photo_url ? (
                    <img
                      className="h-16 w-16 rounded-full object-cover mr-4"
                      src={selectedPolitician.photo_url}
                      alt={selectedPolitician.name}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center mr-4">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold">{selectedPolitician.name}</h4>
                    <p className="text-gray-600">{selectedPolitician.position} - {selectedPolitician.state}</p>
                    <p className="text-gray-600">Partido: {selectedPolitician.party}</p>
                  </div>
                </div>
                
                {selectedPolitician.short_bio && (
                  <div className="mb-3">
                    <h5 className="font-medium text-gray-900 mb-1">Biografia:</h5>
                    <p className="text-gray-700 text-sm">{selectedPolitician.short_bio}</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  <p>Cadastrado em: {formatDate(selectedPolitician.created_at)}</p>
                  <p>Status: {getStatusText(selectedPolitician.approval_status)}</p>
                </div>
              </div>

              {/* Campos de ação */}
              {actionType === 'approve' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentário (opcional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Adicione um comentário sobre a aprovação..."
                  />
                </div>
              )}

              {actionType === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo da rejeição *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Explique o motivo da rejeição..."
                    required
                  />
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={processing}
                >
                  {actionType === 'view' ? 'Fechar' : 'Cancelar'}
                </button>
                
                {actionType !== 'view' && (
                  <button
                    onClick={confirmAction}
                    disabled={processing || (actionType === 'reject' && !reason.trim())}
                    className={`px-4 py-2 rounded-md text-white font-medium disabled:opacity-50 ${
                      actionType === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {processing ? 'Processando...' : 
                     actionType === 'approve' ? 'Aprovar' : 'Rejeitar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoliticianApproval;