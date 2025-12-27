-- Migration Final - Fix Announcements, Affiliates, and Plans
-- Run this in Supabase SQL Editor

-- 1. ANNOUNCEMENTS: Add tracking columns
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS click_count BIGINT DEFAULT 0;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS dismiss_count BIGINT DEFAULT 0;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS display_rules JSONB DEFAULT NULL;

-- 2. AFFILIATES: Create/Update tables
CREATE TABLE IF NOT EXISTS public.affiliates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    code TEXT UNIQUE,
    status TEXT DEFAULT 'pending', -- pending, active, rejected
    is_active BOOLEAN DEFAULT false,
    commission_rate_default NUMERIC(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Policy for Affiliates
DROP POLICY IF EXISTS "Users can read own affiliate data" ON public.affiliates;
CREATE POLICY "Users can read own affiliate data" ON public.affiliates
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_code TEXT REFERENCES public.affiliates(code) ON DELETE SET NULL,
    order_id UUID,
    product_id UUID,
    commission_amount NUMERIC(10,2) DEFAULT 0,
    amount NUMERIC(10,2) DEFAULT 0,
    value NUMERIC(10,2) DEFAULT 0, -- Alias for amount
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_code TEXT REFERENCES public.affiliates(code) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    click_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. SUBSCRIPTION PLANS: Ensure columns exist for B2B plans
-- Using subscription_plans as per backend code
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly NUMERIC(10,2),
    price_yearly NUMERIC(10,2),
    features TEXT[],
    limits JSONB,
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    color TEXT,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (safe update)
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}';
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'blue';
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Star';
ALTER TABLE public.subscription_plans ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. PERMISSIONS
GRANT ALL ON public.announcements TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

GRANT ALL ON public.affiliates TO postgres, service_role;
GRANT ALL ON public.affiliate_commissions TO postgres, service_role;
GRANT ALL ON public.affiliate_clicks TO postgres, service_role;

GRANT ALL ON public.subscription_plans TO postgres, service_role;
GRANT SELECT ON public.subscription_plans TO authenticated;
GRANT ALL ON public.subscription_plans TO authenticated; -- Allow admin to manage plans (RLS should handle restriction)

-- 5. RPCs for atomic increments
CREATE OR REPLACE FUNCTION increment_announcement_view(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.announcements
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_announcement_click(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.announcements
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_announcement_dismiss(row_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.announcements
  SET dismiss_count = COALESCE(dismiss_count, 0) + 1
  WHERE id = row_id;
END;
$$ LANGUAGE plpgsql;
