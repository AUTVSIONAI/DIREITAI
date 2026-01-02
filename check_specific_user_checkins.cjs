const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserCheckins() {
  const userId = '8995944c-ace3-482f-a4e2-7174a7fe5758';
  const authId = '8d8a45e8-7ecd-4430-95b2-900de49f11fe';

  console.log(`🔍 Checking checkins for user: ${userId} (Auth: ${authId})`);

  // Checkins
  const { data: checkins, error: checkinsError } = await adminSupabase
    .from('checkins')
    .select('*')
    .or(`user_id.eq.${userId},user_id.eq.${authId}`);

  if (checkinsError) console.error('Error checkins:', checkinsError);
  console.log(`Checkins found: ${checkins?.length || 0}`);
  if (checkins?.length) console.table(checkins);

  // Geo Checkins
  const { data: geoCheckins, error: geoCheckinsError } = await adminSupabase
    .from('geographic_checkins')
    .select('*')
    .or(`user_id.eq.${userId},user_id.eq.${authId}`);

  if (geoCheckinsError) console.error('Error geo checkins:', geoCheckinsError);
  console.log(`Geo Checkins found: ${geoCheckins?.length || 0}`);
  if (geoCheckins?.length) console.table(geoCheckins);
}

checkUserCheckins();
