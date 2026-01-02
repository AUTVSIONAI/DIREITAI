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

async function checkRatingsDetails() {
    console.log('--- Checking Ratings Details ---');
    
    const { data: ratings, error } = await supabase
        .from('politician_ratings')
        .select('id, user_id, rating, created_at');
    
    if (error) {
        console.error('Error fetching ratings:', error);
        return;
    }

    console.log(`Found ${ratings.length} ratings.`);
    
    if (ratings.length === 0) return;

    const userIds = [...new Set(ratings.map(r => r.user_id))];
    
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, username, email, avatar_url')
        .in('id', userIds);
    
    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    const usersById = {};
    users.forEach(u => usersById[u.id] = u);

    ratings.forEach(r => {
        const user = usersById[r.user_id];
        console.log(`Rating ID: ${r.id}, User ID: ${r.user_id}`);
        if (user) {
            console.log(`  - User Found: Yes`);
            console.log(`  - Full Name: "${user.full_name}"`);
            console.log(`  - Username: "${user.username}"`);
            console.log(`  - Email: "${user.email}"`);
        } else {
            console.log(`  - User Found: NO (This will appear as Anonymous)`);
        }
    });
}

checkRatingsDetails();
