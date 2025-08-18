# Guia para Configurar Variáveis de Ambiente no Vercel

## 🚨 PROBLEMA IDENTIFICADO
Os endpoints de admin estão retornando erro 500 porque as **variáveis de ambiente do Supabase não estão configuradas no Vercel**.

## 📋 SOLUÇÃO: Configurar via Dashboard do Vercel

### 1. Acesse o Dashboard do Vercel
1. Vá para: https://vercel.com/dashboard
2. Faça login com sua conta
3. Encontre o projeto **DIREITAI-backend**
4. Clique no projeto para abrir

### 2. Configurar Variáveis de Ambiente
1. No projeto, clique na aba **Settings**
2. No menu lateral, clique em **Environment Variables**
3. Adicione as seguintes variáveis uma por uma:

#### Variáveis Críticas do Supabase:
```
SUPABASE_URL = https://vussgslenvyztckeuyap.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM
```

#### Variáveis de IA:
```
OPENROUTER_API_KEY = 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
TOGETHER_API_KEY = 2ecf7bda8654fdd047180b62dcf6f4f8e0d4306eb45b316f3573fe1225772f11
```

#### Variáveis de Configuração:
```
JWT_SECRET = direitai_jwt_secret_2024_production_ready_key_change_if_needed
NODE_ENV = production
PORT = 5120
FRONTEND_URL = https://direitai.vercel.app
VERCEL = 1
```

### 3. Configurar Ambiente
Para cada variável:
1. Clique em **Add New**
2. Digite o **Name** (nome da variável)
3. Digite o **Value** (valor da variável)
4. Selecione **Production** em Environment
5. Clique em **Save**

### 4. Fazer Redeploy
Após adicionar todas as variáveis:
1. Vá para a aba **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Clique em **Redeploy**
4. Aguarde o deploy terminar

### 5. Testar a Correção
Após o redeploy, teste os endpoints:
- https://direitai-backend.vercel.app/health (deve retornar 200)
- https://direitai-backend.vercel.app/api/admin/overview (deve retornar dados ou 401, não 500)

## 🔍 VERIFICAÇÃO
Execute este comando para testar:
```bash
node backend/test_supabase_connection.js
```

## ✅ RESULTADO ESPERADO
- ❌ Antes: Erro 500 "Erro interno do servidor"
- ✅ Depois: Erro 401 "Token de acesso requerido" (correto, pois não há token válido)

## 📞 SUPORTE
Se ainda houver problemas:
1. Verifique se todas as variáveis foram salvas corretamente
2. Confirme que o redeploy foi concluído
3. Verifique os logs do Vercel em Functions > View Function Logs