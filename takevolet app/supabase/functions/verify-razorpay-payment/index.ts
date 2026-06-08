import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as crypto from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "WBUFrThMW1f9iaVx2B4I2klL";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { order_id, payment_id, signature, room_id, flatmate_id, user_id } = body;

    const expected = crypto
      .createHmac("sha256", KEY_SECRET!)
      .update(`${order_id}|${payment_id}`)
      .digest("hex");

    if (expected !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RAZORPAY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "WBUFrThMW1f9iaVx2B4I2klL";
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Professionally log unlocks in the correct tables just like the Next.js website
    if (room_id) {
      await supabaseAdmin.from("contact_unlocks").upsert({
        room_id,
        user_id,
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        created_at: new Date().toISOString(),
      }, { onConflict: "room_id,user_id", ignoreDuplicates: true });
    } else if (flatmate_id) {
      await supabaseAdmin.from("flatmate_contact_unlocks").upsert({
        flatmate_id,
        user_id,
        razorpay_order_id: order_id,
        razorpay_payment_id: payment_id,
        created_at: new Date().toISOString(),
      }, { onConflict: "flatmate_id,user_id", ignoreDuplicates: true });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
