const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking notifications table schema...');
  
  // Try to insert a record with all fields we expect to see if it fails
  const testNotification = {
    user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    title: 'Test Schema',
    message: 'Testing schema',
    type: 'info',
    priority: 'medium',
    is_read: false,
    created_at: new Date().toISOString()
  };

  // We don't actually want to insert, just see if the columns are valid.
  // But Supabase/PostgREST doesn't have a "describe" endpoint easily accessible via JS client without RPC.
  // So we'll try to select one row to see columns.
  
  const { data, error } = await adminSupabase
    .from('notifications')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from notifications:', error);
  } else {
    console.log('Successfully selected from notifications.');
    if (data.length > 0) {
      console.log('Sample row keys:', Object.keys(data[0]));
    } else {
      console.log('Table is empty, cannot infer schema from data.');
    }
  }

  // Check if we can select specific columns we use
  const { error: colError } = await adminSupabase
    .from('notifications')
    .select('user_id, title, message, type, priority, is_read, created_at')
    .limit(1);

  if (colError) {
    console.error('Error selecting specific columns:', colError);
  } else {
    console.log('All required columns exist.');
  }
}

checkSchema();
