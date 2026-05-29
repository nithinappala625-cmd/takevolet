// ─── Razorpay Payment Verification API ───────────────────────────────────────
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, roomId, userId } = body;

    // ── 1. Validate fields ───────────────────────────────────────────────────
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
    }
    if (!KEY_SECRET) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // ── 2. HMAC-SHA256 Signature Verification ────────────────────────────────
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      console.warn("[Razorpay] Signature mismatch", { razorpay_order_id });
      return NextResponse.json({ error: "Payment verification failed. Signature mismatch." }, { status: 400 });
    }

    // ── 3. Fetch contact — try Supabase first, then MOCK fallback ─────────────
    let contact: { name: string; phone: string; whatsapp: string; profession: string; avatar: string } | null = null;
    let room: any = null;

    if (roomId) {
      try {
        const { data: dbRoom } = await supabaseAdmin
          .from("rooms")
          .select("user_id, title, full_address")
          .eq("id", roomId)
          .single();
        room = dbRoom;

        if (room?.user_id) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, phone, whatsapp, avatar_url, profession")
            .eq("id", room.user_id)
            .single();

          if (profile && (profile.full_name || profile.phone)) {
            contact = {
              name:       profile.full_name  || "Room Poster",
              phone:      profile.phone      || "",
              whatsapp:   profile.whatsapp   || profile.phone || "",
              profession: profile.profession || "",
              avatar:     profile.avatar_url || "",
            };
          }
        }
      } catch (e) {
        console.warn("[Razorpay] Supabase room fetch failed, trying MOCK fallback", e);
      }

      // ── MOCK_ROOMS fallback (for test/demo rooms) ─────────────────────────
      if (!contact) {
        try {
          const { MOCK_ROOMS } = await import("@/data/mock");
          const mock = MOCK_ROOMS.find((r: any) => r.id === roomId);
          if (mock?.postedBy) {
            contact = {
              name:       mock.postedBy.name      || "Room Poster",
              phone:      mock.postedBy.phone     || "",
              whatsapp:   mock.postedBy.whatsapp  || mock.postedBy.phone || "",
              profession: mock.postedBy.profession || "",
              avatar:     mock.postedBy.avatar    || "",
            };
          }
        } catch (e) {
          console.warn("[Razorpay] MOCK fallback also failed", e);
        }
      }
    } else if (body.flatmateId) {
      try {
        const { data: dbFlatmate } = await supabaseAdmin
          .from("flatmates")
          .select("user_id, title")
          .eq("id", body.flatmateId)
          .single();
        room = dbFlatmate; // Use room variable temporarily

        if (room?.user_id) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, phone, whatsapp, avatar_url, profession")
            .eq("id", room.user_id)
            .single();

          if (profile && (profile.full_name || profile.phone)) {
            contact = {
              name:       profile.full_name  || "Flatmate Poster",
              phone:      profile.phone      || "",
              whatsapp:   profile.whatsapp   || profile.phone || "",
              profession: profile.profession || "",
              avatar:     profile.avatar_url || "",
            };
          }
        }
      } catch (e) {
        console.warn("[Razorpay] Supabase flatmate fetch failed, trying MOCK fallback", e);
      }

      // ── MOCK_FLATMATES fallback (for test/demo rooms) ─────────────────────────
      if (!contact) {
        try {
          const { MOCK_FLATMATES } = await import("@/data/mock");
          const mock = MOCK_FLATMATES.find((r: any) => r.id === body.flatmateId);
          if (mock?.postedBy) {
            contact = {
              name:       mock.postedBy.name      || "Flatmate Poster",
              phone:      mock.postedBy.phone     || "",
              whatsapp:   mock.postedBy.whatsapp  || mock.postedBy.phone || "",
              profession: mock.postedBy.profession || "",
              avatar:     mock.postedBy.avatar    || "",
            };
          }
        } catch (e) {
          console.warn("[Razorpay] MOCK fallback also failed", e);
        }
      }
    }

    // ── 4. Persist unlock to Supabase (non-blocking — don't crash on failure) ─
    if (userId && userId !== "guest") {
      try {
        if (roomId) {
          await supabaseAdmin.from("contact_unlocks").upsert({
            room_id:    roomId,
            user_id:    userId,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            created_at: new Date().toISOString(),
          }, { onConflict: "room_id,user_id", ignoreDuplicates: true });
        } else if (body.flatmateId) {
          await supabaseAdmin.from("flatmate_contact_unlocks").upsert({
            flatmate_id: body.flatmateId,
            user_id:    userId,
            razorpay_order_id: razorpay_order_id,
            razorpay_payment_id: razorpay_payment_id,
            created_at: new Date().toISOString(),
          }, { onConflict: "flatmate_id,user_id", ignoreDuplicates: true });
        }
      } catch (e) {
        console.warn("[Razorpay] contact_unlocks upsert failed:", e);
      }
    }

    // ── 5. Final fallback contact ──────────────────────────────────────────────
    if (!contact) {
      contact = {
        name:       roomId ? "Room Poster" : "Flatmate Poster",
        phone:      "",
        whatsapp:   "",
        profession: "",
        avatar:     "",
      };
    }

    console.log("[Razorpay] ✅ Payment verified — contact unlocked", { paymentId: razorpay_payment_id, roomId: roomId || body.flatmateId, userId, contactName: contact.name });

    const passNumber = "TV-PASS-" + razorpay_payment_id.slice(-6).toUpperCase();

    return NextResponse.json({
      success:   true,
      verified:  true,
      paymentId: razorpay_payment_id,
      orderId:   razorpay_order_id,
      passNumber,
      contact,
      message:   "Payment verified. Contact unlocked successfully.",
    });

  } catch (error: any) {
    console.error("[Razorpay] verify error:", error);
    return NextResponse.json({ error: "Verification failed. Please contact support." }, { status: 500 });
  }
}
