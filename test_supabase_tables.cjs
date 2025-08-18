const axios = require('axios');

// Variáveis de ambiente hardcoded para teste
const SUPABASE_URL = 'https://ixjqxqxqxqxqxqxqxqxq.supabase.co'; // Substitua pela URL real
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Substitua pela chave real

async function testSupabaseTables() {
  console.log('🔍 Testando estrutura das tabelas no Supabase...\n');
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  // Testar tabela politicians
  console.log('📊 Testando tabela politicians...');
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/politicians?limit=1`, { headers });
    console.log('✅ Tabela politicians existe');
    
    if (response.data && response.data.length > 0) {
      console.log('📋 Colunas disponíveis:', Object.keys(response.data[0]));
    } else {
      console.log('📋 Tabela vazia, tentando buscar estrutura...');
      
      // Tentar inserir um registro vazio para ver quais campos são obrigatórios
      try {
        await axios.post(`${SUPABASE_URL}/rest/v1/politicians`, {}, { headers });
      } catch (insertError) {
        console.log('📋 Campos obrigatórios:', insertError.response?.data?.message || 'Não foi possível determinar');
      }
    }
  } catch (error) {
    console.error('❌ Erro ao acessar tabela politicians:', error.response?.data || error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Testar tabela manifestations
  console.log('📊 Testando tabela manifestations...');
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/manifestations?limit=1`, { headers });
    console.log('✅ Tabela manifestations existe');
    
    if (response.data && response.data.length > 0) {
      console.log('📋 Colunas disponíveis:', Object.keys(response.data[0]));
    } else {
      console.log('📋 Tabela vazia');
    }
  } catch (error) {
    console.error('❌ Erro ao acessar tabela manifestations:', error.response?.data || error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Testar tabela events
  console.log('📊 Testando tabela events...');
  try {
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/events?limit=1`, { headers });
    console.log('✅ Tabela events existe');
    
    if (response.data && response.data.length > 0) {
      console.log('📋 Colunas disponíveis:', Object.keys(response.data[0]));
    } else {
      console.log('📋 Tabela vazia');
    }
  } catch (error) {
    console.error('❌ Erro ao acessar tabela events:', error.response?.data || error.message);
  }

  console.log('\n' + '─'.repeat(60) + '\n');

  // Testar variáveis de ambiente
  console.log('🔧 Verificando variáveis de ambiente...');
  console.log('SUPABASE_URL:', SUPABASE_URL ? '✅ Definida' : '❌ Não definida');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✅ Definida' : '❌ Não definida');
  
  if (SUPABASE_URL) {
    console.log('URL:', SUPABASE_URL);
  }
  
  if (SUPABASE_KEY) {
    console.log('Key (primeiros 20 chars):', SUPABASE_KEY.substring(0, 20) + '...');
  }
}

testSupabaseTables().catch(console.error);