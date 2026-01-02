const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFixes() {
  console.log('--- Verifying Fixes ---');

  // 1. Verify Blog Post Likes
  console.log('\n1. Checking blog_post_likes table...');
  const { data: likes, error: likesError } = await supabase
    .from('blog_post_likes')
    .select('*')
    .limit(5);

  if (likesError) {
    console.error('Error accessing blog_post_likes:', likesError);
  } else {
    console.log(`Successfully accessed blog_post_likes. Count (sample): ${likes.length}`);
  }

  // 2. Verify Politician Ratings & User Fetch (Simulating the fix)
  console.log('\n2. Simulating User Fetch for Ratings...');
  const { data: ratings, error: ratingsError } = await supabase
    .from('politician_ratings')
    .select('user_id')
    .limit(5);

  if (ratingsError) {
    console.error('Error fetching ratings:', ratingsError);
  } else if (ratings.length > 0) {
    const userIds = [...new Set(ratings.map(r => r.user_id).filter(Boolean))];
    console.log(`Found ${userIds.length} user IDs in ratings.`);
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, name')
        .in('id', userIds);
        
      if (usersError) {
        console.error('Error fetching users by ID:', usersError);
      } else {
        console.log(`Successfully fetched ${users.length} users manually.`);
        users.forEach(u => console.log(` - ${u.id}: ${u.full_name || u.name}`));
      }
    }
  } else {
    console.log('No ratings found to verify user fetch.');
  }

  // 3. Verify Announcements Stats (Mock check)
  console.log('\n3. Checking Announcement Stats...');
  // Check if we can access the table where stats might be stored (e.g. announcement_views)
  // Assuming table name based on context
  const { error: viewsError } = await supabase
    .from('announcement_views')
    .select('count', { count: 'exact', head: true });

  if (viewsError) {
    console.log('Table announcement_views might not exist or is inaccessible:', viewsError.message);
  } else {
    console.log('Table announcement_views is accessible.');
  }
}

verifyFixes();
