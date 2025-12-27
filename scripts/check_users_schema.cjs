
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersSchema() {
  console.log('Checking users table schema...');
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users table access successful.');
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('Users table is empty, cannot verify columns directly via select.');
      // Try to insert a dummy record to see if it accepts 'points' or check error? 
      // Or just assume if select works, table exists.
    }
  }
}

checkUsersSchema();
