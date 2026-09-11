import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import FeedDetailClient from './FeedDetailClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> | { id: string } }
): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const id = resolved.id;

  try {
    const { data: post } = await supabaseAdmin
      .from('social_posts')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .eq('id', id)
      .maybeSingle();

    if (!post) {
      return {
        title: 'Community Post | Takevolet',
        description: 'Read and discuss property and room updates on Takevolet Community.',
      };
    }

    const author = post.profiles?.full_name || 'Community Member';
    const snippet = (post.content || '').slice(0, 150);
    const title = `${author} on Takevolet`;
    const description = snippet ? `"${snippet}" — View full post & discussions on Takevolet.` : 'Community discussion on Takevolet.';

    const ogImage = post.image_url || post.profiles?.avatar_url || 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png';
    const shareUrl = `https://takevolet.online/feed/${id}`;

    return {
      title: `${title} | Takevolet`,
      description,
      openGraph: {
        title,
        description,
        url: shareUrl,
        siteName: 'Takevolet',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (_) {
    return {
      title: 'Community Post | Takevolet',
      description: 'Join the Takevolet community conversation.',
    };
  }
}

export default async function FeedSharePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return <FeedDetailClient postId={resolved.id} />;
}
