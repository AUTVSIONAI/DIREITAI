const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://direitai-backend.vercel.app/api';
// const API_BASE_URL = 'http://localhost:5120/api'; // Para teste local

async function testProductCreation() {
  try {
    console.log('🧪 Testando criação de produto...');
    
    // 1. Fazer login primeiro
    console.log('\n1. Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@direitai.com',
      password: 'GTUVX809XLQ@'
    });
    
    console.log('✅ Login bem-sucedido');
    
    // Extrair token da resposta
    let token;
    if (loginResponse.data.access_token) {
      token = loginResponse.data.access_token;
    } else if (loginResponse.data.token) {
      token = loginResponse.data.token;
    } else if (loginResponse.data.session && loginResponse.data.session.access_token) {
      token = loginResponse.data.session.access_token;
    }
    
    if (!token) {
      console.error('❌ Token não encontrado na resposta do login');
      console.log('Resposta completa:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    console.log('🔑 Token extraído:', token.substring(0, 20) + '...');
    
    // 2. Tentar criar um produto
    console.log('\n2. Criando produto...');
    const productData = {
      name: 'Produto Teste',
      description: 'Descrição do produto teste',
      price: 29.99,
      category: 'Eletrônicos',
      stock_quantity: 10,
      image: 'https://example.com/image.jpg'
    };
    
    console.log('Dados do produto:', JSON.stringify(productData, null, 2));
    
    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/store/products`,
      productData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Produto criado com sucesso!');
    console.log('Resposta:', JSON.stringify(createResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testProductCreation();