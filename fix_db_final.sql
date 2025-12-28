-- Script Completo para Correção do Banco de Dados
-- Execute este script no Editor SQL do Supabase

-- 1. Criar função exec_sql para permitir execuções futuras via RPC (Opcional, mas útil)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- 2. Corrigir precisão das colunas de latitude e longitude na tabela geographic_checkins
-- Isso evita erros de "numeric field overflow"
DO $$
BEGIN
    -- Alterar latitude para DOUBLE PRECISION
    ALTER TABLE public.geographic_checkins 
    ALTER COLUMN latitude TYPE DOUBLE PRECISION USING latitude::DOUBLE PRECISION;

    -- Alterar longitude para DOUBLE PRECISION
    ALTER TABLE public.geographic_checkins 
    ALTER COLUMN longitude TYPE DOUBLE PRECISION USING longitude::DOUBLE PRECISION;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao alterar precisão das colunas (podem já estar corretas): %', SQLERRM;
END
$$;

-- 3. Criar ou Atualizar a função calculate_distance (Haversine)
-- Necessária para triggers de validação de distância
CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 double precision,
    lon1 double precision,
    lat2 double precision,
    lon2 double precision
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    R constant integer := 6371000; -- Raio da Terra em metros
    dLat double precision;
    dLon double precision;
    a double precision;
    c double precision;
BEGIN
    dLat := (lat2 - lat1) * pi() / 180;
    dLon := (lon2 - lon1) * pi() / 180;
    a := sin(dLat/2) * sin(dLat/2) +
         cos(lat1 * pi() / 180) * cos(lat2 * pi() / 180) *
         sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    return R * c;
END;
$$;

-- Criar sobrecarga para aceitar numeric (para evitar erros de tipo)
CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 numeric,
    lon1 numeric,
    lat2 numeric,
    lon2 numeric
)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN public.calculate_distance(
        lat1::double precision,
        lon1::double precision,
        lat2::double precision,
        lon2::double precision
    );
END;
$$;

-- 4. Garantir colunas necessárias na tabela geographic_checkins
DO $$
BEGIN
    -- Adicionar checked_in_at se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geographic_checkins' AND column_name = 'checked_in_at') THEN
        ALTER TABLE public.geographic_checkins ADD COLUMN checked_in_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END
$$;

-- 5. Garantir colunas de perfil na tabela users (para Analytics)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'gender') THEN
        ALTER TABLE public.users ADD COLUMN gender TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'state') THEN
        ALTER TABLE public.users ADD COLUMN state TEXT;
    END IF;
END
$$;
