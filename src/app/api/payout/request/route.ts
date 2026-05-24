// ─── Payout Request API ───────────────────────────────────────────────────────
// POST /api/payout/request — User requests a withdrawal
// GET  /api/payout/history — Get user's payout request history
//
// Payouts are MANUAL — Takevolet reviews and sends money via UPI/NEFT.
// Users cannot self-trigger bank transfers. Admin processes each request.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";

// In production: replace with DB queries (Supabase/Postgres)
// For now: in-memory store (resets on server restart — use DB for production)
const payoutRequests: Record<string, any[]> = {};

// ─── POST /api/payout/request ─────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, userName, amount, method, upiId, bankAccount, bankIfsc, bankName, qrCode } = body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!userId || !amount || !method) {
      return NextResponse.json({ error: "userId, amount, and method are required" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 100) {
      return NextResponse.json({ error: "Minimum withdrawal amount is ₹100" }, { status: 400 });
    }
    if (amountNum > 50000) {
      return NextResponse.json({ error: "Maximum single withdrawal is ₹50,000" }, { status: 400 });
    }

    if (method === "upi" && !upiId) {
      return NextResponse.json({ error: "UPI ID is required for UPI payouts" }, { status: 400 });
    }
    if (method === "bank" && (!bankAccount || !bankIfsc)) {
      return NextResponse.json({ error: "Bank account number and IFSC code are required" }, { status: 400 });
    }
    if (method === "qrcode" && !qrCode) {
      return NextResponse.json({ error: "QR Code is required for QR payouts" }, { status: 400 });
    }

    // ── Create payout request ─────────────────────────────────────────────────
    const requestId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const payoutReq = {
      id: requestId,
      userId,
      userName: userName || "User",
      amount: amountNum,
      method,                        // "upi" | "bank" | "qrcode"
      upiId: method === "upi" ? upiId : null,
      bankAccount: method === "bank" ? bankAccount : null,
      bankIfsc: method === "bank" ? bankIfsc : null,
      bankName: method === "bank" ? bankName : null,
      qrCode: method === "qrcode" ? qrCode : null,
      status: "pending",             // pending → processing → completed / rejected
      requestedAt: new Date().toISOString(),
      processedAt: null,
      notes: "",
    };

    if (!payoutRequests[userId]) payoutRequests[userId] = [];
    payoutRequests[userId].unshift(payoutReq);

    // Log for admin (in production: send email to admin, save to DB)
    console.log("[Payout Request] New request:", {
      id: requestId,
      user: userName,
      amount: `₹${amountNum}`,
      method,
      upiId: upiId || null,
      bankAccount: bankAccount ? `****${bankAccount.slice(-4)}` : null,
      requestedAt: payoutReq.requestedAt,
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: `Payout request of ₹${amountNum} submitted. We'll process it within 24–48 hours.`,
      estimatedTime: "24–48 business hours",
    });

  } catch (error: any) {
    console.error("[Payout] request error:", error);
    return NextResponse.json({ error: "Failed to submit payout request" }, { status: 500 });
  }
}

// ─── GET /api/payout/history?userId=xxx ──────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const history = payoutRequests[userId] || [];
  return NextResponse.json({ success: true, requests: history });
}
