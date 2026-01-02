-- Fix Checkins Table
CREATE TABLE IF NOT EXISTS public.checkins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    event_id UUID, -- Can be null if it's a manifestation, or separate column
    manifestation_id UUID,
    location TEXT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_checkins_event_id ON public.checkins(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_manifestation_id ON public.checkins(manifestation_id);

-- Enable RLS
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- Policies for checkins
DROP POLICY IF EXISTS "Users can insert their own checkins" ON public.checkins;
CREATE POLICY "Users can insert their own checkins" ON public.checkins
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own checkins" ON public.checkins;
CREATE POLICY "Users can view their own checkins" ON public.checkins
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin can view all checkins" ON public.checkins;
CREATE POLICY "Admin can view all checkins" ON public.checkins
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Fix Analytics Tables (Ensure they exist)
CREATE TABLE IF NOT EXISTS public.notification_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.announcement_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    announcement_id UUID,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.announcement_clicks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    announcement_id UUID,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    announcement_id UUID,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Analytics
ALTER TABLE public.notification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Policies for Analytics (Allow inserts from authenticated users, view for admins)
CREATE POLICY "Users can insert views" ON public.announcement_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert clicks" ON public.announcement_clicks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert dismissals" ON public.announcement_dismissals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies
CREATE POLICY "Admins can view all stats" ON public.notification_stats FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can view all views" ON public.announcement_views FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can view all clicks" ON public.announcement_clicks FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));
CREATE POLICY "Admins can view all dismissals" ON public.announcement_dismissals FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Grant permissions
GRANT ALL ON public.checkins TO postgres;
GRANT ALL ON public.checkins TO anon;
GRANT ALL ON public.checkins TO authenticated;
GRANT ALL ON public.checkins TO service_role;

GRANT ALL ON public.notification_stats TO postgres;
GRANT ALL ON public.notification_stats TO anon;
GRANT ALL ON public.notification_stats TO authenticated;
GRANT ALL ON public.notification_stats TO service_role;

GRANT ALL ON public.announcement_views TO postgres;
GRANT ALL ON public.announcement_views TO anon;
GRANT ALL ON public.announcement_views TO authenticated;
GRANT ALL ON public.announcement_views TO service_role;

GRANT ALL ON public.announcement_clicks TO postgres;
GRANT ALL ON public.announcement_clicks TO anon;
GRANT ALL ON public.announcement_clicks TO authenticated;
GRANT ALL ON public.announcement_clicks TO service_role;

GRANT ALL ON public.announcement_dismissals TO postgres;
GRANT ALL ON public.announcement_dismissals TO anon;
GRANT ALL ON public.announcement_dismissals TO authenticated;
GRANT ALL ON public.announcement_dismissals TO service_role;
