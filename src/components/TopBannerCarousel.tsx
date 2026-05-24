"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Wallet, Users, Home } from "lucide-react";

const BANNERS = [
  {
    id: 1,
    title: "Post your room. Earn big rewards.",
    subtitle: "Turn your empty space into cash. List your room today and get a ₹1000 bonus on your first successful handover.",
    image: "/earn_money_banner.png",
    ctaText: "List Space & Earn",
    ctaLink: "/post/room",
    icon: Wallet,
  },
  {
    id: 2,
    title: "Find your ideal flatmate instantly.",
    subtitle: "Connect with verified professionals in Hyderabad. Premium matchmaking for a hassle-free living experience.",
    image: "/matchmaking_banner.png",
    ctaText: "Browse Flatmates",
    ctaLink: "/flatmates",
    icon: Users,
  },
  {
    id: 3,
    title: "Browse bachelor rooms across Hyderabad.",
    subtitle: "Find the perfect space that matches your lifestyle and budget. Filter by area, amenities, and rent.",
    image: "/browse_rooms_banner.png",
    ctaText: "Explore Rooms",
    ctaLink: "/rooms",
    icon: Home,
  }
];

export function TopBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const banner = BANNERS[currentIndex];
  const Icon = banner.icon;

  return (
    <div className="w-full bg-background border-b border-border overflow-hidden relative mt-[110px]">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row h-auto md:min-h-[400px]">
          {/* Text Content */}
          <div className="w-full md:w-1/2 flex items-center p-8 md:p-16 relative z-10 order-2 md:order-1 bg-background md:bg-transparent">
            <AnimatePresence mode="wait">
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="max-w-xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest mb-6">
                  <Icon size={14} /> Feature Notice
                </div>
                <h1 className="text-3xl md:text-5xl font-light mb-4 leading-tight">
                  {banner.title.split('.').map((part, i, arr) => (
                    <span key={i} className={i === 0 ? "font-bold" : ""}>
                      {part}{i < arr.length - 1 ? "." : ""}
                    </span>
                  ))}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed mb-8">
                  {banner.subtitle}
                </p>
                <Link
                  href={banner.ctaLink}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-[0_0_25px_rgba(212,175,55,0.3)] hover:scale-[1.02]"
                >
                  {banner.ctaText}
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Image Content */}
          <div className="relative w-full md:w-1/2 h-[250px] md:h-auto order-1 md:order-2 z-0 overflow-hidden">
            <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent md:via-background/20 z-10" />
            <AnimatePresence mode="wait">
              <motion.img
                key={banner.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Progress Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-8 bg-primary shadow-[0_0_10px_rgba(212,175,55,0.5)]" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
