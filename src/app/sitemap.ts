import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ARTICLES } from '@/data/articles'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://takevolet.online'
  const now = new Date()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch dynamic routes
  const { data: rooms } = await supabase.from('rooms').select('id, created_at').eq('is_available', true)
  const { data: flatmates } = await supabase.from('flatmates').select('id, created_at')
  const { data: items } = await supabase.from('items').select('id, created_at')

  const roomUrls = (rooms || []).map((room) => ({
    url: `${baseUrl}/rooms/${room.id}`,
    lastModified: new Date(room.created_at || now),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const flatmateUrls = (flatmates || []).map((fm) => ({
    url: `${baseUrl}/flatmates/${fm.id}`,
    lastModified: new Date(fm.created_at || now),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  const itemUrls = (items || []).map((item) => ({
    url: `${baseUrl}/marketplace/${item.id}`,
    lastModified: new Date(item.created_at || now),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  const articleUrls = ARTICLES.map((article) => ({
    url: `${baseUrl}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  return [
    // Homepage — highest priority
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    // Core listing pages — very high priority
    {
      url: `${baseUrl}/rooms`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.97,
    },
    {
      url: `${baseUrl}/flatmates`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.93,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.88,
    },
    // Content pages — high SEO value
    {
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.87,
    },
    {
      url: `${baseUrl}/articles/faq`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Posting / conversion pages
    {
      url: `${baseUrl}/list`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.78,
    },
    {
      url: `${baseUrl}/post/room`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${baseUrl}/post/flatmate`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.73,
    },
    {
      url: `${baseUrl}/post/item`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.68,
    },
    // Info pages
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${baseUrl}/partners`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/refer`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Legal pages
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/refund-policy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.25,
    },
    // Dynamic pages
    ...roomUrls,
    ...flatmateUrls,
    ...itemUrls,
    ...articleUrls,
  ]
}
