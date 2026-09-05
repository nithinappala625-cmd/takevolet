import Link from "next/link";
import { ArrowRight, ShieldCheck, ShoppingBag, Home, Users, MapPin, ChevronRight, IndianRupee, Wallet } from "lucide-react";
import { HYDERABAD_AREAS } from "@/data/locations";
import { HeroAnimations, FeaturedRoomsSection, FeaturedFlatmatesSection, AnimatedStats, AnimatedSection } from "@/components/HomepageHero";
import type { Metadata } from "next";

// ── SEO Metadata (server-side, crawlable) ──────────────────────────────────────
export const metadata: Metadata = {
  title: "Takevolet — Rooms for Rent in Hyderabad | Bachelor Rooms, Family Rooms, Flatmates | Zero Brokerage",
  description:
    "Find rooms for rent in Hyderabad with zero brokerage. Takevolet is Hyderabad's #1 platform for bachelor rooms, family rooms, flatmate matching, and used furniture marketplace. Direct owner contact. No brokers. Serving 90+ areas across Hyderabad including Madhapur, Gachibowli, Kukatpally, Kondapur, Ameerpet, SR Nagar, and more.",
  keywords: [
    "takevolet", "takevolet hyderabad", "takevolet rooms", "takevolet online", "take volet",
    "rooms for rent hyderabad", "rooms for rent in hyderabad", "room for rent hyderabad",
    "bachelor rooms hyderabad", "bachelor room for rent in hyderabad", "bachelor room rent hyderabad",
    "family rooms hyderabad", "family room for rent hyderabad", "family flat for rent hyderabad",
    "2bhk for rent hyderabad", "1bhk for rent hyderabad", "3bhk for rent hyderabad",
    "house for rent hyderabad", "flat for rent hyderabad", "apartment for rent hyderabad",
    "rooms near me hyderabad", "rental rooms hyderabad", "room rent hyderabad",
    "bachelor flat for rent hyderabad", "bachelor accommodation hyderabad",
    "single room rent hyderabad", "1rk rent hyderabad", "1 room kitchen hyderabad rent",
    "zero brokerage rooms hyderabad", "no broker rooms hyderabad", "direct owner rooms hyderabad",
    "broker free rooms hyderabad", "without brokerage rooms hyderabad",
    "room rent madhapur", "room rent gachibowli", "room rent kukatpally", "room rent ameerpet",
    "room rent sr nagar", "room rent kondapur", "room rent hitech city hyderabad",
    "room rent kphb", "room rent dilsukhnagar", "room rent uppal hyderabad",
    "bachelor room ameerpet", "bachelor room madhapur", "bachelor room gachibowli",
    "bachelor room kondapur", "bachelor room hitec city", "bachelor room kukatpally",
    "bachelor room sr nagar",
    "room handover hyderabad", "flat handover hyderabad", "bachelor room handover",
    "pg rooms hyderabad", "pg for bachelors hyderabad", "bachelor pg hyderabad",
    "shared room hyderabad", "shared flat hyderabad bachelors",
    "flatmates hyderabad", "find flatmate hyderabad", "roommate hyderabad",
    "used furniture hyderabad bachelors", "buy sell furniture hyderabad",
    "earn commission room hyderabad", "earn money handing over room",
    "paying guest hyderabad", "hostel hyderabad", "boys hostel hyderabad",
    "girls pg hyderabad", "co-living hyderabad",
    "cheap rooms hyderabad", "affordable rooms hyderabad", "budget rooms hyderabad",
  ],
  alternates: {
    canonical: "/",
  },
};

// ── JSON-LD Schemas (server-rendered, crawlable by Google) ─────────────────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://takevolet.online";

const webpageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${APP_URL}/#webpage`,
  name: "Takevolet — Rooms for Rent in Hyderabad | Zero Brokerage",
  description: "Find rooms for rent in Hyderabad with zero brokerage. Bachelor rooms, family rooms, flatmates, and used furniture marketplace.",
  url: APP_URL,
  isPartOf: { "@id": `${APP_URL}/#website` },
  about: { "@id": `${APP_URL}/#organization` },
  primaryImageOfPage: { "@type": "ImageObject", url: `${APP_URL}/logo.png` },
  breadcrumb: { "@id": `${APP_URL}/#breadcrumb` },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "@id": `${APP_URL}/#breadcrumb`,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: APP_URL },
    { "@type": "ListItem", position: 2, name: "Rooms", item: `${APP_URL}/rooms` },
    { "@type": "ListItem", position: 3, name: "Flatmates", item: `${APP_URL}/flatmates` },
    { "@type": "ListItem", position: 4, name: "Marketplace", item: `${APP_URL}/marketplace` },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Takevolet?",
      acceptedAnswer: { "@type": "Answer", text: "Takevolet is the #1 zero-brokerage platform for bachelor and family room handovers, flatmate matching, and used furniture marketplace in Hyderabad. Founded in 2026, it connects people leaving their rooms directly with people searching — no brokers, no commission." },
    },
    {
      "@type": "Question",
      name: "How do I find a bachelor room without a broker in Hyderabad?",
      acceptedAnswer: { "@type": "Answer", text: "Use Takevolet — browse rooms filtered by area, budget, furnishing, and members allowed. Unlock the poster's contact from just ₹15. Call or WhatsApp them directly. Zero brokerage, always." },
    },
    {
      "@type": "Question",
      name: "Can I find family rooms for rent in Hyderabad on Takevolet?",
      acceptedAnswer: { "@type": "Answer", text: "Yes! Takevolet now offers both bachelor and family room listings. Filter between bachelor and family rooms to find the perfect home for your family in Hyderabad's best areas." },
    },
    {
      "@type": "Question",
      name: "Can I earn money by posting my room on Takevolet?",
      acceptedAnswer: { "@type": "Answer", text: "Yes! When a new person takes over your room through Takevolet, you earn ₹500–₹1,000 as a handover commission. Posting your room is completely free." },
    },
    {
      "@type": "Question",
      name: "Which areas does Takevolet cover in Hyderabad?",
      acceptedAnswer: { "@type": "Answer", text: "Takevolet covers 90+ areas across Hyderabad including Madhapur, Gachibowli, Kondapur, Kukatpally, KPHB, Ameerpet, SR Nagar, Dilsukhnagar, Uppal, Secunderabad, Begumpet, Hitech City, Miyapur, LB Nagar, and many more." },
    },
    {
      "@type": "Question",
      name: "How much does it cost to unlock a room poster's contact on Takevolet?",
      acceptedAnswer: { "@type": "Answer", text: "Contact unlocks start at just ₹15 per contact. Bundle plans are available: 10 contacts for ₹55, 50 contacts for ₹105, and unlimited contacts for ₹200. All payments are secured by Razorpay." },
    },
    {
      "@type": "Question",
      name: "What is the average rent for rooms in Hyderabad?",
      acceptedAnswer: { "@type": "Answer", text: "Rent varies by area: Madhapur/Gachibowli (₹10,000–₹25,000), KPHB/Kukatpally (₹5,000–₹10,000), SR Nagar/Ameerpet (₹4,500–₹9,000), Dilsukhnagar/Uppal (₹3,500–₹8,000). Family rooms range from ₹12,000–₹40,000 depending on the area and BHK type." },
    },
  ],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Find a Room for Rent in Hyderabad Without Broker",
  description: "A step-by-step guide to finding zero-brokerage rooms for rent in Hyderabad using Takevolet.",
  step: [
    { "@type": "HowToStep", name: "Leaving Your Room?", text: "Post your room with photos, leaving date, rent, advance, and how many members the room allows. It takes 2 minutes." },
    { "@type": "HowToStep", name: "Searching for a Room?", text: "Browse rooms by area, budget, members allowed, furnishing, and gender preference. Filter exactly what you need." },
    { "@type": "HowToStep", name: "Connect Directly", text: "View the poster's profile, profession, and phone number. Call or WhatsApp directly — no middleman, no broker." },
    { "@type": "HowToStep", name: "Earn ₹500–₹1,000", text: "When new tenants take over your room through Takevolet, you earn a referral commission. Easy money while you move out." },
  ],
};

