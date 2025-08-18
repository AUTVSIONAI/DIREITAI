const axios = require('axios');

const BACKEND_URL = 'https://direitai-backend.vercel.app';

async function testProductionEndpoints() {
    console.log('🔍 Testando endpoints em produção...\n');
    
    const endpoints = [
        '/api/health',
        '/api/admin/overview',
        '/api/admin/users',
        '/api/events?page=1&limit=5'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`📡 Testando: ${BACKEND_URL}${endpoint}`);
            
            const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'DireitAI-Test/1.0'
                }
            });
            
            console.log(`✅ Status: ${response.status}`);
            console.log(`📄 Response:`, JSON.stringify(response.data, null, 2));
            
        } catch (error) {
            console.log(`❌ Erro no endpoint ${endpoint}:`);
            console.log(`   Status: ${error.response?.status || 'N/A'}`);
            console.log(`   Message: ${error.message}`);
            
            if (error.response?.data) {
                console.log(`   Response Data:`, JSON.stringify(error.response.data, null, 2));
            }
            
            if (error.response?.headers) {
                console.log(`   Headers:`, error.response.headers);
            }
        }
        
        console.log('─'.repeat(50));
    }
}

async function testSupabaseConnection() {
    console.log('\n🔗 Testando conexão específica com Supabase...\n');
    
    try {
        // Teste simples de health check
        const healthResponse = await axios.get(`${BACKEND_URL}/api/health`);
        console.log('✅ Health check passou:', healthResponse.data);
        
        // Teste de endpoint que usa Supabase
        const adminResponse = await axios.get(`${BACKEND_URL}/api/admin/overview`);
        console.log('✅ Admin overview passou:', adminResponse.data);
        
    } catch (error) {
        console.log('❌ Erro na conexão com Supabase:');
        console.log('   Error:', error.message);
        
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', error.response.data);
            
            // Verificar se é erro de autenticação do Supabase
            if (error.response.data && typeof error.response.data === 'string') {
                if (error.response.data.includes('JWT') || error.response.data.includes('authentication')) {
                    console.log('🔑 Possível problema de autenticação JWT/Supabase');
                }
                if (error.response.data.includes('connection') || error.response.data.includes('timeout')) {
                    console.log('🌐 Possível problema de conexão de rede');
                }
            }
        }
    }
}

async function main() {
    console.log('🚀 Iniciando teste detalhado de produção...\n');
    
    await testProductionEndpoints();
    await testSupabaseConnection();
    
    console.log('\n✨ Teste concluído!');
}

main().catch(console.error);