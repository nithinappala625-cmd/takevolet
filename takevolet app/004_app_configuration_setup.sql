-- ==============================================================
-- App Configuration & Dynamic Forms Setup Migration
-- ==============================================================

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Categories Table (For globally managed lists like "Property Types", "Roles", etc.)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Form Definitions Table (Replaces old 'dynamic_forms' JSONB structure)
CREATE TABLE IF NOT EXISTS public.form_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'properties', 'marketplace', 'rooms'
    description TEXT,
    entity_type VARCHAR(100) NOT NULL, -- The target table name (e.g., 'rooms')
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published'
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Form Fields Table
CREATE TABLE IF NOT EXISTS public.form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES public.form_definitions(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL, -- e.g., 'facing', 'parking'
    label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'dropdown', 'checkbox', 'radio', etc.
    placeholder VARCHAR(255),
    help_text TEXT,
    default_value TEXT,
    is_required BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    validation_rules JSONB DEFAULT '{}'::jsonb, -- e.g., {"min": 0, "max": 100, "regex": "..."}
    visibility_rules JSONB DEFAULT '[]'::jsonb, -- e.g., [{"field": "property_type", "operator": "==", "value": "apartment"}]
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (form_id, field_key)
);

-- 5. Field Options Table (For Dropdowns, Radios, Multi-Selects)
CREATE TABLE IF NOT EXISTS public.field_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES public.form_fields(id) ON DELETE CASCADE,
    label VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================
-- Add JSONB columns to existing business tables to store dynamic data safely
-- ==============================================================

DO $$
BEGIN
    -- Add to rooms
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='dynamic_data') THEN
        ALTER TABLE public.rooms ADD COLUMN dynamic_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add to property_sales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='property_sales' AND column_name='dynamic_data') THEN
        ALTER TABLE public.property_sales ADD COLUMN dynamic_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add to flatmates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='flatmates' AND column_name='dynamic_data') THEN
        ALTER TABLE public.flatmates ADD COLUMN dynamic_data JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add to build_listings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='build_listings' AND column_name='dynamic_data') THEN
        ALTER TABLE public.build_listings ADD COLUMN dynamic_data JSONB DEFAULT '{}'::jsonb;
    END IF;
END
$$;

-- ==============================================================
-- Row Level Security (RLS)
-- ==============================================================

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_options ENABLE ROW LEVEL SECURITY;

-- Public READ policies
CREATE POLICY "Public can read active app_settings" ON public.app_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can read published form_definitions" ON public.form_definitions FOR SELECT USING (is_active = true AND status = 'published');
CREATE POLICY "Public can read form_fields" ON public.form_fields FOR SELECT USING (true);
CREATE POLICY "Public can read field_options" ON public.field_options FOR SELECT USING (is_active = true);

-- Service Role (Admin) ALL ACCESS policies
-- The admin panel uses the service role key, which bypasses RLS automatically, 
-- but we can add policies explicitly just in case standard admin roles are used.
CREATE POLICY "Admin all access on app_settings" ON public.app_settings USING (true);
CREATE POLICY "Admin all access on categories" ON public.categories USING (true);
CREATE POLICY "Admin all access on form_definitions" ON public.form_definitions USING (true);
CREATE POLICY "Admin all access on form_fields" ON public.form_fields USING (true);
CREATE POLICY "Admin all access on field_options" ON public.field_options USING (true);
