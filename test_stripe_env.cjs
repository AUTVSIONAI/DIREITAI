const axios = require('axios');

const BASE_URL = 'https://direitai-backend.vercel.app';

async function testStripeEnv() {
  console.log('🔍 Verificando variáveis de ambiente do Stripe...\n');

  try {
    // Criar um endpoint temporário para verificar as variáveis do Stripe
    const response = await axios.get(`${BASE_URL}/debug/env`);
    const env = response.data;
    
    console.log('Variáveis de ambiente encontradas:');
    console.log('- NODE_ENV:', env.NODE_ENV);
    console.log('- SUPABASE_URL:', env.SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada');
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não configurada');
    console.log('- SUPABASE_ANON_KEY:', env.SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Não configurada');
    
    // Verificar se as variáveis do Stripe estão presentes
    console.log('\n🔑 Variáveis do Stripe:');
    console.log('- STRIPE_SECRET_KEY:', env.STRIPE_SECRET_KEY ? '✅ Configurada' : '❌ NÃO CONFIGURADA');
    console.log('- STRIPE_WEBHOOK_SECRET:', env.STRIPE_WEBHOOK_SECRET ? '✅ Configurada' : '❌ NÃO CONFIGURADA');
    console.log('- FRONTEND_URL:', env.FRONTEND_URL ? '✅ Configurada' : '❌ NÃO CONFIGURADA');
    
    if (!env.STRIPE_SECRET_KEY) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: STRIPE_SECRET_KEY não está configurada no Vercel!');
      console.log('Isso explica o erro 400 no checkout.');
    }
    
    if (!env.FRONTEND_URL) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: FRONTEND_URL não está configurada no Vercel!');
      console.log('Isso pode causar problemas nas URLs de sucesso/cancelamento.');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar variáveis de ambiente:', error.response?.data || error.message);
  }
}

testStripeEnv();