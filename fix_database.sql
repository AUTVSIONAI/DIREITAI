
-- CORREÇÃO DE INTEGRIDADE DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase Dashboard para corrigir:
-- 1. Contagem de check-ins zerada
-- 2. Relatórios de analytics vazios
-- 3. Erros de relacionamento entre tabelas

-- 1. Adicionar Foreign Key entre check-ins e usuários (ESSENCIAL)
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

-- 2. Garantir permissões de acesso (RLS) para usuários verem seus próprios check-ins
ALTER TABLE public.geographic_checkins ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção (fazer check-in)
CREATE POLICY "Usuários podem fazer check-in" ON public.geographic_checkins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política para permitir ver seus próprios check-ins (para o mapa não mostrar banner de novo)
CREATE POLICY "Usuários podem ver seus próprios check-ins" ON public.geographic_checkins
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política para admins verem tudo (para relatórios)
-- Nota: adminSupabase (service role) já vê tudo, mas usuários admin via frontend precisam disso se não usarem service role
CREATE POLICY "Admins podem ver todos check-ins" ON public.geographic_checkins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );

-- 3. Verificar se a coluna 'gender' existe na tabela users (para analytics)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'gender'
    ) THEN
        ALTER TABLE public.users ADD COLUMN gender text;
        ALTER TABLE public.users ADD COLUMN city text;
        ALTER TABLE public.users ADD COLUMN state text;
    END IF;
END
$$;
