
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUsers() {
  console.log('🔄 Iniciando sincronização de usuários...');

  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erro ao listar usuários do Auth:', authError.message);
    return;
  }

  console.log(`✅ Encontrados ${authUsers.length} usuários no Auth.`);
  
  let updated = 0;
  let created = 0;

  for (const au of authUsers) {
    const name = au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split('@')[0] : 'Usuário');
    const avatar = au.user_metadata?.avatar_url;
    
    // Tenta buscar usuário existente por ID
    const { data: existing } = await supabase.from('users').select('id').eq('id', au.id).maybeSingle();
    
    if (existing) {
      // Atualiza
      const { error } = await supabase.from('users').update({
        full_name: name,
        email: au.email,
        auth_id: au.id,
        avatar_url: avatar,
        updated_at: new Date()
      }).eq('id', au.id);
      
      if (!error) updated++;
      else console.error(`Erro ao atualizar ${au.email}:`, error.message);
    } else {
      // Cria
      const { error } = await supabase.from('users').insert({
        id: au.id,
        auth_id: au.id,
        email: au.email,
        full_name: name,
        avatar_url: avatar,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      if (!error) created++;
      else console.error(`Erro ao criar ${au.email}:`, error.message);
    }
  }

  console.log(`✅ Sincronização concluída!`);
  console.log(`   - Criados: ${created}`);
  console.log(`   - Atualizados: ${updated}`);
}

syncUsers();
