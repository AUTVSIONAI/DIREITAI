const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend-oficial/.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'geographic_checkins';
  `;

  console.log('Running SQL:', sql);

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: sql
  });

  if (error) {
    console.error('Error executing SQL:', error);
  } else {
    console.log('Result:', JSON.stringify(data, null, 2));
  }
}

run();
