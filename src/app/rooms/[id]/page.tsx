"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, IndianRupee, Calendar, Users, UserCheck, Sofa, Phone, ArrowLeft,
  ChevronLeft, ChevronRight, Play, X, Lock, CheckCircle2, Wifi,
  Car, Bike, Building2, Star, MessageCircle, Share2, Eye, Zap,
  BedDouble, ShieldCheck, AlertCircle, Loader2
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { fetchRoomByIdAction, checkRoomUnlockStatusAction } from "@/lib/server-actions";
import type { Room } from "@/lib/db";
import { useUser } from "@/hooks/useUser";



export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [contactUnlocked, setContactUnlocked] = useState(false);
  const [unlockedContact, setUnlockedContact] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [contactsLeft, setContactsLeft] = useState(0);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // ── Auth
  const { user } = useUser();
  const userId   = user?.id   || "guest";
  const userName = user?.name || "Seeker";
  const userEmail   = user?.email || "";
  const userPhone   = user?.phone || "";

  // ── Interest & Handover state ────────────────────────────────────────────
  const [step, setStep] = useState<"idle"|"interested"|"handover"|"done">("idle");
  const [interestId, setInterestId] = useState<string | null>(null);
  const [fullAddress, setFullAddress] = useState<string | null>(null);
  const [interestPaying, setInterestPaying] = useState(false);
  const [handoverPaying, setHandoverPaying] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  // ── Pricing Plans ────────────────────────────────────────────────────────
  const PLANS = [
    { id: "single",    label: "1 Contact",         contacts: 1,      price: 15,  paise: 1500,  badge: "",            perContact: "₹15" },
    { id: "starter",   label: "10 Contacts",       contacts: 10,     price: 55,  paise: 5500,  badge: "",            perContact: "₹5.50" },
    { id: "growth",    label: "50 Contacts",       contacts: 50,     price: 105, paise: 10500, badge: "Popular",     perContact: "₹2.10" },
    { id: "unlimited", label: "Unlimited Contacts", contacts: 999999, price: 200, paise: 20000, badge: "🔥 Best Deal",perContact: "₹0" },
  ];
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2]);

  // ── Load room: Supabase first, then MOCK fallback ─────────────────────────
  useEffect(() => {
    const id = params.id as string;
    const load = async () => {
      // Check if already unlocked
      if (userId !== "guest") {
        const contact = await checkRoomUnlockStatusAction(id, userId);
        if (contact) {
          setContactUnlocked(true);
          setUnlockedContact(contact);
        }
      }

      // 1. Try Supabase
      const dbRoom = await fetchRoomByIdAction(id);
      if (dbRoom) { setRoom(dbRoom); setRoomLoading(false); return; }
      // 2. Not found
      setRoom(null);
      setRoomLoading(false);
    };
    load();
  }, [params.id, userId]);

  if (roomLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36">
        <div className="text-center">
          <p className="text-2xl font-light mb-4">Room not found</p>
          <Link href="/rooms" className="text-primary hover:underline">← Back to Rooms</Link>
        </div>
      </div>
    );
  }


  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const images = room.images || [];
  const videos = room.videos || [];
  const allMedia = [...images, ...videos];

  const handlePrevMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(i => (i - 1 + allMedia.length) % allMedia.length);
  };
  const handleNextMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(i => (i + 1) % allMedia.length);
  };

  const openLightbox = (index: number) => { setLightboxIndex(index); setLightboxOpen(true); };

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

  // ── Real Razorpay Payment Flow ────────────────────────────────────────────
  const handlePay = async () => {
    if (userId === "guest") {
      alert("Please sign in to continue with this.");
      router.push("/auth");
      return;
    }

    setPayError(null);
    setPaying(true);

    try {
      // Step 1: Create server-side Razorpay order
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, userId, type: "contact_unlock", planId: selectedPlan.id, amount: selectedPlan.paise }),
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      // Step 2: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Could not load Razorpay. Check your internet connection.");

      setPaying(false);

      // Step 3: Open Razorpay Checkout
      const options = {
        key: orderData.keyId,                       // rzp_test_... or rzp_live_...
        amount: orderData.amount,                   // in paise (150000 = ₹1,500)
        currency: orderData.currency,               // "INR"
        name: "Takevolet",
        description: `${selectedPlan.label} — Unlock Contact`,
        image: "/logo.png",
        order_id: orderData.orderId,
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
        },
        notes: {
          roomId: room.id,
          roomTitle: room.title,
          packType: "5_contacts_30_days",
        },
        theme: { color: "#D4AF37" },               // RoomRelay gold primary color
        modal: {
          ondismiss: () => {
            setPaying(false);
            setPayError("Payment cancelled. No amount was charged.");
          },
        },
        // Step 4: On payment success — verify signature server-side
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            setPaying(true);
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                roomId: room.id,
                userId,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.verified) {
              throw new Error(verifyData.error || "Payment verification failed");
            }

            // ✅ Payment verified — unlock contact
            setUnlockedContact(verifyData.contact);
            setContactsLeft(selectedPlan.contacts === 999999 ? 999 : selectedPlan.contacts);
            setPaySuccess(true);
            setTimeout(() => {
              setPaymentModal(false);
              setContactUnlocked(true);
              setPaySuccess(false);
            }, 1800);

          } catch (err: any) {
            setPayError(err.message || "Verification failed. Contact support.");
          } finally {
            setPaying(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);

      // Handle payment failures inside modal
      rzp.on("payment.failed", (response: any) => {
        setPayError(
          `Payment failed: ${response.error.description || "Unknown error"}. Code: ${response.error.code}`
        );
        setPaying(false);
      });

      rzp.open();

    } catch (err: any) {
      setPayError(err.message || "Something went wrong. Please try again.");
      setPaying(false);
    }
  };

  // ── STEP 1: Pay ₹500 — I’m Interested (unlock full address) ────────────
  const handleInterest = async () => {
    if (userId === "guest") {
      alert("Please sign in to continue with this.");
      router.push("/auth");
      return;
    }

    setFlowError(null);
    setInterestPaying(true);
    try {
      const orderRes = await fetch("/api/interest/unlock?action=create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, userId, userName }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load Razorpay");
      setInterestPaying(false);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Takevolet",
        description: "Address Unlock — I’m Interested",
        order_id: orderData.orderId,
        theme: { color: "#D4AF37" },
        modal: { ondismiss: () => { setInterestPaying(false); setFlowError("Payment cancelled."); } },
        handler: async (resp: any) => {
          setInterestPaying(true);
          const verifyRes = await fetch("/api/interest/unlock?action=verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...resp,
              roomId: room.id,
              userId,
              userName,
              roomTitle: room.title,
              posterName: room.profiles?.full_name || "Poster",
              posterId: room.user_id,
            }),
          });
          const vData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(vData.error || "Verification failed");
          setInterestId(vData.interestId);
          setFullAddress(vData.fullAddress);
          setStep("interested");
          setInterestPaying(false);
        },
      };
      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      setFlowError(err.message);
      setInterestPaying(false);
    }
  };

  // ── STEP 2: Pay ₹1,000 — Confirm Handover (poster earns commission) ────
  const handleHandover = async () => {
    if (userId === "guest") {
      alert("Please sign in to continue with this.");
      router.push("/auth");
      return;
    }

    setFlowError(null);
    setHandoverPaying(true);
    try {
      const orderRes = await fetch("/api/interest/unlock?action=create-handover-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, userId, interestId }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create handover order");

      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Could not load Razorpay");
      setHandoverPaying(false);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Takevolet",
        description: "Handover Confirmation — ₹1,000 to Poster",
        order_id: orderData.orderId,
        theme: { color: "#D4AF37" },
        modal: { ondismiss: () => { setHandoverPaying(false); setFlowError("Payment cancelled."); } },
        handler: async (resp: any) => {
          setHandoverPaying(true);
          const verifyRes = await fetch("/api/interest/unlock?action=verify-handover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...resp, roomId: room.id, userId, interestId }),
          });
          const vData = await verifyRes.json();
          if (!verifyRes.ok) throw new Error(vData.error || "Verification failed");
          setStep("done");
          setHandoverPaying(false);
        },
      };
      new (window as any).Razorpay(options).open();
    } catch (err: any) {
      setFlowError(err.message);
      setHandoverPaying(false);
    }
  };

  const parking = room.parking || "None";
  const parkingIcon = parking.includes("Car") ? Car : parking.includes("Bike") ? Bike : null;

  return (
    <div className="pt-36 pb-20 min-h-screen">
      {/* Back */}
      <div className="container mx-auto px-6 md:px-12 mb-6 pt-6">
        <Link href="/rooms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to Rooms
        </Link>
      </div>

      {/* Content and Media Grid */}
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-10">

          {/* TOP LEFT (Images, Title, Quick Facts) */}
          <div className="lg:col-span-2 space-y-10 order-1">
            
            {/* Main Image Gallery */}
        <div className="relative aspect-[16/10] bg-black overflow-hidden group border border-border flex items-center justify-center cursor-pointer" onClick={() => openLightbox(currentImageIndex)}>
          
          {/* Background Layer: Ambient Blur (only for images) */}
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

          {/* Foreground Layer: Crystal Clear Uncropped */}
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
                  alt={`Room View ${currentImageIndex + 1}`}
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
                onClick={handlePrevMedia}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 bg-black/60 text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all rounded-full z-20"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNextMedia}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-white/20 bg-black/60 text-white flex items-center justify-center hover:bg-primary hover:border-primary transition-all rounded-full z-20"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Counter Badge */}
          {allMedia.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 text-xs font-semibold text-white tracking-widest uppercase z-20">
              {currentImageIndex + 1} / {allMedia.length}
            </div>
          )}
        </div>

        {/* Title & Location */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${room.tenant_type === 'family' ? 'bg-blue-100 text-blue-700' : 'bg-primary/10 text-primary'}`}>
                  {room.tenant_type === 'family' ? '👨‍👩‍👧‍👦 Family' : '🎓 Bachelors'}
                </span>
                <span className="bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-wider">{room.furnishing || "Semi-Furnished"}</span>
                <span className="bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-wider flex items-center gap-1">
                  <Calendar size={10} /> {getDaysLeft(room.leaving_date || "")} days left
                </span>
                {(room.images || []).length > 1 && (
                  <div className="bg-background/80 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold flex items-center gap-1 border border-border">
                    <Eye size={12} /> {(room.images || []).length} photos
                  </div>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{room.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <MapPin size={16} className="text-primary" />
                <span className="font-medium">{room.colony}, <span className="text-foreground font-semibold">{room.location}</span>, Hyderabad</span>
              </div>
              <p className="text-sm text-muted-foreground">Leaving by: <strong className="text-foreground">{room.leaving_date ? new Date(room.leaving_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "TBD"}</strong></p>
            </div>

            {/* Quick Facts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
              {[
                { icon: IndianRupee, label: "Monthly Rent", value: `₹${room.rent.toLocaleString("en-IN")}`, sub: "per month" },
                { icon: IndianRupee, label: "Advance", value: `₹${(room.advance || 0).toLocaleString("en-IN")}`, sub: "one time" },
                { icon: Users, label: "Members", value: `${room.members_allowed || 2}`, sub: "allowed" },
                { icon: Building2, label: "Current", value: `${room.current_members || 1}`, sub: "bachelors" },
              ].map((fact, i) => (
                <div key={i} className="bg-background p-5 text-center">
                  <fact.icon size={20} className="text-primary mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{fact.label}</p>
                  <p className="font-bold text-lg">{fact.value}</p>
                  <p className="text-[10px] text-muted-foreground">{fact.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM LEFT (Description, Amenities, Photos) */}
          <div className="lg:col-span-2 space-y-10 order-3 lg:order-none lg:row-start-2 lg:col-start-1">

            {/* Description */}
            <div>
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">About This Room</h2>
              <p className="text-muted-foreground leading-relaxed font-light">{room.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Amenities & Rules</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
                  <Users size={12} /> {room.members_allowed || 2} allowed
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-secondary text-[11px] font-medium uppercase tracking-wider">
                  <UserCheck size={12} /> {(room.gender_preference || "Any").split(" ")[0]}
                </span>
                {(room.parking || "None") !== "No Parking" && (room.parking || "").length > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-[11px] font-bold uppercase">
                    {(room.parking || "").includes("Car") ? <Car size={10} /> : <Bike size={10} />} {room.parking}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-medium uppercase">No Parking</span>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(room.amenities || []).map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 border border-border bg-secondary/20">
                    <ShieldCheck size={14} className="text-primary shrink-0" />
                    <span className="text-sm font-medium">{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Furniture */}
            {(room.furniture || []).length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Furniture & Items Included</h2>
                <div className="flex flex-wrap gap-2">
                  {(room.furniture || []).map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-secondary/30 text-sm font-medium">
                      <BedDouble size={12} className="text-primary" /> {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Photo Gallery Strip */}
            <div>
              <h2 className="text-lg font-bold mb-4 uppercase tracking-wide">Photos</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <div key={i} onClick={() => openLightbox(i)} className="flex-shrink-0 w-32 h-24 overflow-hidden cursor-pointer border border-border group">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT — Interest Flow & Posted By */}
          <div className="space-y-6 order-2 lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2">

            {/* Posted By */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-6 bg-secondary/20">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Posted By</p>
              {(() => {
                const p = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles;
                return (
                  <div className="flex items-center gap-4 mb-5">
                    {p?.avatar_url || unlockedContact?.avatar ? (
                      <img src={p?.avatar_url || unlockedContact?.avatar || ""} alt={p?.full_name || unlockedContact?.name || ""} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover border-2 border-primary/30" />
                    ) : (
                      <div className="w-16 h-16 rounded-full border-2 border-primary bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">{((p?.full_name || unlockedContact?.name || "?")[0])}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-base">{p?.full_name || unlockedContact?.name || "Room Owner"}</p>
                      <p className="text-xs text-muted-foreground">{p?.profession || unlockedContact?.profession || ""}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => <Star key={s} size={10} className="text-primary fill-primary" />)}
                        <span className="text-[10px] text-muted-foreground ml-1">Verified</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── STEP INDICATOR ──────────────────────────────────── */}
              <div className="flex items-center gap-1.5 mb-5">
                {["Interested","Visit Room","Confirmed"].map((label, i) => {
                  const active = (step === "idle" && i === 0) || (step === "interested" && i === 1) || (step === "done" && i === 2);
                  const done   = (step === "interested" && i === 0) || (step === "done" && i < 2);
                  return (
                    <React.Fragment key={label}>
                      <div className={`flex items-center gap-1 px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
                        done ? "bg-green-100 text-green-700" : active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        {done && <CheckCircle2 size={9} />}{i+1}. {label}
                      </div>
                      {i < 2 && <div className="flex-1 h-px bg-border" />}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* ── IDLE: Pricing Plans (primary) ──────────────────────── */}
              {step === "idle" && (
                <div>
                  {contactUnlocked && unlockedContact ? (
                    <div className="bg-green-50 border border-green-200 p-5 mb-5 text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 size={24} className="text-green-600" />
                      </div>
                      <h3 className="font-bold text-green-800 text-lg mb-1">Contact Unlocked</h3>
                      <p className="text-sm text-green-700 font-mono font-bold text-xl mb-4">{unlockedContact.phone || unlockedContact.whatsapp || "No Number Available"}</p>
                      <div className="flex gap-2">
                        <a href={`tel:${unlockedContact.phone}`} className="flex-1 bg-green-600 text-white py-3 text-xs uppercase tracking-wider font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-1.5 rounded-sm">
                          <Phone size={13}/> Call Now
                        </a>
                        <a href={`https://wa.me/${(unlockedContact.whatsapp || unlockedContact.phone || "").replace(/[^0-9]/g,"")}`} target="_blank" className="flex-1 border border-green-600 text-green-700 py-3 text-xs uppercase tracking-wider font-bold hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-1.5 rounded-sm">
                          <MessageCircle size={13}/> WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Blurred contact preview */}
                      <div className="relative mb-4">
                        <div className="blur-sm select-none p-4 bg-secondary/50 border border-border">
                          <p className="font-mono font-bold">+91 XXXXX XXXXX</p>
                          <p className="text-xs text-muted-foreground">Full address hidden</p>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock size={22} className="text-muted-foreground" />
                        </div>
                      </div>

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
                      <button onClick={() => setPaymentModal(true)}
                        className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-3">
                        <Phone size={15}/> Unlock Contact — ₹{selectedPlan.price}
                      </button>
                    </>
                  )}

                  {/* SECONDARY: I'm Interested — address unlock */}
                  <div className="border border-dashed border-primary/30 p-4 bg-primary/3">
                    <p className="text-xs font-bold mb-1 flex items-center gap-1.5"><Zap size={12} className="text-primary"/>Want the full address too?</p>
                    <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
                      Pay <strong className="text-primary">₹500</strong> → Full address revealed instantly → Visit room → Like it? Pay <strong>₹1,000</strong> → Handover confirmed, poster earns ₹1,000
                    </p>
                    {flowError && <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><AlertCircle size={11}/>{flowError}</p>}
                    <button onClick={handleInterest} disabled={interestPaying}
                      className="w-full border border-primary text-primary py-3 text-xs uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {interestPaying
                        ? <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>Processing…</>
                        : <><Zap size={13}/> I'm Interested — ₹500 (Address Unlock)</>}
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-2">🔒 Razorpay · UPI · Cards · NetBanking</p>
                </div>
              )}

              {/* ── INTERESTED: Address revealed, visit & confirm ────────── */}
              {step === "interested" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="bg-green-50 border border-green-200 p-4 mb-4">
                    <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                      <CheckCircle2 size={12}/> Address Unlocked — ₹500 Paid
                    </p>
                    <p className="text-sm font-semibold text-green-800">{fullAddress}</p>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <a href={`tel:${room.profiles?.phone}`}
                      className="flex-1 bg-foreground text-background py-3 text-xs uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-1.5">
                      <Phone size={13}/> Call
                    </a>
                    <a href={`https://wa.me/${(room.profiles?.whatsapp || room.profiles?.phone || "").replace(/[^0-9]/g,"")}`} target="_blank"
                      className="flex-1 border border-green-500 text-green-600 py-3 text-xs uppercase tracking-wider font-bold hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-1.5">
                      <MessageCircle size={13}/> WhatsApp
                    </a>
                  </div>
                  <div className="border border-border p-4 mb-4">
                    <p className="text-xs font-bold mb-1">Visited & liked the room?</p>
                    <p className="text-xs text-muted-foreground">Confirm your handover. <strong>₹1,000</strong> goes directly to <strong>{room.profiles?.full_name || "the poster"}</strong> as commission.</p>
                  </div>
                  {flowError && <p className="text-xs text-red-500 mb-3 flex items-center gap-1"><AlertCircle size={11}/>{flowError}</p>}
                  <button onClick={handleHandover} disabled={handoverPaying}
                    className="w-full bg-foreground text-background py-4 text-sm uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {handoverPaying
                      ? <><div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"/>Processing…</>
                      : <><CheckCircle2 size={15}/> Confirm Handover — ₹1,000</>}
                  </button>
                  <p className="text-center text-[10px] text-muted-foreground mt-2">₹1,000 to poster · ₹500 platform fee (already paid)</p>
                </motion.div>
              )}

              {/* ── DONE: Handover complete ──────────────────────────────── */}
              {step === "done" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 p-6 text-center">
                  <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
                  <h3 className="font-black text-lg text-green-800 mb-1">Handover Confirmed! 🎉</h3>
                  <p className="text-sm text-green-700">{room.profiles?.full_name || "The poster"} has received ₹1,000 commission.</p>
                  <p className="text-xs text-green-600 mt-1">Welcome to your new room! Congratulations.</p>
                </motion.div>
              )}

            </motion.div>

            {/* Price Summary */}
            <div className="border border-border p-6">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Price Breakdown</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Monthly Rent</span>
                  <span className="font-bold">₹{room.rent.toLocaleString("en-IN")}/mo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Security Advance</span>
                  <span className="font-bold">₹{(room.advance || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold">Move-in Cost</span>
                  <span className="font-bold text-primary">₹{(room.rent + (room.advance || 0)).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* Share */}
            <button
              onClick={() => navigator.share?.({ title: room.title, url: window.location.href })}
              className="w-full border border-border py-3 text-sm uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Share2 size={14} /> Share This Room
            </button>
          </div>
        </div>
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6 text-white/60 hover:text-white z-10">
              <X size={28} />
            </button>

            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i - 1 + images.length) % images.length); }}
              className="absolute left-4 text-white/60 hover:text-white p-2 z-10">
              <ChevronLeft size={36} />
            </button>

            <div onClick={e => e.stopPropagation()} className="max-w-5xl w-full max-h-[85vh] relative">
              <img src={images[lightboxIndex]} alt="" className="w-full h-full object-contain max-h-[85vh]" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {lightboxIndex + 1} / {images.length}
              </div>
            </div>

            <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(i => (i + 1) % images.length); }}
              className="absolute right-4 text-white/60 hover:text-white p-2 z-10">
              <ChevronRight size={36} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {paymentModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !paying && setPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-background border border-border p-8 max-w-md w-full"
            >
              {paySuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Payment Successful! 🎉</h3>
                  <p className="text-muted-foreground text-sm mb-1">Contact is now unlocked.</p>
                  <p className="text-xs text-primary font-semibold">
                    {selectedPlan.contacts === 999999 ? "Unlimited" : selectedPlan.contacts} contacts activated
                  </p>
                </div>
              ) : (
                <>
                  <button onClick={() => setPaymentModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                    <X size={20} />
                  </button>

                  {/* Header */}
                  <div className="text-center mb-5">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Lock size={20} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Unlock Contact Details</h3>
                    <p className="text-xs text-muted-foreground">Choose a plan · Call or WhatsApp directly · No broker</p>
                  </div>

                  {/* Plan Selector */}
                  <div className="grid grid-cols-1 gap-2 mb-4">
                    {PLANS.map((plan) => (
                      <button key={plan.id} onClick={() => setSelectedPlan(plan)}
                        className={`relative flex items-center justify-between px-4 py-3 border text-left transition-all ${
                          selectedPlan.id === plan.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedPlan.id === plan.id ? "border-primary" : "border-border"
                          }`}>
                            {selectedPlan.id === plan.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{plan.label}</p>
                            <p className="text-[10px] text-muted-foreground">{plan.perContact}/contact</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {plan.badge && (
                            <span className="text-[9px] bg-primary text-primary-foreground px-2 py-0.5 font-bold uppercase tracking-wider">
                              {plan.badge}
                            </span>
                          )}
                          <span className={`font-black text-base ${selectedPlan.id === plan.id ? "text-primary" : ""}`}>
                            ₹{plan.price}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Selected summary */}
                  <div className="bg-primary/5 border border-primary/20 px-4 py-3 mb-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Selected</p>
                      <p className="font-bold text-sm">{selectedPlan.label}</p>
                    </div>
                    <p className="text-2xl font-black text-primary">₹{selectedPlan.price}</p>
                  </div>

                  {/* Error */}
                  {payError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                      {payError}
                    </div>
                  )}

                  <button onClick={handlePay} disabled={paying}
                    className="w-full bg-primary text-primary-foreground py-4 font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {paying ? (
                      <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Connecting to Razorpay…</>
                    ) : (
                      <>Pay ₹{selectedPlan.price} — {selectedPlan.contacts === 999999 ? "Unlimited" : selectedPlan.contacts} Contacts</>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-muted-foreground mt-2">
                    🔒 Secured by <strong>Razorpay</strong> · UPI · Cards · NetBanking
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
