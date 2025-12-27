const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  console.log('Checking badges table...');
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching badges:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Columns in badges table:', Object.keys(data[0]));
    } else {
      console.log('No data in badges table to infer columns.');
    }
  }
}

checkTable();
