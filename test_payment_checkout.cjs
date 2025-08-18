const axios = require('axios');

const BASE_URL = 'https://direitai-backend.vercel.app';

async function testPaymentCheckout() {
  console.log('🧪 Testando endpoint de checkout de pagamentos...\n');

  try {
    // Teste 1: Checkout sem autenticação (deve retornar 401)
    console.log('1. Testando checkout sem autenticação...');
    try {
      const response = await axios.post(`${BASE_URL}/api/payments/checkout`, {
        planId: 'engajado'
      });
      console.log('❌ Erro: Deveria retornar 401 sem autenticação');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Retornou 401 como esperado (sem autenticação)');
      } else {
        console.log(`❌ Status inesperado: ${error.response?.status}`);
        console.log('Erro:', error.response?.data || error.message);
      }
    }

    // Teste 2: Checkout com plano inválido
    console.log('\n2. Testando checkout com plano inválido...');
    try {
      const response = await axios.post(`${BASE_URL}/api/payments/checkout`, {
        planId: 'plano_inexistente'
      });
      console.log('❌ Erro: Deveria retornar 400 para plano inválido');
    } catch (error) {
      console.log(`Status: ${error.response?.status}`);
      console.log('Resposta:', error.response?.data);
    }

    // Teste 3: Verificar se as variáveis de ambiente estão configuradas
    console.log('\n3. Testando health check...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      console.log('✅ Health check OK:', response.data);
    } catch (error) {
      console.log('❌ Health check falhou:', error.response?.data || error.message);
    }

    // Teste 4: Verificar endpoint de debug de env
    console.log('\n4. Testando debug de variáveis de ambiente...');
    try {
      const response = await axios.get(`${BASE_URL}/debug/env`);
      console.log('Debug env:', response.data);
    } catch (error) {
      console.log('❌ Debug env falhou:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testPaymentCheckout();