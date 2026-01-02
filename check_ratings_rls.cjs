const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '.env');
const envConfig = require('dotenv').config({ path: envPath }).parsed || {};

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Use ANON KEY to simulate frontend
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

if (!supabaseUrl || !supabaseKey) {
  console.error('URL ou Anon Key do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRatingsRLS() {
  console.log('Verificando acesso público (ANON) a politician_ratings...');
  
  const { data, error } = await supabase
    .from('politician_ratings')
    .select('politician_id, rating')
    .limit(5);
    
  if (error) {
    console.error('Erro de acesso (RLS provável):', error);
  } else {
    console.log('Acesso permitido via ANON. Ratings:', data.length);
    if (data.length > 0) console.log('Exemplo:', data[0]);
  }
}

checkRatingsRLS();
