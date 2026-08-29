-- ─── Takevolet Social Leads CRM Table Migration ─────────────────────────────
-- Run this in your Supabase SQL Editor to create the leads table

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    profile_url TEXT,
    source_url TEXT,
    platform TEXT DEFAULT 'Instagram',
    location TEXT DEFAULT 'Hyderabad',
    budget TEXT,
    category TEXT DEFAULT 'Real Estate',
    comment_text TEXT,
    phone TEXT,
    status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'closed'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup and filtering
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_location ON public.leads (location);

-- Disable RLS or create open service-role policy
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'SUCCESS: Leads CRM table is ready!' AS result;
