# 🚀 Plano de Implementação - Nova Estrutura de Monetização

## 📋 RESUMO EXECUTIVO

Este documento detalha a implementação técnica da nova estrutura de monetização baseada no **Formato 1: Freemium Agressivo**, com foco no detector de fake news como carro-chefe.

### Objetivos Principais:
1. **Reduzir plano gratuito para 1 análise de fake news/dia**
2. **Implementar novos planos: R$ 29,90, R$ 59,90, R$ 89,90**
3. **Criar limites específicos por funcionalidade**
4. **Integrar LLMs atualizadas para maior precisão**
5. **Desenvolver sistema de upgrade persuasivo**

---

## 🎯 FASE 1: AJUSTE DOS LIMITES (SEMANA 1-2)

### 1.1 Atualização da Estrutura de Planos

#### Arquivo: `backend/services/aiService.js`
```javascript
// NOVOS LIMITES POR PLANO E FUNCIONALIDADE
const PLAN_LIMITS = {
  gratuito: {
    fake_news_daily: 1,        // 1 análise por dia
    ai_creative_daily: 3,      // 3 mensagens por dia
    political_agents_daily: 1, // 1 conversa por dia
    messages_per_conversation: 5 // 5 mensagens por conversa
  },
  engajado: {
    fake_news_daily: 5,        // 5 análises por dia
    ai_creative_daily: 20,     // 20 mensagens por dia
    political_agents_daily: 3, // 3 conversas por dia
    messages_per_conversation: -1 // ilimitado
  },
  lider: {
    fake_news_daily: 10,       // 10 análises por dia
    ai_creative_daily: 50,     // 50 mensagens por dia
    political_agents_daily: -1, // ilimitado
    messages_per_conversation: -1 // ilimitado
  },
  supremo: {
    fake_news_daily: 20,       // 20 análises por dia
    ai_creative_daily: -1,     // ilimitado
    political_agents_daily: -1, // ilimitado
    messages_per_conversation: -1, // ilimitado
    premium_ai: true           // IA premium
  }
};
```

#### Arquivo: `backend/routes/payments.js`
```javascript
// NOVOS PLANOS DE PREÇO
const PLANS = {
  engajado: {
    name: 'Patriota Engajado',
    price: 2990, // R$ 29,90
    currency: 'brl',
    interval: 'month',
    features: [
      '5 análises de fake news por dia',
      '20 mensagens com IA Criativa',
      '3 conversas com agentes políticos',
      'Histórico completo',
      'Sem anúncios'
    ]
  },
  lider: {
    name: 'Patriota Líder',
    price: 5990, // R$ 59,90
    currency: 'brl',
    interval: 'month',
    features: [
      '10 análises de fake news por dia',
      '50 mensagens com IA Criativa',
      'Agentes políticos ilimitados',
      'IA premium',
      'Relatórios semanais'
    ]
  },
  supremo: {
    name: 'Patriota Supremo',
    price: 8990, // R$ 89,90
    currency: 'brl',
    interval: 'month',
    features: [
      '20 análises de fake news por dia',
      'IA Criativa ilimitada',
      'Todos os recursos premium',
      'Consultoria personalizada',
      'API premium'
    ]
  }
};
```

### 1.2 Sistema de Verificação de Limites

#### Novo arquivo: `backend/services/limitService.js`
```javascript
const { supabase } = require('../config/supabase');

class LimitService {
  async checkFakeNewsLimit(userId, userPlan = 'gratuito') {
    const today = new Date().toISOString().split('T')[0];
    
    // Contar análises de fake news hoje
    const { count, error } = await supabase
      .from('fake_news_checks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today + 'T00:00:00.000Z')
      .lt('created_at', today + 'T23:59:59.999Z');

    if (error) throw error;

    const limit = PLAN_LIMITS[userPlan]?.fake_news_daily || 1;
    const used = count || 0;
    const remaining = Math.max(0, limit - used);

    return {
      canUse: used < limit,
      used,
      limit,
      remaining,
      resetTime: this.getResetTime()
    };
  }

  async checkAICreativeLimit(userId, userPlan = 'gratuito') {
    // Similar para IA Criativa
  }

  async checkPoliticalAgentLimit(userId, userPlan = 'gratuito') {
    // Similar para Agentes Políticos
  }

  getResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
}

module.exports = new LimitService();
```

### 1.3 Atualização das Rotas

