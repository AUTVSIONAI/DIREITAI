
-- Create analytics tables if they don't exist
CREATE TABLE IF NOT EXISTS public.notification_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    sent_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.announcement_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(announcement_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.notification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated (adjust as needed)
GRANT ALL ON public.notification_stats TO anon, authenticated, service_role;
GRANT ALL ON public.announcement_views TO anon, authenticated, service_role;
GRANT ALL ON public.announcement_clicks TO anon, authenticated, service_role;
GRANT ALL ON public.announcement_dismissals TO anon, authenticated, service_role;

-- Policies for notification_stats
CREATE POLICY "Allow read access to all users" ON public.notification_stats FOR SELECT USING (true);
CREATE POLICY "Allow update access to service role" ON public.notification_stats FOR UPDATE USING (auth.role() = 'service_role');

-- Policies for announcement_views
CREATE POLICY "Allow read access to all users" ON public.announcement_views FOR SELECT USING (true);
CREATE POLICY "Allow insert access to authenticated users" ON public.announcement_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for announcement_clicks
CREATE POLICY "Allow read access to all users" ON public.announcement_clicks FOR SELECT USING (true);
CREATE POLICY "Allow insert access to authenticated users" ON public.announcement_clicks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for announcement_dismissals (already exists likely, but ensuring)
CREATE POLICY "Allow read access to all users" ON public.announcement_dismissals FOR SELECT USING (true);
CREATE POLICY "Allow insert access to authenticated users" ON public.announcement_dismissals FOR INSERT WITH CHECK (auth.uid() = user_id);
