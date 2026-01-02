const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

// Load env file
const envPath = path.resolve(__dirname, 'backend-oficial', '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env:', result.error);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL ou Key não encontrados.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateAnalytics() {
  console.log('Iniciando população de dados de analytics...');

  try {
    // 1. Tentar inserir na tabela announcements (se existir)
    let announcementId;
    
    // Verificar se a tabela announcements existe e tentar inserir
    try {
      const { data: newAnn, error: createError } = await supabase
        .from('announcements')
        .insert({
          title: 'Anúncio de Teste Analytics',
          message: 'Este é um anúncio para testar as estatísticas.',
          content: 'Conteúdo do anúncio de teste.',
          type: 'info',
          is_active: true,
          is_dismissible: true,
          position: 'top'
        })
        .select()
        .single();

      if (!createError && newAnn) {
        announcementId = newAnn.id;
        console.log('Anúncio criado na tabela announcements:', announcementId);
      } else {
        console.log('Falha ao criar em announcements, tentando notifications:', createError?.message);
      }
    } catch (e) {
      console.log('Tabela announcements não deve existir ou erro:', e.message);
    }

    // Buscar usuário para associação
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users && users.length > 0 ? users[0].id : null;

    if (!announcementId) {
      // Fallback para notifications
      if (!userId) {
        console.error('Nenhum usuário encontrado para associar ao anúncio (fallback).');
        return;
      }

      const { data: newNotif, error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Anúncio de Teste Analytics',
          message: 'Este é um anúncio para testar as estatísticas.',
          type: 'system',
          category: 'system',
          priority: 'medium'
        })
        .select()
        .single();
        
      if (notifError) {
        console.error('Erro ao criar notificação:', notifError);
        return;
      }
      announcementId = newNotif.id;
      console.log('Notificação criada na tabela notifications:', announcementId);
    }

// Testar RLS de ratings com ANON KEY
    try {
        // const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
        // if (anonKey) {
        //     const sbAnon = createClient(supabaseUrl, anonKey);
        //     const { data: rData, error: rError } = await sbAnon
        //         .from('politician_ratings')
        //         .select('id')
        //         .limit(1);
            
        //     if (rError) {
        //         console.log('ERRO RLS RATINGS (ANON):', JSON.stringify(rError));
        //     } else {
        //         console.log('Acesso RLS Ratings (ANON) OK. Encontrados:', rData.length);
        //     }
        // }
    } catch (e) {
        console.log('Erro ao testar RLS:', e);
    }

    console.log(`Usando ID: ${announcementId}`);

    // 2. Inserir dados em notification_stats
    // Verificar se já existe para fazer "upsert manual" pois pode não ter constraint UNIQUE
    const { data: existingStats, error: findStatsError } = await supabase
      .from('notification_stats')
      .select('id')
      .eq('notification_id', announcementId)
      .maybeSingle();

    let statsError;
    if (existingStats) {
       console.log('Atualizando estatísticas existentes...');
       const { error } = await supabase
         .from('notification_stats')
         .update({ sent_count: 100, read_count: 50, clicked_count: 20 })
         .eq('id', existingStats.id);
       statsError = error;
    } else {
       console.log('Criando novas estatísticas...');
       const { error } = await supabase
         .from('notification_stats')
         .insert({ notification_id: announcementId, sent_count: 100, read_count: 50, clicked_count: 20 });
       statsError = error;
    }

    if (statsError) {
      console.log('Erro ao inserir/atualizar notification_stats:', JSON.stringify(statsError));
    } else {
      console.log('Dados inseridos/atualizados em notification_stats.');
    }

    // Sincronizar Usuários (Fix para "Usuário anônimo")
    console.log('Iniciando sincronização de usuários...');
    const { data: { users: authUsers }, error: listUsersError } = await supabase.auth.admin.listUsers();
    
    if (listUsersError) {
        console.log('Erro ao listar usuários do Auth:', listUsersError);
    } else if (authUsers && authUsers.length > 0) {
        console.log(`Encontrados ${authUsers.length} usuários no Auth. Sincronizando com public.users...`);
        
        for (const u of authUsers) {
            // Tentar encontrar usuário existente pelo auth_id
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('auth_id', u.id)
                .maybeSingle();

            const userData = {
                auth_id: u.id,
                email: u.email,
                full_name: (u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split('@')[0]).slice(0, 100),
                username: (u.user_metadata?.username || u.email?.split('@')[0]).slice(0, 30),
                avatar_url: u.user_metadata?.avatar_url
            };

            let error;
            if (existingUser) {
                // Atualizar
                const { error: updateError } = await supabase
                    .from('users')
                    .update(userData)
                    .eq('id', existingUser.id);
                error = updateError;
            } else {
                // Inserir (usando ID do auth como ID público se possível, ou deixando gerar)
                // Se a tabela users usa uuid gerado, não devemos forçar id, a menos que queiramos que sejam iguais.
                // Mas se já existem usuários com IDs diferentes, melhor não forçar id na inserção se não for necessário.
                // Porém, para consistência, se não existe, tentamos criar com o mesmo ID.
                const { error: insertError } = await supabase
                    .from('users')
                    .insert({ id: u.id, ...userData }); // Tentamos forçar ID igual ao Auth ID
                error = insertError;
            }
            
            if (error) {
                console.log(`Erro ao sincronizar usuário ${u.email}:`, error.message);
            }
        }
        console.log('Sincronização de usuários concluída.');
    } else {
        console.log('Nenhum usuário encontrado no Auth para sincronizar.');
    }

    // 3. Inserir dados em announcement_views
    if (userId) {
      console.log(`Usando usuário ID: ${userId}`);
      
      const { error: viewError } = await supabase
        .from('announcement_views')
        .upsert({ announcement_id: announcementId, user_id: userId }, { onConflict: 'announcement_id,user_id' });
        
      if (viewError) console.log('Erro ao inserir view:', JSON.stringify(viewError));
      else console.log('View inserida com sucesso.');

      const { error: clickError } = await supabase
        .from('announcement_clicks')
        .insert({ announcement_id: announcementId, user_id: userId });
        
      if (clickError) console.log('Erro ao inserir click:', JSON.stringify(clickError));
      else console.log('Click inserido com sucesso.');

      const { error: dismissError } = await supabase
        .from('announcement_dismissals')
        .upsert({ announcement_id: announcementId, user_id: userId }, { onConflict: 'announcement_id,user_id' });
        
      if (dismissError) console.log('Erro ao inserir dismissal:', JSON.stringify(dismissError));
      else console.log('Dismissal inserido com sucesso.');
    }

    console.log('Processo concluído.');

  } catch (err) {
    console.error('Erro inesperado:', err);
  }
}

populateAnalytics();
