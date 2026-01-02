const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugCheckin() {
  console.log('Starting debug checkin...');

  // 1. Fetch a user
  const { data: users, error: userError } = await adminSupabase
    .from('users')
    .select('id, auth_id')
    .limit(1);

  if (userError || !users.length) {
    console.error('Error fetching user:', userError);
    return;
  }
  const user = users[0];
  const userId = user.auth_id || user.id; // Try auth_id first
  console.log('Using User ID:', userId);

  // 2. Fetch the specific manifestation
  const manifestationId = 'bb7f8e28-8d01-4d3f-bb64-10a6b53b6dda';
  const { data: manifestation, error: manError } = await adminSupabase
    .from('manifestations')
    .select('*')
    .eq('id', manifestationId)
    .single();

  if (manError) {
    console.error('Error fetching manifestation:', manError);
    return;
  }
  console.log('Manifestation found:', manifestation.name);

  // 3. Test Insert into geographic_checkins
  const checkinData = {
    user_id: userId,
    manifestation_id: manifestationId,
    latitude: -23.662438,
    longitude: -46.759415,
    device_info: { test: 'debug_script' },
    ip_address: '127.0.0.1',
    user_agent: 'DebugScript',
    checked_in_at: new Date().toISOString()
  };

  console.log('Attempting insert into geographic_checkins:', checkinData);

  const { data: checkin, error: checkinError } = await adminSupabase
    .from('geographic_checkins')
    .insert([checkinData])
    .select()
    .single();

  if (checkinError) {
    console.error('INSERT FAILED:', checkinError);
  } else {
    console.log('INSERT SUCCESS:', checkin);
    
    // Cleanup
    await adminSupabase.from('geographic_checkins').delete().eq('id', checkin.id);
    console.log('Cleaned up test checkin.');
  }

  // 4. Test Insert into points
  console.log('Attempting insert into points...');
  const pointsData = {
    user_id: userId,
    amount: 50,
    reason: `Check-in na manifestação: ${manifestation.name}`,
    source: 'geographic_checkin',
    category: 'manifestation',
    metadata: {
      manifestation_id: manifestationId,
      manifestation_name: manifestation.name,
      distance: 0
    }
  };

  const { data: points, error: pointsError } = await adminSupabase
    .from('points')
    .insert([pointsData])
    .select()
    .single();

  if (pointsError) {
    console.error('POINTS INSERT FAILED:', pointsError);
  } else {
    console.log('POINTS INSERT SUCCESS:', points);
    // Cleanup points not easy/necessary for test
  }
}

debugCheckin();
