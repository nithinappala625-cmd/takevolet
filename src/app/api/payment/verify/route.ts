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
import { createClient } from "@supabase/supabase-js";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// Admin Supabase client — bypasses RLS to read poster profile
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
        { error: "Missing payment fields" },
        { status: 400 }
      );
    }

    if (!KEY_SECRET) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // ── 2. HMAC-SHA256 Signature Verification ─────────────────────────────────
    const body_to_sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected_signature = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(body_to_sign)
      .digest("hex");

    if (expected_signature !== razorpay_signature) {
      console.warn("[Razorpay] Signature mismatch", { razorpay_order_id });
      return NextResponse.json(
        { error: "Payment verification failed. Signature mismatch." },
        { status: 400 }
      );
    }

    // ── 3. Payment verified ✅ — fetch real contact from Supabase ─────────────
    let contact = null;

    if (roomId) {
      // Fetch room + poster profile from Supabase
      const { data: room } = await supabaseAdmin
        .from("rooms")
        .select("user_id, title, location, colony, profiles(full_name, phone, whatsapp, avatar_url, profession)")
        .eq("id", roomId)
        .single();

      if (room && room.profiles) {
        const p = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles;
        contact = {
          name:       p.full_name  || "Room Poster",
          phone:      p.phone      || "Contact via WhatsApp",
          whatsapp:   p.whatsapp   || p.phone || "",
          profession: p.profession || "",
          avatar:     p.avatar_url || "",
        };

        // Record the contact unlock in Supabase interests table
        if (userId && userId !== "guest") {
          await supabaseAdmin.from("interests").upsert({
            room_id:    roomId,
            user_id:    userId,
            payment_id: razorpay_payment_id,
            order_id:   razorpay_order_id,
            amount:     500,
            status:     "paid",
            paid_at:    new Date().toISOString(),
          }, { onConflict: "room_id,user_id", ignoreDuplicates: true });
        }
      }
    }

    // Fallback if room not in DB
    if (!contact) {
      contact = {
        name:       "Room Poster",
        phone:      "Will be shared via WhatsApp",
        whatsapp:   "",
        profession: "",
        avatar:     "",
      };
    }

    console.log("[Razorpay] ✅ Payment verified & contact unlocked", {
      paymentId: razorpay_payment_id,
      roomId,
      userId,
    });

    return NextResponse.json({
      success:    true,
      verified:   true,
      paymentId:  razorpay_payment_id,
      orderId:    razorpay_order_id,
      contact,
      message:    "Payment verified. Contact unlocked successfully.",
    });

  } catch (error: any) {
    console.error("[Razorpay] verify error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please contact support." },
      { status: 500 }
    );
  }
}
