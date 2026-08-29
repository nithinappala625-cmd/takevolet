-- 1. Create the build_listings table
CREATE TABLE IF NOT EXISTS public.build_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Categorization
    category TEXT NOT NULL, -- e.g., 'People', 'Project', 'Materials', 'Transport'
    sub_category TEXT NOT NULL, -- e.g., 'Architect', 'Site Supervisor', 'Mason', etc.
    
    -- Basic Details
    title TEXT NOT NULL,
    company_name TEXT,
    logo_text TEXT,
    description TEXT,
    
    -- Media
    image TEXT,
    media_urls TEXT[],
    
    -- Location & Contact
    location_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    
    -- Metrics & Status
    rating_avg NUMERIC(3, 1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Project Specific (for construction/ongoing projects)
    stage TEXT,
    project_status TEXT,
    completion_percentage INTEGER DEFAULT 0,
    
    -- Pricing
    starting_price NUMERIC,
    price_unit TEXT,
    
    -- Service specific
    experience_years INTEGER,
    
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Setup RLS (Row Level Security)
ALTER TABLE public.build_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on active build_listings" 
ON public.build_listings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Allow authenticated users to create build_listings" 
ON public.build_listings 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own build_listings" 
ON public.build_listings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own build_listings" 
ON public.build_listings 
FOR DELETE 
USING (auth.uid() = user_id);

-- 3. Create Storage Bucket for Build Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('build_images', 'build_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for build_images bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'build_images' );

CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'build_images' AND auth.role() = 'authenticated' );

-- 4. Insert some dummy data to test the UI!
INSERT INTO public.build_listings (
    category, sub_category, title, company_name, description, location_name, rating_avg, review_count, is_verified, stage, project_status, completion_percentage, experience_years
) VALUES 
-- People
('People', 'Architect', 'Modern Home Design', 'Dream Build Architects', 'Expert in modern architectural designs for urban homes.', 'New York, NY', 4.8, 120, true, null, null, 0, 15),
('People', 'Contractor', 'General Contracting Services', 'BuildRight Contractors', 'Full-service general contractors for residential buildings.', 'Austin, TX', 4.5, 85, true, null, null, 0, 10),
('People', 'Electrician', 'Residential Wiring Pro', 'VoltMasters', 'Safe and reliable electrical wiring for new houses.', 'Seattle, WA', 4.9, 210, true, null, null, 0, 8),
('People', 'Mason', 'Expert Bricklaying', 'Solid Foundations', 'High quality brick and stone masonry.', 'Chicago, IL', 4.7, 95, false, null, null, 0, 12),

-- Project
('Project', 'Foundation', 'Luxury Villa Foundation', 'Skyline Builders', 'Foundation work for a 5000 sq ft luxury villa.', 'Beverly Hills, CA', 0.0, 0, true, 'Foundation Laid', 'Started', 35, 0),
('Project', 'Roofing', 'Suburban Roof Replacement', 'TopTier Roofing', 'Complete roof replacement using premium shingles.', 'Denver, CO', 0.0, 0, true, 'In Progress', 'Started', 60, 0),

-- Materials
('Materials', 'Bricks', 'Premium Red Bricks', 'RedRock Suppliers', 'High-quality kiln-fired red bricks for construction.', 'Dallas, TX', 4.6, 340, true, null, null, 0, 0),
('Materials', 'Cement', 'Ultra-Strength Cement', 'BuildCorp Materials', 'Grade 53 cement for maximum strength and durability.', 'Phoenix, AZ', 4.8, 500, true, null, null, 0, 0),

-- Transport
('Transport', 'JCB', 'JCB Earthmover Rental', 'HeavyDuty Rentals', 'Reliable JCB for excavation and site clearing.', 'Miami, FL', 4.4, 60, true, null, null, 0, 0),
('Transport', 'Lorry', 'Material Transport Lorry', 'FastLogistics', '10-ton lorry for safe material transportation.', 'Atlanta, GA', 4.7, 150, true, null, null, 0, 0);
