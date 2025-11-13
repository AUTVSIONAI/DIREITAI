const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend-oficial/.env' });

// Usa SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do backend para operações administrativas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no backend-oficial/.env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

async function setupHandleNewUserTrigger() {
  console.log('🔧 Configurando trigger de criação de usuário (auth.users → public.users / user_profiles)...');

  const sql = `
    -- Remover trigger/funcão anteriores se existirem
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS public.handle_new_user();

    -- Função para criar registros espelho com defaults seguros
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_username text;
      v_fullname text;
    BEGIN
      v_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
      v_fullname := COALESCE(NEW.raw_user_meta_data->>'full_name', v_username);

      -- Inserir em public.users (ignorar falhas para não quebrar o signup)
      BEGIN
        INSERT INTO public.users (
          auth_id,
          email,
          username,
          full_name,
          role,
          is_admin,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          NEW.id,
          NEW.email,
          v_username,
          v_fullname,
          'user',
          false,
          true,
          now(),
          now()
        );
      EXCEPTION WHEN OTHERS THEN
        -- Se tabela/colunas não existirem ou RLS bloquear, não interromper o fluxo
        NULL;
      END;

      -- Inserir em public.user_profiles (estrutura usada no frontend)
      BEGIN
        INSERT INTO public.user_profiles (
          id,
          email,
          username,
          "fullName",
          role,
          "isActive",
          "createdAt",
          "updatedAt"
        ) VALUES (
          NEW.id,
          NEW.email,
          v_username,
          v_fullname,
          'user',
          true,
          now(),
          now()
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;

      RETURN NEW;
    END;
    $$;

    -- Trigger após inserção em auth.users
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;

  try {
    const { error } = await admin.rpc('exec_sql', { sql });
    if (error) {
      console.error('❌ Erro ao criar trigger/função via RPC:', error.message);
      process.exit(1);
    }
    console.log('✅ Trigger e função configuradas com sucesso');
  } catch (e) {
    console.error('❌ Falha ao executar RPC exec_sql:', e.message);
    console.error('ℹ️ Verifique se a função RPC exec_sql está instalada no seu projeto Supabase.');
    process.exit(1);
  }
}

setupHandleNewUserTrigger();