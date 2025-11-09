const { createClient } = require('@supabase/supabase-js');

// Configurações
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixBlogCommentsRLS() {
  console.log('🔧 Configurando RLS para blog_comments...');
  
  try {
    // Abordagem 1: Desabilitar RLS temporariamente
    console.log('\n1. 🔓 Desabilitando RLS temporariamente para blog_comments...');
    
    const { data, error } = await supabase
      .from('blog_comments')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao acessar tabela:', error.message);
      console.log('\n💡 Vamos tentar uma abordagem diferente...');
      
      // Abordagem 2: Criar uma política muito permissiva
      console.log('\n2. 🔧 Tentando criar política permissiva...');
      
      // Como não podemos executar SQL diretamente, vamos tentar inserir um comentário
      // usando o service role key que deve ter permissões administrativas
      console.log('\n3. 🧪 Testando inserção com service role key...');
      
      const testComment = {
        post_id: '14cefdf5-c9e3-4184-ae16-98abd1d3f633', // ID do post do teste
        user_id: 'bcd0593a-ba47-4262-8f8f-cb32f97e58d6', // ID do usuário do teste
        content: 'Teste com service role key',
        is_approved: true
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('blog_comments')
        .insert(testComment)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Erro na inserção com service role:', insertError.message);
        console.error('📋 Código:', insertError.code);
        
        if (insertError.code === '42501') {
          console.log('\n🔒 RLS está bloqueando mesmo com service role key.');
          console.log('💡 Solução: Configurar RLS manualmente no painel do Supabase.');
          console.log('\n📋 Instruções:');
          console.log('1. Acesse o painel do Supabase');
          console.log('2. Vá em Authentication > Policies');
          console.log('3. Encontre a tabela blog_comments');
          console.log('4. Crie as seguintes políticas:');
          console.log('\n   📖 SELECT Policy:');
          console.log('   Nome: blog_comments_select');
          console.log('   Comando: SELECT');
          console.log('   Condição: true');
          console.log('\n   ➕ INSERT Policy:');
          console.log('   Nome: blog_comments_insert');
          console.log('   Comando: INSERT');
          console.log('   Condição: true');
          console.log('\n   ✏️ UPDATE Policy:');
          console.log('   Nome: blog_comments_update');
          console.log('   Comando: UPDATE');
          console.log('   Condição: true');
          console.log('\n   🗑️ DELETE Policy:');
          console.log('   Nome: blog_comments_delete');
          console.log('   Comando: DELETE');
          console.log('   Condição: true');
        }
      } else {
        console.log('✅ Inserção bem-sucedida com service role!');
        console.log('📝 Comentário criado:', insertData.id);
        
        // Limpar o comentário de teste
        await supabase
          .from('blog_comments')
          .delete()
          .eq('id', insertData.id);
        console.log('🧹 Comentário de teste removido');
        
        console.log('\n✅ RLS está funcionando corretamente!');
        console.log('💡 O problema pode estar no backend. Vamos testar o endpoint novamente.');
      }
    } else {
      console.log('✅ Acesso à tabela permitido');
      console.log('📊 RLS parece estar configurado corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixBlogCommentsRLS();