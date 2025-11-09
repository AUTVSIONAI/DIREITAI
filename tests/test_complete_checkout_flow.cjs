const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuração
const BACKEND_URL = 'http://localhost:5120/api';
const TEST_EMAIL = 'franchikopara@gmail.com';
const TEST_PASSWORD = 'senha123'; // Vamos tentar uma senha comum

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

async function testCompleteCheckoutFlow() {
  try {
    console.log('🔐 Fazendo login com usuário existente...');
    
    // 1. Login direto com usuário existente
    const loginResponse = await makeRequest(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste.checkout.flow@gmail.com',
        password: 'TesteCheckout123!'
      })
    });
    
    const loginResult = await loginResponse.json();
    
    if (loginResponse.status !== 200 || !loginResult.session?.access_token) {
      throw new Error('Login falhou: ' + JSON.stringify(loginResult));
    }
    
    const token = loginResult.session.access_token;
    console.log('✅ Login realizado com sucesso');
    
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
    console.log('📦 Produtos encontrados:', productsResult.products?.length || 0);
    
    if (!productsResult.products || productsResult.products.length === 0) {
      throw new Error('Nenhum produto encontrado');
    }
    
    const firstProduct = productsResult.products[0];
    console.log('📦 Produto selecionado:', firstProduct.name, '- R$', firstProduct.price);
    
    // 3. Limpar carrinho primeiro
    console.log('\n🧹 Limpando carrinho...');
    const cartResponse = await makeRequest(`${BACKEND_URL}/store/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const cartResult = await cartResponse.json();
    if (cartResult.cart_items && cartResult.cart_items.length > 0) {
      for (const item of cartResult.cart_items) {
        await makeRequest(`${BACKEND_URL}/store/cart/${item.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      console.log('🧹 Carrinho limpo');
    }
    
    // 4. Adicionar produto ao carrinho
    console.log('\n🛒 Adicionando produto ao carrinho...');
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
    console.log('🛒 Status adicionar ao carrinho:', addToCartResponse.status);
    console.log('🛒 Resultado:', JSON.stringify(addToCartResult, null, 2));
    
    if (addToCartResponse.status !== 201 && addToCartResponse.status !== 200) {
      throw new Error('Falha ao adicionar ao carrinho: ' + JSON.stringify(addToCartResult));
    }
    
    console.log('✅ Produto adicionado ao carrinho com sucesso');
    
    // 5. Verificar carrinho
    console.log('\n🛒 Verificando carrinho...');
    const updatedCartResponse = await makeRequest(`${BACKEND_URL}/store/cart`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const updatedCartResult = await updatedCartResponse.json();
    console.log('🛒 Carrinho atual:', JSON.stringify(updatedCartResult, null, 2));
    
    if (!updatedCartResult.cart_items || updatedCartResult.cart_items.length === 0) {
      throw new Error('Carrinho ainda está vazio após adicionar produto');
    }
    
    // 6. Fazer checkout
    console.log('\n💳 Fazendo checkout...');
    const checkoutResponse = await makeRequest(`${BACKEND_URL}/store/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const checkoutResult = await checkoutResponse.json();
    console.log('💳 Status do checkout:', checkoutResponse.status);
    console.log('💳 Resposta do checkout:', JSON.stringify(checkoutResult, null, 2));
    
    if (checkoutResult.success && checkoutResult.data?.url) {
      console.log('✅ Checkout criado com sucesso!');
      console.log('🔗 URL do Stripe:', checkoutResult.data.url);
    } else {
      console.log('❌ Erro no checkout:', checkoutResult.message || checkoutResult.error || 'Erro desconhecido');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testCompleteCheckoutFlow();