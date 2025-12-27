const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/DIREITAI/backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPlans() {
  console.log('🔍 Checking plans with ADMIN client (bypasses RLS)...');
  const { data: adminData, error: adminError } = await adminSupabase
    .from('subscription_plans')
    .select('id, name, slug, is_active');

  if (adminError) {
    console.error('❌ Admin Query Error:', adminError);
  } else {
    console.log(`✅ Admin found ${adminData.length} plans:`);
    adminData.forEach(p => console.log(`   - [${p.id}] ${p.name} (${p.slug}) Active: ${p.is_active}`));
  }

  console.log('\n🔍 Checking plans with ANON client (subject to RLS)...');
  const { data: anonData, error: anonError } = await supabase
    .from('subscription_plans')
    .select('id, name, slug, is_active');

  if (anonError) {
    console.error('❌ Anon Query Error:', anonError);
  } else {
    console.log(`✅ Anon found ${anonData.length} plans.`);
    if (anonData.length === 0) {
      console.warn('⚠️ WARNING: Anon client found 0 plans. RLS might be blocking public access!');
    }
  }
}

checkPlans();
