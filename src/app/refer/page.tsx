"use client";

import { motion } from "framer-motion";
import {
  Copy, CheckCircle2, MessageCircle, Wallet, Star, Home,
  Building2, Zap, TrendingUp, Shield, Crown, ArrowRight,
  IndianRupee, Users, Phone, Trophy, Gift, Lock
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

export default function JoinAndEarnPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);

  const referralCode = user ? `TVL-${user.id.substring(0, 6).toUpperCase()}` : "TVL-XXXXXX";
  const referralLink = `https://takevolet.online/auth?ref=${referralCode}`;

  const handleCopy = () => {
    if (!user) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!user) return;
    const text = `🏠 I'm using Takevolet — Hyderabad's #1 zero brokerage platform for bachelors!\n\nPost your room, find flatmates, and EARN money. Use my link:\n\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent -z-10" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/8 blur-[120px] -z-10" />
        <div className="container mx-auto px-6 md:px-12 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 border border-primary/40 bg-primary/5 px-5 py-2 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] font-bold text-primary">Earn Real Money · Zero Investment</span>
          </motion.div>
          <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Join & <span className="text-primary">Earn</span>
          </motion.h1>
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Post rooms. Help bachelors. Build a network. Earn up to <strong className="text-foreground">₹50,000+ per month</strong> — completely from your phone.
          </motion.p>
          {/* Big earning stats */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Per Contact Unlock", value: "₹2–₹5", color: "text-primary", bg: "bg-primary/5 border-primary/20" },
              { label: "Per Room Handover", value: "₹500–₹1,000", color: "text-green-500", bg: "bg-green-500/5 border-green-500/20" },
              { label: "Premium Partner Bonus", value: "₹500", color: "text-yellow-400", bg: "bg-yellow-500/5 border-yellow-500/20" },
              { label: "House Owner Per Listing", value: "₹100", color: "text-orange-400", bg: "bg-orange-500/5 border-orange-500/20" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" animate="show" custom={i + 4}
                className={`border p-5 text-center rounded-sm ${stat.bg}`}>
                <p className={`text-3xl md:text-4xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-2 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PATH 1: CONTACT UNLOCKS — IMAGE LEFT ── */}
      <section className="py-0 border-t border-border">
        <div className="grid lg:grid-cols-2">
          {/* Image */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative bg-secondary/5 flex items-center justify-center p-8 lg:p-0">
            <img
              src="/earn-contact-unlock.png"
              alt="Earn from contact unlocks"
              className="w-full h-auto max-h-[600px] object-contain drop-shadow-2xl rounded-sm"
            />
            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur border border-primary/20 px-5 py-3 shadow-xl">
              <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-1">💰 Per Contact Unlock</p>
              <p className="text-2xl font-black text-primary">₹2 – ₹5</p>
              <p className="text-[10px] text-muted-foreground">Instantly credited to wallet</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="p-10 lg:p-16 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 mb-6 w-fit">
              <Phone size={12} className="text-primary" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Earning Path 1</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">
              Earn From Every <br /><span className="text-primary">Contact Unlock</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
              Post your room listing on Takevolet. Every time a bachelor pays to see your contact number — you earn a commission. More photos = more views = more unlocks = more money.
            </p>
            <div className="space-y-3 mb-8">
              {[
                { plan: "1 Contact", earn: "₹3", paid: "₹15" },
                { plan: "10 Contacts", earn: "₹10", paid: "₹55" },
                { plan: "50 Contacts", earn: "₹30 ⭐", paid: "₹105", hot: true },
                { plan: "Unlimited Contacts", earn: "₹60+", paid: "₹200" },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between border px-4 py-3 ${row.hot ? "border-primary bg-primary/5" : "border-border"}`}>
                  <div>
                    <p className="text-sm font-bold">{row.plan}</p>
                    <p className="text-xs text-muted-foreground">Seeker pays: {row.paid}</p>
                  </div>
                  <p className={`text-lg font-black ${row.hot ? "text-primary" : "text-foreground"}`}>{row.earn}</p>
                </div>
              ))}
            </div>
            <Link href="/post/room"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider hover:opacity-90 transition-all w-fit">
              Post a Room & Start Earning <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── PATH 2: ROOM HANDOVER — IMAGE RIGHT ── */}
      <section className="border-t border-border">
        <div className="grid lg:grid-cols-2">
          {/* Content */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="p-10 lg:p-16 flex flex-col justify-center bg-secondary/10">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-1.5 mb-6 w-fit">
              <IndianRupee size={12} className="text-green-500" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-green-500">Earning Path 2 · Biggest Reward</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">
              Earn <span className="text-green-500">₹500–₹1,000</span> <br />Per Room Handover
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
              When a bachelor finds your room on Takevolet and officially takes it over — you get a handover commission on top of all the contact unlock earnings. This is your biggest earning moment.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { n: "1 Room", earn: "₹650+", sub: "Unlock + handover" },
                { n: "5 Rooms", earn: "₹3,250+", sub: "Per month potential" },
                { n: "10 Rooms", earn: "₹6,500+", sub: "Top earner level" },
              ].map((s, i) => (
                <div key={i} className={`border p-4 text-center ${i === 1 ? "border-green-500/40 bg-green-500/5" : "border-border"}`}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{s.n}</p>
                  <p className="text-xl font-black text-green-500">{s.earn}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {[
                "Post room → Bachelor finds it → They call you",
                "They like the room → Handover confirmed on Takevolet",
                "₹500–₹1,000 instantly credited to your wallet",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center font-black text-xs shrink-0">{i + 1}</div>
                  <p className="text-sm text-foreground/80">{step}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Image */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="relative bg-secondary/5 flex items-center justify-center p-8 lg:p-0">
            <img
              src="/earn-room-handover.png"
              alt="Earn per room handover"
              className="w-full h-auto max-h-[600px] object-contain drop-shadow-2xl rounded-sm"
            />
            <div className="absolute bottom-6 right-6 bg-background/95 backdrop-blur border border-green-500/30 px-5 py-3 shadow-xl">
              <p className="text-[9px] uppercase tracking-widest text-green-500 font-bold mb-1">🏠 Per Handover</p>
              <p className="text-2xl font-black text-green-500">₹500–₹1,000</p>
              <p className="text-[10px] text-muted-foreground">Paid after room takeover</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PATH 3: PREMIUM PARTNER — IMAGE LEFT ── */}
      <section className="border-t border-border">
        <div className="grid lg:grid-cols-2">
          {/* Image */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="relative bg-secondary/5 flex items-center justify-center p-8 lg:p-0 order-2 lg:order-1">
            <img
              src="/earn-premium-partner.png"
              alt="Premium Partner Program"
              className="w-full h-auto max-h-[600px] object-contain drop-shadow-2xl rounded-sm"
            />
            <div className="absolute bottom-6 left-6 bg-background/95 backdrop-blur border border-yellow-400/30 px-5 py-3 shadow-xl">
              <p className="text-[9px] uppercase tracking-widest text-yellow-400 font-bold mb-1">👑 Milestone Bonus</p>
              <p className="text-2xl font-black text-yellow-400">₹500 Bonus</p>
              <p className="text-[10px] text-muted-foreground">At 50 rooms posted</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="p-10 lg:p-16 flex flex-col justify-center order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-1.5 mb-6 w-fit">
              <Crown size={12} className="text-yellow-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">Earning Path 3 · Premium Partner</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">
              Post 50 Rooms. <br />Become a <span className="text-primary">Premium Partner</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
              Become Takevolet's most trusted listing partner in your area. Hit 50 room postings, collect your ₹500 milestone bonus, and unlock the Premium Partner badge with exclusive perks.
            </p>
            {/* Milestone tracker */}
            <div className="space-y-4 mb-8">
              {[
                { milestone: "5 Rooms Posted", reward: "₹50 Bonus", pct: 10 },
                { milestone: "15 Rooms Posted", reward: "₹100 Bonus", pct: 30 },
                { milestone: "30 Rooms Posted", reward: "₹200 + Silver Badge", pct: 60 },
                { milestone: "50 Rooms Posted", reward: "₹500 + Premium Partner 🏆", pct: 100, hot: true },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className={`text-sm font-bold ${m.hot ? "text-primary" : ""}`}>{m.milestone}</span>
                    <span className={`text-sm font-bold ${m.hot ? "text-primary" : "text-muted-foreground"}`}>{m.reward}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }} whileInView={{ width: `${m.pct}%` }}
                      viewport={{ once: true }} transition={{ duration: 1, delay: i * 0.2 }}
                      className={`h-full rounded-full ${m.hot ? "bg-primary" : "bg-primary/40"}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {["Priority Search Ranking", "Gold Badge", "Dedicated Manager", "Partner Certificate"].map((perk, i) => (
                <span key={i} className="flex items-center gap-1.5 border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                  <Star size={10} /> {perk}
                </span>
              ))}
            </div>
            <Link href="/post/room"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider hover:opacity-90 transition-all w-fit">
              Start Posting Rooms <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── PATH 4: HOUSE OWNERS — FULL VISUAL ── */}
      <section className="border-t border-border">
        <div className="grid lg:grid-cols-2">
          {/* Content */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="p-10 lg:p-16 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 mb-6 w-fit">
              <Building2 size={12} className="text-orange-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-400">Earning Path 4 · House Owners</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black mb-5 leading-tight">
              House Owner? <br />Earn <span className="text-orange-400">₹100</span> Per Listing
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8 text-sm">
              List your property on Takevolet with authentic photos in 5 minutes and earn ₹100 for every verified listing — plus recurring commissions every time a bachelor unlocks your contact!
            </p>
            {/* Benefits */}
            <div className="space-y-3 mb-8">
              {[
                { icon: "📸", text: "Photos are required — for genuine verification", bold: true },
                { icon: "💰", text: "₹100 cash for each verified listing", bold: true },
                { icon: "🔓", text: "Earn ₹2–₹5 every time a bachelor unlocks your contact" },
                { icon: "🔍", text: "Your listing shown across all Takevolet searches" },
                { icon: "♾️", text: "Unlimited listings — more properties = more income" },
                { icon: "📞", text: "Direct calls from verified bachelors only" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <p className={`text-sm ${item.bold ? "font-bold text-foreground" : "text-foreground/80"}`}>{item.text}</p>
                </div>
              ))}
            </div>
            {/* vs Brokers mini table */}
            <div className="border border-border mb-8">
              <div className="grid grid-cols-3 bg-secondary/50 px-4 py-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                <span>Feature</span>
                <span className="text-center text-primary">Takevolet</span>
                <span className="text-center text-red-400">Brokers</span>
              </div>
              {[
                ["Cost to list", "FREE", "₹5,000+"],
                ["Photo required", "Yes (for verification)", "Mandatory"],
                ["Your earnings", "₹100/listing", "₹0"],
                ["Unlock commission", "₹2–₹5 each", "₹0"],
                ["Speed", "5 minutes", "Days/weeks"],
              ].map(([feat, us, them], i) => (
                <div key={i} className={`grid grid-cols-3 px-4 py-2.5 text-xs border-t border-border ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                  <span className="text-foreground/70">{feat}</span>
                  <span className="text-center text-primary font-bold">{us}</span>
                  <span className="text-center text-red-400">{them}</span>
                </div>
              ))}
            </div>
            <Link href="/post/partner"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-8 py-4 font-bold uppercase tracking-wider hover:bg-orange-600 transition-all w-fit">
              Become a Partner Now <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* BIG Visual Image — the house owner poster */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="relative bg-secondary/5 flex items-center justify-center p-8 lg:p-0">
            <img
              src="/earn-house-owner.png"
              alt="House owner Takevolet partner"
              className="w-full h-auto max-h-[600px] object-contain drop-shadow-2xl rounded-sm"
            />
            {/* Overlay badge */}
            <div className="absolute top-6 right-6 bg-orange-500 text-white px-4 py-2 shadow-xl">
              <p className="text-[9px] uppercase tracking-widest font-bold">🏠 Per Listing</p>
              <p className="text-2xl font-black">₹100</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── REFERRAL LINK ── */}
      <section className="py-20 bg-secondary/20 border-t border-border">
        <div className="container mx-auto px-6 md:px-12 max-w-3xl text-center">
          <Gift className="w-12 h-12 text-primary mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-4xl font-black mb-4">Share & <span className="text-primary">Earn Together</span></h2>
          <p className="text-muted-foreground mb-12 font-light">
            Share your unique invite link. When friends join and post a room, you both earn a bonus!
          </p>
          {!user ? (
            <div className="border border-primary/20 bg-primary/5 p-10">
              <p className="text-xl font-bold mb-4">Login to get your personal invite link</p>
              <p className="text-muted-foreground mb-8 font-light">Start earning from your very first referral today.</p>
              <Link href="/auth"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-4 font-bold uppercase tracking-wider hover:opacity-90 transition-all text-sm">
                Login / Sign Up Free <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="border border-primary/20 bg-primary/5 p-8">
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-5">Your Unique Takevolet Invite Link</p>
              <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1 bg-background border border-border px-4 py-3 font-mono text-sm flex items-center overflow-x-auto whitespace-nowrap text-left">
                  {referralLink}
                </div>
                <button onClick={handleCopy}
                  className="bg-primary text-primary-foreground px-6 py-3 font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shrink-0">
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={handleWhatsAppShare}
                  className="bg-[#25D366] text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#1DA851] transition-colors flex items-center justify-center gap-2">
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
                <Link href="/dashboard"
                  className="bg-foreground text-background px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2">
                  <Wallet size={16} /> View My Earnings
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FINAL 3 QUICK CTAs ── */}
      <section className="py-20 bg-foreground text-background border-t border-border">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl font-black mb-4">Pick Your <span className="text-primary">Earning Path</span></h2>
          <p className="text-background/50 mb-12 font-light max-w-xl mx-auto">No investment needed. Just post and start earning from today.</p>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { icon: Home, label: "Post a Room", desc: "Earn ₹2–₹5 per unlock + ₹500–₹1,000 per handover", href: "/post/room", bg: "bg-primary text-primary-foreground" },
              { icon: Building2, label: "House Owner Listing", desc: "List your verified property. Earn ₹100 per listing + unlock commission", href: "/post/room", bg: "bg-orange-500 text-white" },
              { icon: Users, label: "Post a Flatmate", desc: "Fill your flat vacancy and earn from every contact unlock", href: "/post/flatmate", bg: "bg-blue-600 text-white" },
            ].map((cta, i) => (
              <Link key={i} href={cta.href}
                className={`flex flex-col items-center text-center p-8 gap-4 transition-all hover:opacity-90 ${cta.bg}`}>
                <cta.icon size={36} strokeWidth={1.5} />
                <div>
                  <p className="font-black text-lg uppercase tracking-wider">{cta.label}</p>
                  <p className="text-sm opacity-75 mt-2 font-light">{cta.desc}</p>
                </div>
                <ArrowRight size={18} className="mt-auto" />
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
