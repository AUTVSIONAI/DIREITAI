const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log('Testing insert into geographic_checkins...');

  // 1. Get a user and a manifestation
  const { data: users, error: userError } = await adminSupabase
    .from('users')
    .select('id, auth_id')
    .limit(1);

  if (userError || !users.length) {
    console.error('Error fetching user or no users found:', userError);
    return;
  }
  const userId = users[0].auth_id; // Using auth_id as user_id usually maps to auth.users.id
  console.log('User ID:', userId);

  const { data: manifestations, error: manError } = await adminSupabase
    .from('manifestations')
    .select('id')
    .limit(1);

  if (manError || !manifestations.length) {
    console.error('Error fetching manifestation or no manifestations found:', manError);
    return;
  }
  const manifestationId = manifestations[0].id;
  console.log('Manifestation ID:', manifestationId);

  // 2. Attempt insert
  const checkinData = {
    user_id: userId,
    manifestation_id: manifestationId,
    latitude: -23.550520,
    longitude: -46.633308,
    device_info: { test: true },
    ip_address: '127.0.0.1',
    user_agent: 'TestScript',
    checked_in_at: new Date().toISOString()
  };

  const { data, error } = await adminSupabase
    .from('geographic_checkins')
    .insert([checkinData])
    .select()
    .single();

  if (error) {
    console.error('INSERT FAILED:', error);
  } else {
    console.log('INSERT SUCCESS:', data);
    // Cleanup
    await adminSupabase.from('geographic_checkins').delete().eq('id', data.id);
  }
}

testInsert();
