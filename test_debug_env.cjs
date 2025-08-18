const axios = require('axios');

const BASE_URL = 'https://direitai-backend.vercel.app';

async function testDebugEndpoint() {
  console.log('🔍 Testando endpoint de debug das variáveis de ambiente...');
  
  try {
    console.log('📡 Fazendo requisição para:', `${BASE_URL}/debug/env`);
    
    const response = await axios.get(`${BASE_URL}/debug/env`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Variáveis de ambiente no Vercel:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verificar se as variáveis críticas estão configuradas
    const data = response.data;
    if (data.SUPABASE_URL === 'Não configurada' || data.SUPABASE_SERVICE_ROLE_KEY === 'Não configurada') {
      console.log('\n❌ PROBLEMA CONFIRMADO: Variáveis do Supabase não estão configuradas no Vercel!');
      console.log('\n📋 Variáveis que precisam ser configuradas no Vercel:');
      console.log('- SUPABASE_URL');
      console.log('- SUPABASE_SERVICE_ROLE_KEY');
      console.log('- SUPABASE_ANON_KEY (opcional)');
    } else {
      console.log('\n✅ Variáveis do Supabase estão configuradas corretamente!');
    }
    
  } catch (error) {
    console.log('❌ Erro ao testar endpoint de debug:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
  }
}

testDebugEndpoint();