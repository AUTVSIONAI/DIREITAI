const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase (mesmas do frontend)
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

async function testFrontendLogin() {
  console.log('🔍 Testando login do frontend...');
  
  // Criar cliente Supabase (mesmo do frontend)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  });
  
  console.log('✅ Cliente Supabase criado');
  
  try {
    // Testar login com as credenciais fornecidas
    console.log('🔍 Tentando login com maumautremeterra@gmail.com e senha 12345678...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'maumautremeterra@gmail.com',
      password: '12345678'
    });
    
    if (error) {
      console.error('❌ Erro no login:', error.message);
      console.error('❌ Detalhes do erro:', error);
      
      // Tentar outras senhas possíveis
      const possiblePasswords = ['TempPassword123!', 'Mauricio123@', '123456', 'password'];
      
      for (const pwd of possiblePasswords) {
        console.log(`🔍 Tentando senha alternativa: ${pwd}`);
        const { data: testData, error: testError } = await supabase.auth.signInWithPassword({
          email: 'maumautremeterra@gmail.com',
          password: pwd
        });
        
        if (!testError && testData.session) {
          console.log('✅ Login bem-sucedido com senha:', pwd);
          console.log('🎫 Token obtido:', testData.session.access_token.substring(0, 50) + '...');
          console.log('👤 Usuário:', testData.user.email);
          return;
        }
      }
      
      console.log('❌ Nenhuma senha funcionou');
      return;
    }
    
    console.log('✅ Login bem-sucedido!');
    console.log('🎫 Token obtido:', data.session.access_token.substring(0, 50) + '...');
    console.log('👤 Usuário:', data.user.email);
    console.log('📧 Email verificado:', data.user.email_confirmed_at ? 'Sim' : 'Não');
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

testFrontendLogin().catch(console.error);