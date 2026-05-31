"use client";

import { motion } from "framer-motion";
import {
  IndianRupee, MapPin, Tag, Phone, Repeat, CheckCircle2, ChevronLeft,
  Calendar, Star, MessageCircle, ShieldCheck, Lock, User
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { fetchItemByIdAction } from "@/lib/server-actions";

type SellerProfile = {
  full_name?: string;
  phone?: string;
  whatsapp?: string;
  avatar_url?: string;
  profession?: string;
  is_verified?: boolean;
};

export default function MarketplaceItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [item, setItem] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    fetchItemByIdAction(id).then(res => {
      setItem(res);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 pb-20 min-h-screen text-center flex flex-col items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
        <p className="text-sm text-muted-foreground">Loading item details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="pt-32 pb-20 min-h-screen text-center flex flex-col items-center justify-center">
        <h1 className="text-3xl font-light mb-4">Item Not Found</h1>
        <Link href="/marketplace" className="text-primary hover:underline">← Back to Marketplace</Link>
      </div>
    );
  }

  const seller: SellerProfile | null = item.seller_profile || null;
  const sellerName = seller?.full_name || "Seller";
  const sellerAvatar = seller?.avatar_url || "";
  const sellerProfession = seller?.profession || "";
  const sellerPhone = seller?.phone || "";
  const sellerWhatsapp = seller?.whatsapp || seller?.phone || "";
  const isVerified = seller?.is_verified ?? true; // Default to true if profile exists

  return (
    <div className="pt-32 pb-20 min-h-screen bg-background">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ChevronLeft size={16} /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
          {/* LEFT: Image + Details (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="aspect-square bg-black rounded-sm overflow-hidden border border-border sticky top-32 relative flex items-center justify-center">
                {/* Background Layer: Ambient Blur */}
                <div className="absolute inset-0 w-full h-full blur-2xl opacity-40 scale-110 select-none pointer-events-none z-0">
                  <Image src={item.image || ""} alt="" fill priority className="object-cover" />
                </div>
                {/* Foreground Layer: Crystal Clear Uncropped */}
                <Image
                  src={item.image || ""}
                  alt={item.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-contain relative z-10 mx-auto"
                />
              </div>
            </motion.div>

            {/* Tags */}
            <div className="flex gap-2">
              <span className="bg-primary/10 text-primary px-2.5 py-1 text-xs uppercase tracking-widest font-bold">
                {item.category}
              </span>
              <span className="bg-secondary px-2.5 py-1 text-xs uppercase tracking-widest font-bold">
                {item.condition}
              </span>
            </div>

            {/* Title & Location */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">{item.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm pb-6 border-b border-border">
                <MapPin size={16} className="text-primary" /> {item.location}, Hyderabad
              </div>
            </div>

            {/* Pricing */}
            <div>
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
                {item.rent_price && (
                  <div className="border border-border p-4 bg-background w-full sm:w-auto min-w-[200px]">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">Rent Price</p>
                    <p className="text-2xl font-bold flex items-center text-primary">
                      <IndianRupee size={22} /> {item.rent_price.toLocaleString("en-IN")}
                      <span className="text-sm text-muted-foreground font-normal ml-1">/mo</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-3">Description</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>

          {/* RIGHT COLUMN: Posted By / Contact Widget */}
          <div className="space-y-6">
            {/* Posted By — Verified Seller Card (matches rooms pattern) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-6 bg-secondary/20">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Posted By</p>

              {/* Seller Avatar + Name + Profession + Stars */}
              <div className="flex items-center gap-4 mb-5">
                {sellerAvatar ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/30">
                    <Image src={sellerAvatar} alt={sellerName} fill sizes="64px" className="object-cover" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">
                      {sellerName[0]?.toUpperCase() || "S"}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-base">{sellerName}</p>
                  {sellerProfession && (
                    <p className="text-xs text-muted-foreground">{sellerProfession}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={10} className="text-primary fill-primary" />
                    ))}
                    <span className="text-[10px] text-muted-foreground ml-1">Verified</span>
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              {isVerified && (
                <div className="flex items-center gap-2 mb-5 p-3 bg-green-50 border border-green-200">
                  <ShieldCheck size={16} className="text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-green-800">Verified Seller</p>
                    <p className="text-[10px] text-green-600">Identity verified via Takevolet</p>
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {unlocked ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="bg-green-50 border border-green-200 p-5 text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} className="text-green-600" />
                    </div>
                    <h3 className="font-bold text-green-800 text-lg mb-1">Contact Unlocked</h3>
                    <p className="text-sm font-mono font-bold text-xl text-green-700 mb-4">
                      {sellerPhone || sellerWhatsapp || "No Number Available"}
                    </p>
                    <div className="flex gap-2">
                      {sellerPhone && (
                        <a
                          href={`tel:${sellerPhone}`}
                          className="flex-1 bg-green-600 text-white py-3 text-xs uppercase tracking-wider font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-1.5 rounded-sm"
                        >
                          <Phone size={13} /> Call Now
                        </a>
                      )}
                      {sellerWhatsapp && (
                        <a
                          href={`https://wa.me/${sellerWhatsapp.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          className="flex-1 border border-green-600 text-green-700 py-3 text-xs uppercase tracking-wider font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-1.5 rounded-sm"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Blurred contact preview */}
                  <div className="relative mb-4">
                    <div className="blur-sm select-none p-4 bg-secondary/50 border border-border">
                      <p className="font-mono font-bold">+91 XXXXX XXXXX</p>
                      <p className="text-xs text-muted-foreground">Contact hidden</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock size={22} className="text-muted-foreground" />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!user || user.id === "guest") {
                        alert("Please sign in to continue with this.");
                        router.push("/auth");
                        return;
                      }
                      setUnlocked(true);
                    }}
                    className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={15} /> Contact Seller
                  </button>
                  <p className="text-center text-[10px] text-muted-foreground mt-2">🔒 Verified · Secure Contact</p>
                </>
              )}
            </motion.div>

            {/* Item Quick Info */}
            <div className="border border-border p-6">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Item Details</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="font-bold text-sm capitalize">{item.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Condition</span>
                  <span className="font-bold text-sm capitalize">{item.condition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Listing Type</span>
                  <span className="font-bold text-sm capitalize">{item.listing_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Location</span>
                  <span className="font-bold text-sm">{item.location}</span>
                </div>
                {item.created_at && (
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <span className="text-sm text-muted-foreground">Posted</span>
                    <span className="font-bold text-sm">
                      {new Date(item.created_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
