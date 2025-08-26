import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, X, TrendingUp } from 'lucide-react';
import { apiRequest } from '../../../utils/apiClient';
import { supabase } from '../../../lib/supabase';

const UsageNotification = ({ userId, onClose }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUsage();
    }
  }, [userId]);

  const loadUsage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      const response = await apiRequest('user/usage-stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.success && response.data) {
        setUsage(response.data);
        
        // Mostrar notificação se estiver próximo do limite
        const shouldShow = checkIfShouldShow(response.data);
        setShow(shouldShow);
      }
    } catch (err) {
      console.error('Erro ao carregar uso:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfShouldShow = (usageData) => {
    if (!usageData) return false;
    
    // Mostrar se qualquer funcionalidade estiver acima de 80% do limite
    const features = ['fake_news', 'ai_creative', 'political_agents'];
    
    return features.some(feature => {
      const used = usageData[feature]?.used || 0;
      const limit = usageData[feature]?.limit || 0;
      
      if (limit === -1) return false; // Ilimitado
      if (limit === 0) return false; // Sem limite definido
      
      const percentage = (used / limit) * 100;
      return percentage >= 80;
    });
  };

  const getUsageColor = (used, limit) => {
    if (limit === -1) return 'green'; // Ilimitado
    if (limit === 0) return 'gray'; // Sem limite
    
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'red';
    if (percentage >= 80) return 'yellow';
    if (percentage >= 60) return 'blue';
    return 'green';
  };

  const getUsageIcon = (used, limit) => {
    if (limit === -1) return CheckCircle;
    if (limit === 0) return Clock;
    
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return AlertCircle;
    if (percentage >= 80) return Clock;
    return TrendingUp;
  };

  const formatLimit = (limit) => {
    if (limit === -1) return 'Ilimitado';
    if (limit === 0) return 'Não disponível';
    return limit.toString();
  };

  const getFeatureName = (feature) => {
    const names = {
      fake_news: 'Análises de Fake News',
      ai_creative: 'IA Criativa',
      political_agents: 'Agentes Políticos'
    };
    return names[feature] || feature;
  };

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  if (loading || !show || !usage) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Uso Diário</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Usage Stats */}
        <div className="space-y-3">
          {Object.entries(usage).map(([feature, data]) => {
            if (!data || typeof data !== 'object') return null;
            
            const { used = 0, limit = 0 } = data;
            const color = getUsageColor(used, limit);
            const IconComponent = getUsageIcon(used, limit);
            const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

            return (
              <div key={feature} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className={`w-4 h-4 text-${color}-600`} />
                    <span className="text-sm font-medium text-gray-700">
                      {getFeatureName(feature)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {used}/{formatLimit(limit)}
                  </span>
                </div>
                
                {limit > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-${color}-500 transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                )}
                
                {limit > 0 && percentage >= 80 && (
                  <p className="text-xs text-gray-600">
                    {percentage >= 90 
                      ? '⚠️ Limite quase atingido!' 
                      : '⏰ Próximo do limite'
                    }
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Limites renovam diariamente às 00:00
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsageNotification;