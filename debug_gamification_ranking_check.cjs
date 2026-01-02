const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend-oficial', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const userId = '8995944c-ace3-482f-a4e2-7174a7fe5758'; // teste.constituicao@direitai.com

async function checkGamificationStats() {
  console.log('Checking gamification stats for user:', userId);

  try {
    // 1. Get Auth ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('auth_id, points')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }

    const authId = userData.auth_id;
    const totalPoints = userData.points || 0;
    console.log('User Auth ID:', authId);
    console.log('User Total Points:', totalPoints);

    // 2. Calculate Ranking
    // Backend logic: count users with points > user.points
    const { count: usersAbove, error: rankingError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('points', totalPoints);

    if (rankingError) {
      console.error('Error calculating ranking:', rankingError);
    }

    const rankingPosition = (usersAbove || 0) + 1;
    console.log('Users Above:', usersAbove);
    console.log('Calculated Ranking Position:', rankingPosition);

    // 3. Count Check-ins
    let userFilter = `user_id.eq.${userId}`;
    if (authId) {
      userFilter += `,user_id.eq.${authId}`;
    }
    console.log('User Filter for Check-ins:', userFilter);

    const { count: checkinsCount, error: checkinsError } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .or(userFilter);

    if (checkinsError) console.error('Error counting checkins:', checkinsError);

    const { count: geoCheckinsCount, error: geoCheckinsError } = await supabase
      .from('geographic_checkins')
      .select('*', { count: 'exact', head: true })
      .or(userFilter);

    if (geoCheckinsError) console.error('Error counting geo checkins:', geoCheckinsError);

    console.log('Regular Check-ins:', checkinsCount);
    console.log('Geographic Check-ins:', geoCheckinsCount);
    console.log('Total Check-ins:', (checkinsCount || 0) + (geoCheckinsCount || 0));

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkGamificationStats();
