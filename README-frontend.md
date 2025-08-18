# DireitaAI Frontend

Frontend da plataforma DireitaAI - Interface para conectar conservadores através de eventos, IA e comunidade.

## 🚀 Deploy em Produção

Este repositório contém apenas o frontend da aplicação DireitaAI, configurado para deploy na Vercel.

### Backend
O backend está em um repositório separado: [DIREITAI-backend](https://github.com/AUTVSIONAI/DIREITAI-backend)

## 📋 Variáveis de Ambiente

Configure as seguintes variáveis de ambiente na Vercel:

```env
# API Configuration
VITE_API_URL=https://direitai-backend.vercel.app/api

# Supabase Configuration (Frontend)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Stripe Configuration (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Application Configuration
VITE_APP_NAME=DireitaAI
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION="Plataforma para conectar conservadores através de eventos, IA e comunidade"
```

## 🛠️ Tecnologias

- **React** - Biblioteca JavaScript para interfaces
- **TypeScript** - Superset tipado do JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **Supabase** - Cliente para banco de dados e autenticação
- **Stripe** - Cliente para processamento de pagamentos
- **Vercel** - Plataforma de deploy

## 📁 Estrutura do Projeto

```
├── src/
│   ├── components/         # Componentes React
│   │   ├── admin/         # Componentes administrativos
│   │   ├── auth/          # Componentes de autenticação
│   │   ├── common/        # Componentes comuns
│   │   └── user/          # Componentes do usuário
│   ├── pages/             # Páginas da aplicação
│   ├── services/          # Serviços e APIs
│   ├── hooks/             # Custom hooks
│   ├── contexts/          # Contextos React
│   ├── types/             # Definições TypeScript
│   ├── utils/             # Utilitários
│   └── styles/            # Estilos globais
├── public/                # Arquivos estáticos
├── vercel.json           # Configuração da Vercel
├── vite.config.js        # Configuração do Vite
└── package.json          # Dependências e scripts
```

## 🚀 Deploy na Vercel

1. **Conectar Repositório**
   - Acesse [Vercel Dashboard](https://vercel.com/dashboard)
   - Clique em "New Project"
   - Conecte este repositório

2. **Configurar Build**
   - Framework: Vite
   - Build Command: `npm install --force && npm run build`
   - Install Command: `npm install --force`
   - Output Directory: `dist`

3. **Configurar Variáveis de Ambiente**
   - Na página do projeto, vá em "Settings" > "Environment Variables"
   - Adicione todas as variáveis listadas acima

4. **Deploy**
   - O deploy será automático após conectar o repositório
   - A URL será algo como: `https://direitai.vercel.app`

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.frontend.example .env

# Configurar variáveis no .env
# Editar .env com suas chaves

# Iniciar servidor de desenvolvimento
npm run dev
```

## 📝 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run lint` - Verificar código
- `npm run format` - Formatar código
- `npm test` - Executar testes

## 🔗 Integração com Backend

O frontend se conecta com o backend através da variável `VITE_API_URL`:

- **Desenvolvimento**: `http://localhost:5120/api`
- **Produção**: `https://direitai-backend.vercel.app/api`

### Endpoints Principais

- `POST /api/auth/login` - Login de usuário
- `GET /api/politicians` - Lista de políticos
- `POST /api/ai/chat` - Chat com IA
- `GET /api/events` - Eventos
- `POST /api/fake-news/analyze` - Análise de fake news

## 🎨 Funcionalidades

### 🏠 Página Inicial
- Dashboard com estatísticas
- Feed de notícias
- Eventos próximos

### 🤖 IA e Chat
- Chat com assistente IA
- Análise de fake news
- Recomendações personalizadas

### 👥 Políticos
- Perfis de deputados e senadores
- Avaliações e comentários
- Histórico de votações

### 📅 Eventos
- Lista de eventos conservadores
- RSVP e check-in
- Mapa interativo

### 🛒 Loja
- Produtos conservadores
- Pagamentos via Stripe
- Gestão de pedidos

### 📊 Admin
- Dashboard administrativo
- Gestão de usuários
- Moderação de conteúdo

## 🐛 Troubleshooting

### Problemas Comuns

1. **API Connection Error**
   - Verificar se `VITE_API_URL` está correto
   - Verificar se o backend está rodando
   - Verificar configuração de CORS no backend

2. **Supabase Connection Error**
   - Verificar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   - Verificar se o projeto Supabase está ativo

3. **Stripe Error**
   - Verificar `VITE_STRIPE_PUBLISHABLE_KEY`
   - Verificar se a chave é publishable (pk_)

4. **Build Error**
   - Executar `npm install --force`
   - Verificar se todas as variáveis de ambiente estão definidas
   - Verificar logs de build na Vercel

### Logs e Debug

- **Vercel**: Dashboard > Functions > View Function Logs
- **Browser**: Console do desenvolvedor (F12)
- **Local**: Terminal onde roda `npm run dev`

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large Desktop (1440px+)

## 🔒 Segurança

- Todas as chaves sensíveis ficam no backend
- Frontend usa apenas chaves públicas (Supabase anon, Stripe publishable)
- Autenticação via JWT tokens
- HTTPS obrigatório em produção

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/AUTVSIONAI/DIREITAI/issues)
- **Documentação**: [Vercel Docs](https://vercel.com/docs)
- **Vite**: [Vite Docs](https://vitejs.dev/)
- **React**: [React Docs](https://react.dev/)

---

**Desenvolvido pela Equipe DireitaAI** 🇧🇷