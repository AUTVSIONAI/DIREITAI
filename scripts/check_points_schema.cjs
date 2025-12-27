const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log('Checking points table...');
  const { data, error } = await supabase
    .from('points')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching points:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Columns in points table:', Object.keys(data[0]));
      console.log('Sample data:', data[0]);
    } else {
      console.log('No data in points table to infer columns.');
      // Try to insert a dummy record to see if it fails (and why) or just rely on code inference
    }
  }
}

checkTable();
