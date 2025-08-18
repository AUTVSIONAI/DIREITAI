const axios = require('axios');

const BASE_URL = 'https://direitai-backend.vercel.app';

// Função para testar endpoint
async function testEndpoint(method, url, description, data = null, headers = {}) {
  try {
    console.log(`\n${description}...`);
    const config = {
      method,
      url,
      headers,
      ...(data && { data })
    };
    
    const response = await axios(config);
    console.log(`✅ Status: ${response.status}`);
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    return response;
  } catch (error) {
    console.log(`❌ Status: ${error.response?.status || 'Erro de rede'}`);
    console.log('Erro:', error.response?.data || error.message);
    return error.response;
  }
}

async function testCheckoutFlow() {
  console.log('🧪 Testando fluxo completo de checkout...');

  // 1. Primeiro, vamos tentar fazer login para obter um token
  console.log('\n1. Tentando fazer login para obter token...');
  const loginResponse = await testEndpoint(
    'POST',
    `${BASE_URL}/api/auth/login`,
    'Login de teste',
    {
      email: 'test@example.com',
      password: 'testpassword'
    }
  );

  // 2. Testar checkout sem token
  await testEndpoint(
    'POST',
    `${BASE_URL}/api/payments/checkout`,
    'Checkout sem token (deve retornar 401)',
    { planId: 'engajado' }
  );

  // 3. Verificar se as variáveis do Stripe estão configuradas
  console.log('\n3. Verificando configuração do Stripe...');
  const stripeCheckResponse = await testEndpoint(
    'GET',
    `${BASE_URL}/api/debug/stripe-config`,
    'Verificar configuração do Stripe'
  );

  // 4. Testar endpoint de debug específico para Stripe
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/debug/env`,
    'Debug de todas as variáveis de ambiente'
  );

  // 5. Testar health check
  await testEndpoint(
    'GET',
    `${BASE_URL}/api/health`,
    'Health check'
  );

  console.log('\n🏁 Teste completo finalizado!');
}

testCheckoutFlow().catch(console.error);