const axios = require('axios');

// Simular as variáveis de ambiente como no Vercel
const SUPABASE_URL = 'https://your-project.supabase.co'; // URL padrão se não configurada
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key'; // Key padrão se não configurada

async function testSupabaseDirect() {
  console.log('🔍 Testando conexão direta com Supabase...');
  console.log('📡 URL:', SUPABASE_URL);
  console.log('🔑 Key:', SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...');
  
  try {
    // Testar se conseguimos acessar a API REST do Supabase
    const response = await axios.get(`${SUPABASE_URL}/rest/v1/politicians?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Conexão com Supabase funcionando!');
    console.log('📊 Dados:', response.data);
    
  } catch (error) {
    console.log('❌ Erro na conexão com Supabase:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log('Message:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n🚨 PROBLEMA: URL do Supabase não é válida!');
      console.log('A URL padrão "https://your-project.supabase.co" não existe.');
      console.log('Você precisa configurar a URL real do seu projeto Supabase no Vercel.');
    }
  }
}

// Também testar com uma URL de exemplo mais realista
async function testWithRealURL() {
  console.log('\n🔍 Testando com URL de exemplo mais realista...');
  
  // Exemplo de URL real do Supabase (não funcionará, mas mostra o formato correto)
  const EXAMPLE_URL = 'https://abcdefghijklmnop.supabase.co';
  
  try {
    const response = await axios.get(`${EXAMPLE_URL}/rest/v1/politicians?select=*&limit=1`, {
      headers: {
        'apikey': 'example-key',
        'Authorization': 'Bearer example-key',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    console.log('✅ Conexão funcionou (improvável)');
    
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log('❌ URL de exemplo também não existe (esperado)');
      console.log('\n📋 SOLUÇÃO:');
      console.log('1. Acesse seu projeto no Supabase Dashboard');
      console.log('2. Vá em Settings > API');
      console.log('3. Copie a URL do projeto (formato: https://[project-id].supabase.co)');
      console.log('4. Configure essa URL na variável SUPABASE_URL no Vercel');
    } else {
      console.log('❌ Outro erro:', error.message);
    }
  }
}

testSupabaseDirect().then(() => testWithRealURL());