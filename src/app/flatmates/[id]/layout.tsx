import { Metadata } from 'next'
import { getFlatmateById } from "@/lib/db"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  let title = "Flatmate Profile | Takevolet"
  let description = "Find your ideal bachelor flatmate in Hyderabad."
  let image = "/opengraph-image"
  
  const { id } = await params;

  try {
    const fm = await getFlatmateById(id)
    if (fm) {
      title = `${fm.profiles?.full_name || 'Flatmate'} is looking for a room in ${fm.preferred_location} | Takevolet`
      description = `${fm.profiles?.full_name || 'A bachelor'} is looking for a flatmate in ${fm.preferred_location}, Hyderabad. Budget: ₹${fm.budget}/month. Contact directly with zero brokerage.`
      if (fm.profiles?.avatar_url) {
        image = fm.profiles.avatar_url
      }
    }
  } catch(e) {}

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    }
  }
}

export default async function FlatmateDetailLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  let fm = null;
  const { id } = await params;
  
  try {
    fm = await getFlatmateById(id)
  } catch (e) {}

  // JSON-LD for Flatmate Profile
  const jsonLd = fm ? {
    "@context": "https://schema.org",
    "@type": "Person",
    name: fm.profiles?.full_name || "Flatmate",
    description: fm.bio || `Looking for a room in ${fm.preferred_location}`,
    image: fm.profiles?.avatar_url || "https://takevolet.online/opengraph-image",
    jobTitle: fm.profiles?.profession || "Professional",
    seeks: {
      "@type": "Demand",
      itemOffered: {
        "@type": "Accommodation",
        name: `Room in ${fm.preferred_location}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: fm.preferred_location,
          addressRegion: "Telangana",
          addressCountry: "IN",
        }
      },
      priceSpecification: {
        "@type": "PriceSpecification",
        price: fm.budget,
        priceCurrency: "INR",
        name: "Monthly Rent Budget"
      }
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
