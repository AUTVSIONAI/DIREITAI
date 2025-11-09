const { createClient } = require('@supabase/supabase-js');

// Configurações
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createBlogCommentsTable() {
  console.log('🔧 Verificando e criando tabela blog_comments...');
  
  try {
    // Primeiro, vamos tentar fazer login para ter permissões administrativas
    console.log('\n1. 🔐 Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'maumautremeterra@gmail.com',
      password: '12345678'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    
    // Verificar se a tabela já existe
    console.log('\n2. 🔍 Verificando se a tabela blog_comments existe...');
    const { data: existingComments, error: checkError } = await supabase
      .from('blog_comments')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Tabela blog_comments já existe!');
      console.log('📊 Estrutura esperada:');
      console.log('   - id: uuid (primary key)');
      console.log('   - post_id: uuid (foreign key)');
      console.log('   - user_id: uuid (foreign key)');
      console.log('   - content: text');
      console.log('   - is_approved: boolean');
      console.log('   - likes_count: int4');
      console.log('   - created_at: timestamptz');
      console.log('   - updated_at: timestamptz');
      return;
    }
    
    console.log('⚠️ Tabela blog_comments não existe. Erro:', checkError.message);
    
    // Tentar criar a tabela usando SQL
    console.log('\n3. 🛠️ Tentando criar a tabela blog_comments...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS blog_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        post_id UUID NOT NULL REFERENCES politician_posts(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_approved BOOLEAN DEFAULT true,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Criar índices para melhor performance
      CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON blog_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON blog_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_blog_comments_approved ON blog_comments(is_approved);
      
      -- Criar trigger para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      CREATE TRIGGER update_blog_comments_updated_at
        BEFORE UPDATE ON blog_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });
    
    if (createError) {
      console.error('❌ Erro ao criar tabela via RPC:', createError.message);
      console.log('\n📋 SQL para executar manualmente no Supabase:');
      console.log(createTableSQL);
      console.log('\n💡 Instruções:');
      console.log('1. Acesse o painel do Supabase');
      console.log('2. Vá para SQL Editor');
      console.log('3. Execute o SQL acima');
      return;
    }
    
    console.log('✅ Tabela blog_comments criada com sucesso!');
    
    // Verificar se a criação foi bem-sucedida
    console.log('\n4. ✅ Verificando criação da tabela...');
    const { data: verifyComments, error: verifyError } = await supabase
      .from('blog_comments')
      .select('id')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Erro ao verificar tabela:', verifyError.message);
    } else {
      console.log('✅ Tabela blog_comments verificada e funcionando!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n📋 Estrutura da tabela blog_comments necessária:');
    console.log('- id: uuid (primary key)');
    console.log('- post_id: uuid (foreign key para politician_posts)');
    console.log('- user_id: uuid (foreign key para users)');
    console.log('- content: text');
    console.log('- is_approved: boolean');
    console.log('- likes_count: int4');
    console.log('- created_at: timestamptz');
    console.log('- updated_at: timestamptz');
  }
}

createBlogCommentsTable();