import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import { agentGenerationService } from '../../../services/agentGeneration';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Bot, 
  MessageCircle, 
  Search, 
  Filter, 
  MapPin, 
  Award,
  Star,
  Loader,
  Settings,
  Sliders,
  FileText,
  BarChart3
} from 'lucide-react';

const Agents = ({ onlyMyAgent = false }) => {
  const { userProfile } = useAuth();
  const role = String(userProfile?.role || '').toLowerCase();
  const isPolitician = role === 'politician';
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [myPoliticianId, setMyPoliticianId] = useState('');
  const [myAgent, setMyAgent] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [editingPersonality, setEditingPersonality] = useState(false);
  const [personalityText, setPersonalityText] = useState('');

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

  useEffect(() => {
    const loadPoliticianId = async () => {
      if (isPolitician) {
        if (userProfile?.politician_id) {
          setMyPoliticianId(String(userProfile.politician_id));
        } else if (userProfile?.id) {
           try {
             const { data } = await supabase
               .from('politicians')
               .select('id')
               .eq('email', userProfile.email)
               .maybeSingle()
             
             if (data) {
               setMyPoliticianId(String(data.id))
             } else {
               const persisted = localStorage.getItem('my_politician_id') || '';
               if (persisted) setMyPoliticianId(persisted);
             }
           } catch (e) {
             console.error('Erro ao buscar ID do político em Agents:', e)
             const persisted = localStorage.getItem('my_politician_id') || '';
             if (persisted) setMyPoliticianId(persisted);
           }
        } else {
          const persisted = localStorage.getItem('my_politician_id') || '';
          if (persisted) setMyPoliticianId(persisted);
        }
      }
    }
    loadPoliticianId()
  }, [isPolitician, userProfile]);

  useEffect(() => {
    if (isPolitician && myPoliticianId && agents.length > 0) {
      const mine = agents.find(a => String(a.politician_id) === String(myPoliticianId));
      if (mine) {
        setMyAgent(mine);
        setPromptText(mine.trained_prompt || '');
        const cfg = typeof mine.personality_config === 'string' ? mine.personality_config : JSON.stringify(mine.personality_config || {}, null, 2);
        setPersonalityText(cfg);
      }
    }
  }, [agents, myPoliticianId, isPolitician]);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      let list = [];
      try {
        const response = await apiClient.get('/agents?limit=1000&page=1');
        list = response.data?.data || response.data || [];
        console.log('Agentes carregados (user) via paginação:', Array.isArray(list) ? list.length : 0);
      } catch (err) {
        const status = err?.response?.status;
        console.warn('Falha ao buscar com paginação, tentando fallback /agents. Status:', status);
        const response = await apiClient.get('/agents');
        list = response.data?.data || response.data || [];
        console.log('Agentes carregados (user) via fallback:', Array.isArray(list) ? list.length : 0);
      }
      setAgents(list);
      if (isPolitician && myPoliticianId) {
        const mine = Array.isArray(list) ? list.find(a => String(a.politician_id) === String(myPoliticianId)) : null;
        if (mine) {
          setMyAgent(mine);
          setPromptText(mine.trained_prompt || '');
          const cfg = typeof mine.personality_config === 'string' ? mine.personality_config : JSON.stringify(mine.personality_config || {}, null, 2);
          setPersonalityText(cfg);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const verifyMyAgent = async () => {
    if (!myPoliticianId) return;
    try {
      const resp = await apiClient.get(`/agents?politician_id=${encodeURIComponent(myPoliticianId)}`);
      const data = resp.data?.data || resp.data || [];
      const found = Array.isArray(data) && data.length > 0 ? data[0] : null;
      setMyAgent(found || null);
      if (found) {
        setPromptText(found.trained_prompt || '');
        const cfg = typeof found.personality_config === 'string' ? found.personality_config : JSON.stringify(found.personality_config || {}, null, 2);
        setPersonalityText(cfg);
      }
      localStorage.setItem('my_politician_id', myPoliticianId);
    } catch (e) {
      setMyAgent(null);
    }
  };

  const createMyAgent = async () => {
    if (!myPoliticianId) return;
    try {
      const pResp = await apiClient.get(`/politicians/${encodeURIComponent(myPoliticianId)}`);
      const pData = pResp?.data?.data || pResp?.data || pResp;
      const politician = pData?.data ? pData.data : pData;
      if (!politician || !politician.id) return;
      const result = await agentGenerationService.createAgentForPolitician({
        id: politician.id,
        name: politician.name,
        position: politician.position,
        party: politician.party,
        state: politician.state,
        city: politician.city
      });
      if (result?.success) {
        await verifyMyAgent();
      }
    } catch {}
  };

  const savePrompt = async () => {
    if (!myAgent) return;
    try {
      const pol = myAgent.politicians || {
        id: myAgent.politician_id,
        name: myAgent.name,
        position: myAgent.politicians?.position,
        party: myAgent.politicians?.party,
        state: myAgent.politicians?.state,
        city: myAgent.politicians?.city
      };
      const ok = await agentGenerationService.updateAgentPrompt(Number(myAgent.id), pol);
      if (ok) {
        setEditingPrompt(false);
        await verifyMyAgent();
      }
    } catch {}
  };

  const savePersonality = async () => {
    if (!myAgent) return;
    try {
      let cfg = {};
      try {
        cfg = JSON.parse(personalityText);
      } catch {
        cfg = personalityText;
      }
      await apiClient.put(`/agents/${myAgent.id}`, { personality_config: cfg });
      setEditingPersonality(false);
      await verifyMyAgent();
    } catch {}
  };

  const filteredAgents = agents.filter(agent => {
    const hasPoliticianName = typeof agent.politicians?.name === 'string'
    const hasAgentName = typeof agent.name === 'string'
    const matchesSearch = !searchTerm || (
      (hasPoliticianName && agent.politicians.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (hasAgentName && agent.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    const matchesState = !selectedState || agent.politicians?.state === selectedState;
    const matchesParty = !selectedParty || agent.politicians?.party === selectedParty;
    // Mostrar agentes mesmo que a flag is_active não venha explícita; só exclui se for false
    const isVisible = agent.is_active !== false;
    return matchesSearch && matchesState && matchesParty && isVisible;
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
      {isPolitician && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {!onlyMyAgent && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Área do Político</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={myPoliticianId}
                onChange={(e) => setMyPoliticianId(e.target.value)}
                placeholder="ID do político"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={verifyMyAgent}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                Verificar meu agente
              </button>
              <button
                onClick={createMyAgent}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm"
              >
                Criar meu agente
              </button>
            </div>
          </div>
          )}

          {myAgent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <div className="font-medium text-gray-900">{myAgent.politicians?.name || 'Meu Agente'}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/agente/${myAgent.politician_id}`} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Conversar
                  </Link>
                  <button onClick={() => setEditingPrompt(true)} className="px-3 py-2 bg-gray-800 text-white rounded-lg text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Editar prompt
                  </button>
                  <button onClick={() => setEditingPersonality(true)} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    Personalização
                  </button>
                  <Link to="/dashboard/admin-role" className="px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Minhas avaliações
                  </Link>
                  <Link to="/dashboard/admin-role" className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Métricas de conversa
                  </Link>
                </div>
              </div>
              {editingPrompt && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-700" />
                    <div className="font-medium">Prompt do agente</div>
                  </div>
                  <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} className="w-full h-32 border border-gray-300 rounded-lg p-2 text-sm" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={savePrompt} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Salvar</button>
                    <button onClick={() => setEditingPrompt(false)} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              )}
              {editingPersonality && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-gray-700" />
                    <div className="font-medium">Configuração de personalidade</div>
                  </div>
                  <textarea value={personalityText} onChange={(e) => setPersonalityText(e.target.value)} className="w-full h-32 border border-gray-300 rounded-lg p-2 text-sm" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={savePersonality} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm">Salvar</button>
                    <button onClick={() => setEditingPersonality(false)} className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm">Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4 text-gray-700">Informe seu ID de político e verifique ou crie seu agente.</div>
          )}
        </div>
      )}
      {/* Header - Apenas mostra se não for exclusivo do político */}
      {!onlyMyAgent && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Político</h1>
          <p className="text-gray-600">
            Converse com os agentes de IA dos políticos e tire suas dúvidas sobre propostas e posicionamentos.
          </p>
        </div>
      )}

      {/* Filtros - Apenas se não for exclusivo */}
      {!onlyMyAgent && (
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
      )}

      {/* Lista de Agentes - Apenas se não for exclusivo */}
      {!onlyMyAgent && (
        <>
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
        </>
      )}

      {/* Informações Adicionais - Apenas se não for exclusivo */}
      {!onlyMyAgent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Como funciona?</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Escolha um político e converse com seu agente de IA</li>
            <li>• Faça perguntas sobre propostas, posicionamentos e histórico</li>
            <li>• Os agentes são treinados com informações específicas de cada político</li>
            <li>• Todas as conversas são registradas para melhorar a experiência</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Agents;
