const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend-oficial', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function checkStats() {
    console.log('--- Debugging Stats Query ---');
    
    let dateFilter = new Date();
    dateFilter.setMonth(dateFilter.getMonth() - 1);
    const isoDate = dateFilter.toISOString();
    
    console.log('Filter Date (ISO):', isoDate);

    // Total
    const { count: total, error: totalError } = await adminSupabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', isoDate);

    if (totalError) console.error('Total Error:', totalError);
    else console.log('Total Count:', total);

    // Read
    const { count: read, error: readError } = await adminSupabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', isoDate)
        .not('read_at', 'is', null);

    if (readError) console.error('Read Error:', readError);
    else console.log('Read Count:', read);

    // Clicked
    const { count: clicked, error: clickedError } = await adminSupabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', isoDate)
        .not('clicked_at', 'is', null);

    if (clickedError) console.error('Clicked Error:', clickedError);
    else console.log('Clicked Count:', clicked);
}

checkStats();
