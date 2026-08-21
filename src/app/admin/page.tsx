"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Home, IndianRupee, TrendingUp, CheckCircle2,
  Clock, X, AlertCircle, RefreshCw, Eye, EyeOff, LogOut,
  Wallet, ArrowUpRight, Building2, Phone, Mail, Send,
  BarChart2, Activity, Download, ChevronDown, Star, Lock,
  ShoppingBag, ShieldCheck, Edit2
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { MOCK_ROOMS, MOCK_FLATMATES, MOCK_ITEMS } from "@/data/mock";
import { HYDERABAD_AREAS } from "@/data/locations";
import { insertAdAction, updateAdAction, deleteAdAction, fetchAllRoomsAction, fetchAllPagesAction, insertPageAction, updatePageAction, deletePageAction } from "@/lib/server-actions";
import { uploadRoomMedia } from "@/lib/db";

const ADMIN_PASSWORD = "Nithin@Takevolet2026";

type Tab = "overview" | "payouts" | "unlocks" | "interests" | "handovers" | "users" | "rooms" | "flatmates" | "property_sales" | "build_listings" | "form_builder";

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [pwd, setPwd]           = useState("");
  const [pwdError, setPwdError] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);
  const { user, loading: userLoading } = useUser();

  const [localRooms, setLocalRooms] = useState<any[]>([]);
  const [localFlatmates, setLocalFlatmates] = useState<any[]>([]);
  const [localPropertySales, setLocalPropertySales] = useState<any[]>([]);
  const [localBuildListings, setLocalBuildListings] = useState<any[]>([]);

  const [editItem, setEditItem] = useState<any | null>(null);
  const [editType, setEditType] = useState<"user" | "room" | "flatmate" | "property_sales" | "build_listings" | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [deleteType, setDeleteType] = useState<"room" | "flatmate" | "property_sales" | "build_listings" | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Dynamic Forms State
  const [selectedFormCategory, setSelectedFormCategory] = useState("transportation");
  const [formSchema, setFormSchema] = useState<any[]>([]);
  const [formSchemaLoading, setFormSchemaLoading] = useState(false);
  const [formSchemaSaving, setFormSchemaSaving] = useState(false);

  const [newImgUrl, setNewImgUrl] = useState("");
  const [newVidUrl, setNewVidUrl] = useState("");

  const handleAddImage = () => {
    if (!newImgUrl.trim() || !editItem) return;
    setEditItem({
      ...editItem,
      images: [...(editItem.images || []), newImgUrl.trim()]
    });
    setNewImgUrl("");
  };

  const handleAddVideo = () => {
    if (!newVidUrl.trim() || !editItem) return;
    setEditItem({
      ...editItem,
      videos: [...(editItem.videos || []), newVidUrl.trim()]
    });
    setNewVidUrl("");
  };

  useEffect(() => {
    if (data) {
      setLocalRooms(data.rooms || []);
      setLocalFlatmates(data.flatmates || []);
      setLocalPropertySales(data.propertySales || []);
      setLocalBuildListings(data.buildListings || []);
    }
  }, [data]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem || !editType) return;
    setEditLoading(true);
    try {
      const payload = {
        type: editType,
        id: editItem.id,
      } as any;

      if (editType === "user") {
        payload.userData = {
          full_name: editItem.name,
          phone: editItem.phone,
          whatsapp: editItem.whatsapp,
          email: editItem.email,
          contact_balance: Number(editItem.contact_balance) || 0,
          location: editItem.location,
          colony: editItem.colony,
          house_no: editItem.house_no,
          profession: editItem.profession,
          gender: editItem.gender,
          dob: editItem.dob,
          members_count: Number(editItem.members_count) || 1,
        };
      } else {
        Object.assign(payload, {
          title: editItem.title,
          price: editItem.price,
          property_type: editItem.property_type,
          category: editItem.category,
          rent: editItem.rent,
          advance: editItem.advance,
          rentShare: editItem.rentShare,
          advanceShare: editItem.advanceShare,
          location: editItem.location,
          colony: editItem.colony,
          description: editItem.description,
          furnishing: editItem.furnishing,
          genderPreference: editItem.gender_preference,
          genderPref: editItem.genderPref,
          professionPref: editItem.professionPref,
          images: editItem.images,
          videos: editItem.videos,
          metadata: editItem.metadata,
        });
      }

      const res = await fetch("/api/admin/data", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        if (editType === "room") {
          setLocalRooms(prev => prev.map(item => item.id === editItem.id ? { ...item, ...editItem } : item));
        } else if (editType === "flatmate") {
          setLocalFlatmates(prev => prev.map(item => item.id === editItem.id ? { ...item, ...editItem } : item));
        } else if (editType === "property_sales") {
          setLocalPropertySales(prev => prev.map(item => item.id === editItem.id ? { ...item, ...editItem } : item));
        } else if (editType === "build_listings") {
          setLocalBuildListings(prev => prev.map(item => item.id === editItem.id ? { ...item, ...editItem } : item));
        }
        setEditItem(null);
        setEditType(null);
        fetchData();
      } else {
        alert("Failed to save changes: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving edits");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem || !deleteType) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/data?type=${deleteType}&id=${deleteItem.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-password": ADMIN_PASSWORD,
        },
      });
      const json = await res.json();
      if (json.success) {
        if (deleteType === "room") {
          setLocalRooms(prev => prev.filter(item => item.id !== deleteItem.id));
        } else if (deleteType === "flatmate") {
          setLocalFlatmates(prev => prev.filter(item => item.id !== deleteItem.id));
        } else if (deleteType === "property_sales") {
          setLocalPropertySales(prev => prev.filter(item => item.id !== deleteItem.id));
        } else if (deleteType === "build_listings") {
          setLocalBuildListings(prev => prev.filter(item => item.id !== deleteItem.id));
        }
        setDeleteItem(null);
        setDeleteType(null);
        fetchData();
      } else {
        alert("Failed to delete item: " + json.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting item");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwdError("");
      fetchData();

    } else {
      setPwdError("Incorrect password. Access denied.");
    }
  };

  // ── Fetch admin data ───────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/data", {
        headers: { "x-admin-password": ADMIN_PASSWORD },
      });
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // auto-refresh every 30s
      return () => clearInterval(interval);
    }
  }, [authed]);

  // ── Payout action ──────────────────────────────────────────────────────────
  const handlePayoutAction = async (action: "approve" | "reject" | "processing", payout: any) => {
    setActionLoading(payout.id);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          action,
          payoutId: payout.id,
          userId: payout.userId,
          notes: actionNote || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionNote("");
        await fetchData();
      }
    } catch (e) {
      console.error("Action failed", e);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
      status === "completed" ? "bg-green-100 text-green-700" :
      status === "processing" ? "bg-blue-100 text-blue-700" :
      status === "rejected"   ? "bg-red-100 text-red-700" :
      "bg-yellow-100 text-yellow-700"
    }`}>
      {status === "completed"  && <CheckCircle2 size={9} />}
      {status === "pending"    && <Clock size={9} />}
      {status === "processing" && <RefreshCw size={9} />}
      {status === "rejected"   && <X size={9} />}
      {status}
    </span>
  );

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  // ━━━ SECURITY GATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (userLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><RefreshCw className="animate-spin text-primary" /></div>;
  if (!user || user.email?.toLowerCase() !== "nithinappala625@gmail.com") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Lock size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    );
  }

  // ━━━ LOGIN SCREEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm border border-border p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Shield size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-lg leading-none">Takevolet</p>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Admin Dashboard</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Admin Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={e => setPwd(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full border border-border px-4 py-3 text-sm bg-background focus:border-primary focus:outline-none pr-10"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwdError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{pwdError}</p>}
            </div>
            <button type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2">
              <Shield size={14} /> Access Dashboard
            </button>
          </form>
          <p className="text-center text-[10px] text-muted-foreground mt-5">
            Nithin Patel · Founder & CEO · Takevolet Technologies
          </p>
        </motion.div>
      </div>
    );
  }

  // ━━━ ADMIN DASHBOARD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const stats = data?.stats || {};
  const payouts   = data?.payouts   || [];
  const interests = data?.interests || [];
  const handovers = data?.handovers || [];

  const pendingPayouts = payouts.filter((p: any) => p.status === "pending");
  const users  = data?.users  || [];
  const rooms  = data?.rooms  || [];

  return (
    <div className="pt-0 min-h-screen bg-secondary/20">
      {/* Admin Topbar */}
      <div className="bg-foreground text-background px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <Shield size={14} className="text-primary-foreground" />
          </div>
          <div>
            <span className="font-black text-sm">Takevolet Admin</span>
            <span className="text-background/40 text-xs ml-3">Nithin Patel · Founder & CEO</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {pendingPayouts.length > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
              {pendingPayouts.length} PENDING
            </span>
          )}
          <button onClick={fetchData} className="text-background/60 hover:text-background transition-colors flex items-center gap-1 text-xs">
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={() => setAuthed(false)} className="text-background/60 hover:text-background transition-colors flex items-center gap-1 text-xs">
            <LogOut size={13} /> Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-6xl">

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Total Revenue",    value: fmt(stats.totalRevenue || 0),        color: "text-green-600",  icon: TrendingUp },
            { label: "Interest Revenue", value: fmt(stats.interestRevenue || 0),     color: "text-primary",    icon: IndianRupee },
            { label: "Handover Revenue", value: fmt(stats.handoverRevenue || 0),     color: "text-blue-600",   icon: Home },
            { label: "Paid Out",         value: fmt(stats.totalPaidOut || 0),        color: "text-orange-600", icon: Wallet },
            { label: "Pending Payouts",  value: fmt(stats.pendingPayouts || 0),      color: "text-red-500",    icon: Clock },
          ].map((s, i) => (
            <div key={i} className="bg-background border border-border p-4 text-center">
              <s.icon size={18} className={`${s.color} mx-auto mb-2`} strokeWidth={1.5} />
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Activity Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Address Unlocks", value: stats.totalInterests || 0,       sub: "₹500 each" },
            { label: "Handovers Done",  value: stats.totalHandovers || 0,       sub: "₹1,500 total" },
            { label: "Payout Requests", value: stats.totalPayoutRequests || 0,  sub: `${pendingPayouts.length} pending` },
          ].map((s, i) => (
            <div key={i} className="bg-background border border-border p-5 flex items-center gap-4">
              <Activity size={22} className="text-primary shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-3xl font-black leading-none">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="text-[10px] text-primary font-semibold">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6 overflow-x-auto bg-background">
          {(["overview", "payouts", "unlocks", "interests", "handovers", "users", "rooms", "flatmates", "property_sales", "build_listings", "form_builder"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-xs uppercase tracking-widest font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {tab === "payouts" && pendingPayouts.length > 0
                ? `payouts (${pendingPayouts.length})`
                : tab === "unlocks" && data?.contactUnlocks?.length > 0 ? `unlocks (${data.contactUnlocks.length})`
                : tab === "users" ? `users (${users.length})`
                : tab === "rooms" ? `rooms (${localRooms.length})`
                : tab === "flatmates" ? `flatmates (${localFlatmates.length})`
                : tab === "property_sales" ? `properties (${localPropertySales.length})`
                : tab === "build_listings" ? `build (${localBuildListings.length})`
                : tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Commission model */}
              <div className="bg-background border border-border p-6">
                <p className="text-xs uppercase tracking-widest font-bold mb-4">Commission Structure</p>
                <div className="space-y-3">
                  {[
                    { step: "1", action: "Seeker clicks I'm Interested", amount: "₹500", to: "Takevolet Platform" },
                    { step: "2", action: "Address unlocked to seeker",   amount: "—",    to: "Full address revealed" },
                    { step: "3", action: "Seeker visits & confirms",     amount: "₹1,000", to: "Room Poster (commission)" },
                    { step: "4", action: "Platform fee on handover",     amount: "₹500", to: "Takevolet Platform" },
                  ].map((row, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-primary/30 pl-3">
                      <span className="font-black text-primary text-lg leading-none">{row.step}</span>
                      <div>
                        <p className="font-semibold text-xs">{row.action}</p>
                        <p className="text-[10px] text-muted-foreground">{row.to} <span className="text-primary font-bold">{row.amount}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-border pt-4 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-green-50 border border-green-200 p-3">
                    <p className="text-lg font-black text-green-700">₹1,000</p>
                    <p className="text-[10px] text-green-600 uppercase tracking-wider">Poster earns</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 p-3">
                    <p className="text-lg font-black text-primary">₹500</p>
                    <p className="text-[10px] text-primary uppercase tracking-wider">Platform earns</p>
                  </div>
                </div>
              </div>

              {/* Recent payouts needing action */}
              <div className="bg-background border border-border p-6">
                <p className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center justify-between">
                  Pending Payouts
                  {pendingPayouts.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5">{pendingPayouts.length} waiting</span>
                  )}
                </p>
                {pendingPayouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-semibold">All caught up!</p>
                    <p className="text-xs">No pending payout requests.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingPayouts.slice(0, 4).map((p: any) => (
                      <div key={p.id} className="border border-yellow-200 bg-yellow-50 p-3 flex justify-between items-center gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm">{fmt(p.amount)} via {(p.method || "UPI").toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {p.userName} · {p.method === "qrcode" ? "QR Code Uploaded" : (p.upiId || `****${p.bankAccount?.slice(-4)}`)}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handlePayoutAction("approve", p)}
                            disabled={!!actionLoading}
                            className="bg-green-600 text-white px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-green-700 transition-colors flex items-center gap-1">
                            <CheckCircle2 size={10} /> Approve
                          </button>
                          <button onClick={() => handlePayoutAction("reject", p)}
                            disabled={!!actionLoading}
                            className="bg-red-500 text-white px-3 py-1.5 text-[10px] font-bold uppercase hover:bg-red-600 transition-colors">
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingPayouts.length > 4 && (
                      <button onClick={() => setActiveTab("payouts")} className="text-xs text-primary font-bold hover:underline">
                        View all {pendingPayouts.length} pending →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PAYOUTS ── */}
        {activeTab === "payouts" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold uppercase tracking-widest">All Payout Requests ({payouts.length})</p>
            </div>
            {payouts.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Wallet size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No payout requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map((p: any) => (
                  <div key={p.id} className="bg-background border border-border overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-base">{fmt(p.amount)}</p>
                          <StatusBadge status={p.status} />
                          <span className="text-[10px] bg-secondary px-2 py-0.5 font-bold uppercase">{p.method || "UPI"}</span>
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">{p.userName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                        <div className="flex flex-col gap-3 mt-1.5">
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {p.method === "qrcode" && p.qrCode && (
                              <a href={p.qrCode} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR" className="w-3 h-3" /> View QR Code
                              </a>
                            )}
                            {p.upiId && <span className="flex items-center gap-1"><Phone size={10} />{p.upiId}</span>}
                            {p.bankAccount && <span className="flex items-center gap-1"><Building2 size={10} />****{p.bankAccount.slice(-4)} | {p.bankIfsc}</span>}
                            {p.bankName && <span className="flex items-center gap-1">Bank: {p.bankName}</span>}
                            <span><Clock size={10} className="inline mr-1" />{fmtDate(p.requestedAt)}</span>
                            {p.processedAt && <span className="text-green-600"><CheckCircle2 size={10} className="inline mr-1" />Processed: {fmtDate(p.processedAt)}</span>}
                          </div>
                          {p.method === "qrcode" && p.qrCode && (
                            <img src={p.qrCode} alt="Payout QR Code" className="w-24 h-24 object-contain border border-border" />
                          )}
                        </div>
                        {p.notes && <p className="text-xs text-muted-foreground italic mt-1">Note: {p.notes}</p>}
                      </div>

                      {/* Actions */}
                      {p.status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <div className="flex gap-2">
                            <button onClick={() => handlePayoutAction("approve", p)}
                              disabled={actionLoading === p.id}
                              className="flex-1 bg-green-600 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5">
                              {actionLoading === p.id ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                              Approve
                            </button>
                            <button onClick={() => handlePayoutAction("reject", p)}
                              disabled={actionLoading === p.id}
                              className="flex-1 bg-red-500 text-white px-4 py-2 text-xs font-bold uppercase hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5">
                              <X size={11} /> Reject
                            </button>
                          </div>
                          <button onClick={() => handlePayoutAction("processing", p)}
                            disabled={actionLoading === p.id}
                            className="border border-blue-400 text-blue-600 px-4 py-2 text-xs font-bold uppercase hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
                            <RefreshCw size={11} /> Mark Processing
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── CONTACT UNLOCKS ── */}
        {activeTab === "unlocks" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Contact Unlocks Records ({data?.contactUnlocks?.length || 0})</p>
            {(!data?.contactUnlocks || data.contactUnlocks.length === 0) ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Phone size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No contact unlocks yet</p>
              </div>
            ) : (
              <div className="bg-background border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-secondary/30 text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                  <div className="col-span-3">Seeker (Paid)</div>
                  <div className="col-span-3">Poster (Unlocked)</div>
                  <div className="col-span-3">Listing Info</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-2">Date</div>
                </div>
                {data.contactUnlocks.map((u: any) => (
                  <div key={u.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border last:border-0 items-center hover:bg-secondary/10">
                    <div className="col-span-3">
                      <p className="text-sm font-bold">{u.seeker_name}</p>
                      <p className="text-xs font-mono mt-0.5">{u.seeker_phone}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.seeker_email}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-bold text-primary">{u.poster_name}</p>
                      <p className="text-xs font-mono mt-0.5">{u.poster_phone}</p>
                      {u.poster_whatsapp && <p className="text-[10px] text-green-600 font-bold mt-0.5">WA: {u.poster_whatsapp}</p>}
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-semibold">{u.title}</p>
                      <span className="text-[9px] uppercase tracking-wider bg-secondary px-2 py-0.5 mt-1 inline-block">
                        {u.type}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs font-bold text-green-600">₹15</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">{fmtDate(u.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── INTERESTS (Visit Passes) ── */}
        {activeTab === "interests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Visit Passes ({interests.length})</p>
            {interests.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Eye size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No interest records yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interests.map((i: any) => {
                  const pId = i.razorpay_payment_id || i.payment_id || i.id;
                  const passNumber = "TV-PASS-" + (pId.slice(-6).toUpperCase());
                  return (
                    <div key={i.id} className="bg-background border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <ShieldCheck size={80} className="text-primary"/>
                      </div>
                      
                      {/* Header */}
                      <div className="bg-primary/5 border-b border-border p-4 flex justify-between items-center relative z-10">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Pass Number</p>
                          <p className="font-mono font-bold text-primary">{passNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Fee Paid</p>
                          <p className="text-sm font-black text-green-600">₹{i.platform_fee || i.amount || 500}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Seeker</p>
                            <p className="text-sm font-semibold truncate">{i.userName || i.seeker_name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{i.userId || i.seeker_id}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Poster</p>
                            <p className="text-sm font-semibold truncate">{i.posterName || i.poster_name}</p>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Property</p>
                          <p className="text-sm font-semibold truncate" title={i.roomTitle || i.room_title}>{i.roomTitle || i.room_title}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-border pt-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Generated</p>
                            <p className="text-xs font-semibold">{fmtDate(i.paidAt || i.paid_at || i.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Handover</p>
                            <StatusBadge status={i.handoverConfirmed || i.handover_confirmed ? "completed" : "pending"} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── HANDOVERS ── */}
        {activeTab === "handovers" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Confirmed Handovers ({handovers.length}) — ₹1,500 total each</p>
            {handovers.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Home size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No handovers confirmed yet</p>
              </div>
            ) : (
              <div className="bg-background border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-secondary/30 text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                  <div className="col-span-3">Seeker</div>
                  <div className="col-span-3">Poster</div>
                  <div className="col-span-2">Poster Gets</div>
                  <div className="col-span-2">Platform Gets</div>
                  <div className="col-span-2">Date</div>
                </div>
                {handovers.map((h: any) => (
                  <div key={h.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border last:border-0 items-center hover:bg-secondary/10">
                    <div className="col-span-3">
                      <p className="text-sm font-semibold">{h.userName}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-semibold">{h.posterName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-black text-green-600">₹1,000</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-black text-primary">₹500</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">{fmtDate(h.confirmedAt)}</p>
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="grid grid-cols-12 gap-2 p-4 bg-secondary/30 font-bold text-sm">
                  <div className="col-span-6 text-right text-muted-foreground">TOTAL:</div>
                  <div className="col-span-2 text-green-600">₹{(handovers.length * 1000).toLocaleString("en-IN")}</div>
                  <div className="col-span-2 text-primary">₹{(handovers.length * 500).toLocaleString("en-IN")}</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── USERS ── */}
        {activeTab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Registered Users ({users.length})</p>
            {users.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No users registered yet</p>
              </div>
            ) : (
              <div className="bg-background border border-border overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_2fr_1fr_0.5fr] gap-2 p-4 border-b border-border bg-secondary/30 text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                    <div>Name & Balance</div>
                    <div>Contact</div>
                    <div>Location</div>
                    <div>House Info</div>
                    <div>Profile</div>
                    <div>Payout Info</div>
                    <div>KYC</div>
                    <div className="text-right">Action</div>
                  </div>
                {users.map((u: any) => (
                  <div key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/10">
                    <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_2fr_1fr_0.5fr] gap-2 p-4 items-center">
                      <div>
                        <p className="text-sm font-semibold truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">Bal: <span className="text-primary font-bold">{u.contact_balance}</span></p>
                        <p className="text-[10px] text-muted-foreground">{fmtDate(u.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-mono">{u.phone}</p>
                        {u.whatsapp && <p className="text-[10px] text-green-600 font-bold mt-0.5">WA: {u.whatsapp}</p>}
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{u.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{u.colony}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-primary truncate">{u.house_no}</p>
                        <p className="text-[10px] truncate">{u.owner_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{u.owner_phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] truncate">{u.gender}</p>
                        <p className="text-[10px] truncate text-muted-foreground">{u.profession}</p>
                        <p className="text-[10px] text-muted-foreground">{u.members_count} mem</p>
                      </div>
                      <div>
                        {u.payout_method === "upi" && (
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase">UPI</p>
                            <p className="text-[10px] font-mono truncate">{u.upi_id}</p>
                          </div>
                        )}
                        {u.payout_method === "bank" && (
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase">Bank</p>
                            <p className="text-[10px] font-mono truncate">A/C: {u.bank_account}</p>
                            <p className="text-[10px] font-mono truncate">IFSC: {u.bank_ifsc}</p>
                          </div>
                        )}
                        {u.payout_method === "qrcode" && u.payout_qr_code && (
                          <div>
                            <p className="text-[10px] font-bold text-primary uppercase mb-1">QR Code</p>
                            <a href={u.payout_qr_code} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 border border-border overflow-hidden hover:opacity-80 transition-opacity" title="View QR">
                              <img src={u.payout_qr_code} alt="QR Code" className="w-full h-full object-cover" />
                            </a>
                          </div>
                        )}
                        {!u.payout_method && (
                          <p className="text-[10px] text-muted-foreground italic">None saved</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {u.aadhaar_url ? (
                          <a href={u.aadhaar_url} target="_blank" rel="noopener noreferrer" className="block w-8 h-10 border border-border overflow-hidden hover:opacity-80 transition-opacity" title="View Front">
                            <img src={u.aadhaar_url} alt="Front" className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <span className="text-[9px] bg-yellow-100 text-yellow-700 font-bold px-1 py-0.5">Pend</span>
                        )}
                        {u.aadhaar_back_url && (
                          <a href={u.aadhaar_back_url} target="_blank" rel="noopener noreferrer" className="block w-8 h-10 border border-border overflow-hidden hover:opacity-80 transition-opacity" title="View Back">
                            <img src={u.aadhaar_back_url} alt="Back" className="w-full h-full object-cover" />
                          </a>
                        )}
                      </div>
                      <div className="text-right flex justify-end">
                        <button onClick={() => { setEditType("user"); setEditItem(u); }} className="p-2 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-primary">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Edit Form for Users */}
                    {editType === "user" && editItem?.id === u.id && (
                      <div className="p-4 bg-secondary/20 border-t border-border">
                        <form onSubmit={handleSaveEdit} className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Name</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.name || ""} onChange={e => setEditItem({...editItem, name: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Phone</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.phone || ""} onChange={e => setEditItem({...editItem, phone: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">WhatsApp</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.whatsapp || ""} onChange={e => setEditItem({...editItem, whatsapp: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Email</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.email || ""} onChange={e => setEditItem({...editItem, email: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Contact Balance</label>
                            <input type="number" className="w-full p-2 bg-background border border-border text-xs" value={editItem.contact_balance || 0} onChange={e => setEditItem({...editItem, contact_balance: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Location</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.location || ""} onChange={e => setEditItem({...editItem, location: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Colony</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.colony || ""} onChange={e => setEditItem({...editItem, colony: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">House No</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.house_no || ""} onChange={e => setEditItem({...editItem, house_no: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Profession</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.profession || ""} onChange={e => setEditItem({...editItem, profession: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Gender</label>
                            <input type="text" className="w-full p-2 bg-background border border-border text-xs" value={editItem.gender || ""} onChange={e => setEditItem({...editItem, gender: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">DOB</label>
                            <input type="date" className="w-full p-2 bg-background border border-border text-xs" value={editItem.dob || ""} onChange={e => setEditItem({...editItem, dob: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Members Count</label>
                            <input type="number" className="w-full p-2 bg-background border border-border text-xs" value={editItem.members_count || 1} onChange={e => setEditItem({...editItem, members_count: e.target.value})} />
                          </div>
                          <div className="col-span-4 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => { setEditType(null); setEditItem(null); }} className="px-4 py-2 border border-border text-xs uppercase font-bold hover:bg-secondary">Cancel</button>
                            <button type="submit" disabled={editLoading} className="px-4 py-2 bg-primary text-primary-foreground text-xs uppercase font-bold hover:opacity-90">{editLoading ? "Saving..." : "Save User"}</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── ROOMS ── */}
        {activeTab === "rooms" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Posted Rooms ({localRooms.length})</p>
            {localRooms.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Home size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No rooms posted yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localRooms.map((r: any) => (
                  <div key={r.id} className="bg-background border border-border p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {r.images?.[0] ? (
                        <div className="w-20 h-20 shrink-0 border border-border overflow-hidden bg-black/95 flex items-center justify-center relative">
                          <img src={r.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                          {r.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 font-bold">+{r.images.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-secondary flex items-center justify-center shrink-0 border border-border">
                          <Home size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.colony}, {r.location}</p>
                        <p className="text-xs text-primary font-bold mt-1">₹{r.rent?.toLocaleString("en-IN")}/mo <span className="text-[10px] text-muted-foreground font-normal">· Advance: ₹{r.advance?.toLocaleString("en-IN")}</span></p>
                        {r.description && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 italic font-light">"{r.description}"</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] bg-secondary px-1.5 py-0.5 font-bold uppercase text-muted-foreground">
                            🖼️ {r.images?.length || 0} images
                          </span>
                          {(r.videos?.length || 0) > 0 && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 font-bold uppercase">
                              🎥 {r.videos.length} video{r.videos.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border mt-4 pt-3">
                      <div className="text-[10px] text-muted-foreground">
                        Posted: {fmtDate(r.created_at || new Date().toISOString())}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditItem(r); setEditType("room"); }}
                          className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-[10px] font-bold uppercase transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteItem(r); setDeleteType("room"); }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FLATMATES ── */}
        {activeTab === "flatmates" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Posted Flatmates ({localFlatmates.length})</p>
            {localFlatmates.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No flatmate listings yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localFlatmates.map((f: any) => (
                  <div key={f.id} className="bg-background border border-border p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {f.images?.[0] ? (
                        <div className="w-20 h-20 shrink-0 border border-border overflow-hidden bg-black/95 flex items-center justify-center relative">
                          <img src={f.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                          {f.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 font-bold">+{f.images.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-secondary flex items-center justify-center shrink-0 border border-border">
                          <Users size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{f.title}</p>
                        <p className="text-xs text-muted-foreground">{f.colony}, {f.location}</p>
                        <p className="text-xs text-primary font-bold mt-1">₹{(f.rentShare || f.rent_share)?.toLocaleString("en-IN")}/mo <span className="text-[10px] text-muted-foreground font-normal">· Advance: ₹{(f.advanceShare || f.advance_share)?.toLocaleString("en-IN")}</span></p>
                        {f.description && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2 italic font-light">"{f.description}"</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] bg-secondary px-1.5 py-0.5 font-bold uppercase text-muted-foreground">
                            🖼️ {f.images?.length || 0} images
                          </span>
                          {(f.videos?.length || 0) > 0 && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 font-bold uppercase">
                              🎥 {f.videos.length} video{f.videos.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border mt-4 pt-3">
                      <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                        <span>Posted: {fmtDate(f.created_at || new Date().toISOString())}</span>
                        <span>Gender Pref: <span className="font-semibold text-primary">{f.genderPref || f.gender_pref || "Any"}</span></span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditItem(f); setEditType("flatmate"); }}
                          className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-[10px] font-bold uppercase transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteItem(f); setDeleteType("flatmate"); }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── PROPERTY SALES TAB ── */}
        {activeTab === "property_sales" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Properties ({localPropertySales.length})</p>
            {localPropertySales.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <ShoppingBag size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No properties yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localPropertySales.map((m: any) => (
                  <div key={m.id} className="bg-background border border-border p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {(m.images && m.images.length > 0) ? (
                        <div className="w-20 h-20 shrink-0 border border-border overflow-hidden bg-black/95 flex items-center justify-center relative">
                          <img src={m.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-secondary flex items-center justify-center shrink-0 border border-border">
                          <Home size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.location} · <span className="bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase">{m.property_type || 'Unknown'}</span></p>
                        <p className="text-xs text-primary font-bold mt-1">Price: ₹{m.price?.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border mt-4 pt-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditItem(m); setEditType("property_sales"); }} className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-[10px] font-bold uppercase transition-colors">Edit</button>
                        <button onClick={() => { setDeleteItem(m); setDeleteType("property_sales"); }} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── BUILD LISTINGS TAB ── */}
        {activeTab === "build_listings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Build Professionals ({localBuildListings.length})</p>
            {localBuildListings.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <ShoppingBag size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No build listings yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localBuildListings.map((m: any) => (
                  <div key={m.id} className="bg-background border border-border p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {(m.images && m.images.length > 0) ? (
                        <div className="w-20 h-20 shrink-0 border border-border overflow-hidden bg-black/95 flex items-center justify-center relative">
                          <img src={m.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-secondary flex items-center justify-center shrink-0 border border-border">
                          <ShoppingBag size={24} className="text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.location} · <span className="bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase">{m.category || 'Unknown'}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border mt-4 pt-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditItem(m); setEditType("build_listings"); }} className="bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 text-[10px] font-bold uppercase transition-colors">Edit</button>
                        <button onClick={() => { setDeleteItem(m); setDeleteType("build_listings"); }} className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 text-[10px] font-bold uppercase transition-colors">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        
        {/* ── FORM BUILDER TAB ── */}
        {activeTab === "form_builder" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="text-primary" size={24} />
                Dynamic Form Builder
              </h2>
            </div>
            
            <div className="bg-background border border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground mb-4">
                Configure dynamic fields for different categories. These fields will automatically appear on the website and app posting forms.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2">
                 <div className="border border-border p-4 h-fit">
                   <h3 className="font-bold mb-3 uppercase text-xs tracking-wider border-b border-border pb-2">Select Category</h3>
                   <select 
                     value={selectedFormCategory}
                     onChange={e => setSelectedFormCategory(e.target.value)}
                     className="w-full p-2 border border-border text-sm mb-4 bg-background focus:border-primary focus:outline-none"
                   >
                     <option value="transportation">Transportation</option>
                     <option value="furniture">Furniture</option>
                     <option value="electronics">Electronics</option>
                     <option value="appliances">Appliances</option>
                     <option value="contractor">Contractor (Build)</option>
                     <option value="architect">Architect (Build)</option>
                     <option value="interior_designer">Interior Designer (Build)</option>
                     <option value="material_supplier">Material Supplier (Build)</option>
                     <option value="apartment">Apartment (Property)</option>
                     <option value="villa">Villa (Property)</option>
                   </select>
                   <button 
                     onClick={async () => {
                       setFormSchemaLoading(true);
                       try {
                         const res = await fetch(`/api/admin/forms?category=${selectedFormCategory}`);
                         const data = await res.json();
                         if (data.success && data.data.length > 0) {
                           setFormSchema(data.data[0].fields_schema || []);
                         } else {
                           setFormSchema([]);
                         }
                       } catch (e) {
                         alert("Failed to load schema");
                       }
                       setFormSchemaLoading(false);
                     }}
                     disabled={formSchemaLoading}
                     className="w-full bg-primary text-primary-foreground py-2 text-xs font-bold uppercase transition-all hover:bg-primary/90 flex items-center justify-center gap-2"
                   >
                     {formSchemaLoading ? <RefreshCw size={14} className="animate-spin" /> : null}
                     Load Schema
                   </button>
                 </div>
                 
                 <div className="border border-border p-4 bg-secondary/10">
                   <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
                     <h3 className="font-bold uppercase text-xs tracking-wider">Edit Fields</h3>
                     <button
                        onClick={() => {
                          setFormSchema([...formSchema, { name: "", label: "", type: "text", required: false }]);
                        }}
                        className="text-xs bg-primary/20 hover:bg-primary/30 text-primary px-2 py-1 font-bold uppercase"
                     >
                       + Add Field
                     </button>
                   </div>
                   
                   {formSchema.length === 0 ? (
                     <p className="text-xs text-muted-foreground italic text-center py-8">No fields defined for this category. Click "Add Field" to start building.</p>
                   ) : (
                     <div className="space-y-4 mb-4">
                       {formSchema.map((field, idx) => (
                         <div key={idx} className="border border-border bg-background p-3 relative group">
                           <button 
                             onClick={() => {
                               const updated = [...formSchema];
                               updated.splice(idx, 1);
                               setFormSchema(updated);
                             }}
                             className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-50 hover:opacity-100"
                           >
                             <X size={14} />
                           </button>
                           
                           <div className="grid grid-cols-2 gap-3 mb-2 pr-6">
                             <div>
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Internal Key (Name)</label>
                               <input 
                                 type="text" 
                                 value={field.name}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                   setFormSchema(updated);
                                 }}
                                 placeholder="e.g. vehicle_type"
                                 className="w-full border border-border px-2 py-1 text-xs bg-secondary/10 focus:outline-none focus:border-primary font-mono"
                               />
                             </div>
                             <div>
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Display Label</label>
                               <input 
                                 type="text" 
                                 value={field.label}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].label = e.target.value;
                                   setFormSchema(updated);
                                 }}
                                 placeholder="e.g. Vehicle Type"
                                 className="w-full border border-border px-2 py-1 text-xs bg-background focus:outline-none focus:border-primary"
                               />
                             </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3">
                             <div>
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Input Type</label>
                               <select 
                                 value={field.type}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].type = e.target.value;
                                   if (e.target.value !== 'select' && e.target.value !== 'radio') {
                                     delete updated[idx].options;
                                   } else if (!updated[idx].options) {
                                     updated[idx].options = [];
                                   }
                                   setFormSchema(updated);
                                 }}
                                 className="w-full border border-border px-2 py-1 text-xs bg-background focus:outline-none focus:border-primary"
                               >
                                 <option value="text">Text (Short)</option>
                                 <option value="textarea">Textarea (Long)</option>
                                 <option value="number">Number</option>
                                 <option value="select">Dropdown (Select)</option>
                                 <option value="checkbox">Checkbox (True/False)</option>
                               </select>
                             </div>
                             <div className="flex items-center gap-2 pt-4">
                               <input 
                                 type="checkbox" 
                                 checked={field.required || false}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].required = e.target.checked;
                                   setFormSchema(updated);
                                 }}
                                 id={`req-${idx}`}
                                 className="accent-primary"
                               />
                               <label htmlFor={`req-${idx}`} className="text-xs cursor-pointer">Required Field</label>
                             </div>
                           </div>
                           
                           {(field.type === 'select' || field.type === 'radio') && (
                             <div className="mt-3 pt-3 border-t border-border/50">
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-muted-foreground">Options (Comma separated)</label>
                               <input 
                                 type="text" 
                                 value={(field.options || []).join(', ')}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].options = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                   setFormSchema(updated);
                                 }}
                                 placeholder="e.g. Car, Bike, Truck"
                                 className="w-full border border-border px-2 py-1 text-xs bg-background focus:outline-none focus:border-primary"
                               />
                             </div>
                           )}
                         </div>
                       ))}
                     </div>
                   )}
                   
                   {formSchema.length > 0 && (
                     <button
                       onClick={async () => {
                         setFormSchemaSaving(true);
                         try {
                           const res = await fetch('/api/admin/forms', {
                             method: 'POST',
                             headers: { 
                               'Content-Type': 'application/json',
                               'x-admin-password': pwd
                             },
                             body: JSON.stringify({ category: selectedFormCategory, fields_schema: formSchema })
                           });
                           if (res.ok) alert("Schema saved successfully!");
                           else alert("Error saving schema");
                         } catch (e) {
                           alert("Error saving schema");
                         }
                         setFormSchemaSaving(false);
                       }}
                       disabled={formSchemaSaving}
                       className="w-full bg-green-600 text-white py-2 text-xs font-bold uppercase transition-all hover:bg-green-700 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(22,163,74,0.3)]"
                     >
                       {formSchemaSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                       Save Schema
                     </button>
                   )}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
{/* ── EDIT MODAL ── */}
        <AnimatePresence>
          {editItem && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background border border-border w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/20">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-primary">Edit Listing</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{editType} · ID: {editItem.id}</p>
                  </div>
                  <button onClick={() => { setEditItem(null); setEditType(null); }} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto space-y-4 flex-1">
                  
                  {/* Listing Title (Common) */}
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Listing Title</label>
                        <input
                          type="text"
                          required
                          value={editItem.title || ""}
                          onChange={e => setEditItem({ ...editItem, title: e.target.value })}
                          className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                        />
                      </div>
                        <div className="mt-4">
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">City</label>
                          <select value={editItem.city || "Hyderabad"} onChange={e => setEditItem({ ...editItem, city: e.target.value })} className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none">
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Bangalore">Bangalore</option>
                          </select>
                        </div>


                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Location (Area)</label>
                          <select
                            value={editItem.location || ""}
                            onChange={e => setEditItem({ ...editItem, location: e.target.value })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none cursor-pointer"
                          >
                            {HYDERABAD_AREAS.map(area => (
                              <option key={area} value={area}>{area}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Colony / Landmark</label>
                          <input
                            type="text"
                            required
                            value={editItem.colony || ""}
                            onChange={e => setEditItem({ ...editItem, colony: e.target.value })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                  <div className="grid grid-cols-2 gap-4">
                    {editType === "room" && (
                      <>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Rent / Month</label>
                          <input
                            type="number"
                            required
                            value={editItem.rent || 0}
                            onChange={e => setEditItem({ ...editItem, rent: Number(e.target.value) })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Advance Amount</label>
                          <input
                            type="number"
                            required
                            value={editItem.advance || 0}
                            onChange={e => setEditItem({ ...editItem, advance: Number(e.target.value) })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    {editType === "flatmate" && (
                      <>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Rent Share / Month</label>
                          <input
                            type="number"
                            required
                            value={editItem.rentShare || editItem.rent_share || 0}
                            onChange={e => setEditItem({ ...editItem, rentShare: Number(e.target.value), rent_share: Number(e.target.value) })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Advance Share</label>
                          <input
                            type="number"
                            required
                            value={editItem.advanceShare || editItem.advance_share || 0}
                            onChange={e => setEditItem({ ...editItem, advanceShare: Number(e.target.value), advance_share: Number(e.target.value) })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          />
                        </div>
                      </>
                    )}

                    {editType === "property_sales" && (
                      <>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Property Type</label>
                          <select
                            value={editItem.property_type || "apartment"}
                            onChange={e => setEditItem({ ...editItem, property_type: e.target.value })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          >
                            <option value="apartment">Apartment</option>
                            <option value="villa">Villa</option>
                            <option value="independent_house">Independent House</option>
                            <option value="plot">Plot/Land</option>
                            <option value="commercial">Commercial</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Selling Price</label>
                          <input
                            type="number"
                            required
                            value={editItem.price || 0}
                            onChange={e => setEditItem({ ...editItem, price: Number(e.target.value) })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                    {editType === "build_listings" && (
                      <>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Category</label>
                          <select
                            value={editItem.category || "contractor"}
                            onChange={e => setEditItem({ ...editItem, category: e.target.value })}
                            className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          >
                            <option value="contractor">Contractor</option>
                            <option value="architect">Architect</option>
                            <option value="interior_designer">Interior Designer</option>
                            <option value="material_supplier">Material Supplier</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      required
                      value={editItem.description || ""}
                      onChange={e => setEditItem({ ...editItem, description: e.target.value })}
                      className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none font-light leading-relaxed resize-none"
                    />
                  </div>

                  {/* VISUAL MEDIA CRUD SECTION */}
                  {(editType === "room" || editType === "flatmate" || editType === "property_sales" || editType === "build_listings") && (
                    <div className="border border-border p-4 bg-secondary/10 space-y-4">
                      <p className="text-xs uppercase tracking-widest font-bold text-primary">🖼️ & 🎥 Media Management</p>
                      
                      {/* Image Grid with Delete */}
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold mb-1.5 text-muted-foreground">Current Images ({editItem.images?.length || 0})</label>
                        {(!editItem.images || editItem.images.length === 0) ? (
                          <p className="text-xs text-muted-foreground italic">No images present</p>
                        ) : (
                          <div className="grid grid-cols-5 gap-2 mb-2">
                            {editItem.images.map((img: string, idx: number) => (
                              <div key={idx} className="relative aspect-square border border-border bg-black/95 flex items-center justify-center">
                                <img src={img} alt="" className="max-w-full max-h-full object-contain" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = editItem.images.filter((_: any, i: number) => i !== idx);
                                    setEditItem({ ...editItem, images: updated });
                                  }}
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:scale-110 transition-transform shadow-md z-10 w-4 h-4 flex items-center justify-center"
                                >
                                  <X size={8} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add Image URL */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Paste image URL here..."
                            value={newImgUrl}
                            onChange={e => setNewImgUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddImage(); } }}
                            className="flex-1 border border-border px-2 py-1 text-xs bg-background focus:border-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddImage}
                            className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 text-xs font-bold uppercase transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Video URLs with Delete */}
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold mb-1.5 text-muted-foreground">Current Videos ({editItem.videos?.length || 0})</label>
                        {(!editItem.videos || editItem.videos.length === 0) ? (
                          <p className="text-xs text-muted-foreground italic">No videos present</p>
                        ) : (
                          <div className="space-y-1.5 mb-2">
                            {editItem.videos.map((vid: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between bg-background border border-border px-2 py-1 text-xs">
                                <span className="truncate flex-1 font-mono text-[10px] text-muted-foreground pr-4">{vid}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = editItem.videos.filter((_: any, i: number) => i !== idx);
                                    setEditItem({ ...editItem, videos: updated });
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold uppercase text-[9px] px-1"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add Video URL */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Paste video URL here..."
                            value={newVidUrl}
                            onChange={e => setNewVidUrl(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddVideo(); } }}
                            className="flex-1 border border-border px-2 py-1 text-xs bg-background focus:border-primary focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddVideo}
                            className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 text-xs font-bold uppercase transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}


                  {editType === "room" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Furnishing</label>
                        <select
                          value={editItem.furnishing || "Unfurnished"}
                          onChange={e => setEditItem({ ...editItem, furnishing: e.target.value })}
                          className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Fully Furnished">Fully Furnished</option>
                          <option value="Semi Furnished">Semi Furnished</option>
                          <option value="Unfurnished">Unfurnished</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Gender Preference</label>
                        <select
                          value={editItem.gender_preference || editItem.genderPreference || "Any Gender"}
                          onChange={e => setEditItem({ ...editItem, gender_preference: e.target.value, genderPreference: e.target.value })}
                          className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Male Bachelors Only">Male Bachelors Only</option>
                          <option value="Female Bachelors Only">Female Bachelors Only</option>
                          <option value="Any Gender">Any Gender</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {editType === "flatmate" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Gender Preference</label>
                        <select
                          value={editItem.genderPref || editItem.gender_pref || "Any"}
                          onChange={e => setEditItem({ ...editItem, genderPref: e.target.value, gender_pref: e.target.value })}
                          className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Any">Any</option>
                          <option value="Male Bachelors Only">Male Bachelors Only</option>
                          <option value="Female Bachelors Only">Female Bachelors Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Profession Pref</label>
                        <input
                          type="text"
                          value={editItem.professionPref || ""}
                          onChange={e => setEditItem({ ...editItem, professionPref: e.target.value })}
                          className="w-full border border-border px-3 py-2 text-sm bg-background focus:border-primary focus:outline-none"
                          placeholder="e.g. Software Professional"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Metadata Section */}
                  {(editType === "room" || editType === "flatmate" || editType === "property_sales" || editType === "build_listings") && (
                    <div className="border border-border p-4 bg-primary/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-widest font-bold text-primary">⚡ Dynamic Fields (Metadata)</p>
                        <button
                          type="button"
                          onClick={() => {
                            const newMeta = { ...(editItem.metadata || {}) };
                            const keyName = prompt("Enter new field name (e.g., max_guests, deposit_terms):");
                            if (keyName && keyName.trim()) {
                              newMeta[keyName.trim()] = "";
                              setEditItem({ ...editItem, metadata: newMeta });
                            }
                          }}
                          className="bg-primary/20 hover:bg-primary/30 text-primary px-3 py-1 text-xs font-bold uppercase transition-colors"
                        >
                          + Add Field
                        </button>
                      </div>
                      
                      {(!editItem.metadata || Object.keys(editItem.metadata).length === 0) ? (
                        <p className="text-xs text-muted-foreground italic">No dynamic fields present. Add fields here to show them in the app instantly without updates.</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(editItem.metadata).map(([key, val]) => (
                            <div key={key} className="flex gap-2 items-start">
                              <div className="w-1/3">
                                <input
                                  type="text"
                                  disabled
                                  value={key}
                                  className="w-full border border-border px-3 py-2 text-xs bg-black/40 text-muted-foreground cursor-not-allowed"
                                />
                              </div>
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={String(val)}
                                  onChange={(e) => {
                                    const newMeta = { ...editItem.metadata, [key]: e.target.value };
                                    setEditItem({ ...editItem, metadata: newMeta });
                                  }}
                                  className="flex-1 border border-border px-3 py-2 text-xs bg-background focus:border-primary focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if(confirm(`Delete field '${key}'?`)) {
                                      const newMeta = { ...editItem.metadata };
                                      delete newMeta[key];
                                      setEditItem({ ...editItem, metadata: newMeta });
                                    }
                                  }}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-500 px-3 py-2 flex items-center justify-center transition-colors"
                                  title="Remove field"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="border-t border-border pt-4 flex gap-3 justify-end">
                    <button type="button" onClick={() => { setEditItem(null); setEditType(null); }}
                      className="px-4 py-2 border border-border hover:bg-secondary/40 text-xs font-bold uppercase transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={editLoading}
                      className="bg-primary text-primary-foreground px-5 py-2 text-xs font-bold uppercase hover:opacity-95 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                      {editLoading ? <RefreshCw size={12} className="animate-spin" /> : null}
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── DELETE CONFIRMATION MODAL ── */}
        <AnimatePresence>
          {deleteItem && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background border border-red-200 w-full max-w-sm overflow-hidden shadow-2xl p-6 relative">
                
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <AlertCircle size={24} />
                  <h3 className="font-black text-sm uppercase tracking-wider">Confirm Delete</h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                  Are you absolutely sure you want to delete <span className="font-bold text-foreground">"{deleteItem.title}"</span>? This action is permanent and cannot be undone.
                </p>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setDeleteItem(null); setDeleteType(null); }}
                    className="px-4 py-2 border border-border hover:bg-secondary/40 text-xs font-bold uppercase transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleDeleteConfirm} disabled={deleteLoading}
                    className="bg-red-600 text-white px-5 py-2 text-xs font-bold uppercase hover:bg-red-700 transition-colors flex items-center gap-1.5">
                    {deleteLoading ? <RefreshCw size={12} className="animate-spin" /> : null}
                    Yes, Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
