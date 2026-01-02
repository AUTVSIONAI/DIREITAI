const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRatings() {
  console.log('Fetching last 5 ratings...');
  const { data: ratings, error } = await supabase
    .from('politician_ratings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching ratings:', error);
    return;
  }

  console.log(`Found ${ratings.length} ratings.`);

  for (const rating of ratings) {
    console.log(`Rating ID: ${rating.id}, User ID: ${rating.user_id}, Rating: ${rating.rating}`);
    
    // Check if user exists in public.users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name, name, username, email')
      .eq('id', rating.user_id)
      .maybeSingle();

    if (userError) {
      console.error(`  Error fetching user ${rating.user_id}:`, userError);
    } else if (user) {
      console.log(`  User found: ${user.full_name || user.name || user.username || user.email} (ID matches)`);
    } else {
      console.log(`  User NOT FOUND in public.users with ID ${rating.user_id}`);
      
      // Try to find by auth_id if it's different (though public.users usually uses auth id as primary key)
      const { data: byAuth } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('auth_id', rating.user_id)
        .maybeSingle();
        
      if (byAuth) {
        console.log(`  User found via auth_id: ${byAuth.id} (Mismatch?)`);
      }
    }
  }
}

checkRatings();
