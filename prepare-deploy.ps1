# Script PowerShell para preparar os repositórios separados para deploy

Write-Host "🚀 Preparando repositórios para deploy em produção..." -ForegroundColor Green

# Criar diretório temporário
if (Test-Path "temp-deploy") {
    Remove-Item -Recurse -Force "temp-deploy"
}
New-Item -ItemType Directory -Path "temp-deploy" | Out-Null
Set-Location "temp-deploy"

# 1. Preparar Backend
Write-Host "📦 Preparando backend..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "backend-repo" | Out-Null
Set-Location "backend-repo"

# Copiar arquivos do backend
Copy-Item -Recurse -Path "..\..\backend\*" -Destination "."
if (Test-Path "..\..\backend\.env.example") {
    Copy-Item "..\..\backend\.env.example" -Destination "."
}

# Usar o package.json de produção
if (Test-Path "package-production.json") {
    Copy-Item "package-production.json" -Destination "package.json"
    Remove-Item "package-production.json"
}

# Copiar README específico do backend
if (Test-Path "README.md") {
    Remove-Item "README.md"
}
if (Test-Path "readme.md") {
    Remove-Item "readme.md"
}

# Inicializar repositório Git
git init
git add .
git commit -m "Initial backend setup for production"

Write-Host "✅ Backend preparado em: temp-deploy\backend-repo" -ForegroundColor Green
Write-Host "📝 Para fazer push:" -ForegroundColor Cyan
Write-Host "   cd temp-deploy\backend-repo" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/AUTVSIONAI/DIREITAI-backend.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White

Set-Location ".."

# 2. Preparar Frontend
Write-Host "📦 Preparando frontend..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path "frontend-repo" | Out-Null
Set-Location "frontend-repo"

# Copiar todos os arquivos exceto backend e temp-deploy
$excludeItems = @("backend", "temp-deploy", "prepare-deploy.sh", "prepare-deploy.ps1")

Get-ChildItem "..\..\" | Where-Object { $_.Name -notin $excludeItems } | ForEach-Object {
    if ($_.PSIsContainer) {
        Copy-Item -Recurse -Path $_.FullName -Destination "."
    } else {
        Copy-Item -Path $_.FullName -Destination "."
    }
}

# Copiar arquivos ocultos importantes
if (Test-Path "..\..\.env.example") {
    Copy-Item "..\..\.env.example" -Destination "."
}
if (Test-Path "..\..\.gitignore") {
    Copy-Item "..\..\.gitignore" -Destination "."
}
if (Test-Path "..\..\.env.frontend.example") {
    Copy-Item "..\..\.env.frontend.example" -Destination ".env.example"
}

# Usar README específico do frontend
if (Test-Path "README-frontend.md") {
    Copy-Item "README-frontend.md" -Destination "README.md"
    Remove-Item "README-frontend.md"
}

# Remover arquivos desnecessários
$removeFiles = @(
    "BACKEND_DEPLOY_GUIDE.md",
    "CORS_FIX.md",
    "DEPLOY.md",
    "VERCEL_DEPLOYMENT_GUIDE.md",
    "server.js",
    "build-production.cjs",
    "build-vercel.js",
    "build.cjs",
    "build.js",
    "deploy-backend.cjs"
)

foreach ($file in $removeFiles) {
    if (Test-Path $file) {
        Remove-Item $file
    }
}

# Inicializar repositório Git
git init
git add .
git commit -m "Frontend setup for production - backend removed"

Write-Host "✅ Frontend preparado em: temp-deploy\frontend-repo" -ForegroundColor Green
Write-Host "📝 Para fazer push:" -ForegroundColor Cyan
Write-Host "   cd temp-deploy\frontend-repo" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/AUTVSIONAI/DIREITAI.git" -ForegroundColor White
Write-Host "   git branch -M main" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor White

Set-Location "..\.."

Write-Host ""
Write-Host "🎉 Preparação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Fazer push dos repositórios (comandos acima)" -ForegroundColor White
Write-Host "2. Conectar repositórios na Vercel" -ForegroundColor White
Write-Host "3. Configurar variáveis de ambiente (ver DEPLOY_PRODUCTION.md)" -ForegroundColor White
Write-Host "4. Testar deploys" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentação completa: DEPLOY_PRODUCTION.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Lembre-se de configurar as variáveis de ambiente na Vercel!" -ForegroundColor Red