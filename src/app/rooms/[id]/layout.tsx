import { Metadata } from 'next'
import { getRoomById } from "@/lib/db"
import { MOCK_ROOMS } from "@/data/mock"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  let title = "Room Details | Takevolet"
  let description = "View details for this bachelor room handover in Hyderabad with zero brokerage."
  let image = "/opengraph-image"
  
  const { id } = await params;

  try {
    const room = await getRoomById(id)
    if (room) {
      title = `₹${room.rent.toLocaleString('en-IN')} - ${room.title} in ${room.location} | Zero Brokerage | Takevolet`
      description = `Find this bachelor room in ${room.location}, Hyderabad for ₹${room.rent}/month. Zero brokerage, direct contact. ${room.description ? room.description.slice(0, 100) : ''}...`
      if (room.images && room.images.length > 0) {
        image = room.images[0]
      }
    } else {
      const mock = MOCK_ROOMS.find(r => r.id === id)
      if (mock) {
        title = `₹${mock.rent.toLocaleString('en-IN')} - ${mock.title} in ${mock.location} | Zero Brokerage | Takevolet`
        description = `Find this bachelor room in ${mock.location}, Hyderabad for ₹${mock.rent}/month. Zero brokerage, direct contact. ${mock.description ? mock.description.slice(0, 100) : ''}...`
        if (mock.images && mock.images.length > 0) {
          image = mock.images[0]
        }
      }
    }
  } catch(e) {}

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    }
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
