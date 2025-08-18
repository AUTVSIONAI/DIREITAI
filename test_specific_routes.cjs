const axios = require('axios');

const BACKEND_URL = 'https://direitai-backend.vercel.app';

async function testRouteStructure() {
    console.log('🔍 Testando estrutura de rotas...\n');
    
    const basicRoutes = [
        '/',
        '/health',
        '/api/health'
    ];
    
    console.log('📋 Testando rotas básicas:');
    for (const route of basicRoutes) {
        try {
            const response = await axios.get(`${BACKEND_URL}${route}`, { timeout: 5000 });
            console.log(`✅ ${route}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (error) {
            console.log(`❌ ${route}: ${error.response?.status || 'TIMEOUT'} - ${error.message}`);
        }
    }
    
    console.log('\n📋 Testando rotas de API:');
    const apiRoutes = [
        '/api/auth/me',
        '/api/users',
        '/api/events',
        '/api/admin',
        '/api/admin/overview'
    ];
    
    for (const route of apiRoutes) {
        try {
            const response = await axios.get(`${BACKEND_URL}${route}`, { 
                timeout: 5000,
                validateStatus: function (status) {
                    // Aceitar qualquer status para ver o que está acontecendo
                    return status < 600;
                }
            });
            console.log(`📡 ${route}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
        } catch (error) {
            console.log(`❌ ${route}: ${error.code || 'ERROR'} - ${error.message}`);
        }
    }
}

async function testSupabaseVariables() {
    console.log('\n🔧 Testando variáveis de ambiente...\n');
    
    try {
        // Criar um endpoint de teste que retorna informações sobre as variáveis
        const response = await axios.get(`${BACKEND_URL}/`, { timeout: 5000 });
        console.log('✅ Servidor respondendo:', response.data);
        
        // Verificar se há informações sobre Supabase na resposta
        if (response.data && typeof response.data === 'object') {
            console.log('📊 Dados do servidor:', JSON.stringify(response.data, null, 2));
        }
        
    } catch (error) {
        console.log('❌ Erro ao testar servidor:', error.message);
    }
}

async function testWithDifferentMethods() {
    console.log('\n🔄 Testando diferentes métodos HTTP...\n');
    
    const endpoint = '/api/admin/overview';
    const methods = ['GET', 'POST', 'OPTIONS'];
    
    for (const method of methods) {
        try {
            const config = {
                method: method.toLowerCase(),
                url: `${BACKEND_URL}${endpoint}`,
                timeout: 5000,
                validateStatus: function (status) {
                    return status < 600;
                }
            };
            
            if (method === 'POST') {
                config.data = {};
            }
            
            const response = await axios(config);
            console.log(`${method} ${endpoint}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
            
        } catch (error) {
            console.log(`❌ ${method} ${endpoint}: ${error.code || 'ERROR'} - ${error.message}`);
        }
    }
}

async function main() {
    console.log('🚀 Iniciando teste de rotas específicas...\n');
    
    await testRouteStructure();
    await testSupabaseVariables();
    await testWithDifferentMethods();
    
    console.log('\n✨ Teste de rotas concluído!');
}

main().catch(console.error);