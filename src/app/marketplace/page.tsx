"use client";

import { motion } from "framer-motion";
import { CATEGORIES, ITEM_CONDITIONS } from "@/data/locations";
import { IndianRupee, ArrowUpRight, Tag, MapPin, Phone, Repeat } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllItems, MarketplaceItemType } from "@/lib/item-db";

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState<"" | "sell" | "rent" | "both">("");
  const [items, setItems] = useState<MarketplaceItemType[]>([]);

  useEffect(() => {
    getAllItems().then(setItems);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesType = !selectedType || item.listingType === selectedType || item.listingType === "both";
    return matchesCategory && matchesType;
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
              Bachelors leaving Hyderabad sell their items at the lowest prices. Buy or rent — fridges, coolers, beds, electronics, and more.
            </p>
          </div>
          <a href="/post"
            className="bg-foreground text-background px-6 py-3 text-sm uppercase tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground transition-all whitespace-nowrap">
            + Sell Your Items
          </a>
        </div>

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

                {(item.listingType === "rent" || item.listingType === "both") && (
                  <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1">
                    <Repeat size={10} /> Rent Available
                  </div>
                )}

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <img src={item.postedBy.avatar} alt="" className="w-6 h-6 rounded-full border border-background" loading="lazy" />
                  <span className="text-[10px] font-semibold text-white drop-shadow-lg">{item.postedBy.name}</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-sm mb-1 line-clamp-1 tracking-tight">{item.title}</h3>
                <p className="text-[11px] text-muted-foreground font-light mb-3 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-3">
                  <MapPin size={10} /> {item.location}
                  <span className="mx-1">•</span>
                  <span className="text-primary font-semibold">{item.condition}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    {item.price > 0 && (
                      <span className="text-base font-bold flex items-center">
                        <IndianRupee size={14} />{item.price.toLocaleString("en-IN")}
                      </span>
                    )}
                    {item.rentPrice && (
                      <span className="text-[11px] text-primary font-semibold">
                        Rent: ₹{item.rentPrice}/mo
                      </span>
                    )}
                  </div>
                  <button className="w-9 h-9 border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                    <Phone size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 border border-border">
            <p className="text-2xl font-light mb-2">No items found</p>
            <p className="text-muted-foreground font-light">Try a different category or listing type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
