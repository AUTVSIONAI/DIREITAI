const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectCheckins() {
  console.log('🔍 Inspecting Checkins Tables...');

  console.log('\n--- checkins ---');
  const { data: checkins, error: checkinsError } = await adminSupabase
    .from('checkins')
    .select('*')
    .limit(5);

  if (checkinsError) console.error(checkinsError);
  else console.table(checkins);

  console.log('\n--- geographic_checkins ---');
  const { data: geoCheckins, error: geoCheckinsError } = await adminSupabase
    .from('geographic_checkins')
    .select('*')
    .limit(5);

  if (geoCheckinsError) console.error(geoCheckinsError);
  else console.table(geoCheckins);
}

inspectCheckins();
