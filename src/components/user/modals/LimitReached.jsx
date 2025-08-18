import React, { useState } from 'react';
import { AlertTriangle, CreditCard, Crown, Zap, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreditPurchase from '../pages/CreditPurchase';

const LimitReached = ({ 
  isOpen, 
  onClose, 
  limitType = 'fake_news', 
  currentPlan = 'gratuito',
  limitsInfo = {} 
}) => {
  const navigate = useNavigate();
  const [showCreditPurchase, setShowCreditPurchase] = useState(false);

  const getLimitInfo = () => {
    const info = {
      fake_news: {
        title: 'Limite de Análises de Fake News Atingido',
        description: 'Você atingiu o limite diário de análises de fake news do seu plano.',
        icon: AlertTriangle,
        color: 'red',
        creditType: 'fake_news_check',
        creditPrice: 'R$ 1,50'
      },
      ai_creative: {
        title: 'Limite de IA Criativa Atingido',
        description: 'Você atingiu o limite diário de mensagens com a IA Criativa.',
        icon: Zap,
        color: 'yellow',
        creditType: 'ai_creative_message',
        creditPrice: 'R$ 0,50'
      },
      political_agents: {
        title: 'Limite de Agentes Políticos Atingido',
        description: 'Você atingiu o limite diário de conversas com agentes políticos.',
        icon: Crown,
        color: 'purple',
        creditType: 'political_agent_conversation',
        creditPrice: 'R$ 1,00'
      }
    };
    return info[limitType] || info.fake_news;
  };

  const getUpgradeOptions = () => {
    const plans = {
      gratuito: [
        {
          id: 'engajado',
          name: 'Patriota Engajado',
          price: 'R$ 29,90/mês',
          benefits: {
            fake_news: '5 análises por dia',
            ai_creative: '20 mensagens por dia',
            political_agents: '3 conversas por dia'
          },
          highlight: true
        },
        {
          id: 'lider',
          name: 'Patriota Líder',
          price: 'R$ 59,90/mês',
          benefits: {
            fake_news: '10 análises por dia',
            ai_creative: '50 mensagens por dia',
            political_agents: 'Ilimitado'
          }
        },
        {
          id: 'supremo',
          name: 'Patriota Supremo',
          price: 'R$ 89,90/mês',
          benefits: {
            fake_news: '20 análises por dia',
            ai_creative: 'Ilimitado',
            political_agents: 'Ilimitado'
          }
        }
      ],
      engajado: [
        {
          id: 'lider',
          name: 'Patriota Líder',
          price: 'R$ 59,90/mês',
          benefits: {
            fake_news: '10 análises por dia',
            ai_creative: '50 mensagens por dia',
            political_agents: 'Ilimitado'
          },
          highlight: true
        },
        {
          id: 'supremo',
          name: 'Patriota Supremo',
          price: 'R$ 89,90/mês',
          benefits: {
            fake_news: '20 análises por dia',
            ai_creative: 'Ilimitado',
            political_agents: 'Ilimitado'
          }
        }
      ],
      lider: [
        {
          id: 'supremo',
          name: 'Patriota Supremo',
          price: 'R$ 89,90/mês',
          benefits: {
            fake_news: '20 análises por dia',
            ai_creative: 'Ilimitado',
            political_agents: 'Ilimitado'
          },
          highlight: true
        }
      ]
    };
    return plans[currentPlan] || [];
  };

  const limitInfo = getLimitInfo();
  const upgradeOptions = getUpgradeOptions();
  const IconComponent = limitInfo.icon;

  const handleUpgrade = (planId) => {
    navigate('/plans');
    onClose();
  };

  const handleBuyCredits = () => {
    setShowCreditPurchase(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${limitInfo.color}-100`}>
                  <IconComponent className={`w-6 h-6 text-${limitInfo.color}-600`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {limitInfo.title}
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {limitInfo.description}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Usage */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Seu Uso Atual:</h3>
              <div className="text-sm text-gray-600">
                <p>Plano: <span className="font-medium capitalize">{currentPlan}</span></p>
                <p>Limite atingido: <span className="font-medium">{limitsInfo.limit || 'N/A'}</span></p>
                <p>Próximo reset: <span className="font-medium">Amanhã às 00:00</span></p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-6">
              {/* Buy Credits Option */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Comprar Créditos Avulsos</h3>
                      <p className="text-sm text-gray-600">
                        Use agora mesmo por apenas {limitInfo.creditPrice} por uso
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleBuyCredits}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    Comprar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Upgrade Options */}
              {upgradeOptions.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Ou faça upgrade do seu plano:</h3>
                  <div className="space-y-3">
                    {upgradeOptions.map((plan) => (
                      <div
                        key={plan.id}
                        className={`border rounded-lg p-4 transition-all hover:shadow-md ${
                          plan.highlight
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{plan.name}</h4>
                              {plan.highlight && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{plan.price}</p>
                            <div className="text-sm text-gray-700">
                              <span className="font-medium">
                                {plan.benefits[limitType]}
                              </span>
                              {limitType === 'fake_news' && ' análises de fake news'}
                              {limitType === 'ai_creative' && ' mensagens IA criativa'}
                              {limitType === 'political_agents' && ' conversas com agentes'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleUpgrade(plan.id)}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              plan.highlight
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            Upgrade
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">💡 Dica:</h4>
              <p className="text-sm text-yellow-700">
                Com um plano pago, você terá acesso a mais recursos, modelos de IA mais avançados 
                e suporte prioritário. Os créditos avulsos são ideais para uso esporádico.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Seus limites serão renovados amanhã às 00:00
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Purchase Modal */}
      <CreditPurchase
        isOpen={showCreditPurchase}
        onClose={() => setShowCreditPurchase(false)}
        creditType={limitInfo.creditType}
      />
    </>
  );
};

export default LimitReached;