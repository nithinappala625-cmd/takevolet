-- Run this script in your Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Ensure RLS is enabled on pages and ads tables
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- 2. Create policies to allow PUBLIC READ access for everyone (including mobile app users)
-- This fixes the issue where the app receives 0 rows when fetching pages or ads.

-- For Pages:
DROP POLICY IF EXISTS "Allow public read access on pages" ON public.pages;
CREATE POLICY "Allow public read access on pages" 
ON public.pages 
FOR SELECT 
USING (true);

-- For Ads:
DROP POLICY IF EXISTS "Allow public read access on ads" ON public.ads;
CREATE POLICY "Allow public read access on ads" 
ON public.ads 
FOR SELECT 
USING (true);

-- 3. Verify that your pages and ads table have the correct data
-- Check if Contact Us is in the pages table
INSERT INTO public.pages (slug, title, content)
SELECT 'contact-us', 'Contact Us', 'Get in Touch\n\nWe would love to hear from you!\n\nEmail: support@takevolet.online\nPhone: +91 79819 94870\nLocation: Hyderabad, Telangana, India'
WHERE NOT EXISTS (SELECT 1 FROM public.pages WHERE slug = 'contact-us');
