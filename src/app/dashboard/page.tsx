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
import { getUserRooms, getUserEarnings, getUserPayouts, deleteRoom, type Room, type Earning, type PayoutRequest } from "@/lib/db";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, logout } = useUser();
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "listings" | "earnings" | "payout" | "profile">(
    (searchParams.get("tab") as "overview" | "listings" | "earnings" | "payout" | "profile") || "overview"
  );

  // ── Payout state ───────────────────────────────────────────────────────────
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankName, setBankName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
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
      // Load rooms from Supabase
      setRoomsLoading(true);
      getUserRooms(user.id).then(rooms => {
        setMyRooms(rooms);
        setRoomsLoading(false);
      });
      // Load earnings from Supabase
      getUserEarnings(user.id).then(setEarnings);
      // Load payout history from Supabase
      getUserPayouts(user.id).then(setPayoutHistory);
      // Load saved payout details from localStorage (UI preferences only)
      const saved = localStorage.getItem(`payout_${user.id}`);
      if (saved) {
        const d = JSON.parse(saved);
        setSavedPayoutDetails(d);
        setPayoutMethod(d.method || "upi");
        setUpiId(d.upiId || "");
        setBankAccount(d.bankAccount || "");
        setBankIfsc(d.bankIfsc || "");
        setBankName(d.bankName || "");
      }
    }
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  // Compute earnings summary from Supabase Earning[]  
  const total    = earnings.filter(e => e.status === "completed").reduce((s, e) => s + e.amount, 0);
  const pending  = earnings.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const completed = earnings.filter(e => e.status === "completed").length;
  const summary = [
    { icon: Wallet,      label: "Total Earned",  value: `₹${total.toLocaleString("en-IN")}`,  color: "text-green-600" },
    { icon: Clock,       label: "Pending",        value: `₹${pending.toLocaleString("en-IN")}`, color: "text-yellow-600" },
    { icon: Home,        label: "My Listings",    value: myRooms.length.toString(),              color: "text-primary" },
    { icon: TrendingUp,  label: "Completed",      value: completed.toString(),                   color: "text-muted-foreground" },
  ];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    await deleteRoom(id);
    setMyRooms(prev => prev.filter(r => r.id !== id));
  };

  // ── Save payout details ───────────────────────────────────────────────────
  const handleSavePayoutDetails = () => {
    const details = { method: payoutMethod, upiId, bankAccount, bankIfsc, bankName };
    localStorage.setItem(`payout_${user.id}`, JSON.stringify(details));
    setSavedPayoutDetails(details);
    alert("Payout details saved!");
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

  return (
    <div className="pt-28 pb-20 min-h-screen">
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
            <Link href="/post/room" className="bg-primary text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center gap-1.5">
              <Plus size={13} /> Post Room
            </Link>
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
            <div className="grid md:grid-cols-3 gap-4 mb-10">
              {[
                { icon: Home, label: "Post a Room", sub: "Leaving your flat? List it now", href: "/post/room", primary: true },
                { icon: ShoppingBag, label: "Sell / Rent Items", sub: "Furniture, electronics & more", href: "/post/item", primary: false },
                { icon: Settings, label: "Edit Profile", sub: "Update your info anytime", href: "/profile/edit", primary: false },
              ].map((a, i) => (
                <Link key={i} href={a.href}
                  className={`p-5 border flex justify-between items-center group transition-all ${a.primary ? "border-primary bg-primary/5 hover:bg-primary/10" : "border-border hover:border-primary"}`}>
                  <div>
                    <p className="font-bold text-sm">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.sub}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>

            {/* My Recent Listings */}
            <h3 className="text-sm uppercase tracking-widest font-bold mb-5">My Recent Listings</h3>
            {myRooms.length === 0 ? (
              <div className="border border-dashed border-border p-12 text-center">
                <Home size={28} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold mb-1">No listings yet</p>
                <p className="text-sm text-muted-foreground mb-5">Post your first room and start earning.</p>
                <Link href="/post/room" className="bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all inline-flex items-center gap-2">
                  <Plus size={13} /> Post My Room
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myRooms.slice(0, 3).map(room => (
                  <div key={room.id} className="border border-border p-4 flex items-center gap-4">
                    <div className="w-16 h-16 bg-secondary shrink-0 overflow-hidden">
                      {(room.images || [])[0] ? <img src={(room.images || [])[0]} alt="" className="w-full h-full object-cover" /> : <Home size={20} className="text-muted-foreground m-auto mt-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{room.title}</p>
                      <p className="text-xs text-muted-foreground">{room.colony}, {room.location} · ₹{room.rent.toLocaleString("en-IN")}/mo</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 mt-1 ${room.is_available ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                        {room.is_available ? <CheckCircle2 size={9} /> : <Clock size={9} />} {room.is_available ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/rooms/${room.id}`} className="w-8 h-8 border border-border flex items-center justify-center hover:border-primary hover:text-primary transition-all">
                        <Eye size={13} />
                      </Link>
                      <button onClick={() => handleDelete(room.id)} className="w-8 h-8 border border-border flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {myRooms.length > 3 && (
                  <button onClick={() => setActiveTab("listings")} className="text-xs text-primary font-bold uppercase tracking-wider hover:underline">
                    View all {myRooms.length} listings →
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── LISTINGS ─────────────────────────────────────────────────────── */}
        {activeTab === "listings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-widest font-bold">My Listings ({myRooms.length})</h2>
              <Link href="/post/room" className="bg-primary text-primary-foreground px-4 py-2 text-xs uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center gap-1.5">
                <Plus size={12} /> Add New
              </Link>
            </div>
            {myRooms.length === 0 ? (
              <div className="border border-dashed border-border p-16 text-center">
                <Home size={32} className="mx-auto text-muted-foreground mb-4" />
                <p className="font-semibold mb-2">No listings yet</p>
                <Link href="/post/room" className="bg-primary text-primary-foreground px-6 py-3 text-xs uppercase tracking-wider font-bold hover:opacity-90 inline-flex items-center gap-2">
                  <Plus size={13} /> Post My First Room
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRooms.map((room, i) => (
                  <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="border border-border p-5 flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-32 h-24 bg-secondary shrink-0 overflow-hidden">
                      {(room.images || [])[0] ? <img src={(room.images || [])[0]} alt="" className="w-full h-full object-cover" /> : <Home size={24} className="text-muted-foreground m-auto mt-8" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${room.is_available ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                          {room.is_available ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 bg-secondary">{room.furnishing}</span>
                      </div>
                      <h3 className="font-bold mb-1">{room.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{room.colony}, {room.location} · ₹{room.rent.toLocaleString("en-IN")}/mo · {room.members_allowed || 2} members</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye size={11} /> {room.enquiries || 0} enquiries</span>
                        <span className="flex items-center gap-1"><Phone size={11} /> {room.contact_unlocks || 0} contact unlocks</span>
                        <span className="flex items-center gap-1 text-green-600 font-semibold"><IndianRupee size={11} /> ₹{(room.earnings || 0).toLocaleString("en-IN")} earned</span>
                      </div>
                    </div>
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <Link href={`/rooms/${room.id}`} className="flex-1 md:flex-none border border-border px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-1">
                        <Eye size={11} /> View
                      </Link>
                      <button onClick={() => handleDelete(room.id)} className="flex-1 md:flex-none border border-border px-3 py-2 text-xs uppercase tracking-wider font-semibold hover:border-red-400 hover:text-red-500 transition-all flex items-center justify-center gap-1">
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
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

              <button onClick={handleSavePayoutDetails}
                className="mt-4 border border-border px-5 py-2.5 text-xs uppercase tracking-wider font-bold hover:border-primary hover:text-primary transition-all flex items-center gap-2">
                <CheckCircle2 size={12} /> Save Payout Details
              </button>

              {savedPayoutDetails && (
                <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  {savedPayoutDetails.method === "upi"
                    ? `UPI saved: ${savedPayoutDetails.upiId}`
                    : `Bank saved: ****${savedPayoutDetails.bankAccount?.slice(-4)}, ${savedPayoutDetails.bankIfsc}`
                  }
                </p>
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
