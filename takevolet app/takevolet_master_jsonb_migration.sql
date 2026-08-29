-- ====================================================================
-- MASTER MIGRATION SCRIPT: Transition ALL Listing Tables to JSONB Metadata Architecture
-- ====================================================================

-- 1. ADD METADATA COLUMN TO ALL TABLES
ALTER TABLE public.build_listings ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.property_sales ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.flatmates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. MIGRATE BUILD LISTINGS
-- (Safely migrating specific fields into metadata object)
UPDATE public.build_listings 
SET metadata = metadata || jsonb_build_object(
  'contact_number', COALESCE(contact_number, ''),
  'contract_type', COALESCE(contract_type, ''),
  'experience_years', experience_years,
  'stage', COALESCE(stage, ''),
  'project_status', COALESCE(project_status, ''),
  'completion_percentage', COALESCE(completion_percentage, 0),
  'company_name', COALESCE(company_name, '')
)
WHERE metadata = '{}'::jsonb;

-- 3. MIGRATE ROOMS
-- Example migration for rooms (can add more fields if needed)
UPDATE public.rooms 
SET metadata = metadata || jsonb_build_object(
  'deposit', deposit,
  'maintenance', maintenance,
  'notice_period', COALESCE(notice_period, ''),
  'parking', COALESCE(parking, ''),
  'pet_friendly', COALESCE(pet_friendly, false),
  'bachelors_allowed', COALESCE(bachelors_allowed, false)
)
WHERE metadata = '{}'::jsonb AND EXISTS (
   SELECT 1 FROM information_schema.columns 
   WHERE table_name = 'rooms' AND column_name = 'deposit'
);

-- 4. MIGRATE PROPERTY SALES
UPDATE public.property_sales 
SET metadata = metadata || jsonb_build_object(
  'property_type', COALESCE(property_type, ''),
  'built_up_area', COALESCE(built_up_area, 0),
  'carpet_area', COALESCE(carpet_area, 0),
  'facing', COALESCE(facing, ''),
  'floor', floor,
  'total_floors', total_floors,
  'age_of_property', age_of_property
)
WHERE metadata = '{}'::jsonb AND EXISTS (
   SELECT 1 FROM information_schema.columns 
   WHERE table_name = 'property_sales' AND column_name = 'property_type'
);

-- 5. MIGRATE FLATMATES
UPDATE public.flatmates 
SET metadata = metadata || jsonb_build_object(
  'occupation', COALESCE(occupation, ''),
  'food_preference', COALESCE(food_preference, ''),
  'smoking_habit', COALESCE(smoking_habit, ''),
  'drinking_habit', COALESCE(drinking_habit, ''),
  'pet_preference', COALESCE(pet_preference, ''),
  'looking_for', COALESCE(looking_for, '')
)
WHERE metadata = '{}'::jsonb AND EXISTS (
   SELECT 1 FROM information_schema.columns 
   WHERE table_name = 'flatmates' AND column_name = 'occupation'
);

-- Note: We are keeping the old columns for now to prevent any breaking changes
-- during the transition, but the Flutter app will now exclusively read/write 
-- to the `metadata` column for these fields.
