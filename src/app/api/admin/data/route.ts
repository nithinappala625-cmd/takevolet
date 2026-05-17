// ─── Admin Auth & Data API ─────────────────────────────────────────────────────
// GET  /api/admin/data — all platform data (requires admin password header)
// POST /api/admin/data — approve / reject / processing a payout
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FRONTEND_ADMIN_PASSWORD = "Nithin@Takevolet2026";

// Service-role client — bypasses RLS (server-side only, never exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function verifyAdmin(request: Request): boolean {
  return request.headers.get("x-admin-password") === FRONTEND_ADMIN_PASSWORD;
}

// ─── GET /api/admin/data ───────────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all data in parallel
  const [payoutsRes, interestsRes, handoversRes, profilesRes, roomsRes] = await Promise.all([
    supabaseAdmin.from("payouts").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("interests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("handovers").select("*").order("confirmed_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("rooms").select("*").order("created_at", { ascending: false }),
  ]);

  const payouts   = payoutsRes.data   || [];
  const interests = interestsRes.data || [];
  const handovers = handoversRes.data || [];
  const profiles  = profilesRes.data  || [];
  const rooms     = roomsRes.data     || [];

  // Revenue calculation
  const interestRevenue = interests
    .filter((i: any) => i.payment_status === "paid")
    .reduce((s: number, i: any) => s + (i.platform_fee || 500), 0);

  const handoverRevenue = handovers
    .filter((h: any) => h.payment_status === "paid")
    .reduce((s: number, h: any) => s + (h.platform_amount || 500), 0);

  const totalRevenue  = interestRevenue + handoverRevenue;
  const totalPaidOut  = payouts.filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + p.amount, 0);
  const pendingAmount = payouts.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + p.amount, 0);

  return NextResponse.json({
    success: true,
    stats: {
      totalRevenue,
      interestRevenue,
      handoverRevenue,
      totalPaidOut,
      pendingPayouts:       pendingAmount,
      totalInterests:       interests.length,
      totalHandovers:       handovers.length,
      totalPayoutRequests:  payouts.length,
      totalUsers:           profiles.length,
      totalRooms:           rooms.length,
    },
    payouts,
    interests,
    handovers,
    // Map profiles to include computed fields
    users: profiles.map((p: any) => ({
      id:            p.id,
      name:          p.full_name || "—",
      email:         p.email || "—",
      phone:         p.phone || "—",
      whatsapp:      p.whatsapp || "—",
      location:      p.location || "—",
      colony:        p.colony || "—",
      house_no:      p.house_no || "—",
      profession:    p.profession || "—",
      gender:        p.gender || "—",
      members_count: p.members_count || 1,
      aadhaar_url:   p.aadhaar_url || null,
      is_verified:   p.is_verified || false,
      created_at:    p.created_at,
    })),
    rooms: rooms.map((r: any) => ({
      id:         r.id,
      title:      r.title,
      location:   r.location,
      colony:     r.colony,
      rent:       r.rent,
      user_id:    r.user_id,
      is_available: r.is_available,
      created_at: r.created_at,
      images:     r.images || [],
    })),
  });
}

// ─── POST /api/admin/data — update payout status ──────────────────────────────
export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, payoutId, notes } = body;

  if (!action || !payoutId) {
    return NextResponse.json({ error: "action and payoutId are required" }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    approve:    "completed",
    reject:     "rejected",
    processing: "processing",
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return NextResponse.json({ error: "Invalid action. Use: approve, reject, processing" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("payouts")
    .update({
      status:       newStatus,
      notes:        notes || null,
      processed_at: newStatus !== "pending" ? new Date().toISOString() : null,
    })
    .eq("id", payoutId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, payout: data });
}
