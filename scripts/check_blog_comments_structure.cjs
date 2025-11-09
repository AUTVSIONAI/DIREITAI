const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração igual ao backend
const supabaseUrl = process.env.SUPABASE_URL || 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

// Admin client com service role key
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function checkBlogCommentsStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela blog_comments...');
    
    // Consultar informações sobre foreign keys da tabela blog_comments
    const { data: foreignKeys, error: fkError } = await adminSupabase
      .rpc('sql', {
        query: `
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            ccu.table_schema AS foreign_table_schema
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
          WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'blog_comments';
        `
      });
    
    if (fkError) {
      console.error('❌ Erro ao consultar foreign keys:', fkError);
    } else {
      console.log('🔗 Foreign keys da tabela blog_comments:');
      console.log(JSON.stringify(foreignKeys, null, 2));
    }
    
    // Verificar se user_id deve referenciar auth.users em vez de public.users
    console.log('\n🔍 Testando inserção com auth_id...');
    
    const postId = '14cefdf5-c9e3-4184-ae16-98abd1d3f633';
    const authId = '0155ccb7-e67f-41dc-a133-188f97996b73'; // auth_id do usuário
    const content = 'Teste com auth_id - ' + new Date().toISOString();
    
    const { data: commentWithAuthId, error: authIdError } = await adminSupabase
      .from('blog_comments')
      .insert({
        post_id: postId,
        user_id: authId, // Usando auth_id em vez de user table id
        content: content,
        is_approved: true
      })
      .select()
      .single();
    
    if (authIdError) {
      console.error('❌ Erro ao inserir com auth_id:', authIdError);
    } else {
      console.log('✅ Comentário inserido com auth_id:', commentWithAuthId);
      
      // Limpar o comentário de teste
      await adminSupabase
        .from('blog_comments')
        .delete()
        .eq('id', commentWithAuthId.id);
      
      console.log('🧹 Comentário de teste removido');
    }
    
    // Verificar comentários existentes para ver qual formato de ID está sendo usado
    console.log('\n🔍 Verificando comentários existentes...');
    const { data: existingComments, error: existingError } = await adminSupabase
      .from('blog_comments')
      .select('id, user_id, content')
      .limit(5);
    
    if (existingError) {
      console.error('❌ Erro ao buscar comentários existentes:', existingError);
    } else {
      console.log('📝 Comentários existentes:');
      existingComments.forEach(comment => {
        console.log(`  ID: ${comment.id}`);
        console.log(`  User ID: ${comment.user_id}`);
        console.log(`  Content: ${comment.content.substring(0, 50)}...`);
        console.log('  ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar verificação
checkBlogCommentsStructure();