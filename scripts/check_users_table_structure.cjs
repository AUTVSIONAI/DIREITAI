const { createClient } = require('@supabase/supabase-js');

// Configurações
const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyODE5ODUsImV4cCI6MjA2OTg1Nzk4NX0.a3WlLKS1HrSCqWuG80goBsoUaUhtpRsV8mqmTAYpIAo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUsersTableStructure() {
  console.log('🔍 Verificando estrutura da tabela users...');
  
  try {
    // Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'maumautremeterra@gmail.com',
      password: '12345678'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso');
    const userId = authData.user.id;
    
    // Buscar um usuário para ver a estrutura
    console.log('\n📊 Buscando estrutura da tabela users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', userId)
      .single();
    
    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
      console.error('📋 Detalhes:', userError);
    } else {
      console.log('✅ Usuário encontrado!');
      console.log('📋 Estrutura da tabela users:');
      console.log('Colunas disponíveis:', Object.keys(userData));
      console.log('\n📋 Dados do usuário:');
      Object.entries(userData).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    // Tentar buscar todos os usuários para ver mais estruturas
    console.log('\n📊 Buscando outros usuários para comparar estrutura...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .limit(3);
    
    if (allUsersError) {
      console.error('❌ Erro ao buscar todos os usuários:', allUsersError.message);
    } else {
      console.log('✅ Outros usuários encontrados:', allUsers.length);
      allUsers.forEach((user, index) => {
        console.log(`\n👤 Usuário ${index + 1}:`);
        console.log('   ID:', user.id);
        console.log('   Auth ID:', user.auth_id);
        console.log('   Email:', user.email);
        console.log('   Username:', user.username);
        console.log('   Full Name:', user.full_name);
        console.log('   Role:', user.role);
        console.log('   Todas as colunas:', Object.keys(user));
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkUsersTableStructure();