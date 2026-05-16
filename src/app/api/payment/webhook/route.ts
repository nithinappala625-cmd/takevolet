// ─── Razorpay Webhook Handler ─────────────────────────────────────────────────
// POST /api/payment/webhook
//
// Razorpay sends server-to-server webhooks for payment events.
// This is MORE RELIABLE than client-side callbacks (works even if user
// closes browser after payment).
//
// Setup in Razorpay Dashboard:
//   Settings → Webhooks → Add Webhook
//   URL: https://yourdomain.com/api/payment/webhook
//   Secret: Set RAZORPAY_WEBHOOK_SECRET in .env.local
//   Events: payment.captured, payment.failed, order.paid
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    // ── 1. Read raw body for signature verification ───────────────────────────
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
    }

    // ── 2. Verify webhook signature ───────────────────────────────────────────
    if (WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

      if (expectedSig !== signature) {
        console.warn("[Webhook] Invalid signature — ignoring event");
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    } else {
      console.warn("[Webhook] RAZORPAY_WEBHOOK_SECRET not set — skipping signature check (dev only)");
    }

    // ── 3. Parse event ────────────────────────────────────────────────────────
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log("[Webhook] Event received:", eventType);

    switch (eventType) {

      case "payment.captured": {
        // Payment is fully captured — safe to unlock contact
        const payment = payload.payment?.entity;
        const orderId = payment?.order_id;
        const paymentId = payment?.id;
        const amount = payment?.amount; // in paise
        const notes = payment?.notes;

        console.log("[Webhook] payment.captured", {
          paymentId,
          orderId,
          amount: `₹${amount / 100}`,
          roomId: notes?.roomId,
          userId: notes?.userId,
        });

        // TODO (production): 
        // 1. Update DB: mark contact as unlocked for userId on roomId
        // 2. Send confirmation email/WhatsApp to seeker
        // 3. Credit commission to room poster's earnings
        // Example:
        // await db.contactUnlock.create({
        //   userId: notes.userId,
        //   roomId: notes.roomId,
        //   paymentId,
        //   orderId,
        //   amount: amount / 100,
        //   unlockedAt: new Date(),
        //   expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        // });
        break;
      }

      case "payment.failed": {
        const payment = payload.payment?.entity;
        console.warn("[Webhook] payment.failed", {
          paymentId: payment?.id,
          orderId: payment?.order_id,
          errorCode: payment?.error_code,
          errorDescription: payment?.error_description,
        });

        // TODO (production):
        // Notify user of payment failure via email
        break;
      }

      case "order.paid": {
        // Fired when all payments for an order are complete
        const order = payload.order?.entity;
        console.log("[Webhook] order.paid", {
          orderId: order?.id,
          amount: `₹${order?.amount / 100}`,
          status: order?.status,
        });
        break;
      }

      case "refund.created": {
        const refund = payload.refund?.entity;
        console.log("[Webhook] refund.created", {
          refundId: refund?.id,
          paymentId: refund?.payment_id,
          amount: `₹${refund?.amount / 100}`,
        });
        // TODO: Revoke contact unlock if refunded
        break;
      }

      default:
        console.log("[Webhook] Unhandled event:", eventType);
    }

    // Always return 200 to Razorpay to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
