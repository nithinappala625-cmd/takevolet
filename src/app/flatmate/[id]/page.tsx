import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import FlatmateDetailClient from './FlatmateDetailClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> | { id: string } }
): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const id = resolved.id;

  try {
    const { data: flatmate } = await supabaseAdmin
      .from('flatmates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!flatmate) {
      return {
        title: 'Flatmate Required | Takevolet',
        description: 'Find verified flatmates and shared flats with 0 brokerage on Takevolet.',
      };
    }

    const title = flatmate.title || 'Flatmate Required';
    const rent = flatmate.rent_share ? `₹${flatmate.rent_share}/month` : 'Rent Share Available';
    const location = [flatmate.colony, flatmate.location, flatmate.city].filter(Boolean).join(', ');
    const description = `${rent} • ${location || 'India'} | Verified Flatmate on Takevolet. Connect directly with 0 brokerage.`;

    const images = Array.isArray(flatmate.images) && flatmate.images.length > 0
      ? flatmate.images
      : [];
    const ogImage = images.length > 0
      ? images[0]
      : 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png';

    const shareUrl = `https://takevolet.online/flatmate/${id}`;

    return {
      title: `${title} - ${rent} | Takevolet`,
      description,
      openGraph: {
        title: `${title} • ${rent}`,
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
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} • ${rent}`,
        description,
        images: [ogImage],
      },
    };
  } catch (_) {
    return {
      title: 'Flatmate Required | Takevolet',
      description: 'Find verified flatmates with 0 brokerage on Takevolet.',
    };
  }
}

export default async function FlatmateSharePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return <FlatmateDetailClient flatmateId={resolved.id} />;
}