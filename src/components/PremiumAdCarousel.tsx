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
    <div className="w-full border border-border overflow-hidden relative group my-8 min-h-[200px] flex items-center rounded-sm">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#111111] via-[#0a0a0a] to-black overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
      </div>

      <div className="container mx-auto relative z-10 px-6 py-10 md:py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        
        <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 md:gap-10 w-full">
          {/* Logo Box */}
          <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-white flex items-center justify-center shadow-lg relative overflow-hidden rounded-xl group-hover:shadow-[0_0_30px_rgba(212,175,55,0.25)] transition-all duration-500 transform group-hover:scale-105 border border-primary/20">
            {currentAd.image_url ? (
              <img src={currentAd.image_url} alt={currentAd.title} className="w-[85%] h-[85%] object-contain relative z-10" />
            ) : (
              <Star className="text-primary w-12 h-12 relative z-10" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <span className="bg-primary/10 text-primary px-3 py-1 text-[10px] uppercase tracking-widest font-bold border border-primary/20">
                Sponsored Partner
              </span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <h3 className="text-white font-light text-2xl md:text-4xl tracking-tight mb-2">
                  <span className="font-bold">{currentAd.title}</span>
                </h3>
                {currentAd.description && (
                  <p className="text-muted-foreground text-sm md:text-base font-light max-w-2xl leading-relaxed">
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
          className="shrink-0 w-full md:w-auto bg-primary text-primary-foreground px-8 py-4 text-sm uppercase tracking-widest font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-[1.02]"
        >
          Explore Offer
          <ExternalLink size={16} />
        </a>
      </div>
      
      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {ads.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-8 bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" : "w-2 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
