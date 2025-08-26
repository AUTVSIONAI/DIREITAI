const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://direitai-backend.vercel.app/api';

async function testFrontendAPI() {
  try {
    console.log('🧪 Testando a mesma URL que o frontend usa...');
    console.log('🔗 URL Base:', API_BASE_URL);
    
    // Testar endpoint exato que o frontend usa
    console.log('\n📦 Testando GET /store/products (mesmo endpoint do frontend)...');
    const response = await axios.get(`${API_BASE_URL}/store/products`);
    
    console.log('✅ Status:', response.status);
    console.log('✅ Produtos encontrados:', response.data.products?.length || 0);
    
    if (response.data.products && response.data.products.length > 0) {
      console.log('\n📋 Produtos encontrados:');
      response.data.products.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - R$ ${product.price}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Ativo: ${product.active}`);
        console.log(`   Categoria: ${product.category}`);
        console.log(`   Criado em: ${product.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum produto encontrado na resposta!');
      console.log('📄 Resposta completa:', JSON.stringify(response.data, null, 2));
    }
    
    // Testar endpoint de categorias também
    console.log('\n🏷️ Testando GET /store/categories...');
    try {
      const categoriesResponse = await axios.get(`${API_BASE_URL}/store/categories`);
      console.log('✅ Categorias Status:', categoriesResponse.status);
      console.log('✅ Categorias encontradas:', categoriesResponse.data.categories?.length || 0);
      
      if (categoriesResponse.data.categories) {
        console.log('📋 Categorias:', categoriesResponse.data.categories);
      }
    } catch (catError) {
      console.log('❌ Erro ao buscar categorias:', catError.response?.status, catError.response?.data || catError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:');
    console.error('Status:', error.response?.status);
    console.error('Dados:', error.response?.data);
    console.error('Mensagem:', error.message);
    
    if (error.response?.status === 404) {
      console.log('\n🔍 Endpoint não encontrado. Vamos verificar se existe...');
    }
  }
}

testFrontendAPI();