// ─── Razorpay Webhook Handler ─────────────────────────────────────────────────
// POST /api/payment/webhook
//
// Razorpay sends server-to-server webhooks for payment events.
// MORE RELIABLE than client-side callbacks — works even if user closes browser.
//
// Setup in Razorpay Dashboard:
//   Settings → Webhooks → Add Webhook
//   URL: https://takevolet.online/api/payment/webhook
//   Secret: set RAZORPAY_WEBHOOK_SECRET in Vercel env vars
//   Events: ✅ payment.captured  ✅ payment.failed  ✅ refund.created  ✅ order.paid
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Admin Supabase — bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // ── 1. Read raw body for signature verification ───────────────────────────
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    // ── 2. Verify webhook signature (required in production) ──────────────────
    if (WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (expectedSig !== signature) {
        console.warn("[Webhook] ❌ Invalid signature — rejecting event");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      // In production WEBHOOK_SECRET must be set — log warning
      console.warn("[Webhook] ⚠️ RAZORPAY_WEBHOOK_SECRET not set — skipping verification (dev only)");
    }

    // ── 3. Parse event ────────────────────────────────────────────────────────
    const event = JSON.parse(rawBody);
    const eventType: string = event.event;
    const payload = event.payload;

    console.log("[Webhook] ✅ Event received:", eventType);

    switch (eventType) {

      case "payment.captured": {
        // Payment fully captured — persist unlock to Supabase
        const payment = payload.payment?.entity;
        const orderId   = payment?.order_id;
        const paymentId = payment?.id;
        const amount    = payment?.amount; // paise
        const notes     = payment?.notes || {};

        console.log("[Webhook] payment.captured", {
          paymentId, orderId,
          amount: `₹${(amount / 100).toFixed(2)}`,
          roomId: notes.roomId,
          userId: notes.userId,
          type: notes.type,
        });

        // ── Persist contact unlock to Supabase ────────────────────────────────
        if (notes.userId && notes.userId !== "guest") {
          if (notes.type === "contact_unlock" && notes.roomId) {
            await supabaseAdmin.from("contact_unlocks").upsert({
              room_id:    notes.roomId,
              user_id:    notes.userId,
              razorpay_payment_id: paymentId,
              razorpay_order_id:   orderId,
              created_at: new Date().toISOString(),
            }, { onConflict: "room_id,user_id", ignoreDuplicates: true });
            console.log("[Webhook] ✅ Contact unlock saved to Supabase");
          } else if (notes.type === "flatmate_contact_unlock" && notes.flatmateId) {
            await supabaseAdmin.from("flatmate_contact_unlocks").upsert({
              flatmate_id: notes.flatmateId,
              user_id:    notes.userId,
              razorpay_payment_id: paymentId,
              razorpay_order_id:   orderId,
              created_at: new Date().toISOString(),
            }, { onConflict: "flatmate_id,user_id", ignoreDuplicates: true });
            console.log("[Webhook] ✅ Flatmate contact unlock saved to Supabase");
          } else if (notes.roomId) {
            // Default to interests table for actual interests
            const { error } = await supabaseAdmin.from("interests").upsert({
              room_id:    notes.roomId,
              user_id:    notes.userId,
              payment_id: paymentId,
              order_id:   orderId,
              amount:     Math.round(amount / 100),
              status:     "paid",
              type:       notes.type || "interest",
              paid_at:    new Date().toISOString(),
            }, { onConflict: "room_id,user_id", ignoreDuplicates: true });

            if (error) {
              console.error("[Webhook] Supabase upsert error:", error.message);
            } else {
              console.log("[Webhook] ✅ Interest record saved to Supabase");
            }
          }
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        console.warn("[Webhook] ❌ payment.failed", {
          paymentId:        payment?.id,
          orderId:          payment?.order_id,
          errorCode:        payment?.error_code,
          errorDescription: payment?.error_description,
        });
        // Log failure to Supabase for audit (non-critical)
        try {
          if (payment?.notes?.roomId) {
            await supabaseAdmin.from("payment_failures").insert({
              room_id:    payment.notes.roomId,
              user_id:    payment.notes.userId || null,
              payment_id: payment.id,
              order_id:   payment.order_id,
              error_code: payment.error_code,
              error_desc: payment.error_description,
              failed_at:  new Date().toISOString(),
            });
          }
        } catch (_) {}
        break;
      }

      case "order.paid": {
        const order = payload.order?.entity;
        console.log("[Webhook] order.paid", {
          orderId: order?.id,
          amount:  `₹${(order?.amount / 100).toFixed(2)}`,
          status:  order?.status,
        });
        break;
      }

      case "refund.created": {
        const refund = payload.refund?.entity;
        console.log("[Webhook] refund.created", {
          refundId:  refund?.id,
          paymentId: refund?.payment_id,
          amount:    `₹${(refund?.amount / 100).toFixed(2)}`,
        });
        // Mark the unlock as refunded in Supabase
        try {
          if (refund?.payment_id) {
            await supabaseAdmin
              .from("interests")
              .update({ status: "refunded", refund_id: refund.id })
              .eq("payment_id", refund.payment_id);
          }
        } catch (_) {}
        break;
      }

      default:
        console.log("[Webhook] Unhandled event:", eventType);
    }

    // Always return 200 to Razorpay to acknowledge receipt
    return NextResponse.json({ received: true, event: eventType }, { status: 200 });

  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
