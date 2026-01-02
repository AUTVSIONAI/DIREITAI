-- Fix RLS policies for geographic_checkins
-- This handles the case where public.users.id != auth.users.id

ALTER TABLE public.geographic_checkins ENABLE ROW LEVEL SECURITY;

-- 1. Insert Policy
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.geographic_checkins;
CREATE POLICY "Users can insert own checkins" ON public.geographic_checkins
    FOR INSERT
    WITH CHECK (
        -- Allow if the user_id matches the ID of the authenticated user in public.users
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

-- 2. Select Policy
DROP POLICY IF EXISTS "Users can view own checkins" ON public.geographic_checkins;
CREATE POLICY "Users can view own checkins" ON public.geographic_checkins
    FOR SELECT
    USING (
        -- Allow if the user_id matches the ID of the authenticated user in public.users
        user_id IN (
            SELECT id FROM public.users WHERE auth_id = auth.uid()
        )
    );

-- 3. Admin Select Policy
DROP POLICY IF EXISTS "Admins can view all checkins" ON public.geographic_checkins;
CREATE POLICY "Admins can view all checkins" ON public.geographic_checkins
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid() -- Check admin status via auth_id link
            AND (users.role = 'admin' OR users.is_admin = true)
        )
    );

-- 4. Grant permissions explicitly
GRANT ALL ON public.geographic_checkins TO service_role;
GRANT ALL ON public.geographic_checkins TO authenticated;

-- 5. Force public.checkins sync (Optional: Create trigger to sync to legacy table if needed)
-- For now, we just ensure geographic_checkins works.
