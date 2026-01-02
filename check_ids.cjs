const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '.env');
const envConfig = require('dotenv').config({ path: envPath }).parsed || {};

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('URL ou Key do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIds() {
  console.log('Verificando IDs em politician_ratings...');
  
  const { data, error } = await supabase
    .from('politician_ratings')
    .select('politician_id, rating')
    .limit(10);
    
  if (error) {
    console.error('Erro:', error);
  } else {
    console.log('Ratings encontrados:', data);
    if (data.length > 0) {
        console.log('Exemplo de ID:', data[0].politician_id, 'Tipo:', typeof data[0].politician_id);
    }
  }

  console.log('\nVerificando tabela announcement_views...');
  const { error: viewError } = await supabase
    .from('announcement_views')
    .select('*')
    .limit(1);
    
  if (viewError) {
      console.log('Erro ao acessar announcement_views:', viewError);
  } else {
      console.log('Tabela announcement_views acessível.');
  }
}

checkIds();
