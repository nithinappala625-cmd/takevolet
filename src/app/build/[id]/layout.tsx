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

  let title = "Construction & Building Services | Takevolet";
  let description = "Connect with verified contractors, architects, and suppliers on Takevolet.";
  let image = "https://takevolet.online/opengraph-image";

  try {
    const { data: b } = await supabase
      .from("build_listings")
      .select("business_name, contact_person, category, city, locality, description, image")
      .eq("id", id)
      .maybeSingle();

    if (b) {
      const name = b.business_name || b.contact_person || "Construction Service";
      const cat = b.category ? `(${b.category})` : "";
      const loc = [b.locality, b.city].filter(Boolean).join(", ");
      title = `${name} ${cat} in ${loc || "Hyderabad"} | Takevolet`;
      description = `${name} provides professional ${b.category || "construction"} services in ${loc || "Hyderabad"}. ${b.description ? b.description.slice(0, 140) : "Verified building contractors on Takevolet."}`;
      if (b.image) {
        image = b.image;
      }
    }
  } catch (e) {
    // fallback
  }

  const canonicalUrl = `https://takevolet.online/build/${id}`;

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

export default function BuildDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
