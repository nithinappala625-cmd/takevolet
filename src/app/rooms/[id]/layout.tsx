import { Metadata } from 'next'
import { getRoomById } from "@/lib/db"
import { MOCK_ROOMS } from "@/data/mock"

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  let title = "Room Details | Takevolet"
  let description = "View details for this bachelor room handover in Hyderabad."
  let image = "/logo.png"

  try {
    const room = await getRoomById(params.id)
    if (room) {
      title = `${room.title} | Takevolet`
      description = room.description.slice(0, 150) + "..."
      if (room.images && room.images.length > 0) {
        image = room.images[0]
      }
    } else {
      const mock = MOCK_ROOMS.find(r => r.id === params.id)
      if (mock) {
        title = `${mock.title} | Takevolet`
        description = mock.description.slice(0, 150) + "..."
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

export default function RoomDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