#### Arquivo: `backend/routes/fakeNews.js`
```javascript
const limitService = require('../services/limitService');

// Middleware para verificar limites
const checkFakeNewsLimit = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userPlan = req.user.plan || 'gratuito';
    
    const limitCheck = await limitService.checkFakeNewsLimit(userId, userPlan);
    
    if (!limitCheck.canUse) {
      return res.status(429).json({
        success: false,
        error: 'Limite diário atingido',
        limit: limitCheck.limit,
        used: limitCheck.used,
        resetTime: limitCheck.resetTime,
        upgradeRequired: true
      });
    }
    
    req.limitInfo = limitCheck;
    next();
  } catch (error) {
    console.error('Erro ao verificar limite:', error);
    res.status(500).json({ success: false, error: 'Erro interno' });
  }
};

// Aplicar middleware na rota de análise
router.post('/analyze', authenticateUser, checkFakeNewsLimit, async (req, res) => {
  // Lógica existente de análise
});
```

---

## 🎯 FASE 2: INTERFACE DE UPGRADE (SEMANA 2-3)

### 2.1 Componente de Limite Atingido

#### Novo arquivo: `src/components/LimitReached.jsx`
```jsx
import React from 'react';
import { Crown, Zap, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LimitReached = ({ 
  feature, 
  currentPlan, 
  used, 
  limit, 
  resetTime 
}) => {
  const navigate = useNavigate();

  const plans = {
    engajado: {
      name: 'Patriota Engajado',
      price: 'R$ 29,90',
      icon: Star,
      color: 'blue',
      limits: { fake_news: 5, ai_creative: 20, agents: 3 }
    },
    lider: {
      name: 'Patriota Líder', 
      price: 'R$ 59,90',
      icon: Crown,
      color: 'yellow',
      limits: { fake_news: 10, ai_creative: 50, agents: 'Ilimitado' }
    },
    supremo: {
      name: 'Patriota Supremo',
      price: 'R$ 89,90', 
      icon: Zap,
      color: 'purple',
      limits: { fake_news: 20, ai_creative: 'Ilimitado', agents: 'Ilimitado' }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Limite Diário Atingido!
          </h2>
          <p className="text-gray-600">
            Você usou {used} de {limit} análises hoje.
            Upgrade para continuar verificando fake news!
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {Object.entries(plans).map(([key, plan]) => {
            const Icon = plan.icon;
            return (
              <div 
                key={key}
                className={`p-4 border-2 rounded-lg cursor-pointer hover:shadow-md transition-all ${
                  key === 'engajado' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => navigate(`/plans?upgrade=${key}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <p className="text-sm text-gray-600">
                        {plan.limits.fake_news} análises/dia
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{plan.price}</p>
                    <p className="text-xs text-gray-500">/mês</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-3">
          <button 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={() => window.location.reload()}
          >
            Voltar
          </button>
          <button 
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
            onClick={() => navigate('/plans')}
          >
            <span>Fazer Upgrade</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitReached;
```

### 2.2 Atualização da Página Verdade ou Fake

#### Arquivo: `src/pages/VerdadeOuFake.tsx`
```typescript
// Adicionar imports
import LimitReached from '../components/LimitReached';

// Adicionar estados
const [showLimitModal, setShowLimitModal] = useState(false);
const [limitInfo, setLimitInfo] = useState(null);

// Atualizar função de análise
const handleAnalyze = async () => {
  try {
    setIsAnalyzing(true);
    setError('');
    
    const response = await apiRequest('/fake-news/analyze', {
      method: 'POST',
      body: JSON.stringify({
        tipo_input: inputType,
        conteudo: content
      })
    });
    
    if (response.upgradeRequired) {
      setLimitInfo(response);
      setShowLimitModal(true);
      return;
    }
    
    // Lógica existente...
  } catch (error) {
    if (error.status === 429) {
      setLimitInfo(error.data);
      setShowLimitModal(true);
    } else {
      setError('Erro ao analisar conteúdo');
    }
  } finally {
    setIsAnalyzing(false);
  }
};

// Adicionar no JSX
{showLimitModal && (
  <LimitReached 
    feature="fake_news"
    currentPlan={user?.plan || 'gratuito'}
    used={limitInfo?.used}
    limit={limitInfo?.limit}
    resetTime={limitInfo?.resetTime}
    onClose={() => setShowLimitModal(false)}
  />
)}
```

---

## 🎯 FASE 3: INTEGRAÇÃO DE LLMs ATUALIZADAS (SEMANA 3-4)

### 3.1 Modelos Premium por Plano

#### Arquivo: `backend/services/aiService.js`
```javascript
// Modelos por nível de plano
const MODELS_BY_PLAN = {
  gratuito: [
    'meta-llama/llama-3.3-70b-instruct:free',
    'google/gemini-2.0-flash-exp:free'
  ],
  engajado: [
    'google/gemini-2.5-pro-exp-03-25:free',
    'deepseek/deepseek-chat-v3-0324:free',
    'meta-llama/llama-4-scout:free'
  ],
  lider: [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4-turbo',
    'google/gemini-2.5-pro-exp-03-25:free'
  ],
  supremo: [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'google/gemini-2.5-pro-exp-03-25:free',
    'meta-llama/llama-4-maverick:free'
  ]
};

// Função para selecionar modelo baseado no plano
function selectModelByPlan(userPlan, isCurrentTopic = false) {
  const availableModels = MODELS_BY_PLAN[userPlan] || MODELS_BY_PLAN.gratuito;
  
  if (isCurrentTopic && userPlan !== 'gratuito') {
    // Para tópicos atuais, usar modelos mais atualizados
    return availableModels.find(model => 
      UPDATED_2025_MODELS.includes(model)
    ) || availableModels[0];
  }
  
  return availableModels[0];
}
```

### 3.2 Sistema de Fontes em Tempo Real

#### Novo arquivo: `backend/services/sourceService.js`
```javascript
const axios = require('axios');

class SourceService {
  async getRealtimeSources(query, userPlan = 'gratuito') {
    const maxSources = this.getMaxSources(userPlan);
    
    try {
      // Integração com APIs de notícias
      const sources = await Promise.all([
        this.searchGoogleNews(query),
        this.searchNewsAPI(query),
        userPlan !== 'gratuito' ? this.searchFactCheck(query) : null
      ].filter(Boolean));
      
      return sources
        .flat()
        .slice(0, maxSources)
        .map(source => ({
          nome: source.title,
          url: source.url,
          confiabilidade: this.calculateReliability(source),
          data_publicacao: source.publishedAt
        }));
    } catch (error) {
      console.error('Erro ao buscar fontes:', error);
      return [];
    }
  }
  
  getMaxSources(userPlan) {
    const limits = {
      gratuito: 2,
      engajado: 5,
      lider: 8,
      supremo: 12
    };
    return limits[userPlan] || 2;
  }
  
  calculateReliability(source) {
    // Lógica para calcular confiabilidade baseada no domínio
    const trustedDomains = [
      'g1.com.br', 'folha.uol.com.br', 'estadao.com.br',
      'bbc.com', 'reuters.com', 'agenciabrasil.ebc.com.br'
    ];
    
    const domain = new URL(source.url).hostname;
    return trustedDomains.includes(domain) ? 'Alta' : 'Média';
  }
}

module.exports = new SourceService();
```

---

## 🎯 FASE 4: SISTEMA DE NOTIFICAÇÕES (SEMANA 4-5)

### 4.1 Notificações de Limite

#### Novo arquivo: `src/components/LimitNotification.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Crown } from 'lucide-react';

const LimitNotification = ({ user }) => {
  const [limits, setLimits] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  
  useEffect(() => {
    fetchLimits();
  }, []);
  
  const fetchLimits = async () => {
    try {
      const response = await fetch('/api/user/limits', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      const data = await response.json();
      setLimits(data);
      
      // Mostrar notificação se estiver próximo do limite
      if (data.fake_news.remaining <= 1 && data.fake_news.remaining > 0) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Erro ao buscar limites:', error);
    }
  };
  
  if (!showNotification || !limits) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-yellow-800">
            Limite Quase Esgotado!
          </h4>
          <p className="text-sm text-yellow-700 mt-1">
            Você tem apenas {limits.fake_news.remaining} análise(s) restante(s) hoje.
          </p>
          <button 
            className="mt-2 text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            onClick={() => window.location.href = '/plans'}
          >
            Fazer Upgrade
          </button>
        </div>
        <button 
          onClick={() => setShowNotification(false)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LimitNotification;
```

### 4.2 Dashboard de Uso

#### Novo arquivo: `src/components/UsageDashboard.jsx`
```jsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, MessageSquare, Users, TrendingUp } from 'lucide-react';

const UsageDashboard = ({ user }) => {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUsage();
  }, []);
  
  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/user/usage-stats', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Carregando...</div>;
  
  const features = [
    {
      name: 'Fake News',
      icon: Shield,
      used: usage.fake_news.used,
      limit: usage.fake_news.limit,
      color: 'blue'
    },
    {
      name: 'IA Criativa', 
      icon: MessageSquare,
      used: usage.ai_creative.used,
      limit: usage.ai_creative.limit,
      color: 'green'
    },
    {
      name: 'Agentes IA',
      icon: Users, 
      used: usage.political_agents.used,
      limit: usage.political_agents.limit,
      color: 'purple'
    }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Uso Diário</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const percentage = feature.limit === -1 ? 100 : 
            (feature.used / feature.limit) * 100;
          
          return (
            <div key={feature.name} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Icon className={`w-5 h-5 text-${feature.color}-600`} />
                <span className="font-medium">{feature.name}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Usado: {feature.used}</span>
                  <span>Limite: {feature.limit === -1 ? '∞' : feature.limit}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`bg-${feature.color}-600 h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {user.plan === 'gratuito' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="font-semibold">Upgrade Recomendado</span>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Você está usando {usage.fake_news.used} de {usage.fake_news.limit} análises diárias.
            Upgrade para ter mais liberdade!
          </p>
          <button 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
            onClick={() => window.location.href = '/plans'}
          >
            Ver Planos
          </button>
        </div>
      )}
    </div>
  );
};

export default UsageDashboard;
```

---

## 🎯 FASE 5: TESTES E OTIMIZAÇÕES (SEMANA 5-6)

### 5.1 Testes A/B para Conversão

#### Variações de Mensagens de Limite:
1. **Urgência**: "Limite esgotado! Upgrade agora para continuar"
2. **Benefício**: "Desbloqueie análises ilimitadas por apenas R$ 29,90"
3. **Social**: "Junte-se a milhares de patriotas verificando fake news"
4. **Escassez**: "Oferta limitada: 50% de desconto no primeiro mês"

### 5.2 Métricas de Acompanhamento

#### Arquivo: `backend/services/analyticsService.js`
```javascript
class AnalyticsService {
  async trackLimitReached(userId, feature, plan) {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'limit_reached',
      feature,
      plan,
      metadata: { timestamp: new Date().toISOString() }
    });
  }
  
  async trackUpgradeClick(userId, fromPlan, toPlan, source) {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'upgrade_click',
      metadata: { fromPlan, toPlan, source }
    });
  }
  
  async getConversionMetrics() {
    // Calcular taxa de conversão por fonte
    const { data } = await supabase
      .from('analytics_events')
      .select('*')
      .in('event_type', ['limit_reached', 'upgrade_click', 'subscription_created'])
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    return this.calculateConversionRates(data);
  }
}
```

---

## 📊 CRONOGRAMA DE IMPLEMENTAÇÃO

| Semana | Fase | Tarefas Principais | Responsável |
|--------|------|-------------------|-------------|
| 1 | Setup | Atualizar limites, criar estrutura de planos | Backend |
| 2 | Limites | Implementar verificação de limites, middleware | Backend |
| 3 | UI/UX | Criar modais de upgrade, notificações | Frontend |
| 4 | IA Premium | Integrar LLMs atualizadas, sistema de fontes | Backend |
| 5 | Dashboard | Criar dashboard de uso, analytics | Frontend |
| 6 | Testes | Testes A/B, otimizações, deploy | Full Stack |

---

## 🎯 MÉTRICAS DE SUCESSO

### KPIs Principais:
1. **Taxa de Conversão**: > 5% (gratuito → pago)
2. **Retenção Mensal**: > 80% (usuários pagos)
3. **Receita Mensal**: R$ 15.000 em 3 meses
4. **Uso Diário**: > 70% dos usuários gratuitos atingem limite
5. **Satisfação**: NPS > 50

### Métricas Secundárias:
- Tempo médio até upgrade: < 7 dias
- Churn rate: < 5% mensal
- Ticket médio: R$ 45,00
- CAC (Custo de Aquisição): < R$ 30,00
- LTV (Lifetime Value): > R$ 300,00

---

## 🚨 RISCOS E MITIGAÇÕES

### Riscos Identificados:
1. **Usuários abandonarem por limites muito restritivos**
   - *Mitigação*: Testes A/B com diferentes limites
   
2. **Concorrência com ferramentas gratuitas**
   - *Mitigação*: Foco na qualidade e precisão das análises
   
3. **Custos de IA muito altos**
   - *Mitigação*: Otimização de modelos, cache inteligente
   
4. **Baixa conversão inicial**
   - *Mitigação*: Campanhas de onboarding, ofertas especiais

### Plano de Contingência:
- Se conversão < 2%: Aumentar limite gratuito para 2 análises/dia
- Se churn > 10%: Implementar programa de retenção
- Se custos > 40% receita: Renegociar APIs ou otimizar uso

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Backend:
- [ ] Atualizar estrutura de planos
- [ ] Implementar sistema de limites
- [ ] Criar middleware de verificação
- [ ] Integrar LLMs premium
- [ ] Sistema de fontes em tempo real
- [ ] Analytics e métricas
- [ ] Testes unitários

### Frontend:
- [ ] Modal de limite atingido
- [ ] Notificações de uso
- [ ] Dashboard de estatísticas
- [ ] Página de planos atualizada
- [ ] Componentes de upgrade
- [ ] Testes de interface

### DevOps:
- [ ] Configurar variáveis de ambiente
- [ ] Deploy em staging
- [ ] Testes de carga
- [ ] Monitoramento de performance
- [ ] Deploy em produção
- [ ] Rollback plan

---

**🎯 OBJETIVO FINAL: Transformar o DireitAI na principal plataforma de verificação de fake news do Brasil, com receita recorrente sustentável e alta satisfação dos usuários.**