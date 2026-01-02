
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL ou Key não encontrados.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBlogLike() {
  console.log('Iniciando teste de likes no blog (Service Role)...');

  // 1. Buscar um post
  let { data: posts } = await supabase.from('blog_posts').select('id').limit(1);
  let postId;
  
  if (!posts || posts.length === 0) {
    console.log('Nenhum post encontrado. Criando post de teste...');
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users[0].id;
    
    const { data: newPost, error: createError } = await supabase.from('blog_posts').insert({
        title: 'Post de Teste',
        content: 'Conteúdo de teste',
        author_id: userId,
        slug: 'post-teste-' + Date.now(),
        published: true
    }).select().single();
    
    if (createError) {
        console.error('Erro ao criar post de teste:', createError);
        return;
    }
    postId = newPost.id;
  } else {
    postId = posts[0].id;
  }
  
  console.log(`Usando post ID: ${postId}`);

  // 2. Buscar um usuário (vamos usar o primeiro que encontrarmos ou criar um teste se precisarmos autenticar)
  // Como estamos usando script, não temos sessão autenticada via Auth. 
  // O RLS provavelmente exige que o usuário esteja autenticado para dar like.
  // Vamos tentar logar primeiro.
  
  const email = 'testuser_' + Date.now() + '@example.com';
  const password = 'password123';
  
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });
  
  let userId;
  if (authError) {
      // Tentar login se já existe
       const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginError) {
          console.log("Tentando usar um usuário existente do banco...");
          const { data: users } = await supabase.from('users').select('id').limit(1);
          if (users && users.length > 0) {
             // userId = users[0].id; // Isso não vai funcionar com RLS se não estivermos logados como ele.
             console.error("Não foi possível criar/logar usuário de teste. RLS vai bloquear.");
             // Mas podemos tentar inserir direto se tivermos a service role key.
             // O objetivo é testar se a TABELA aceita inserts.
          }
      } else {
          userId = loginData.user.id;
      }
  } else {
      userId = authData.user.id;
  }
  
  if (!userId) {
      // Fallback para service role key para testar a tabela em si
      console.log("Usando Service Role Key para testar insert direto (bypassing RLS)...");
      const sbAdmin = createClient(supabaseUrl, envConfig.SUPABASE_SERVICE_ROLE_KEY);
      
      const { data: users } = await sbAdmin.from('users').select('id').limit(1);
      const targetUserId = users[0].id;
      
      const { error: insertError } = await sbAdmin
        .from('blog_post_likes')
        .upsert({ 
            post_id: postId, 
            user_id: targetUserId 
        }, { onConflict: 'post_id, user_id' }); // Verifique a constraint correta

      if (insertError) {
        console.error('Erro ao inserir like (Service Role):', insertError);
      } else {
        console.log('Sucesso ao inserir like com Service Role!');
      }
      return;
  }

  console.log(`Usuário autenticado: ${userId}`);

  // 3. Tentar inserir like como usuário autenticado
  const { error: likeError } = await supabase
    .from('blog_post_likes')
    .upsert({ 
        post_id: postId, 
        user_id: userId 
    });

  if (likeError) {
    console.error('Erro ao inserir like (Authenticated):', likeError);
  } else {
    console.log('Sucesso ao inserir like como usuário autenticado!');
  }
}

testBlogLike();
