import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_Sq0dFrEKuO85Mh";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") || "WBUFrThMW1f9iaVx2B4I2klL";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { roomId, flatmateId, planId, amount } = body;
    
    // Professional Pricing Tiers
    const VALID_PLANS: Record<string, { paise: number }> = {
      single: { paise: 5000 },    // ₹50 (1 Contact)
      starter: { paise: 10000 },  // ₹100 (5 Contacts)
      growth: { paise: 20000 },   // ₹200 (15 Contacts)
      unlimited: { paise: 50000 },// ₹500 (50 Contacts)
    };
    
    const plan = VALID_PLANS[planId] ?? { paise: 5000 };
    const finalAmount = amount ? amount : plan.paise;
    
    const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const receipt = `rcpt_${(roomId || flatmateId || "order").slice(0, 15)}_${Date.now().toString().slice(-8)}`;

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount: finalAmount, currency: "INR", receipt }),
    });

    const data = await response.json();
    data.keyId = KEY_ID; // Expose public key to the client
    
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
