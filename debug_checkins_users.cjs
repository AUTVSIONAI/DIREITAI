const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend-oficial/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findCheckins() {
  console.log('🔍 Buscando check-ins recentes para identificar usuários...');

  // 1. Check-ins Geográficos
  const { data: geoCheckins, error: gErr } = await supabase
    .from('geographic_checkins')
    .select('id, user_id, created_at, lat, lng')
    .order('created_at', { ascending: false })
    .limit(5);

  if (gErr) console.error('Erro geoCheckins:', gErr);
  else {
    console.log(`\n📍 Últimos 5 Check-ins Geográficos:`);
    for (const c of geoCheckins) {
      console.log(`   - ID: ${c.id}, UserID: ${c.user_id}, Data: ${c.created_at}`);
      await checkUser(c.user_id);
    }
  }

  // 2. Check-ins Normais
  const { data: checkins, error: cErr } = await supabase
    .from('checkins')
    .select('id, user_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (cErr) console.error('Erro checkins:', cErr);
  else {
    console.log(`\n📍 Últimos 5 Check-ins (Eventos):`);
    for (const c of checkins) {
      console.log(`   - ID: ${c.id}, UserID: ${c.user_id}, Data: ${c.created_at}`);
      await checkUser(c.user_id);
    }
  }
}

async function checkUser(userId) {
  // Tentar achar na tabela users por ID ou Auth ID
  const { data: userById } = await supabase.from('users').select('id, username, auth_id, points').eq('id', userId).single();
  const { data: userByAuth } = await supabase.from('users').select('id, username, auth_id, points').eq('auth_id', userId).single();

  if (userById) {
    console.log(`     ✅ Encontrado por ID: ${userById.username} (ID: ${userById.id}, Auth: ${userById.auth_id}, Points: ${userById.points})`);
  } else if (userByAuth) {
    console.log(`     ✅ Encontrado por AuthID: ${userByAuth.username} (ID: ${userByAuth.id}, Auth: ${userByAuth.auth_id}, Points: ${userByAuth.points})`);
  } else {
    console.log(`     ❌ Usuário NÃO encontrado na tabela users com este ID!`);
  }
}

findCheckins();
