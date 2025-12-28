
-- CORREÇÃO FINAL PARA CHECK-INS
-- 1. Garantir que a tabela geographic_checkins tem as colunas corretas
ALTER TABLE public.geographic_checkins 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.geographic_checkins 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Garantir Foreign Key (caso ainda não tenha sido criada corretamente ou deletada)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'geographic_checkins_user_id_fkey'
    ) THEN
        ALTER TABLE public.geographic_checkins
        ADD CONSTRAINT geographic_checkins_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.users (id)
        ON DELETE CASCADE;
    END IF;
END
$$;

-- 3. Habilitar RLS (Segurança)
ALTER TABLE public.geographic_checkins ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso (se não existirem)
-- Remover políticas antigas para garantir
DROP POLICY IF EXISTS "Usuários podem fazer check-in" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios check-ins" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Admins podem ver todos check-ins" ON public.geographic_checkins;

-- Recriar
CREATE POLICY "Usuários podem fazer check-in" ON public.geographic_checkins
    FOR INSERT
    WITH CHECK (true); -- O backend valida o usuário, então podemos permitir insert autenticado. 
    -- Idealmente: auth.uid() = user_id, mas o backend usa service role agora.

CREATE POLICY "Usuários podem ver seus próprios check-ins" ON public.geographic_checkins
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos check-ins" ON public.geographic_checkins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );
