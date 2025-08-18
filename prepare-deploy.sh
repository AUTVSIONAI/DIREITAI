#!/bin/bash

# Script para preparar os repositórios separados para deploy

echo "🚀 Preparando repositórios para deploy em produção..."

# Criar diretório temporário
mkdir -p temp-deploy
cd temp-deploy

# 1. Preparar Backend
echo "📦 Preparando backend..."
mkdir backend-repo
cd backend-repo

# Copiar arquivos do backend
cp -r ../../backend/* .
cp ../../backend/.env.example .

# Usar o package.json de produção
cp package-production.json package.json
rm package-production.json

# Inicializar repositório Git
git init
git add .
git commit -m "Initial backend setup for production"

echo "✅ Backend preparado em: temp-deploy/backend-repo"
echo "📝 Para fazer push:"
echo "   cd temp-deploy/backend-repo"
echo "   git remote add origin https://github.com/AUTVSIONAI/DIREITAI-backend.git"
echo "   git branch -M main"
echo "   git push -u origin main"

cd ..

# 2. Preparar Frontend
echo "📦 Preparando frontend..."
mkdir frontend-repo
cd frontend-repo

# Copiar todos os arquivos exceto backend
cp -r ../../* . 2>/dev/null || true
cp ../../.env.example . 2>/dev/null || true
cp ../../.gitignore . 2>/dev/null || true

# Remover pasta backend
rm -rf backend
rm -rf temp-deploy

# Remover arquivos específicos do backend
rm -f prepare-deploy.sh

# Inicializar repositório Git
git init
git add .
git commit -m "Frontend setup for production - backend removed"

echo "✅ Frontend preparado em: temp-deploy/frontend-repo"
echo "📝 Para fazer push:"
echo "   cd temp-deploy/frontend-repo"
echo "   git remote add origin https://github.com/AUTVSIONAI/DIREITAI.git"
echo "   git branch -M main"
echo "   git push -u origin main"

cd ../..

echo ""
echo "🎉 Preparação concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Fazer push dos repositórios (comandos acima)"
echo "2. Conectar repositórios na Vercel"
echo "3. Configurar variáveis de ambiente (ver DEPLOY_PRODUCTION.md)"
echo "4. Testar deploys"
echo ""
echo "📖 Documentação completa: DEPLOY_PRODUCTION.md"