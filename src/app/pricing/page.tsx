"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2, Zap, Shield, Phone, MessageCircle, ArrowRight, IndianRupee, Infinity } from "lucide-react";

const plans = [
  {
    id: "single",
    name: "Single Contact",
    price: 10,
    contacts: 1,
    perContact: "₹10",
    badge: "",
    highlight: false,
    features: [
      "1 poster contact unlocked",
      "Direct mobile number",
      "WhatsApp number",
      "Name & profession",
      "No expiry on single contact",
    ],
    cta: "Buy 1 Contact",
    desc: "Perfect for testing or just one room inquiry",
  },
  {
    id: "starter",
    name: "Starter Pack",
    price: 139,
    contacts: 50,
    perContact: "₹2.78",
    badge: "",
    highlight: false,
    features: [
      "50 contact unlocks",
      "Direct mobile numbers",
      "WhatsApp numbers",
      "Name, profession & area",
      "Use across any listings",
    ],
    cta: "Get 50 Contacts",
    desc: "Great for active room hunters in a new city",
  },
  {
    id: "growth",
    name: "Growth Pack",
    price: 280,
    contacts: 100,
    perContact: "₹2.80",
    badge: "Best Value",
    highlight: true,
    features: [
      "100 contact unlocks",
      "Direct mobile numbers",
      "WhatsApp numbers",
      "Name, profession & area",
      "Use across any listings",
    ],
    cta: "Get 100 Contacts",
    desc: "Most popular for IT professionals searching in Hyderabad",
  },
  {
    id: "pro",
    name: "Pro Pack",
    price: 400,
    contacts: 500,
    perContact: "₹0.80",
    badge: "Popular",
    highlight: false,
    features: [
      "500 contact unlocks",
      "Direct mobile numbers",
      "WhatsApp numbers",
      "Name, profession & area",
      "Use across any listings",
      "Priority support",
    ],
    cta: "Get 500 Contacts",
    desc: "For relocation teams & HR professionals",
  },
  {
    id: "unlimited",
    name: "Unlimited",
    price: 500,
    contacts: null,
    perContact: "₹0",
    badge: "🔥 Best Deal",
    highlight: false,
    features: [
      "Unlimited contact unlocks",
      "All direct mobile numbers",
      "All WhatsApp numbers",
      "Name, profession & area",
      "Every listing on Takevolet",
      "Priority support",
    ],
    cta: "Go Unlimited",
    desc: "Maximum access — unlock every room poster",
  },
];

const methods = ["UPI (GPay, PhonePe, Paytm, BHIM)", "Credit / Debit Card (Visa, Mastercard, RuPay)", "Net Banking (50+ banks)", "Wallets (Amazon Pay etc.)"];

export default function PricingPage() {
  return (
    <div className="pt-36 pb-20 min-h-screen">

      {/* Hero */}
      <section className="container mx-auto px-6 md:px-12 mb-16 text-center max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-6">
            <IndianRupee size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Transparent Pricing · No Hidden Charges</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light mb-6 leading-tight">
            As low as<br />
            <span className="font-bold gold-gradient">₹10 per contact.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Browse all rooms free. Pay only when you want to call or WhatsApp a poster directly. No broker. No middleman. Secured by Razorpay.
          </p>
        </motion.div>
      </section>

      {/* Pricing Table */}
      <section className="container mx-auto px-6 md:px-12 mb-24">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`border flex flex-col relative ${plan.highlight
                ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(212,175,55,0.12)]"
                : "border-border"}`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[9px] uppercase tracking-widest font-bold whitespace-nowrap ${
                  plan.id === "unlimited" ? "bg-orange-500 text-white" : "bg-primary text-primary-foreground"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="p-5 border-b border-border">
                <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-muted-foreground mb-2">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-black leading-none ${plan.highlight ? "text-primary" : ""}`}>₹{plan.price}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">
                  {plan.contacts ? `${plan.contacts} contacts` : "Unlimited contacts"}
                </p>
                <p className="text-[10px] text-primary font-bold">{plan.perContact}/contact</p>
              </div>

              <div className="p-5 flex-1 space-y-2">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2 text-xs">
                    <CheckCircle2 size={12} className="text-green-500 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="p-5 pt-0">
                <p className="text-[10px] text-muted-foreground mb-3 italic">{plan.desc}</p>
                <Link href="/rooms"
                  className={`w-full flex items-center justify-center gap-1.5 py-3 text-xs uppercase tracking-wider font-bold transition-all ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border hover:border-primary hover:text-primary"
                  }`}>
                  {plan.id === "unlimited" ? <Infinity size={12} /> : null}
                  {plan.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison callout */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="max-w-6xl mx-auto mt-6 bg-foreground text-background p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center shrink-0">
              <Zap size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-bold text-sm">Compare to broker fees</p>
              <p className="text-xs text-background/60">Traditional brokers charge ₹10,000–₹20,000 per room. On Takevolet you pay ₹10 to ₹500 total.</p>
            </div>
          </div>
          <Link href="/rooms" className="shrink-0 bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center gap-2">
            Browse Free <ArrowRight size={12} />
          </Link>
        </motion.div>
      </section>

      {/* What you get */}
      <section className="container mx-auto px-6 md:px-12 mb-24 max-w-4xl">
        <h2 className="text-3xl font-light text-center mb-10">What each unlock <span className="font-bold">includes</span></h2>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Phone, title: "Direct Mobile Number", desc: "Call the poster directly. No waiting, no middlemen." },
            { icon: MessageCircle, title: "WhatsApp Number", desc: "Message or share photos of your needs on WhatsApp." },
            { icon: Shield, title: "Verified Poster", desc: "Name, profession, and colony/area — verified on registration." },
            { icon: Zap, title: "Instant Access", desc: "Contact visible immediately after payment confirmation." },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="border border-border p-5 flex gap-4">
              <div className="w-10 h-10 border border-border flex items-center justify-center shrink-0">
                <item.icon size={18} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-bold text-sm mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground font-light">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Payment Methods */}
      <section className="container mx-auto px-6 md:px-12 mb-24 max-w-3xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Accepted Payment Methods</p>
        <h2 className="text-3xl font-light mb-8">Pay the way <span className="font-bold">you prefer</span></h2>
        <div className="grid grid-cols-2 gap-3">
          {methods.map((m, i) => (
            <div key={i} className="border border-border p-4 text-left">
              <CheckCircle2 size={12} className="text-green-500 mb-2" />
              <p className="text-xs font-medium">{m}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-5">🔒 All transactions encrypted &amp; processed by <strong>Razorpay</strong> (PCI DSS Compliant)</p>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-6 md:px-12 mb-24 max-w-3xl">
        <h2 className="text-3xl font-light text-center mb-10">Pricing <span className="font-bold">FAQs</span></h2>
        <div className="space-y-3">
          {[
            { q: "Can I use contacts across different rooms?", a: "Yes. Each contact unlock works for any room on Takevolet. They are not tied to a specific listing." },
            { q: "Do unused contacts expire?", a: "Single contact (₹10) never expires. Packs (50/100/500/Unlimited) are valid as long as your account is active." },
            { q: "What if the poster doesn't respond?", a: "Contact us within 48 hours with proof — we'll credit a replacement unlock." },
            { q: "Is the Unlimited plan really unlimited?", a: "Yes. ₹500 gives you access to every poster's contact on Takevolet with no limits." },
            { q: "Can I get a refund?", a: "Yes — if you haven't used any contacts yet and request within 24 hours. See our Refund Policy." },
          ].map((faq, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="border border-border p-5">
              <p className="font-bold text-sm mb-2">{faq.q}</p>
              <p className="text-sm text-muted-foreground font-light">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 md:px-12 max-w-3xl text-center">
        <div className="border border-border p-12">
          <h2 className="text-3xl font-light mb-4">Start for just <span className="font-bold text-primary">₹10</span></h2>
          <p className="text-muted-foreground font-light mb-8">Browse free. Pay only when you want to contact a poster.</p>
          <Link href="/rooms" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all">
            Find a Room <ArrowRight size={14} />
          </Link>
          <p className="text-xs text-muted-foreground mt-5">
            <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> ·{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> ·{" "}
            <Link href="/contact" className="text-primary hover:underline">Support</Link>
          </p>
        </div>
      </section>

    </div>
  );
}
