const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend-oficial/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSql() {
    const sqlPath = path.join(__dirname, 'fix_checkin_schema.sql');
    console.log(`Reading SQL from ${sqlPath}...`);
    
    try {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Executing SQL...');
        
        const { error } = await supabase.rpc('exec_sql', { sql });
        
        if (error) {
            console.error('Error executing SQL via RPC:', error);
            console.log('Attempting fallback: If exec_sql RPC does not exist, you must run the SQL manually in Supabase Dashboard.');
        } else {
            console.log('SQL executed successfully.');
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

runSql();
