"use client";

import { motion } from "framer-motion";
import { CITIES, getAreas } from "@/data/locations";
import { MapPin, SlidersHorizontal, Search, X, Loader2, CalendarDays, ShieldCheck, Sparkles, Clock, Compass } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchAllRoomsAction } from "@/lib/server-actions";
import type { Room } from "@/lib/db";
import RoomCard from "@/components/RoomCard";

const DAILY_BUDGET_RANGES = [
  { label: "Under ₹500/day", min: 0, max: 500 },
  { label: "₹500 - ₹1,000/day", min: 500, max: 1000 },
  { label: "₹1,000 - ₹2,000/day", min: 1000, max: 2000 },
  { label: "₹2,000+/day", min: 2000, max: 50000 },
];

export default function DayWisePage() {
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  const dayWiseStays = allRooms.filter((room) => {
    const isDayWise = room.tenant_type === "day_wise" || (room as any).listing_type === "day_wise";
    if (!isDayWise) return false;

    const loc = room.location || "";
    const col = room.colony || "";
    const roomCity = room.city || "Hyderabad";

    const matchesCity = roomCity === selectedCity;
    const matchesLocation = !selectedLocation || loc === selectedLocation;

    let matchesBudget = true;
    if (selectedBudget) {
      const range = DAILY_BUDGET_RANGES.find((r) => r.label === selectedBudget);
      if (range) matchesBudget = room.rent >= range.min && room.rent <= range.max;
    }

    const matchesSearch =
      !searchQuery ||
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCity && matchesLocation && matchesBudget && matchesSearch;
  });

  const clearFilters = () => {
    setSelectedCity("Hyderabad");
    setSelectedLocation("");
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
            <Link
              href="/pgs"
              className="px-4 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
            >
              PGs & Hostels
            </Link>
            <span className="px-4 py-2 rounded-full text-xs font-bold bg-primary text-white shadow-md">
              Day-Wise Stays
            </span>
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
            <CalendarDays size={13} />
            Flexible Daily &amp; Hourly Stays
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light mb-4"
          >
            Day-Wise Stays with <span className="font-bold text-primary">Zero Brokerage</span>
          </motion.h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto font-light">
            Stay by the day or week without hefty deposits or lock-ins. Direct host verification in Hyderabad, Bengaluru, Pune, Mumbai and more.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-secondary/40 border border-border p-4 mb-8 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search colony, area or stay title..."
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
          </div>

          {(searchQuery || selectedLocation || selectedBudget) && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Showing {dayWiseStays.length} matching stays</span>
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
            <p className="text-xs text-muted-foreground">Loading day-wise stays...</p>
          </div>
        ) : dayWiseStays.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dayWiseStays.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="border border-border p-12 text-center rounded-2xl bg-secondary/20 max-w-lg mx-auto">
            <CalendarDays size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-bold mb-1">No Day-Wise Stays Found</h3>
            <p className="text-xs text-muted-foreground mb-6">
              No day-wise stays currently matched your filters in {selectedCity}. Check back soon or list your own space!
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
                List Day-Wise Stay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
