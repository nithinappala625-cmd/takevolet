import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const id = resolved.id;

  let title = "Property for Sale | Takevolet";
  let description = "View details, floor plan, photos and seller contacts for this verified property on Takevolet.";
  let image = "https://takevolet.online/opengraph-image";

  try {
    const { data: prop } = await supabase
      .from("property_sales")
      .select("title, description, price, property_type, locality, city, cover_image")
      .eq("id", id)
      .maybeSingle();

    if (prop) {
      const loc = [prop.locality, prop.city].filter(Boolean).join(", ");
      const priceStr = prop.price ? `₹${Number(prop.price).toLocaleString('en-IN')}` : "Best Price";
      title = `${prop.title || prop.property_type || "Property"} in ${loc || "Hyderabad"} — ${priceStr} | Takevolet`;
      description = `${prop.property_type || "Property"} for sale in ${loc || "Hyderabad"}. Price: ${priceStr}. ${prop.description ? prop.description.slice(0, 140) : "Direct seller contact with zero brokerage."}`;
      if (prop.cover_image) {
        image = prop.cover_image;
      }
    }
  } catch (e) {
    // fallback to defaults
  }

  const canonicalUrl = `https://takevolet.online/properties/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function PropertyDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
