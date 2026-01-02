const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking analytics data...');

    // Check notification_stats
    const { data: stats, error: statsError } = await supabase
        .from('notification_stats')
        .select('*');
    
    if (statsError) console.error('Error fetching notification_stats:', statsError);
    else console.log('notification_stats count:', stats.length, stats);

    // Check announcement_views
    const { count: viewsCount, error: viewsError } = await supabase
        .from('announcement_views')
        .select('*', { count: 'exact', head: true });
    
    if (viewsError) console.error('Error fetching announcement_views:', viewsError);
    else console.log('announcement_views count:', viewsCount);

    // Check announcement_clicks
    const { count: clicksCount, error: clicksError } = await supabase
        .from('announcement_clicks')
        .select('*', { count: 'exact', head: true });
    
    if (clicksError) console.error('Error fetching announcement_clicks:', clicksError);
    else console.log('announcement_clicks count:', clicksCount);

    // Check announcement_dismissals
    const { count: dismissalsCount, error: dismissalsError } = await supabase
        .from('announcement_dismissals')
        .select('*', { count: 'exact', head: true });
    
    if (dismissalsError) console.error('Error fetching announcement_dismissals:', dismissalsError);
    else console.log('announcement_dismissals count:', dismissalsCount);
}

checkData();
