const https = require('https');

// URL base da produção oficial
const BASE_URL = 'https://direitai-backend.vercel.app';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testOfficialBackend() {
  console.log('🧪 Testando backend oficial em produção...\n');
  console.log(`🔗 URL Base: ${BASE_URL}\n`);
  
  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/health`,
      method: 'GET'
    },
    {
      name: 'Root Endpoint',
      url: `${BASE_URL}/`,
      method: 'GET'
    },
    {
      name: 'Events - Nearby (sem parâmetros)',
      url: `${BASE_URL}/api/events/nearby`,
      method: 'GET'
    },
    {
      name: 'Events - Active',
      url: `${BASE_URL}/api/events/active`,
      method: 'GET'
    },
    {
      name: 'Admin - Overview (sem auth)',
      url: `${BASE_URL}/api/admin/overview`,
      method: 'GET'
    },
    {
      name: 'Politicians',
      url: `${BASE_URL}/api/politicians`,
      method: 'GET'
    },
    {
      name: 'Manifestations',
      url: `${BASE_URL}/api/manifestations`,
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📡 Testando: ${test.name}`);
      console.log(`🔗 URL: ${test.url}`);
      
      const response = await makeRequest(test.url, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Status: ${response.statusCode}`);
      
      if (response.statusCode === 200) {
        try {
          const jsonData = JSON.parse(response.data);
          if (Array.isArray(jsonData)) {
            console.log(`📊 Resposta: Array com ${jsonData.length} itens`);
            if (jsonData.length > 0) {
              console.log(`📋 Primeiro item: ${JSON.stringify(jsonData[0], null, 2).substring(0, 200)}...`);
            }
          } else {
            console.log(`📊 Resposta: ${JSON.stringify(jsonData, null, 2).substring(0, 300)}...`);
          }
        } catch (e) {
          console.log(`📊 Resposta (texto): ${response.data.substring(0, 200)}...`);
        }
      } else if (response.statusCode === 401) {
        console.log(`🔒 Endpoint protegido (401 - Unauthorized)`);
      } else if (response.statusCode === 403) {
        console.log(`🚫 Acesso negado (403 - Forbidden)`);
      } else {
        console.log(`❌ Erro ${response.statusCode}: ${response.data.substring(0, 200)}...`);
      }
      
      console.log('─'.repeat(60));
      
    } catch (error) {
      console.log(`❌ Erro na requisição: ${error.message}`);
      console.log('─'.repeat(60));
    }
  }
  
  console.log('\n🏁 Testes do backend oficial concluídos!');
}

testOfficialBackend().catch(console.error);