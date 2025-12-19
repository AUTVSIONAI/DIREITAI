const { createClient } = require('@supabase/supabase-js');

// Configurações
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTable() {
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error fetching politicians:', error);
  } else {
    if (data && data.length > 0) {
      console.log('Columns in politicians table:', Object.keys(data[0]));
    } else {
      console.log('No data in politicians table to infer columns.');
    }
  }
}

checkTable();
