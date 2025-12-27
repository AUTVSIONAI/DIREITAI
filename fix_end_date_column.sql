-- Adicionar colunas de data se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'start_date') THEN 
        ALTER TABLE announcements ADD COLUMN start_date TIMESTAMPTZ DEFAULT NOW(); 
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'end_date') THEN 
        ALTER TABLE announcements ADD COLUMN end_date TIMESTAMPTZ; 
    END IF;
    
    -- Garantir que outras colunas essenciais existam
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'target_audience') THEN 
        ALTER TABLE announcements ADD COLUMN target_audience JSONB DEFAULT '"all"'::jsonb; 
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
