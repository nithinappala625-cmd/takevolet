"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Star, Zap, MapPin, Users, ChevronRight, IndianRupee, Calendar, Sofa, ShoppingBag, Wallet, Home } from "lucide-react";
import { HYDERABAD_AREAS } from "@/data/locations";
import { useEffect, useState } from "react";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import { getAllFlatmates } from "@/lib/flatmate-db";
import type { Room } from "@/lib/db";
import type { Flatmate } from "@/data/mock";
const stats = [
  { value: "5,200+", label: "Bachelors Registered" },
  { value: "₹0", label: "Brokerage Fee" },
  { value: "1,800+", label: "Rooms Handed Over" },
  { value: "90+", label: "Hyderabad Areas" },
];

const howItWorks = [
  { step: "01", title: "Bachelor Leaving?", desc: "Post your room with photos, leaving date, rent, advance, and how many members the room allows. It takes 2 minutes." },
  { step: "02", title: "Bachelor Searching?", desc: "Browse rooms by area, budget, members allowed, furnishing, and gender preference. Filter exactly what you need." },
  { step: "03", title: "Connect Directly", desc: "View the poster's profile, profession, and phone number. Call or WhatsApp directly — no middleman, no broker." },
  { step: "04", title: "Earn ₹500–₹1,000", desc: "When new bachelors take over your room through Takevolet, you earn a referral commission. Easy money while you move out." },
];

