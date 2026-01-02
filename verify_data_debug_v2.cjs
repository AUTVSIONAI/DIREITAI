const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyData() {
  console.log('Verifying data integrity...');

  try {
    // 1. Check blog_post_likes
    const { count: likesCount, error: likesError } = await supabase
      .from('blog_post_likes')
      .select('*', { count: 'exact', head: true });
    
    if (likesError) console.error('Error checking blog_post_likes:', likesError);
    else console.log(`Total blog_post_likes: ${likesCount}`);

    // 2. Check politician_ratings
    const { count: ratingsCount, error: ratingsError } = await supabase
      .from('politician_ratings')
      .select('*', { count: 'exact', head: true });

    if (ratingsError) console.error('Error checking politician_ratings:', ratingsError);
    else console.log(`Total politician_ratings: ${ratingsCount}`);

    // 3. Check users with ratings/likes to ensure they exist in public.users
    const { data: ratings, error: rErr } = await supabase
      .from('politician_ratings')
      .select('user_id')
      .limit(5);
    
    if (ratings && ratings.length > 0) {
      const userIds = ratings.map(r => r.user_id);
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);
        
      console.log('Sample ratings user check:', {
        ratingsFound: ratings.length,
        usersFound: users?.length || 0,
        mismatch: ratings.length !== (users?.length || 0)
      });
      if (users) console.log('Sample users:', users);
    } else {
        console.log('No ratings found to check users against.');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

verifyData();
