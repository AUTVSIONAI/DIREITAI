
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

// Tenta pegar do arquivo .env ou do ambiente
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais não encontradas. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Verificando tabelas...');

  // 1. Verificar public.users
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (usersError) {
    console.error('❌ Erro ao acessar users:', usersError.message);
  } else {
    console.log('✅ Tabela users acessível.');
    if (users.length > 0) {
      console.log('   Colunas:', Object.keys(users[0]).join(', '));
    } else {
      console.log('   Tabela users está vazia.');
    }
  }

  // 2. Verificar public.blog_post_likes
  const { data: likes, error: likesError } = await supabase
    .from('blog_post_likes')
    .select('*')
    .limit(1);

  if (likesError) {
    console.error('❌ Erro ao acessar blog_post_likes:', likesError.message);
  } else {
    console.log('✅ Tabela blog_post_likes acessível.');
     if (likes.length > 0) {
      console.log('   Colunas:', Object.keys(likes[0]).join(', '));
    } else {
      console.log('   Tabela blog_post_likes está vazia.');
    }
  }

  // 3. Verificar public.politician_ratings
  const { data: ratings, error: ratingsError } = await supabase
    .from('politician_ratings')
    .select('*')
    .limit(1);

  if (ratingsError) {
    console.error('❌ Erro ao acessar politician_ratings:', ratingsError.message);
  } else {
    console.log('✅ Tabela politician_ratings acessível.');
  }

  // 4. Testar inserção em users (simulada)
  // Não vamos inserir, apenas verificar se RLS permite (mas como estamos com service role, vai permitir)
  console.log('ℹ️ Usando Service Role Key, RLS é ignorado neste teste.');
}

checkTables();
