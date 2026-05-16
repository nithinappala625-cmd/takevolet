"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home, ShoppingBag, Handshake, ArrowRight, CheckCircle2, IndianRupee, Zap, Users, Star, ChevronRight, Lock } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { setPostLoginRedirect } from "@/lib/userStore";

const partnerBenefits = [
  "Priority listing placement across all areas",
  "Dedicated account manager",
  "Bulk posting dashboard",
  "Analytics & enquiry tracking",
  "Featured badge on all listings",
  "₹0 platform fee for the first 3 months",
];

export default function ListPage() {
  const router = useRouter();
  const { user, loading } = useUser();

  const handleProtectedLink = (href: string) => {
    if (!user) {
      setPostLoginRedirect(href);
      router.push(`/auth`);
    } else {
      router.push(href);
    }
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Earn with Takevolet</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
            List Your Space.<br />
            <span className="font-bold gold-gradient">Earn Real Money.</span>
          </h1>
          <p className="text-lg text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
            Whether you&apos;re a bachelor leaving your room, selling items, or a property owner with multiple listings — Takevolet has the right plan for you.
          </p>
          {!user && !loading && (
            <div className="mt-6 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2.5 text-sm font-medium">
              <Lock size={14} /> You&apos;ll need to create a free profile before posting
            </div>
          )}
          {user && (
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 text-sm font-medium">
              <CheckCircle2 size={14} /> Logged in as <strong>{user.name}</strong> — ready to post!
            </div>
          )}
        </motion.div>

        {/* 3 Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">

          {/* Post a Room */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="border-2 border-primary bg-primary/5 p-8 flex flex-col group hover:bg-primary/10 transition-all">
            <div className="w-14 h-14 border-2 border-primary flex items-center justify-center mb-6">
              <Home size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Most Popular</p>
              <h2 className="text-2xl font-bold mb-3">Post a Room</h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-6 text-sm">
                Are you a bachelor leaving your flat? Post your room in 2 minutes. Reach thousands of bachelors searching in your area. Earn ₹500–₹1,000 commission.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Free to post", "Earn ₹500–₹1,000 on handover", "Photos + videos supported", "Area/colony-based listing"].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => handleProtectedLink("/post/room")}
              className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              {!user ? <><Lock size={13} /> Register & Post My Room</> : <>Post My Room <ArrowRight size={14} /></>}
            </button>
          </motion.div>

          {/* Sell / Rent Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="border border-border p-8 flex flex-col group hover:border-primary/30 transition-all">
            <div className="w-14 h-14 border border-border flex items-center justify-center mb-6 group-hover:border-primary transition-all">
              <ShoppingBag size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">Sell or Rent Items</h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-6 text-sm">
                Got furniture, electronics, or appliances? Don&apos;t sell for scrap. List on Takevolet and sell or rent to verified bachelors in your area.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Sell furniture, electronics, appliances", "Rent items for monthly income", "Buyers are verified bachelors nearby", "No transport hassle"].map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => handleProtectedLink("/post/item")}
              className="w-full border border-border py-4 text-sm uppercase tracking-wider font-bold hover:bg-foreground hover:text-background hover:border-foreground transition-all flex items-center justify-center gap-2">
              {!user ? <><Lock size={13} /> Register & List Items</> : <>List My Items <ArrowRight size={14} /></>}
            </button>
          </motion.div>

          {/* Become a Partner */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="border border-border p-8 flex flex-col bg-secondary/20 group hover:border-primary/30 transition-all">
            <div className="w-14 h-14 border border-border flex items-center justify-center mb-6 group-hover:border-primary transition-all">
              <Handshake size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">For Property Owners</p>
                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 text-[10px] font-bold uppercase">Pro</span>
              </div>
              <h2 className="text-2xl font-bold mb-3">Become a Partner</h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-6 text-sm">
                Own multiple properties or a PG? Partner with Takevolet. Get priority listing, analytics dashboard, bulk posting, and a dedicated account manager.
              </p>
              <ul className="space-y-2.5 mb-8">
                {partnerBenefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" /> {b}
                  </li>
                ))}
              </ul>
            </div>
            <button onClick={() => handleProtectedLink("/post/partner")}
              className="w-full border border-border py-4 text-sm uppercase tracking-wider font-bold hover:bg-foreground hover:text-background hover:border-foreground transition-all flex items-center justify-center gap-2">
              {!user ? <><Lock size={13} /> Register & Apply</> : <>Become a Partner <ArrowRight size={14} /></>}
            </button>
          </motion.div>
        </div>

        {/* Earnings Info */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="bg-foreground text-background p-12 mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-background/50 font-bold mb-4">Earn Big</p>
              <h2 className="text-4xl font-light mb-6">How much can you earn?</h2>
              <p className="text-background/60 font-light leading-relaxed mb-8">
                Every time a bachelor finds a room through your listing on Takevolet, you earn a commission. Post rooms, unlock contacts revenue, sell items — all tracked in your personal dashboard.
              </p>
              <button onClick={() => handleProtectedLink("/dashboard")}
                className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm hover:gap-3 transition-all">
                View My Dashboard <ArrowRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: IndianRupee, label: "Per Takevolet", value: "₹500–₹1,000" },
                { icon: Zap, label: "Contact Pack Revenue", value: "₹1,500" },
                { icon: Users, label: "Avg. Enquiries/Room", value: "12–18" },
                { icon: Star, label: "Avg. Monthly Earning", value: "₹8,000+" },
              ].map((s, i) => (
                <div key={i} className="border border-background/10 p-5 text-center">
                  <s.icon size={20} className="text-primary mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-xl font-bold mb-1">{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-background/50">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-10">Common <span className="font-bold">Questions</span></h2>
          <div className="divide-y divide-border border border-border">
            {[
              { q: "Do I need to register before posting?", a: "Yes. We need your profile (name, email, phone, location, profession) to verify you and connect buyers to your listings." },
              { q: "Is it free to post a room?", a: "Yes, posting a room is completely free. You earn when someone takes over your room." },
              { q: "How do contacts work?", a: "Searchers pay ₹1,500 for a pack of 5 contacts. Once they buy, they see your phone number and WhatsApp." },
              { q: "When do I receive my commission?", a: "Commission is credited within 48 hours of confirmed handover to your dashboard." },
            ].map((faq, i) => (
              <details key={i} className="group p-6 cursor-pointer">
                <summary className="flex justify-between items-center font-semibold text-sm list-none">
                  {faq.q}
                  <ChevronRight size={16} className="text-muted-foreground group-open:rotate-90 transition-transform" />
                </summary>
                <p className="text-sm text-muted-foreground font-light mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
