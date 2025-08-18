const axios = require('axios');

// Usar as mesmas variáveis que o servidor usa
const SUPABASE_URL = 'https://vussgslenvyztckeuyap.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

async function testSupabaseDirectly() {
    console.log('🔍 Testando conexão direta com Supabase...\n');
    
    const headers = {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
    
    console.log('📊 Configuração:');
    console.log('URL:', SUPABASE_URL);
    console.log('Key:', SUPABASE_SERVICE_ROLE_KEY ? `${SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : 'NÃO CONFIGURADA');
    console.log('');
    
    // Teste 1: Verificar se o Supabase está acessível
    try {
        console.log('🔗 Teste 1: Verificando acesso ao Supabase...');
        const response = await axios.get(`${SUPABASE_URL}/rest/v1/`, {
            headers: headers,
            timeout: 10000
        });
        console.log('✅ Supabase acessível:', response.status);
    } catch (error) {
        console.log('❌ Erro ao acessar Supabase:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
        return;
    }
    
    // Teste 2: Listar tabelas disponíveis
    try {
        console.log('\n🗂️ Teste 2: Listando tabelas...');
        const response = await axios.get(`${SUPABASE_URL}/rest/v1/events?select=id&limit=1`, {
            headers: headers,
            timeout: 10000
        });
        console.log('✅ Tabela events acessível:', response.status);
        console.log('   Dados:', response.data);
    } catch (error) {
        console.log('❌ Erro ao acessar tabela events:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
    }
    
    // Teste 3: Verificar tabela users
    try {
        console.log('\n👥 Teste 3: Verificando tabela users...');
        const response = await axios.get(`${SUPABASE_URL}/rest/v1/users?select=id&limit=1`, {
            headers: headers,
            timeout: 10000
        });
        console.log('✅ Tabela users acessível:', response.status);
        console.log('   Dados:', response.data);
    } catch (error) {
        console.log('❌ Erro ao acessar tabela users:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
    }
}

async function testProductionEndpointWithAuth() {
    console.log('\n🔐 Testando endpoint de produção com autenticação...\n');
    
    try {
        // Primeiro, tentar fazer login para obter um token
        console.log('🔑 Tentando fazer login...');
        const loginResponse = await axios.post('https://direitai-backend.vercel.app/api/auth/login', {
            email: 'admin@direitai.com', // Use um email de admin válido
            password: 'admin123' // Use a senha correta
        });
        
        if (loginResponse.data.token) {
            console.log('✅ Login bem-sucedido');
            
            // Agora testar o endpoint admin com o token
            const adminResponse = await axios.get('https://direitai-backend.vercel.app/api/admin/overview', {
                headers: {
                    'Authorization': `Bearer ${loginResponse.data.token}`
                }
            });
            
            console.log('✅ Admin overview funcionando:', adminResponse.data);
        }
        
    } catch (error) {
        console.log('❌ Erro no teste com autenticação:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
        }
    }
}

async function main() {
    console.log('🚀 Iniciando debug da conexão Supabase...\n');
    
    // Verificar se as variáveis estão definidas
    if (!SUPABASE_URL || SUPABASE_URL.includes('your-project')) {
        console.log('❌ SUPABASE_URL não está configurada corretamente');
        console.log('   Configure a URL real do seu projeto Supabase');
        return;
    }
    
    if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.includes('your-service')) {
        console.log('❌ SUPABASE_SERVICE_ROLE_KEY não está configurada corretamente');
        console.log('   Configure a chave de serviço real do seu projeto Supabase');
        return;
    }
    
    await testSupabaseDirectly();
    await testProductionEndpointWithAuth();
    
    console.log('\n✨ Debug concluído!');
}

main().catch(console.error);