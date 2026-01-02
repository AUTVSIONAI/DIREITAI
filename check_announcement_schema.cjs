const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAnnouncementClicksSchema() {
  console.log('🔍 Checking announcement_clicks table...');
  
  // Try to insert a dummy record (and delete it) or just select
  const { data, error } = await adminSupabase
    .from('announcement_clicks')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing announcement_clicks:', error);
  } else {
    console.log('✅ announcement_clicks table accessible. Rows:', data?.length);
  }
}

checkAnnouncementClicksSchema();
