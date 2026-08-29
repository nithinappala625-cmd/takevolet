-- Fix the column names and add missing columns to match what the app is sending.
-- You can safely run this in your Supabase SQL Editor.

ALTER TABLE public.build_listings 
  RENAME COLUMN category TO main_category;

ALTER TABLE public.build_listings 
  RENAME COLUMN starting_price TO price;

ALTER TABLE public.build_listings 
  RENAME COLUMN contact_phone TO contact_number;

ALTER TABLE public.build_listings 
  ADD COLUMN IF NOT EXISTS lat FLOAT8,
  ADD COLUMN IF NOT EXISTS lng FLOAT8,
  ADD COLUMN IF NOT EXISTS contract_type TEXT;
