import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  CreditCard,
  Crown,
  Zap,
  Shield,
  RefreshCw
} from 'lucide-react';
import { apiRequest } from '../../../utils/apiClient';
import { supabase } from '../../../lib/supabase';

const UsageDashboard = () => {
  const [usageStats, setUsageStats] = useState(null);
  const [usageHistory, setUsageHistory] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(7);

  useEffect(() => {
    loadAllData();
  }, [selectedPeriod]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadUsageStats(),
      loadUsageHistory(),
      loadPlanInfo()
    ]);
    setLoading(false);
  };

  const loadUsageStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await apiRequest('user/usage-stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success) {
        setUsageStats(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const loadUsageHistory = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await apiRequest(`user/usage-history?days=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success) {
        setUsageHistory(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    }
  };

  const loadPlanInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const response = await apiRequest('user/plan-info', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success) {
        setPlanInfo(response.data);
      }
    } catch (err) {
      console.error('Erro ao carregar informações do plano:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const getUsageColor = (used, limit) => {
    if (limit === -1) return '#10B981'; // Verde para ilimitado
    if (limit === 0) return '#6B7280'; // Cinza para não disponível
    
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return '#EF4444'; // Vermelho
    if (percentage >= 80) return '#F59E0B'; // Amarelo
    if (percentage >= 60) return '#3B82F6'; // Azul
    return '#10B981'; // Verde
  };

  const formatLimit = (limit) => {
    if (limit === -1) return 'Ilimitado';
    if (limit === 0) return 'N/A';
    return limit.toString();
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      fake_news: Shield,
      ai_creative: Zap,
      political_agents: Crown
    };
    return icons[feature] || AlertCircle;
  };

  const getFeatureName = (feature) => {
    const names = {
      fake_news: 'Análises de Fake News',
      ai_creative: 'IA Criativa',
      political_agents: 'Agentes Políticos'
    };
    return names[feature] || feature;
  };

  const getPlanColor = (plan) => {
    const colors = {
      gratuito: 'gray',
      engajado: 'blue',
      lider: 'purple',
      supremo: 'yellow'
    };
    return colors[plan] || 'gray';
  };

  const getPlanName = (plan) => {
    const names = {
      gratuito: 'Patriota Gratuito',
      engajado: 'Patriota Engajado',
      lider: 'Patriota Líder',
      supremo: 'Patriota Supremo'
    };
    return names[plan] || plan;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pieData = usageStats ? Object.entries(usageStats)
    .filter(([key]) => ['fake_news', 'ai_creative', 'political_agents'].includes(key))
    .map(([key, data]) => ({
      name: getFeatureName(key),
      value: data.used || 0,
      color: getUsageColor(data.used, data.limit)
    })) : [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Uso</h1>
          <p className="text-gray-600">Acompanhe seu uso diário e histórico</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Plan Info Card */}
      {planInfo && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${getPlanColor(planInfo.plan)}-100`}>
                <Crown className={`w-6 h-6 text-${getPlanColor(planInfo.plan)}-600`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getPlanName(planInfo.plan)}
                </h2>
                <p className="text-sm text-gray-600">
                  Membro desde {new Date(planInfo.memberSince).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            
            {planInfo.credits && planInfo.credits.length > 0 && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Créditos Avulsos:</p>
                {planInfo.credits.map((credit, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {getFeatureName(credit.credit_type)}: {credit.remaining_credits}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Usage Stats Cards */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(usageStats)
            .filter(([key]) => ['fake_news', 'ai_creative', 'political_agents'].includes(key))
            .map(([feature, data]) => {
              const IconComponent = getFeatureIcon(feature);
              const color = getUsageColor(data.used, data.limit);
              const percentage = data.limit > 0 ? Math.min((data.used / data.limit) * 100, 100) : 0;

              return (
                <div key={feature} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                      <h3 className="font-medium text-gray-900">
                        {getFeatureName(feature)}
                      </h3>
                    </div>
                    <span className="text-2xl font-bold" style={{ color }}>
                      {data.used}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Limite: {formatLimit(data.limit)}</span>
                      <span>Restante: {data.remaining}</span>
                    </div>
                    
                    {data.limit > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: color
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-xs">
                      {data.canUse ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      <span className={data.canUse ? 'text-green-600' : 'text-red-600'}>
                        {data.canUse ? 'Disponível' : 'Limite atingido'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Distribution */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Uso</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Usage History */}
        {usageHistory && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Uso</h3>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
              </select>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={usageHistory.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('pt-BR', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('pt-BR')}
                />
                <Line 
                  type="monotone" 
                  dataKey="fake_news" 
                  stroke="#3B82F6" 
                  name="Fake News"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="ai_creative" 
                  stroke="#10B981" 
                  name="IA Criativa"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="political_agents" 
                  stroke="#8B5CF6" 
                  name="Agentes Políticos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Reset Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <div>
            <h4 className="font-medium text-blue-900">Renovação de Limites</h4>
            <p className="text-sm text-blue-700">
              Seus limites diários são renovados todos os dias às 00:00 (horário de Brasília).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;