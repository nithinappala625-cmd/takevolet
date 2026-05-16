"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Home, IndianRupee, TrendingUp, CheckCircle2,
  Clock, X, AlertCircle, RefreshCw, Eye, EyeOff, LogOut,
  Wallet, ArrowUpRight, Building2, Phone, Mail, Send,
  BarChart2, Activity, Download, ChevronDown, Star
} from "lucide-react";

const ADMIN_PASSWORD = "Nithin@Takevolet2026";

type Tab = "overview" | "payouts" | "interests" | "handovers" | "users" | "rooms";

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

  // ── Login ──────────────────────────────────────────────────────────────────
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
          {(["overview", "payouts", "interests", "handovers", "users", "rooms"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-xs uppercase tracking-widest font-bold whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {tab === "payouts" && pendingPayouts.length > 0
                ? `payouts (${pendingPayouts.length})`
                : tab === "users" ? `users (${users.length})`
                : tab === "rooms" ? `rooms (${rooms.length})`
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
                          <p className="text-xs text-muted-foreground truncate">{p.userName} · {p.upiId || `****${p.bankAccount?.slice(-4)}`}</p>
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
                        <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                          {p.upiId && <span className="flex items-center gap-1"><Phone size={10} />{p.upiId}</span>}
                          {p.bankAccount && <span className="flex items-center gap-1"><Building2 size={10} />****{p.bankAccount.slice(-4)} | {p.bankIfsc}</span>}
                          <span><Clock size={10} className="inline mr-1" />{fmtDate(p.requestedAt)}</span>
                          {p.processedAt && <span className="text-green-600"><CheckCircle2 size={10} className="inline mr-1" />Processed: {fmtDate(p.processedAt)}</span>}
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

        {/* ── INTERESTS (Address Unlocks) ── */}
        {activeTab === "interests" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Address Unlock Records ({interests.length}) — ₹500 each</p>
            {interests.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Eye size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No interest records yet</p>
              </div>
            ) : (
              <div className="bg-background border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-secondary/30 text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                  <div className="col-span-3">Seeker</div>
                  <div className="col-span-3">Room / Poster</div>
                  <div className="col-span-2">Platform Fee</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Handover</div>
                </div>
                {interests.map((i: any) => (
                  <div key={i.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border last:border-0 items-center hover:bg-secondary/10">
                    <div className="col-span-3">
                      <p className="text-sm font-semibold">{i.userName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{i.userId}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-semibold truncate">{i.roomTitle}</p>
                      <p className="text-[10px] text-muted-foreground">by {i.posterName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-black text-green-600">₹500</p>
                      <p className="text-[10px] text-muted-foreground">To platform</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">{fmtDate(i.paidAt)}</p>
                    </div>
                    <div className="col-span-2">
                      <StatusBadge status={i.handoverConfirmed ? "completed" : "pending"} />
                    </div>
                  </div>
                ))}
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
              <div className="bg-background border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-border bg-secondary/30 text-[9px] uppercase tracking-widest font-bold text-muted-foreground">
                  <div className="col-span-2">Name</div>
                  <div className="col-span-2">Contact</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-2">House No</div>
                  <div className="col-span-1">Gender</div>
                  <div className="col-span-2">Profession</div>
                  <div className="col-span-1">KYC</div>
                </div>
                {users.map((u: any) => (
                  <div key={u.id} className="grid grid-cols-12 gap-2 p-4 border-b border-border last:border-0 items-center hover:bg-secondary/10">
                    <div className="col-span-2">
                      <p className="text-sm font-semibold truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{fmtDate(u.created_at)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-mono">{u.phone}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-semibold">{u.colony}</p>
                      <p className="text-[10px] text-muted-foreground">{u.location}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-mono text-primary">{u.house_no}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs">{u.gender}</p>
                      <p className="text-[10px] text-muted-foreground">{u.members_count} member{u.members_count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs truncate">{u.profession}</p>
                    </div>
                    <div className="col-span-1">
                      {u.aadhaar_url ? (
                        <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5">✓ Done</span>
                      ) : (
                        <span className="text-[9px] bg-yellow-100 text-yellow-700 font-bold px-1.5 py-0.5">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── ROOMS ── */}
        {activeTab === "rooms" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Posted Rooms ({rooms.length})</p>
            {rooms.length === 0 ? (
              <div className="bg-background border border-dashed border-border p-16 text-center">
                <Home size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-muted-foreground">No rooms posted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((r: any) => (
                  <div key={r.id} className="bg-background border border-border p-4 flex items-center gap-4">
                    {r.images?.[0] ? (
                      <img src={r.images[0]} alt="" className="w-16 h-16 object-cover shrink-0 border border-border" />
                    ) : (
                      <div className="w-16 h-16 bg-secondary flex items-center justify-center shrink-0 border border-border">
                        <Home size={20} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.colony}, {r.location} · ₹{r.rent?.toLocaleString("en-IN")}/mo</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{r.id}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusBadge status={r.is_available ? "completed" : "rejected"} />
                      <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
