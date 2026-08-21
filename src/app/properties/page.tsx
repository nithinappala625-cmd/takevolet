"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CITIES, getAreas, BUDGET_RANGES } from "@/data/locations";
import { Search, X, SlidersHorizontal, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchAllPropertySalesAction } from "@/lib/server-actions";
import type { PropertySale } from "@/lib/db";
import PropertyCard from "@/components/PropertyCard";
import { PremiumAdCarousel } from "@/components/PremiumAdCarousel";
import Image from "next/image";

export default function PropertiesPage() {
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [allProperties, setAllProperties] = useState<PropertySale[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  const PROPERTY_TYPES = [
    { name: "Apartment", icon: "/icons/apartment.png" }, 
    { name: "Independent House", icon: "/icons/house.png" }, 
    { name: "Villa", icon: "/icons/villa.png" }, 
    { name: "Plot", icon: "/icons/plot.png" }, 
    { name: "Commercial", icon: "/icons/commercial.png" }
  ];

  // Load Supabase properties
  useEffect(() => {
    (async () => {
      setPropertiesLoading(true);
      const dbProperties = await fetchAllPropertySalesAction();
      setAllProperties(dbProperties);
      setPropertiesLoading(false);
    })();
  }, []);

  const filteredProperties = allProperties.filter(property => {
    const loc        = property.location || "";
    const pType      = property.property_type || property.property_category || "";
    const desc       = property.description || "";
    
    const matchesCity       = true; // Add city matching logic if property table has it
    const matchesLocation   = !selectedLocation   || loc.includes(selectedLocation);
    const matchesType       = !selectedType       || pType === selectedType;
    
    const matchesSearch = !searchQuery ||
      (property.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.toLowerCase().includes(searchQuery.toLowerCase());
      
    let matchesBudget = true;
    if (selectedBudget) {
      const range = BUDGET_RANGES.find(r => r.label === selectedBudget);
      if (range && property.expected_price) {
         matchesBudget = property.expected_price >= range.min && property.expected_price <= range.max;
      }
    }
    return matchesLocation && matchesType && matchesBudget && matchesSearch;
  });

  const activeFilters = [selectedLocation, selectedType, selectedBudget].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCity("Hyderabad"); setSelectedLocation(""); setSelectedType(""); 
    setSelectedBudget(""); setSearchQuery("");
  };

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">

        <div className="mb-10 text-center">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
            Real Estate & Property
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-light mb-8">
            Buy or Sell <span className="font-bold">Your Property</span>
          </motion.h1>
          
          <p className="text-muted-foreground font-light max-w-2xl mx-auto">
            Discover verified properties for sale across the city. Connect directly with owners and skip the brokerage.
          </p>
        </div>

        {/* Premium Native Ad Placement */}
        <PremiumAdCarousel />

        {/* Circular Categories */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex overflow-x-auto gap-4 py-8 mb-6 scrollbar-hide snap-x justify-start md:justify-center">
          <div 
            onClick={() => setSelectedType("")}
            className={`flex flex-col items-center gap-2 cursor-pointer snap-center shrink-0 w-20 transition-all ${selectedType === "" ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"}`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors ${selectedType === "" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary"}`}>
              <span className="font-bold text-xs uppercase tracking-wider">ALL</span>
            </div>
            <span className={`text-[10px] text-center font-bold tracking-wider uppercase ${selectedType === "" ? "text-primary" : "text-muted-foreground"}`}>All</span>
          </div>

          {PROPERTY_TYPES.map((type) => (
            <div 
              key={type.name}
              onClick={() => setSelectedType(type.name)}
              className={`flex flex-col items-center gap-2 cursor-pointer snap-center shrink-0 w-20 transition-all ${selectedType === type.name ? "opacity-100 scale-105" : "opacity-60 hover:opacity-100"}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 overflow-hidden bg-secondary transition-colors ${selectedType === type.name ? "border-primary" : "border-border"}`}>
                <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center">
                   <span className="text-xl">🏢</span>
                </div>
              </div>
              <span className={`text-[10px] text-center font-bold tracking-wider uppercase ${selectedType === type.name ? "text-primary" : "text-muted-foreground"}`}>{type.name}</span>
            </div>
          ))}
        </motion.div>

        {/* Search */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6 flex items-center gap-3 border border-border p-3">
          <Search size={18} className="text-muted-foreground ml-2" />
          <input type="text" placeholder="Search by area, title, or keywords..."
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border border-border bg-secondary/30">
                {[
                  { label: "City", value: selectedCity, onChange: (val: string) => { setSelectedCity(val); setSelectedLocation(""); }, options: CITIES, placeholder: "All Cities" },
                  { label: "Location", value: selectedLocation, onChange: setSelectedLocation, options: getAreas(selectedCity), placeholder: "All Areas" },
                  { label: "Property Type", value: selectedType, onChange: setSelectedType, options: PROPERTY_TYPES.map(pt => pt.name), placeholder: "Any Type" },
                  { label: "Budget Range", value: selectedBudget, onChange: setSelectedBudget, options: BUDGET_RANGES.map(r => r.label), placeholder: "Any Budget" },
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

        {propertiesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8 font-medium">
              {filteredProperties.length} {filteredProperties.length === 1 ? "property" : "properties"} available
            </p>

            {/* Property Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProperties.map((property, i) => (
                <motion.div key={property.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <PropertyCard property={property} />
                </motion.div>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-20 border border-border">
                <p className="text-2xl font-light mb-2">No properties match your filters</p>
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
