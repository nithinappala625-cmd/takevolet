-- ====================================================================
-- MIGRATION SCRIPT: Dashboards, Bookings, Wishlists, and Push Triggers
-- ====================================================================

-- 1. ADD DISPLAY ID TO BUILD LISTINGS
ALTER TABLE public.build_listings ADD COLUMN IF NOT EXISTS display_id TEXT;

-- Create function to auto-generate random display_id (e.g. LST-X8B9)
CREATE OR REPLACE FUNCTION generate_listing_display_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        -- Generate something like LST-ABCD
        new_id := 'LST-' || upper(substr(md5(random()::text), 1, 4));
        IF NOT EXISTS (SELECT 1 FROM public.build_listings WHERE display_id = new_id) THEN
            is_unique := true;
        END IF;
    END LOOP;
    NEW.display_id := new_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to build_listings
DROP TRIGGER IF EXISTS trigger_generate_listing_display_id ON public.build_listings;
CREATE TRIGGER trigger_generate_listing_display_id
BEFORE INSERT ON public.build_listings
FOR EACH ROW
WHEN (NEW.display_id IS NULL)
EXECUTE FUNCTION generate_listing_display_id();

-- Update existing listings to have a display_id
UPDATE public.build_listings 
SET display_id = 'LST-' || upper(substr(md5(random()::text), 1, 4))
WHERE display_id IS NULL;


-- 2. CREATE WISHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL,
    listing_type TEXT NOT NULL DEFAULT 'build', -- 'build', 'room', 'item'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);


-- 3. CREATE BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.build_listings(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    booking_data JSONB DEFAULT '{}'::jsonb, -- User's dynamic form answers (Name, Mobile, etc.)
    payment_method TEXT DEFAULT 'COD',
    status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, COMPLETED, CANCELLED
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Force Supabase API cache to refresh
NOTIFY pgrst, 'reload schema';
