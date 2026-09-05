-- 006_feed_enhancements.sql
-- Add document_url, link_url, and location fields to social_posts

ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Full-text search index on content for hashtag SEO
ALTER TABLE public.social_posts ADD COLUMN IF NOT EXISTS content_tsv TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_social_posts_content_tsv ON public.social_posts USING GIN(content_tsv);

NOTIFY pgrst, 'reload schema';
