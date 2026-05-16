import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Next.js 15: params is a Promise ──────────────────────────────────────────
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Try Supabase first
    const { data, error } = await supabase
      .from("rooms")
      .select("*, profiles(full_name, phone, whatsapp, avatar_url, profession)")
      .eq("id", id)
      .single();

    if (!error && data) {
      return NextResponse.json({ room: data });
    }

    // Fallback to MOCK_ROOMS
    const { MOCK_ROOMS } = await import("@/data/mock");
    const mock = MOCK_ROOMS.find(r => r.id === id);
    if (mock) return NextResponse.json({ room: mock });

    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { error } = await supabase.from("rooms").update(body).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, message: `Room ${id} deleted` });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
