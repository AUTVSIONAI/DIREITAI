const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTable(tableName) {
  console.log(`\n--- Inspecting table: ${tableName} ---`);
  
  // Get a sample row to infer structure (since we can't easily do DESCRIBE via JS client)
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.error(`Error fetching ${tableName}:`, error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('Sample row keys:', Object.keys(data[0]));
    console.log('Sample row:', data[0]);
  } else {
    console.log('Table is empty or no access.');
  }
}

async function checkUserIds() {
    console.log('\n--- Checking User IDs ---');
    // Get a user from users table
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, auth_id, email')
        .limit(1);
    
    if (userError) {
        console.error('Error fetching users:', userError);
    } else {
        console.log('Sample User:', users[0]);
    }

    // Get a geographic_checkin
    const { data: geoCheckins, error: geoError } = await supabase
        .from('geographic_checkins')
        .select('user_id')
        .limit(1);

    if (geoError) {
        console.error('Error fetching geographic_checkins:', geoError);
    } else {
        console.log('Sample Geographic Checkin User ID:', geoCheckins[0]?.user_id);
    }
}

async function run() {
  await inspectTable('geographic_checkins');
  await inspectTable('checkins');
  await checkUserIds();
}

run();
