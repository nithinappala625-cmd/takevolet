"use client";

import { motion } from "framer-motion";
import {
  Copy, CheckCircle2, MessageCircle, Wallet, Star, Home,
  Building2, Zap, TrendingUp, Shield, Crown, ArrowRight,
  IndianRupee, Users, Phone, Trophy, Gift
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import Link from "next/link";

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
      <section className="relative pt-36 pb-24 overflow-hidden">
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
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Post rooms. Help bachelors. Build a network. Earn up to <strong className="text-foreground">₹50,000+ per month</strong> — completely from your phone.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="flex flex-wrap justify-center gap-8 mb-4">
            {[
              { label: "Per Contact Unlock", value: "₹2–₹5", color: "text-primary" },
              { label: "Per Room Handover", value: "₹500–₹1,000", color: "text-green-400" },
              { label: "Premium Partner Bonus", value: "₹500", color: "text-blue-400" },
              { label: "House Owner Per Listing", value: "₹100", color: "text-orange-400" },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" animate="show" custom={i + 4}
                className="text-center">
                <p className={`text-3xl md:text-4xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── EARNING PATH 1: CONTACT UNLOCKS ── */}
      <section className="py-24 border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 mb-6">
                <Phone size={12} className="text-primary" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Earning Path 1</span>
              </div>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                Earn From Every <span className="text-primary">Contact Unlock</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                When you post a room and a bachelor unlocks your contact to call you, you earn a commission from every single unlock. The more attractive your listing, the more unlocks — the more money.
              </p>
              <div className="space-y-4">
                {[
                  { plan: "1 Contact Unlock", you_earn: "₹2", price_paid: "₹10", color: "border-border" },
                  { plan: "50 Contacts Plan", you_earn: "₹15", price_paid: "₹139", color: "border-border" },
                  { plan: "100 Contacts Plan", you_earn: "₹28", price_paid: "₹280", color: "border-primary bg-primary/5" },
                  { plan: "500 Contacts Plan", you_earn: "₹60", price_paid: "₹400", color: "border-border" },
                  { plan: "Unlimited Plan", you_earn: "₹100+", price_paid: "₹500", color: "border-border" },
                ].map((row, i) => (
                  <div key={i} className={`flex items-center justify-between border p-4 ${row.color}`}>
                    <div>
                      <p className="text-sm font-bold">{row.plan}</p>
                      <p className="text-xs text-muted-foreground">Seeker pays: {row.price_paid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{row.you_earn}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">You Earn</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2}
              className="relative">
              <div className="bg-secondary/20 border border-border p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-6">📊 Real Example</p>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0">1</div>
                      <div>
                        <p className="font-bold text-sm">You post your room in Madhapur</p>
                        <p className="text-xs text-muted-foreground">Takes 2 minutes with photos & details</p>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-border ml-4" />
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-black text-sm shrink-0">2</div>
                      <div>
                        <p className="font-bold text-sm">30 bachelors view your listing this week</p>
                        <p className="text-xs text-muted-foreground">Your room shows up on Takevolet search</p>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-border ml-4" />
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-black text-sm shrink-0">3</div>
                      <div>
                        <p className="font-bold text-sm">12 of them unlock your contact</p>
                        <p className="text-xs text-muted-foreground">Each unlock = commission for you</p>
                      </div>
                    </div>
                    <div className="w-px h-6 bg-border ml-4" />
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0">4</div>
                      <div>
                        <p className="font-bold text-sm">You pocket ₹120–₹500 from just 1 listing</p>
                        <p className="text-xs text-muted-foreground">Credited directly to your Takevolet wallet</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Total from 1 room listing:</p>
                    <p className="text-2xl font-black text-primary">₹120–₹500</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── EARNING PATH 2: ROOM HANDOVER COMMISSION ── */}
      <section className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] -z-0" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[150px] -z-0" />
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 px-4 py-1.5 mb-6">
              <IndianRupee size={12} className="text-green-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-green-400">Earning Path 2 · Biggest Reward</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Earn <span className="text-green-400">₹500–₹1,000</span> Per Room Handover
            </h2>
            <p className="text-background/60 max-w-2xl mx-auto font-light text-lg">
              When a bachelor finds your room through Takevolet and actually takes it over — you receive a handover commission on top of your contact unlock earnings.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {[
              {
                icon: Home,
                step: "Step 1",
                title: "Post Your Room",
                desc: "List your room with photos, rent, advance amount, move-out date, and area. Mention how many people can stay.",
                color: "border-primary/30 bg-primary/5",
                iconColor: "text-primary",
              },
              {
                icon: Users,
                step: "Step 2",
                title: "Bachelor Finds Your Room",
                desc: "A bachelor searching on Takevolet finds your listing, unlocks your contact, calls you and likes the room.",
                color: "border-blue-500/30 bg-blue-500/5",
                iconColor: "text-blue-400",
              },
              {
                icon: IndianRupee,
                step: "Step 3",
                title: "You Get Paid ₹500–₹1,000",
                desc: "After the handover is confirmed on the platform, ₹500 to ₹1,000 is instantly credited to your Takevolet wallet.",
                color: "border-green-500/30 bg-green-500/5",
                iconColor: "text-green-400",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                className={`border p-8 relative ${item.color}`}>
                <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-background/40 mb-4">{item.step}</div>
                <item.icon className={`w-10 h-10 mb-4 ${item.iconColor}`} strokeWidth={1.5} />
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-background/60 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 p-8">
            <p className="text-[10px] uppercase tracking-widest text-background/40 mb-4 text-center">💰 How Much Can You Earn?</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { rooms: "1 Room", unlocks: "10 unlocks", handover: "₹500", total: "₹650" },
                { rooms: "5 Rooms", unlocks: "50+ unlocks", handover: "₹2,500", total: "₹3,250" },
                { rooms: "10 Rooms", unlocks: "100+ unlocks", handover: "₹5,000", total: "₹6,500+" },
              ].map((row, i) => (
                <div key={i} className={`p-5 ${i === 1 ? "border border-primary/40 bg-primary/10" : "bg-white/5"}`}>
                  <p className="text-xs font-bold text-background/50 mb-2">{row.rooms}</p>
                  <p className="text-xs text-background/40 mb-1">{row.unlocks}</p>
                  <p className="text-xs text-background/40 mb-1">Handover: {row.handover}</p>
                  <p className="text-xl font-black text-primary mt-3">{row.total}</p>
                  <p className="text-[9px] text-background/30 uppercase tracking-wider">Total Earned</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EARNING PATH 3: PREMIUM PARTNER ── */}
      <section className="py-24 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/3 via-transparent to-transparent" />
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              className="relative">
              <div className="border border-primary/30 p-8 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                <Crown className="w-12 h-12 text-primary mb-6" strokeWidth={1} />
                <h3 className="text-2xl font-black mb-2">Premium Partner Badge</h3>
                <p className="text-muted-foreground text-sm mb-8">Unlock exclusive benefits when you reach 50 room postings</p>
                <div className="space-y-3">
                  {[
                    { icon: Star, text: "Gold 'Premium Partner' badge on your profile", color: "text-yellow-400" },
                    { icon: TrendingUp, text: "Your listings shown first in search results", color: "text-green-400" },
                    { icon: Zap, text: "Priority customer support & dedicated manager", color: "text-blue-400" },
                    { icon: Shield, text: "Verified Partner certificate from Takevolet", color: "text-purple-400" },
                    { icon: Trophy, text: "Featured on Takevolet's Partner Hall of Fame", color: "text-orange-400" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <item.icon size={14} className={item.color} />
                      <p className="text-sm text-foreground/80">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-4 py-1.5 mb-6">
                <Crown size={12} className="text-yellow-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-yellow-400">Earning Path 3 · Premium Partner Program</span>
              </div>
              <h2 className="text-4xl font-black mb-6 leading-tight">
                Post 50 Rooms. Become a <span className="text-primary">Premium Partner</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Become Takevolet's most trusted listing agent in your area. Post 50 rooms over time, earn the ₹500 milestone bonus, and unlock the Premium Partner program with exclusive perks and higher earnings.
              </p>

              {/* Milestone tracker */}
              <div className="space-y-4 mb-8">
                {[
                  { milestone: "5 Rooms Posted", reward: "₹50 Bonus", progress: 10 },
                  { milestone: "15 Rooms Posted", reward: "₹100 Bonus", progress: 30 },
                  { milestone: "30 Rooms Posted", reward: "₹200 Bonus + Silver Badge", progress: 60 },
                  { milestone: "50 Rooms Posted", reward: "₹500 Bonus + Premium Partner 🏆", progress: 100 },
                ].map((m, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-bold">{m.milestone}</span>
                      <span className="text-sm text-primary font-bold">{m.reward}</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all"
                        style={{ width: `${m.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/post/room"
                className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 font-bold uppercase tracking-wider hover:opacity-90 transition-all">
                Start Posting Rooms <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── EARNING PATH 4: HOUSE OWNERS ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent" />
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 mb-6">
              <Building2 size={12} className="text-orange-400" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-orange-400">Earning Path 4 · House Owners</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              House Owner? Earn <span className="text-orange-400">₹100</span> Per Listing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light text-lg">
              You don't even need photos. List your property on Takevolet — no photos required — and earn ₹100 for every verified listing. Plus recurring commissions every time a bachelor unlocks your contact!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            {/* For House Owners */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="border border-orange-500/20 bg-orange-500/5 p-8">
              <Building2 className="w-10 h-10 text-orange-400 mb-6" strokeWidth={1.5} />
              <h3 className="text-2xl font-black mb-4">For House / PG Owners</h3>
              <div className="space-y-4 mb-8">
                {[
                  "📸 No photos required to list — just basic details",
                  "₹100 cash credited for each verified listing",
                  "Earn ₹2–₹5 every time a bachelor unlocks your contact",
                  "Your listing appears across all Takevolet searches",
                  "Unlimited listings — earn more with every property",
                  "Direct calls from verified bachelors, zero brokerage",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="text-orange-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-foreground/80">{item}</p>
                  </div>
                ))}
              </div>
              <Link href="/post/partner"
                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-colors w-full justify-center">
                Become a Partner <ArrowRight size={14} />
              </Link>
            </motion.div>

            {/* Comparison table */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2}
              className="border border-border p-8">
              <h3 className="text-lg font-black mb-6 uppercase tracking-wider">Why Takevolet vs Brokers?</h3>
              <div className="space-y-0">
                <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground pb-3 border-b border-border">
                  <span>Feature</span>
                  <span className="text-center text-primary">Takevolet</span>
                  <span className="text-center text-red-400">Brokers</span>
                </div>
                {[
                  ["Cost to list", "FREE", "₹5,000+"],
                  ["Photo required", "No (optional)", "Mandatory"],
                  ["Direct contact", "✓ Yes", "✗ Via broker"],
                  ["Your earnings", "₹100/listing", "₹0"],
                  ["Unlock commission", "₹2–₹5 each", "₹0"],
                  ["Tenant quality", "Verified bachelors", "Random"],
                  ["Speed", "Listed in 5 mins", "Days/weeks"],
                ].map(([feat, us, them], i) => (
                  <div key={i} className={`grid grid-cols-3 py-3 text-sm border-b border-border/50 ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                    <span className="text-foreground/70 text-xs">{feat}</span>
                    <span className="text-center text-primary font-bold text-xs">{us}</span>
                    <span className="text-center text-red-400 text-xs">{them}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── YOUR REFERRAL LINK ── */}
      <section className="py-24 bg-secondary/20 border-t border-border">
        <div className="container mx-auto px-6 md:px-12 max-w-3xl text-center">
          <Gift className="w-12 h-12 text-primary mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="text-4xl font-black mb-4">Share & <span className="text-primary">Earn Together</span></h2>
          <p className="text-muted-foreground mb-12 font-light">
            Share your unique invite link with friends. When they join and post a room, you both earn a bonus!
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
                  className="bg-foreground text-background border border-border px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center gap-2">
                  <Wallet size={16} /> View My Earnings
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── QUICK START CTA ── */}
      <section className="py-24 bg-foreground text-background">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to <span className="text-primary">Start Earning?</span></h2>
          <p className="text-background/60 mb-12 text-lg font-light max-w-xl mx-auto">
            Choose your path below and start earning from today. No investment, no risk — just post and earn!
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Home, label: "Post a Room", desc: "Leaving your flat? List it and earn ₹500–₹1,000", href: "/post/room",
                bg: "bg-primary text-primary-foreground", hover: "hover:opacity-90",
              },
              {
                icon: Building2, label: "House Owner Listing", desc: "List your property, earn ₹100 — no photos needed", href: "/post/partner",
                bg: "bg-orange-500 text-white", hover: "hover:bg-orange-600",
              },
              {
                icon: Users, label: "Post a Flatmate", desc: "Fill a vacancy and earn from contact unlocks", href: "/post/flatmate",
                bg: "bg-blue-600 text-white", hover: "hover:bg-blue-700",
              },
            ].map((cta, i) => (
              <Link key={i} href={cta.href}
                className={`flex flex-col items-center text-center p-8 gap-4 transition-all ${cta.bg} ${cta.hover}`}>
                <cta.icon size={32} strokeWidth={1.5} />
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
