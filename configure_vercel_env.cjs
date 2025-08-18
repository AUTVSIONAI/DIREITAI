const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ler variáveis do arquivo .env do backend
const envPath = path.join(__dirname, 'backend', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse das variáveis de ambiente
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('🔧 Configurando variáveis de ambiente no Vercel...');
console.log('📁 Projeto: DIREITAI-backend');
console.log('');

// Variáveis necessárias para o backend
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_API_KEY',
  'TOGETHER_API_KEY',
  'JWT_SECRET'
];

console.log('📋 Variáveis encontradas no .env:');
requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NÃO ENCONTRADA`);
  }
});

console.log('');
console.log('🚀 Para configurar no Vercel, execute os seguintes comandos:');
console.log('📌 Certifique-se de estar no diretório temp-deploy/backend-repo');
console.log('');

// Gerar comandos do Vercel CLI
requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value) {
    console.log(`vercel env add ${varName} production`);
    console.log(`# Valor: ${value}`);
    console.log('');
  }
});

// Variáveis adicionais para produção
console.log('# Variáveis adicionais para produção:');
console.log('vercel env add NODE_ENV production');
console.log('# Valor: production');
console.log('');
console.log('vercel env add PORT production');
console.log('# Valor: 5120');
console.log('');
console.log('vercel env add FRONTEND_URL production');
console.log('# Valor: https://direitai.vercel.app');
console.log('');
console.log('vercel env add VERCEL production');
console.log('# Valor: 1');
console.log('');

console.log('💡 Após configurar as variáveis, execute:');
console.log('vercel --prod');
console.log('');
console.log('🔍 Para verificar as variáveis configuradas:');
console.log('vercel env ls');