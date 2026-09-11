"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Zap,
  Shield,
  Phone,
  MessageCircle,
  ArrowRight,
  IndianRupee,
  Infinity,
  Loader2,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const plans = [
  {
    id: "single",
    name: "Single Contact",
    price: 50,
    contacts: 1,
    perContact: "₹50",
    badge: "",
    highlight: false,
    features: [
      "1 Contact Unlocked Instantly",
      "Direct mobile number",
      "Direct WhatsApp access",
      "Verified owner / poster details",
      "No expiry on contacts",
      "Valid for any room, flat, or PG",
    ],
    cta: "Get 1 Contact",
    desc: "Ideal for a single property or PG inquiry",
  },
  {
    id: "quick",
    name: "Quick Connect",
    price: 100,
    contacts: 5,
    perContact: "₹20",
    badge: "Popular",
    highlight: false,
    features: [
      "5 Contacts Unlocked",
      "Direct mobile numbers",
      "Direct WhatsApp access",
      "Verified poster identity & area",
      "No expiry on contacts",
      "Use across any rooms, PGs or flatmates",
    ],
    cta: "Get 5 Contacts",
    desc: "Great for active house and PG hunting",
  },
  {
    id: "smart",
    name: "Smart Connect",
    price: 200,
    contacts: 15,
    perContact: "₹13",
    badge: "Best Value",
    highlight: true,
    features: [
      "15 Contacts Unlocked",
      "Direct mobile numbers",
      "Direct WhatsApp access",
      "Verified poster identity & area",
      "No expiry on contacts",
      "Use across any rooms, flats, PGs & stays",
      "Priority customer assistance",
    ],
    cta: "Get 15 Contacts",
    desc: "Our most popular choice for home seekers",
  },
  {
    id: "mega",
    name: "Mega Connect",
    price: 500,
    contacts: 50,
    perContact: "₹10",
    badge: "Maximum Savings",
    highlight: false,
    features: [
      "50 Contacts Unlocked",
      "Direct mobile numbers",
      "Direct WhatsApp access",
      "Verified poster identity & area",
      "No expiry on contacts",
      "Use across all categories in India",
      "VIP customer support",
    ],
    cta: "Get 50 Contacts",
    desc: "For serious home seekers considering all options",
  },
];

const methods = [
  "UPI (GPay, PhonePe, Paytm, BHIM)",
  "Credit / Debit Card (Visa, Mastercard, RuPay)",
  "Net Banking (50+ banks)",
  "Wallets (Amazon Pay, Paytm Wallet)",
];

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          const { data: profile } = await supabase
            .from("profiles")
            .select("contact_balance")
            .eq("id", currentUser.id)
            .maybeSingle();
          if (profile) {
            setBalance(profile.contact_balance ?? 0);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    }
    loadUserData();
  }, []);

  const handlePurchase = async (plan: typeof plans[0]) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      router.push("/auth?redirect=/pricing");
      return;
    }

    try {
      setLoadingPlan(plan.id);

      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price * 100,
          userId: currentUser.id,
          type: "plan_purchase",
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to initiate payment. Please try again.");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Could not load payment checkout. Please check your internet connection.");
      }

      const rzpOptions = {
        key: orderData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_live_SqU0ZW4NCgp5jo",
        amount: orderData.amount,
        currency: "INR",
        name: "Takevolet",
        description: `${plan.name} — ${plan.contacts} Contacts Pack`,
        image: "/icon",
        order_id: orderData.orderId,
        prefill: {
          name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "",
          email: currentUser.email || "",
          contact: currentUser.phone || "",
        },
        theme: {
          color: "#0F172A",
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                userId: currentUser.id,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed. Please contact support.");
            }

            const newBal = (balance ?? 0) + plan.contacts;
            setBalance(newBal);
            setSuccessMsg(`Payment Successful! Added ${plan.contacts} contacts to your balance. Current Balance: ${newBal} contacts.`);
          } catch (vErr: any) {
            setErrorMsg(vErr.message || "Payment verification error.");
          } finally {
            setLoadingPlan(null);
          }
        },
      };

      const rzp = new (window as any).Razorpay(rzpOptions);
      rzp.on("payment.failed", (response: any) => {
        setLoadingPlan(null);
        setErrorMsg(response?.error?.description || "Payment was not completed.");
      });
      rzp.open();
    } catch (err: any) {
      setLoadingPlan(null);
      setErrorMsg(err.message || "Something went wrong while starting checkout.");
    }
  };
  return (
    <div className="pt-32 pb-24 min-h-screen">

      {/* Top Notification Alerts */}
      <div className="container mx-auto px-6 max-w-4xl">
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                <span className="text-sm font-medium">{successMsg}</span>
              </div>
              <Link href="/rooms" className="text-xs bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition">
                Browse Rooms
              </Link>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3"
            >
              <span className="text-sm">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
          <p className="text-xl text-muted-foreground font-light leading-relaxed mb-6">
            Browse all rooms, flats, PGs, properties, and stays free. Pay only when you want to call or WhatsApp a poster directly. No broker. No middleman. Secured by Razorpay.
          </p>

          {/* User Balance Chip */}
          {user && (
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-secondary/60 border border-border">
              <UserCheck size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">
                Logged in as <strong className="text-foreground">{user.email?.split("@")[0]}</strong>
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                {balance !== null ? `${balance} Unlocks Available` : "Checking balance..."}
              </span>
            </div>
          )}
        </motion.div>
      </section>

      {/* Pricing Table */}
      <section className="container mx-auto px-6 md:px-12 mb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className={`border flex flex-col relative rounded-2xl ${plan.highlight
                ? "border-primary bg-primary/5 shadow-[0_0_40px_rgba(212,175,55,0.12)] scale-[1.02]"
                : "border-border bg-card/40"}`}>
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[9px] uppercase tracking-widest font-bold rounded-full whitespace-nowrap ${
                  plan.id === "smart" ? "bg-orange-500 text-white" : "bg-primary text-primary-foreground"
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
                <button
                  onClick={() => handlePurchase(plan)}
                  disabled={loadingPlan === plan.id}
                  className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20"
                      : "border border-border hover:border-primary hover:text-primary bg-secondary/50"
                  }`}>
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Opening Checkout...
                    </>
                  ) : (
                    <>
                      {plan.id === "smart" ? <Infinity size={12} /> : null}
                      {plan.cta}
                    </>
                  )}
                </button>
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
              <p className="text-xs text-background/60">Traditional brokers charge ₹10,000–₹20,000 per room. On Takevolet you pay ₹50 to ₹500 total.</p>
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
            { q: "Do unused contacts expire?", a: "Contact packs never expire and are valid as long as your account is active." },
            { q: "What if the poster doesn't respond?", a: "Contact us within 48 hours with proof — we'll credit a replacement unlock." },
            { q: "Is the Unlimited plan really unlimited?", a: "There is no unlimited plan, you get up to 50 contacts per pack." },
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
          <h2 className="text-3xl font-light mb-4">Start for just <span className="font-bold text-primary">₹50</span></h2>
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

