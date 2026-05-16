import { NextResponse } from "next/server";

// POST /api/contacts/unlock — simulate payment and unlock contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, paymentMethod } = body;

    if (!roomId) {
      return NextResponse.json({ error: "roomId is required" }, { status: 400 });
    }

    // In production: verify payment via Razorpay/PhonePe, store unlock in DB
    // For demo: return success with contact info
    const { MOCK_ROOMS } = await import("@/data/mock");
    const room = MOCK_ROOMS.find(r => r.id === roomId);

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Mock payment success
    return NextResponse.json({
      success: true,
      contact: {
        name: room.postedBy.name,
        phone: room.postedBy.phone,
        whatsapp: room.postedBy.whatsapp,
        profession: room.postedBy.profession,
        avatar: room.postedBy.avatar,
      },
      unlocksRemaining: 4,
      message: "Contact unlocked successfully",
    });

  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/contacts/unlock?roomId=xxx — check if contact is already unlocked
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  
  // In production: check user's unlocked contacts from DB
  return NextResponse.json({ 
    unlocked: false, 
    unlocksRemaining: 5,
    packValid: false 
  });
}
