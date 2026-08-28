"use client";

import { X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function AppBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="w-full bg-[#1A1A1A] text-white py-2 px-4 flex items-center justify-between z-50">
      <div className="flex-1 flex justify-center items-center gap-3 md:gap-6">
        <p className="text-sm md:text-base font-medium">
          Download the Takevolet App here for a better experience!
        </p>
        <Link 
          href="https://play.google.com/store/apps/details?id=com.takevolet.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#D4AF37] hover:bg-[#B3932F] text-black text-xs md:text-sm font-bold py-1.5 px-4 rounded transition-colors whitespace-nowrap"
        >
          Download
        </Link>
      </div>
      <button 
        onClick={() => setIsVisible(false)}
        className="text-white/70 hover:text-white p-1 ml-2 transition-colors"
        aria-label="Close banner"
      >
        <X size={18} />
      </button>
    </div>
  );
}
