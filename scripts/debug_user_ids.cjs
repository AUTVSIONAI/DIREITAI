const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectSchema() {
  console.log('Inspecting foreign keys for geographic_checkins...');

  // Query to get foreign key details
  const { data: fks, error } = await supabase.rpc('run_sql', {
    sql_query: `
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='geographic_checkins';
    `
  });
  
  // Since run_sql might not be available or return what we want directly if not set up, 
  // let's try a direct query if we were using a pg driver, but with supabase-js we are limited unless we have the RPC.
  // The user previously mentioned RPC exec_sql/run_sql failed.
  
  // So we can't easily inspect schema via SQL if RPC is missing.
  
  // However, we can try to infer from the error message.
  // Error: Key (user_id)=(...) is not present in table "users".
  
  // Let's try to fetch the user from public.users with that ID to see if it exists.
  const userId = 'd67e3f2a-d08c-4cd4-97b0-a6a7e594ca54';
  console.log(`Checking if user ${userId} exists in public.users...`);
  
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (user) {
    console.log('User found in public.users:', user);
    console.log('User ID:', user.id);
    console.log('User Auth ID:', user.auth_id);
  } else {
    console.log('User NOT found in public.users:', userError);
  }

  // Also check if that ID exists in auth.users (we can't query auth.users directly easily via client usually, but admin might)
  // adminSupabase.auth.admin.getUserById(userId)
  
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authUser && authUser.user) {
    console.log('User found in auth.users (as ID):', authUser.user.id);
  } else {
    console.log('User NOT found in auth.users (as ID). This is expected if it is a public.users ID.');
  }

}

inspectSchema();
