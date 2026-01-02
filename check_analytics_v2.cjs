const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Try to load .env from backend-oficial or root
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.log('Could not load .env from backend-oficial, trying root .env');
    dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalytics() {
    console.log('--- Checking Analytics Tables ---');
    
    const tables = [
        'notification_stats',
        'announcement_views',
        'announcement_clicks',
        'announcement_dismissals'
    ];

    for (const table of tables) {
        const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact' })
            .limit(5);
        
        if (error) {
            console.error(`Error accessing ${table}:`, error.message);
        } else {
            console.log(`${table} count:`, count);
            console.log(`${table} data:`, data);
        }
    }

    console.log('\n--- Checking Blog Likes ---');
    const { count: likesCount, error: likesError } = await supabase
        .from('blog_post_likes')
        .select('*', { count: 'exact', head: true });
    
    if (likesError) console.error('Error accessing blog_post_likes:', likesError.message);
    else console.log('blog_post_likes count:', likesCount);

    console.log('\n--- Checking Politician Ratings ---');
    const { count: ratingsCount, error: ratingsError } = await supabase
        .from('politician_ratings')
        .select('*', { count: 'exact', head: true });

    if (ratingsError) console.error('Error accessing politician_ratings:', ratingsError.message);
    else console.log('politician_ratings count:', ratingsCount);
}

async function checkOrphanedRatings() {
    console.log('\n--- Checking Orphaned Ratings (Anonymous Users) ---');
    
    // Get all ratings
    const { data: ratings, error } = await supabase
        .from('politician_ratings')
        .select('user_id');
    
    if (error) {
        console.error('Error fetching ratings:', error.message);
        return;
    }

    if (!ratings || ratings.length === 0) {
        console.log('No ratings found.');
        return;
    }

    const userIds = [...new Set(ratings.map(r => r.user_id))];
    console.log(`Total unique users in ratings: ${userIds.length}`);

    // Check which ones exist in public.users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .in('id', userIds);
    
    if (usersError) {
        console.error('Error fetching users:', usersError.message);
        return;
    }

    const foundIds = new Set(users.map(u => u.id));
    const missingIds = userIds.filter(id => !foundIds.has(id));

    console.log(`Users found in public.users: ${users.length}`);
    console.log(`Users MISSING in public.users: ${missingIds.length}`);

    if (missingIds.length > 0) {
        console.log('Missing User IDs:', missingIds);
    }
}

(async () => {
    await checkAnalytics();
    await checkOrphanedRatings();
})();
