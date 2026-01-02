const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking recent notifications...');
    const { data, error } = await sb
        .from('notifications')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Recent notifications:', data);
    }
}

check();
