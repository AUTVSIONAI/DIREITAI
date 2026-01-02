const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend-oficial/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase ausentes no .env (backend-oficial/.env)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGamification() {
  console.log('🔍 Iniciando debug de gamificação...');

  // 1. Buscar usuário "Terminal"
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, username, full_name, email')
    .ilike('username', '%Terminal%')
    .limit(5);

  if (userError) {
    console.error('❌ Erro ao buscar usuários:', userError);
    return;
  }

  if (!users || users.length === 0) {
    console.log('⚠️ Nenhum usuário "Terminal" encontrado. Listando recentes...');
    const { data: recentUsers } = await supabase
      .from('users')
      .select('id, auth_id, username, full_name, email')
      .order('created_at', { ascending: false })
      .limit(3);
    if (recentUsers) processUsers(recentUsers);
  } else {
    processUsers(users);
  }
}

async function processUsers(users) {
  for (const user of users) {
    console.log(`\n👤 Usuário: ${user.username || user.email} (ID: ${user.id})`);
    console.log(`   Auth ID: ${user.auth_id}`);

    const resolvedUserId = user.id;
    const authId = user.auth_id;

    // Simular filtro da rota /stats
    let userFilter = `user_id.eq.${resolvedUserId}`;
    if (authId) {
      userFilter += `,user_id.eq.${authId}`;
    }
    console.log(`   Filtro usado: ${userFilter}`);

    // Check-ins
    const { count: checkinsCount, error: cErr } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .or(userFilter);
    
    if (cErr) console.error('   ❌ Erro checkins:', cErr.message);
    else console.log(`   📍 Check-ins (tabela checkins): ${checkinsCount}`);

    // Geographic Check-ins
    const { count: geoCheckinsCount, error: gErr } = await supabase
      .from('geographic_checkins')
      .select('*', { count: 'exact', head: true })
      .or(userFilter);

    if (gErr) console.error('   ❌ Erro geoCheckins:', gErr.message);
    else console.log(`   📍 Check-ins Geográficos: ${geoCheckinsCount}`);

    // Points
    const { data: points } = await supabase
      .from('points')
      .select('amount')
      .eq('user_id', resolvedUserId);
    
    const totalPoints = points?.reduce((sum, p) => sum + p.amount, 0) || 0;
    console.log(`   🏆 Pontos Totais (por ID público): ${totalPoints}`);

    // Ranking Logic
    const { count: usersAbove } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('points', totalPoints);
    
    console.log(`   🏅 Ranking (calculado via gt points): ${(usersAbove || 0) + 1}`);

    // Comparar com tabela users
    const { data: userRow } = await supabase
      .from('users')
      .select('points, ranking') // check if ranking column exists
      .eq('id', resolvedUserId)
      .single();
    
    console.log(`   💾 Tabela users -> points: ${userRow?.points}, ranking: ${userRow?.ranking}`);
  }
}

debugGamification();
