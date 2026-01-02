const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCheckins() {
  console.log('--- Verifying Recent Check-ins ---');

  // 1. Check geographic_checkins
  console.log('\nChecking table: geographic_checkins');
  const { data: geoCheckins, error: geoError } = await adminSupabase
    .from('geographic_checkins')
    .select('*')
    .order('checked_in_at', { ascending: false })
    .limit(5);

  if (geoError) {
    console.error('Error fetching geographic_checkins:', geoError);
  } else {
    console.log(`Found ${geoCheckins.length} records.`);
    geoCheckins.forEach(c => {
      console.log(`- [${c.checked_in_at}] User: ${c.user_id}, Manif: ${c.manifestation_id}, Lat/Lon: ${c.latitude}/${c.longitude}`);
    });
  }

  // 2. Check public.checkins (if it exists)
  console.log('\nChecking table: checkins');
  const { data: publicCheckins, error: pubError } = await adminSupabase
    .from('checkins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (pubError) {
    console.log('Table "checkins" might not exist or error:', pubError.message);
  } else {
    console.log(`Found ${publicCheckins.length} records.`);
    publicCheckins.forEach(c => {
      console.log(`- [${c.created_at}] User: ${c.user_id}, Event: ${c.event_id}, Status: ${c.status}`);
    });
  }
}

verifyCheckins();
