# Deploy em Produção - DireitaAI

## Repositórios Separados

### Frontend
- **Repositório**: `https://github.com/AUTVSIONAI/DIREITAI`
- **Deploy**: Vercel
- **URL de Produção**: `https://direitai.vercel.app`

### Backend
- **Repositório**: `https://github.com/AUTVSIONAI/DIREITAI-backend`
- **Deploy**: Vercel
- **URL de Produção**: `https://direitai-backend.vercel.app`

## Variáveis de Ambiente

### Frontend (Vercel)
```env
VITE_API_URL=https://direitai-backend.vercel.app/api
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here
```

### Backend (Vercel)
```env
PORT=5120
NODE_ENV=production
FRONTEND_URL=https://direitai.vercel.app
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
TOGETHER_API_KEY=your_together_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
VERCEL=1
```

## APIs Externas (Não precisam de chaves)

### Câmara dos Deputados
- **URL**: `https://dadosabertos.camara.leg.br/api/v2`
- **Documentação**: https://dadosabertos.camara.leg.br/swagger/api.html
- **Status**: ✅ Pública, sem necessidade de autenticação

### Senado Federal
- **URL**: `https://legis.senado.leg.br/dadosabertos`
- **Documentação**: https://legis.senado.leg.br/dadosabertos/docs/
- **Status**: ✅ Pública, sem necessidade de autenticação

## Configurações de CORS

O backend já está configurado com os domínios corretos:
- `https://direitai.com`
- `https://www.direitai.com`
- `https://direitai.vercel.app`
- `https://direitai-backend.vercel.app`

## Passos para Deploy

### 1. Preparar Backend
```bash
# Criar repositório separado para backend
git clone https://github.com/AUTVSIONAI/DIREITAI.git temp-repo
cd temp-repo
mkdir backend-only
cp -r backend/* backend-only/
cp backend/.env.example backend-only/
cp backend/vercel.json backend-only/
cp backend/package.json backend-only/

# Inicializar novo repositório
cd backend-only
git init
git remote add origin https://github.com/AUTVSIONAI/DIREITAI-backend.git
git add .
git commit -m "Initial backend setup for production"
git push -u origin main
```

### 2. Preparar Frontend
```bash
# No repositório principal, remover pasta backend
rm -rf backend/
git add .
git commit -m "Remove backend folder for separate deployment"
git push origin main
```

### 3. Deploy na Vercel

#### Backend:
1. Conectar repositório `DIREITAI-backend` na Vercel
2. Configurar variáveis de ambiente listadas acima
3. Deploy automático

#### Frontend:
1. Conectar repositório `DIREITAI` na Vercel
2. Configurar variáveis de ambiente listadas acima
3. Deploy automático

## Verificações Pós-Deploy

### ✅ Checklist
- [ ] Backend respondendo em `https://direitai-backend.vercel.app/health`
- [ ] Frontend carregando em `https://direitai.vercel.app`
- [ ] CORS funcionando entre frontend e backend
- [ ] APIs de deputados e senadores funcionando
- [ ] Autenticação Supabase funcionando
- [ ] Pagamentos Stripe funcionando
- [ ] IA (OpenRouter/Together) funcionando
- [ ] Upload de arquivos funcionando

## Monitoramento

### Logs
- **Vercel**: Dashboard > Functions > View Function Logs
- **Supabase**: Dashboard > Logs
- **Stripe**: Dashboard > Logs

### Health Checks
- **Backend**: `https://direitai-backend.vercel.app/health`
- **APIs Externas**: Monitorar status das APIs da Câmara e Senado

## Troubleshooting

### Problemas Comuns
1. **CORS Error**: Verificar se domínios estão corretos no `server.js`
2. **API Error**: Verificar variáveis de ambiente na Vercel
3. **Build Error**: Verificar dependências no `package.json`
4. **Database Error**: Verificar configurações do Supabase

### Contatos de Suporte
- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Stripe**: https://support.stripe.com