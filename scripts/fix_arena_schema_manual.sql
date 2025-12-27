-- Script de Correção para Arena (Mãos Levantadas e Erro PGRST204)
-- Execute este script no SQL Editor do Supabase para corrigir a tabela arena_participants

-- 1. Adicionar colunas faltantes de forma segura
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

-- 2. Atualizar função de trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Criar trigger na tabela arena_participants para manter updated_at atualizado
DROP TRIGGER IF EXISTS update_arena_participants_updated_at ON arena_participants;
CREATE TRIGGER update_arena_participants_updated_at
    BEFORE UPDATE ON arena_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Forçar recarregamento do cache do esquema (Schema Cache Reload)
NOTIFY pgrst, 'reload schema';
