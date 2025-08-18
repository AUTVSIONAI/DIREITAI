const https = require('https');

// URL base da produção
const BASE_URL = 'https://backend-repo-me1sha0su-oseias-gomes-projects.vercel.app';

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

async function testEndpoints() {
  console.log('🧪 Testando endpoints em produção...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Ping',
      url: `${BASE_URL}/api/ping`,
      method: 'GET'
    },
    {
      name: 'Simple Test',
      url: `${BASE_URL}/api/simple`,
      method: 'GET'
    },
    {
      name: 'Events - Nearby (sem parâmetros)',
      url: `${BASE_URL}/api/events/nearby`,
      method: 'GET'
    },
    {
      name: 'Events - Map',
      url: `${BASE_URL}/api/events/map`,
      method: 'GET'
    },
    {
      name: 'Events - Active',
      url: `${BASE_URL}/api/events/active`,
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
          console.log(`📊 Resposta: ${JSON.stringify(jsonData, null, 2).substring(0, 200)}...`);
        } catch (e) {
          console.log(`📊 Resposta (texto): ${response.data.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ Erro: ${response.data}`);
      }
      
      console.log('─'.repeat(50));
      
    } catch (error) {
      console.log(`❌ Erro na requisição: ${error.message}`);
      console.log('─'.repeat(50));
    }
  }
  
  console.log('\n🏁 Testes concluídos!');
}

testEndpoints().catch(console.error);