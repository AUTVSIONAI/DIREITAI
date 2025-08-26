const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://direitai-backend.vercel.app/api';
// const API_BASE_URL = 'http://localhost:5120/api'; // Para teste local

async function testPublicProducts() {
  try {
    console.log('🧪 Testando endpoint público de produtos...');
    
    // Testar endpoint público de produtos
    console.log('\n📦 Buscando produtos públicos...');
    const response = await axios.get(`${API_BASE_URL}/store/products`);
    
    console.log('✅ Produtos encontrados:', response.data.products.length);
    
    if (response.data.products.length > 0) {
      console.log('\n📋 Primeiros 3 produtos:');
      response.data.products.slice(0, 3).forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - R$ ${product.price}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Status: ${product.active ? 'Ativo' : 'Inativo'}`);
        console.log(`   Categoria: ${product.category}`);
        console.log(`   Criado em: ${product.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum produto encontrado!');
    }
    
    // Testar com filtros
    console.log('\n🔍 Testando busca por categoria "Eletrônicos"...');
    const categoryResponse = await axios.get(`${API_BASE_URL}/store/products?category=Eletrônicos`);
    console.log('✅ Produtos na categoria "Eletrônicos":', categoryResponse.data.products.length);
    
    if (categoryResponse.data.products.length > 0) {
      categoryResponse.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - R$ ${product.price}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Executar o teste
testPublicProducts();