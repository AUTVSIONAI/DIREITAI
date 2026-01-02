const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  console.log('--- Checking IDs ---');

  // 1. Get a distinct user_id from geographic_checkins
  const { data: geoCheckins, error: geoError } = await supabase
    .from('geographic_checkins')
    .select('user_id')
    .limit(1);

  if (geoError) {
    console.error('Error fetching geo checkins:', geoError);
    return;
  }

  const geoUserId = geoCheckins[0]?.user_id;
  console.log('User ID found in geographic_checkins:', geoUserId);

  if (!geoUserId) {
    console.log('No checkins found to test.');
    return;
  }

  // 2. Check if this ID exists in 'users' table as 'id' or 'auth_id'
  const { data: userById, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, email, name')
    .or(`id.eq.${geoUserId},auth_id.eq.${geoUserId}`);

  console.log('Lookup in users table result:', userById);

  if (userById && userById.length > 0) {
      console.log('Match found! The checkin belongs to:', userById[0]);
  } else {
      console.log('NO MATCH FOUND in users table. This is a problem. The checkin refers to a non-existent user or an ID not synced.');
  }

  // 3. Get all users to see what IDs look like
  const { data: allUsers } = await supabase.from('users').select('id, auth_id, email').limit(5);
  console.log('Sample users from users table:', allUsers);
}

checkIds();
