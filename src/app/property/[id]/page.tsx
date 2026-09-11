import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PropertyDetailClient from './PropertyDetailClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> | { id: string } }
): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const id = resolved.id;

  try {
    const { data: prop } = await supabaseAdmin
      .from('property_sales')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!prop) {
      return {
        title: 'Verified Property | Takevolet',
        description: 'Explore verified flats, houses, lands, and commercial spaces with 0 brokerage on Takevolet.',
      };
    }

    const title = prop.title || 'Verified Property for Sale';
    const priceVal = Number(prop.price || prop.expected_price || 0);
    const formattedPrice = priceVal >= 10000000
      ? `₹${(priceVal / 10000000).toFixed(2)} Cr`
      : priceVal >= 100000
      ? `₹${(priceVal / 100000).toFixed(2)} L`
      : `₹${priceVal}`;

    const location = [prop.village, prop.locality, prop.area, prop.district, prop.city]
      .filter(Boolean)
      .join(', ');

    const description = `${formattedPrice} • ${location || 'India'} | Verified 0 Brokerage Property on Takevolet. Direct Owner Access.`;

    const images = [prop.cover_image, ...(prop.flat_images || [])].filter(Boolean);
    const ogImage = images.length > 0
      ? images[0]
      : 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png';

    const shareUrl = `https://takevolet.online/property/${id}`;

    return {
      title: `${title} - ${formattedPrice} | Takevolet`,
      description,
      openGraph: {
        title: `${title} • ${formattedPrice}`,
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
        title: `${title} • ${formattedPrice}`,
        description,
        images: [ogImage],
      },
    };
  } catch (_) {
    return {
      title: 'Property Listing | Takevolet',
      description: 'Find verified properties with 0 brokerage on Takevolet.',
    };
  }
}

export default async function PropertySharePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return <PropertyDetailClient propertyId={resolved.id} />;
}
