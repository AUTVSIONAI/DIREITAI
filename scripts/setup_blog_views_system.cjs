const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBlogViewsSystem() {
  console.log('🔧 Configurando sistema de visualizações do blog...');
  
  try {
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'create_blog_views_system.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Arquivo SQL carregado com sucesso');
    
    // Dividir o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`);
    
    // Executar cada comando individualmente
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      if (command.length < 10) continue; // Pular comandos muito pequenos
      
      console.log(`\n${i + 1}. Executando comando...`);
      
      try {
        // Tentar executar via RPC primeiro
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: command + ';'
        });
        
        if (error) {
          console.log(`❌ Erro via RPC: ${error.message}`);
          console.log(`📋 Comando: ${command.substring(0, 100)}...`);
        } else {
          console.log(`✅ Comando executado com sucesso`);
        }
      } catch (rpcError) {
        console.log(`❌ Erro ao executar comando: ${rpcError.message}`);
        console.log(`📋 Comando: ${command.substring(0, 100)}...`);
      }
    }
    
    // Verificar se as estruturas foram criadas
    console.log('\n🔍 Verificando estruturas criadas...');
    
    // Verificar colunas adicionadas
    const { data: posts, error: postsError } = await supabase
      .from('politician_posts')
      .select('id, views, shares_count')
      .limit(1);
    
    if (postsError) {
      console.log('❌ Erro ao verificar colunas:', postsError.message);
    } else {
      console.log('✅ Colunas views e shares_count verificadas');
    }
    
    // Verificar tabela blog_post_views
    const { data: views, error: viewsError } = await supabase
      .from('blog_post_views')
      .select('*')
      .limit(1);
    
    if (viewsError) {
      console.log('❌ Tabela blog_post_views:', viewsError.message);
    } else {
      console.log('✅ Tabela blog_post_views criada');
    }
    
    // Verificar tabela blog_post_shares
    const { data: shares, error: sharesError } = await supabase
      .from('blog_post_shares')
      .select('*')
      .limit(1);
    
    if (sharesError) {
      console.log('❌ Tabela blog_post_shares:', sharesError.message);
    } else {
      console.log('✅ Tabela blog_post_shares criada');
    }
    
    // Testar funções RPC
    console.log('\n⚙️ Testando funções RPC...');
    
    // Buscar um post para testar
    const { data: testPosts, error: testError } = await supabase
      .from('politician_posts')
      .select('id')
      .eq('is_published', true)
      .limit(1);
    
    if (testError || !testPosts || testPosts.length === 0) {
      console.log('❌ Nenhum post encontrado para teste');
    } else {
      const testPostId = testPosts[0].id;
      
      // Testar increment_views_count
      try {
        const { error: viewsRpcError } = await supabase
          .rpc('increment_views_count', { post_id: testPostId });
        
        if (viewsRpcError) {
          console.log('❌ Função increment_views_count:', viewsRpcError.message);
        } else {
          console.log('✅ Função increment_views_count funcionando');
        }
      } catch (error) {
        console.log('❌ Erro ao testar increment_views_count:', error.message);
      }
      
      // Testar increment_shares_count
      try {
        const { error: sharesRpcError } = await supabase
          .rpc('increment_shares_count', { post_id: testPostId });
        
        if (sharesRpcError) {
          console.log('❌ Função increment_shares_count:', sharesRpcError.message);
        } else {
          console.log('✅ Função increment_shares_count funcionando');
        }
      } catch (error) {
        console.log('❌ Erro ao testar increment_shares_count:', error.message);
      }
    }
    
    console.log('\n🎉 Configuração do sistema de visualizações concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Verificar se todas as estruturas foram criadas corretamente');
    console.log('2. Testar os endpoints de visualização e compartilhamento');
    console.log('3. Verificar se os contadores estão sendo atualizados');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    
    console.log('\n📋 SQL para executar manualmente no Supabase:');
    try {
      const sqlPath = path.join(__dirname, 'create_blog_views_system.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      console.log(sqlContent);
    } catch (readError) {
      console.log('❌ Erro ao ler arquivo SQL:', readError.message);
    }
  }
}

setupBlogViewsSystem();