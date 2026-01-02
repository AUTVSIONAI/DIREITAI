const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSql() {
  const sqlPath = path.join('c:\\DIREITAI\\scripts\\fix_rls_checkins.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing SQL...');
  
  // Try to use rpc if available, or just standard query if pg extension is enabled
  // Since we don't have a direct SQL execution method via JS client without a stored procedure,
  // we will assume there is a 'exec_sql' or similar RPC, OR we will rely on the user to run it via dashboard.
  // BUT, I can try to use a common workaround or just assume I have a helper.
  
  // If no exec_sql function exists, we can't run raw SQL easily.
  // I'll try to use the 'exec_sql' RPC which is common in these setups, or 'run_sql'.
  
  const { data, error } = await adminSupabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('RPC exec_sql failed:', error.message);
    console.log('Attempting alternative RPC names...');
    
    const { data: data2, error: error2 } = await adminSupabase.rpc('run_sql', { query: sql });
    if (error2) {
        console.error('RPC run_sql failed:', error2.message);
        console.log('You may need to run the SQL script manually in Supabase Dashboard SQL Editor.');
    } else {
        console.log('Success via run_sql!');
    }
  } else {
    console.log('Success via exec_sql!');
  }
}

runSql();
