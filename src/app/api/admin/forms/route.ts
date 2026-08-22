import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const ADMIN_PASSWORD = "Nithin@Takevolet2026";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Fetch the new relational form definition
    const { data: formDef, error: formErr } = await supabase
      .from("form_definitions")
      .select("id")
      .eq("slug", category)
      .eq("status", "published")
      .single();

    if (formErr || !formDef) {
      // Fallback to old behavior if not found
      const { data: oldData } = await supabase
        .from("dynamic_forms")
        .select("*")
        .eq("category", category);
      return NextResponse.json({ success: true, data: oldData || [] });
    }

    // Fetch relational fields
    const { data: fieldsData, error: fieldsErr } = await supabase
      .from("form_fields")
      .select("*, field_options(*)")
      .eq("form_id", formDef.id)
      .order("sort_order", { ascending: true });

    if (fieldsErr) throw fieldsErr;

    // Convert back to old JSON structure for Next.js frontend
    const fields_schema = (fieldsData || []).map(field => {
      const options = field.field_options?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [];
      return {
        key: field.field_key,
        name: field.field_key, // The frontend might use 'name' instead of 'key'
        label: field.label,
        type: field.field_type,
        placeholder: field.placeholder || "",
        required: field.is_required,
        visible: field.is_visible,
        visibility_rules: field.visibility_rules,
        options: options.length > 0 ? options.map((o: any) => o.value) : undefined
      };
    });

    return NextResponse.json({
      success: true,
      data: [{ category, fields_schema }]
    });

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

    // Update old table for backwards compatibility
    await supabase
      .from("dynamic_forms")
      .upsert({ category, fields_schema, updated_at: new Date().toISOString() }, { onConflict: "category" });

    // 1. Get or create form definition
    let { data: formDef } = await supabase
      .from("form_definitions")
      .select("id")
      .eq("slug", category)
      .single();

    if (!formDef) {
      const { data: newDef, error: createErr } = await supabase
        .from("form_definitions")
        .insert({
          name: category.charAt(0).toUpperCase() + category.slice(1),
          slug: category,
          entity_type: 'build_listings', // default guess
          status: 'published'
        })
        .select("id")
        .single();
        
      if (createErr) throw createErr;
      formDef = newDef;
    }

    // 2. Delete existing fields to overwrite (simplest synchronization strategy)
    await supabase.from("form_fields").delete().eq("form_id", formDef.id);

    // 3. Insert new fields
    for (let i = 0; i < fields_schema.length; i++) {
      const field = fields_schema[i];
      const fieldKey = field.key || field.name;
      
      const { data: insertedField, error: fieldErr } = await supabase
        .from("form_fields")
        .insert({
          form_id: formDef.id,
          field_key: fieldKey,
          label: field.label || fieldKey,
          field_type: field.type || "text",
          placeholder: field.placeholder || "",
          is_required: field.required || false,
          is_visible: field.visible !== false, // defaults to true
          sort_order: i,
          visibility_rules: field.visibility_rules || []
        })
        .select("id")
        .single();

      if (fieldErr) throw fieldErr;

      // 4. Insert options if dropdown/radio
      if ((field.type === "dropdown" || field.type === "radio") && field.options && Array.isArray(field.options)) {
        const optionsData = field.options.map((opt: any, optIdx: number) => ({
          field_id: insertedField.id,
          label: typeof opt === 'string' ? opt : (opt.label || opt.value),
          value: typeof opt === 'string' ? opt : (opt.value || opt.label),
          sort_order: optIdx
        }));
        
        if (optionsData.length > 0) {
          await supabase.from("field_options").insert(optionsData);
        }
      }
    }

    return NextResponse.json({ success: true, data: { category, fields_schema } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
