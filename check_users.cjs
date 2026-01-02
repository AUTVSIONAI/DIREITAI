const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/DIREITAI/backend-oficial/.env' });

// Use service role key to bypass RLS and access all users
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Checking users table...');
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('User sample:', data[0] ? JSON.stringify(data[0], null, 2) : 'No users found');
      
      // Check total count
      const { count, error: countError } = await supabase.from('users').select('*', { count: 'exact', head: true });
      if (countError) console.error('Error counting users:', countError);
      else console.log('Total users:', count);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

check();
