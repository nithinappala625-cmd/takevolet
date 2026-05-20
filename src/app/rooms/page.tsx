"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MOCK_ROOMS } from "@/data/mock";
import { HYDERABAD_AREAS, FURNISHING_OPTIONS, MEMBERS_ALLOWED, BUDGET_RANGES, GENDER_PREFERENCE, PARKING_OPTIONS } from "@/data/locations";
import { MapPin, IndianRupee, Calendar, Users, Sofa, ArrowUpRight, SlidersHorizontal, Search, X, ChevronDown, Eye, UserCheck, Car, Bike, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import type { Room } from "@/lib/db";

// Convert MOCK room to unified Room type for display
function mockToRoom(m: any): Room {
  return {
    id: m.id, user_id: "mock", title: m.title, description: m.description,
    rent: m.rent, advance: m.advance, location: m.location, colony: m.colony,
    leaving_date: m.leavingDate, members_allowed: m.membersAllowed,
    gender_preference: m.genderPreference, furnishing: m.furnishing,
    parking: m.parking, commission: m.commission, has_items: m.hasItems,
    images: m.images, videos: m.videos || [], is_available: m.isAvailable,
    profiles: { full_name: m.postedBy?.name, phone: m.postedBy?.phone, avatar_url: m.postedBy?.avatar, profession: m.postedBy?.profession },
  };
}

export default function RoomsPage() {
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedFurnishing, setSelectedFurnishing] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<number | "">("")
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedParking, setSelectedParking] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Load Supabase rooms first, then append MOCK_ROOMS
  useEffect(() => {
    (async () => {
      setRoomsLoading(true);
      const dbRooms = await fetchAllRoomsAction();
      const mockRooms = MOCK_ROOMS.map(mockToRoom);
      // DB rooms first (real listings), then mocks as demo
      setAllRooms([...dbRooms, ...mockRooms]);
      setRoomsLoading(false);
    })();
  }, []);

  const filteredRooms = allRooms.filter(room => {
    const loc        = room.location || "";
    const furn       = room.furnishing || "";
    const genpref    = room.gender_preference || "Any";
    const park       = room.parking || "";
    const imgs       = room.images || [];
    const desc       = room.description || "";
    const col        = room.colony || "";
    const mAllowed   = room.members_allowed || 2;
    const matchesLocation   = !selectedLocation   || loc === selectedLocation;
    const matchesFurnishing = !selectedFurnishing || furn === selectedFurnishing;
    const matchesMembers    = !selectedMembers    || mAllowed >= Number(selectedMembers);
    const matchesGender     = !selectedGender     || genpref === selectedGender || genpref === "Any";
    const matchesParking    = !selectedParking    || park === selectedParking ||
      (selectedParking === "Bike Parking" && park.includes("Bike")) ||
      (selectedParking === "Car Parking"  && park.includes("Car"));
    const matchesSearch = !searchQuery ||
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesBudget = true;
    if (selectedBudget) {
      const range = BUDGET_RANGES.find(r => r.label === selectedBudget);
      if (range) matchesBudget = room.rent >= range.min && room.rent <= range.max;
    }
    return matchesLocation && matchesFurnishing && matchesMembers && matchesBudget && matchesSearch && matchesGender && matchesParking;
  });

  const activeFilters = [selectedLocation, selectedFurnishing, selectedMembers, selectedBudget, selectedGender, selectedParking].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedLocation(""); setSelectedFurnishing(""); setSelectedMembers("");
    setSelectedBudget(""); setSelectedGender(""); setSelectedParking(""); setSearchQuery("");
  };

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">

        <div className="mb-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Bachelor Rooms</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-light mb-4">
            Room <span className="font-bold">Handovers</span>
          </motion.h1>
          <p className="text-muted-foreground font-light max-w-2xl">
            Bachelors leaving their rooms post here. Click any room to see full photos, videos & details. Contact via ₹1,500 pack.
          </p>
        </div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-3 border border-border p-3">
          <Search size={18} className="text-muted-foreground ml-2" />
          <input type="text" placeholder="Search by area, colony, title..."
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-light py-1" />
          {searchQuery && <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>}
        </motion.div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            <SlidersHorizontal size={16} />
            Filters {activeFilters > 0 && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{activeFilters}</span>}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {activeFilters > 0 && <button onClick={clearFilters} className="text-xs text-primary hover:underline font-medium uppercase tracking-wider">Clear All</button>}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-10">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 border border-border bg-secondary/30">
                {[
                  { label: "Location", value: selectedLocation, onChange: setSelectedLocation, options: HYDERABAD_AREAS, placeholder: "All Areas" },
                  { label: "Budget Range", value: selectedBudget, onChange: setSelectedBudget, options: BUDGET_RANGES.map(r => r.label), placeholder: "Any Budget" },
                  { label: "Members (up to)", value: String(selectedMembers), onChange: (v: string) => setSelectedMembers(v ? Number(v) : ""), options: MEMBERS_ALLOWED.map(String), placeholder: "Any" },
                  { label: "Furnishing", value: selectedFurnishing, onChange: setSelectedFurnishing, options: FURNISHING_OPTIONS, placeholder: "Any Type" },
                  { label: "Gender", value: selectedGender, onChange: setSelectedGender, options: GENDER_PREFERENCE, placeholder: "Any Gender" },
                  { label: "Parking", value: selectedParking, onChange: setSelectedParking, options: PARKING_OPTIONS, placeholder: "Any Parking" },
                ].map((filter, i) => (
                  <div key={i}>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted-foreground">{filter.label}</label>
                    <select value={filter.value} onChange={(e) => filter.onChange(e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer">
                      <option value="">{filter.placeholder}</option>
                      {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {roomsLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8 font-medium">
          {filteredRooms.length} {filteredRooms.length === 1 ? "room" : "rooms"} available
        </p>

        {/* Room Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredRooms.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="group border border-border overflow-hidden hover:border-primary/30 transition-all duration-500">

              <Link href={`/rooms/${room.id}`}>
                <div className="relative h-56 overflow-hidden cursor-pointer">
                  <img src={(room.images || [])[0] || ""} alt={room.title} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <span className="bg-background/90 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1">
                      <MapPin size={12} className="text-primary" /> {room.location}
                    </span>
                    {room.leaving_date && (
                      <span className="bg-background/90 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1">
                        <Calendar size={12} className="text-primary" /> {getDaysLeft(room.leaving_date)} days left
                      </span>
                    )}
                  </div>
                  {(room.commission || 0) > 0 && (
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 text-[11px] uppercase tracking-wider font-bold">
                      ₹{room.commission} reward
                    </div>
                  )}
                  {room.user_id !== "mock" && (
                    <div className="absolute bottom-4 left-4 bg-green-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      New · Just Posted
                    </div>
                  )}
                  {(room.images || []).length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold flex items-center gap-1">
                      <Eye size={12} /> {(room.images || []).length} photos
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <span className="bg-background/90 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-wider">View Details</span>
                  </div>
                </div>
              </Link>

              <div className="p-6">
                <Link href={`/rooms/${room.id}`}>
                  <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1 hover:text-primary transition-colors">{room.title}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                  <MapPin size={10} className="text-primary" /> {room.colony}, {room.location}
                </p>
                <p className="text-sm text-muted-foreground font-light mb-4 line-clamp-2 leading-relaxed">{room.description}</p>

                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
                    <Sofa size={12} /> {room.furnishing}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
                    <Users size={12} /> {room.members_allowed || 2} allowed
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
                    <UserCheck size={12} /> {(room.gender_preference || "Any").split(" ")[0]}
                  </span>
                  {(room.parking || "") !== "No Parking" && (room.parking || "").length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-[11px] font-bold uppercase">
                      {(room.parking || "").includes("Car") ? <Car size={10} /> : <Bike size={10} />} {room.parking}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-medium uppercase">No Parking</span>
                  )}
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-border">
                  <div>
                    <div className="flex items-baseline gap-4 mb-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rent</p>
                        <p className="text-xl font-bold flex items-center"><IndianRupee size={16} />{room.rent.toLocaleString("en-IN")}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Advance</p>
                        <p className="text-sm font-semibold">₹{(room.advance || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {room.profiles?.avatar_url ? (
                      <img src={room.profiles.avatar_url} alt={room.profiles?.full_name || ""} loading="lazy" referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border-2 border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary border-2 border-border flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">{(room.profiles?.full_name || "?")[0]}</span>
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-xs font-bold">{room.profiles?.full_name || "Owner"}</p>
                      <p className="text-[10px] text-muted-foreground">{room.profiles?.profession || ""}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <Link href={`/rooms/${room.id}`} className="flex-1 bg-foreground text-background py-3 text-xs uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all text-center">
                    View Full Details
                  </Link>
                  <Link href={`/rooms/${room.id}`} className="w-12 h-12 border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                    <ArrowUpRight size={18} />
                  </Link>
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Lock size={10} />
                  <span>Contact visible after ₹1,500 unlock (5 contacts)</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-20 border border-border">
              <p className="text-2xl font-light mb-2">No rooms match your filters</p>
              <p className="text-muted-foreground font-light mb-6">Try adjusting your search or filters.</p>
              <button onClick={clearFilters} className="bg-foreground text-background px-8 py-3 text-sm uppercase tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground transition-all">
                Clear All Filters
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
