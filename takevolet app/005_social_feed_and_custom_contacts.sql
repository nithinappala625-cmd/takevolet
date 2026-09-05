-- 005_social_feed_and_custom_contacts.sql

-- 1. Add custom_contact column to properties tables
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS custom_contact TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS custom_contact TEXT;
ALTER TABLE public.flatmates ADD COLUMN IF NOT EXISTS custom_contact TEXT;
ALTER TABLE public.top_projects ADD COLUMN IF NOT EXISTS custom_contact TEXT;

-- 2. Create social feed tables
CREATE TABLE IF NOT EXISTS public.social_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.social_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.social_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.social_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON public.social_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON public.social_likes(post_id);

-- Disable RLS for rapid development (or configure policies if required later)
ALTER TABLE public.social_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_comments DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
