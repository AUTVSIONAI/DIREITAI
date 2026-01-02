const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    console.log('--- Listing Tables in public schema ---');
    
    // We can't list tables directly with supabase-js client easily without rpc or using pg_catalog via raw query if allowed.
    // But we can try to query common tables to see if they error out.
    
    const tablesToCheck = [
        'users',
        'profiles',
        'politician_ratings',
        'politician_suggestions',
        'blog_post_likes',
        'blog_post_comments',
        'notification_stats',
        'announcement_views',
        'announcement_clicks',
        'announcement_dismissals',
        'announcements',
        'notifications',
        'campaigns',
        'templates'
    ];

    for (const table of tablesToCheck) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.log(`[X] ${table}: Error - ${error.message}`);
        } else {
            console.log(`[V] ${table}: OK (Count: ${count})`);
        }
    }
}

checkTables();
