const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configurações
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBlogViews() {
  console.log('🔍 Testando sistema de visualizações do blog...');
  
  try {
    // 1. Verificar se as tabelas existem
    console.log('\n1. 📋 Verificando tabelas necessárias...');
    
    // Verificar tabela blog_post_views
    const { data: viewsTable, error: viewsError } = await supabase
      .from('blog_post_views')
      .select('*')
      .limit(1);
    
    if (viewsError) {
      console.log('❌ Tabela blog_post_views não existe:', viewsError.message);
    } else {
      console.log('✅ Tabela blog_post_views existe');
    }
    
    // Verificar tabela blog_post_shares
    const { data: sharesTable, error: sharesError } = await supabase
      .from('blog_post_shares')
      .select('*')
      .limit(1);
    
    if (sharesError) {
      console.log('❌ Tabela blog_post_shares não existe:', sharesError.message);
    } else {
      console.log('✅ Tabela blog_post_shares existe');
    }
    
    // 2. Buscar um post para testar
    console.log('\n2. 📝 Buscando posts disponíveis...');
    const { data: posts, error: postsError } = await supabase
      .from('politician_posts')
      .select('id, title, views, shares_count')
      .eq('is_published', true)
      .limit(3);
    
    if (postsError || !posts || posts.length === 0) {
      console.log('❌ Nenhum post encontrado:', postsError?.message);
      return;
    }
    
    console.log('✅ Posts encontrados:');
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post.title} (ID: ${post.id})`);
      console.log(`      Views: ${post.views || 0}, Shares: ${post.shares_count || 0}`);
    });
    
    const testPost = posts[0];
    console.log(`\n📌 Usando post para teste: ${testPost.title}`);
    
    // 3. Testar endpoint de visualização via backend
    console.log('\n3. 👁️ Testando endpoint de visualização...');
    try {
      const response = await axios.post(`http://localhost:5120/api/blog/${testPost.id}/view`, {
        ip: '192.168.1.100'
      });
      console.log('✅ Endpoint de visualização funcionou:', response.data);
    } catch (error) {
      console.log('❌ Erro no endpoint de visualização:', error.response?.data || error.message);
    }
    
    // 4. Verificar se as funções RPC existem
    console.log('\n4. ⚙️ Testando funções RPC...');
    
    // Testar increment_views_count
    try {
      const { data: viewsRpc, error: viewsRpcError } = await supabase
        .rpc('increment_views_count', { post_id: testPost.id });
      
      if (viewsRpcError) {
        console.log('❌ Função increment_views_count não existe:', viewsRpcError.message);
      } else {
        console.log('✅ Função increment_views_count funcionou');
      }
    } catch (error) {
      console.log('❌ Erro ao testar increment_views_count:', error.message);
    }
    
    // Testar increment_shares_count
    try {
      const { data: sharesRpc, error: sharesRpcError } = await supabase
        .rpc('increment_shares_count', { post_id: testPost.id });
      
      if (sharesRpcError) {
        console.log('❌ Função increment_shares_count não existe:', sharesRpcError.message);
      } else {
        console.log('✅ Função increment_shares_count funcionou');
      }
    } catch (error) {
      console.log('❌ Erro ao testar increment_shares_count:', error.message);
    }
    
    // 5. Verificar contadores atuais
    console.log('\n5. 📊 Verificando contadores atuais...');
    const { data: updatedPost, error: updateError } = await supabase
      .from('politician_posts')
      .select('id, title, views, shares_count')
      .eq('id', testPost.id)
      .single();
    
    if (updateError) {
      console.log('❌ Erro ao buscar post atualizado:', updateError.message);
    } else {
      console.log('📈 Contadores atuais:');
      console.log(`   Views: ${updatedPost.views || 0}`);
      console.log(`   Shares: ${updatedPost.shares_count || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testBlogViews();