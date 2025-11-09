const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração
const API_BASE_URL = 'http://localhost:5120';
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

// Inicializar Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Credenciais de teste
const testUser = {
  email: 'maumautremeterra@gmail.com',
  password: '12345678'
};

// Função para fazer login e obter token
async function loginAndGetToken() {
  try {
    console.log('🔐 Fazendo login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('📋 Resposta do login:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.session?.access_token) {
      console.log('✅ Login realizado com sucesso');
      return loginResponse.data.session.access_token;
    } else {
      throw new Error('Token não encontrado na resposta');
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.response?.data || error.message);
    return null;
  }
}

// Função para testar comentários com autenticação
async function testAuthenticatedComments() {
  console.log('🧪 Iniciando teste de comentários com autenticação...');
  
  // 1. Fazer login
  const token = await loginAndGetToken();
  if (!token) {
    console.log('❌ Não foi possível obter token de acesso');
    return;
  }
  
  // Configurar headers de autenticação
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 2. Buscar posts do blog
    console.log('\n📝 Testando busca de posts do blog...');
    const postsResponse = await axios.get(`${API_BASE_URL}/api/blog/posts`);
    console.log('✅ Posts encontrados:', postsResponse.data.length);
    
    if (postsResponse.data.length === 0) {
      console.log('❌ Nenhum post encontrado para testar comentários');
      return;
    }
    
    const firstPost = postsResponse.data[0];
    console.log('📄 Usando post:', firstPost.title);
    
    // 3. Buscar comentários existentes
    console.log('\n💬 Testando busca de comentários...');
    const commentsResponse = await axios.get(`${API_BASE_URL}/api/blog/${firstPost.id}/comments`);
    console.log('✅ Comentários encontrados:', commentsResponse.data.comments?.length || 0);
    
    // 4. Criar novo comentário
    console.log('\n➕ Testando criação de comentário autenticado...');
    const newComment = {
      content: `Comentário de teste autenticado criado em ${new Date().toLocaleString('pt-BR')}`
    };
    
    try {
      const createResponse = await axios.post(
        `${API_BASE_URL}/api/blog/${firstPost.id}/comments`,
        newComment,
        { headers: authHeaders }
      );
      
      console.log('✅ Comentário criado com sucesso!');
      console.log('🆔 ID do comentário:', createResponse.data.id);
      console.log('📝 Conteúdo:', createResponse.data.content);
      console.log('👤 Usuário:', createResponse.data.users?.username || createResponse.data.users?.email);
      
      // 5. Verificar se o comentário aparece na lista
      console.log('\n🔍 Verificando comentário na lista...');
      const updatedCommentsResponse = await axios.get(`${API_BASE_URL}/api/blog/${firstPost.id}/comments`);
      const savedComment = updatedCommentsResponse.data.comments?.find(c => c.id === createResponse.data.id);
      
      if (savedComment) {
        console.log('✅ Comentário encontrado na lista!');
        console.log('📝 Conteúdo salvo:', savedComment.content);
        console.log('👤 Autor salvo:', savedComment.users?.name || savedComment.users?.email);
      } else {
        console.log('❌ Comentário não encontrado na lista');
      }
      
      // 6. Testar curtir comentário
      console.log('\n❤️ Testando curtir comentário...');
      try {
        const likeResponse = await axios.post(
          `${API_BASE_URL}/api/blog/comments/${createResponse.data.id}/like`,
          {},
          { headers: authHeaders }
        );
        console.log('✅ Curtida realizada:', likeResponse.data.message);
        console.log('👍 Status:', likeResponse.data.liked ? 'Curtido' : 'Descurtido');
      } catch (likeError) {
        console.log('❌ Erro ao curtir:', likeError.response?.data || likeError.message);
      }
      
    } catch (createError) {
      console.log('❌ Erro ao criar comentário:', createError.response?.data || createError.message);
      if (createError.response?.status === 401) {
        console.log('🔒 Problema de autenticação - token pode estar inválido');
      }
    }
    
    // 7. Testar acesso direto ao Supabase
    console.log('\n🔗 Testando acesso direto ao Supabase...');
    const { data: supabaseComments, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_id', firstPost.id)
      .limit(5);
    
    if (error) {
      console.log('❌ Erro no Supabase:', error.message);
    } else {
      console.log('✅ Comentários via Supabase:', supabaseComments.length);
      if (supabaseComments.length > 0) {
        console.log('📋 Último comentário:', supabaseComments[0].content.substring(0, 50) + '...');
      }
    }
    
  } catch (error) {
    console.log('❌ Erro geral no teste:', error.message);
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📄 Dados:', error.response.data);
    }
  }
}

// Executar teste
testAuthenticatedComments().then(() => {
  console.log('\n🏁 Teste de comentários autenticados concluído');
}).catch(error => {
  console.log('💥 Erro fatal:', error.message);
});