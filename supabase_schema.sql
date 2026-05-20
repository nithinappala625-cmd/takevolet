-- ============================================================
-- RoomRelay Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── 1. USER PROFILES ───────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  email         text,
  phone         text,
  whatsapp      text,
  avatar_url    text,
  location      text,          -- main area e.g. "Hitech City"
  colony        text,          -- specific colony e.g. "Madhapur"
  house_no      text,          -- house number (private, only for admin)
  profession    text,
  members_count int default 1,
  gender        text,
  aadhaar_url   text,          -- Supabase storage path for aadhaar photo
  is_verified   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read/update their own profile
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Admin can read all profiles (via service role key)
-- (Service role bypasses RLS automatically)

-- ─── 2. ROOMS ───────────────────────────────────────────────
create table if not exists public.rooms (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references public.profiles(id) on delete cascade not null,
  title             text not null,
  description       text,
  rent              int not null,
  advance           int default 0,
  location          text not null,
  colony            text not null,
  house_no          text,           -- hidden until payment
  full_address      text,           -- revealed after ₹500 payment
  leaving_date      date not null,
  members_allowed   int default 2,
  current_members   int default 1,
  gender_preference text default 'Any',
  furnishing        text default 'Semi-Furnished',
  parking           text default 'None',
  amenities         text[] default '{}',
  furniture         text[] default '{}',
  has_items         boolean default false,
  items             text[] default '{}',
  commission        int default 1000,
  images            text[] default '{}',   -- Supabase storage paths
  videos            text[] default '{}',   -- Supabase storage paths
  is_available      boolean default true,
  enquiries         int default 0,
  contact_unlocks   int default 0,
  earnings          int default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

alter table public.rooms enable row level security;

-- Anyone can read available rooms
create policy "Anyone can view available rooms"
  on public.rooms for select using (is_available = true);

-- Users can insert their own rooms
create policy "Users can insert own rooms"
  on public.rooms for insert with check (auth.uid() = user_id);

-- Users can update/delete their own rooms
create policy "Users can update own rooms"
  on public.rooms for update using (auth.uid() = user_id);

create policy "Users can delete own rooms"
  on public.rooms for delete using (auth.uid() = user_id);

-- ─── 3. INTERESTS (Address Unlocks — ₹500) ──────────────────
create table if not exists public.interests (
  id                  uuid primary key default uuid_generate_v4(),
  room_id             uuid references public.rooms(id) on delete cascade not null,
  seeker_id           uuid references public.profiles(id) on delete cascade not null,
  poster_id           uuid not null,
  room_title          text,
  poster_name         text,
  seeker_name         text,
  platform_fee        int default 500,
  razorpay_order_id   text,
  razorpay_payment_id text,
  payment_status      text default 'pending',   -- pending | paid | failed
  full_address        text,                      -- revealed after payment
  handover_confirmed  boolean default false,
  paid_at             timestamptz,
  created_at          timestamptz default now()
);

alter table public.interests enable row level security;

create policy "Seekers can view own interests"
  on public.interests for select using (auth.uid() = seeker_id);

create policy "Posters can view interests for their rooms"
  on public.interests for select using (auth.uid() = poster_id);

create policy "Authenticated users can insert interests"
  on public.interests for insert with check (auth.uid() = seeker_id);

create policy "Users can update own interests"
  on public.interests for update using (auth.uid() = seeker_id or auth.uid() = poster_id);

-- ─── 4. HANDOVERS (Confirmed — ₹1,000 to poster) ────────────
create table if not exists public.handovers (
  id                  uuid primary key default uuid_generate_v4(),
  interest_id         uuid references public.interests(id) on delete cascade not null,
  room_id             uuid references public.rooms(id) on delete cascade not null,
  seeker_id           uuid references public.profiles(id) on delete cascade not null,
  poster_id           uuid references public.profiles(id) on delete cascade not null,
  room_title          text,
  seeker_name         text,
  poster_name         text,
  poster_amount       int default 1000,   -- earned by poster
  platform_amount     int default 500,    -- earned by platform
  razorpay_order_id   text,
  razorpay_payment_id text,
  payment_status      text default 'pending',
  poster_paid_out     boolean default false,
  confirmed_at        timestamptz default now()
);

alter table public.handovers enable row level security;

create policy "Involved parties can view handovers"
  on public.handovers for select using (auth.uid() = seeker_id or auth.uid() = poster_id);

create policy "Authenticated users can insert handovers"
  on public.handovers for insert with check (auth.uid() = seeker_id);

-- ─── 5. EARNINGS ────────────────────────────────────────────
create table if not exists public.earnings (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  type        text not null,   -- 'room_commission' | 'contact_unlock' | 'item_sale'
  amount      int not null,
  description text,
  status      text default 'pending',   -- pending | completed
  created_at  timestamptz default now()
);

alter table public.earnings enable row level security;

create policy "Users can view own earnings"
  on public.earnings for select using (auth.uid() = user_id);

create policy "Service role can insert earnings"
  on public.earnings for insert with check (auth.uid() = user_id);

-- ─── 6. PAYOUT REQUESTS ─────────────────────────────────────
create table if not exists public.payouts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  user_name    text,
  amount       int not null,
  method       text not null,   -- 'upi' | 'bank'
  upi_id       text,
  bank_account text,
  bank_ifsc    text,
  bank_name    text,
  status       text default 'pending',   -- pending | processing | completed | rejected
  notes        text,
  processed_at timestamptz,
  created_at   timestamptz default now()
);

