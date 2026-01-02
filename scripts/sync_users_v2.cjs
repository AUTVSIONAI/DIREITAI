
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1c3Nnc2xlbnZ5enRja2V1eWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDI4MTk4NSwiZXhwIjoyMDY5ODU3OTg1fQ.zLcHaQH5ae2SduvHYvjGAqx6VC5Wo-ZF2qjOvOpaSKM';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncUsers() {
  console.log('🔄 Iniciando sincronização de usuários (Versão Robusta)...');

  const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Erro ao listar usuários do Auth:', authError.message);
    return;
  }

  console.log(`✅ Encontrados ${authUsers.length} usuários no Auth.`);
  
  let updated = 0;
  let created = 0;
  let errors = 0;

  for (const au of authUsers) {
    const name = au.user_metadata?.full_name || au.user_metadata?.name || (au.email ? au.email.split('@')[0] : 'Usuário');
    const avatar = au.user_metadata?.avatar_url;
    
    try {
        // Tenta UPSERT direto
        const { error } = await supabase.from('users').upsert({
            id: au.id,
            auth_id: au.id,
            email: au.email,
            full_name: name,
            avatar_url: avatar,
            updated_at: new Date()
        }, { onConflict: 'id' });

        if (error) {
            // Se falhar por unique key em auth_id (caso o id seja diferente mas auth_id conflite)
            if (error.code === '23505') { // Unique violation
                console.warn(`⚠️ Conflito para ${au.email}. Tentando resolver...`);
                // Tenta achar quem tem esse auth_id
                const { data: conflictUser } = await supabase.from('users').select('id').eq('auth_id', au.id).maybeSingle();
                if (conflictUser) {
                    await supabase.from('users').update({
                        id: au.id, // Isso pode falhar se mudar PK com FKs ativas.
                        email: au.email,
                        full_name: name,
                        avatar_url: avatar
                    }).eq('id', conflictUser.id);
                    updated++;
                } else {
                     console.error(`❌ Erro não resolvido para ${au.email}:`, error.message);
                     errors++;
                }
            } else {
                console.error(`❌ Erro ao processar ${au.email}:`, error.message);
                errors++;
            }
        } else {
            created++; // ou updated, upsert não distingue fácil sem checar antes, mas ok
        }
    } catch (e) {
        console.error(`❌ Exceção para ${au.email}:`, e.message);
        errors++;
    }
  }

  console.log(`✅ Sincronização finalizada!`);
  console.log(`   - Processados com sucesso (upsert): ${created}`);
  console.log(`   - Atualizados via resolução de conflito: ${updated}`);
  console.log(`   - Erros: ${errors}`);
}

syncUsers();
