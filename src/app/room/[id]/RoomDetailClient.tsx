"use client";

import RoomDetailPage from "@/app/rooms/[id]/page";
import { Smartphone, Download } from "lucide-react";

export default function RoomDetailClient({ roomId }: { roomId: string }) {
  const deepLink = `takevolet://room/${roomId}`;
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.takevolet.app";

  return (
    <div className="relative">
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#7B3AEC] to-[#6D28D9] text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <Smartphone size={18} className="shrink-0" />
          <span>Viewing on Web. Want the full experience?</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={deepLink}
            className="bg-white text-[#7B3AEC] hover:bg-white/90 font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all text-xs"
          >
            Open in App
          </a>
          <a
            href={playStoreLink}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white font-medium px-3 py-1.5 rounded-lg transition-all text-xs"
          >
            <Download size={14} /> Get App
          </a>
        </div>
      </div>
      <RoomDetailPage />
    </div>
  );
}
