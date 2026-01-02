const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend-oficial/.env
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing.');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseKey);

async function testRankingEndpoint(userIdInput) {
  console.log(`\n🏆 Testing Ranking Logic for User: ${userIdInput}`);

  try {
    // 1. Resolve User ID
    let userId = userIdInput;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (uuidRegex.test(userIdInput)) {
        // Check if it is an Auth ID
        const { data: userByAuth } = await adminSupabase
            .from('users')
            .select('id')
            .eq('auth_id', userIdInput)
            .single();
        
        if (userByAuth) {
            console.log(`Input was Auth ID. Resolved to Public ID: ${userByAuth.id}`);
            userId = userByAuth.id;
        }
    } else {
        // Try by email
        const { data: userByEmail } = await adminSupabase
            .from('users')
            .select('id')
            .eq('email', userIdInput)
            .single();
            
        if (userByEmail) {
            console.log(`Input was Email. Resolved to Public ID: ${userByEmail.id}`);
            userId = userByEmail.id;
        }
    }

    // 2. Fetch User Data (Points)
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select('city, state, points, full_name')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('❌ User not found or error:', userError);
      return;
    }

    console.log(`👤 User: ${userData.full_name}, Points: ${userData.points}, City: ${userData.city}`);

    // 3. Calculate Ranking (Logic from users.js /ranking)
    const { count: usersAbove, error: rankError } = await adminSupabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .gt('points', userData.points || 0);
    
    if (rankError) {
        console.error('❌ Error counting users above:', rankError);
        return;
    }

    const rankingPosition = (usersAbove || 0) + 1;
    console.log(`🥇 Calculated Ranking Position: ${rankingPosition}`);
    console.log(`(Users with more points: ${usersAbove})`);

    // 4. Test City Ranking
    if (userData.city) {
        const { count: usersAboveCity } = await adminSupabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .gt('points', userData.points || 0)
            .eq('city', userData.city);
            
        const cityRanking = (usersAboveCity || 0) + 1;
        console.log(`🏙️ City Ranking (${userData.city}): ${cityRanking}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run test with the known user (Auth ID or Email or Public ID)
// Using Public ID found previously: d67e3f2a-d08c-4cd4-97b0-a6a7e594ca54 (Public)
// Or Auth ID: 4f1b46b2-698c-4a79-ac64-df47278af391
testRankingEndpoint('d67e3f2a-d08c-4cd4-97b0-a6a7e594ca54');
