-- Script para adicionar colunas ausentes na tabela announcements
-- Execute este script no Editor SQL do Supabase

-- Adicionar colunas de estatísticas se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'view_count') THEN 
        ALTER TABLE announcements ADD COLUMN view_count INTEGER DEFAULT 0; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'click_count') THEN 
        ALTER TABLE announcements ADD COLUMN click_count INTEGER DEFAULT 0; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'dismiss_count') THEN 
        ALTER TABLE announcements ADD COLUMN dismiss_count INTEGER DEFAULT 0; 
    END IF;

    -- Adicionar colunas de configuração e regras de exibição
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'display_rules') THEN 
        ALTER TABLE announcements ADD COLUMN display_rules JSONB DEFAULT '{}'::jsonb; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'style') THEN 
        ALTER TABLE announcements ADD COLUMN style TEXT DEFAULT 'banner'; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'position') THEN 
        ALTER TABLE announcements ADD COLUMN position TEXT DEFAULT 'top'; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_dismissible') THEN 
        ALTER TABLE announcements ADD COLUMN is_dismissible BOOLEAN DEFAULT true; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_persistent') THEN 
        ALTER TABLE announcements ADD COLUMN is_persistent BOOLEAN DEFAULT false; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'action') THEN 
        ALTER TABLE announcements ADD COLUMN action JSONB DEFAULT '{}'::jsonb; 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'styling') THEN 
        ALTER TABLE announcements ADD COLUMN styling JSONB DEFAULT '{}'::jsonb; 
    END IF;
    
    -- Garantir que target_audience seja compatível (se for text, alterar para jsonb ou manter, aqui assumimos que pode ser text ou jsonb, mas vamos garantir que a coluna exista)
    -- Se target_audience não existir, cria como JSONB (mais flexível)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target_audience') THEN 
        ALTER TABLE announcements ADD COLUMN target_audience JSONB DEFAULT '"all"'::jsonb; 
    END IF;

END $$;

-- Recarregar o schema cache (o Supabase faz isso automaticamente, mas é bom saber)
NOTIFY pgrst, 'reload schema';
