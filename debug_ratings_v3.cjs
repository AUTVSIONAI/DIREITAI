const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, '.env');
const envConfig = require('dotenv').config({ path: envPath }).parsed || {};

const supabaseUrl = envConfig.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role to bypass RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('URL ou Key do Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRatings() {
  console.log('Iniciando debug de ratings...');
  
    // 1. Buscar alguns ratings
    console.log('Buscando ratings...');
    const { data: ratings, error } = await supabase
      .from('politician_ratings')
      .select(`
        id,
        rating,
        comment,
        user_id,
        politician_id,
        users:user_id (
          id,
          full_name,
          username,
          email,
          avatar_url
        )
      `)
      .limit(10)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ratings:', error);
      return;
    }

    console.log(`Encontrados ${ratings.length} ratings.`);
    ratings.forEach((r, i) => {
      console.log(`[${i}] ID: ${r.id}, Rating: ${r.rating}, PoliticianID: ${r.politician_id} (${typeof r.politician_id}), User: ${r.users?.full_name || 'N/A'}`);
    });
}

debugRatings();
