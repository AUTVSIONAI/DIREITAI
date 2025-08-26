const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'https://direitai-backend.vercel.app/api'; // Servidor Vercel (URL alternativa)

// Função para fazer login
async function login() {
  try {
    console.log('🔐 Fazendo login...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@direitai.com',
      password: 'GTUVX809XLQ@'
    });
    
    console.log('📋 Resposta completa do login:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('✅ Login bem-sucedido!');
      return response.data.token;
    } else if (response.data.session && response.data.session.access_token) {
      console.log('✅ Login bem-sucedido (formato Supabase)!');
      return response.data.session.access_token;
    } else {
      throw new Error('Login falhou - token não encontrado');
    }
  } catch (error) {
    console.error('❌ Erro no login:', error.response?.data || error.message);
    throw error;
  }
}

// Função para testar upload de imagem do blog
async function testBlogImageUpload(token) {
  try {
    console.log('\n📸 Testando upload de imagem do blog...');
    
    // Criar um buffer de imagem simples (PNG 1x1 pixel)
    const imageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-blog-image.png',
      contentType: 'image/png'
    });
    
    const response = await axios.post(`${API_BASE_URL}/upload/image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload de blog bem-sucedido:', {
      success: response.data.success,
      filename: response.data.data?.filename,
      url: response.data.data?.url
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro no upload de blog:', error.response?.data || error.message);
    throw error;
  }
}

// Função para testar upload de imagem de produto
async function testProductImageUpload(token) {
  try {
    console.log('\n🛍️ Testando upload de imagem de produto...');
    
    // Criar um buffer de imagem simples (PNG 1x1 pixel)
    const imageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
      0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'test-product-image.png',
      contentType: 'image/png'
    });
    
    const response = await axios.post(`${API_BASE_URL}/upload/product-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Upload de produto bem-sucedido:', {
      success: response.data.success,
      filename: response.data.data?.filename,
      url: response.data.data?.url
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro no upload de produto:', error.response?.data || error.message);
    throw error;
  }
}

// Função principal
async function main() {
  try {
    console.log('🚀 Iniciando teste de upload no Vercel com Supabase Storage...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    
    // Fazer login
    const token = await login();
    
    // Testar uploads
    await testBlogImageUpload(token);
    await testProductImageUpload(token);
    
    console.log('\n🎉 Todos os testes de upload foram bem-sucedidos!');
  } catch (error) {
    console.error('\n💥 Teste falhou:', error.message);
    process.exit(1);
  }
}

// Executar o teste
main();