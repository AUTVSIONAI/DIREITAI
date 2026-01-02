const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugGamificationLogic() {
  const userId = 'daf02d7f-12ce-4ed3-9161-cbfef3ce02d9';
  console.log(`Debugging gamification stats for user: ${userId}`);

  try {
    // 1. Resolve User ID (simulate resolveUserId)
    let targetUserId = userId;
    
    // Check if it's an auth_id
    const { data: userByAuth, error: authError } = await adminSupabase
      .from('users')
      .select('id, auth_id')
      .eq('auth_id', userId)
      .single();

    if (userByAuth) {
      console.log('User found by auth_id:', userByAuth);
      // In the backend logic, we might use the public ID or auth ID depending on implementation
      // But typically we want the public ID for foreign keys
      targetUserId = userByAuth.id; 
    } else {
        // Check if it's a public ID
        const { data: userById, error: idError } = await adminSupabase
        .from('users')
        .select('id, auth_id')
        .eq('id', userId)
        .single();
        
        if (userById) {
             console.log('User found by public id:', userById);
        } else {
            console.log('User NOT found by ID or Auth ID');
        }
    }
    
    console.log(`Target User ID for queries: ${targetUserId}`);

    // 2. Count Check-ins (Geographic)
    // The backend uses an OR filter: user_id.eq.targetUserId OR user_id.eq.auth_id
    // But supabase JS client doesn't support OR across different columns easily in one go without raw filter string
    // backend uses: .or(`user_id.eq.${resolvedId},user_id.eq.${userId}`) if resolvedId != userId
    
    // Let's check direct match first
    const { count: geoCount, error: geoError } = await adminSupabase
      .from('geographic_checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);
      
    console.log(`Geographic Check-ins (user_id=${targetUserId}): ${geoCount}`);
    
    // Check match with auth_id if different
    let geoCountAuth = 0;
    if (userByAuth && userByAuth.auth_id && userByAuth.auth_id !== targetUserId) {
         const { count: c, error: e } = await adminSupabase
          .from('geographic_checkins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userByAuth.auth_id);
          geoCountAuth = c;
          console.log(`Geographic Check-ins (user_id=${userByAuth.auth_id}): ${geoCountAuth}`);
    }

    // 3. Count Check-ins (Legacy/Manual)
    const { count: manualCount, error: manualError } = await adminSupabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    console.log(`Manual Check-ins (user_id=${targetUserId}): ${manualCount}`);

    // 4. Ranking
    // Backend fetches all users ordered by points and finds index
    const { data: allUsers, error: rankingError } = await adminSupabase
      .from('users')
      .select('id, points')
      .order('points', { ascending: false });
      
    if (allUsers) {
        const rank = allUsers.findIndex(u => u.id === targetUserId) + 1;
        const userStats = allUsers.find(u => u.id === targetUserId);
        console.log(`Calculated Rank: ${rank}`);
        console.log(`User Points: ${userStats ? userStats.points : 'N/A'}`);
    }

  } catch (error) {
    console.error('Error debugging gamification:', error);
  }
}

debugGamificationLogic();
