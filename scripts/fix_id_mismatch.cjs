
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Tabelas que podem referenciar users.id
const TABLES_TO_FIX = [
  'politician_ratings',
  'blog_post_likes',
  'blog_post_comments',
  'politician_suggestions',
  'affiliates'
];

async function fixIdMismatch() {
  console.log('🔧 Iniciando correção de IDs de usuários...');

  // 1. Pegar todos os users do Auth
  const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('❌ Erro ao listar auth users:', error);
    return;
  }

  // 2. Pegar todos os users da tabela public
  const { data: publicUsers, error: pubError } = await supabase
    .from('users')
    .select('*');
  
  if (pubError) {
    console.error('❌ Erro ao listar public users:', pubError);
    return;
  }

  const publicMap = new Map(publicUsers.map(u => [u.auth_id, u]));

  let fixedCount = 0;

  for (const authUser of authUsers) {
    const publicUser = publicMap.get(authUser.id);

    if (publicUser) {
      // Usuário existe na tabela public
      if (publicUser.id !== authUser.id) {
        console.log(`⚠️ Mismatch encontrado para ${authUser.email}`);
        console.log(`   Auth ID:   ${authUser.id}`);
        console.log(`   Public ID: ${publicUser.id}`);

        // Corrigir referências
        await migrateReferences(publicUser.id, authUser.id);

        // Atualizar o ID na tabela users
        // Como ID é PK, não dá pra update direto se houver FKs restritivas (mas acabamos de migrar)
        // Melhor estratégia: 
        // 1. Criar novo registro com ID correto (cópia)
        // 2. Deletar registro antigo (que não deve ter mais dependentes)
        
        // Mas auth_id é unique, então primeiro temos que mudar o auth_id do antigo ou deletar?
        // Vamos tentar deletar o antigo primeiro. Se falhar, é pq tem FK que esquecemos.
        
        const { error: delError } = await supabase
          .from('users')
          .delete()
          .eq('id', publicUser.id);
        
        if (delError) {
          console.error(`   ❌ Falha ao deletar ID antigo: ${delError.message}`);
          // Se falhar, tenta update direto (se suportado)
          const { error: updError } = await supabase
            .from('users')
            .update({ id: authUser.id })
            .eq('id', publicUser.id);
            
           if (updError) {
             console.error(`   ❌ Falha ao atualizar ID direto: ${updError.message}`);
           } else {
             console.log(`   ✅ ID atualizado diretamente.`);
             fixedCount++;
           }
        } else {
          // Deletou com sucesso, agora cria o novo
          const newProfile = {
            ...publicUser,
            id: authUser.id,
            updated_at: new Date()
          };
          const { error: insError } = await supabase
            .from('users')
            .insert(newProfile);
            
          if (insError) {
             console.error(`   ❌ Falha ao inserir novo ID: ${insError.message}`);
          } else {
             console.log(`   ✅ Migração concluída com sucesso.`);
             fixedCount++;
          }
        }
      }
    } else {
      // Usuário não existe na tabela public, vamos criar
      // (Isso já seria pego pelo backfill, mas vamos garantir)
      console.log(`➕ Criando usuário ausente: ${authUser.email}`);
      const newProfile = {
        id: authUser.id,
        auth_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        avatar_url: authUser.user_metadata?.avatar_url,
        updated_at: new Date()
      };
      
      const { error: insError } = await supabase
        .from('users')
        .insert(newProfile);
        
      if (insError) {
        console.error(`   ❌ Falha ao criar usuário: ${insError.message}`);
      }
    }
  }
  
  console.log(`🏁 Processo finalizado. ${fixedCount} usuários corrigidos.`);
}

async function migrateReferences(oldId, newId) {
  for (const table of TABLES_TO_FIX) {
    // Verificar se tabela existe e tem a coluna user_id
    // Simplesmente tenta fazer update. Se a tabela não existir, dá erro e ignoramos.
    try {
      const { data, error } = await supabase
        .from(table)
        .update({ user_id: newId })
        .eq('user_id', oldId)
        .select();
        
      if (error) {
        // Ignora erro se tabela não existir (404 ou 42P01)
        if (!error.message.includes('does not exist')) {
            console.log(`   ⚠️ Erro ao migrar ${table}: ${error.message}`);
        }
      } else if (data && data.length > 0) {
        console.log(`   🔄 Migrados ${data.length} registros em ${table}`);
      }
    } catch (e) {
      console.log(`   ⚠️ Exceção ao migrar ${table}: ${e.message}`);
    }
  }
}

fixIdMismatch();
