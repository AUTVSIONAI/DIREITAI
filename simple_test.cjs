const axios = require('axios');

async function testSimpleEndpoints() {
  console.log('🧪 Testando endpoints simples...\n');
  
  const BASE_URL = 'https://direitai-backend.vercel.app';
  
  // Teste 1: Health check
  try {
    console.log('📡 Testando /health...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Status:', response.status);
    console.log('📊 Resposta:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erro no /health:', error.response?.data || error.message);
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Teste 2: Politicians (sem filtros)
  try {
    console.log('📡 Testando /api/politicians...');
    const response = await axios.get(`${BASE_URL}/api/politicians`);
    console.log('✅ Status:', response.status);
    console.log('📊 Resposta (primeiros 200 chars):', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ Erro no /api/politicians:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Teste 3: Manifestations (sem filtros)
  try {
    console.log('📡 Testando /api/manifestations...');
    const response = await axios.get(`${BASE_URL}/api/manifestations`);
    console.log('✅ Status:', response.status);
    console.log('📊 Resposta (primeiros 200 chars):', JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ Erro no /api/manifestations:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
  
  console.log('\n🏁 Testes concluídos!');
}

testSimpleEndpoints().catch(console.error);