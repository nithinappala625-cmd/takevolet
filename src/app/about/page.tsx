"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Heart, Target, Users, Shield, Zap, MapPin, ArrowRight, Star, Building2, TrendingUp, Phone, MessageCircle } from "lucide-react";

const stats = [
  { value: "10,000+", label: "Bachelors Helped" },
  { value: "3,500+", label: "Rooms Listed" },
  { value: "15+", label: "Areas in Hyderabad" },
  { value: "₹0", label: "Brokerage Ever" },
];

const values = [
  { icon: Heart, title: "Built with Love", desc: "Made in India by people who lived the bachelor life. We understand the struggle of finding a room without paying hefty broker fees." },
  { icon: Shield, title: "Zero Brokerage", desc: "We are a direct platform. No middlemen, no hidden charges. Posters and seekers connect directly after a small contact unlock fee." },
  { icon: Target, title: "Hyderabad First", desc: "We started in Hyderabad because it's the IT capital of India with the highest demand for bachelor accommodation. Every feature is designed for this city." },
  { icon: Zap, title: "Instant & Transparent", desc: "Post in 2 minutes. Listings go live immediately. All room details — rent, advance, parking, furnishing, amenities — shown upfront. No surprises." },
  { icon: Users, title: "Community Driven", desc: "Our poster community earns commissions and contact revenue. Seekers get honest listings from real people leaving actual rooms." },
  { icon: TrendingUp, title: "Growing Fast", desc: "Started in 2026, Takevolet is already the go-to platform for IT professionals and students hunting for bachelor rooms in Hyderabad." },
];



export default function AboutPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">

      {/* Hero */}
      <section className="container mx-auto px-6 md:px-12 mb-24 text-center max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-8">
            <MapPin size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Hyderabad, India</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-8 leading-[1.1]">
            We killed the<br />
            <span className="font-bold gold-gradient">broker mafia.</span>
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto mb-10">
            Takevolet is a direct bachelor room handover marketplace. We connect people leaving rooms with people needing rooms — with zero brokerage, full transparency, and real photos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms" className="bg-primary text-primary-foreground px-8 py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              Find a Room <ArrowRight size={14} />
            </Link>
            <Link href="/contact" className="border border-border px-8 py-4 text-sm uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all">
              Get in Touch
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-foreground text-background py-16 mb-24">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-background/10">
            {stats.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-foreground p-10 text-center">
                <p className="text-4xl font-bold text-primary mb-2">{s.value}</p>
                <p className="text-xs uppercase tracking-widest text-background/50">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto px-6 md:px-12 mb-24 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-6">Our Story</p>
          <h2 className="text-4xl font-light mb-8 leading-tight">
            It started with a <span className="font-bold">₹15,000 broker fee</span> nobody should have paid.
          </h2>
          <div className="space-y-5 text-muted-foreground font-light leading-relaxed text-base">
            <p>
              In early 2026, our founder was shifting jobs in Hyderabad. He needed a 2BHK near Madhapur for 3 bachelors. Every listing on every platform had the same story: <strong className="text-foreground">call broker, pay 1 month rent as brokerage.</strong> ₹15,000 gone before even moving in.
            </p>
            <p>
              At the same time, his friend Rohit — who was leaving a perfectly good room in the same area — couldn't find someone to take it over. He was paying double rent for two months. The match that should have happened naturally just... didn't.
            </p>
            <p>
              Takevolet was built to fix exactly that. <strong className="text-foreground">Connect people leaving rooms with people needing rooms.</strong> No brokers. No middlemen. Direct contact for a tiny fee that goes back to the community.
            </p>
            <p>
              Today we serve IT professionals, students, and bachelors across 15+ areas in Hyderabad. Every feature — from the colony-based search to the parking filter — was built based on real feedback from real bachelors.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="container mx-auto px-6 md:px-12 mb-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4 text-center">What We Stand For</p>
        <h2 className="text-4xl font-light text-center mb-14">Our <span className="font-bold">Values</span></h2>
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="border border-border p-8 hover:border-primary/30 transition-all group">
              <div className="w-12 h-12 border border-border group-hover:border-primary flex items-center justify-center mb-5 transition-all">
                <v.icon size={20} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-base mb-3">{v.title}</h3>
              <p className="text-sm text-muted-foreground font-light leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team — Founder */}
      <section className="container mx-auto px-6 md:px-12 mb-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4 text-center">The Person Behind It</p>
        <h2 className="text-4xl font-light text-center mb-14">Meet the <span className="font-bold">Founder</span></h2>
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border border-border p-10 flex flex-col md:flex-row items-center gap-10">
            {/* Photo */}
            <div className="shrink-0">
              <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/30 shadow-xl">
                <img src="/team/nithin.jpg" alt="Nithin Patel — Founder & CEO" className="w-full h-full object-cover object-top" />
              </div>
            </div>
            {/* Info */}
            <div className="text-center md:text-left">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-2">Founder &amp; CEO</p>
              <h3 className="text-3xl font-bold mb-2">Nithin Patel</h3>
              <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-1.5 mb-4">
                <MapPin size={12} className="text-primary" /> Hyderabad, Telangana, India
              </p>
              <p className="text-sm text-muted-foreground font-light leading-relaxed italic mb-6">
                &ldquo;Built Takevolet after watching bachelors in Hyderabad lose thousands to brokers. I wanted to build something that gives power back to the people — zero brokerage, direct contact, real transparency.&rdquo;
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <a href="tel:+917981994870"
                  className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary transition-all">
                  <Phone size={14} /> +91 79819 94870
                </a>
                <a href="https://wa.me/917981994870" target="_blank"
                  className="inline-flex items-center gap-2 border border-green-500 text-green-600 px-5 py-2.5 text-sm font-semibold hover:bg-green-500 hover:text-white transition-all">
                  <MessageCircle size={14} /> WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 md:px-12">
        <div className="bg-foreground text-background p-14 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Heart size={16} className="text-red-400 fill-red-400" />
            <span className="text-xs uppercase tracking-[0.3em] text-background/50 font-bold">Made with Love in India</span>
            <Heart size={16} className="text-red-400 fill-red-400" />
          </div>
          <h2 className="text-4xl font-light mb-4">Be part of the <span className="font-bold">Takevolet</span> family</h2>
          <p className="text-background/60 font-light mb-10 max-w-xl mx-auto">
            Whether you&apos;re searching for a room or leaving one — you&apos;re helping the bachelor community of Hyderabad.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms" className="bg-primary text-primary-foreground px-8 py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all">
              Find a Room
            </Link>
            <Link href="/list" className="border border-background/20 px-8 py-4 text-sm uppercase tracking-wider font-bold hover:border-primary hover:text-primary transition-all">
              Post Your Room
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
