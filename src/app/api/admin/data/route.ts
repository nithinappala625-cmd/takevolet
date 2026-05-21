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
  const [payoutsRes, interestsRes, handoversRes, profilesRes, roomsRes, flatmatesRes] = await Promise.all([
    supabaseAdmin.from("payouts").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("interests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("handovers").select("*").order("confirmed_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("rooms").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("flatmates").select("*").order("created_at", { ascending: false }),
  ]);

  const payouts   = payoutsRes.data   || [];
  const interests = interestsRes.data || [];
  const handovers = handoversRes.data || [];
  const profiles  = profilesRes.data  || [];
  const rooms     = roomsRes.data     || [];
  const flatmates = flatmatesRes.data || [];

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
    payouts: payouts.map((p: any) => ({
      ...p,
      userName: p.user_name,
      upiId: p.upi_id,
      bankAccount: p.bank_account,
      bankIfsc: p.bank_ifsc,
      bankName: p.bank_name,
      requestedAt: p.created_at,
      processedAt: p.processed_at,
    })),
    interests: interests.map((i: any) => ({
      ...i,
      userName: i.seeker_name,
      userId: i.seeker_id,
      roomTitle: i.room_title,
      posterName: i.poster_name,
      handoverConfirmed: i.handover_confirmed,
    })),
    handovers: handovers.map((h: any) => ({
      ...h,
      userName: h.seeker_name,
      posterName: h.poster_name,
      confirmedAt: h.confirmed_at,
    })),
    // Map profiles to include computed fields
    users: await Promise.all(profiles.map(async (p: any) => {
      let docUrl = p.aadhaar_url || null;
      if (docUrl && !docUrl.startsWith("http")) {
        const { data: signed } = await supabaseAdmin.storage.from("kyc-docs").createSignedUrl(docUrl, 3600);
        if (signed?.signedUrl) {
          docUrl = signed.signedUrl;
        }
      }
      return {
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
        aadhaar_url:   docUrl,
        is_verified:   p.is_verified || false,
        created_at:    p.created_at,
      };
    })),
    rooms: rooms.map((r: any) => ({
      id:         r.id,
      title:      r.title,
      location:   r.location,
      colony:     r.colony,
      rent:       r.rent,
      advance:    r.advance,
      user_id:    r.user_id,
      is_available: r.is_available,
      created_at: r.created_at,
      images:     r.images || [],
      videos:     r.videos || [],
      description: r.description || "",
      furnishing:  r.furnishing || "",
      gender_preference: r.gender_preference || "Any Gender",
    })),
    flatmates: flatmates.map((f: any) => ({
      id:           f.id,
      title:        f.title,
      location:     f.location,
      colony:       f.colony,
      rentShare:    f.rent_share,
      advanceShare: f.advance_share,
      user_id:      f.user_id,
      isAvailable:  f.is_available,
      created_at:   f.created_at,
      images:       f.images || [],
      videos:       f.videos || [],
      description:  f.description || "",
      genderPref:   f.gender_pref || "Any",
      professionPref: f.profession_pref || "Any",
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

// ─── DELETE /api/admin/data ───────────────────────────────────────────────────
export async function DELETE(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!type || !id) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 });
  }

  let error = null;
  if (type === "room") {
    const res = await supabaseAdmin.from("rooms").delete().eq("id", id);
    error = res.error;
  } else if (type === "flatmate") {
    const res = await supabaseAdmin.from("flatmates").delete().eq("id", id);
    error = res.error;
  } else if (type === "marketplace" || type === "item") {
    // Marketplace is mock-only, so we just return success
    return NextResponse.json({ success: true });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// ─── PUT /api/admin/data ──────────────────────────────────────────────────────
export async function PUT(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    type,
    id,
    title,
    rent,
    advance,
    rentShare,
    advanceShare,
    location,
    colony,
    description,
    furnishing,
    genderPreference,
    genderPref,
    professionPref,
    images,
    videos,
  } = body;

  if (!type || !id) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 });
  }

  let data = null;
  let error = null;

  if (type === "room") {
    const res = await supabaseAdmin
      .from("rooms")
      .update({
        title,
        rent: Number(rent),
        advance: Number(advance || 0),
        location,
        colony,
        description,
        furnishing,
        gender_preference: genderPreference,
        images,
        videos,
      })
      .eq("id", id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else if (type === "flatmate") {
    const res = await supabaseAdmin
      .from("flatmates")
      .update({
        title,
        rent_share: Number(rentShare || rent),
        advance_share: Number(advanceShare || advance || 0),
        location,
        colony,
        description,
        gender_pref: genderPref || genderPreference,
        profession_pref: professionPref,
        images,
        videos,
      })
      .eq("id", id)
      .select()
      .single();
    data = res.data;
    error = res.error;
  } else if (type === "marketplace" || type === "item") {
    // Marketplace is mock-only, so we just return success
    return NextResponse.json({ success: true, data: body });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
