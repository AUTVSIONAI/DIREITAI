const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials missing');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStats(userId) {
  console.log(`🔍 Debugging stats for user: ${userId}`);

  // 1. Resolve User ID and Auth ID
  // If user not found, list some users
  const { data: userData, error: userError } = await adminSupabase
    .from('users')
    .select('id, auth_id, email, full_name')
    .or(`id.eq.${userId},auth_id.eq.${userId}`)
    .maybeSingle();

  if (userError || !userData) {
    console.error('❌ User not found:', userError);
    
    // Find user with checkins
    const { data: checkins } = await adminSupabase.from('checkins').select('user_id').limit(1);
    const { data: geoCheckins } = await adminSupabase.from('geographic_checkins').select('user_id').limit(1);
    
    const idToTest = checkins?.[0]?.user_id || geoCheckins?.[0]?.user_id;
    
    if (idToTest) {
        console.log(`🔄 Found user with checkins: ${idToTest}. Retrying...`);
        return debugStats(idToTest);
    }
    
    console.log('📋 Listing first 5 users:');
    const { data: users } = await adminSupabase.from('users').select('id, auth_id, email, full_name').limit(5);
    console.log(users);
    return;
  }

  console.log('👤 User Data:', userData);
  const resolvedUserId = userData.id;
  const authId = userData.auth_id;

  // 2. Build Filter
  let userFilter = `user_id.eq.${resolvedUserId}`;
  if (authId) {
    userFilter += `,user_id.eq.${authId}`;
  }
  console.log('🛡️ Filter:', userFilter);

  // 3. Count Checkins
  const { count: checkinsCount, error: cError } = await adminSupabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .or(userFilter);

  if (cError) console.error('❌ Error counting checkins:', cError);
  console.log('📍 Regular Checkins:', checkinsCount);

  // 4. Count Geographic Checkins
  const { count: geoCheckinsCount, error: gError } = await adminSupabase
    .from('geographic_checkins')
    .select('*', { count: 'exact', head: true })
    .or(userFilter);

  if (gError) console.error('❌ Error counting geo checkins:', gError);
  console.log('🌍 Geographic Checkins:', geoCheckinsCount);
  
  // 5. List Geo Checkins for verification
  const { data: geoCheckins } = await adminSupabase
      .from('geographic_checkins')
      .select('id, user_id, created_at')
      .or(userFilter);
      
  console.log('📋 Geo Checkins List:', geoCheckins);

  const total = (checkinsCount || 0) + (geoCheckinsCount || 0);
  console.log('✅ Total Checkins calculated:', total);

  // 6. Check Points and Ranking
  const { data: userPoints } = await adminSupabase
    .from('users')
    .select('points')
    .eq('id', resolvedUserId)
    .single();

  console.log('💰 User Points:', userPoints?.points);

  const { count: rankCount } = await adminSupabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .gt('points', userPoints?.points || 0);

  console.log('🏆 Calculated Ranking:', (rankCount || 0) + 1);
}

const targetUserId = '4f1b46b2-6c30-4e56-9804-5853b05f2441'; // ID from previous turns
debugStats(targetUserId);
