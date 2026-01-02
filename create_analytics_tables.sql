-- Create analytics tables if they don't exist

-- 1. notification_stats
CREATE TABLE IF NOT EXISTS public.notification_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    dismissals INTEGER DEFAULT 0,
    ctr NUMERIC(5,2) DEFAULT 0,
    dismissal_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. announcement_views
CREATE TABLE IF NOT EXISTS public.announcement_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. announcement_clicks
CREATE TABLE IF NOT EXISTS public.announcement_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_url TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure announcement_dismissals exists (it was found but let's be safe)
CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    announcement_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.notification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Policies for notification_stats
CREATE POLICY "Public read access for notification_stats" ON public.notification_stats
    FOR SELECT USING (true);

CREATE POLICY "Admin write access for notification_stats" ON public.notification_stats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
        )
    );

-- Policies for announcement_views
CREATE POLICY "Users can insert views" ON public.announcement_views
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admin read views" ON public.announcement_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
        )
    );

-- Policies for announcement_clicks
CREATE POLICY "Users can insert clicks" ON public.announcement_clicks
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Admin read clicks" ON public.announcement_clicks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND (role = 'admin' OR role = 'owner')
        )
    );

-- Policies for announcement_dismissals (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'announcement_dismissals' AND policyname = 'Users can insert dismissals'
    ) THEN
        CREATE POLICY "Users can insert dismissals" ON public.announcement_dismissals
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'announcement_dismissals' AND policyname = 'Users can view own dismissals'
    ) THEN
        CREATE POLICY "Users can view own dismissals" ON public.announcement_dismissals
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.notification_stats TO authenticated, service_role;
GRANT ALL ON public.announcement_views TO authenticated, service_role;
GRANT ALL ON public.announcement_clicks TO authenticated, service_role;
GRANT ALL ON public.announcement_dismissals TO authenticated, service_role;
GRANT SELECT ON public.notification_stats TO anon;
