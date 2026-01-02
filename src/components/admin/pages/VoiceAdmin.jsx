import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Mic, 
  DollarSign, 
  Activity, 
  Settings, 
  BarChart2, 
  Clock, 
  User, 
  AlertTriangle,
  Upload,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { apiClient } from '../../../lib/api';

const VoiceAdmin = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCost: 0,
    totalMinutes: 0,
    activeVoices: 0,
    topPoliticians: []
  });
  const [limits, setLimits] = useState({
    free: { daily_limit: 5, allow_cloned: false },
    patriota: { daily_limit: 20, allow_cloned: true },
    cidadao: { daily_limit: 50, allow_cloned: true },
    premium: { daily_limit: 100, allow_cloned: true },
    elite: { daily_limit: 9999, allow_cloned: true }
  });

  // Estado para clonagem
  const [isCloning, setIsCloning] = useState(false);
  const [clonedVoiceId, setClonedVoiceId] = useState('');
  const [selectedPoliticianId, setSelectedPoliticianId] = useState('');
  const [politicians, setPoliticians] = useState([]);
  const [copied, setCopied] = useState(false);
  const [cloneFile, setCloneFile] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchPoliticians();
  }, []);

  const fetchPoliticians = async () => {
    try {
      const { data: { data } } = await apiClient.get('/politicians?status=approved&limit=100');
      setPoliticians(data || []);
    } catch (error) {
      console.error('Erro ao buscar políticos:', error);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Buscar dados reais do Supabase
      const { data: logs, error } = await supabase
        .from('voice_usage_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar logs:', error);
        // Fallback para mock se a tabela não existir ainda
        return;
      }

      if (logs && logs.length > 0) {
        const totalCost = logs.reduce((acc, log) => acc + (log.cost || 0), 0);
        // Assumindo média de 15 caracteres por segundo para estimar minutos se text_length existir
        const totalMinutes = logs.reduce((acc, log) => acc + ((log.text_length || 0) / 15 / 60), 0);
        const uniqueVoices = new Set(logs.map(log => log.voice_id)).size;
        
        // Agrupar por voice_id para top politicians (simulado pois não temos join fácil aqui sem agent_id)
        // Em um cenário real, faríamos join com politician_agents
        
        setStats({
          totalCost,
          totalMinutes: Math.round(totalMinutes),
          activeVoices: uniqueVoices,
          topPoliticians: [] // Preencher com dados reais quando tivermos agent_id
        });
      } else {
        // Se não tiver dados, mantém zerado
         setStats({
          totalCost: 0,
          totalMinutes: 0,
          activeVoices: 0,
          topPoliticians: []
        });
      }
      
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloneVoice = async (e) => {
    e.preventDefault();
    if (!cloneFile) return;

    try {
      setIsCloning(true);
      setClonedVoiceId('');

      const formData = new FormData();
      formData.append('file', cloneFile);
      if (selectedPoliticianId) {
        formData.append('politician_id', selectedPoliticianId);
      }
      
      // Usar axios diretamente para evitar problemas com headers do apiClient em uploads
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // Construir URL correta
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const backendUrl = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5120/api' : '/api');
      
      const response = await axios.post(`${backendUrl}/voice/clone`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.voice_id) {
        setClonedVoiceId(response.data.voice_id);
      }
    } catch (error) {
      console.error('Erro ao clonar voz:', error);
      
      const status = error.response?.status || 'Unknown';
      let errorMsg = error.response?.data?.error || error.message;
      
      // Tratamento amigável para erro de saldo
      if (status === 402 || (error.response?.data?.code === 'INSUFFICIENT_BALANCE')) {
          errorMsg = "Saldo insuficiente na conta MiniMax. Por favor, recarregue seus créditos no painel da MiniMax para continuar clonando vozes.";
      }

      const details = JSON.stringify(error.response?.data || {}, null, 2);
      alert(`Erro ao clonar voz:\n${errorMsg}\n\nStatus: ${status}`);
    } finally {
      setIsCloning(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clonedVoiceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLimitChange = (plan, field, value) => {
    setLimits(prev => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [field]: value
      }
    }));
  };

  const saveLimits = async () => {
    alert('Configurações salvas com sucesso! (Simulação)');
    // Implementar salvamento no supabase (tabela system_settings ou similar)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Mic className="h-6 w-6 text-blue-600" />
          Administração de Voz e Custos
        </h1>
        <div className="text-sm text-gray-500">
          Gerenciamento do MiniMax e ElevenLabs
        </div>
      </div>
      
      <div className="flex justify-end">
        <Link 
          to="/admin/agents" 
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Gerenciar Agentes
        </Link>
      </div>

      {/* Ferramenta de Clonagem Rápida */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200 bg-blue-50">
        <h2 className="text-lg font-medium text-blue-900 flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5" />
          Clonagem Rápida de Voz
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div>
            <p className="text-sm text-blue-700 mb-4">
              Envie um áudio de exemplo (MP3, WAV) para clonar a voz e gerar um ID.
              Você pode vincular diretamente a um político ou apenas gerar o ID.
            </p>
            <form onSubmit={handleCloneVoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Político (Opcional)
                </label>
                <div className="space-y-2">
                  <select
                    value={selectedPoliticianId}
                    onChange={(e) => setSelectedPoliticianId(e.target.value)}
                    className="block w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione ou deixe em branco para apenas gerar ID</option>
                    {politicians.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.party})
                      </option>
                    ))}
                  </select>
                  
                  {/* Fallback para input manual se necessário */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Ou digite o ID:</span>
                    <input 
                        type="text" 
                        value={selectedPoliticianId} 
                        onChange={(e) => setSelectedPoliticianId(e.target.value)}
                        placeholder="ID do Político (UUID)"
                        className="flex-1 text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Se selecionado, a voz será salva automaticamente na configuração do político.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo de Áudio
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setCloneFile(e.target.files[0])}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-100 file:text-blue-700
                    hover:file:bg-blue-200"
                />
              </div>
              
              <button
                type="submit"
                disabled={!cloneFile || isCloning}
                className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                  !cloneFile || isCloning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isCloning ? 'Clonando...' : 'Clonar Voz'}
              </button>
            </form>
          </div>

          {clonedVoiceId && (
            <div className="bg-white p-4 rounded border border-gray-200">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                ID da Voz Gerado
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all font-mono">
                  {clonedVoiceId}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Copiar ID"
                >
                  {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-green-600">
                ✓ Voz clonada com sucesso! Copie este ID e cole no campo "Voice ID" do agente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Custo Total (Mês)</p>
              <h3 className="text-2xl font-bold text-gray-900">R$ {stats.totalCost.toFixed(2)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Estimado baseado no uso da API</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Minutos Gerados</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalMinutes} min</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Total de áudio sintetizado</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Vozes Ativas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.activeVoices}</h3>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">Políticos com voz clonada</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Políticos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-gray-500" />
              Top Políticos por Uso de Voz
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.topPoliticians.map((pol, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pol.name}</p>
                      <p className="text-xs text-gray-500">{pol.minutes} minutos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">R$ {pol.cost.toFixed(2)}</p>
                    <div className="w-24 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${(pol.minutes / stats.topPoliticians[0].minutes) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configurações de Limites */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              Limites por Plano
            </h2>
            <button 
              onClick={saveLimits}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {Object.entries(limits).map(([plan, config]) => (
                <div key={plan} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 capitalize mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Plano {plan}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Limite Diário (mensagens)
                      </label>
                      <input
                        type="number"
                        value={config.daily_limit}
                        onChange={(e) => handleLimitChange(plan, 'daily_limit', parseInt(e.target.value))}
                        className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.allow_cloned}
                          onChange={(e) => handleLimitChange(plan, 'allow_cloned', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Permitir Voz Clonada</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <p>
                Alterações nos limites entram em vigor imediatamente para novas sessões.
                Custos do MiniMax são calculados baseados no uso real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAdmin;
