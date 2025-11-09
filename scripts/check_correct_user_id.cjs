const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração
const supabaseUrl = process.env.SUPABASE_URL || 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function checkCorrectUserId() {
  console.log('🔍 Verificando IDs corretos na tabela users...');
  
  try {
    // Buscar todos os usuários
    console.log('\n1. 📊 Listando todos os usuários na tabela users...');
    const { data: users, error: usersError } = await adminSupabase
      .from('users')
      .select('id, auth_id, username, email, full_name, role')
      .limit(10);
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log('👥 Usuários encontrados:', users?.length || 0);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ID: ${user.id}`);
        console.log(`      Auth ID: ${user.auth_id}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Full Name: ${user.full_name}`);
        console.log(`      Role: ${user.role}`);
      });
      
      // Usar o primeiro usuário para teste
      const testUserId = users[0].id;
      console.log(`\n2. 🧪 Testando inserção de comentário com user_id correto: ${testUserId}`);
      
      const testComment = {
        post_id: '14cefdf5-c9e3-4184-ae16-98abd1d3f633',
        user_id: testUserId,
        content: 'Teste com user_id correto da tabela users',
        is_approved: true
      };
      
      const { data: comment, error: commentError } = await adminSupabase
        .from('blog_comments')
        .insert(testComment)
        .select()
        .single();
      
      if (commentError) {
        console.error('❌ Erro na inserção do comentário:', commentError.message);
        console.error('📋 Código:', commentError.code);
        console.error('📋 Detalhes:', commentError.details);
      } else {
        console.log('✅ Comentário inserido com sucesso!');
        console.log('📝 ID do comentário:', comment.id);
        console.log('👤 User ID usado:', comment.user_id);
        
        // Limpar o comentário de teste
        console.log('\n3. 🧹 Removendo comentário de teste...');
        const { error: deleteError } = await adminSupabase
          .from('blog_comments')
          .delete()
          .eq('id', comment.id);
        
        if (deleteError) {
          console.error('❌ Erro ao remover comentário:', deleteError.message);
        } else {
          console.log('✅ Comentário de teste removido!');
        }
      }
    } else {
      console.log('⚠️ Nenhum usuário encontrado na tabela users!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkCorrectUserId();