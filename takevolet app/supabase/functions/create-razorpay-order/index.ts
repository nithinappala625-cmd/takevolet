import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') ?? 'rzp_test_placeholder';
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') ?? 'Jo5Frs25U9zVGTTeFSUXxTaA';

serve(async (req) => {
  const { amount, receipt } = await req.json()

  // Generate basic auth string
  const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount, // Amount in paise (e.g. 50000 = ₹500)
        currency: 'INR',
        receipt: receipt,
      }),
    })

    const data = await response.json()
    // Inject the key ID so the client doesn't need to hardcode it
    data.keyId = RAZORPAY_KEY_ID;

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
