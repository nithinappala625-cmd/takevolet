import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import RoomDetailClient from '@/app/room/[id]/RoomDetailClient';
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> | { id: string } }
): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const id = resolved.id;

  try {
    const { data: room } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!room) {
      return {
        title: 'Room / PG | Takevolet',
        description: 'Explore verified rooms, PGs, and hostels with 0 brokerage on Takevolet.',
      };
    }

    const title = room.title || 'Verified Room / PG';
    const rent = room.rent ? `₹${room.rent}/month` : 'Affordable Tariff';
    const location = [room.colony, room.location, room.city].filter(Boolean).join(', ');
    const description = `${rent} • ${location || 'India'} | Verified Room & PG on Takevolet. No brokers involved.`;

    const images = Array.isArray(room.images) && room.images.length > 0
      ? room.images
      : room.cover_image
      ? [room.cover_image]
      : [];
    const ogImage = images.length > 0
      ? images[0]
      : 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png';

    const shareUrl = `https://takevolet.online/pg/${id}`;

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
      title: 'Room & PG Listing | Takevolet',
      description: 'Find verified rooms and PGs with 0 brokerage on Takevolet.',
    };
  }
}

export default async function RoomSharePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return <RoomDetailClient roomId={resolved.id} />;
}
