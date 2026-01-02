const { createClient } = require('@supabase/supabase-js');

// Hardcoded for debugging to ensure it works
const SUPABASE_URL = 'https://vussgslenvyztckeuyap.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  console.log('🔍 Listando tabelas e contagens...');
  
  const potentialTables = [
    'notifications',
    'announcements', // The component uses this name, but backend might use 'notifications' with type='announcement'
    'notification_stats', // For analytics
    'announcement_views',
    'announcement_clicks',
    'announcement_dismissals'
  ];
  
  for (const table of potentialTables) {
    try {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Tabela '${table}': Erro - ${error.message} (provavelmente não existe)`);
      } else {
        console.log(`✅ Tabela '${table}' existe. Linhas: ${count}`);
      }
    } catch (e) {
      console.log(`❌ Tabela '${table}': Exceção - ${e.message}`);
    }
  }

  // Check structure of notifications table if it exists
  console.log('\n🔍 Verificando estrutura de "notifications"...');
  const { data: notifData, error: notifError } = await supabase.from('notifications').select('*').limit(1);
  if (notifData && notifData.length > 0) {
    console.log('Exemplo de notificação:', Object.keys(notifData[0]));
  } else if (notifData) {
     console.log('Tabela notifications vazia, mas existe.');
  } else {
     console.log('Erro ao ler notifications:', notifError?.message);
  }

  // Check specific announcement records
  console.log('\n🔍 Buscando notificações do tipo "announcement"...');
  const { count: annCount, error: annError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'announcement');
    
  if (annError) {
    console.log('Erro ao buscar announcements:', annError.message);
  } else {
    console.log(`Encontrados ${annCount} registros de 'announcement' na tabela 'notifications'.`);
  }
}

listTables();
