const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoles() {
    console.log('Checking distinct roles in users table...');
    
    // We can't do distinct directly easily via JS client without RPC or raw query usually, 
    // but we can fetch roles and dedup in JS for small datasets.
    const { data, error } = await supabase.from('users').select('role');
    
    if (error) {
        console.error('Error fetching roles:', error);
        return;
    }
    
    const roles = [...new Set(data.map(u => u.role))];
    console.log('Distinct roles found:', roles);
}

checkRoles();
