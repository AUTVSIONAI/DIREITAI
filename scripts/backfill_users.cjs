
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillUsers() {
  console.log('🔄 Iniciando sincronização de usuários (Auth -> Public)...');

  let { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('❌ Erro ao listar usuários:', error);
    return;
  }

  console.log(`📋 Encontrados ${users.length} usuários no Auth.`);

  for (const user of users) {
    const profile = {
      id: user.id,
      auth_id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
      updated_at: new Date()
    };

    const { error: upsertError } = await supabase
      .from('users')
      .upsert(profile, { onConflict: 'id' });

    if (upsertError) {
      console.error(`❌ Erro ao sincronizar usuário ${user.email}:`, upsertError.message);
    } else {
      console.log(`✅ Usuário sincronizado: ${user.email}`);
    }
  }

  console.log('🏁 Sincronização concluída!');
}

backfillUsers();
