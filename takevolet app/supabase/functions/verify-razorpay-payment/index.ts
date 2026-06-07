import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from 'https://deno.land/std@0.177.0/node/crypto.ts'

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? 'Jo5Frs25U9zVGTTeFSUXxTaA'

serve(async (req) => {
  const { order_id, payment_id, signature, room_id, seeker_id, poster_id, room_title } = await req.json()

  // 1. Verify Signature
  const generated_signature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(order_id + '|' + payment_id)
    .digest('hex');

  if (generated_signature !== signature) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
  }

  // 2. Insert into Interests Table
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabaseClient
    .from('interests')
    .insert({
      room_id: room_id,
      seeker_id: seeker_id,
      poster_id: poster_id,
      room_title: room_title,
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
      payment_status: 'paid',
      platform_fee: 500,
      paid_at: new Date().toISOString()
    })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
