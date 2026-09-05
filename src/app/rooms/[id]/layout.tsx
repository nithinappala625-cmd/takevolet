import { Metadata } from 'next'
import { getRoomById } from "@/lib/db"
import { MOCK_ROOMS } from "@/data/mock"

function getOptimizedOgImage(url: string) {
  if (!url || url.startsWith("/")) return url;
  let optimized = url.replace("http://", "https://");
  if (optimized.includes("cloudinary.com") && optimized.includes("/upload/")) {
    return optimized.replace("/upload/", "/upload/c_fill,w_800,h_800,q_70,f_jpg/");
  }
  return optimized;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  let title = "Room for Rent in Hyderabad | Takevolet"
  let description = "View details for this room for rent in Hyderabad with zero brokerage. Direct owner contact, no brokers."
  let image = "/opengraph-image"
  let location = "Hyderabad";
  let tenantType = "bachelor";
  
  const { id } = await params;

  try {
    const room = await getRoomById(id)
    if (room) {
      location = room.location || "Hyderabad";
      tenantType = (room as any).tenant_type || "bachelor";
      const typeLabel = tenantType === "family" ? "Family" : "Bachelor";
      title = `${typeLabel} Room in ${location} — ₹${room.rent.toLocaleString('en-IN')}/mo | Zero Brokerage | Takevolet`
      description = `${typeLabel} room for rent in ${location}, Hyderabad for ₹${room.rent.toLocaleString('en-IN')}/month. ${room.furnishing || "Semi-Furnished"}. ${room.members_allowed || 2} members allowed. Zero brokerage, direct contact. ${room.description ? room.description.slice(0, 120) : ''}`
      if (room.images && room.images.length > 0) {
        image = room.images[0]
      }
    } else {
      const mock = MOCK_ROOMS.find(r => r.id === id)
      if (mock) {
        location = mock.location || "Hyderabad";
        title = `Room in ${location} — ₹${mock.rent.toLocaleString('en-IN')}/mo | Zero Brokerage | Takevolet`
        description = `Room for rent in ${location}, Hyderabad for ₹${mock.rent.toLocaleString('en-IN')}/month. Zero brokerage, direct contact. ${mock.description ? mock.description.slice(0, 120) : ''}`
        if (mock.images && mock.images.length > 0) {
          image = mock.images[0]
        }
      }
    }
  } catch(e) {}

  const finalImage = getOptimizedOgImage(image);
  const typeLabel = tenantType === "family" ? "family" : "bachelor";

  return {
    title,
    description,
    keywords: [
      `room for rent ${location.toLowerCase()}`,
      `${typeLabel} room ${location.toLowerCase()}`,
      `${location.toLowerCase()} room rent`,
      `room rent ${location.toLowerCase()} hyderabad`,
      `zero brokerage room ${location.toLowerCase()}`,
      "rooms for rent hyderabad",
      "takevolet",
    ],
    openGraph: {
      title,
      description,
      url: `https://takevolet.online/rooms/${id}`,
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
    },
    alternates: {
      canonical: `/rooms/${id}`,
    },
  }
}

export default async function RoomDetailLayout({ children, params }: { children: React.ReactNode, params: Promise<{ id: string }> }) {
  let roomData = null;
  const { id } = await params;
  
  try {
    const dbRoom = await getRoomById(id)
    if (dbRoom) roomData = dbRoom
    else roomData = MOCK_ROOMS.find(r => r.id === id)
  } catch (e) {}

  // JSON-LD for Google & AI Overviews
  const jsonLd = roomData ? {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Offer", "Product"],
    name: roomData.title,
    description: roomData.description || `A zero brokerage room in ${roomData.location}, Hyderabad.`,
    image: roomData.images?.[0] || "https://takevolet.online/opengraph-image",
    offers: {
      "@type": "Offer",
      price: roomData.rent,
      priceCurrency: "INR",
      availability: (roomData as any).is_available !== false && (roomData as any).isAvailable !== false ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      url: `https://takevolet.online/rooms/${id}`,
      itemOffered: {
        "@type": "Accommodation",
        name: roomData.title,
        numberOfRooms: 1,
        address: {
          "@type": "PostalAddress",
          addressLocality: roomData.location,
          addressRegion: "Telangana",
          addressCountry: "IN",
        }
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
