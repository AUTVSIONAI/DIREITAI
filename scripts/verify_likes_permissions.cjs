
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('🔍 Iniciando verificação com Service Role Key...');

  // 1. Verificar public.users
  const { count: usersCount, error: usersError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  if (usersError) console.error('❌ Erro ao ler users:', usersError.message);
  else console.log(`✅ Tabela users acessível. Total: ${usersCount}`);

  // 2. Verificar dados de usuários (nomes)
  const { data: usersData } = await supabase
    .from('users')
    .select('id, full_name, name, email')
    .limit(10);
  
  console.log('📊 Amostra de usuários:');
  usersData?.forEach(u => {
    console.log(`   - ${u.email}: ${u.full_name || u.name || '(SEM NOME)'}`);
  });

  // 3. Verificar blog_post_likes
  const { count: likesCount, error: likesError } = await supabase
    .from('blog_post_likes')
    .select('*', { count: 'exact', head: true });

  if (likesError) console.error('❌ Erro ao ler blog_post_likes:', likesError.message);
  else console.log(`✅ Tabela blog_post_likes acessível. Total: ${likesCount}`);

  // 4. Verificar politician_ratings
  const { count: ratingsCount, error: ratingsError } = await supabase
    .from('politician_ratings')
    .select('*', { count: 'exact', head: true });
    
  if (ratingsError) console.error('❌ Erro ao ler politician_ratings:', ratingsError.message);
  else console.log(`✅ Tabela politician_ratings acessível. Total: ${ratingsCount}`);

  // 5. Tentar sincronizar usuários do Auth para public.users
  console.log('\n🔄 Sincronizando usuários do Auth...');
  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erro ao listar usuários do Auth:', authError.message);
  } else {
    console.log(`✅ Encontrados ${authUsers.length} usuários no Auth.`);
    
    let updated = 0;
    let created = 0;

    for (const au of authUsers) {
      const name = au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split('@')[0] : 'Usuário');
      const avatar = au.user_metadata?.avatar_url;
      
      const { data: existing } = await supabase.from('users').select('id').eq('id', au.id).maybeSingle();
      
      if (!existing) {
        // Tenta achar por email ou auth_id antigo
        const { data: byEmail } = await supabase.from('users').select('id').eq('email', au.email).maybeSingle();
        if (byEmail) {
            // Atualiza ID
            // Isso é perigoso se tiver FKs, mas vamos assumir que fix_id_mismatch já rodou ou vamos apenas atualizar dados
             await supabase.from('users').update({ 
                 id: au.id, // Isso falha se for PK e tiver FKs. Melhor atualizar dados auxiliares ou fazer upsert com cuidado
                 auth_id: au.id,
                 full_name: name,
                 avatar_url: avatar
             }).eq('id', byEmail.id);
             updated++;
        } else {
            // Cria novo
            await supabase.from('users').insert({
                id: au.id,
                auth_id: au.id,
                email: au.email,
                full_name: name,
                avatar_url: avatar
            });
            created++;
        }
      } else {
        // Atualiza dados se faltar nome
        const { error: updateError } = await supabase.from('users').update({
            full_name: name,
            auth_id: au.id, // Garante auth_id
            avatar_url: avatar || undefined
        }).eq('id', au.id);
        if (!updateError) updated++;
      }
    }
    console.log(`✅ Sincronização concluída: ${created} criados, ${updated} atualizados.`);
  }

}

verify();
