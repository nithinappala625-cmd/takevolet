import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = "Nithin@Takevolet2026";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase.from("dynamic_forms").select("*");
    
    if (category) {
      query = query.eq("category", category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const pwd = request.headers.get("x-admin-password");
    if (pwd !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, fields_schema } = body;

    if (!category || !fields_schema) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("dynamic_forms")
      .upsert({ category, fields_schema, updated_at: new Date().toISOString() }, { onConflict: "category" })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
