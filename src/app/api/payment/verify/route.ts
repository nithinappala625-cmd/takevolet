// ─── Razorpay Payment Verification API ───────────────────────────────────────
// POST /api/payment/verify
//
// After Razorpay checkout completes, it returns:
//   razorpay_payment_id, razorpay_order_id, razorpay_signature
//
// We MUST verify the HMAC-SHA256 signature server-side before unlocking
// the contact. This prevents fake/forged payment callbacks.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import crypto from "crypto";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// ─── POST /api/payment/verify ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      roomId,
      userId,
    } = body;

    // ── 1. Validate required fields ──────────────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment fields: razorpay_payment_id, razorpay_order_id, razorpay_signature are required" },
        { status: 400 }
      );
    }

    if (!KEY_SECRET) {
      console.error("[Razorpay] Missing RAZORPAY_KEY_SECRET");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // ── 2. HMAC-SHA256 Signature Verification ─────────────────────────────────
    // Razorpay signs: `order_id + "|" + payment_id` with your key_secret
    // We must verify this to confirm the payment is authentic
    const body_to_sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected_signature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(body_to_sign)
      .digest("hex");

    const isSignatureValid = expected_signature === razorpay_signature;

    if (!isSignatureValid) {
      console.warn("[Razorpay] Signature mismatch — possible tampered request", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Payment verification failed. Signature mismatch." },
        { status: 400 }
      );
    }

    // ── 3. Payment is verified ✅ — Unlock the contact ───────────────────────
    // In production: save to DB (user_id, room_id, payment_id, unlocked_at, expires_at)
    // For now: return contact details from mock data

    const { MOCK_ROOMS } = await import("@/data/mock");
    const { getAllPostedRooms } = await import("@/lib/userStore");

    let contact = null;

    // Check user-posted rooms first (localStorage rooms via API isn't available
    // server-side, so we rely on the roomId passed and return mock data for those)
    const mockRoom = MOCK_ROOMS.find(r => r.id === roomId);

    if (mockRoom) {
      contact = {
        name: mockRoom.postedBy.name,
        phone: mockRoom.postedBy.phone,
        whatsapp: mockRoom.postedBy.whatsapp,
        profession: mockRoom.postedBy.profession,
        avatar: mockRoom.postedBy.avatar,
      };
    } else {
      // For user-posted rooms, contact is embedded in the payment notes
      // In production: query DB with roomId → get poster's contact
      contact = {
        name: "Room Poster",
        phone: "Contact details will be shown",
        whatsapp: "Contact details will be shown",
        profession: "",
        avatar: "",
      };
    }

    // Log the successful unlock (in production: save to DB)
    console.log("[Razorpay] Payment verified & contact unlocked", {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      roomId,
      userId,
      amount: "₹1,500",
      unlockedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      contact,
      unlocksRemaining: 4,     // In production: decrement from DB pack
      packValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      message: "Payment verified. Contact unlocked successfully.",
    });

  } catch (error: any) {
    console.error("[Razorpay] verify error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
