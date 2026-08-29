-- ====================================================================
-- MIGRATION SCRIPT: Transition build_listings to JSONB Metadata Architecture
-- ====================================================================

-- 1. Add the new flexible metadata column
ALTER TABLE public.build_listings 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Migrate existing dynamic data into the metadata column safely
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

-- Note: We are keeping the old columns for now to prevent any breaking changes
-- during the transition, but the Flutter app will now exclusively read/write 
-- to the `metadata` column for these fields.
