"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, MapPin, IndianRupee, Home, Scaling, Phone, CheckCircle, Bed, Bath, Wind, Flame } from "lucide-react";
import { fetchAllPropertySalesAction } from "@/lib/server-actions";
import type { PropertySale } from "@/lib/db";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<PropertySale | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    (async () => {
      if (!params?.id) return;
      const all = await fetchAllPropertySalesAction();
      const found = all.find(p => p.id === params.id) || null;
      setProperty(found);
      setLoading(false);
    })();
  }, [params?.id]);

  if (loading) {
    return <div className="min-h-screen pt-32 pb-20 flex justify-center"><div className="animate-pulse flex flex-col items-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="mt-4 text-muted-foreground uppercase tracking-widest text-xs font-bold">Loading Details...</p></div></div>;
  }

  if (!property) {
    return <div className="min-h-screen pt-32 pb-20 flex flex-col items-center justify-center"><h1 className="text-4xl font-light mb-4">Property Not Found</h1><button onClick={() => router.push("/properties")} className="text-primary hover:underline font-medium">Return to Properties</button></div>;
  }

  const allImages = [property.cover_image, ...(property.flat_images || [])].filter(Boolean) as string[];

  return (
    <div className="min-h-screen pt-28 pb-20 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft size={16} /> Back to Listings
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {allImages.length > 0 ? (
              <div className="space-y-4">
                <div className="aspect-[16/9] relative overflow-hidden bg-secondary/30 rounded-xl border border-border">
                  <Image src={allImages[activeImage]} alt={property.title || "Property"} fill className="object-cover" />
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {allImages.map((img, i) => (
                      <button key={i} onClick={() => setActiveImage(i)} className={`relative w-24 h-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${activeImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                        <Image src={img} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[16/9] flex items-center justify-center bg-secondary/20 rounded-xl border border-border">
                <Home size={48} className="text-muted-foreground opacity-20" />
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{property.title}</h1>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Price</p>
                  <p className="text-3xl font-light flex items-center text-primary">
                    <IndianRupee size={24} className="mr-1" />
                    {property.expected_price ? property.expected_price.toLocaleString("en-IN") : "On Request"}
                  </p>
                </div>
              </div>
              <p className="flex items-center gap-2 text-muted-foreground font-medium mb-6">
                <MapPin size={16} className="text-primary" /> {property.full_address || property.location || property.area || property.city}
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-semibold uppercase tracking-wider">
                  <Home size={14} /> {property.property_type || property.property_category || "Property"}
                </span>
                {property.carpet_area && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-semibold uppercase tracking-wider">
                    <Scaling size={14} /> {property.carpet_area} Sq.Ft
                  </span>
                )}
                {property.bhk && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full text-xs font-semibold uppercase tracking-wider">
                    <Bed size={14} /> {property.bhk}
                  </span>
                )}
              </div>

              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <h3 className="text-xl font-semibold mb-4">About this Property</h3>
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{property.description || "No description provided."}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-28 border border-border bg-card p-6 rounded-2xl shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Phone className="text-primary" size={20} /> Contact Owner</h3>
              
              {property.profiles ? (
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                  {property.profiles.avatar_url ? (
                    <Image src={property.profiles.avatar_url} alt="" width={56} height={56} className="rounded-full object-cover border-2 border-primary/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                      {property.profiles.full_name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-lg">{property.profiles.full_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      {property.profiles.is_verified && <CheckCircle size={14} className="text-green-500" />} 
                      {property.profiles.profession || "Owner"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 pb-6 border-b border-border">
                  <p className="font-bold text-lg">{property.owner_name || "Owner"}</p>
                  <p className="text-sm text-muted-foreground">Property Owner</p>
                </div>
              )}
              
              <div className="space-y-4">
                <button className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                  <Phone size={18} /> Show Number
                </button>
                <button className="w-full bg-green-500 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-green-600 transition-all flex items-center justify-center gap-2">
                  WhatsApp
                </button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-4 uppercase tracking-widest font-semibold">
                Mention TakeVolet when calling
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
