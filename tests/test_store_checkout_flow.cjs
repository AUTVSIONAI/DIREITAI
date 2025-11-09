const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuração do Supabase
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';
const supabase = createClient(supabaseUrl, supabaseKey);

// URL do backend
const BACKEND_URL = 'http://localhost:5120/api';

// Credenciais de teste
const EMAIL = 'maumautremeterra@gmail.com';
const PASSWORD = '12345678';

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testStoreCheckoutFlow() {
  try {
    console.log('🔐 Fazendo login...');
    
    // 1. Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    });

    if (authError) {
      throw new Error(`Erro no login: ${authError.message}`);
    }

    const token = authData.session.access_token;
    console.log('✅ Login realizado com sucesso');
    console.log('🎫 Token obtido:', token.substring(0, 50) + '...');

    // 2. Obter produtos disponíveis
    console.log('\n📦 Obtendo produtos...');
    const productsResponse = await makeRequest(`${BACKEND_URL}/store/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const productsResult = await productsResponse.json();
    console.log('📦 Resposta dos produtos:', JSON.stringify(productsResult, null, 2));

    if (!productsResult.success || !productsResult.data || productsResult.data.length === 0) {
      console.log('⚠️ Nenhum produto encontrado, criando dados de teste...');
      
      // Simular dados de carrinho para teste
      const testCartData = {
        items: [
          {
            id: 'test-product-1',
            name: 'Produto Teste',
            price: 29.90,
            quantity: 1
          }
        ],
        total: 29.90
      };
      
      console.log('🛒 Dados do carrinho de teste:', JSON.stringify(testCartData, null, 2));
      
      // 3. Tentar checkout com dados de teste
      console.log('\n💳 Tentando checkout...');
      const checkoutResponse = await makeRequest(`${BACKEND_URL}/store/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCartData)
      });

      const checkoutResult = await checkoutResponse.json();
      console.log('💳 Status do checkout:', checkoutResponse.status);
      console.log('💳 Resposta do checkout:', JSON.stringify(checkoutResult, null, 2));
      
      return;
    }

    // Se há produtos, usar o primeiro produto
    const firstProduct = productsResult.data[0];
    console.log('✅ Produto encontrado:', firstProduct.name);

    // 3. Adicionar ao carrinho
    console.log('\n🛒 Adicionando ao carrinho...');
    const addToCartResponse = await makeRequest(`${BACKEND_URL}/store/cart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: firstProduct.id,
        quantity: 1
      })
    });

    const addToCartResult = await addToCartResponse.json();
    console.log('🛒 Resposta adicionar ao carrinho:', JSON.stringify(addToCartResult, null, 2));

    // 4. Obter carrinho
    console.log('\n🛒 Obtendo carrinho...');
    const cartResponse = await makeRequest(`${BACKEND_URL}/store/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const cartResult = await cartResponse.json();
    console.log('🛒 Carrinho atual:', JSON.stringify(cartResult, null, 2));

    // 5. Tentar checkout
    console.log('\n💳 Tentando checkout...');
    const checkoutData = {
      items: cartResult.data?.items || [
        {
          id: firstProduct.id,
          name: firstProduct.name,
          price: firstProduct.price,
          quantity: 1
        }
      ],
      total: firstProduct.price || 29.90
    };

    const checkoutResponse = await makeRequest(`${BACKEND_URL}/store/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(checkoutData)
    });

    const checkoutResult = await checkoutResponse.json();
    console.log('💳 Status do checkout:', checkoutResponse.status);
    console.log('💳 Resposta do checkout:', JSON.stringify(checkoutResult, null, 2));

    if (checkoutResult.success && checkoutResult.data?.url) {
      console.log('✅ Checkout criado com sucesso!');
      console.log('🔗 URL do Stripe:', checkoutResult.data.url);
    } else {
      console.log('❌ Erro no checkout:', checkoutResult.message || 'Erro desconhecido');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testStoreCheckoutFlow();