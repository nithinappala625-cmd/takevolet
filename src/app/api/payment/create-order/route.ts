// ─── Razorpay Order Creation API ─────────────────────────────────────────────
// POST /api/payment/create-order
//
// Razorpay requires an order to be created SERVER-SIDE before checkout opens.
// The order ID is then passed to the client-side Razorpay Checkout JS.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

// Validate env vars at startup
const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!KEY_ID || !KEY_SECRET) {
  console.error("[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env.local");
}

// Singleton Razorpay instance
const razorpay = new Razorpay({
  key_id: KEY_ID!,
  key_secret: KEY_SECRET!,
});

// ─── POST /api/payment/create-order ──────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, flatmateId, userId, type = "contact_unlock", planId = "growth", amount } = body;

    // Validate inputs
    if (!roomId && !flatmateId) {
      return NextResponse.json({ error: "roomId or flatmateId is required" }, { status: 400 });
    }
    if (!userId || userId === "guest") {
      return NextResponse.json({ error: "Authentication required to create a payment order" }, { status: 401 });
    }
    if (!KEY_ID || !KEY_SECRET) {
      return NextResponse.json({ error: "Payment gateway not configured. Please set Razorpay keys." }, { status: 503 });
    }

    // ─── Validate plan & amount ───────────────────────────────────────────────
    // Amount must be in paise. Accepted plans:
    const VALID_PLANS: Record<string, { paise: number; contacts: number; label: string }> = {
      single:    { paise: 1000,  contacts: 1,      label: "1 Contact" },
      starter:   { paise: 13900, contacts: 50,     label: "50 Contacts" },
      growth:    { paise: 28000, contacts: 100,    label: "100 Contacts" },
      pro:       { paise: 40000, contacts: 500,    label: "500 Contacts" },
      unlimited: { paise: 50000, contacts: 999999, label: "Unlimited Contacts" },
    };

    const plan = VALID_PLANS[planId] ?? VALID_PLANS["growth"]; // default to 100 contacts
    const AMOUNT_PAISE = amount && amount > 0 ? Math.min(amount, 50000) : plan.paise; // use client amount, but cap at ₹500

    // Create a unique receipt ID (max 40 chars per Razorpay spec)
    const targetId = roomId || flatmateId;
    const receipt = `rcpt_${targetId.slice(0, 15)}_${Date.now().toString().slice(-8)}`;

    // Create order via Razorpay API
    const order = await razorpay.orders.create({
      amount: AMOUNT_PAISE,           // in paise
      currency: "INR",
      receipt,
      notes: {
        roomId: roomId || "",
        flatmateId: flatmateId || "",
        userId: userId || "guest",
        type,                          // "contact_unlock"
        packContacts: "5",
        validityDays: "30",
      },
    });

    // Return order details to frontend (DO NOT return key_secret)
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,           // in paise — e.g. 150000
      currency: order.currency,
      keyId: KEY_ID,                  // Safe to expose — this is the public key
      receipt: order.receipt,
      notes: order.notes,
    });

  } catch (error: any) {
    console.error("[Razorpay] create-order error:", error);

    // Razorpay SDK throws an error object with statusCode and error
    if (error?.statusCode) {
      return NextResponse.json(
        { error: error.error?.description || "Razorpay order creation failed" },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Failed to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
