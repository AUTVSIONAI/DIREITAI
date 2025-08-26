const axios = require('axios');

async function testBlogContent() {
  try {
    console.log('🔍 Testando conteúdo do blog...');
    
    // Buscar posts do blog
    const response = await axios.get('https://direitai-backend.vercel.app/api/blog/posts');
    
    if (response.data && response.data.length > 0) {
      const post = response.data[0]; // Pegar o primeiro post
      
      console.log('📝 Post encontrado:');
      console.log('- Título:', post.title);
      console.log('- Slug:', post.slug);
      console.log('- Cover Image URL:', post.cover_image_url);
      console.log('- Featured Image URL:', post.featured_image_url);
      
      // Verificar o conteúdo HTML
      console.log('\n📄 Conteúdo HTML (primeiros 500 caracteres):');
      console.log(post.content ? post.content.substring(0, 500) + '...' : 'Sem conteúdo');
      
      // Procurar por tags de imagem no conteúdo
      if (post.content) {
        const imgTags = post.content.match(/<img[^>]*>/g);
        if (imgTags) {
          console.log('\n🖼️ Tags de imagem encontradas no conteúdo:');
          imgTags.forEach((tag, index) => {
            console.log(`${index + 1}:`, tag);
          });
        } else {
          console.log('\n❌ Nenhuma tag de imagem encontrada no conteúdo');
        }
        
        // Procurar por URLs de imagem
        const imageUrls = post.content.match(/src=["']([^"']*)["']/g);
        if (imageUrls) {
          console.log('\n🔗 URLs de imagem encontradas:');
          imageUrls.forEach((url, index) => {
            console.log(`${index + 1}:`, url);
          });
        }
      }
      
    } else {
      console.log('❌ Nenhum post encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar conteúdo do blog:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testBlogContent();