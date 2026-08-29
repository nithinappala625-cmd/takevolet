import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const FRONTEND_ADMIN_PASSWORD = "Nithin@Takevolet2026";
const LEADS_FILE_PATH = path.join(process.cwd(), "data", "leads.json");

// Ensure data directory and leads.json exist
function ensureLeadsFile(): any[] {
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(LEADS_FILE_PATH)) {
      fs.writeFileSync(LEADS_FILE_PATH, JSON.stringify([]));
      return [];
    }
    const content = fs.readFileSync(LEADS_FILE_PATH, "utf-8");
    return JSON.parse(content || "[]");
  } catch (e) {
    return [];
  }
}

function writeLeadsFile(leads: any[]) {
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LEADS_FILE_PATH, JSON.stringify(leads, null, 2));
  } catch (e) {
    console.error("Error saving local leads file:", e);
  }
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gfhmdpzmhakznuqhstrn.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function verifyAdmin(request: Request): boolean {
  const pwd = request.headers.get("x-admin-password") || request.headers.get("authorization")?.replace("Bearer ", "");
  return pwd === FRONTEND_ADMIN_PASSWORD || pwd === "Nithin@RoomRelay2026";
}

// ─── GET /api/admin/leads ──────────────────────────────────────────────────────
export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const localLeads = ensureLeadsFile();

  try {
    const { data: dbLeads, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !dbLeads || dbLeads.length === 0) {
      return NextResponse.json({ success: true, leads: localLeads });
    }

    // Merge database leads and local leads without duplicates
    const combined = [...dbLeads];
    const dbUrls = new Set(dbLeads.map((l: any) => `${l.name}_${l.comment_text}`));
    
    for (const loc of localLeads) {
      const key = `${loc.name}_${loc.comment_text}`;
      if (!dbUrls.has(key)) {
        combined.push(loc);
      }
    }

    return NextResponse.json({ success: true, leads: combined });
  } catch (err: any) {
    return NextResponse.json({ success: true, leads: localLeads });
  }
}

// ─── POST /api/admin/leads ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      profile_url,
      source_url,
      platform = "Instagram",
      location,
      budget,
      category = "Real Estate",
      notes,
      comment_text,
      phone,
    } = body;

    if (!name && !profile_url) {
      return NextResponse.json({ error: "Lead name or profile URL is required" }, { status: 400 });
    }

    const newLead = {
      id: "lead_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: name || "Unknown Lead",
      profile_url: profile_url || "",
      source_url: source_url || "",
      platform: platform || "Instagram",
      location: location || "All Telangana",
      budget: budget || "",
      category: category || "Real Estate",
      notes: notes || "",
      comment_text: comment_text || "",
      phone: phone || "",
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save locally first so it is never lost
    const localList = ensureLeadsFile();
    // Check if this lead already exists in local list
    const existingIdx = localList.findIndex((l: any) => l.name === newLead.name && l.comment_text === newLead.comment_text);
    if (existingIdx === -1) {
      localList.unshift(newLead);
    } else {
      localList[existingIdx] = { ...localList[existingIdx], ...newLead };
    }
    writeLeadsFile(localList);

    // Try saving to Supabase
    try {
      await supabaseAdmin.from("leads").insert([{
        name: newLead.name,
        profile_url: newLead.profile_url,
        source_url: newLead.source_url,
        platform: newLead.platform,
        location: newLead.location,
        budget: newLead.budget,
        category: newLead.category,
        notes: newLead.notes,
        comment_text: newLead.comment_text,
        phone: newLead.phone,
        status: newLead.status,
      }]);
    } catch (dbErr) {
      console.warn("Supabase insert lead skipped:", dbErr);
    }

    return NextResponse.json({ success: true, lead: newLead });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── PATCH /api/admin/leads ────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    // Update in local file
    const localList = ensureLeadsFile();
    const item = localList.find((l: any) => l.id === id || String(l.id) === String(id));
    if (item) {
      if (status) item.status = status;
      if (notes !== undefined) item.notes = notes;
      item.updated_at = new Date().toISOString();
      writeLeadsFile(localList);
    }

    // Update in Supabase
    try {
      const updates: any = { updated_at: new Date().toISOString() };
      if (status) updates.status = status;
      if (notes !== undefined) updates.notes = notes;

      await supabaseAdmin.from("leads").update(updates).eq("id", id);
    } catch (e) {}

    return NextResponse.json({ success: true, lead: item || { id, status } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
