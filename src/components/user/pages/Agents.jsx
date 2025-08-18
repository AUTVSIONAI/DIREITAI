import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api';
import { 
  Bot, 
  MessageCircle, 
  Search, 
  Filter, 
  MapPin, 
  Award,
  Star,
  Loader
} from 'lucide-react';

const Agents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');

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

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/agents');
      if (response.data.success) {
        setAgents(response.data.data || []);
      } else {
        setAgents(response.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.politicians?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !selectedState || agent.politicians?.state === selectedState;
    const matchesParty = !selectedParty || agent.politicians?.party === selectedParty;
    return matchesSearch && matchesState && matchesParty && agent.is_active;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Carregando agentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat com Agentes IA</h1>
        <p className="text-gray-600">
          Converse com os agentes de IA dos políticos e tire suas dúvidas sobre propostas e posicionamentos.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por político ou agente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro por Estado */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os estados</option>
              {brazilianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Partido */}
          <div>
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os partidos</option>
              {commonParties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Agentes */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agente encontrado</h3>
          <p className="text-gray-600">
            {searchTerm || selectedState || selectedParty 
              ? 'Tente ajustar os filtros de busca.' 
              : 'Não há agentes ativos no momento.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header do Card */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {agent.politicians?.name || 'Político não encontrado'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Award className="w-4 h-4" />
                      <span>{agent.politicians?.position}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{agent.politicians?.state} • {agent.politicians?.party}</span>
                    </div>
                  </div>
                </div>

                {/* Descrição do Agente */}
                {agent.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {agent.description}
                  </p>
                )}

                {/* Avaliação (se disponível) */}
                {agent.politicians?.average_rating && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(agent.politicians.average_rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {agent.politicians.average_rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Botão de Chat */}
                <Link
                  to={`/agente/${agent.politician_id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Iniciar Conversa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">Como funciona?</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Escolha um político e converse com seu agente de IA</li>
          <li>• Faça perguntas sobre propostas, posicionamentos e histórico</li>
          <li>• Os agentes são treinados com informações específicas de cada político</li>
          <li>• Todas as conversas são registradas para melhorar a experiência</li>
        </ul>
      </div>
    </div>
  );
};

export default Agents;