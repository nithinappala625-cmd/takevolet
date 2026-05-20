"use client";

import { motion } from "framer-motion";
import { MOCK_ITEMS } from "@/data/mock";
import { IndianRupee, MapPin, Tag, Phone, Repeat, CheckCircle2, ChevronLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";

export default function MarketplaceItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const item = MOCK_ITEMS.find((i) => i.id === id);
  const { user } = useUser();
  const [unlocked, setUnlocked] = useState(false);

  if (!item) {
    return (
      <div className="pt-32 pb-20 min-h-screen text-center flex flex-col items-center justify-center">
        <h1 className="text-3xl font-light mb-4">Item Not Found</h1>
        <Link href="/marketplace" className="text-primary hover:underline">← Back to Marketplace</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 min-h-screen bg-background">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft size={16} /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square bg-black rounded-sm overflow-hidden border border-border sticky top-32 relative flex items-center justify-center">
              {/* Background Layer: Ambient Blur */}
              <img
                src={item.image || ""}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 select-none pointer-events-none z-0"
              />
              {/* Foreground Layer: Crystal Clear Uncropped */}
              <img
                src={item.image || ""}
                alt={item.title}
                className="max-w-full max-h-full w-auto h-auto object-contain relative z-10 mx-auto"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
            <div className="flex gap-2 mb-4">
              <span className="bg-primary/10 text-primary px-2.5 py-1 text-xs uppercase tracking-widest font-bold">
                {item.category}
              </span>
              <span className="bg-secondary px-2.5 py-1 text-xs uppercase tracking-widest font-bold">
                {item.condition}
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">{item.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-6 pb-6 border-b border-border">
              <MapPin size={16} /> {item.location}, Hyderabad
            </div>

            {/* Pricing */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Pricing</p>
              <div className="flex flex-wrap gap-4">
                {item.price > 0 && (
                  <div className="border border-border p-4 bg-background w-full sm:w-auto min-w-[200px]">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Buy Price</p>
                    <p className="text-2xl font-bold flex items-center">
                      <IndianRupee size={22} /> {item.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
                {item.rentPrice && (
                  <div className="border border-border p-4 bg-background w-full sm:w-auto min-w-[200px]">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Rent Price</p>
                    <p className="text-2xl font-bold flex items-center text-primary">
                      <IndianRupee size={22} /> {item.rentPrice.toLocaleString("en-IN")}
                      <span className="text-sm text-muted-foreground font-normal ml-1">/mo</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>

            {/* Poster & Contact */}
            <div className="mt-auto pt-6 border-t border-border">
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">Posted By</p>
              <div className="flex items-center justify-between p-4 border border-border bg-secondary/20">
                <div className="flex items-center gap-3">
                  <img src={item.postedBy.avatar} alt={item.postedBy.name} className="w-12 h-12 rounded-full object-cover border-2 border-background" />
                  <div>
                    <p className="font-bold text-sm">{item.postedBy.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-500" /> Verified Seller
                    </p>
                  </div>
                </div>

                {unlocked ? (
                  <div className="text-right">
                    <p className="font-bold text-primary flex items-center gap-1.5"><Phone size={14}/> +91 98765 43210</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      if (!user || user.id === "guest") {
                        alert("Please sign in to continue with this.");
                        router.push("/auth");
                        return;
                      }
                      setUnlocked(true);
                    }}
                    className="bg-foreground text-background px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-primary transition-colors flex items-center gap-2">
                    <Phone size={12} /> Contact Seller
                  </button>
                )}
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
}
