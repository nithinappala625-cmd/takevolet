"use client";

import { motion, AnimatePresence } from "framer-motion";
import { HYDERABAD_AREAS, BUDGET_RANGES } from "@/data/locations";
import { MapPin, IndianRupee, Users, SlidersHorizontal, Search, X, ChevronDown, Loader2, Award, Briefcase, Heart, Check, Plus } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getAllFlatmates } from "@/lib/flatmate-db";
import type { Flatmate } from "@/data/mock";

const PROFESSION_PREFS = ["Any", "Software Professional", "Working Professional", "Aspirant / Student preferred"];
const GENDER_PREFS = ["Any", "Male Bachelors Only", "Female Bachelors Only"];
const LIFESTYLE_HABITS_LIST = [
  "Veg Only preferred",
  "Non-smoker preferred",
  "No drinking inside",
  "Veg/Non-Veg friendly",
  "Quiet hours after 11 PM",
  "Night Owl",
  "Early Bird",
  "No Smoking",
  "No Alcohol",
  "Visitor friendly",
];

export default function FlatmatesPage() {
  const [flatmates, setFlatmates] = useState<Flatmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Filter states
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("");
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getAllFlatmates();
        setFlatmates(data);
      } catch (err) {
        console.error("Error loading flatmates:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleHabitToggle = (habit: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]
    );
  };

  const filteredFlatmates = flatmates.filter((fm) => {
    const matchesLocation = !selectedLocation || fm.location === selectedLocation;
    const matchesGender =
      !selectedGender ||
      fm.genderPref.toLowerCase().includes(selectedGender.toLowerCase()) ||
      fm.genderPref === "Any";
    const matchesProfession =
      !selectedProfession ||
      fm.professionPref.toLowerCase().includes(selectedProfession.toLowerCase()) ||
      fm.professionPref === "Any";

    // Budget match
    let matchesBudget = true;
    if (selectedBudget) {
      const range = BUDGET_RANGES.find((r) => r.label === selectedBudget);
      if (range) {
        matchesBudget = fm.rentShare >= range.min && fm.rentShare <= range.max;
      }
    }

    // Habits match (all selected habits must be met or matched)
    const matchesHabits =
      selectedHabits.length === 0 ||
      selectedHabits.every((habit) =>
        fm.lifestyleHabits.some((fmHabit) =>
          fmHabit.toLowerCase().includes(habit.toLowerCase())
        )
      );

    // Search query match
    const matchesSearch =
      !searchQuery ||
      fm.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fm.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fm.colony.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fm.postedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fm.postedBy.profession.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      matchesLocation &&
      matchesGender &&
      matchesProfession &&
      matchesBudget &&
      matchesHabits &&
      matchesSearch
    );
  });

  const activeFilters =
    [selectedLocation, selectedBudget, selectedGender, selectedProfession].filter(Boolean).length +
    selectedHabits.length;

  const clearFilters = () => {
    setSelectedLocation("");
    setSelectedBudget("");
    setSelectedGender("");
    setSelectedProfession("");
    setSelectedHabits([]);
    setSearchQuery("");
  };

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        {/* Title Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="inline-flex items-center gap-2 border border-primary/30 px-3.5 py-1 rounded-full mb-4 bg-primary/5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-primary">
                Premium Matchmaking
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-light mb-4"
            >
              Find Compatible <span className="font-bold">Flatmates</span>
            </motion.h1>
            <p className="text-muted-foreground font-light max-w-2xl">
              Have an extra room or looking to join a flat? Browse verified roommate listings in Hyderabad. Filter by budget, profession compatibility, and lifestyle habits.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="shrink-0"
          >
            <Link
              href="/post/flatmate"
              className="bg-primary text-primary-foreground px-6 py-3.5 text-sm uppercase tracking-wider font-bold hover:bg-primary/95 transition-all shadow-[0_4px_20px_rgba(212,175,55,0.25)] flex items-center gap-2 inline-flex"
            >
              List Vacancy <Plus size={16} />
            </Link>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-3 border border-border p-3.5 bg-background shadow-sm hover:border-primary/50 transition-colors"
        >
          <Search size={18} className="text-muted-foreground ml-2" />
          <input
            type="text"
            placeholder="Search roommate listings by area, profession, lifestyle, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm font-light py-1"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </motion.div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filters {activeFilters > 0 && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{activeFilters}</span>}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="text-xs text-primary hover:underline font-medium uppercase tracking-wider"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-10"
            >
              <div className="p-6 border border-border bg-secondary/20 space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: "Area Location",
                      value: selectedLocation,
                      onChange: setSelectedLocation,
                      options: HYDERABAD_AREAS,
                      placeholder: "All Areas",
                    },
                    {
                      label: "Budget Range (Share)",
                      value: selectedBudget,
                      onChange: setSelectedBudget,
                      options: BUDGET_RANGES.map((r) => r.label),
                      placeholder: "Any Budget",
                    },
                    {
                      label: "Gender Preference",
                      value: selectedGender,
                      onChange: setSelectedGender,
                      options: GENDER_PREFS,
                      placeholder: "Any Gender",
                    },
                    {
                      label: "Profession Preference",
                      value: selectedProfession,
                      onChange: setSelectedProfession,
                      options: PROFESSION_PREFS,
                      placeholder: "Any Profession",
                    },
                  ].map((filter, i) => (
                    <div key={i}>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2 text-muted-foreground">
                        {filter.label}
                      </label>
                      <select
                        value={filter.value}
                        onChange={(e) => filter.onChange(e.target.value)}
                        className="w-full bg-background border border-border px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors cursor-pointer"
                      >
                        <option value="">{filter.placeholder}</option>
                        {filter.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Habits Multi-select */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-3 text-muted-foreground">
                    Lifestyle Preferences (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LIFESTYLE_HABITS_LIST.map((habit) => {
                      const isSelected = selectedHabits.includes(habit);
                      return (
                        <button
                          key={habit}
                          onClick={() => handleHabitToggle(habit)}
                          className={`px-3 py-1.5 text-xs border transition-all ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground font-medium"
                              : "bg-background border-border text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {isSelected && <Check size={12} />}
                            {habit}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Directory Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="animate-spin text-primary mb-4" size={40} />
            <p className="text-muted-foreground font-light">Loading premium flatmate matches...</p>
          </div>
        ) : filteredFlatmates.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border bg-secondary/10">
            <Users size={48} className="mx-auto text-muted-foreground/60 mb-4" />
            <h3 className="text-xl font-bold mb-2">No Roommates Found</h3>
            <p className="text-muted-foreground font-light mb-6">
              No flatmates match your active search filters. Try adjusting them or clear them to start over.
            </p>
            <button
              onClick={clearFilters}
              className="bg-foreground text-background px-6 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-foreground/90 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredFlatmates.map((fm) => (
              <motion.div
                key={fm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="border border-border bg-background hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-primary/45 transition-all overflow-hidden flex flex-col group"
              >
                {/* Images Banner */}
                <div className="relative h-64 overflow-hidden bg-black/95 shrink-0 flex items-center justify-center">
                  {/* Backdrop Ambient Blur */}
                  <img
                    src={fm.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-md opacity-40 scale-110"
                  />
                  {/* Crisp Foreground (Uncropped) */}
                  <img
                    src={fm.images[0] || "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"}
                    alt={fm.title}
                    className="relative z-10 max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 mx-auto"
                  />
                  {/* Absolute overlays */}
                  <div className="absolute top-4 left-4 z-20 bg-background/90 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20 flex items-center gap-1.5">
                    <Award size={12} /> Vacancies: {fm.vacancyCount}
                  </div>
                  <div className="absolute top-4 right-4 z-20 bg-foreground text-background px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {fm.genderPref}
                  </div>
                </div>

                {/* Listing Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Title & Location details (moved below image container) */}
                    <div className="mb-4">
                      <Link href={`/flatmates/${fm.id}`}>
                        <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1 hover:text-primary transition-colors">{fm.title}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin size={10} className="text-primary" /> {fm.colony}, {fm.location}
                      </p>
                    </div>

                    {/* Financial stats */}
                    <div className="grid grid-cols-2 gap-4 border-b border-border pb-4 mb-4">
                      <div>
                        <span className="block text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                          Rent Share /mo
                        </span>
                        <span className="text-xl font-bold flex items-center text-primary">
                          <IndianRupee size={16} strokeWidth={2.5} />
                          {fm.rentShare.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                          Advance Share
                        </span>
                        <span className="text-xl font-bold flex items-center text-foreground">
                          <IndianRupee size={16} strokeWidth={2.5} />
                          {fm.advanceShare.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Quick compatibility traits */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-light text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Briefcase size={12} className="text-primary" />
                        <span className="truncate">Pref: {fm.professionPref}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart size={12} className="text-primary" />
                        <span className="truncate">{fm.postedBy.age}y/o • {fm.postedBy.profession.split(" at ")[0]}</span>
                      </div>
                    </div>

                    <p className="text-sm font-light text-muted-foreground line-clamp-2 leading-relaxed mb-6">
                      {fm.description}
                    </p>

                    {/* Lifestyle tags */}
                    <div className="flex flex-wrap gap-1.5 mb-8">
                      {fm.lifestyleHabits.slice(0, 3).map((tag, i) => (
                        <span
                          key={i}
                          className="bg-secondary/40 border border-border px-2.5 py-1 text-[10px] font-medium text-foreground/80 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {fm.lifestyleHabits.length > 3 && (
                        <span className="bg-secondary/20 border border-border px-2 py-0.5 text-[9px] text-muted-foreground rounded-full">
                          +{fm.lifestyleHabits.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Poster details and CTA */}
                  <div className="border-t border-border pt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={fm.postedBy.avatar}
                        alt={fm.postedBy.name}
                        className="w-9 h-9 rounded-full border border-primary/20 object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold leading-none">{fm.postedBy.name}</p>
                        <p className="text-[10px] text-muted-foreground leading-none mt-1">
                          Posted {new Date(fm.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/flatmates/${fm.id}`}
                      className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground px-4 py-2.5 text-xs uppercase tracking-wider font-bold transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
