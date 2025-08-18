// Teste de configuração do Supabase
const axios = require('axios');

// Simulando as variáveis que deveriam estar no Vercel
const SUPABASE_URL = 'https://your-project.supabase.co'; // Placeholder
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'; // Placeholder

console.log('🔍 Testando configuração do Supabase...');
console.log('URL:', SUPABASE_URL);
console.log('Key:', SUPABASE_SERVICE_ROLE_KEY ? 'Definida' : 'Não definida');

// Teste básico de conectividade
async function testSupabaseConnection() {
  try {
    console.log('\n📡 Testando conexão com Supabase...');
    
    const headers = {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Teste 1: Verificar se a URL está acessível
    console.log('\n🔍 Teste 1: Verificando URL base...');
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/`, {
      headers,
      timeout: 10000
    });
    
    console.log('✅ URL base acessível:', response.status);
    
    // Teste 2: Tentar listar tabelas
    console.log('\n🔍 Teste 2: Tentando acessar tabela politicians...');
    const politiciansResponse = await axios.get(`${SUPABASE_URL}/rest/v1/politicians?limit=1`, {
      headers,
      timeout: 10000
    });
    
    console.log('✅ Tabela politicians acessível:', politiciansResponse.status);
    console.log('📊 Dados:', politiciansResponse.data);
    
  } catch (error) {
    console.log('❌ Erro na conexão:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Data:', error.response?.data);
    
    if (error.message.includes('your-project.supabase.co')) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO: Variáveis de ambiente não configuradas!');
      console.log('As variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam ser configuradas no Vercel.');
    }
  }
}

testSupabaseConnection();