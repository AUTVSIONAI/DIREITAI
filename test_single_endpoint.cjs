const axios = require('axios');

const BASE_URL = 'https://direitai-backend.vercel.app';

async function testSingleEndpoint() {
  console.log('🧪 Testando endpoint /api/politicians com logs detalhados...');
  
  try {
    console.log('📡 Fazendo requisição para:', `${BASE_URL}/api/politicians`);
    
    const response = await axios.get(`${BASE_URL}/api/politicians`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Test-Script/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ Status:', response.status);
    console.log('📊 Headers:', response.headers);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Erro detalhado:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
    
    if (error.response?.status === 500) {
      console.log('\n🔍 Erro 500 detectado - verifique os logs do Vercel em tempo real!');
      console.log('Acesse: https://vercel.com/dashboard > Projeto > Functions > View Function Logs');
    }
  }
}

testSingleEndpoint();