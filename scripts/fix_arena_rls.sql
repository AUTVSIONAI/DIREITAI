-- Fix RLS policies for arena_participants to ensure guests can see themselves and the list

-- 1. Enable RLS (if not already enabled)
ALTER TABLE "public"."arena_participants" ENABLE ROW LEVEL SECURITY;

-- 2. Allow everyone (authenticated and anon) to view the participants list
-- This is crucial so that the frontend can load the list and match the current user
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."arena_participants";
CREATE POLICY "Enable read access for all users" ON "public"."arena_participants"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- 3. Allow authenticated users to update their own record (e.g. hand raised, status)
-- This allows the guest to "Raise Hand" or update their local state if needed
DROP POLICY IF EXISTS "Enable update for own record" ON "public"."arena_participants";
CREATE POLICY "Enable update for own record" ON "public"."arena_participants"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Allow Service Role / Admins full access (usually implicit, but good to be explicit if needed)
-- (Supabase Service Role bypasses RLS by default, so this is optional)
