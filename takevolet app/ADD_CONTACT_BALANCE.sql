-- Run this in your Supabase SQL Editor to fix the missing column error

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS contact_balance int8 DEFAULT 0;

-- Optional: if the column was added but PostgREST cache wasn't reloaded, run this:
NOTIFY pgrst, 'reload schema';