alter table public.payouts enable row level security;

create policy "Users can view own payouts"
  on public.payouts for select using (auth.uid() = user_id);

create policy "Users can insert own payouts"
  on public.payouts for insert with check (auth.uid() = user_id);

-- ─── STORAGE BUCKETS ────────────────────────────────────────
-- Run these separately in Supabase Dashboard → Storage

-- 1. Room media bucket (photos + videos)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-media',
  'room-media',
  true,
  52428800,   -- 50MB max per file
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']
) on conflict (id) do nothing;

-- 2. Aadhaar / KYC documents bucket (PRIVATE)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kyc-docs',
  'kyc-docs',
  false,
  10485760,   -- 10MB
  array['image/jpeg','image/png','application/pdf']
) on conflict (id) do nothing;

-- Storage policies for room-media (public)
create policy "Anyone can view room media"
  on storage.objects for select using (bucket_id = 'room-media');

create policy "Authenticated users can upload room media"
  on storage.objects for insert
  with check (bucket_id = 'room-media' and auth.role() = 'authenticated');

create policy "Users can delete own room media"
  on storage.objects for delete
  using (bucket_id = 'room-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for kyc-docs (private)
create policy "Users can upload own KYC docs"
  on storage.objects for insert
  with check (bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own KYC docs"
  on storage.objects for select
  using (bucket_id = 'kyc-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- ─── 7. FLATMATES ───────────────────────────────────────────
create table if not exists public.flatmates (
  id                text primary key,
  user_id           uuid references public.profiles(id) on delete cascade not null,
  title             text not null,
  description       text,
  rent_share        int not null,
  advance_share     int default 0,
  location          text not null,
  colony            text not null,
  vacancy_count     int default 1,
  profession_pref   text default 'Any',
  gender_pref       text default 'Any',
  lifestyle_habits  text[] default '{}',
  images            text[] default '{}',
  videos            text[] default '{}',
  is_available      boolean default true,
  created_at        timestamptz default now()
);

alter table public.flatmates enable row level security;

create policy "Anyone can view available flatmates"
  on public.flatmates for select using (is_available = true);

create policy "Users can insert own flatmates"
  on public.flatmates for insert with check (auth.uid() = user_id);

create policy "Users can update own flatmates"
  on public.flatmates for update using (auth.uid() = user_id);

create policy "Users can delete own flatmates"
  on public.flatmates for delete using (auth.uid() = user_id);

