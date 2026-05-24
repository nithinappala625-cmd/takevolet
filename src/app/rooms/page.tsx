"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HYDERABAD_AREAS, FURNISHING_OPTIONS, MEMBERS_ALLOWED, BUDGET_RANGES, GENDER_PREFERENCE, PARKING_OPTIONS } from "@/data/locations";
import { MapPin, IndianRupee, Calendar, Users, Sofa, ArrowUpRight, SlidersHorizontal, Search, X, ChevronDown, Eye, UserCheck, Car, Bike, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import type { Room } from "@/lib/db";
import RoomCard from "@/components/RoomCard";
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

  // Load Supabase rooms
  useEffect(() => {
    (async () => {
      setRoomsLoading(true);
      const dbRooms = await fetchAllRoomsAction();
      setAllRooms(dbRooms);
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
            <motion.div key={room.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <RoomCard room={room} />
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

        {/* SEO Internal Linking: Popular Areas */}
        <div className="mt-20 pt-10 border-t border-border">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Popular Areas in Hyderabad</h2>
          <div className="flex flex-wrap gap-3">
            {[
              "Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "KPHB", 
              "Ameerpet", "SR Nagar", "Dilsukhnagar", "Uppal", "Secunderabad", 
              "Begumpet", "Hitech City", "Jubilee Hills", "Banjara Hills", 
              "Manikonda", "Nanakramguda", "Miyapur", "LB Nagar", "Attapur", "Tolichowki"
            ].map(area => (
              <Link key={area} href={`/rooms/in/${area.toLowerCase().replace(/\s+/g, '-')}`} 
                className="text-xs bg-secondary/30 px-3 py-1.5 border border-border hover:border-primary hover:text-primary transition-colors">
                Rooms in {area}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
