-- FIX MANUAL PARA TABELA GEOGRAPHIC_CHECKINS
-- Execute este script no Editor SQL do Supabase Dashboard para garantir que a tabela existe e aceita dados.

-- 1. Criar tabela se não existir (com estrutura flexível)
CREATE TABLE IF NOT EXISTS public.geographic_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    manifestation_id UUID NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    device_info JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    checked_in_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adicionar colunas se faltarem
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.geographic_checkins ADD COLUMN device_info JSONB DEFAULT '{}'::jsonb;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.geographic_checkins ADD COLUMN ip_address TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.geographic_checkins ADD COLUMN user_agent TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
    
    BEGIN
        ALTER TABLE public.geographic_checkins ADD COLUMN checked_in_at TIMESTAMPTZ DEFAULT NOW();
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 3. Habilitar RLS mas com políticas permissivas
ALTER TABLE public.geographic_checkins ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Users can view own checkins" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Admins can view all checkins" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Enable all access for service_role" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Enable insert for authenticated" ON public.geographic_checkins;
DROP POLICY IF EXISTS "Enable select for authenticated" ON public.geographic_checkins;

-- Criar políticas novas
CREATE POLICY "Enable all access for service_role" ON public.geographic_checkins 
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated" ON public.geographic_checkins 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable select for authenticated" ON public.geographic_checkins 
    FOR SELECT TO authenticated USING (true);

-- 4. Garantir Grants
GRANT ALL ON public.geographic_checkins TO service_role;
GRANT ALL ON public.geographic_checkins TO authenticated;
GRANT ALL ON public.geographic_checkins TO postgres;
