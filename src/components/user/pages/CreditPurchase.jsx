import React, { useState, useEffect } from 'react';
import { CreditCard, Zap, Star, Crown, Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../lib/api';

const CreditPurchase = ({ isOpen, onClose, creditType = 'fake_news_check' }) => {
  const { userProfile } = useAuth();
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [userCredits, setUserCredits] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
      fetchUserCredits();
    }
  }, [isOpen, creditType]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/credits/packages');
      if (response.data.success) {
        const typePackages = response.data.packages.find(p => p.type === creditType);
        setPackages(typePackages?.packages || []);
      }
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      setError('Erro ao carregar pacotes de créditos');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await apiClient.get('/api/credits/balance');
      if (response.data.success) {
        setUserCredits(response.data.credits);
      }
    } catch (error) {
      console.error('Erro ao buscar créditos:', error);
    }
  };

  const handlePurchase = async (packageIndex) => {
    try {
      setPurchasing(true);
      setError('');
      setSuccess('');

      const response = await apiClient.post('/api/credits/purchase', {
        creditType,
        packageIndex,
        paymentMethod: 'pix'
      });

      if (response.data.success) {
        setSuccess(`${response.data.purchase.credits} créditos adicionados com sucesso!`);
        fetchUserCredits();
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(response.data.message || 'Erro ao processar compra');
      }
    } catch (error) {
      console.error('Erro na compra:', error);
      setError('Erro ao processar compra. Tente novamente.');
    } finally {
      setPurchasing(false);
    }
  };

  const getCreditTypeName = () => {
    const names = {
      fake_news_check: 'Análises de Fake News',
      ai_creative_message: 'Mensagens IA Criativa',
      political_agent_conversation: 'Conversas com Agentes Políticos'
    };
    return names[creditType] || creditType;
  };

  const getCurrentCredits = () => {
    return userCredits[creditType]?.active_credits || 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-blue-600" />
                Comprar Créditos
              </h2>
              <p className="text-gray-600 mt-1">
                {getCreditTypeName()} • Você tem {getCurrentCredits()} créditos disponíveis
              </p>
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
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg, index) => (
                <div
                  key={index}
                  className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPackage === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPackage(index)}
                >
                  {pkg.discount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Economize {pkg.savings}
                    </div>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-3">
                      {pkg.credits === 1 && <Zap className="w-8 h-8 text-blue-600" />}
                      {pkg.credits >= 5 && pkg.credits < 20 && <Star className="w-8 h-8 text-yellow-600" />}
                      {pkg.credits >= 20 && <Crown className="w-8 h-8 text-purple-600" />}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {pkg.credits} {pkg.credits === 1 ? 'Crédito' : 'Créditos'}
                    </h3>

                    <div className="mb-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {pkg.priceFormatted}
                      </div>
                      {pkg.discount > 0 && (
                        <div className="text-sm text-gray-500 line-through">
                          {pkg.originalPrice}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {(pkg.price / pkg.credits / 100).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        })} por crédito
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(index);
                      }}
                      disabled={purchasing}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        purchasing
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {purchasing ? 'Processando...' : 'Comprar Agora'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Informações Importantes:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Os créditos são válidos por 1 ano a partir da compra</li>
              <li>• Pagamento processado via PIX instantaneamente</li>
              <li>• Créditos não utilizados não são reembolsáveis</li>
              <li>• Você pode comprar quantos créditos desejar</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Precisa de mais créditos? Considere fazer upgrade do seu plano.
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchase;