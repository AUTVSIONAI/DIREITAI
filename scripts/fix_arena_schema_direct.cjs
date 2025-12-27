const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

// Configurações
// Tenta pegar do .env do backend, se não tiver, usa hardcoded (apenas para fallback, ideal é .env)
const supabaseUrl = process.env.SUPABASE_URL || 'https://vussgslenvyztckeuyap.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada no arquivo .env do backend-oficial.');
    console.log('Por favor, certifique-se de que as variáveis de ambiente estão configuradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixArenaParticipantsSchema() {
  console.log('🔧 Iniciando correção do schema da tabela arena_participants...');
  
  const sql = `
    -- 1. Adicionar colunas faltantes
    DO $$
    BEGIN
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'arena_participants' AND column_name = 'updated_at') THEN
            ALTER TABLE arena_participants ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
            RAISE NOTICE 'Coluna updated_at adicionada.';
        END IF;

        -- Adicionar hand_raised se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'arena_participants' AND column_name = 'hand_raised') THEN
            ALTER TABLE arena_participants ADD COLUMN hand_raised BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Coluna hand_raised adicionada.';
        END IF;
    END $$;

    -- 2. Atualizar função de trigger para updated_at (se não existir, cria genérica)
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- 3. Criar trigger na tabela arena_participants
    DROP TRIGGER IF EXISTS update_arena_participants_updated_at ON arena_participants;
    CREATE TRIGGER update_arena_participants_updated_at
        BEFORE UPDATE ON arena_participants
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        
    -- 4. Forçar refresh do schema cache (hack: notify pgrst)
    NOTIFY pgrst, 'reload schema';
  `;

  try {
    // Tentar executar via RPC 'exec_sql' se existir (comum em setups Supabase)
    // Caso contrário, tentaremos via query direta se o cliente permitir (admin client geralmente não permite DDL direto via postgrest-js padrão sem RPC)
    // Mas muitos projetos configuram uma function 'exec_sql'. Vamos testar.
    
    console.log('Tentando executar SQL via RPC exec_sql...');
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
        console.warn('⚠️ RPC exec_sql falhou ou não existe. Erro:', error.message);
        console.log('\n📋 POR FAVOR, EXECUTE O SEGUINTE SQL MANUALMENTE NO SUPABASE SQL EDITOR:');
        console.log('------------------------------------------------------------------------');
        console.log(sql);
        console.log('------------------------------------------------------------------------');
    } else {
        console.log('✅ SQL executado com sucesso via RPC!');
        console.log('✅ Colunas updated_at e hand_raised verificadas/adicionadas.');
        console.log('✅ Trigger de atualização configurado.');
    }

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
  }
}

fixArenaParticipantsSchema();
