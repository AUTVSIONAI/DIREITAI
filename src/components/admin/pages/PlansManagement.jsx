import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { ApiClientImpl } from '../../../lib/api';

const apiClient = new ApiClientImpl();

const PlansManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price_monthly: '',
    price_yearly: '',
    features: '',
    ai_conversations_limit: '',
    fake_news_analyses_limit: '',
    is_active: true,
    is_popular: false,
    is_visible: true,
    sort_order: 0,
    color: 'blue',
    icon: 'Package'
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/plans/admin');
      
      if (response && response.data && response.data.success) {
        setPlans(response.data.data || []);
      } else {
        console.error('Erro ao buscar planos:', response?.data?.message || 'Resposta inválida');
        setPlans([]);
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      if (error.response?.status === 403) {
        alert('Acesso negado. Faça login com uma conta de administrador.');
      } else {
        alert('Erro ao carregar planos');
      }
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: formData.description,
        price_monthly: parseFloat(formData.price_monthly) || 0,
        price_yearly: parseFloat(formData.price_yearly) || 0,
        features: formData.features.split(',').map(f => f.trim()),
        limits: {
          ai_conversations: parseInt(formData.ai_conversations_limit) || 10,
          fake_news_analyses: parseInt(formData.fake_news_analyses_limit) || 1
        },
        is_active: formData.is_active,
        is_popular: formData.is_popular,
        color: formData.color,
        icon: formData.icon
      };

      let response;
      if (editingPlan) {
        response = await apiClient.put(`/plans/${editingPlan.id}`, planData);
      } else {
        response = await apiClient.post('/plans', planData);
      }

      if (response && response.data && response.data.success) {
        alert(editingPlan ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!');
        setShowForm(false);
        setEditingPlan(null);
        setFormData({
          name: '',
          description: '',
          price: '',
          duration_months: '',
          features: '',
          is_active: true
        });
        fetchPlans();
      } else {
        alert('Erro ao salvar plano: ' + (response?.data?.message || 'Resposta inválida'));
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      if (error.response?.status === 403) {
        alert('Acesso negado. Faça login com uma conta de administrador.');
      } else {
        alert('Erro ao salvar plano');
      }
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      slug: plan.slug || '',
      description: plan.description || '',
      price_monthly: (plan.price_monthly || 0).toString(),
      price_yearly: (plan.price_yearly || 0).toString(),
      features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features || ''),
      ai_conversations_limit: (plan.limits?.ai_conversations || 10).toString(),
      fake_news_analyses_limit: (plan.limits?.fake_news_analyses || 1).toString(),
      is_active: plan.is_active || false,
      is_popular: plan.is_popular || false,
      color: plan.color || 'blue',
      icon: plan.icon || 'Package'
    });
    setShowForm(true);
  };

  const handleDelete = async (planId) => {
    if (window.confirm('Tem certeza que deseja deletar este plano?')) {
      try {
        const response = await apiClient.delete(`/plans/${planId}`);
        
        if (response && response.data && response.data.success) {
          alert('Plano deletado com sucesso!');
          fetchPlans();
        } else {
          alert('Erro ao deletar plano: ' + (response?.data?.message || 'Resposta inválida'));
        }
      } catch (error) {
        console.error('Erro ao deletar plano:', error);
        if (error.response?.status === 403) {
          alert('Acesso negado. Faça login com uma conta de administrador.');
        } else {
          alert('Erro ao deletar plano');
        }
      }
    }
  };

  const handleToggleActive = async (planId, currentStatus) => {
    try {
      const response = await apiClient.patch(`/plans/${planId}/toggle`);
      
      if (response && response.data && response.data.success) {
        alert(`Plano ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
        fetchPlans();
      } else {
        alert('Erro ao alterar status do plano: ' + (response?.data?.message || 'Resposta inválida'));
      }
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error);
      if (error.response?.status === 403) {
        alert('Acesso negado. Faça login com uma conta de administrador.');
      } else {
        alert('Erro ao alterar status do plano');
      }
    }
  };

  const handleToggleVisibility = async (planId, currentVisibility) => {
    try {
      const response = await apiClient.patch(`/plans/${planId}/visibility`, {
        is_visible: !currentVisibility
      });
      
      if (response && response.data && response.data.success) {
        alert(`Plano ${currentVisibility ? 'ocultado' : 'tornado visível'} com sucesso!`);
        fetchPlans();
      } else {
        alert('Erro ao alterar visibilidade do plano: ' + (response?.data?.message || 'Resposta inválida'));
      }
    } catch (error) {
      console.error('Erro ao alterar visibilidade do plano:', error);
      if (error.response?.status === 403) {
        alert('Acesso negado. Faça login com uma conta de administrador.');
      } else {
        alert('Erro ao alterar visibilidade do plano');
      }
    }
  };

  const handleReorder = async (planId, direction) => {
    try {
      const response = await apiClient.patch(`/plans/${planId}/reorder`, {
        direction: direction
      });
      
      if (response && response.data && response.data.success) {
        fetchPlans();
      } else {
        alert('Erro ao reordenar plano: ' + (response?.data?.message || 'Resposta inválida'));
      }
    } catch (error) {
      console.error('Erro ao reordenar plano:', error);
      if (error.response?.status === 403) {
        alert('Acesso negado. Faça login com uma conta de administrador.');
      } else {
        alert('Erro ao reordenar plano');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciamento de Planos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Plano
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (identificador único)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: patriota-engajado"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Mensal (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_monthly}
                  onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Anual (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_yearly}
                  onChange={(e) => setFormData({ ...formData, price_yearly: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Conversas IA/dia (-1 = ilimitado)
                </label>
                <input
                  type="number"
                  value={formData.ai_conversations_limit}
                  onChange={(e) => setFormData({ ...formData, ai_conversations_limit: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite de Análises Fake News/dia (-1 = ilimitado)
                </label>
                <input
                  type="number"
                  value={formData.fake_news_analyses_limit}
                  onChange={(e) => setFormData({ ...formData, fake_news_analyses_limit: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor do Plano
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gray">Cinza</option>
                  <option value="blue">Azul</option>
                  <option value="green">Verde</option>
                  <option value="purple">Roxo</option>
                  <option value="red">Vermelho</option>
                  <option value="yellow">Amarelo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ícone
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Package">Package</option>
                  <option value="Star">Star</option>
                  <option value="Crown">Crown</option>
                  <option value="Shield">Shield</option>
                  <option value="Zap">Zap</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Plano Ativo
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_popular}
                      onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                      className="mr-2"
                    />
                    Plano Popular
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_visible}
                      onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                      className="mr-2"
                    />
                    Visível para Usuários
                  </label>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordem de Exibição
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recursos (separados por vírgula)
              </label>
              <textarea
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Ex: Acesso completo, Suporte 24/7, Relatórios avançados"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                {editingPlan ? 'Atualizar' : 'Criar'} Plano
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingPlan(null);
                  setFormData({
                    name: '',
                    slug: '',
                    description: '',
                    price_monthly: '',
                    price_yearly: '',
                    features: '',
                    ai_conversations_limit: '',
                    fake_news_analyses_limit: '',
                    is_active: true,
                    is_popular: false,
                    color: 'blue',
                    icon: 'Package'
                  });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ordem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preço Mensal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Limites
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visibilidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan, index) => (
              <tr key={plan.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{plan.sort_order || 0}</span>
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleReorder(plan.id, 'up')}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={index === 0}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorder(plan.id, 'down')}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={index === plans.length - 1}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                    <div className="text-sm text-gray-500">{plan.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  R$ {plan.price_monthly?.toFixed(2) || '0,00'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="text-xs">
                    <div>IA: {plan.limits?.ai_conversations === -1 ? 'Ilimitado' : plan.limits?.ai_conversations || 0}/dia</div>
                    <div>Fake News: {plan.limits?.fake_news_analyses === -1 ? 'Ilimitado' : plan.limits?.fake_news_analyses || 0}/dia</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    plan.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {plan.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleToggleVisibility(plan.id, plan.is_visible)}
                      className={`${plan.is_visible ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`}
                      title={plan.is_visible ? 'Visível para usuários' : 'Oculto dos usuários'}
                    >
                      {plan.is_visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <span className={`ml-2 text-xs ${
                      plan.is_visible ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {plan.is_visible ? 'Visível' : 'Oculto'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Editar plano"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(plan.id, plan.is_active)}
                      className={`${plan.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      title={plan.is_active ? 'Desativar plano' : 'Ativar plano'}
                    >
                      {plan.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Deletar plano"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {plans.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum plano encontrado
          </div>
        )}
      </div>
    </div>
  );
};

export default PlansManagement;