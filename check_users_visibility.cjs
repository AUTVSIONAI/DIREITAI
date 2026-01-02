
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
const envConfig = require('dotenv').parse(fs.readFileSync(envPath));

const supabaseUrl = envConfig.SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_ANON_KEY; // Usar service role se possível para ver tudo, mas aqui queremos testar visibilidade publica?
// Para testar visibilidade, deveríamos usar a ANON KEY. Mas primeiro vamos verificar se o service role consegue ver.
// Se usarmos service role, sempre vai ver.
// Vamos usar a ANON KEY para simular um usuário não autenticado ou usuário comum.
const supabaseAnonKey = envConfig.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ou Key não encontrados.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkVisibility() {
  console.log('Verificando visibilidade da tabela users com chave ANÔNIMA...');
  
  // 1. Tentar buscar todos os usuários (limit 5)
  const { data, error } = await supabase
    .from('users')
    .select('id, full_name, email')
    .limit(5);

  if (error) {
    console.error('Erro ao buscar usuários:', error.message);
    console.error('Detalhes:', error);
  } else {
    console.log(`Sucesso! Encontrados ${data.length} usuários.`);
    console.table(data);
    
    if (data.length === 0) {
        console.log('ALERTA: A consulta retornou 0 usuários. Isso pode indicar que a política RLS está bloqueando o acesso.');
        
        // Vamos tentar com a service role key para confirmar que existem usuários
        const sbService = createClient(supabaseUrl, envConfig.SUPABASE_SERVICE_ROLE_KEY);
        const { data: allUsers, count } = await sbService.from('users').select('*', { count: 'exact', head: true });
        console.log(`Confirmação via Service Role: Existem ${count} usuários no total.`);
    }
  }
}

checkVisibility();
