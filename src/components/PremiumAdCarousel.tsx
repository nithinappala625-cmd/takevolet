"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Star } from "lucide-react";

export function PremiumAdCarousel() {
  const [ads, setAds] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase
          .from("ads")
          .select("*")
          .eq("is_active", true)
          .eq("placement", "rooms_page");
        
        if (data && data.length > 0) {
          setAds(data);
        }
      } catch (e) {
        console.error("Error fetching ads", e);
      }
    };
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="w-full bg-foreground border border-border overflow-hidden relative group my-6">
      {/* Premium Gradient Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/50 to-primary/20" />
      
      <div className="p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        
        <div className="flex items-center gap-4 md:gap-6 w-full">
          {/* Logo Box */}
          <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 bg-background border border-border/20 flex items-center justify-center shadow-lg relative overflow-hidden group-hover:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
            {currentAd.image_url ? (
              <img src={currentAd.image_url} alt={currentAd.advertiser_name} className="w-[85%] h-[85%] object-contain relative z-10" />
            ) : (
              <Star className="text-primary w-8 h-8 relative z-10" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/20 text-primary px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold">
                Sponsored Partner
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-background font-black text-lg md:text-xl truncate tracking-tight">
                  {currentAd.title}
                </h3>
                {currentAd.description && (
                  <p className="text-muted-foreground text-sm truncate mt-0.5">
                    {currentAd.description}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* CTA Button */}
        <a 
          href={currentAd.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0 w-full md:w-auto bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] group-hover:scale-[1.02]"
        >
          Explore Offer
          <ExternalLink size={14} />
        </a>
        
      </div>
      
      {/* Background Subtle Elements */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      
      {/* Carousel Indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-0 w-full flex justify-center gap-1.5 z-20">
          {ads.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 transition-all duration-300 ${i === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
