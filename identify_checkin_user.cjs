const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function identifyUser() {
  const targetId = '4f1b46b2-698c-4a79-ac64-df47278af391'; // ID from checkins table
  console.log(`🔍 Searching for user with ID: ${targetId}`);

  // Check public.users by ID
  const { data: userById, error: errorById } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', targetId)
    .single();

  if (userById) {
    console.log('✅ Found in public.users by ID:', userById);
  } else {
    console.log('❌ Not found in public.users by ID');
  }

  // Check public.users by auth_id
  const { data: userByAuthId, error: errorByAuthId } = await adminSupabase
    .from('users')
    .select('*')
    .eq('auth_id', targetId)
    .single();

  if (userByAuthId) {
    console.log('✅ Found in public.users by auth_id:', userByAuthId);
  } else {
    console.log('❌ Not found in public.users by auth_id');
  }

  // Since we cannot access auth.users directly via client easily without specific setup, 
  // we rely on public.users. If it's missing there, it's a sync issue.
}

identifyUser();
