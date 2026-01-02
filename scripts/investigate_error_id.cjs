
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigate() {
  const targetId = '0155ccb7-e67f-41dc-a133-188f97996b73';
  console.log(`🔍 Investigando ID: ${targetId}`);

  // 1. Checar public.users
  const { data: publicUser } = await supabase.from('users').select('*').eq('id', targetId).maybeSingle();
  console.log('Public User:', publicUser || 'Não encontrado');

  // 2. Checar Auth Users
  const { data: { user: authUser }, error } = await supabase.auth.admin.getUserById(targetId);
  console.log('Auth User:', authUser ? `Encontrado: ${authUser.email}` : 'Não encontrado');

  if (authUser && !publicUser) {
      console.log('⚠️ Usuário existe no Auth mas não na tabela pública. Tentando criar...');
      const { error: insertError } = await supabase.from('users').insert({
          id: targetId,
          auth_id: targetId,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
          created_at: new Date(),
          updated_at: new Date()
      });
      if (insertError) console.error('Erro ao criar:', insertError);
      else console.log('✅ Usuário criado na tabela pública!');
  } else if (!authUser && !publicUser) {
      console.log('❌ Usuário não existe em lugar nenhum. É um registro órfão seguro para deletar.');
  }
}

investigate();
