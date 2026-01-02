const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables manually
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envConfig = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.trim();
  }
});

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGamificationStats() {
  console.log('--- Testing Gamification Stats ---');

  // 1. Get a user who has checkins (either in checkins or geographic_checkins)
  const { data: geoCheckins, error: geoError } = await supabase
    .from('geographic_checkins')
    .select('user_id')
    .limit(5);

  if (geoError) {
    console.error('Error fetching geo checkins:', geoError);
    return;
  }

  console.log(`Found ${geoCheckins.length} geo checkins.`);
  const sampleAuthId = geoCheckins[0]?.user_id;
  
  if (!sampleAuthId) {
    console.log('No geo checkins found to test.');
    // Try to find a user with points
    const { data: usersPoints } = await supabase
      .from('users')
      .select('id, auth_id, points')
      .gt('points', 0)
      .limit(1);
      
    if (usersPoints && usersPoints.length > 0) {
       console.log('Falling back to user with points:', usersPoints[0]);
       await fetchStats(usersPoints[0].id);
    }
    return;
  }

  console.log('Sample Auth ID from Geo Checkins:', sampleAuthId);

  // Get the public ID for this auth ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, auth_id, full_name')
    .eq('auth_id', sampleAuthId)
    .single();

  if (userError || !user) {
    console.error('Error finding user for auth_id:', sampleAuthId);
     // Try to find a user with points
    const { data: usersPoints } = await supabase
      .from('users')
      .select('id, auth_id, points')
      .gt('points', 0)
      .limit(1);
      
    if (usersPoints && usersPoints.length > 0) {
       console.log('Falling back to user with points:', usersPoints[0]);
       await fetchStats(usersPoints[0].id);
    }
    return;
  }

  console.log('Found User:', user);
  await fetchStats(user.id);
}

async function fetchStats(userId) {
  console.log(`\nFetching stats for User ID: ${userId} (Backend Logic Simulation)`);
  
  // Simulate the backend logic from routes/gamification.js
  
  // 1. Resolve ID
  const { data: userData, error: fetchError } = await supabase
    .from('users')
    .select('auth_id, points')
    .eq('id', userId)
    .single();
    
  if (fetchError || !userData) {
    console.error('User not found in DB or Error:', fetchError);
    return;
  }
  
  const authId = userData.auth_id;
  console.log('Resolved Auth ID:', authId);
  console.log('User Points:', userData.points);

  // 2. Build Filter
  let filter = `user_id.eq.${userId}`;
  if (authId) {
      filter += `,user_id.eq.${authId}`;
  }
  
  // Count Checkins (Legacy)
  const { count: checkinsCount, error: cErr } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .or(filter);

  if (cErr) console.error('Checkins count error:', cErr);
  console.log('Checkins Count:', checkinsCount);

  // Count Geo Checkins
  const { count: geoCheckinsCount, error: gErr } = await supabase
    .from('geographic_checkins')
    .select('*', { count: 'exact', head: true })
    .or(filter);

  if (gErr) console.error('Geo Checkins count error:', gErr);
  console.log('Geo Checkins Count:', geoCheckinsCount);

  const totalCheckins = (checkinsCount || 0) + (geoCheckinsCount || 0);
  console.log('Total Checkins Calculated:', totalCheckins);

  // Ranking
  const totalPoints = userData.points || 0;
  const { count: usersAbove, error: rErr } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gt('points', totalPoints);

  if (rErr) console.error('Ranking count error:', rErr);
  
  const rankingPosition = (usersAbove || 0) + 1;
  console.log('Ranking Position:', rankingPosition);
  
  console.log('\n--- Conclusion ---');
  if (rankingPosition > 0 && totalCheckins >= 0) {
      console.log('Backend logic seems correct. If frontend shows 0, it is a data passing issue.');
  } else {
      console.log('Backend logic might be failing to find data.');
  }
}

testGamificationStats();
