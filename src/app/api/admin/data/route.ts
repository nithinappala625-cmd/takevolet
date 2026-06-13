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
  const [payoutsRes, interestsRes, handoversRes, profilesRes, roomsRes, flatmatesRes, contactUnlocksRes, flatmateUnlocksRes] = await Promise.all([
    supabaseAdmin.from("payouts").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("interests").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("handovers").select("*").order("confirmed_at", { ascending: false }),
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("rooms").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("flatmates").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("contact_unlocks").select("*, rooms(title, user_id, profiles!rooms_user_id_fkey(full_name, phone, whatsapp)), profiles!contact_unlocks_user_id_fkey(full_name)").order("created_at", { ascending: false }),
    supabaseAdmin.from("flatmate_contact_unlocks").select("*, flatmates(title, user_id, profiles!flatmates_user_id_fkey(full_name, phone, whatsapp)), profiles!flatmate_contact_unlocks_user_id_fkey(full_name)").order("created_at", { ascending: false }),
  ]);

  const payouts   = payoutsRes.data   || [];
  const interests = interestsRes.data || [];
  const handovers = handoversRes.data || [];
  const profiles  = profilesRes.data  || [];
  const rooms     = roomsRes.data     || [];
  const flatmates = flatmatesRes.data || [];
  const contactUnlocks = contactUnlocksRes.data || [];
  const flatmateUnlocks = flatmateUnlocksRes.data || [];

  // Revenue calculation
  const interestRevenue = contactUnlocks.length * 15 + flatmateUnlocks.length * 15 + interests
    .filter((i: any) => i.payment_status === "paid")
    .reduce((s: number, i: any) => s + (i.platform_fee || 500), 0);

  const handoverRevenue = handovers
    .filter((h: any) => h.payment_status === "paid")
    .reduce((s: number, h: any) => s + (h.platform_amount || 500), 0);

  const totalRevenue  = interestRevenue + handoverRevenue;
  const totalPaidOut  = payouts.filter((p: any) => p.status === "completed").reduce((s: number, p: any) => s + p.amount, 0);
  const pendingAmount = payouts.filter((p: any) => p.status === "pending").reduce((s: number, p: any) => s + p.amount, 0);

  // Fetch Razorpay details for unlocks to show plan and amount
  let razorpayInstance: any = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const Razorpay = require("razorpay");
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  const mapUnlocksWithRazorpay = async (unlocks: any[], type: string, relationName: string) => {
    return Promise.all(unlocks.map(async (u: any) => {
      let planId = "unknown";
      let amount = 15; // default fallback

      if (razorpayInstance && u.razorpay_order_id) {
        try {
          const order = await razorpayInstance.orders.fetch(u.razorpay_order_id);
          if (order && order.notes) {
            planId = order.notes.planId || "growth";
            if (order.amount) amount = order.amount / 100;
          }
        } catch (e) {
          console.error("Razorpay fetch failed for order", u.razorpay_order_id);
        }
      }

      return {
        id: u.id,
        type: type,
        listing_id: type === "room" ? u.room_id : u.flatmate_id,
        title: u[relationName]?.title || "Unknown Listing",
        seeker_name: u.profiles?.full_name || "Anonymous",
        seeker_phone: u.profiles?.phone || "No phone",
        seeker_email: u.profiles?.email || "No email",
        poster_name: u[relationName]?.profiles?.full_name || "Unknown Poster",
        poster_phone: u[relationName]?.profiles?.phone || "",
        poster_whatsapp: u[relationName]?.profiles?.whatsapp || "",
        planId,
        amount,
        created_at: u.created_at,
      };
    }));
  };

  const processedContactUnlocks = await mapUnlocksWithRazorpay(contactUnlocks, "room", "rooms");
  const processedFlatmateUnlocks = await mapUnlocksWithRazorpay(flatmateUnlocks, "flatmate", "flatmates");

  const combinedUnlocks = [...processedContactUnlocks, ...processedFlatmateUnlocks]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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
    contactUnlocks: combinedUnlocks,
    // Map profiles to include computed fields
    users: await Promise.all(profiles.map(async (p: any) => {
      let docUrl = p.aadhaar_url || null;
      let docBackUrl = p.aadhaar_back_url || null;
      
      if (docUrl && !docUrl.startsWith("http")) {
        const { data: signed } = await supabaseAdmin.storage.from("kyc-docs").createSignedUrl(docUrl, 3600);
        if (signed?.signedUrl) {
          docUrl = signed.signedUrl;
        }
      }
      
      if (docBackUrl && !docBackUrl.startsWith("http")) {
        const { data: signedBack } = await supabaseAdmin.storage.from("kyc-docs").createSignedUrl(docBackUrl, 3600);
        if (signedBack?.signedUrl) {
          docBackUrl = signedBack.signedUrl;
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
        dob:           p.dob || "—",
        members_count: p.members_count || 1,
        contact_balance: p.contact_balance || 0,
        aadhaar_url:   docUrl,
        aadhaar_back_url: docBackUrl,
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
  const { action, payoutId, notes, userId, userData } = body;

  if (!action) {
    return NextResponse.json({ error: "action is required" }, { status: 400 });
  }

  if (action === "update_user") {
    if (!userId || !userData) return NextResponse.json({ error: "userId and userData required" }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(userData)
      .eq("id", userId)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, user: data });
  }

  if (!payoutId) {
    return NextResponse.json({ error: "payoutId is required for this action" }, { status: 400 });
  }

  const statusMap: Record<string, string> = {
    approve:    "completed",
    reject:     "rejected",
    processing: "processing",
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return NextResponse.json({ error: "Invalid action. Use: approve, reject, processing, update_user" }, { status: 400 });
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
    userData, // added for user type
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
  } else if (type === "user") {
    const res = await supabaseAdmin
      .from("profiles")
      .update(userData)
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
