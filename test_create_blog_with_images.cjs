const axios = require('axios');

async function createBlogWithImages() {
  try {
    console.log('🔐 Fazendo login...');
    
    // Login
    const loginResponse = await axios.post('https://direitai-backend.vercel.app/api/auth/login', {
      email: 'admin@direitai.com',
      password: 'GTUVX809XLQ@'
    });
    
    console.log('✅ Login realizado com sucesso');
    
    // Extrair token
    let token = null;
    if (loginResponse.data.access_token) {
      token = loginResponse.data.access_token;
    } else if (loginResponse.data.token) {
      token = loginResponse.data.token;
    } else if (loginResponse.data.session && loginResponse.data.session.access_token) {
      token = loginResponse.data.session.access_token;
    }
    
    if (!token) {
      console.error('❌ Token não encontrado na resposta do login');
      return;
    }
    
    console.log('🔑 Token extraído com sucesso');
    
    // Criar post com conteúdo HTML que inclui imagens
    const postData = {
      title: 'Post de Teste com Imagens',
      slug: 'post-teste-com-imagens',
      content: `
        <p>Este é um post de teste com imagens no conteúdo.</p>
        <img src="/uploads/test-image-1.jpg" alt="Imagem de teste 1" style="width: 100%; max-width: 600px;" />
        <p>Aqui temos mais texto entre as imagens.</p>
        <img src="https://via.placeholder.com/400x300" alt="Imagem externa" style="width: 100%; max-width: 400px;" />
        <p>E aqui uma imagem com URL relativa:</p>
        <img src="./assets/images/local-image.jpg" alt="Imagem local" />
        <p>Fim do conteúdo de teste.</p>
      `,
      excerpt: 'Post de teste para verificar como as imagens são exibidas no conteúdo.',
      cover_image_url: 'https://via.placeholder.com/800x400',
      status: 'published',
      published_at: new Date().toISOString()
    };
    
    console.log('📝 Criando post com imagens...');
    
    const createResponse = await axios.post(
      'https://direitai-backend.vercel.app/api/blog',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Post criado com sucesso!');
    console.log('📄 Detalhes do post:');
    console.log('- ID:', createResponse.data.id);
    console.log('- Título:', createResponse.data.title);
    console.log('- Slug:', createResponse.data.slug);
    
    // Verificar o conteúdo criado
    console.log('\n🔍 Verificando conteúdo HTML criado:');
    console.log(createResponse.data.content);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

createBlogWithImages();