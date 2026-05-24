"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// Smart avatar: shows image or initials
function Avatar({ src, name, size = 16 }: { src?: string; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const dim = `w-${size} h-${size}`;
  if (!src || failed) {
    return (
      <div className={`${dim} rounded-full border-2 border-primary bg-primary flex items-center justify-center shrink-0`}>
        <span className="text-primary-foreground font-bold text-sm leading-none">{initials}</span>
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full border-2 border-primary overflow-hidden shrink-0`}>
      <img src={src} alt={name} className="w-full h-full object-cover"
        onError={() => setFailed(true)} referrerPolicy="no-referrer" />
    </div>
  );
}
import {
  User, MapPin, Phone, Mail, Briefcase, Users, Home, ShoppingBag,
  IndianRupee, CheckCircle2, Clock, TrendingUp, Wallet, Plus,
  ArrowUpRight, Edit2, Trash2, Eye, LogOut, Settings,
  CreditCard, Building2, AlertCircle, Send, X, ChevronDown
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { getUserRooms, getUserEarnings, getUserPayouts, deleteRoom, getContactUnlocks, getProfile, upsertProfile, type Room, type Earning, type PayoutRequest, type ContactUnlock } from "@/lib/db";
import { getUserFlatmates, deleteUserFlatmate } from "@/lib/flatmate-db";
import type { Flatmate as FlatmateType } from "@/data/mock";
import { supabase } from "@/lib/supabase";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useUser();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [myFlatmates, setMyFlatmates] = useState<FlatmateType[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [contactUnlocks, setContactUnlocks] = useState<ContactUnlock[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "earnings" | "payout" | "profile">(
    (searchParams.get("tab") as "overview" | "listings" | "earnings" | "payout" | "profile") || "overview"
  );
  const [showPostDropdown, setShowPostDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  // ── Payout state ───────────────────────────────────────────────────────────
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank" | "qrcode">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [payoutQrCode, setPayoutQrCode] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [qrUploading, setQrUploading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [savedPayoutDetails, setSavedPayoutDetails] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      // Load rooms and flatmates concurrently
      setRoomsLoading(true);
      Promise.all([
        getUserRooms(user.id),
        getUserFlatmates(user.id)
      ]).then(([rooms, flatmates]) => {
        setMyRooms(rooms);
        setMyFlatmates(flatmates);
        setRoomsLoading(false);
      }).catch(err => {
        console.error("Error loading dashboard listings:", err);
        setRoomsLoading(false);
      });
      // Load earnings from Supabase
      getUserEarnings(user.id).then(setEarnings);
      // Load payout history from Supabase
      getUserPayouts(user.id).then(setPayoutHistory);
      // Load contact unlocks for this poster
      getContactUnlocks(user.id).then(setContactUnlocks);
      // Load saved payout details from Supabase profiles table
      getProfile(user.id).then((profile) => {
        if (profile) {
          const method = (profile.payout_method as any) || "upi";
          setSavedPayoutDetails({
            method,
            upiId: profile.upi_id || "",
            bankAccount: profile.bank_account || "",
            bankIfsc: profile.bank_ifsc || "",
            bankName: profile.bank_name || "",
            qrCode: profile.payout_qr_code || ""
          });
          setPayoutMethod(method);
          setUpiId(profile.upi_id || "");
          setBankAccount(profile.bank_account || "");
          setBankIfsc(profile.bank_ifsc || "");
          setBankName(profile.bank_name || "");
          setPayoutQrCode(profile.payout_qr_code || "");
        }
      });
    }
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Compute earnings summary from Supabase Earning[]  
  const total    = earnings.filter(e => e.status === "completed").reduce((s, e) => s + e.amount, 0);
  const pending  = earnings.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const completed = earnings.filter(e => e.status === "completed").length;
  const totalUnlocks = contactUnlocks.length;
  const summary = [
    { icon: Wallet,      label: "Total Earned",    value: `₹${total.toLocaleString("en-IN")}`,  color: "text-green-600" },
    { icon: Clock,       label: "Pending",          value: `₹${pending.toLocaleString("en-IN")}`, color: "text-yellow-600" },
    { icon: Home,        label: "My Listings",      value: (myRooms.length + myFlatmates.length).toString(), color: "text-primary" },
    { icon: Phone,       label: "Contact Unlocks",  value: totalUnlocks.toString(), color: "text-blue-500" },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await deleteRoom(id);
    setMyRooms(prev => prev.filter(r => r.id !== id));
  };

  const handleDeleteFlatmate = async (id: string) => {
    if (!confirm("Delete this flatmate listing?")) return;
    await deleteUserFlatmate(id);
    setMyFlatmates(prev => prev.filter(f => f.id !== id));
  };

  // ── Save payout details ───────────────────────────────────────────────────
  const handleSavePayoutDetails = async () => {
    setPayoutSubmitting(true);
    const details = { 
      method: payoutMethod, 
      upiId, 
      bankAccount, 
      bankIfsc, 
      bankName,
      qrCode: payoutQrCode
    };
    
    // Save to Supabase
    await upsertProfile({
      id: user!.id,
      payout_method: payoutMethod,
      upi_id: upiId,
      bank_account: bankAccount,
      bank_ifsc: bankIfsc,
      bank_name: bankName,
      payout_qr_code: payoutQrCode,
    });
    
    setSavedPayoutDetails(details);
    setPayoutSubmitting(false);
    alert("Payout details permanently saved securely!");
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      alert("QR code image must be under 5MB");
      return;
    }
    
    setQrUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${user!.id}-${Date.now()}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from("rooms")
        .upload(`qrcodes/${fileName}`, file, { upsert: true });
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("rooms")
        .getPublicUrl(`qrcodes/${fileName}`);
        
      setPayoutQrCode(publicUrl);
    } catch (error: any) {
      alert("Failed to upload QR code: " + error.message);
    } finally {
      setQrUploading(false);
    }
  };

  // ── Submit withdrawal request ─────────────────────────────────────────────
  const handleWithdraw = async () => {
    setPayoutError(null);
    setPayoutSuccess(null);
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amt) || amt < 100) {
      setPayoutError("Minimum withdrawal amount is ₹100");
      return;
    }
    if (amt > total) {
      setPayoutError(`You only have ₹${total} available to withdraw`);
      return;
    }
    if (payoutMethod === "upi" && !upiId.trim()) {
      setPayoutError("Please save your UPI ID first");
      return;
    }
    if (payoutMethod === "bank" && (!bankAccount.trim() || !bankIfsc.trim())) {
      setPayoutError("Please save your bank details first");
      return;
    }
    if (payoutMethod === "qrcode" && !payoutQrCode.trim()) {
      setPayoutError("Please upload your QR code first");
      return;
    }
    setPayoutSubmitting(true);
    try {
      const res = await fetch("/api/payout/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          amount: amt,
          method: payoutMethod,
          upiId: payoutMethod === "upi" ? upiId : undefined,
          bankAccount: payoutMethod === "bank" ? bankAccount : undefined,
          bankIfsc: payoutMethod === "bank" ? bankIfsc : undefined,
          bankName: payoutMethod === "bank" ? bankName : undefined,
          qrCode: payoutMethod === "qrcode" ? payoutQrCode : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      // Save to local history
      const newEntry = {
        id: data.requestId,
        amount: amt,
        method: payoutMethod,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };
      const updated = [newEntry, ...payoutHistory];
      setPayoutHistory(updated);
      localStorage.setItem(`payout_history_${user.id}`, JSON.stringify(updated));
      setPayoutSuccess(data.message);
      setWithdrawAmount("");
    } catch (err: any) {
      setPayoutError(err.message || "Failed to submit request");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  const combinedRecent = [
    ...myRooms.map(r => ({ ...r, type: "room" as const, date: r.created_at })),
    ...myFlatmates.map(f => ({ ...f, type: "flatmate" as const, date: f.createdAt }))
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const combinedListings = [
    ...myRooms.map(r => ({ ...r, type: "room" as const, date: r.created_at })),
    ...myFlatmates.map(f => ({ ...f, type: "flatmate" as const, date: f.createdAt }))
  ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar} name={user.name} size={16} />
            <div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-1">My Dashboard</motion.p>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">
                {user.name}
              </motion.h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin size={10} className="text-primary" /> {user.location || "Hyderabad"}
                {user.profession && <><span className="mx-1">·</span>
                <Briefcase size={10} /> {user.profession}</>}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowPostDropdown(!showPostDropdown)}
                className="bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
              >
                <Plus size={13} /> Post Listing <ChevronDown size={12} className={`transition-transform ${showPostDropdown ? "rotate-180" : ""}`} />
              </button>
              {showPostDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowPostDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border shadow-xl z-20 py-1.5">
                    <Link href="/post/room" onClick={() => setShowPostDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-secondary transition-colors text-left w-full text-foreground border-b border-border/50">
                      <Home size={12} className="text-primary" /> Post Room
                    </Link>
                    <Link href="/post/flatmate" onClick={() => setShowPostDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-secondary transition-colors text-left w-full text-foreground border-b border-border/50">
                      <Users size={12} className="text-primary" /> Post Flatmate
                    </Link>
                    <Link href="/post/item" onClick={() => setShowPostDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-secondary transition-colors text-left w-full text-foreground">
                      <ShoppingBag size={12} className="text-primary" /> Sell/Rent Item
                    </Link>
                  </div>
                </>
              )}
            </div>
            <button onClick={async () => { await logout(); router.push("/"); }}
              className="border border-border px-4 py-2.5 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-1.5">
              <LogOut size={13} /> Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-10 overflow-x-auto">
          {(["overview", "listings", "earnings", "payout", "profile"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-xs uppercase tracking-widest font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab === "payout" ? "💳 Payout" : tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-10">
              {summary.map((s, i) => (
                <div key={i} className="bg-background p-6 text-center">
                  <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} strokeWidth={1.5} />
                  <p className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {[
                { icon: Home, label: "Post a Room", sub: "Leaving your flat? List it now", href: "/post/room", primary: true },
                { icon: Users, label: "Post Flatmate", sub: "Have a vacancy? Match now", href: "/post/flatmate", primary: true },
                { icon: ShoppingBag, label: "Sell / Rent Items", sub: "Furniture, electronics & appliances", href: "/post/item", primary: false },
                { icon: Settings, label: "Edit Profile", sub: "Update your info anytime", href: "/profile/edit", primary: false },
              ].map((a, i) => (
                <Link key={i} href={a.href}
                  className={`p-5 border flex flex-col justify-between items-start gap-4 group transition-all h-full ${a.primary ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-border hover:border-primary"}`}>
                  <div className="w-10 h-10 border border-primary/20 flex items-center justify-center bg-background shrink-0">
                    <a.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm mb-1">{a.label}</p>
                    <p className="text-xs text-muted-foreground leading-normal">{a.sub}</p>
                  </div>
                  <div className="w-full flex justify-end mt-2">
                    <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>

            {/* My Recent Listings */}
            <h3 className="text-sm uppercase tracking-widest font-bold mb-5">My Recent Listings</h3>
            {combinedRecent.length === 0 ? (
              <div className="border border-dashed border-border p-12 text-center">
                <Home size={28} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">No listings yet</p>
                <p className="text-sm text-muted-foreground mb-5">Post your first room or flatmate listing and start earning.</p>
                <div className="flex justify-center gap-3">
                  <Link href="/post/room" className="bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all inline-flex items-center gap-1.5">
                    <Plus size={13} /> Post My Room
                  </Link>
                  <Link href="/post/flatmate" className="bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all inline-flex items-center gap-1.5">
                    <Users size={13} /> Post Flatmate
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedRecent.slice(0, 3).map(item => {
                  const isRoom = item.type === "room";
                  const image = isRoom ? (item.images || [])[0] : (item.images || [])[0];
                  const rentStr = isRoom ? `₹${item.rent.toLocaleString("en-IN")}/mo` : `₹${item.rentShare.toLocaleString("en-IN")}/mo`;
                  const locationStr = `${item.colony}, ${item.location}`;
                  const isActive = isRoom ? item.is_available : item.isAvailable;
                  const detailHref = isRoom ? `/rooms/${item.id}` : `/flatmates/${item.id}`;
                  const deleteFn = isRoom ? () => handleDelete(item.id) : () => handleDeleteFlatmate(item.id);

                  return (
                    <div key={item.id} className="border border-border p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-secondary shrink-0 overflow-hidden relative">
                        {image ? (
                          <img src={image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          isRoom ? <Home size={20} className="text-muted-foreground m-auto mt-4" /> : <Users size={20} className="text-muted-foreground m-auto mt-4" />
                        )}
                        <span className="absolute top-0.5 left-0.5 text-[8px] font-bold uppercase px-1 py-0.2 bg-background border border-border">
                          {isRoom ? "🏠 Room" : "👥 Flatmate"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{locationStr} · {rentStr}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 mt-1 ${isActive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                          {isActive ? <CheckCircle2 size={9} /> : <Clock size={9} />} {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Link href={detailHref} className="w-8 h-8 border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                          <Eye size={13} />
                        </Link>
                        <button onClick={deleteFn} className="w-8 h-8 border border-border flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {combinedRecent.length > 3 && (
                  <button onClick={() => setActiveTab("listings")} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">
                    View all {combinedRecent.length} listings →
                  </button>
                )}
              </div>
            )}

            {/* ── WHO UNLOCKED MY CONTACT ── */}
            <div className="mt-12">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm uppercase tracking-widest font-bold flex items-center gap-2">
                  <Phone size={14} className="text-blue-500" />
                  Who Unlocked My Contact
                  {contactUnlocks.length > 0 && (
                    <span className="ml-2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {contactUnlocks.length}
                    </span>
                  )}
                </h3>
                {contactUnlocks.length > 0 && (
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Total earned from unlocks: <strong className="text-green-600">~₹{(contactUnlocks.length * 10).toLocaleString("en-IN")}+</strong>
                  </span>
                )}
              </div>

              {contactUnlocks.length === 0 ? (
                <div className="border border-dashed border-border p-10 text-center">
                  <Phone size={24} className="mx-auto text-muted-foreground mb-3" />
                  <p className="font-semibold mb-1">No contact unlocks yet</p>
                  <p className="text-sm text-muted-foreground">When a bachelor pays to unlock your contact from your listing, they will appear here instantly.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contactUnlocks.slice(0, 10).map((unlock, i) => {
                    const timeAgo = unlock.paid_at ? (() => {
                      const diff = Date.now() - new Date(unlock.paid_at!).getTime();
                      const mins = Math.floor(diff / 60000);
                      const hrs = Math.floor(mins / 60);
                      const days = Math.floor(hrs / 24);
                      if (days > 0) return `${days}d ago`;
                      if (hrs > 0) return `${hrs}h ago`;
                      if (mins > 0) return `${mins}m ago`;
                      return "Just now";
                    })() : "";
                    return (
                      <motion.div key={unlock.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="border border-border p-4 flex items-center gap-4 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {unlock.seeker_avatar ? (
                            <img src={unlock.seeker_avatar} alt={unlock.seeker_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-blue-500 font-black text-sm">
                              {(unlock.seeker_name || "A").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-sm">{unlock.seeker_name || "Anonymous Bachelor"}</p>
                            {unlock.seeker_profession && (
                              <span className="text-[9px] bg-secondary px-2 py-0.5 uppercase tracking-wider font-medium">
                                {unlock.seeker_profession}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Unlocked your contact for <strong className="text-foreground">{unlock.room_title || "your room"}</strong>
                            {unlock.room_location && <span> · {unlock.room_location}</span>}
                          </p>
                        </div>
                        {/* Right side */}
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-blue-500">🔓 Unlocked</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  {contactUnlocks.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      + {contactUnlocks.length - 10} more unlocks — check Earnings tab for full history
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── LISTINGS ─────────────────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-widest font-bold">My Listings ({combinedListings.length})</h2>
              <div className="relative">
                <button 
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  className="bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <Plus size={12} /> Add New <ChevronDown size={11} className={`transition-transform ${showAddDropdown ? "rotate-180" : ""}`} />
                </button>
                {showAddDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAddDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-background border border-border shadow-xl z-20 py-1.5">
                      <Link href="/post/room" onClick={() => setShowAddDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-secondary transition-colors text-left w-full text-foreground border-b border-border/50">
                        <Home size={12} className="text-primary" /> Post Room
                      </Link>
                      <Link href="/post/flatmate" onClick={() => setShowAddDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-secondary transition-colors text-left w-full text-foreground border-b border-border/50">
                        <Users size={12} className="text-primary" /> Post Flatmate
                      </Link>
                      <Link href="/post/item" onClick={() => setShowAddDropdown(false)} className="flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-wider font-bold hover:bg-secondary transition-colors text-left w-full text-foreground">
                        <ShoppingBag size={12} className="text-primary" /> Sell/Rent Item
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
            {roomsLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : combinedListings.length === 0 ? (
              <div className="border border-dashed border-border p-16 text-center">
                <Home size={32} className="mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold mb-2">No listings yet</p>
                <div className="flex justify-center gap-3">
                  <Link href="/post/room" className="bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:opacity-90 inline-flex items-center gap-1.5">
                    <Plus size={13} /> Post My Room
                  </Link>
                  <Link href="/post/flatmate" className="bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:opacity-90 inline-flex items-center gap-1.5">
                    <Users size={13} /> Post Flatmate
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {combinedListings.map((item, i) => {
                  const isRoom = item.type === "room";
                  const image = isRoom ? (item.images || [])[0] : (item.images || [])[0];
                  const isActive = isRoom ? item.is_available : item.isAvailable;
                  const detailHref = isRoom ? `/rooms/${item.id}` : `/flatmates/${item.id}`;
                  const deleteFn = isRoom ? () => handleDelete(item.id) : () => handleDeleteFlatmate(item.id);

                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="border border-border p-5 flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-32 h-24 bg-secondary shrink-0 overflow-hidden relative">
                        {image ? (
                          <img src={image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          isRoom ? <Home size={24} className="text-muted-foreground m-auto mt-8" /> : <Users size={24} className="text-muted-foreground m-auto mt-8" />
                        )}
                        <span className="absolute top-1 left-1 text-[9px] font-bold uppercase px-2 py-0.5 bg-background border border-border">
                          {isRoom ? "🏠 Room" : "👥 Flatmate"}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${isActive ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                            {isActive ? "Active" : "Inactive"}
                          </span>
                          {!isRoom && <span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-secondary">Vacancy: {item.vacancyCount}</span>}
                          {isRoom && <span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-secondary">{item.furnishing}</span>}
                        </div>
                        <h3 className="font-bold mb-1">{item.title}</h3>
                        {isRoom ? (
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.colony}, {item.location} · ₹{item.rent.toLocaleString("en-IN")}/mo · {item.members_allowed || 2} members
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground mb-2">
                            {item.colony}, {item.location} · Rent Share: ₹{item.rentShare.toLocaleString("en-IN")}/mo · Profession Pref: {item.professionPref}
                          </p>
                        )}
                        {isRoom ? (
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye size={11} /> {item.enquiries || 0} enquiries</span>
                            <span className="flex items-center gap-1"><Phone size={11} /> {item.contact_unlocks || 0} contact unlocks</span>
                            <span className="flex items-center gap-1 text-green-600 font-semibold"><IndianRupee size={11} /> ₹{(item.earnings || 0).toLocaleString("en-IN")} earned</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye size={11} /> View Catalog</span>
                            <span className="flex items-center gap-1"><Users size={11} /> Gender Pref: {item.genderPref}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex md:flex-col gap-2 shrink-0">
                        <Link href={detailHref} className="flex-1 md:flex-none border border-border px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1">
                          <Eye size={11} /> View
                        </Link>
                        <button onClick={deleteFn} className="flex-1 md:flex-none border border-border px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:border-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-1">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── EARNINGS ─────────────────────────────────────────────────────── */}
        {activeTab === "earnings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-10">
              {summary.map((s, i) => (
                <div key={i} className="bg-background p-6 text-center">
                  <s.icon size={20} className={`mx-auto mb-2 ${s.color}`} strokeWidth={1.5} />
                  <p className={`text-2xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Payout CTA */}
            {total > 0 && (
              <div className="bg-foreground text-background p-6 flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div>
                  <p className="font-bold mb-1">Ready to withdraw ₹{total.toLocaleString("en-IN")}?</p>
                  <p className="text-sm text-background/60">Credited within 24–48 hours to your UPI or bank account.</p>
                </div>
                <button onClick={() => setActiveTab("payout")}
                  className="bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-wider font-bold hover:opacity-90 whitespace-nowrap flex items-center gap-2">
                  <CreditCard size={13} /> Withdraw Earnings
                </button>
              </div>
            )}

            {/* Transactions */}
            <h3 className="text-sm uppercase tracking-widest font-bold mb-5">Transaction History</h3>
            {earnings.length === 0 ? (
              <div className="border border-dashed border-border p-12 text-center">
                <Wallet size={28} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">No earnings yet</p>
                <p className="text-sm text-muted-foreground">Post a room and earn ₹500–₹1,000 per handover.</p>
              </div>
            ) : (
              <div className="border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-secondary/30 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-3">Date</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>
                {earnings.map((tx, i) => (
                  <div key={tx.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border last:border-b-0 hover:bg-secondary/20 transition-colors items-center">
                    <div className="col-span-5"><p className="text-sm font-semibold">{tx.type}</p><p className="text-xs text-muted-foreground truncate">{tx.description}</p></div>
                    <div className="col-span-3"><p className="text-xs text-muted-foreground">{new Date(tx.created_at || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</p></div>
                    <div className="col-span-2 text-right"><p className="text-sm font-bold text-green-600">+₹{tx.amount.toLocaleString("en-IN")}</p></div>
                    <div className="col-span-2 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase ${tx.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {tx.status === "completed" ? <CheckCircle2 size={9} /> : <Clock size={9} />} {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PAYOUT ───────────────────────────────────────────────────── */}
        {activeTab === "payout" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">

            {/* Balance card */}
            <div className="grid grid-cols-3 gap-px bg-border border border-border">
              <div className="bg-background p-5 text-center">
                <p className="text-2xl font-black text-green-600">₹{total.toLocaleString("en-IN")}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Available</p>
              </div>
              <div className="bg-background p-5 text-center">
                <p className="text-2xl font-black text-yellow-600">₹{pending.toLocaleString("en-IN")}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Pending</p>
              </div>
              <div className="bg-background p-5 text-center">
                <p className="text-2xl font-black text-primary">{payoutHistory.length}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Requests</p>
              </div>
            </div>

            {/* Important notice */}
            <div className="flex gap-3 bg-yellow-50 border border-yellow-200 p-4">
              <AlertCircle size={16} className="text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold text-yellow-800 mb-0.5">Manual Payout Process</p>
                <p className="text-yellow-700 text-xs leading-relaxed">
                  Payouts are processed manually by the Takevolet team within <strong>24–48 business hours</strong>.
                  We will transfer directly to your UPI ID or bank account. Minimum withdrawal: ₹100.
                </p>
              </div>
            </div>

            {/* Payout Method Selector */}
            <div className="border border-border p-6">
              <p className="text-xs uppercase tracking-widest font-bold mb-4">Step 1 — Your Payout Method</p>

              <div className="flex gap-3 mb-5">
                <button onClick={() => setPayoutMethod("upi")}
                  className={`flex-1 flex items-center gap-2.5 p-3.5 border text-sm font-semibold transition-all ${
                    payoutMethod === "upi" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    payoutMethod === "upi" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {payoutMethod === "upi" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <Phone size={14} className="text-primary" /> UPI
                </button>
                <button onClick={() => setPayoutMethod("bank")}
                  className={`flex-1 flex items-center gap-2.5 p-3.5 border text-sm font-semibold transition-all ${
                    payoutMethod === "bank" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    payoutMethod === "bank" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {payoutMethod === "bank" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <Building2 size={14} className="text-primary" /> Bank Transfer
                </button>
                <button onClick={() => setPayoutMethod("qrcode")}
                  className={`flex-1 flex items-center gap-2.5 p-3.5 border text-sm font-semibold transition-all ${
                    payoutMethod === "qrcode" ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                  }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    payoutMethod === "qrcode" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {payoutMethod === "qrcode" && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR" className="w-3.5 h-3.5 opacity-80" /> QR Code
                </button>
              </div>

              {/* UPI fields */}
              {payoutMethod === "upi" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 block">UPI ID</label>
                    <input
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="yourname@upi or phone@paytm"
                      className="w-full border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Accepted: GPay, PhonePe, Paytm, BHIM, any UPI app</p>
                  </div>
                </div>
              )}

              {/* Bank fields */}
              {payoutMethod === "bank" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 block">Account Holder Name</label>
                    <input
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="Name as on bank account"
                      className="w-full border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                          <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 block">Bank Account Number</label>
                    <input
                      value={bankAccount}
                      onChange={e => setBankAccount(e.target.value)}
                      placeholder="Enter your account number"
                      type="text"
                      className="w-full border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 block">IFSC Code</label>
                    <input
                      value={bankIfsc}
                      onChange={e => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="e.g. SBIN0001234"
                      className="w-full border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>
              )}

              {/* QR Code fields */}
              {payoutMethod === "qrcode" && (
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 block">Upload Bank/UPI QR Code</label>
                  
                  {payoutQrCode ? (
                    <div className="relative inline-block border border-border p-2 bg-secondary/20">
                      <img src={payoutQrCode} alt="Payout QR Code" className="w-48 h-48 object-contain" />
                      <button onClick={() => setPayoutQrCode("")} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:scale-110 transition-transform">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border p-8 text-center hover:border-primary/50 transition-colors bg-secondary/10 relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleQrUpload}
                        disabled={qrUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      />
                      <div className="pointer-events-none">
                        {qrUploading ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-semibold">Uploading QR Code...</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center mx-auto mb-3">
                              <Plus size={20} className="text-primary" />
                            </div>
                            <p className="font-semibold text-sm">Tap to upload QR Code</p>
                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">Upload the QR code from your Google Pay, PhonePe, or Banking app to receive payments directly.</p>
                </div>
              )}

              <button onClick={handleSavePayoutDetails} disabled={payoutSubmitting}
                className="mt-4 border border-border px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:border-primary hover:text-primary transition-all flex items-center gap-2 disabled:opacity-50">
                {payoutSubmitting ? (
                  <><div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /> Saving…</>
                ) : (
                  <><CheckCircle2 size={12} /> Save Payout Details</>
                )}
              </button>

              {savedPayoutDetails && (
                <div className="mt-4 p-3 bg-secondary/20 border border-border text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-green-600 block mb-0.5 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Active Payout Method Saved
                    </span>
                    <span className="text-muted-foreground">
                      {savedPayoutDetails.method === "upi" ? `UPI: ${savedPayoutDetails.upiId}` : 
                       savedPayoutDetails.method === "bank" ? `Bank: ****${savedPayoutDetails.bankAccount?.slice(-4)}` :
                       "QR Code Uploaded"}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-background border border-border">
                    {savedPayoutDetails.method}
                  </span>
                </div>
              )}
            </div>

            {/* Withdraw form */}
            <div className="border border-border p-6">
              <p className="text-xs uppercase tracking-widest font-bold mb-4">Step 2 — Request Withdrawal</p>

              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase tracking-widest font-bold mb-1.5 block">Amount to Withdraw (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                    <input
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      placeholder="Min ₹100"
                      type="number"
                      min={100}
                      max={total}
                      className="w-full border border-border pl-8 pr-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <button onClick={() => setWithdrawAmount(total.toString())}
                  className="border border-border px-4 py-3 text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all self-end">
                  Max
                </button>
              </div>

              <div className="bg-secondary/30 border border-border p-3 mb-4 text-xs text-muted-foreground">
                <div className="flex justify-between mb-1">
                  <span>Available balance</span><span className="font-bold text-foreground">₹{total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Withdrawal amount</span><span className="font-bold">₹{withdrawAmount || "0"}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1 mt-1">
                  <span>After withdrawal</span>
                  <span className="font-bold">₹{Math.max(0, total - (parseFloat(withdrawAmount) || 0)).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {payoutError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" /> {payoutError}
                </div>
              )}
              {payoutSuccess && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 text-xs flex items-start gap-2">
                  <CheckCircle2 size={12} className="shrink-0 mt-0.5" /> {payoutSuccess}
                </div>
              )}

              <button onClick={handleWithdraw} disabled={payoutSubmitting || total < 100}
                className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {payoutSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Submitting Request…</>
                ) : (
                  <><Send size={14} /> Request Withdrawal</>
                )}
              </button>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                Our team will process your request within 24–48 business hours
              </p>
            </div>

            {/* Payout History */}
            {payoutHistory.length > 0 && (
              <div className="border border-border">
                <div className="p-4 border-b border-border">
                  <p className="text-xs uppercase tracking-widest font-bold">Payout Request History</p>
                </div>
                <div className="divide-y divide-border">
                  {payoutHistory.map((req, i) => (
                    <div key={req.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold">₹{req.amount.toLocaleString("en-IN")} via {req.method.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.requestedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">{req.id}</p>
                      </div>
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        req.status === "completed" ? "bg-green-100 text-green-700" :
                        req.status === "processing" ? "bg-blue-100 text-blue-700" :
                        req.status === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {req.status === "completed" && <CheckCircle2 size={9} className="inline mr-1" />}
                        {req.status === "pending" && <Clock size={9} className="inline mr-1" />}
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="border border-border p-5 text-sm">
              <p className="font-bold mb-2">Need help with payouts?</p>
              <p className="text-muted-foreground text-xs leading-relaxed mb-3">
                For payout issues, contact our support team. Please have your Request ID ready.
              </p>
              <div className="flex gap-3">
                <a href="tel:+917981994870" className="flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors">
                  <Phone size={12} /> +91 79819 94870
                </a>
                <a href="mailto:payouts@takevolet.online" className="flex items-center gap-1.5 text-xs font-semibold hover:text-primary transition-colors">
                  <Mail size={12} /> payouts@takevolet.online
                </a>
              </div>
            </div>

          </motion.div>
        )}

        {/* ── PROFILE ──────────────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl">
            <div className="border border-border p-8 mb-6">
              <div className="flex items-center gap-5 mb-8">
              <Avatar src={user.avatar} name={user.name} size={20} />
                <div>
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.profession || ""}</p>
                  <p className="text-xs text-primary font-semibold">{user.location || "Hyderabad"}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { icon: Mail, label: "Email", value: user.email },
                  { icon: Phone, label: "Phone", value: user.phone || "Not set" },
                  { icon: MapPin, label: "Location", value: user.location || "Hyderabad" },
                  { icon: Briefcase, label: "Profession", value: user.profession || "Not set" },
                  { icon: Users, label: "Members with me", value: user.membersCount ? `${user.membersCount} person${user.membersCount > 1 ? "s" : ""}` : "Not set" },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border border-border">
                    <f.icon size={14} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</p>
                      <p className="font-semibold text-sm">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/profile/edit" className="w-full border border-border py-4 text-sm uppercase tracking-wider font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
              <Edit2 size={14} /> Edit Profile
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
