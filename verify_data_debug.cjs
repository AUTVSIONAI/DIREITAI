
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend-oficial', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('Verifying data...');

  // 1. Check blog_post_likes
  const { data: blogLikes, error: blogError } = await supabase
    .from('blog_post_likes')
    .select('*')
    .limit(5);
  
  if (blogError) console.error('Error fetching blog_post_likes:', blogError);
  else console.log('Blog Likes Sample:', blogLikes);

  // 2. Check politician_ratings and joined users
  const { data: ratings, error: ratingsError } = await supabase
    .from('politician_ratings')
    .select('*, users(*)')
    .limit(5);
    
  if (ratingsError) console.error('Error fetching politician_ratings:', ratingsError);
  else {
    console.log('Ratings Sample:', ratings.map(r => ({
      id: r.id,
      user_id: r.user_id,
      user_joined: r.users ? 'Found' : 'Missing',
      user_data: r.users
    })));
  }
}

verifyData();
