"use client";

import Link from "next/link";
import { MapPin, IndianRupee, Calendar, Users, Sofa, Eye, UserCheck, Car, Bike, ArrowUpRight } from "lucide-react";
import type { Room } from "@/lib/db";
import { useState } from "react";

export default function RoomCard({ room }: { room: Room }) {
  const [imageError, setImageError] = useState(false);

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const hasImage = (room.images || [])[0] && !imageError;

  return (
    <div className={`group border border-border overflow-hidden hover:border-primary/30 transition-all duration-500 bg-background flex flex-col h-full ${room.is_rented_out ? 'opacity-80 grayscale-[20%]' : ''}`}>
      <Link href={`/rooms/${room.id}`} className="block relative aspect-[16/9] overflow-hidden bg-black shrink-0 border-b border-border flex items-center justify-center">
        {/* Ambient Blur */}
        {hasImage ? (
          <>
            <img src={room.images![0]} alt=""
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover blur-xl opacity-40 scale-110 pointer-events-none transition-transform duration-500 group-hover:scale-125" />
            {/* Clear Foreground */}
            <img src={room.images![0]} alt={room.title} loading="lazy"
              onError={() => setImageError(true)}
              className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 mx-auto" />
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full bg-secondary/20 flex flex-col items-center justify-center text-muted-foreground">
            <Sofa size={32} className="opacity-20 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-40">No Image</span>
          </div>
        )}

        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
          <span className="bg-background/90 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1">
            <MapPin size={12} className="text-primary" /> {room.location}
          </span>
          {room.leaving_date && (
            <span className="bg-background/90 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1">
              <Calendar size={12} className="text-primary" /> {getDaysLeft(room.leaving_date)} days left
            </span>
          )}
        </div>
        {(room.commission || 0) > 0 && (
          <div className="absolute top-4 right-4 z-20 bg-primary text-primary-foreground px-3 py-1 text-[11px] uppercase tracking-wider font-bold shadow-lg">
            ₹{room.commission} reward
          </div>
        )}
        {room.user_id !== "mock" && (
          <div className="absolute bottom-4 left-4 z-20 bg-green-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-lg">
            New · Just Posted
          </div>
        )}
        {(room.images || []).length > 1 && (
          <div className="absolute bottom-4 right-4 z-20 bg-background/80 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold flex items-center gap-1">
            <Eye size={12} /> {(room.images || []).length} photos
          </div>
        )}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20 backdrop-blur-[2px]">
          <span className="bg-background/90 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xl">View Details</span>
        </div>
        
        {room.is_rented_out && (
          <div className="absolute inset-0 z-30 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-yellow-500 text-yellow-950 px-6 py-2 text-lg font-black uppercase tracking-widest shadow-2xl rotate-[-5deg]">
              Rented Out
            </span>
          </div>
        )}
      </Link>

      <div className="p-6 flex flex-col flex-grow relative">
        {room.curiosity_text && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-max max-w-[90%]">
            <span className="bg-primary text-primary-foreground px-4 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-lg border border-primary-foreground/20 rounded-full flex items-center gap-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
              {room.curiosity_text}
            </span>
          </div>
        )}
        <Link href={`/rooms/${room.id}`}>
          <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1 hover:text-primary transition-colors">{room.title}</h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <MapPin size={10} className="text-primary" /> {room.colony}, {room.location}
        </p>
        <p className="text-sm text-muted-foreground font-light mb-4 line-clamp-2 leading-relaxed flex-grow">{room.description}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
            <Sofa size={12} /> {room.furnishing}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
            <Users size={12} /> {room.members_allowed || 2} allowed
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
            <UserCheck size={12} /> {(room.gender_preference || "Any").split(" ")[0]}
          </span>
          {(room.parking || "") !== "No Parking" && (room.parking || "").length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-[11px] font-bold uppercase">
              {(room.parking || "").includes("Car") ? <Car size={10} /> : <Bike size={10} />} {room.parking}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-medium uppercase">No Parking</span>
          )}
        </div>

        <div className="flex items-end justify-between pt-4 border-t border-border">
          <div>
            <div className="flex items-baseline gap-4 mb-1">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rent</p>
                <p className="text-xl font-bold flex items-center"><IndianRupee size={16} className="text-primary" />{room.rent.toLocaleString("en-IN")}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Advance</p>
                <p className="text-sm font-semibold">₹{(room.advance || 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {room.profiles?.avatar_url ? (
              <img src={room.profiles.avatar_url} alt={room.profiles?.full_name || ""} loading="lazy" referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary border-2 border-border flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{(room.profiles?.full_name || "?")[0]}</span>
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-bold">{room.profiles?.full_name || "Owner"}</p>
              <p className="text-[10px] text-muted-foreground">{room.profiles?.profession || ""}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Link href={`/rooms/${room.id}`} className="flex-1 bg-foreground text-background py-3 text-xs uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all text-center flex items-center justify-center gap-1">
            View Details <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
