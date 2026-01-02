-- Script to fix geographic_checkins table schema
-- Ensures all columns used by the backend exist and have correct types

-- 1. Create table if not exists (basic structure)
CREATE TABLE IF NOT EXISTS public.geographic_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    manifestation_id UUID NOT NULL, -- FK handled later or assumed loose if manifestations table structure is unknown here
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns if they don't exist
DO $$
BEGIN
    -- device_info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geographic_checkins' AND column_name = 'device_info') THEN
        ALTER TABLE public.geographic_checkins ADD COLUMN device_info JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- ip_address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geographic_checkins' AND column_name = 'ip_address') THEN
        ALTER TABLE public.geographic_checkins ADD COLUMN ip_address TEXT;
    END IF;

    -- user_agent
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geographic_checkins' AND column_name = 'user_agent') THEN
        ALTER TABLE public.geographic_checkins ADD COLUMN user_agent TEXT;
    END IF;

    -- checked_in_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'geographic_checkins' AND column_name = 'checked_in_at') THEN
        ALTER TABLE public.geographic_checkins ADD COLUMN checked_in_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 3. Fix coordinate precision (avoid numeric overflow)
DO $$
BEGIN
    -- Alter latitude to DOUBLE PRECISION
    ALTER TABLE public.geographic_checkins 
    ALTER COLUMN latitude TYPE DOUBLE PRECISION USING latitude::DOUBLE PRECISION;

    -- Alter longitude to DOUBLE PRECISION
    ALTER TABLE public.geographic_checkins 
    ALTER COLUMN longitude TYPE DOUBLE PRECISION USING longitude::DOUBLE PRECISION;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error altering column types (might already be correct): %', SQLERRM;
END $$;

-- 4. Ensure RLS is enabled and policies exist
ALTER TABLE public.geographic_checkins ENABLE ROW LEVEL SECURITY;

-- Policy for insert
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.geographic_checkins;
CREATE POLICY "Users can insert own checkins" ON public.geographic_checkins
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for select
DROP POLICY IF EXISTS "Users can view own checkins" ON public.geographic_checkins;
CREATE POLICY "Users can view own checkins" ON public.geographic_checkins
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for admin select
DROP POLICY IF EXISTS "Admins can view all checkins" ON public.geographic_checkins;
CREATE POLICY "Admins can view all checkins" ON public.geographic_checkins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );

-- 5. Grant permissions
GRANT ALL ON public.geographic_checkins TO authenticated;
GRANT ALL ON public.geographic_checkins TO service_role;
