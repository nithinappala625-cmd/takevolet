"use client";

import { motion } from "framer-motion";
import { CITIES, getAreas, BUDGET_RANGES } from "@/data/locations";
import { MapPin, Users, SlidersHorizontal, Search, X, Loader2, Hotel, ShieldCheck, Sparkles, Phone, Wifi } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import type { Room } from "@/lib/db";
import RoomCard from "@/components/RoomCard";

const PG_TYPES = ["All PGs", "Mens PG", "Womens PG", "Coliving / Unisex"];

export default function PgsPage() {
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedPgType, setSelectedPgType] = useState("All PGs");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const dbRooms = await fetchAllRoomsAction();
      setAllRooms(dbRooms);
      setLoading(false);
    })();
  }, []);

  const pgs = allRooms.filter((room) => {
    const isPg = room.tenant_type === "pg" || (room as any).listing_type === "pg";
    if (!isPg) return false;

    const loc = room.location || "";
    const col = room.colony || "";
    const roomCity = room.city || "Hyderabad";
    const genpref = room.gender_preference || "Any";

    const matchesCity = roomCity === selectedCity;
    const matchesLocation = !selectedLocation || loc === selectedLocation;

    let matchesPgType = true;
    if (selectedPgType === "Mens PG") {
      matchesPgType = genpref === "Male" || genpref === "Boys" || room.title.toLowerCase().includes("men") || room.title.toLowerCase().includes("boy");
    } else if (selectedPgType === "Womens PG") {
      matchesPgType = genpref === "Female" || genpref === "Girls" || room.title.toLowerCase().includes("women") || room.title.toLowerCase().includes("girl");
    } else if (selectedPgType === "Coliving / Unisex") {
      matchesPgType = genpref === "Any" || room.title.toLowerCase().includes("coliving") || room.title.toLowerCase().includes("co-ed");
    }

    let matchesBudget = true;
    if (selectedBudget) {
      const range = BUDGET_RANGES.find((r) => r.label === selectedBudget);
      if (range) matchesBudget = room.rent >= range.min && room.rent <= range.max;
    }

    const matchesSearch =
      !searchQuery ||
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesLocation && matchesPgType && matchesBudget && matchesSearch;
  });

  const clearFilters = () => {
    setSelectedCity("Hyderabad");
    setSelectedLocation("");
    setSelectedPgType("All PGs");
    setSelectedBudget("");
    setSearchQuery("");
  };

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        {/* Navigation Category Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-secondary/60 p-1.5 rounded-full inline-flex border border-border backdrop-blur-sm shadow-sm gap-1 flex-wrap justify-center">
            <Link
              href="/rooms"
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Rooms & Flats
            </Link>
            <span className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-white shadow-md">
              PGs & Hostels
            </span>
            <Link
              href="/day-wise"
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Day-Wise Stays
            </Link>
            <Link
              href="/flatmates"
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              Flatmates
            </Link>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-10 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="inline-flex items-center gap-2 border border-primary/30 px-3.5 py-1 rounded-full mb-4 bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase"
          >
            <Hotel size={13} />
            Verified PGs &amp; Hostels
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light mb-4"
          >
            Find PGs with <span className="font-bold text-primary">Zero Brokerage</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto font-light">
            Mens PG, Womens PG, and Premium Coliving Hostels across Hyderabad, Bengaluru, Pune, Mumbai &amp; major cities. Direct owner &amp; warden contacts.
          </p>
        </div>

        {/* PG Type Selector */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {PG_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedPgType(type)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                selectedPgType === type
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/25"
                  : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-secondary/40 border border-border p-4 mb-8 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search colony, area or PG name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-background border border-border rounded-xl text-xs focus:border-primary outline-none"
              />
            </div>

            {/* City Select */}
            <div>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedLocation("");
                }}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs focus:border-primary outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Area Select */}
            <div>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs focus:border-primary outline-none"
              >
                <option value="">All Areas in {selectedCity}</option>
                {getAreas(selectedCity).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <select
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs focus:border-primary outline-none"
              >
                <option value="">Any Monthly Budget</option>
                {BUDGET_RANGES.map((b) => (
                  <option key={b.label} value={b.label}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || selectedLocation || selectedBudget || selectedPgType !== "All PGs") && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Showing {pgs.length} matching PGs</span>
              <button onClick={clearFilters} className="text-primary hover:underline flex items-center gap-1 font-semibold">
                <X size={13} /> Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading verified PGs &amp; hostels...</p>
          </div>
        ) : pgs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pgs.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="border border-border p-12 text-center rounded-2xl bg-secondary/20 max-w-lg mx-auto">
            <Hotel size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold mb-1">No PGs Found</h3>
            <p className="text-xs text-muted-foreground mb-6">
              No PG listings matched your current filters in {selectedCity}. Try selecting a different area or budget.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl shadow-md"
              >
                Clear Filters
              </button>
              <Link
                href="/post/room"
                className="px-5 py-2.5 border border-border hover:border-primary text-xs font-semibold rounded-xl"
              >
                List Your PG Here
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
