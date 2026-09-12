"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  Sofa,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Sparkles,
  Smartphone,
  Download,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { fetchAllRoomsAction, fetchAllPropertySalesAction } from "@/lib/server-actions";
import { TopBannerCarousel } from "@/components/TopBannerCarousel";
import { getAllFlatmates } from "@/lib/flatmate-db";
import { MOCK_ROOMS, MOCK_FLATMATES } from "@/data/mock";
import type { Room, PropertySale } from "@/lib/db";
import type { Flatmate } from "@/data/mock";

// Curated properties fallback
const CURATED_PROPERTIES = [
  {
    id: "prop-1",
    title: "Ultra Luxury 3 BHK Lakeview Apartment in Gachibowli",
    location: "Gachibowli, Hyderabad",
    price: 14500000,
    property_type: "Apartment",
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2150,
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80",
    rera: "P02400004921",
    status: "Ready to Move",
  },
  {
    id: "prop-2",
    title: "Gated Community 2 BHK Highrise Flat in Whitefield",
    location: "Whitefield, Bangalore",
    price: 9800000,
    property_type: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1320,
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80",
    rera: "PRM/KA/RERA/1251",
    status: "Under Construction",
  },
  {
    id: "prop-3",
    title: "Premium 4 BHK Independent Villa with Private Lawn",
    location: "Kondapur, Hyderabad",
    price: 32000000,
    property_type: "Villa",
    bedrooms: 4,
    bathrooms: 5,
    sqft: 3800,
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80",
    rera: "P02400002130",
    status: "Ready to Move",
  },
  {
    id: "prop-4",
    title: "Modern 2 BHK Sea-Breeze Flat in Andheri West",
    location: "Andheri West, Mumbai",
    price: 21000000,
    property_type: "Apartment",
    bedrooms: 2,
    bathrooms: 2,
    sqft: 980,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80",
    rera: "P51800028911",
    status: "Ready to Move",
  },
  {
    id: "prop-5",
    title: "Corner Residential Plot (200 Sq Yds) in Hinjewadi",
    location: "Hinjewadi, Pune",
    price: 6500000,
    property_type: "Plot",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 1800,
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop&q=80",
    rera: "Approved Layout",
    status: "Immediate Registration",
  },
];

// Curated PGs fallback
const CURATED_PGS = [
  {
    id: "pg-1",
    title: "Zolo Stays Luxury Co-Living & PG (Single & Double Sharing)",
    location: "Madhapur, Hyderabad",
    city: "Hyderabad",
    rent: 9500,
    sharing: "Double Sharing",
    gender: "Unisex / Co-ed",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop&q=80",
    amenities: ["3 Times Food", "High-speed Wi-Fi", "AC", "Gym", "Housekeeping"],
  },
  {
    id: "pg-2",
    title: "Sri Sai Executive Boys PG & Hostel Near Cyber Towers",
    location: "Hitech City, Hyderabad",
    city: "Hyderabad",
    rent: 8000,
    sharing: "Triple Sharing",
    gender: "Boys Only",
    image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&h=600&fit=crop&q=80",
    amenities: ["South & North Food", "Wi-Fi", "Washing Machine", "Power Backup"],
  },
  {
    id: "pg-3",
    title: "Stanza Living Premium Girls PG & Co-Living Space",
    location: "Koramangala, Bangalore",
    city: "Bangalore",
    rent: 12500,
    sharing: "Double Sharing",
    gender: "Girls Only",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop&q=80",
    amenities: ["Chef Prepared Meals", "AC", "Biometric Entry", "Housekeeping"],
  },
  {
    id: "pg-4",
    title: "TechZone Co-Living PG Near EON Free Zone",
    location: "Kharadi, Pune",
    city: "Pune",
    rent: 8500,
    sharing: "Double Sharing",
    gender: "Unisex / Co-ed",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=600&fit=crop&q=80",
    amenities: ["Food Included", "Wi-Fi", "Geyser", "RO Water"],
  },
];

