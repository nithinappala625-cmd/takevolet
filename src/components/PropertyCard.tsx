"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, IndianRupee, Eye, Building, Scaling } from "lucide-react";
import type { PropertySale } from "@/lib/db";
import { useState } from "react";

export default function PropertyCard({ property }: { property: PropertySale }) {
  const [imageError, setImageError] = useState(false);

  const mainImage = property.cover_image || (property.flat_images || [])[0];
  const hasImage = mainImage && !imageError;
  const hasVideo = (property.videos || [])[0];

  return (
    <div className={`group border border-border overflow-hidden hover:border-primary/30 transition-all duration-500 bg-background flex flex-col h-full`}>
      <Link href={`/properties/${property.id}`} className="block relative aspect-[16/9] overflow-hidden bg-black shrink-0 border-b border-border flex items-center justify-center">
        {/* Ambient Blur */}
        {hasImage ? (
          <>
            <div className="absolute inset-0 w-full h-full blur-xl opacity-40 scale-110 pointer-events-none transition-transform duration-500 group-hover:scale-125 z-0">
              <Image src={mainImage} alt="" fill sizes="400px" className="object-cover" onError={() => setImageError(true)} />
            </div>
            {/* Clear Foreground */}
            <Image src={mainImage} alt={property.title || "Property"} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-500 mx-auto relative z-10" />
          </>
        ) : hasVideo ? (
          <video src={property.videos![0]} muted loop playsInline
            className="w-full h-full object-cover relative z-10" />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-secondary/20 flex flex-col items-center justify-center text-muted-foreground">
            <Building size={32} className="opacity-20 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-bold opacity-40">No Image</span>
          </div>
        )}

        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
          <span className="bg-background/90 backdrop-blur-sm px-3 py-1 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1">
            <MapPin size={12} className="text-primary" /> {property.area || property.city || property.location || "Unknown"}
          </span>
        </div>
        
        {property.user_id !== "mock" && (
          <div className="absolute bottom-4 left-4 z-20 bg-green-500 text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-lg">
            New · Just Posted
          </div>
        )}
        
        {(property.flat_images || []).length > 0 && (
          <div className="absolute bottom-4 right-4 z-20 bg-background/80 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold flex items-center gap-1">
            <Eye size={12} /> {(property.flat_images || []).length} photos
          </div>
        )}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-black/20 backdrop-blur-[2px]">
          <span className="bg-background/90 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-xl">View Details</span>
        </div>
      </Link>

      <div className="p-6 flex flex-col flex-grow relative">
        <Link href={`/properties/${property.id}`}>
          <h3 className="text-lg font-bold tracking-tight mb-1 line-clamp-1 hover:text-primary transition-colors">{property.title}</h3>
        </Link>
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <MapPin size={10} className="text-primary" /> {property.area || property.city || property.location}
        </p>
        <p className="text-sm text-muted-foreground font-light mb-4 line-clamp-2 leading-relaxed flex-grow">{property.description}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
            <Building size={12} /> {property.property_type || "Property"}
          </span>
          {property.carpet_area && (
             <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
               <Scaling size={12} /> {property.carpet_area} Sq.Ft
             </span>
          )}
        </div>

        <div className="flex items-end justify-between mt-auto pt-4 border-t border-border">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Selling Price</p>
            <p className="text-2xl font-light flex items-center tracking-tight">
              <IndianRupee size={20} className="mr-0.5 text-primary" /> 
              {property.expected_price ? property.expected_price.toLocaleString("en-IN") : "Price on Request"}
            </p>
          </div>
          {property.profiles?.avatar_url ? (
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">{property.profiles.full_name}</p>
                <p className="text-[9px] text-muted-foreground/60">{property.profiles.profession || "Owner"}</p>
              </div>
              <Image src={property.profiles.avatar_url} alt="" width={32} height={32} className="rounded-full object-cover border border-border" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-secondary/50 border border-border flex items-center justify-center">
              <span className="text-[10px] font-bold text-muted-foreground">{property.profiles?.full_name?.charAt(0) || "U"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