const stats = [
  { value: "5,200+", label: "Bachelors Registered" },
  { value: "₹0", label: "Brokerage Fee" },
  { value: "1,800+", label: "Rooms Handed Over" },
  { value: "2", label: "Major Cities" },
];

const howItWorks = [
  { step: "01", title: "Bachelor Leaving?", desc: "Post your room with photos, leaving date, rent, advance, and how many members the room allows. It takes 2 minutes." },
  { step: "02", title: "Bachelor Searching?", desc: "Browse rooms by area, budget, members allowed, furnishing, and gender preference. Filter exactly what you need." },
  { step: "03", title: "Connect Directly", desc: "View the poster's profile, profession, and phone number. Call or WhatsApp directly — no middleman, no broker." },
  { step: "04", title: "Earn ₹500–₹1,000", desc: "When new bachelors take over your room through Takevolet, you earn a referral commission. Easy money while you move out." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full bg-background">
      <HeroAnimations />

      {/* ━━━ JSON-LD Structured Data (server-rendered, crawlable) ━━━ */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* ━━━ HERO ━━━ */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute top-20 right-20 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] -z-10" />

        <div className="container mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 border border-border px-4 py-1.5 rounded-full mb-8">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Built for Bachelors &amp; Families</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
              Rooms for Rent in Hyderabad.<br />
              <span className="font-bold gold-gradient">Zero Brokerage. Direct Contact.</span>
            </h1>

            <p className="text-lg text-muted-foreground mb-10 leading-relaxed font-light max-w-lg">
              Takevolet connects people <strong className="text-foreground">leaving their rooms</strong> with people <strong className="text-foreground">searching for rooms</strong> — directly, with zero brokerage. Find bachelor rooms, family rooms, flatmates, and used furniture in Hyderabad&apos;s top 90+ areas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/rooms" className="group bg-foreground text-background px-8 py-4 flex items-center justify-center gap-3 font-semibold uppercase tracking-wider text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                Find a Room <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/rooms/family" className="group border-2 border-primary text-primary px-8 py-4 flex items-center justify-center font-semibold uppercase tracking-wider text-sm hover:bg-primary hover:text-primary-foreground transition-all">
                Family Rooms
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
                <p className="text-sm font-semibold">5,200+ bachelors &amp; families</p>
                <p className="text-xs text-muted-foreground">already using Takevolet</p>
              </div>
            </div>
          </div>

          {/* Hero Visual — Client Component */}
          <FeaturedRoomsSection />
        </div>
      </section>

      {/* ━━━ STATS ━━━ */}
      <AnimatedStats stats={stats} />

      {/* ━━━ WHAT IS Takevolet ━━━ */}
      <section className="py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-16 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">What is Takevolet?</p>
            <h2 className="text-4xl font-light leading-tight">
              The platform where <span className="font-bold">people help people</span> find rooms for rent.
            </h2>
            <p className="text-muted-foreground font-light mt-4 max-w-2xl leading-relaxed">
              When a bachelor or family decides to leave their current room — whether it&apos;s a transfer, job change, or just moving on — they post it on Takevolet. New tenants searching for rooms can browse, filter by area/budget/members, and connect directly with the person leaving. Find bachelor rooms, family rooms, 1BHK, 2BHK, 3BHK flats, PG accommodations, and shared rooms across Hyderabad — all with zero brokerage.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {[
              { icon: Home, title: "Rooms for Rent — Bachelor & Family", desc: "Find bachelor rooms and family rooms for rent across Hyderabad. Direct contact with the person leaving the room. Zero brokerage — from 1RK to 3BHK, PG rooms, and shared accommodations." },
              { icon: Users, title: "Flatmate Matchmaking", desc: "Have a vacancy in your flat or looking to share? Connect directly with compatible roommates based on age, profession, and lifestyle. Find flatmates in Madhapur, Gachibowli, Kondapur, and 90+ areas." },
              { icon: ShoppingBag, title: "Used Furniture Marketplace", desc: "Moving out or setting up? Don't carry it or buy brand new. List and shop for furniture, appliances, and electronics directly from nearby tenants in Hyderabad." },
            ].map((f, i) => (
              <div key={i} className="bg-background p-10 group hover:bg-secondary/50 transition-colors">
                <f.icon className="w-10 h-10 text-primary mb-6" strokeWidth={1} />
                <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground font-light leading-relaxed text-sm">{f.desc}</p>
              </div>
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
              <div key={i} className="relative">
                <span className="text-5xl font-bold text-border block mb-4">{item.step}</span>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">{item.desc}</p>
                {i < 3 && <ChevronRight className="hidden md:block absolute top-6 -right-4 w-5 h-5 text-border" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FEATURED FLATMATES — Client Component ━━━ */}
      <FeaturedFlatmatesSection />

      {/* ━━━ SELL YOUR ITEMS ━━━ */}
      <section className="py-28 bg-secondary/30 border-y border-border">
        <div className="container mx-auto px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Leaving? Sell Your Stuff</p>
              <h2 className="text-4xl font-light mb-6">Don&apos;t carry it. <span className="font-bold">Sell it or rent it.</span></h2>
              <p className="text-muted-foreground font-light leading-relaxed mb-8">
                Leaving your fridge, cooler, bed, or TV behind? Instead of selling for scrap, list it on Takevolet&apos;s marketplace. Other tenants moving into your area will happily buy or rent your items at fair prices.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                {["Sell furniture, electronics & appliances at fair prices", "Rent items monthly — passive income while you're away", "Buyers are verified tenants in your neighbourhood", "No transport hassle — items stay in the same room/area"].map((item, i) => (
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
                  <img src={src} alt="Used furniture for sale in Hyderabad" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ AREAS — SSR crawlable internal links ━━━ */}
      <section className="py-28">
        <div className="container mx-auto px-6 md:px-12">
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Neighbourhoods — Rooms for Rent</p>
            <h2 className="text-3xl font-light">Find rooms for rent across <span className="font-bold">Hyderabad.</span></h2>
            <p className="text-muted-foreground font-light mt-3 max-w-2xl text-sm">Browse bachelor rooms, family rooms, 1BHK, 2BHK, PG, and shared accommodations in Hyderabad&apos;s most popular areas. Zero brokerage on every listing.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {HYDERABAD_AREAS.slice(0, 50).map((area) => (
              <Link key={area} href={`/rooms/in/${area.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-border bg-background hover:border-primary hover:text-primary transition-all text-xs font-medium">
                <MapPin size={10} /> Rooms in {area}
              </Link>
            ))}
            <Link href="/rooms" className="inline-flex items-center gap-1.5 px-4 py-2 border border-primary text-primary text-xs font-bold">
              +{HYDERABAD_AREAS.length - 50} more areas →
            </Link>
          </div>
        </div>
      </section>

      {/* ━━━ SEO CONTENT SECTION — Server rendered, crawlable ━━━ */}
      <section className="py-16 border-t border-border bg-secondary/10">
        <div className="container mx-auto px-6 md:px-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold">Rooms for Rent in Hyderabad — Zero Brokerage with Takevolet</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Looking for rooms for rent in Hyderabad? Takevolet is the leading zero-brokerage platform connecting room seekers directly with room owners and current tenants. Whether you need a bachelor room, family room, 1BHK, 2BHK, 3BHK flat, PG accommodation, or shared room, Takevolet covers 90+ areas across Hyderabad and Bangalore.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold mb-3">Popular Areas for Bachelor Rooms</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {["Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "KPHB Colony", "Ameerpet", "SR Nagar", "Dilsukhnagar", "Hitech City", "Begumpet"].map(area => (
                    <li key={area}>
                      <Link href={`/rooms/in/${area.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors">
                        → Bachelor rooms for rent in {area}, Hyderabad
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3">Popular Areas for Family Rooms</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {["Madhapur", "Gachibowli", "Manikonda", "Miyapur", "LB Nagar", "Secunderabad", "Uppal", "Kondapur", "Banjara Hills", "Jubilee Hills"].map(area => (
                    <li key={area}>
                      <Link href={`/rooms/in/${area.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-primary transition-colors">
                        → Family rooms for rent in {area}, Hyderabad
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All listings on Takevolet are direct from current tenants or owners — zero brokerage, always. Unlock poster contact for as low as ₹15. Find your next room in Hyderabad today. Takevolet also offers flatmate matching and a used furniture marketplace for bachelors and families moving in or out of Hyderabad.
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="border-t border-border bg-foreground text-background py-28">
        <div className="container mx-auto px-6 md:px-12 text-center">
          <h2 className="text-4xl md:text-5xl font-light mb-6">
            Looking for a <span className="font-bold italic">Room?</span>
          </h2>
          <p className="text-background/50 mb-10 max-w-xl mx-auto font-light text-lg">
            Whether you&apos;re leaving your room or searching for one — Takevolet is the only zero-brokerage platform you need. Bachelor rooms, family rooms, flatmates, and furniture marketplace. Direct contact. Commission rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/rooms" className="bg-primary text-primary-foreground px-10 py-4 text-sm uppercase tracking-widest font-bold hover:opacity-90 transition-all">
              Find a Room
            </Link>
            <Link href="/rooms/family" className="border border-primary/50 text-primary px-10 py-4 text-sm uppercase tracking-widest font-bold hover:bg-primary hover:text-primary-foreground transition-all">
              Family Rooms
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

      {/* ━━━ UNLOCK CONTACT CTA ━━━ */}
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
              <span className="font-bold text-primary">Starting ₹15 only.</span>
            </h2>
            <p className="text-background/60 font-light max-w-xl mx-auto">
              Browse free. Pay only when you want to call or WhatsApp a poster. Choose any plan below.
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-10">
            {[
              { label: "1 Contact", price: "₹15", sub: "₹15/contact", hot: false },
              { label: "10 Contacts", price: "₹55", sub: "₹5.50/contact", hot: false },
              { label: "50 Contacts", price: "₹105", sub: "₹2.10/contact", hot: true, badge: "Popular" },
              { label: "Unlimited", price: "₹200", sub: "₹0/contact", hot: false, badge: "🔥 Deal" },
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
                {["Starting at ₹15 per contact", "Instant unlock via Razorpay — UPI, Cards, NetBanking", "No house numbers for privacy — colony/area only", "Use contacts across any room on Takevolet"].map((item, i) => (
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
                <img src="/logo.png" alt="Takevolet logo" className="w-10 h-10 rounded-sm" />
                <span className="text-base font-bold tracking-[0.2em] uppercase">Take<span className="text-primary">volet</span></span>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed mb-4">Rooms for rent in Hyderabad. Bachelor &amp; family room handovers, flatmate matching, and furniture marketplace. Zero brokerage.</p>
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
                  ["Family Rooms", "/rooms/family"],
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
                {["Madhapur", "Gachibowli", "Kukatpally", "SR Nagar", "Kondapur", "Ameerpet", "Hitech City", "KPHB Colony"].map(loc => (
                  <Link key={loc} href={`/rooms/in/${loc.toLowerCase().replace(/\s+/g, '-')}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">Rooms in {loc}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4">Legal & Company</h4>
              <div className="flex flex-col gap-2.5">
                {([
                  ["About Us", "/about"],
                  ["Contact Us", "/contact-us"],
                  ["Pricing", "/pricing"],
                  ["Privacy Policy", "/privacy-policy"],
                  ["Terms of Service", "/terms-and-conditions"],
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
            <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-[10px] text-muted-foreground/60">
              {([["Terms of Service", "/terms-and-conditions"], ["Privacy Policy", "/privacy-policy"], ["Refund Policy", "/refund-policy"], ["Pricing", "/pricing"], ["Contact", "/contact-us"]] as [string,string][]).map(([label, href]) => (
                <Link key={label} href={href} className="hover:text-primary transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