export default function LandingPage() {
  const [featuredRooms, setFeaturedRooms] = useState<Room[]>([]);
  const [featuredFlatmates, setFeaturedFlatmates] = useState<Flatmate[]>([]);

  useEffect(() => {
    async function loadFeaturedData() {
      // Load top 3 available rooms
      const roomsRes = await fetchAllRoomsAction();
      if (roomsRes && Array.isArray(roomsRes)) {
        setFeaturedRooms(roomsRes.filter(r => r.is_available).slice(0, 3));
      }
      
      // Load top 3 available flatmates
      const fms = await getAllFlatmates();
      setFeaturedFlatmates(fms.filter(f => f.isAvailable).slice(0, 3));
    }
    loadFeaturedData();
  }, []);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Takevolet",
    url: "https://takevolet.online",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://takevolet.online/rooms?location={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://takevolet.online/#organization",
    name: "Takevolet Technologies",
    alternateName: "Takevolet",
    url: "https://takevolet.online",
    logo: {
      "@type": "ImageObject",
      url: "https://takevolet.online/logo.png",
      width: "1024",
      height: "1024"
    },
    description: "Takevolet Technologies is the official owner and operator of Takevolet (takevolet.online), the premier zero brokerage bachelor room handover platform in Hyderabad.",
    founder: {
      "@type": "Person",
      name: "Nithin Patel",
      jobTitle: "Founder & CEO",
      sameAs: [
        "https://wa.me/917981994870",
        "tel:+917981994870"
      ]
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+917981994870",
      contactType: "customer service",
      email: "hello@takevolet.online",
      availableLanguage: ["English", "Telugu", "Hindi"]
    }
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": "https://takevolet.online/#localbusiness",
    name: "Takevolet",
    image: "https://takevolet.online/logo.png",
    description: "Zero brokerage platform for bachelor room handovers in Hyderabad. Owned and operated exclusively by Takevolet Technologies.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    url: "https://takevolet.online",
    telephone: "+917981994870",
    parentOrganization: {
      "@type": "Organization",
      "@id": "https://takevolet.online/#organization",
      name: "Takevolet Technologies"
    }
  };

  // FAQPage JSON-LD for homepage Google rich results
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Takevolet?",
        "acceptedAnswer": { "@type": "Answer", "text": "Takevolet is Hyderabad's #1 zero-brokerage platform for bachelor room handovers, flatmate matching, and used furniture marketplace. Founded in 2026, it connects bachelors leaving their rooms directly with bachelors searching — no brokers, no commission." }
      },
      {
        "@type": "Question",
        "name": "How do I find a bachelor room in Hyderabad without a broker?",
        "acceptedAnswer": { "@type": "Answer", "text": "Use Takevolet — browse rooms filtered by area, budget, furnishing, and members allowed. Unlock the poster's contact from just ₹10. Call or WhatsApp them directly. Zero brokerage, always." }
      },
      {
        "@type": "Question",
        "name": "Can I earn money by posting my room on Takevolet?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes! When a new bachelor takes over your room through Takevolet, you earn ₹500–₹1,000 as a handover commission. Posting your room is completely free." }
      },
      {
        "@type": "Question",
        "name": "Which areas in Hyderabad does Takevolet cover?",
        "acceptedAnswer": { "@type": "Answer", "text": "Takevolet covers 90+ areas in Hyderabad including Madhapur, Gachibowli, Kondapur, KPHB, Kukatpally, Ameerpet, SR Nagar, Dilsukhnagar, Uppal, Malkajgiri, Secunderabad, Begumpet, Jubilee Hills, Banjara Hills, and more." }
      },
      {
        "@type": "Question",
        "name": "How much does it cost to unlock a room poster's contact on Takevolet?",
        "acceptedAnswer": { "@type": "Answer", "text": "Contact unlocks start at just ₹10 per contact. Bundle plans are available: 50 contacts for ₹139, 100 contacts for ₹280, 500 contacts for ₹400, and unlimited contacts for ₹500. All payments are secured by Razorpay." }
      },
    ]
  };

  // HowTo JSON-LD for the "How It Works" section
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to Hand Over a Bachelor Room in Hyderabad Using Takevolet",
    "description": "A step-by-step guide to handing over your bachelor room in Hyderabad on Takevolet and earning commission.",
    "step": [
      { "@type": "HowToStep", "name": "Bachelor Leaving?", "text": "Post your room with photos, leaving date, rent, advance, and how many members the room allows. It takes 2 minutes." },
      { "@type": "HowToStep", "name": "Bachelor Searching?", "text": "Browse rooms by area, budget, members allowed, furnishing, and gender preference. Filter exactly what you need." },
      { "@type": "HowToStep", "name": "Connect Directly", "text": "View the poster's profile, profession, and phone number. Call or WhatsApp directly — no middleman, no broker." },
      { "@type": "HowToStep", "name": "Earn ₹500–₹1,000", "text": "When new bachelors take over your room through Takevolet, you earn a referral commission. Easy money while you move out." }
    ]
  };

  return (
    <div className="flex flex-col w-full bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />

      {/* ━━━ HERO ━━━ */}
      <section className="relative min-h-screen flex items-center pt-32 overflow-hidden">
        <div className="absolute top-20 right-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] -z-10" />

        <div className="container mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 border border-border px-4 py-1.5 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Built for Bachelors in Hyderabad</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
              Leaving your room?<br />
              <span className="font-bold gold-gradient">Relay it to the next bachelor.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light max-w-lg">
              Takevolet connects bachelors who are <strong className="text-foreground">leaving their rooms</strong> with bachelors who are <strong className="text-foreground">searching for rooms</strong> — directly, with zero brokerage. Post your room, sell your furniture, and earn commission.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/rooms" className="group bg-foreground text-background px-8 py-4 flex items-center justify-center gap-3 font-semibold uppercase tracking-wider text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                Find a Room <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/list" className="border border-border px-8 py-4 flex items-center justify-center font-semibold uppercase tracking-wider text-sm hover:border-primary hover:text-primary transition-all">
                I&apos;m Leaving — Post My Room
              </Link>
            </div>

            <div className="mt-14 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[11, 12, 13, 14].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                    <img src={`https://i.pravatar.cc/80?img=${i}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold">5,200+ bachelors</p>
                <p className="text-xs text-muted-foreground">already using Takevolet in Hyderabad</p>
              </div>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}
            className="relative h-[240px] sm:h-[300px] md:h-[500px] mt-8 lg:mt-0">
            <div className="absolute inset-0 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&q=80"
                alt="Bachelor flat" loading="eager" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 bg-background/90 backdrop-blur-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-1">Bachelor Room Available</p>
                  <h4 className="font-bold">2BHK in Madhapur — 3 members</h4>
                </div>
                <span className="text-lg font-bold">₹15,000<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={12} /> Madhapur</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Calendar size={12} /> Leaving June 15</span>
                <span>•</span>
                <span className="text-primary font-bold">₹1,000 reward</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ━━━ STATS ━━━ */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
                className={`py-8 sm:py-10 text-center ${
                  // At 2-col: only 1st col gets border-r. At 4-col: first 3 get border-r
                  i === 0 ? 'border-r border-border' :
                  i === 1 ? 'md:border-r md:border-border' :
                  i === 2 ? 'border-r border-border' :
                  ''
                }`}>
                <p className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ WHAT IS Takevolet ━━━ */}
      <section className="py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-16 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">What is Takevolet?</p>
            <h2 className="text-4xl font-light leading-tight">
              The platform where <span className="font-bold">bachelors help bachelors</span> find rooms.
            </h2>
            <p className="text-muted-foreground font-light mt-4 max-w-2xl leading-relaxed">
              When a bachelor or a group of bachelors decides to leave their current room — whether it&apos;s a transfer, job change, or just moving on — they post it on Takevolet. New bachelors searching for rooms can browse, filter by area/budget/members, and connect directly with the person leaving.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {[
              { icon: Home, title: "Rooms Handover", desc: "Relay your room directly to the next bachelor when leaving, or browse rooms in 90+ Hyderabad areas with direct poster contact and zero brokerage fee." },
              { icon: Users, title: "Flatmate Matchmaking", desc: "Have a vacancy in your flat or looking to share? Connect directly with compatible single bachelors in Hyderabad based on age, profession, and lifestyle." },
              { icon: ShoppingBag, title: "Bachelors Marketplace", desc: "Moving out or setting up? Don't carry it or buy brand new. List and shop for furniture, appliances, and electronics directly to/from nearby bachelors." },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-background p-10 group hover:bg-secondary/50 transition-colors">
                <f.icon className="w-10 h-10 text-primary mb-6" strokeWidth={1} />
                <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="py-28 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">How It Works</p>
            <h2 className="text-4xl font-light">Four steps to a <span className="font-bold">smooth room handover.</span></h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative">
                <span className="text-5xl font-bold text-border block mb-4">{item.step}</span>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{item.desc}</p>
                {i < 3 && <ChevronRight className="hidden md:block absolute top-6 -right-4 w-5 h-5 text-border" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED ROOMS ━━━ */}
      <section className="py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Latest Handovers</p>
              <h2 className="text-3xl font-light">Bachelors <span className="font-bold">leaving soon</span></h2>
            </div>
            <Link href="/rooms" className="text-sm uppercase tracking-wider font-semibold text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredRooms.map((room, i) => (
              <motion.div key={room.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="border border-border overflow-hidden group hover:border-primary/30 transition-all">
                <div className="relative h-48 overflow-hidden">
                  <img src={room.images?.[0] || ""} alt={room.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1">
                    <MapPin size={10} className="text-primary" /> {room.location}
                  </div>
                  {(room.commission || 0) > 0 && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold">
                      ₹{room.commission} reward
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-sm mb-2 line-clamp-1">{room.title}</h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-0.5 bg-secondary text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"><Users size={10} /> {room.membersAllowed} allowed</span>
                    <span className="px-2 py-0.5 bg-secondary text-[10px] font-medium uppercase tracking-wider flex items-center gap-1"><Sofa size={10} /> {room.furnishing}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="font-bold flex items-center"><IndianRupee size={14} />{room.rent.toLocaleString("en-IN")}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                    <Link href={`/rooms/${room.id}`} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">Details →</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED FLATMATES / ROOMMATE MATCHMAKING ━━━ */}
      <section className="py-28 bg-secondary/15 border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Premium Roommate Matchmaking</p>
              <h2 className="text-4xl font-light">Find compatible <span className="font-bold">Flatmates</span></h2>
              <p className="text-muted-foreground font-light mt-3 max-w-xl text-sm leading-relaxed">
                Connect with verified bachelors in Hyderabad who have a vacancy in their flat. Filter by budget, professional background, and lifestyle habits.
              </p>
            </div>
            <div className="flex gap-4">
              <Link href="/flatmates" className="text-xs bg-foreground text-background px-6 py-3.5 uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all">
                Browse Flatmates
              </Link>
              <Link href="/post/flatmate" className="text-xs border border-border px-6 py-3.5 uppercase tracking-wider font-bold hover:border-primary hover:text-primary transition-all">
                Post a Vacancy +
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredFlatmates.map((fm, i) => (
              <motion.div key={fm.id} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="border border-border bg-background overflow-hidden group hover:border-primary/45 transition-all flex flex-col justify-between shadow-sm">
                
                <div className="relative h-56 overflow-hidden bg-muted">
                  <img src={fm.images[0]} alt={fm.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold text-primary border border-primary/20">
                    Vacancy: {fm.vacancyCount}
                  </div>
                  <div className="absolute top-3 right-3 bg-foreground text-background px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold">
                    {fm.genderPref}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-10 text-white">
                    <p className="text-[10px] font-semibold tracking-wider uppercase opacity-85 mb-1 flex items-center gap-1">
                      <MapPin size={10} className="text-primary" /> {fm.location}
                    </p>
                    <h3 className="font-bold text-sm line-clamp-1">{fm.title}</h3>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Price and host summary */}
                    <div className="flex justify-between items-center border-b border-border pb-3">
                      <div>
                        <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">Rent Share /mo</span>
                        <span className="font-bold text-lg text-primary flex items-center"><IndianRupee size={14} strokeWidth={2.5} /> {fm.rentShare.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <img src={fm.postedBy.avatar} alt={fm.postedBy.name} className="w-8 h-8 rounded-full object-cover border border-primary/20" />
                        <div className="text-right">
                          <p className="text-[10px] font-bold leading-none">{fm.postedBy.name}</p>
                          <p className="text-[9px] text-muted-foreground leading-none mt-1">{fm.postedBy.age} y/o • {fm.postedBy.profession.split(" at ")[0]}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-light text-muted-foreground line-clamp-2 leading-relaxed">
                      {fm.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {fm.lifestyleHabits.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="bg-secondary/40 border border-border px-2 py-0.5 text-[9px] text-foreground/80 rounded-full">
                          {tag}
                        </span>
                      ))}
                      {fm.lifestyleHabits.length > 2 && (
                        <span className="bg-secondary/20 border border-border px-2 py-0.5 text-[9px] text-muted-foreground rounded-full">
                          +{fm.lifestyleHabits.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-4 flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-light">Prefers: <strong>{fm.professionPref}</strong></span>
                    <Link href={`/flatmates/${fm.id}`} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">
                      Details →
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SELL YOUR ITEMS ━━━ */}
      <section className="py-28 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Leaving? Sell Your Stuff</p>
              <h2 className="text-4xl font-light mb-6">Don&apos;t carry it. <span className="font-bold">Sell it or rent it.</span></h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-8">
                Leaving your fridge, cooler, bed, or TV behind? Instead of selling for scrap, list it on Takevolet&apos;s marketplace. Other bachelors moving into your area will happily buy or rent your items at fair prices.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                {["Sell furniture, electronics & appliances at fair prices", "Rent items monthly — passive income while you're away", "Buyers are verified bachelors in your neighbourhood", "No transport hassle — items stay in the same room/area"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2"><ShieldCheck size={16} className="text-primary mt-0.5 shrink-0" /> {item}</li>
                ))}
              </ul>
              <Link href="/marketplace" className="bg-foreground text-background px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-2">
                <ShoppingBag size={16} /> Browse Marketplace
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {["https://images.unsplash.com/photo-1505693314120-0d443867891c?w=400&h=400&fit=crop&q=80",
                "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=400&fit=crop&q=80",
                "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&h=400&fit=crop&q=80",
                "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop&q=80"
              ].map((src, i) => (
                <div key={i} className="aspect-square overflow-hidden border border-border">
                  <img src={src} alt="Item" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ AREAS ━━━ */}
      <section className="py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Neighbourhoods</p>
            <h2 className="text-3xl font-light">Bachelor rooms across <span className="font-bold">all of Hyderabad.</span></h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {HYDERABAD_AREAS.slice(0, 40).map((area, i) => (
              <Link key={area} href={`/rooms?location=${area}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border bg-background hover:border-primary hover:text-primary transition-all text-xs font-medium">
                <MapPin size={10} /> {area}
              </Link>
            ))}
            <Link href="/rooms" className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary text-primary text-xs font-bold">
              +{HYDERABAD_AREAS.length - 40} more areas →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-border bg-foreground text-background py-28">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Are you a bachelor in <span className="font-bold italic">Hyderabad?</span>
          </h2>
          <p className="text-background/50 mb-10 max-w-xl mx-auto font-light text-lg">
            Whether you&apos;re leaving your room or searching for one — Takevolet is the only platform you need. Zero brokerage. Direct contact. Commission rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms" className="bg-primary text-primary-foreground px-10 py-4 text-sm uppercase tracking-widest font-bold hover:opacity-90 transition-all">
              Find a Bachelor Room
            </Link>
            <Link href="/list" className="border border-background/20 px-10 py-4 text-sm uppercase tracking-widest font-bold hover:border-primary hover:text-primary transition-all">
              Post Your Room
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ GOLD DIVIDER ━━━ */}
      <div className="bg-foreground">
        <div className="container mx-auto px-6 md:px-12">
          <div className="flex items-center gap-6 py-0">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/60 to-primary" />
            <div className="flex items-center gap-3 py-5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] uppercase tracking-[0.35em] font-bold text-primary">Pricing & Plans</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/60 to-primary" />
          </div>
        </div>
      </div>

      {/* ━━━ UNLOCK CONTACT CTA (Razorpay Payment) ━━━ */}
      <section className="py-20 bg-[#0a0a0a] text-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[100px] -z-0" />
        <div className="container mx-auto px-6 md:px-12 relative z-10">

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 border border-primary/30 px-4 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-primary">Razorpay Secured · No Brokerage</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-light mb-4 leading-tight">
              Like a room? Unlock the poster&apos;s contact.<br />
              <span className="font-bold text-primary">Starting ₹10 only.</span>
            </h2>
            <p className="text-background/60 font-light max-w-xl mx-auto">
              Browse free. Pay only when you want to call or WhatsApp a poster. Choose any plan below.
            </p>
          </div>

          {/* Pricing mini grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto mb-10">
            {[
              { label: "1 Contact",        price: "₹10",  sub: "₹10/contact",   hot: false },
              { label: "50 Contacts",       price: "₹139", sub: "₹2.78/contact", hot: false },
              { label: "100 Contacts",      price: "₹280", sub: "₹2.80/contact", hot: true,  badge: "Best Value" },
              { label: "500 Contacts",      price: "₹400", sub: "₹0.80/contact", hot: false, badge: "Popular" },
              { label: "Unlimited",         price: "₹500", sub: "₹0/contact",    hot: false, badge: "🔥 Deal" },
            ].map((p, i) => (
              <div key={i} className={`border p-4 text-center relative ${p.hot ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"}`}>
                {p.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold whitespace-nowrap ${p.hot ? "bg-primary text-primary-foreground" : "bg-orange-500 text-white"}`}>
                    {p.badge}
                  </span>
                )}
                <p className={`text-2xl font-black mb-0.5 ${p.hot ? "text-primary" : "text-white"}`}>{p.price}</p>
                <p className="text-xs text-background/70 mb-1">{p.label}</p>
                <p className={`text-[10px] font-bold ${p.hot ? "text-primary" : "text-background/40"}`}>{p.sub}</p>
              </div>
            ))}
          </div>

          {/* What you get + CTA */}
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 p-5">
              <p className="text-[10px] uppercase tracking-widest text-background/50 mb-3">Each contact unlock includes</p>
              <div className="space-y-2">
                {["Full name of poster", "Direct mobile number (call & SMS)", "WhatsApp number for instant chat", "Profession & verified area", "No brokerage — ever"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-background/70">
                    <span className="text-primary">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="space-y-2.5 mb-6">
                {["Starting at ₹10 per contact — cheapest in Hyderabad", "Instant unlock via Razorpay — UPI, Cards, NetBanking", "No house numbers for privacy — colony/area only", "Use contacts across any room on Takevolet"].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-background/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <Link href="/rooms" className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all">
                  Browse Rooms &amp; Unlock Contact <ArrowRight size={14} />
                </Link>
                <Link href="/pricing" className="w-full flex items-center justify-center gap-2 border border-white/20 py-3 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all">
                  View Full Pricing →
                </Link>
                <p className="text-center text-[10px] text-background/30">🔒 Secured by Razorpay · UPI · Cards · NetBanking</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-border py-14">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-4 gap-10 mb-14">
            <div>
              <div className="flex items-center space-x-2.5 mb-4">
                <img
                  src="/logo.png"
                  alt="Takevolet logo"
                  className="w-10 h-10 rounded-sm"
                />
                <span className="text-base font-bold tracking-[0.2em] uppercase">Take<span className="text-primary">volet</span></span>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed mb-4">Bachelor room handovers &amp; marketplace in Hyderabad. Zero brokerage.</p>
              <div className="flex items-center gap-4 mb-4">
                <Link href="https://www.instagram.com/take_volet?igsh=MTBxdG1qMWd3MnBrZg==" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                  Instagram
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">Made with ❤️ in India · Started 2026</p>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-3">Platform</h4>
              <div className="flex flex-col gap-2">
                {[
                  ["Browse Rooms", "/rooms"],
                  ["Find Flatmates", "/flatmates"],
                  ["Marketplace", "/marketplace"],
                  ["Post Your Room", "/list"],
                  ["My Dashboard", "/dashboard"]
                ].map(([label, href]) => (
                  <Link key={label} href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-3">Top Areas</h4>
              <div className="flex flex-col gap-2">
                {["Madhapur", "Gachibowli", "Kukatpally", "SR Nagar", "Kondapur"].map(loc => (
                  <Link key={loc} href={`/rooms?location=${loc}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">{loc}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4">Legal & Company</h4>
              <div className="flex flex-col gap-2.5">
                {([
                  ["About Us", "/about"],
                  ["Contact Us", "/contact"],
                  ["Pricing", "/pricing"],
                  ["Privacy Policy", "/privacy"],
                  ["Terms of Service", "/terms"],
                  ["Refund Policy", "/refund-policy"],
                ] as [string, string][]).map(([label, href]) => (
                  <Link key={label} href={href} className="text-xs text-muted-foreground hover:text-primary transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
              <p>© 2026 Takevolet Technologies — Hyderabad, Telangana, India</p>
              <div className="flex items-center gap-1.5">
                <span>Started 2026</span>
                <span className="text-border">·</span>
                <span>Made with</span>
                <span className="text-red-500 normal-case">❤️</span>
                <span>in India</span>
                <span className="text-border">·</span>
                <span>Zero Brokerage</span>
              </div>
            </div>
            {/* Razorpay-required legal links row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-muted-foreground/60">
              {([["Terms of Service", "/terms"], ["Privacy Policy", "/privacy"], ["Refund Policy", "/refund-policy"], ["Pricing", "/pricing"], ["Contact", "/contact"]] as [string,string][]).map(([label, href]) => (
                <Link key={label} href={href} className="hover:text-primary transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
