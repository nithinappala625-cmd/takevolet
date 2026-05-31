import { Metadata } from 'next'
import { fetchItemByIdAction } from "@/lib/server-actions"

function getOptimizedOgImage(url: string) {
  if (!url || url.startsWith("/")) return url;
  if (url.includes("cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/c_fill,w_800,h_800,q_70,f_jpg/");
  }
  return url;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  let title = "Marketplace Item | Takevolet"
  let description = "Find used furniture, appliances, and items for bachelors in Hyderabad."
  let image = "/opengraph-image"
  
  const { id } = await params;

  try {
    const item = await fetchItemByIdAction(id)
    if (item) {
      title = `${item.title} in ${item.location} | Takevolet Marketplace`
      description = `Buy ${item.title} for ₹${item.price} in ${item.location}, Hyderabad. ${item.description ? item.description.slice(0, 100) : ''}...`
      if (item.image) {
        image = item.image
      }
    }
  } catch(e) {}

  const finalImage = getOptimizedOgImage(image);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: finalImage,
          width: 800,
          height: 800,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [finalImage],
    }
  }
}

export default async function MarketplaceDetailLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  let itemData = null;
  const { id } = await params;
  
  try {
    itemData = await fetchItemByIdAction(id)
  } catch (e) {}

  // JSON-LD for Marketplace Item
  const jsonLd = itemData ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: itemData.title,
    description: itemData.description || `Used item in ${itemData.location}`,
    image: itemData.image || "https://takevolet.online/opengraph-image",
    category: itemData.category,
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: itemData.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `https://takevolet.online/marketplace/${id}`,
      seller: {
        "@type": "Person",
        name: itemData.seller_profile?.full_name || "Seller"
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
