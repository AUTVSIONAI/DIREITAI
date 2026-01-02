const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables manually
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const envConfig = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.trim();
  }
});

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnnouncementsDB() {
  console.log('🔍 Verificando banco de dados de Anúncios...');

  // 1. Verificar tabela announcement_clicks
  const { error: tableError } = await supabase
    .from('announcement_clicks')
    .select('count', { count: 'exact', head: true })
    .limit(1);

  if (tableError) {
    console.error('❌ Tabela announcement_clicks inacessível:', tableError.message);
  } else {
    console.log('✅ Tabela announcement_clicks existe e é acessível.');
  }

  // 2. Verificar RPC increment_announcement_click
  // Tentar chamar com um ID inexistente para ver se a função existe
  const { error: rpcError } = await supabase
    .rpc('increment_announcement_click', { announcement_id_input: '00000000-0000-0000-0000-000000000000' });

  if (rpcError && rpcError.message.includes('function increment_announcement_click') && rpcError.message.includes('does not exist')) {
    console.error('❌ RPC increment_announcement_click NÃO existe.');
  } else {
    console.log('✅ RPC increment_announcement_click parece existir (erro esperado ou sucesso):', rpcError ? rpcError.message : 'Sucesso');
  }

  // 3. Verificar dados de cliques em um anúncio existente
  const { data: announcements } = await supabase
    .from('announcements')
    .select('id, title, click_count, view_count, dismiss_count')
    .limit(5);

  console.log('\n📊 Estatísticas de Anúncios (Top 5):');
  announcements.forEach(a => {
    console.log(`- [${a.title}] Clicks: ${a.click_count}, Views: ${a.view_count}, Dismiss: ${a.dismiss_count}`);
  });

}

checkAnnouncementsDB();
