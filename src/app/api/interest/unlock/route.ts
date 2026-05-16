// ─── Interest & Handover Payment APIs ────────────────────────────────────────
// POST /api/interest/unlock — Pay ₹500 to unlock full address (interest payment)
// POST /api/interest/confirm — Pay ₹1,000 to confirm handover (poster gets ₹1,000)
//
// Commission Split:
//   Interest (address unlock):  ₹500  → Takevolet platform
//   Handover confirmation:      ₹1,000 → Room Poster | ₹500 → Takevolet platform
//                               (₹1,500 total, seeker pays ₹500 earlier + ₹1,000 now)
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID!;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

// Ensure global stores are initialized
declare global {
  var _rr_interests: any[];
  var _rr_handovers: any[];
  var _rr_payouts: Record<string, any[]>;
}
global._rr_interests = global._rr_interests || [];
global._rr_handovers = global._rr_handovers || [];
global._rr_payouts = global._rr_payouts || {};

// ─── POST /api/interest/unlock ─────────────────────────────────────────────────
// Step 1: Create Razorpay order for ₹500 address unlock
// Step 2: Verify Razorpay payment + record interest
export async function POST(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "create-order";

  if (action === "create-order") {
    // ── Create ₹500 interest order ─────────────────────────────────────────
    const body = await request.json();
    const { roomId, userId, userName } = body;

    if (!roomId || !userId) {
      return NextResponse.json({ error: "roomId and userId required" }, { status: 400 });
    }

    // Check not already interested
    const alreadyInterested = global._rr_interests.find(
      (i: any) => i.roomId === roomId && i.userId === userId && i.status === "paid"
    );
    if (alreadyInterested) {
      return NextResponse.json({ error: "You have already unlocked this address" }, { status: 400 });
    }

    const receipt = `int_${roomId.slice(0, 10)}_${Date.now().toString().slice(-8)}`;
    const order = await razorpay.orders.create({
      amount: 50000,    // ₹500 in paise
      currency: "INR",
      receipt,
      notes: { roomId, userId, userName: userName || "User", type: "interest_unlock" },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,   // 50000 paise = ₹500
      currency: order.currency,
      keyId: KEY_ID,
    });

  } else if (action === "verify") {
    // ── Verify payment + unlock address ────────────────────────────────────
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, roomId, userId, userName, roomTitle, posterName, posterId } = body;

    // HMAC verification
    const expected = crypto.createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // ── Fetch real room data from Supabase ──────────────────────────────────
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: room } = await admin
      .from("rooms")
      .select("id, title, location, colony, full_address, user_id, profiles(full_name, phone, whatsapp)")
      .eq("id", roomId)
      .single();

    const poster = room?.profiles
      ? (Array.isArray(room.profiles) ? room.profiles[0] : room.profiles)
      : null;

    // ── Persist interest record to Supabase ─────────────────────────────────
    const interestId = `INT-${Date.now()}`;
    if (userId && userId !== "guest") {
      await admin.from("interests").upsert({
        id:         interestId,
        room_id:    roomId,
        user_id:    userId,
        poster_id:  posterId || room?.user_id,
        payment_id: razorpay_payment_id,
        order_id:   razorpay_order_id,
        amount:     500,
        status:     "paid",
        paid_at:    new Date().toISOString(),
      }, { onConflict: "room_id,user_id", ignoreDuplicates: true });
    }

    // Also keep in-memory for handover flow within same session
    const interestRecord = {
      id: interestId,
      roomId,
      roomTitle: roomTitle || room?.title || "Room",
      userId,
      userName: userName || "User",
      posterId: posterId || room?.user_id || "poster",
      posterName: posterName || poster?.full_name || "Poster",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      platformFee: 500,
      status: "paid",
      paidAt: new Date().toISOString(),
      handoverConfirmed: false,
    };
    global._rr_interests.push(interestRecord);

    const fullAddress = room
      ? `${room.colony || ""}, ${room.location || ""}, Hyderabad — Contact ${poster?.full_name || "the poster"} on WhatsApp: ${poster?.whatsapp || poster?.phone || "number will be shared"}`
      : "Address will be shared by poster on WhatsApp";

    return NextResponse.json({
      success: true,
      interestId,
      fullAddress,
      posterContact:  poster?.phone    || "Contact via WhatsApp",
      posterWhatsapp: poster?.whatsapp || poster?.phone,
      posterName:     poster?.full_name,
      message: "Address unlocked! ₹500 paid. Contact the poster to visit the room.",
    });

  } else if (action === "create-handover-order") {
    // ── Create ₹1,000 handover confirmation order ───────────────────────────
    const body = await request.json();
    const { roomId, userId, interestId } = body;

    const interest = global._rr_interests.find((i: any) => i.id === interestId && i.userId === userId);
    if (!interest) {
      return NextResponse.json({ error: "Interest record not found" }, { status: 404 });
    }
    if (interest.handoverConfirmed) {
      return NextResponse.json({ error: "Handover already confirmed" }, { status: 400 });
    }

    const receipt = `hov_${roomId.slice(0, 10)}_${Date.now().toString().slice(-8)}`;
    const order = await razorpay.orders.create({
      amount: 100000,   // ₹1,000 in paise
      currency: "INR",
      receipt,
      notes: { roomId, userId, interestId, type: "handover_confirmation" },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,   // 100000 paise = ₹1,000
      currency: order.currency,
      keyId: KEY_ID,
    });

  } else if (action === "verify-handover") {
    // ── Verify handover payment + credit poster ─────────────────────────────
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, roomId, userId, interestId } = body;

    const expected = crypto.createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    const interest = global._rr_interests.find((i: any) => i.id === interestId && i.userId === userId);
    if (!interest) {
      return NextResponse.json({ error: "Interest record not found" }, { status: 404 });
    }

    interest.handoverConfirmed = true;

    // Record handover
    const handover = {
      id: `HOV-${Date.now()}`,
      interestId,
      roomId,
      userId,
      userName: interest.userName,
      posterId: interest.posterId,
      posterName: interest.posterName,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      posterCommission: 1000,  // ₹1,000 → poster
      platformFee: 500,        // ₹500 → Takevolet (the ₹500 already paid for address)
      totalPaid: 1500,         // ₹500 (interest) + ₹1,000 (handover)
      status: "confirmed",
      confirmedAt: new Date().toISOString(),
    };
    global._rr_handovers.push(handover);

    // Credit ₹1,000 to poster's payout balance
    if (!global._rr_payouts[interest.posterId]) global._rr_payouts[interest.posterId] = [];
    global._rr_payouts[interest.posterId].push({
      id: `EARN-${Date.now()}`,
      userId: interest.posterId,
      userName: interest.posterName,
      amount: 1000,
      method: "pending_payout",
      status: "pending",   // pending until poster requests withdrawal
      requestedAt: new Date().toISOString(),
      processedAt: null,
      notes: `Handover commission from room ${roomId}`,
      type: "earning",
    });

    return NextResponse.json({
      success: true,
      handoverId: handover.id,
      message: "Handover confirmed! ₹1,000 commission credited to poster. Welcome to your new room! 🎉",
      posterCommission: 1000,
      platformFee: 500,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