function adaptMockRooms(mockList: any[]): Room[] {
  return mockList.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    rent: m.rent,
    advance: m.advance,
    location: m.location,
    colony: m.colony,
    leaving_date: m.leavingDate,
    members_allowed: m.membersAllowed,
    furnishing: m.furnishing,
    gender_preference: m.genderPreference,
    current_members: m.currentMembers,
    parking: m.parking,
    images: m.images || [],
    videos: m.videos || [],
    commission: m.commission || 0,
    has_items: m.hasItems || false,
    items: m.items || [],
    furniture: m.furniture || [],
    amenities: m.amenities || [],
    is_available: m.isAvailable !== false,
    user_id: "mock-user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: m.postedBy
      ? {
          full_name: m.postedBy.name,
          phone: m.postedBy.phone,
          whatsapp: m.postedBy.whatsapp,
          avatar_url: m.postedBy.avatar,
          profession: m.postedBy.profession,
        }
      : undefined,
  })) as unknown as Room[];
}

export function HeroVisual() {
  const [heroRoom, setHeroRoom] = useState<Room | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const roomsRes = await fetchAllRoomsAction();
        const availableFromDb = (roomsRes && Array.isArray(roomsRes)) ? roomsRes.filter((r) => r.is_available) : [];
        const mockFallback = adaptMockRooms(MOCK_ROOMS);
        setHeroRoom(availableFromDb[0] || mockFallback[0]);
      } catch {
        setHeroRoom(adaptMockRooms(MOCK_ROOMS)[0]);
      }
    }
    load();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative h-[280px] sm:h-[340px] md:h-[480px] mt-8 lg:mt-0 rounded-2xl overflow-hidden shadow-2xl border border-border"
    >
      {heroRoom ? (
        <>
          <div className="absolute inset-0 overflow-hidden bg-slate-950">
            <img
              src={heroRoom.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&q=80"}
              alt={heroRoom.title}
              loading="eager"
              className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent" />
          </div>
          <div className="absolute bottom-5 left-5 right-5 bg-background/95 backdrop-blur-xl border border-border p-5 rounded-xl shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                  <Sparkles size={11} /> Featured Direct Handover
                </div>
                <h4 className="font-bold text-sm sm:text-base line-clamp-1 text-foreground">{heroRoom.title}</h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg sm:text-xl font-black text-primary">
                  ₹{heroRoom.rent.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-muted-foreground block font-normal">/ month</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <MapPin size={13} className="text-primary" /> {heroRoom.colony ? `${heroRoom.colony}, ` : ""}{heroRoom.location}
              </span>
              {heroRoom.leaving_date && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> Leaving {new Date(heroRoom.leaving_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                  </span>
                </>
              )}
              {(heroRoom.commission || 0) > 0 && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 font-bold">₹{heroRoom.commission} Handover Reward</span>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 animate-pulse flex flex-col justify-end p-6 bg-secondary/50">
          <div className="bg-background border border-border p-5 w-full rounded-xl" />
        </div>
      )}
    </motion.div>
  );
}

export function FeaturedRoomsSection() {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const roomsRes = await fetchAllRoomsAction();
        const availableFromDb = (roomsRes && Array.isArray(roomsRes)) ? roomsRes.filter((r) => r.is_available) : [];
        const mockFallback = adaptMockRooms(MOCK_ROOMS);
        const existingIds = new Set(availableFromDb.map((r) => r.id));
        const combined = [...availableFromDb, ...mockFallback.filter((m) => !existingIds.has(m.id))];
        setAllRooms(combined);
      } catch (err) {
        console.error("Failed to load featured rooms:", err);
        setAllRooms(adaptMockRooms(MOCK_ROOMS));
      }
    }
    load();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const filteredRooms = allRooms.filter((r) => {
    if (activeCategory === "All") return true;
    if (activeCategory === "Bachelors") {
      const gen = (r.gender_preference || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const title = (r.title || "").toLowerCase();
      return gen.includes("bachelor") || desc.includes("bachelor") || title.includes("bachelor") || (r.tenant_type === "bachelor");
    }
    if (activeCategory === "Families") {
      const gen = (r.gender_preference || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const title = (r.title || "").toLowerCase();
      return gen.includes("family") || desc.includes("family") || title.includes("family") || (r.tenant_type === "family");
    }
    if (activeCategory === "1 BHK / 1 RK") {
      const title = (r.title || "").toLowerCase();
      return title.includes("1bhk") || title.includes("1 bhk") || title.includes("1rk") || title.includes("1 rk");
    }
    if (activeCategory === "2+ BHK") {
      const title = (r.title || "").toLowerCase();
      return title.includes("2bhk") || title.includes("2 bhk") || title.includes("3bhk") || title.includes("3 bhk");
    }
    if (activeCategory === "Furnished") {
      const furn = (r.furnishing || "").toLowerCase();
      return furn.includes("furnished");
    }
    return true;
  });

  return (
    <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6 md:px-12">
          {/* Section Header with Left/Right Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">
                <Home size={14} /> Zero Brokerage Rooms & Flats
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-light">
                Explore Available <span className="font-bold">Rooms & Handovers</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light">
                Scroll horizontally to browse all live bachelor rooms, 1BHK/2BHK flats, and handovers across top areas.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/rooms"
                className="text-xs uppercase tracking-wider font-bold text-primary hover:underline flex items-center gap-1 mr-2"
              >
                View All ({allRooms.length}) <ArrowRight size={14} />
              </Link>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
            {["All", "Bachelors", "Families", "1 BHK / 1 RK", "2+ BHK", "Furnished"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Horizontally Scrollable Cards Container */}
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 md:-mx-12 md:px-12"
          >
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="min-w-[280px] sm:min-w-[320px] md:min-w-[340px] max-w-[340px] shrink-0 snap-start border border-border bg-card rounded-2xl overflow-hidden group hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                {/* Image */}
                <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-900">
                  <img
                    src={room.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&q=80"}
                    alt={room.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-lg flex items-center gap-1 text-foreground border border-border">
                    <MapPin size={11} className="text-primary" /> {room.colony || room.location}
                  </div>
                  {(room.commission || 0) > 0 && (
                    <div className="absolute top-3 right-3 bg-emerald-600 text-white px-2.5 py-1 text-[10px] uppercase tracking-wider font-black rounded-lg shadow-sm">
                      ₹{room.commission} reward
                    </div>
                  )}
                  {room.images && room.images.length > 1 && (
                    <span className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      +{room.images.length} photos
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-1 text-card-foreground group-hover:text-primary transition-colors">
                      {room.title}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="px-2.5 py-1 bg-secondary text-[10px] font-semibold rounded-lg flex items-center gap-1 text-muted-foreground">
                        <Users size={11} /> {room.members_allowed || 1} allowed
                      </span>
                      <span className="px-2.5 py-1 bg-secondary text-[10px] font-semibold rounded-lg flex items-center gap-1 text-muted-foreground">
                        <Sofa size={11} /> {room.furnishing}
                      </span>
                      {room.gender_preference && (
                        <span className="px-2.5 py-1 bg-secondary text-[10px] font-semibold rounded-lg text-muted-foreground">
                          {room.gender_preference}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-primary flex items-center">
                        ₹{room.rent.toLocaleString("en-IN")}
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">/mo</span>
                      </span>
                      {Boolean(room.advance && room.advance > 0) && (
                        <span className="text-[10px] text-muted-foreground block">
                          Adv: ₹{(room.advance || 0).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
  );
}

export function FeaturedFlatmatesSection() {
  const [allFlatmates, setAllFlatmates] = useState<Flatmate[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const fms = await getAllFlatmates();
        const available = fms.filter((f) => f.isAvailable);
        setAllFlatmates(available.length > 0 ? available : MOCK_FLATMATES);
      } catch (e) {
        console.error("Failed to load flatmates:", e);
        setAllFlatmates(MOCK_FLATMATES);
      }
    }
    load();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-secondary/15 border-t border-border">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header with Left/Right Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">
              <Users size={14} /> Roommate Matching Network
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light">
              Find Verified <span className="font-bold">Flatmates & Vacancies</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light max-w-xl">
              Connect with working professionals and students who have an open room vacancy in their flat. Zero brokerage.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/flatmates"
              className="text-xs uppercase tracking-wider font-bold text-primary hover:underline flex items-center gap-1 mr-2"
            >
              Browse All ({allFlatmates.length}) <ArrowRight size={14} />
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Flatmates Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 md:-mx-12 md:px-12"
        >
          {allFlatmates.map((fm) => (
            <div
              key={fm.id}
              className="min-w-[290px] sm:min-w-[330px] md:min-w-[360px] max-w-[360px] shrink-0 snap-start border border-border bg-card rounded-2xl overflow-hidden group hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Photo & Badge */}
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-900">
                <img
                  src={fm.images?.[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop&q=80"}
                  alt={fm.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold text-primary border border-primary/20 rounded-lg">
                  Vacancy: {fm.vacancyCount}
                </div>
                <div className="absolute top-3 right-3 bg-foreground text-background px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold rounded-lg shadow-sm">
                  {fm.genderPref}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90 mb-0.5 flex items-center gap-1">
                    <MapPin size={11} className="text-primary" /> {fm.location}
                  </p>
                  <h3 className="font-bold text-sm line-clamp-1">{fm.title}</h3>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <div>
                      <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
                        Rent Share
                      </span>
                      <span className="font-black text-base sm:text-lg text-primary flex items-center">
                        ₹{fm.rentShare.toLocaleString("en-IN")}
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">/mo</span>
                      </span>
                    </div>
                    {fm.postedBy && (
                      <div className="flex items-center gap-2">
                        <img
                          src={fm.postedBy.avatar || `https://i.pravatar.cc/80?u=${fm.id}`}
                          alt={fm.postedBy.name}
                          className="w-8 h-8 rounded-full object-cover border border-primary/30"
                        />
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-foreground leading-none">{fm.postedBy.name}</p>
                          <p className="text-[9px] text-muted-foreground leading-none mt-1">
                            {fm.postedBy.profession ? fm.postedBy.profession.split(" at ")[0] : "Professional"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-light text-muted-foreground line-clamp-2 leading-relaxed">
                    {fm.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {fm.lifestyleHabits?.slice(0, 2).map((tag, idx) => (
                      <span key={idx} className="bg-secondary px-2 py-0.5 text-[9px] font-medium text-foreground/80 rounded-md">
                        {tag}
                      </span>
                    ))}
                    {fm.lifestyleHabits && fm.lifestyleHabits.length > 2 && (
                      <span className="bg-secondary/40 px-2 py-0.5 text-[9px] text-muted-foreground rounded-md">
                        +{fm.lifestyleHabits.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-3 mt-3 flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Prefers: <strong className="text-foreground">{fm.professionPref || "Anyone"}</strong>
                  </span>
                  <Link
                    href={`/flatmates/${fm.id}`}
                    className="text-xs text-primary font-bold uppercase tracking-wider hover:underline"
                  >
                    View Flatmate →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedPropertiesSection() {
  const [properties, setProperties] = useState<PropertySale[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const dbProps = await fetchAllPropertySalesAction();
        if (dbProps && dbProps.length > 0) {
          setProperties(dbProps);
        } else {
          setProperties(CURATED_PROPERTIES as unknown as PropertySale[]);
        }
      } catch {
        setProperties(CURATED_PROPERTIES as unknown as PropertySale[]);
      }
    }
    load();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const displayList = properties.length > 0 ? properties : (CURATED_PROPERTIES as unknown as PropertySale[]);

  return (
    <section className="py-20 border-t border-border">
      <div className="container mx-auto px-6 md:px-12">
        {/* Header with Left/Right Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">
              <Building2 size={14} /> Properties For Sale
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light">
              Verified <span className="font-bold">Homes, Villas &amp; Plots</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light max-w-xl">
              Buy directly from verified property owners and top RERA builders with 0% brokerage across major Indian hubs.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/properties"
              className="text-xs uppercase tracking-wider font-bold text-primary hover:underline flex items-center gap-1 mr-2"
            >
              Browse All ({displayList.length}) <ArrowRight size={14} />
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Properties Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 md:-mx-12 md:px-12"
        >
          {displayList.map((prop: any) => {
            const price = prop.expected_price || prop.price || 0;
            const formattedPrice =
              price >= 10000000
                ? `₹${(price / 10000000).toFixed(2)} Cr`
                : price >= 100000
                ? `₹${(price / 100000).toFixed(2)} Lakh`
                : `₹${price.toLocaleString("en-IN")}`;
            const imgUrl =
              prop.images?.[0] || prop.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80";

            return (
              <div
                key={prop.id}
                className="min-w-[280px] sm:min-w-[320px] md:min-w-[340px] max-w-[340px] shrink-0 snap-start border border-border bg-card rounded-2xl overflow-hidden group hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-950">
                  <img
                    src={imgUrl}
                    alt={prop.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold rounded-lg flex items-center gap-1 text-foreground border border-border">
                    <MapPin size={11} className="text-primary" /> {prop.location}
                  </div>
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 text-[10px] font-black rounded-lg shadow-sm">
                    {prop.property_type || "Apartment"}
                  </div>
                  <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {prop.bedrooms ? `${prop.bedrooms} BHK` : "Plots / Land"}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-1 text-card-foreground group-hover:text-primary transition-colors">
                      {prop.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {prop.description || `${prop.property_type || "Property"} in prime location with modern amenities, zero brokerage direct deal.`}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border flex items-center justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground block font-medium">Expected Price</span>
                      <span className="text-lg font-black text-primary">{formattedPrice}</span>
                    </div>
                    <Link
                      href={`/properties/${prop.id}`}
                      className="bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                    >
                      View Property
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FeaturedPGsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-secondary/15 border-t border-border">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary font-bold mb-2">
              <Zap size={14} /> PGs &amp; Hostels
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light">
              Popular <span className="font-bold">PGs &amp; Co-Living Stays</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-light max-w-xl">
              Fully-managed accommodations with Wi-Fi, food, housekeeping, and no brokerage across tech corridors.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/pgs"
              className="text-xs uppercase tracking-wider font-bold text-primary hover:underline flex items-center gap-1 mr-2"
            >
              View All PGs ({CURATED_PGS.length}) <ArrowRight size={14} />
            </Link>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-xl border border-border hover:border-primary bg-background hover:bg-primary/10 text-foreground hover:text-primary flex items-center justify-center transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal PGs Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 md:-mx-12 md:px-12"
        >
          {CURATED_PGS.map((pg) => (
            <div
              key={pg.id}
              className="min-w-[280px] sm:min-w-[320px] md:min-w-[340px] max-w-[340px] shrink-0 snap-start border border-border bg-card rounded-2xl overflow-hidden group hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-950">
                <img
                  src={pg.image}
                  alt={pg.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold rounded-lg flex items-center gap-1 text-foreground border border-border">
                  <MapPin size={11} className="text-primary" /> {pg.location}
                </div>
                <div className="absolute top-3 right-3 bg-foreground text-background px-2.5 py-1 text-[9px] uppercase tracking-wider font-bold rounded-lg shadow-sm">
                  {pg.gender}
                </div>
                <div className="absolute bottom-2.5 left-2.5 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {pg.sharing}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base mb-2 line-clamp-1 text-card-foreground group-hover:text-primary transition-colors">
                    {pg.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pg.amenities.slice(0, 3).map((am, i) => (
                      <span key={i} className="px-2 py-0.5 bg-secondary text-[9px] font-medium text-muted-foreground rounded-md flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" /> {am}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block font-medium">Starting From</span>
                    <span className="text-lg font-black text-primary">₹{pg.rent.toLocaleString("en-IN")}<span className="text-[10px] text-muted-foreground font-normal ml-1">/mo</span></span>
                  </div>
                  <Link
                    href="/pgs"
                    className="bg-primary text-primary-foreground hover:opacity-90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                  >
                    View PG
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DownloadAppSection() {
  return (
    <section className="py-20 border-t border-border bg-gradient-to-b from-background via-secondary/20 to-background overflow-hidden relative">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="bg-gradient-to-br from-primary/10 via-card to-background border border-primary/25 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
          {/* Glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary tracking-wide">
                <Smartphone size={14} /> Takevolet Mobile App
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                Download Our App for a{" "}
                <span className="text-primary gold-gradient">10x Faster</span> Experience.
              </h2>

              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                Never miss an urgent room handover. Get instant push notifications whenever a bachelor leaves a room in your locality, chat with owners directly on WhatsApp in 1 tap, and enjoy clean browsing with zero watermarks.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2 text-xs font-medium text-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Real-time instant room alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>1-Tap WhatsApp owner connect</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>100% Zero Brokerage Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Offline bookmarks & saved rooms</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                {/* Official Google Play Store Link - Primary Action */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.takevolet.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-950 hover:bg-black text-white px-6 py-3 rounded-2xl flex items-center gap-3 border border-slate-700 shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] cursor-pointer group"
                >
                  <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M3.609 1.814L13.793 12 3.61 22.186a2.41 2.41 0 0 1-.61-1.686V3.5a2.41 2.41 0 0 1 .609-1.686z"
                    />
                    <path
                      fill="#FBBC04"
                      d="M17.382 8.412L14.852 10.942 4.692 1.254c.2-.07.42-.11.65-.11.67 0 1.28.27 1.73.71l10.31 6.558z"
                    />
                    <path
                      fill="#4285F4"
                      d="M14.852 13.058l2.53 2.53-10.31 6.558c-.45.44-1.06.71-1.73.71-.23 0-.45-.04-.65-.11l10.16-9.688z"
                    />
                    <path
                      fill="#34A853"
                      d="M20.532 10.23l-3.15-1.818-2.53 2.53 2.53 2.53 3.15-1.818c1.07-.618 1.07-1.624 0-2.242z"
                    />
                  </svg>
                  <div className="text-left">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-slate-300 leading-tight">GET IT ON</span>
                    <span className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-1.5">
                      Google Play <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform text-primary" />
                    </span>
                  </div>
                </a>

                {/* Direct APK Download Alternative */}
                <a
                  href="/takevolet.apk"
                  download="takevolet-app.apk"
                  className="border border-border bg-card hover:bg-secondary text-foreground px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Download size={16} className="text-primary" /> Direct APK (8.4 MB)
                </a>
              </div>

              <p className="text-[11px] text-muted-foreground font-light flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                Available directly on Google Play Store for all Android devices. Verified, fast &amp; completely free.
              </p>
            </div>

            {/* Right Phone Mockup Preview */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-[280px] sm:w-[320px] rounded-[38px] border-4 border-slate-700 bg-slate-950 p-3 shadow-2xl shadow-primary/20">
                {/* Phone Notch */}
                <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-700 mr-2" />
                  <div className="w-10 h-1 rounded-full bg-slate-700" />
                </div>

                {/* Inner Screen */}
                <div className="rounded-[28px] overflow-hidden bg-background border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                        T
                      </div>
                      <span className="font-black text-xs text-foreground">Takevolet</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                      ● Live Feed
                    </span>
                  </div>

                  <div className="bg-secondary/50 rounded-xl p-2.5 text-[11px] space-y-1">
                    <span className="text-[9px] text-primary font-bold uppercase tracking-wider block">🔔 New Handover 2m ago</span>
                    <p className="font-bold text-foreground">2 BHK Flat in Madhapur</p>
                    <p className="text-muted-foreground text-[10px]">₹14,000/mo · 2 Bachelors Leaving</p>
                  </div>

                  <div className="aspect-[16/10] rounded-xl overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&h=350&fit=crop&q=80"
                      alt="App mockup listing"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] font-bold px-2 py-0.5 rounded">
                      Zero Watermark HD
                    </span>
                  </div>

                  <a
                    href="https://play.google.com/store/apps/details?id=com.takevolet.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-primary text-primary-foreground text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
                  >
                    Install on Google Play
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HeroAnimations() {
  return (
    <>
      <TopBannerCarousel />
    </>
  );
}

export function AnimatedStats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section className="border-y border-border bg-secondary/30">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className={`py-8 sm:py-10 text-center ${
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
  );
}

export function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay }} className={className}>
      {children}
    </motion.div>
  );
}
