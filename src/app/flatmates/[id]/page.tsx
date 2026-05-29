"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, IndianRupee, Users, Phone, ArrowLeft,
  ChevronLeft, ChevronRight, X, Lock, CheckCircle2,
  Star, MessageCircle, Share2, Eye, Zap, ShieldCheck,
  AlertCircle, Loader2, Sparkles, Heart, Activity, Briefcase
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getFlatmateById } from "@/lib/flatmate-db";
import { checkFlatmateUnlockStatusAction } from "@/lib/server-actions";
import type { Flatmate } from "@/data/mock";
import { useUser } from "@/hooks/useUser";

export default function FlatmateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [flatmate, setFlatmate] = useState<Flatmate | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockSuccess, setUnlockSuccess] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState<any>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [passNumber, setPassNumber] = useState<string | null>(null);
  const [passPreviewOpen, setPassPreviewOpen] = useState(false);

  // ── Pricing Plans ────────────────────────────────────────────────────────
  const PLANS = [
    { id: "single",    label: "1 Contact",         contacts: 1,      price: 15,  paise: 1500,  badge: "",            perContact: "₹15" },
    { id: "starter",   label: "10 Contacts",       contacts: 10,     price: 55,  paise: 5500,  badge: "",            perContact: "₹5.50" },
    { id: "growth",    label: "50 Contacts",       contacts: 50,     price: 105, paise: 10500, badge: "Popular",     perContact: "₹2.10" },
    { id: "unlimited", label: "Unlimited Contacts", contacts: 999999, price: 200, paise: 20000, badge: "🔥 Best Deal",perContact: "₹0" },
  ];
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2]);

  const { user } = useUser();
  const userId = user?.id || "guest";

  useEffect(() => {
    const id = params.id as string;
    async function loadData() {
      setLoading(true);
      try {
        if (userId !== "guest") {
          const contact = await checkFlatmateUnlockStatusAction(id, userId);
          if (contact) {
            setContactUnlocked(true);
            setUnlockedContact(contact);
          }
        }
        const data = await getFlatmateById(id);
        setFlatmate(data);
      } catch (err) {
        console.error("Error loading flatmate:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!flatmate) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36">
        <div className="text-center bg-background border border-border p-12 max-w-md shadow-2xl">
          <AlertCircle size={48} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-light mb-4">Listing Not Found</h2>
          <p className="text-muted-foreground font-light text-sm mb-6 leading-relaxed">
            The roommate vacancy profile you are looking for does not exist or has been taken.
          </p>
          <Link href="/flatmates" className="bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-wider font-bold hover:bg-primary/90 transition-all inline-block">
            ← Browse Flatmates
          </Link>
        </div>
      </div>
    );
  }

  const images = flatmate?.images || [];
  const videos = flatmate?.videos || [];
  const allMedia = [...images, ...videos];

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % allMedia.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
  };

  // ── Load Razorpay Checkout Script dynamically ─────────────────────────────
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise(resolve => {
      if ((window as any).Razorpay) { resolve(true); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    if (userId === "guest") {
      alert("Please sign in to continue with this.");
      router.push("/auth");
      return;
    }

    setPayError(null);
    setUnlocking(true);

    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flatmateId: flatmate?.id, userId, type: "flatmate_contact_unlock", planId: selectedPlan.id, amount: selectedPlan.paise }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Could not load Razorpay.");

      setUnlocking(false);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Takevolet",
        description: `${selectedPlan.label} — Unlock Contact`,
        image: "/logo.png",
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || "Seeker",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        notes: {
          flatmateId: flatmate.id,
          flatmateTitle: flatmate.title,
        },
        theme: { color: "#D4AF37" },
        modal: {
          ondismiss: () => {
            setUnlocking(false);
            setPayError("Payment cancelled.");
          },
        },
        handler: async (response: any) => {
          try {
            setUnlocking(true);
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                flatmateId: flatmate.id,
                userId,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            if (verifyData.passNumber) setPassNumber(verifyData.passNumber);
            setUnlockedContact(verifyData.contact);
            setUnlockSuccess(true);
            setTimeout(() => {
              setContactUnlocked(true);
              setUnlockSuccess(false);
            }, 1800);
          } catch (err: any) {
            setPayError(err.message || "Verification failed. Contact support.");
          } finally {
            setUnlocking(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        setPayError("Payment failed: " + response.error.description);
        setUnlocking(false);
      });
      rzp.open();

    } catch (err: any) {
      setPayError(err.message || "Something went wrong.");
      setUnlocking(false);
    }
  };

  const displayedPhone = unlockedContact?.phone || flatmate.postedBy.phone;
  const displayedWhatsapp = unlockedContact?.whatsapp || flatmate.postedBy.whatsapp;
  const displayedName = unlockedContact?.name || flatmate.postedBy.name;
  const displayedAvatar = unlockedContact?.avatar || flatmate.postedBy.avatar;
  const displayedProfession = unlockedContact?.profession || flatmate.postedBy.profession;

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(displayedPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Precomposed WhatsApp URL
  const waMessage = `Hi ${displayedName}, I found your flatmate vacancy listing "${flatmate.title}" on Takevolet! I am extremely interested in joining as your flatmate. Let's connect!`;
  const waUrl = `https://wa.me/${displayedWhatsapp.replace(/\+/g, "").replace(/\s/g, "")}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">
        {/* Back navigation */}
        <Link href="/flatmates" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Flatmates directory
        </Link>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* LEFT SIDE: Media and Details */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Swiper Visual Gallery */}
            <div className="relative aspect-[16/10] bg-black overflow-hidden group border border-border flex items-center justify-center cursor-pointer" onClick={() => setLightboxOpen(true)}>
              {/* Layer 1: Blurred Ambient Background */}
              <AnimatePresence mode="wait">
                {allMedia[currentImageIndex] && !allMedia[currentImageIndex].match(/\.(mp4|webm|ogg)$/i) && (
                  <motion.img
                    key={`bg-${currentImageIndex}`}
                    src={allMedia[currentImageIndex]}
                    alt=""
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 select-none pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Layer 2: Crystal Clear Foreground Media */}
              <AnimatePresence mode="wait">
                {allMedia[currentImageIndex] ? (
                  allMedia[currentImageIndex].match(/\.(mp4|webm|ogg)$/i) ? (
                    <motion.video
                      key={`fg-video-${currentImageIndex}`}
                      src={allMedia[currentImageIndex]}
                      controls
                      playsInline
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full object-contain relative z-10"
                    />
                  ) : (
                    <motion.img
                      key={`fg-${currentImageIndex}`}
                      src={allMedia[currentImageIndex]}
                      alt={`Flat View ${currentImageIndex + 1}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full object-contain relative z-10"
                    />
                  )
                ) : (
                  <div className="text-muted-foreground text-sm relative z-10">No media available</div>
                )}
              </AnimatePresence>

              {allMedia.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 bg-black/60 text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all rounded-full z-20"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 bg-black/60 text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all rounded-full z-20"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Counter Badge */}
              <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 text-xs font-semibold text-white tracking-widest uppercase z-20">
                {currentImageIndex + 1} / {allMedia.length}
              </div>
            </div>

            {/* Header info */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                  Vacancy Count: {flatmate.vacancyCount}
                </span>
                <span className="bg-secondary text-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 border border-border">
                  {flatmate.genderPref}
                </span>
                <span className="bg-secondary text-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 border border-border">
                  Prefers: {flatmate.professionPref}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4 leading-tight">
                {flatmate.title}
              </h1>

              <div className="flex items-center gap-2 text-muted-foreground text-sm font-light">
                <MapPin size={16} className="text-primary shrink-0" />
                <span>{flatmate.colony}, {flatmate.location}, Hyderabad</span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-border pt-8">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-widest text-primary text-xs">
                About the Vacancy & Household
              </h2>
              <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-line text-base">
                {flatmate.description}
              </p>
            </div>

            {/* Lifestyle & Matchmaking Compatibility Traits */}
            <div className="border-t border-border pt-8">
              <h2 className="text-lg font-bold mb-4 uppercase tracking-widest text-primary text-xs">
                Lifestyle & Compatibility Habits
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {flatmate.lifestyleHabits.map((habit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-secondary/20 border border-border">
                    <div className="w-6 h-6 border border-primary/20 bg-primary/5 flex items-center justify-center shrink-0">
                      <Sparkles size={12} className="text-primary" />
                    </div>
                    <span className="text-sm font-light text-foreground/90">{habit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Price card, unlocked details */}
          <div className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              
              {/* Financial Box */}
              <div className="border border-border p-6 bg-background space-y-6">
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                    Your Share of Rent
                  </span>
                  <span className="text-4xl font-bold gold-gradient flex items-baseline">
                    <IndianRupee size={28} className="text-primary" strokeWidth={3} />
                    {flatmate.rentShare.toLocaleString("en-IN")}
                    <span className="text-xs text-muted-foreground font-light ml-1">/ month</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm font-light">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                      Security Deposit
                    </span>
                    <span className="font-bold text-foreground text-lg flex items-center">
                      <IndianRupee size={14} />
                      {flatmate.advanceShare.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">
                      Vacant Slots
                    </span>
                    <span className="font-bold text-foreground text-lg flex items-center gap-1.5">
                      <Users size={14} className="text-primary" /> {flatmate.vacancyCount} vacancy
                    </span>
                  </div>
                </div>
              </div>

              {/* Roommate Owner Profile Box */}
              <div className="border border-border p-6 bg-secondary/15 space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={displayedAvatar}
                    alt={displayedName}
                    className="w-12 h-12 rounded-full border-2 border-primary/20 object-cover"
                  />
                  <div>
                    <p className="font-bold text-sm flex items-center gap-1.5">
                      {displayedName}
                      <span className="bg-primary/10 border border-primary/20 text-primary text-[8px] font-bold uppercase px-1.5 py-0.5">
                        Verified Poster
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground font-light mt-0.5">
                      {flatmate.postedBy.age} y/o • Roommate Host
                    </p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3 space-y-2 text-xs font-light text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} className="text-primary" />
                    <span>Works as: <strong>{displayedProfession}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-primary" />
                    <span>Living in: <strong>{flatmate.location}</strong></span>
                  </div>
                </div>
              </div>

              {/* DIRECT CONTACT UNLOCKING MECHANISM */}
              <div className="border-2 border-primary bg-primary/5 p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 border border-primary flex items-center justify-center bg-primary/15 shrink-0 mt-0.5">
                    <Lock size={14} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Roommate Connection Panel</h3>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed mt-1">
                      Direct contact and WhatsApp details are encrypted for privacy. Unlock to reach out.
                    </p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {!contactUnlocked ? (
                    <motion.div
                      key="locked"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3"
                    >
                      {/* PRIMARY: Contact Plans */}
                      <p className="text-[10px] uppercase tracking-widest font-bold mb-3">Choose Contact Plan</p>
                      <div className="space-y-2 mb-4">
                        {PLANS.map(plan => (
                          <label key={plan.id}
                            className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${
                              selectedPlan.id === plan.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                            }`}>
                            <input type="radio" name="plan" checked={selectedPlan.id === plan.id}
                              onChange={() => setSelectedPlan(plan)} className="accent-primary" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold">{plan.label}</span>
                                {plan.badge && (
                                  <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold uppercase tracking-wider">{plan.badge}</span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{plan.perContact}/contact</span>
                            </div>
                            <span className="font-black text-primary">₹{plan.price}</span>
                          </label>
                        ))}
                      </div>

                      {payError && <p className="text-xs text-red-500 mb-3 flex items-center gap-1"><AlertCircle size={11}/>{payError}</p>}
                      <button
                        onClick={handlePay}
                        disabled={unlocking}
                        className="w-full bg-primary text-primary-foreground py-3.5 text-xs uppercase tracking-widest font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(212,175,55,0.2)] disabled:opacity-50"
                      >
                        {unlocking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" /> Processing...
                          </>
                        ) : (
                          <>Unlock Contact — ₹{selectedPlan.price}</>
                        )}
                      </button>
                      <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-light">
                        🔒 Razorpay Secure
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unlocked"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-2 border-t border-primary/20"
                    >
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase bg-green-50 border border-green-200 px-3 py-2 justify-center">
                        <CheckCircle2 size={14} /> Match Connection Active
                      </div>

                      {/* Contact items */}
                      <div className="space-y-2">
                        <div className="bg-background border border-border p-3 flex items-center justify-between">
                          <div>
                            <span className="block text-[8px] uppercase tracking-widest text-muted-foreground font-bold">
                              Phone Number
                            </span>
                            <span className="font-bold text-sm">{displayedPhone}</span>
                          </div>
                          <button
                            onClick={copyPhoneNumber}
                            className="text-xs text-primary font-bold hover:underline uppercase tracking-wider"
                          >
                            {copiedPhone ? "Copied" : "Copy"}
                          </button>
                        </div>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-[#25D366] text-white py-3 text-xs uppercase tracking-widest font-bold hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md"
                        >
                          <MessageCircle size={15} /> Message on WhatsApp
                        </a>
                      </div>

                      <p className="text-[10px] text-muted-foreground text-center font-light">
                        Always state you saw their profile on <strong>Takevolet</strong>.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Safety notice */}
              <div className="border border-border/50 p-4 rounded-sm text-[11px] font-light text-muted-foreground bg-secondary/10 flex gap-2">
                <ShieldCheck size={14} className="text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  We verify all posters&apos; Aadhaar cards before highlighting them. Never transfer advance deposit without physically visiting the flat and checking agreements.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Lightbox full gallery overlay */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center"
          >
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 text-white/70 hover:text-white hover:scale-110 transition-all w-12 h-12 flex items-center justify-center border border-white/10 rounded-full"
            >
              <X size={24} />
            </button>

            <div className="relative max-w-4xl max-h-[80vh] w-full mx-6 flex items-center justify-center">
              <img
                src={images[currentImageIndex]}
                alt="Flat Full View"
                className="max-w-full max-h-[80vh] object-contain border border-white/5"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 border border-white/20 bg-black/60 text-white flex items-center justify-center hover:bg-primary transition-all rounded-full"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 border border-white/20 bg-black/60 text-white flex items-center justify-center hover:bg-primary transition-all rounded-full"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
