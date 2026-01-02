-- Fix RLS policies for Analytics and Announcements

-- 1. Ensure announcements is readable by everyone (or at least authenticated)
ALTER TABLE IF EXISTS public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone" 
ON public.announcements FOR SELECT 
USING (true); -- Allow public read, or restrict to auth.role() = 'authenticated'

-- 2. Fix announcement_views policies
ALTER TABLE IF EXISTS public.announcement_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert views" ON public.announcement_views;
CREATE POLICY "Users can insert views" 
ON public.announcement_views FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL); -- Allow insert if user matches or is null (for anon?)

DROP POLICY IF EXISTS "Users can view their own views" ON public.announcement_views;
CREATE POLICY "Users can view their own views" 
ON public.announcement_views FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Fix notification_stats policies (if used by frontend)
ALTER TABLE IF EXISTS public.notification_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read stats" ON public.notification_stats;
CREATE POLICY "Public read stats" 
ON public.notification_stats FOR SELECT 
USING (true);

-- 4. Fix blog_post_likes policies
ALTER TABLE IF EXISTS public.blog_post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can like posts" ON public.blog_post_likes;
CREATE POLICY "Users can like posts" 
ON public.blog_post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.blog_post_likes;
CREATE POLICY "Users can unlike posts" 
ON public.blog_post_likes FOR DELETE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view likes" ON public.blog_post_likes;
CREATE POLICY "Anyone can view likes" 
ON public.blog_post_likes FOR SELECT 
USING (true);

-- 5. Fix Users table read access (crucial for joins)
-- Ensure users table is readable by authenticated users (for profile info)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- 6. Fix politician_ratings policies (just in case)
ALTER TABLE IF EXISTS public.politician_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.politician_ratings;
CREATE POLICY "Ratings are viewable by everyone" 
ON public.politician_ratings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert ratings" ON public.politician_ratings;
CREATE POLICY "Users can insert ratings" 
ON public.politician_ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own ratings" ON public.politician_ratings;
CREATE POLICY "Users can update own ratings" 
ON public.politician_ratings FOR UPDATE 
USING (auth.uid() = user_id);
