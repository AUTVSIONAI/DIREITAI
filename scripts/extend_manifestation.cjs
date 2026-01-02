const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:\\DIREITAI\\backend-oficial\\.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function extendManifestation() {
  const manifestationId = 'bb7f8e28-8d01-4d3f-bb64-10a6b53b6dda';
  console.log(`Extending manifestation: ${manifestationId}`);

  // Set end_date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await adminSupabase
    .from('manifestations')
    .update({ end_date: tomorrow.toISOString() })
    .eq('id', manifestationId)
    .select();

  if (error) {
    console.error('Error updating manifestation:', error);
  } else {
    console.log('Manifestation extended successfully:', data);
  }
}

extendManifestation();
