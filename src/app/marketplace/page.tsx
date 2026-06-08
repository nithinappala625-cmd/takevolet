"use client";

import { motion } from "framer-motion";
import { CITIES, CATEGORIES, ITEM_CONDITIONS } from "@/data/locations";
import { IndianRupee, ArrowUpRight, Tag, MapPin, Phone, Repeat } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllItems, MarketplaceItemType } from "@/lib/item-db";
import { PremiumAdCarousel } from "@/components/PremiumAdCarousel";

export default function MarketplacePage() {
  const [selectedCity, setSelectedCity] = useState("Hyderabad");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState<"" | "sell" | "rent" | "both">("");
  const [items, setItems] = useState<MarketplaceItemType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllItems().then(data => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const filteredItems = items.filter(item => {
    const itemCity = item.city || "Hyderabad";
    const matchesCity = itemCity === selectedCity;
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesType = !selectedType || item.listing_type === selectedType || item.listing_type === "both";
    return matchesCity && matchesCategory && matchesType;
  });

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
          <div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Marketplace</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-light mb-4">
              Bachelor <span className="font-bold">Essentials</span>
            </motion.h1>
            <p className="text-muted-foreground font-light max-w-xl">
              Bachelors leaving {selectedCity} sell their items at the lowest prices. Buy or rent — fridges, coolers, beds, electronics, and more.
            </p>
          </div>
          <a href="/post"
            className="bg-foreground text-background px-6 py-3 text-sm uppercase tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground transition-all whitespace-nowrap">
            + Sell Your Items
          </a>
        </div>

        {/* Premium Native Ad Placement */}
        <PremiumAdCarousel />

        {/* Type Toggle */}
        <div className="flex gap-3 mb-6">
          {[
            { label: "All", value: "" },
            { label: "Buy", value: "sell" },
            { label: "Rent", value: "rent" },
            { label: "Buy or Rent", value: "both" },
          ].map(opt => (
            <button key={opt.value}
              onClick={() => setSelectedType(opt.value as any)}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider border transition-all ${selectedType === opt.value ? "bg-foreground text-background border-foreground" : "border-border hover:border-primary"}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-10">
          <div className="flex gap-2 pr-4 border-r border-border mr-2">
            {CITIES.map(city => (
              <button key={city} onClick={() => setSelectedCity(city)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-wider border transition-all ${selectedCity === city ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
                {city}
              </button>
            ))}
          </div>
          <button onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 text-xs font-medium uppercase tracking-wider border transition-all ${!selectedCategory ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
            All Categories
          </button>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs font-medium uppercase tracking-wider border transition-all ${selectedCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Results */}
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8 font-medium">
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"} available
        </p>

        {/* Items Grid */}
        {loading ? (
          <div className="text-center py-20 border border-border">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground font-light">Loading items...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((item, i) => (
              <Link href={`/marketplace/${item.id}`} key={item.id} className="block group">
                <motion.div
                  initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="border border-border overflow-hidden hover:border-primary/30 transition-all duration-500 h-full flex flex-col">
                  
                  <div className="relative aspect-square overflow-hidden shrink-0">
                  <img src={item.image || ""} alt={item.title} loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                  
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="bg-background/90 backdrop-blur-sm px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold text-primary">
                      {item.category}
                    </span>
                  </div>

                  {(item.listing_type === "rent" || item.listing_type === "both") && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                      <Repeat size={10} /> Rent Available
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id || "User"}`} alt="" className="w-6 h-6 rounded-full border border-background" loading="lazy" />
                    <span className="text-[10px] font-semibold text-white drop-shadow-lg">Seller</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-sm mb-1 line-clamp-1 tracking-tight">{item.title}</h3>
                  <p className="text-[11px] text-muted-foreground font-light mb-3 line-clamp-2">{item.description}</p>
                  
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                    <MapPin size={10} /> {item.location}
                    <span className="mx-1">•</span>
                    <span className="text-primary font-semibold">{item.condition}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div>
                      {item.price > 0 && (
                        <span className="text-base font-bold flex items-center">
                          <IndianRupee size={14} />{item.price.toLocaleString("en-IN")}
                        </span>
                      )}
                      {item.rent_price && (
                        <span className="text-[11px] text-primary font-semibold">
                          Rent: ₹{item.rent_price}/mo
                        </span>
                      )}
                    </div>
                    <button className="w-9 h-9 border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shrink-0">
                      <Phone size={14} />
                    </button>
                  </div>
                </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20 border border-border mt-6">
            <p className="text-2xl font-light mb-2">No items found</p>
            <p className="text-muted-foreground font-light">Try a different category or listing type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
