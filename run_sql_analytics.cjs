const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, 'backend-oficial/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
  try {
    const sqlPath = path.resolve(__dirname, 'scripts/create_analytics_tables_v2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to run statements individually if needed, 
    // but rpc/pg-functions usually take the whole block. 
    // Since we don't have a direct SQL runner via JS client without a function,
    // we will assume the user has a 'exec_sql' function or similar, 
    // OR we will use the 'rest' interface if available.
    // However, the best way often is to ask the user to run it or use a pre-existing RPC.
    // Let's check if we have an RPC for running SQL.
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
        // Fallback: Try to use a known function if exec_sql doesn't exist, 
        // or just print instructions.
        // Actually, previous logs showed 'failed to run sql query' so maybe there is no general runner.
        // But I can try to see if I can create the tables via standard JS client if they map to standard operations? 
        // No, CREATE TABLE needs raw SQL.
        
        console.error('Error running SQL via RPC:', error);
        console.log('Attempting to check if tables exist...');
        
        // Check if tables exist
        const tables = ['notification_stats', 'announcement_views', 'announcement_clicks', 'announcement_dismissals'];
        for (const table of tables) {
            const { error: tableError } = await supabase.from(table).select('count', { count: 'exact', head: true });
            if (tableError) {
                console.log(`Table ${table} might be missing or inaccessible:`, tableError.message);
            } else {
                console.log(`Table ${table} exists.`);
            }
        }
        
        return;
    }
    
    console.log('SQL executed successfully.');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

runSql();
