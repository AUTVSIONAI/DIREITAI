const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend-oficial/.env
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('Checking analytics data...');

  const tables = [
    'notification_stats',
    'announcement_views', 
    'announcement_clicks',
    'announcement_dismissals',
    'blog_post_likes',
    'politician_ratings'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error(`Error fetching ${table}:`, error.message);
    } else {
        console.log(`${table} count:`, count);
    }
  }

  // Check one rating to see structure
  const { data: ratingSample } = await supabase
    .from('politician_ratings')
    .select('*')
    .limit(1);
    
  if (ratingSample && ratingSample.length > 0) {
      console.log('Sample rating:', ratingSample[0]);
  }
}

checkData();
