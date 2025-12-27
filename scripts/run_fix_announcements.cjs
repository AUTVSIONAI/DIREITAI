const { adminSupabase } = require('../backend-oficial/config/supabase');
const fs = require('fs');
const path = require('path');

async function run() {
  try {
    console.log('🔌 Conectando ao Supabase...');
    
    const sqlPath = path.join(__dirname, '../backend-oficial/sql/fix_announcements_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Lendo arquivo SQL:', sqlPath);
    console.log('🚀 Executando SQL...');

    const { data, error } = await adminSupabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Fallback: try to execute statements individually if exec_sql is not available or fails on block
      console.log('⚠️ Tentando executar via query direta (apenas se exec_sql falhar por permissão)...');
      // Note: supabase-js doesn't support raw query without rpc.
      // If exec_sql fails, we might check if it's because the function doesn't exist.
    } else {
      console.log('✅ SQL executado com sucesso!');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

run();
