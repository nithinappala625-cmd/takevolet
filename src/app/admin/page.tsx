"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, Home, IndianRupee, TrendingUp, CheckCircle2,
  Clock, X, AlertCircle, RefreshCw, Eye, EyeOff, LogOut,
  Wallet, ArrowUpRight, Building2, Phone, Mail, Send,
  BarChart2, Activity, Download, ChevronDown, Star, Lock,
  ShoppingBag, ShieldCheck, Edit2, Sparkles, Link2, Copy,
  ExternalLink, Image as ImageIcon, Maximize2, CheckSquare,
  Square, FileText
} from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { MOCK_ROOMS, MOCK_FLATMATES, MOCK_ITEMS } from "@/data/mock";
import { HYDERABAD_AREAS } from "@/data/locations";
import { insertAdAction, updateAdAction, deleteAdAction, fetchAllRoomsAction, fetchAllPagesAction, insertPageAction, updatePageAction, deletePageAction } from "@/lib/server-actions";
import { uploadRoomMedia } from "@/lib/db";
import { checkAdminPassword, DEFAULT_ADMIN_PASSWORD, VALID_ADMIN_PASSWORDS } from "@/lib/adminAuth";

type Tab = "overview" | "payouts" | "unlocks" | "interests" | "handovers" | "users" | "rooms" | "extractor" | "flatmates" | "property_sales" | "build_listings" | "bookings" | "form_builder" | "leads";

export default function AdminPage() {
  const [authed, setAuthed]     = useState(false);
  const [pwd, setPwd]           = useState("");
  const currentAdminPwd         = pwd?.trim() || DEFAULT_ADMIN_PASSWORD;
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
  const [localBookings, setLocalBookings] = useState<any[]>([]);
  const [localLeads, setLocalLeads] = useState<any[]>([]);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");
  const [leadLoading, setLeadLoading] = useState(false);

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

  // Link Extraction Engine State
  const [extractMode, setExtractMode] = useState<"link" | "paste">("link");
  const [extractInput, setExtractInput] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveRoomLoading, setSaveRoomLoading] = useState(false);
  const [saveRoomSuccess, setSaveRoomSuccess] = useState(false);
  const [saveRoomForm, setSaveRoomForm] = useState<any>({
    title: "",
    rent: 0,
    advance: 0,
    location: "Hyderabad",
    colony: "",
    full_address: "",
    furnishing: "Semi-Furnished",
    tenant_type: "bachelor",
    gender_preference: "Any",
    description: "",
    images: [] as string[],
    phone: "",
  });
  const [recentExtractions, setRecentExtractions] = useState<any[]>([]);

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
      setLocalBookings(data.bookings || []);
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
          "x-admin-password": currentAdminPwd,
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
          "x-admin-password": currentAdminPwd,
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

  const handleLogin = (e?: React.FormEvent, overridePwd?: string) => {
    if (e) e.preventDefault();
    const candidate = overridePwd !== undefined ? overridePwd : pwd;
    const clean = (candidate || "").trim();
    const isOwner = user?.email?.toLowerCase() === "nithinappala625@gmail.com";
    const isValid = checkAdminPassword(clean) || (isOwner && (!clean || clean.toLowerCase() === "takevolet" || clean.toLowerCase() === "admin"));

    if (isValid) {
      const finalPwd = checkAdminPassword(clean) ? clean : DEFAULT_ADMIN_PASSWORD;
      setAuthed(true);
      setPwd(finalPwd);
      setPwdError("");
      try {
        sessionStorage.setItem("takevolet_admin_authed", "true");
        sessionStorage.setItem("takevolet_admin_pwd", finalPwd);
      } catch {}
      fetchData();
    } else {
      setPwdError("Incorrect password. Access denied.");
    }
  };

  const handleLogout = () => {
    setAuthed(false);
    setPwd("");
    try {
      sessionStorage.removeItem("takevolet_admin_authed");
      sessionStorage.removeItem("takevolet_admin_pwd");
    } catch {}
  };

  // ── Fetch admin data ───────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [dataRes, leadsRes] = await Promise.all([
        fetch("/api/admin/data", { headers: { "x-admin-password": currentAdminPwd } }),
        fetch("/api/admin/leads", { headers: { "x-admin-password": currentAdminPwd } }).catch(() => null)
      ]);
      const json = await dataRes.json();
      if (json.success) setData(json);

      if (leadsRes && leadsRes.ok) {
        const leadsJson = await leadsRes.json();
        if (leadsJson.success) setLocalLeads(leadsJson.leads || []);
      }
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadStatusUpdate = async (leadId: string | number, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": currentAdminPwd,
        },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      if (res.ok) {
        setLocalLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (e) {
      console.error("Failed to update lead status", e);
    }
  };

  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem("takevolet_admin_authed");
      const savedPwd = sessionStorage.getItem("takevolet_admin_pwd");
      if (savedAuth === "true" && savedPwd && checkAdminPassword(savedPwd)) {
        setPwd(savedPwd);
        setAuthed(true);
      }
      const saved = localStorage.getItem("takevolet_recent_extractions");
      if (saved) setRecentExtractions(JSON.parse(saved));
    } catch {}
  }, []);

  // ── Link Extractor Handlers ─────────────────────────────────────────────────
  const showFeedbackToast = (msg: string) => {
    setCopyFeedback(msg);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleExtractListing = async (urlToExtract?: string) => {
    const isPaste = extractMode === "paste";
    const targetUrl = (urlToExtract || extractInput).trim();
    const pasteBody = pasteContent.trim();

    if (isPaste && !pasteBody) {
      setExtractError("Please paste OLX page HTML source or listing text into the box below.");
      return;
    }
    if (!isPaste && !targetUrl) {
      setExtractError("Please paste an OLX listing link or share text");
      return;
    }

    setExtractLoading(true);
    setExtractError("");
    try {
      let requestPayload: any = {};
      if (isPaste) {
        const isHtml = pasteBody.includes("<") && pasteBody.includes(">");
        requestPayload = isHtml ? { rawHtml: pasteBody } : { rawText: pasteBody };
      } else {
        // Auto-detect if user accidentally pasted raw HTML into the URL input
        if (targetUrl.startsWith("<") || targetUrl.includes("<html") || targetUrl.includes("<div") || (targetUrl.length > 500 && !targetUrl.startsWith("http"))) {
          requestPayload = { rawHtml: targetUrl };
        } else {
          requestPayload = { url: targetUrl };
        }
      }

      let res = await fetch("/api/admin/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": currentAdminPwd,
        },
        body: JSON.stringify(requestPayload),
      });
      let json = await res.json();

      // Client-side fallback if server-side fetch failed (e.g., OLX blocked Vercel datacenter IP)
      if ((!res.ok || !json.success) && requestPayload.url) {
        try {
          showFeedbackToast("Server fetch blocked. Attempting client browser proxy fallback...");
          const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(requestPayload.url)}`;
          const clientRes = await fetch(corsProxyUrl);
          if (clientRes.ok) {
            const clientHtml = await clientRes.text();
            if (clientHtml && clientHtml.length > 500) {
              const retryRes = await fetch("/api/admin/extract", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-admin-password": currentAdminPwd,
                },
                body: JSON.stringify({ url: requestPayload.url, rawHtml: clientHtml }),
              });
              const retryJson = await retryRes.json();
              if (retryRes.ok && retryJson.success) {
                res = retryRes;
                json = retryJson;
              }
            }
          }
        } catch (clientFallbackErr) {
          console.warn("Client browser proxy fallback failed:", clientFallbackErr);
        }
      }

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Extraction failed. Tip: Switch to 'Direct HTML / Text Paste' tab to bypass network blocks.");
      }

      setExtractedData(json.data);
      const allHdUrls = (json.data.cleanImages || []).map((img: any) => img.hdUrl || img.originalUrl);
      setSelectedImages(allHdUrls);

      setSaveRoomForm({
        title: json.data.title || "",
        rent: json.data.rent || 0,
        advance: json.data.advance || (json.data.rent ? json.data.rent * 2 : 0),
        location: json.data.location || "Hyderabad",
        colony: json.data.colony || json.data.location || "Madhapur",
        full_address: json.data.fullAddress || "",
        furnishing: json.data.furnishing || "Semi-Furnished",
        tenant_type: json.data.tenantType || "bachelor",
        gender_preference: "Any",
        description: json.data.description || "",
        images: allHdUrls,
        phone: json.data.phone || "",
      });

      // Save to recent extractions
      const savedKey = requestPayload.url || json.data.title || "Custom Extraction";
      const updatedRecent = [
        {
          id: savedKey,
          title: json.data.title,
          rent: json.data.rent,
          location: json.data.colony || json.data.location,
          image: allHdUrls[0] || "",
          imagesCount: allHdUrls.length,
          sourceUrl: requestPayload.url || "",
          data: json.data,
          extractedAt: "Just now",
        },
        ...recentExtractions.filter((r: any) => r.sourceUrl !== savedKey),
      ].slice(0, 8);

      setRecentExtractions(updatedRecent);
      try {
        localStorage.setItem("takevolet_recent_extractions", JSON.stringify(updatedRecent));
      } catch {}

      showFeedbackToast("Listing and clean images extracted successfully!");
    } catch (err: any) {
      console.error(err);
      setExtractError(err.message || "Failed to extract listing. Please ensure the link is active or use Direct Paste mode.");
    } finally {
      setExtractLoading(false);
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showFeedbackToast(`Copied ${label} to clipboard!`);
  };

  const handleCopyAllImageUrls = () => {
    if (!selectedImages.length) return;
    navigator.clipboard.writeText(selectedImages.join("\n"));
    showFeedbackToast(`Copied ${selectedImages.length} clean image URLs!`);
  };

  const handleDownloadSingleImage = async (imgUrl: string, idx: number) => {
    try {
      showFeedbackToast(`Downloading image #${idx + 1}...`);
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `takevolet-clean-${idx + 1}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(imgUrl, "_blank");
    }
  };

  const handleDownloadSelectedImages = async () => {
    if (!selectedImages.length) return;
    showFeedbackToast(`Triggering download for ${selectedImages.length} clean images...`);
    for (let i = 0; i < selectedImages.length; i++) {
      await handleDownloadSingleImage(selectedImages[i], i);
      await new Promise(r => setTimeout(r, 400));
    }
  };

  const handleToggleImageSelect = (imgUrl: string) => {
    setSelectedImages(prev => {
      const next = prev.includes(imgUrl) ? prev.filter(u => u !== imgUrl) : [...prev, imgUrl];
      setSaveRoomForm((f: any) => ({ ...f, images: next }));
      return next;
    });
  };

  const handleSelectAllImages = () => {
    if (!extractedData?.cleanImages) return;
    const all = extractedData.cleanImages.map((img: any) => img.hdUrl || img.originalUrl);
    setSelectedImages(all);
    setSaveRoomForm((f: any) => ({ ...f, images: all }));
  };

  const handleDeselectAllImages = () => {
    setSelectedImages([]);
    setSaveRoomForm((f: any) => ({ ...f, images: [] }));
  };

  const handleSaveExtractedRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveRoomForm.title || !saveRoomForm.rent) {
      alert("Title and Rent are required!");
      return;
    }
    setSaveRoomLoading(true);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": currentAdminPwd,
        },
        body: JSON.stringify({
          action: "create_room",
          roomData: {
            ...saveRoomForm,
            images: selectedImages,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to publish room");
      }

      if (json.room) {
        setLocalRooms(prev => [json.room, ...prev]);
      }
      setShowSaveModal(false);
      setSaveRoomSuccess(true);
      setTimeout(() => setSaveRoomSuccess(false), 5000);
      showFeedbackToast("🎉 Room successfully published to Takevolet!");
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert("Error saving room: " + err.message);
    } finally {
      setSaveRoomLoading(false);
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
          "x-admin-password": currentAdminPwd,
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
  if (userLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-primary" /></div>;
  if (!user || user.email?.toLowerCase() !== "nithinappala625@gmail.com") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <Lock size={48} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-slate-500">You do not have permission to view this page.</p>
      </div>
    );
  }

  // ━━━ LOGIN SCREEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary flex items-center justify-center">
              <Shield size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="font-black text-lg leading-none">Takevolet</p>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Admin Dashboard</p>
            </div>
          </div>
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-xs text-emerald-300">
              <span className="font-semibold block text-emerald-800 font-bold">Owner Verified</span>
              <span className="text-[11px] opacity-80">{user.email}</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold">Admin Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setPwd(DEFAULT_ADMIN_PASSWORD);
                    setPwdError("");
                  }}
                  className="text-[11px] text-primary hover:underline font-bold"
                >
                  Auto-Fill Default
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={pwd}
                  onChange={e => {
                    setPwd(e.target.value);
                    if (pwdError) setPwdError("");
                  }}
                  placeholder={DEFAULT_ADMIN_PASSWORD}
                  className="w-full border border-slate-200 px-4 py-3 text-sm bg-white focus:border-primary focus:outline-none pr-10 font-mono"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Default: <code className="text-slate-700 font-mono select-all">Nithin@Takevolet2026</code></span>
              </div>
              {pwdError && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={11} />{pwdError}</p>}
            </div>
            <button type="submit"
              className="w-full bg-primary text-primary-foreground py-3.5 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer">
              <Shield size={14} /> Access Dashboard
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-500 mt-5">
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex font-sans">
      
      {/* ── SIDEBAR ── */}
      <div className="w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <span className="font-bold text-base block text-slate-900 font-bold">Takevolet Admin</span>
              <span className="text-slate-500 text-xs block mt-0.5">Nithin Patel</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1">
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-3 px-3">Menu</p>
          {(["overview", "payouts", "unlocks", "interests", "handovers", "users", "rooms", "extractor", "flatmates", "property_sales", "build_listings", "bookings", "form_builder", "leads"] as Tab[]).map(tab => {
            const label = tab === "payouts" && pendingPayouts.length > 0 ? `Payouts (${pendingPayouts.length})` 
                        : tab === "unlocks" && data?.contactUnlocks?.length > 0 ? `Unlocks (${data.contactUnlocks.length})`
                        : tab === "property_sales" ? `Property Sales`
                        : tab === "build_listings" ? `Build Listings`
                        : tab === "form_builder" ? `Form Builder`
                        : tab === "leads" ? `Social Leads CRM`
                        : tab === "extractor" ? `✨ Link Extractor`
                        : tab.charAt(0).toUpperCase() + tab.slice(1);
            
            const count = tab === "users" ? users.length 
                        : tab === "rooms" ? localRooms.length 
                        : tab === "flatmates" ? localFlatmates.length 
                        : tab === "property_sales" ? localPropertySales.length 
                        : tab === "build_listings" ? localBuildListings.length 
                        : tab === "bookings" ? localBookings.length 
                        : tab === "leads" ? localLeads.length 
                        : tab === "extractor" ? (extractedData ? "Ready" : null)
                        : null;
            
            const labelStr = count !== null ? `${label} (${count})` : label;

            return (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between ${
                  activeTab === tab 
                  ? "bg-purple-50 text-[#7B3AEC] font-bold border border-purple-200 shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {labelStr}
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-slate-200">
           <button onClick={handleLogout} className="w-full text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm bg-slate-50 hover:bg-slate-100 rounded-xl py-3">
             <LogOut size={16} /> Logout
           </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        
        {/* Top Navbar */}
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-40">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <span className="text-gray-500">Admin</span> / <span className="text-blue-400 capitalize">{activeTab.replace('_', ' ')}</span>
          </h2>
          <div className="flex items-center gap-4">
             {pendingPayouts.length > 0 && (
               <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                 <AlertCircle size={12}/> {pendingPayouts.length} PENDING
               </span>
             )}
             <button onClick={fetchData} className="text-slate-500 hover:text-white transition-colors flex items-center gap-1.5 text-sm bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-400">
               <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
             </button>
          </div>
        </div>

        <div className="p-8 max-w-[1400px] mx-auto w-full">
          
          {/* Dashboard Welcome Header */}
          <div className="bg-gradient-to-r from-white to-slate-50 rounded-2xl p-8 mb-8 border border-slate-200 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Shield size={120} />
             </div>
             <div className="relative z-10">
                <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
                  <Activity size={28} className="text-blue-400" />
                  Admin Dashboard
                </h1>
                <p className="text-slate-500 text-sm">Welcome back. Here's what's happening with your platform today.</p>
             </div>
          </div>

          {/* Revenue & Activity Stats - Merged Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Revenue",    value: fmt(stats.totalRevenue || 0),        color: "text-green-400",  bg: "bg-green-400/10", icon: TrendingUp },
              { label: "Handover Rev",     value: fmt(stats.handoverRevenue || 0),     color: "text-blue-400",   bg: "bg-blue-400/10", icon: Home },
              { label: "Paid Out",         value: fmt(stats.totalPaidOut || 0),        color: "text-orange-400", bg: "bg-orange-400/10", icon: Wallet },
              { label: "Handovers Done",   value: stats.totalHandovers || 0,           color: "text-purple-400", bg: "bg-purple-400/10", icon: CheckCircle2 },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col transition-all hover:border-slate-300">
                <div className="flex justify-between items-start mb-4">
                   <div className={`p-3 rounded-xl ${s.bg}`}>
                     <s.icon size={20} className={s.color} strokeWidth={2} />
                   </div>
                </div>
                <p className="text-3xl font-black text-slate-900 mb-1">{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Commission model */}
              <div className="bg-white border border-slate-200 p-6">
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
                        <p className="text-[10px] text-slate-500">{row.to} <span className="text-primary font-bold">{row.amount}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4 grid grid-cols-2 gap-2 text-center">
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
              <div className="bg-white border border-slate-200 p-6">
                <p className="text-xs uppercase tracking-widest font-bold mb-4 flex items-center justify-between">
                  Pending Payouts
                  {pendingPayouts.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5">{pendingPayouts.length} waiting</span>
                  )}
                </p>
                {pendingPayouts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
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
                          <p className="text-xs text-slate-500 truncate">
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Wallet size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No payout requests yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payouts.map((p: any) => (
                  <div key={p.id} className="bg-white border border-slate-200 overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="font-bold text-base">{fmt(p.amount)}</p>
                          <StatusBadge status={p.status} />
                          <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 font-bold uppercase">{p.method || "UPI"}</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-500">{p.userName}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.id}</p>
                        <div className="flex flex-col gap-3 mt-1.5">
                          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
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
                            <img src={p.qrCode} alt="Payout QR Code" className="w-24 h-24 object-contain border border-slate-200" />
                          )}
                        </div>
                        {p.notes && <p className="text-xs text-slate-500 italic mt-1">Note: {p.notes}</p>}
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Phone size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No contact unlocks yet</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-slate-200 bg-slate-50 text-[9px] uppercase tracking-widest font-bold text-slate-500">
                  <div className="col-span-3">Seeker (Paid)</div>
                  <div className="col-span-3">Poster (Unlocked)</div>
                  <div className="col-span-3">Listing Info</div>
                  <div className="col-span-1">Amount</div>
                  <div className="col-span-2">Date</div>
                </div>
                {data.contactUnlocks.map((u: any) => (
                  <div key={u.id} className="grid grid-cols-12 gap-2 p-4 border-b border-slate-200 last:border-0 items-center hover:bg-slate-100">
                    <div className="col-span-3">
                      <p className="text-sm font-bold">{u.seeker_name}</p>
                      <p className="text-xs font-mono mt-0.5">{u.seeker_phone}</p>
                      <p className="text-[10px] text-slate-500 truncate">{u.seeker_email}</p>
                    </div>
                    <div className="col-span-3">
                      <p className="text-sm font-bold text-primary">{u.poster_name}</p>
                      <p className="text-xs font-mono mt-0.5">{u.poster_phone}</p>
                      {u.poster_whatsapp && <p className="text-[10px] text-green-600 font-bold mt-0.5">WA: {u.poster_whatsapp}</p>}
                    </div>
                    <div className="col-span-3">
                      <p className="text-xs font-semibold">{u.title}</p>
                      <span className="text-[9px] uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 mt-1 inline-block">
                        {u.type}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs font-bold text-green-600">₹15</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">{fmtDate(u.created_at)}</p>
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Eye size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No interest records yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {interests.map((i: any) => {
                  const pId = i.razorpay_payment_id || i.payment_id || i.id;
                  const passNumber = "TV-PASS-" + (pId.slice(-6).toUpperCase());
                  return (
                    <div key={i.id} className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <ShieldCheck size={80} className="text-primary"/>
                      </div>
                      
                      {/* Header */}
                      <div className="bg-primary/5 border-b border-slate-200 p-4 flex justify-between items-center relative z-10">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Pass Number</p>
                          <p className="font-mono font-bold text-primary">{passNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Fee Paid</p>
                          <p className="text-sm font-black text-green-600">₹{i.platform_fee || i.amount || 500}</p>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-4 relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Seeker</p>
                            <p className="text-sm font-semibold truncate">{i.userName || i.seeker_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{i.userId || i.seeker_id}</p>
                          </div>
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Poster</p>
                            <p className="text-sm font-semibold truncate">{i.posterName || i.poster_name}</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Property</p>
                          <p className="text-sm font-semibold truncate" title={i.roomTitle || i.room_title}>{i.roomTitle || i.room_title}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-slate-200 pt-4">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Generated</p>
                            <p className="text-xs font-semibold">{fmtDate(i.paidAt || i.paid_at || i.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">Handover</p>
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Home size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No handovers confirmed yet</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-12 gap-2 p-4 border-b border-slate-200 bg-slate-50 text-[9px] uppercase tracking-widest font-bold text-slate-500">
                  <div className="col-span-3">Seeker</div>
                  <div className="col-span-3">Poster</div>
                  <div className="col-span-2">Poster Gets</div>
                  <div className="col-span-2">Platform Gets</div>
                  <div className="col-span-2">Date</div>
                </div>
                {handovers.map((h: any) => (
                  <div key={h.id} className="grid grid-cols-12 gap-2 p-4 border-b border-slate-200 last:border-0 items-center hover:bg-slate-100">
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
                      <p className="text-xs text-slate-500">{fmtDate(h.confirmedAt)}</p>
                    </div>
                  </div>
                ))}
                {/* Total */}
                <div className="grid grid-cols-12 gap-2 p-4 bg-slate-50 font-bold text-sm">
                  <div className="col-span-6 text-right text-slate-500">TOTAL:</div>
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No users registered yet</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 overflow-x-auto">
                <div className="min-w-[1000px]">
                  <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_2fr_1fr_0.5fr] gap-2 p-4 border-b border-slate-200 bg-slate-50 text-[9px] uppercase tracking-widest font-bold text-slate-500">
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
                  <div key={u.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-100">
                    <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr_1fr_2fr_1fr_0.5fr] gap-2 p-4 items-center">
                      <div>
                        <p className="text-sm font-semibold truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-500">Bal: <span className="text-primary font-bold">{u.contact_balance}</span></p>
                        <p className="text-[10px] text-slate-500">{fmtDate(u.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-mono">{u.phone}</p>
                        {u.whatsapp && <p className="text-[10px] text-green-600 font-bold mt-0.5">WA: {u.whatsapp}</p>}
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{u.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{u.colony}</p>
                        <p className="text-[10px] text-slate-500 truncate">{u.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-mono text-primary truncate">{u.house_no}</p>
                        <p className="text-[10px] truncate">{u.owner_name}</p>
                        <p className="text-[10px] font-mono text-slate-500">{u.owner_phone}</p>
                      </div>
                      <div>
                        <p className="text-[10px] truncate">{u.gender}</p>
                        <p className="text-[10px] truncate text-slate-500">{u.profession}</p>
                        <p className="text-[10px] text-slate-500">{u.members_count} mem</p>
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
                            <a href={u.payout_qr_code} target="_blank" rel="noopener noreferrer" className="block w-10 h-10 border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity" title="View QR">
                              <img src={u.payout_qr_code} alt="QR Code" className="w-full h-full object-cover" />
                            </a>
                          </div>
                        )}
                        {!u.payout_method && (
                          <p className="text-[10px] text-slate-500 italic">None saved</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {u.aadhaar_url ? (
                          <a href={u.aadhaar_url} target="_blank" rel="noopener noreferrer" className="block w-8 h-10 border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity" title="View Front">
                            <img src={u.aadhaar_url} alt="Front" className="w-full h-full object-cover" />
                          </a>
                        ) : (
                          <span className="text-[9px] bg-yellow-100 text-yellow-700 font-bold px-1 py-0.5">Pend</span>
                        )}
                        {u.aadhaar_back_url && (
                          <a href={u.aadhaar_back_url} target="_blank" rel="noopener noreferrer" className="block w-8 h-10 border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity" title="View Back">
                            <img src={u.aadhaar_back_url} alt="Back" className="w-full h-full object-cover" />
                          </a>
                        )}
                      </div>
                      <div className="text-right flex justify-end">
                        <button onClick={() => { setEditType("user"); setEditItem(u); }} className="p-2 hover:bg-slate-100 rounded transition-colors text-slate-500 hover:text-primary">
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Edit Form for Users */}
                    {editType === "user" && editItem?.id === u.id && (
                      <div className="p-4 bg-[#F8FAFC] border-t border-slate-200">
                        <form onSubmit={handleSaveEdit} className="grid grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Name</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.name || ""} onChange={e => setEditItem({...editItem, name: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Phone</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.phone || ""} onChange={e => setEditItem({...editItem, phone: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">WhatsApp</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.whatsapp || ""} onChange={e => setEditItem({...editItem, whatsapp: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Email</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.email || ""} onChange={e => setEditItem({...editItem, email: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Contact Balance</label>
                            <input type="number" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.contact_balance || 0} onChange={e => setEditItem({...editItem, contact_balance: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Location</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.location || ""} onChange={e => setEditItem({...editItem, location: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Colony</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.colony || ""} onChange={e => setEditItem({...editItem, colony: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">House No</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.house_no || ""} onChange={e => setEditItem({...editItem, house_no: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Profession</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.profession || ""} onChange={e => setEditItem({...editItem, profession: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Gender</label>
                            <input type="text" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.gender || ""} onChange={e => setEditItem({...editItem, gender: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">DOB</label>
                            <input type="date" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.dob || ""} onChange={e => setEditItem({...editItem, dob: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Members Count</label>
                            <input type="number" className="w-full p-2 bg-white border border-slate-200 text-xs" value={editItem.members_count || 1} onChange={e => setEditItem({...editItem, members_count: e.target.value})} />
                          </div>
                          <div className="col-span-4 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => { setEditType(null); setEditItem(null); }} className="px-4 py-2 border border-slate-200 text-xs uppercase font-bold hover:bg-slate-100">Cancel</button>
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-slate-900">Posted Rooms ({localRooms.length})</p>
                <p className="text-xs text-slate-500 mt-0.5">Manage live room listings or import new rooms from OLX without watermarks.</p>
              </div>
              <button
                onClick={() => setActiveTab("extractor")}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Sparkles size={14} /> Extract from OLX Link
              </button>
            </div>
            {localRooms.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Home size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No rooms posted yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localRooms.map((r: any) => (
                  <div key={r.id} className="bg-white border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {r.images?.[0] ? (
                        <div className="w-20 h-20 shrink-0 border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          <img src={r.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                          {r.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 font-bold">+{r.images.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <Home size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{r.title}</p>
                        <p className="text-xs text-slate-500">{r.colony}, {r.location}</p>
                        <p className="text-xs text-primary font-bold mt-1">₹{r.rent?.toLocaleString("en-IN")}/mo <span className="text-[10px] text-slate-500 font-normal">· Advance: ₹{r.advance?.toLocaleString("en-IN")}</span></p>
                        {r.description && <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic font-light">"{r.description}"</p>}
                        <div className="mt-2 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-between">
                          <div className="text-[11px] font-bold text-emerald-600">
                            📞 Owner: <span className="text-slate-900 font-bold font-mono">{r.custom_contact || r.phone || "Not provided"}</span>
                          </div>
                          {r.custom_contact && <span className="text-[8px] bg-emerald-500/20 text-emerald-700 px-1 py-0.5 rounded font-bold uppercase">Uploaded</span>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-bold uppercase text-slate-700">
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
                    
                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-3">
                      <div className="text-[10px] text-slate-500">
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

        {/* ── LINK EXTRACTION ENGINE ── */}
        {activeTab === "extractor" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Header Hero Banner */}
            <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white border border-blue-500/30 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Sparkles size={160} className="text-blue-400" />
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <Sparkles size={13} className="text-blue-400 animate-pulse" />
                  Takevolet Extraction Engine
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
                  OLX Clean Image & Room Data Extractor
                </h1>
                <p className="text-slate-700 text-xs md:text-sm leading-relaxed mb-4">
                  Bypass screenshots, mobile status bars, and OLX watermark overlays. Paste any OLX listing link or shared text to extract <strong>100% clean, original full-resolution photos directly from OLX Apollo CDN</strong>, alongside title, rent, location, and description.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-emerald-800 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Zero Watermark Original Photos
                  </span>
                  <span className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg text-blue-800 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={13} className="text-blue-600" /> High-Res 1080p Originals
                  </span>
                  <span className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg text-amber-800 flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={13} className="text-amber-600" /> 1-Click Publish to Takevolet
                  </span>
                </div>
              </div>
            </div>

            {/* Notification Toasts */}
            <AnimatePresence>
              {copyFeedback && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm">
                  <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-600" /> {copyFeedback}</span>
                  <button onClick={() => setCopyFeedback(null)} className="text-emerald-700 hover:text-emerald-950 p-1"><X size={14} /></button>
                </motion.div>
              )}
              {extractError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-red-50 border border-red-300 text-red-900 px-4 py-3.5 rounded-xl text-xs font-medium flex items-start justify-between shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-red-950">Extraction Notice</p>
                      <p className="text-xs text-red-800 mt-0.5 leading-relaxed">{extractError}</p>
                    </div>
                  </div>
                  <button onClick={() => setExtractError("")} className="text-red-600 hover:text-red-900 p-1"><X size={14} /></button>
                </motion.div>
              )}
              {saveRoomSuccess && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center justify-between shadow-md">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-emerald-600" />
                    <div>
                      <p className="font-bold text-sm text-emerald-950">Room Successfully Published!</p>
                      <p className="text-xs text-emerald-800">The listing has been created in Takevolet database with clean photos.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("rooms")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow"
                  >
                    View in Rooms Tab
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => { setExtractMode("link"); setExtractError(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  extractMode === "link"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Link2 size={14} /> Extract by OLX Link
              </button>
              <button
                type="button"
                onClick={() => { setExtractMode("paste"); setExtractError(""); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  extractMode === "paste"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Copy size={14} /> Direct Paste HTML / Text (Bypass IP Block)
              </button>
            </div>

            {/* Input & Extraction Control Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <form onSubmit={(e) => { e.preventDefault(); handleExtractListing(); }} className="space-y-4">
                {extractMode === "link" ? (
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-700 mb-2">
                      Paste OLX Listing URL or App Share Text:
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-4 text-slate-400 pointer-events-none">
                        <Link2 size={18} />
                      </div>
                      <input
                        type="text"
                        value={extractInput}
                        onChange={(e) => setExtractInput(e.target.value)}
                        placeholder="e.g. https://www.olx.in/item/... or pasted WhatsApp/app share text with link"
                        className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl pl-12 pr-32 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                      />
                      <div className="absolute right-3 flex items-center gap-1.5">
                        {extractInput && (
                          <button
                            type="button"
                            onClick={() => { setExtractInput(""); setExtractError(""); }}
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
                            title="Clear input"
                          >
                            <X size={15} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              if (text) {
                                setExtractInput(text);
                                showFeedbackToast("Pasted from clipboard!");
                              }
                            } catch {
                              alert("Clipboard access not permitted. Please paste manually (Ctrl+V).");
                            }
                          }}
                          className="text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:border-slate-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                          title="Paste from clipboard"
                        >
                          <Copy size={12} /> Paste
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs uppercase tracking-widest font-bold text-slate-700">
                        Paste Raw OLX Page Source (HTML) or Shared Ad Text:
                      </label>
                      <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> 100% Immune to Cloudflare/Vercel Blocks
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder="Open OLX listing in your browser -> Right Click -> 'View Page Source' (Ctrl+U) -> Select All & Paste here. Or copy the full ad text from the mobile app."
                      className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl p-3.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-inner"
                    />
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                      <span>{pasteContent ? `${pasteContent.length.toLocaleString()} characters pasted` : "Paste full page HTML or text description"}</span>
                      {pasteContent && (
                        <button
                          type="button"
                          onClick={() => setPasteContent("")}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          Clear Text
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  {extractMode === "link" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500 font-semibold">Test Samples:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = "https://www.olx.in/item/2-bhk-furnished-flat-for-rent-thondayad-calicutnv-iid-1853831994";
                          setExtractInput(url);
                          handleExtractListing(url);
                        }}
                        className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg transition-all font-medium"
                      >
                        Sample 1: 2 BHK Furnished
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const url = "https://www.olx.in/item/apartment-for-rent-at-malapparamba-junction-calicut-iid-1854926647";
                          setExtractInput(url);
                          handleExtractListing(url);
                        }}
                        className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-lg transition-all font-medium"
                      >
                        Sample 2: Malaparamba Flat (11 Photos)
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      💡 Tip: Even if OLX blocks Vercel servers, direct HTML extraction works instantaneously without any network requests.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={extractLoading || (extractMode === "link" ? !extractInput.trim() : !pasteContent.trim())}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {extractLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Extracting Clean Media...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Extract Clean Images & Data
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Extracted Listing Results */}
            {extractedData && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Main Listing Header & Actions Bar */}
                <div className="bg-white border border-blue-500/40 rounded-2xl p-6 shadow-2xl relative">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={11} /> {extractedData.platform === "olx" ? "OLX Verified CDN" : "Generic Listing"}
                        </span>
                        <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {extractedData.cleanImages?.length || 0} Clean Photos Extracted
                        </span>
                        {extractedData.bedrooms && (
                          <span className="bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                            {extractedData.bedrooms}
                          </span>
                        )}
                        {extractedData.furnishing && (
                          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                            {extractedData.furnishing}
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl md:text-2xl font-black text-slate-900 truncate hover:text-clip">
                        {extractedData.title}
                      </h2>

                      <div className="flex flex-wrap items-baseline gap-4 mt-2">
                        <span className="text-2xl font-black text-primary">
                          ₹{extractedData.rent?.toLocaleString("en-IN") || 0}
                          <span className="text-xs font-normal text-slate-500 ml-1">/ month</span>
                        </span>
                        {extractedData.advance > 0 && (
                          <span className="text-xs text-slate-500">
                            Advance Deposit: <strong className="text-slate-900 font-mono">₹{extractedData.advance?.toLocaleString("en-IN")}</strong>
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          📍 {extractedData.colony ? `${extractedData.colony}, ` : ""}{extractedData.location}, {extractedData.city}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        onClick={() => setShowSaveModal(true)}
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Sparkles size={14} />
                        Publish to Takevolet
                      </button>

                      <button
                        onClick={handleCopyAllImageUrls}
                        className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-blue-500/50 text-slate-900 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                        title="Copy all clean image links"
                      >
                        <Copy size={13} />
                        Copy All URLs
                      </button>

                      <button
                        onClick={handleDownloadSelectedImages}
                        disabled={selectedImages.length === 0}
                        className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-emerald-500/50 disabled:opacity-40 text-slate-900 text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                        title="Download selected clean photos"
                      >
                        <Download size={13} />
                        Download ({selectedImages.length})
                      </button>

                      {extractedData.sourceUrl && (
                        <a
                          href={extractedData.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-slate-900 p-3 rounded-xl border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all shadow-sm"
                          title="Open original OLX listing"
                        >
                          <ExternalLink size={15} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clean Photos Showcase Grid */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <ImageIcon size={18} className="text-blue-600" />
                        Clean Original Photos ({extractedData.cleanImages?.length || 0})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        These photos are fetched directly from the high-res storage source. Zero watermark stamps.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSelectAllImages}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllImages}
                        className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors"
                      >
                        Deselect All
                      </button>
                      <span className="text-xs bg-slate-100 text-slate-900 border border-slate-200 px-2.5 py-1 rounded-lg font-mono font-bold">
                        Selected: {selectedImages.length} / {extractedData.cleanImages?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Images Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(extractedData.cleanImages || []).map((img: any, idx: number) => {
                      const isSelected = selectedImages.includes(img.hdUrl || img.originalUrl);
                      const activeUrl = img.hdUrl || img.originalUrl;
                      return (
                        <div
                          key={img.id || idx}
                          className={`group relative rounded-xl overflow-hidden border transition-all duration-200 bg-black/40 flex flex-col ${
                            isSelected
                              ? "border-blue-500 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500"
                              : "border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                          }`}
                        >
                          {/* Image Thumbnail Container */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/90 flex items-center justify-center">
                            <img
                              src={img.thumbnailUrl || img.originalUrl}
                              alt={`Clean listing photo ${idx + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />

                            {/* Top Left Selection Checkbox */}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <button
                                type="button"
                                onClick={() => handleToggleImageSelect(activeUrl)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/40"
                                    : "bg-black/70 text-slate-500 hover:text-white border border-white/20"
                                }`}
                              >
                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                              </button>
                            </div>

                            {/* Watermark-Free Badge */}
                            <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                              <span className="bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                ✨ Clean HD
                              </span>
                            </div>

                            {/* Hover Actions Overlay */}
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(activeUrl)}
                                className="bg-slate-100 hover:bg-white/25 text-white p-2.5 rounded-xl transition-all"
                                title="Zoom Fullscreen"
                              >
                                <Maximize2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadSingleImage(activeUrl, idx)}
                                className="bg-slate-100 hover:bg-white/25 text-white p-2.5 rounded-xl transition-all"
                                title="Download Clean JPG"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyText(activeUrl, `Image #${idx + 1} URL`)}
                                className="bg-slate-100 hover:bg-white/25 text-white p-2.5 rounded-xl transition-all"
                                title="Copy Clean Image URL"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Image Footer Details */}
                          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
                            <span className="text-slate-600 font-mono text-[10px]">Photo #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyText(activeUrl, `Photo #${idx + 1} URL`)}
                                className="text-slate-600 hover:text-blue-600 transition-colors flex items-center gap-1 font-medium"
                              >
                                <Copy size={11} /> Copy Link
                              </button>
                              <span className="text-slate-300">·</span>
                              <a
                                href={activeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-600 hover:text-slate-900 transition-colors"
                                title="Open original CDN image in new tab"
                              >
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extracted Details & Description Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left 1 Column: Structured Specs */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                      <FileText size={16} className="text-blue-600" />
                      Extracted Specifications
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Listing Title</span>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900">{extractedData.title}</p>
                          <button onClick={() => handleCopyText(extractedData.title, "Title")} className="text-slate-500 hover:text-slate-900 shrink-0"><Copy size={12} /></button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Pricing</span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-primary">₹{extractedData.rent?.toLocaleString("en-IN")}/mo</span>
                          <span className="text-slate-500">Advance: ₹{extractedData.advance?.toLocaleString("en-IN")}</span>
                          <button onClick={() => handleCopyText(`Rent: ₹${extractedData.rent}, Advance: ₹${extractedData.advance}`, "Pricing")} className="text-slate-500 hover:text-slate-900"><Copy size={12} /></button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Location Details</span>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{extractedData.colony}, {extractedData.location}</p>
                            <p className="text-[11px] text-slate-500">{extractedData.city}</p>
                          </div>
                          <button onClick={() => handleCopyText(`${extractedData.colony}, ${extractedData.location}, ${extractedData.city}`, "Location")} className="text-slate-500 hover:text-slate-900"><Copy size={12} /></button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Configuration</span>
                          <p className="font-semibold text-slate-900">{extractedData.bedrooms || "1 BHK"}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Furnishing</span>
                          <p className="font-semibold text-slate-900">{extractedData.furnishing || "Semi-Furnished"}</p>
                        </div>
                      </div>

                      {extractedData.phone && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">📞 Contact Phone Detected</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-slate-900 text-sm">{extractedData.phone}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleCopyText(extractedData.phone, "Phone Number")} className="text-emerald-400 hover:text-white"><Copy size={13} /></button>
                              <a href={`https://wa.me/91${extractedData.phone.replace(/[^0-9]/g, "").slice(-10)}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-white text-[11px] font-bold underline">WhatsApp</a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right 2 Columns: Full Description */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Full Listing Description</h3>
                        <button
                          type="button"
                          onClick={() => handleCopyText(extractedData.description, "Description")}
                          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                        >
                          <Copy size={12} /> Copy Text
                        </button>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[360px] overflow-y-auto">
                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed font-light">
                          {extractedData.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-xs text-slate-500">
                        Ready to make this room live on Takevolet? Clean photos will be saved directly.
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSaveModal(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles size={14} />
                        Publish Listing to Takevolet Now
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Extractions History */}
            {recentExtractions.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Clock size={16} />
                    Recently Extracted Listings ({recentExtractions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRecentExtractions([]);
                      localStorage.removeItem("takevolet_recent_extractions");
                    }}
                    className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
                  >
                    Clear History
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentExtractions.map((rec: any) => (
                    <div
                      key={rec.id}
                      onClick={() => {
                        setExtractedData(rec.data);
                        const urls = (rec.data.cleanImages || []).map((img: any) => img.hdUrl || img.originalUrl);
                        setSelectedImages(urls);
                        setSaveRoomForm({
                          title: rec.data.title || "",
                          rent: rec.data.rent || 0,
                          advance: rec.data.advance || 0,
                          location: rec.data.location || "Hyderabad",
                          colony: rec.data.colony || "Madhapur",
                          full_address: rec.data.fullAddress || "",
                          furnishing: rec.data.furnishing || "Semi-Furnished",
                          tenant_type: rec.data.tenantType || "bachelor",
                          gender_preference: "Any",
                          description: rec.data.description || "",
                          images: urls,
                          phone: rec.data.phone || "",
                        });
                        showFeedbackToast(`Reloaded "${rec.title}"!`);
                      }}
                      className="group bg-white border border-slate-200 hover:border-blue-500/50 rounded-xl p-3 cursor-pointer transition-all hover:shadow-md flex items-center gap-3"
                    >
                      {rec.image ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          <img src={rec.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200">
                          <Home size={18} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{rec.title}</p>
                        <p className="text-[11px] text-primary font-bold">₹{rec.rent?.toLocaleString("en-IN")}/mo</p>
                        <p className="text-[10px] text-slate-500 truncate">{rec.location} · {rec.imagesCount} photos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}

        {/* ── FLATMATES ── */}
        {activeTab === "flatmates" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-sm font-bold uppercase tracking-widest mb-4">Posted Flatmates ({localFlatmates.length})</p>
            {localFlatmates.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No flatmate listings yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localFlatmates.map((f: any) => (
                  <div key={f.id} className="bg-white border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {f.images?.[0] ? (
                        <div className="w-20 h-20 shrink-0 border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          <img src={f.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                          {f.images.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] px-1 font-bold">+{f.images.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <Users size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{f.title}</p>
                        <p className="text-xs text-slate-500">{f.colony}, {f.location}</p>
                        <p className="text-xs text-primary font-bold mt-1">₹{(f.rentShare || f.rent_share)?.toLocaleString("en-IN")}/mo <span className="text-[10px] text-slate-500 font-normal">· Advance: ₹{(f.advanceShare || f.advance_share)?.toLocaleString("en-IN")}</span></p>
                        {f.description && <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic font-light">"{f.description}"</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-[9px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-bold uppercase text-slate-700">
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

                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-3">
                      <div className="text-[10px] text-slate-500 flex flex-col gap-0.5">
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <ShoppingBag size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No properties yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localPropertySales.map((m: any) => (
                  <div key={m.id} className="bg-white border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {(m.images && m.images.length > 0) ? (
                        <div className="w-20 h-20 shrink-0 border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          <img src={m.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <Home size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{m.title}</p>
                        <p className="text-xs text-slate-500">{m.location} · <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">{m.property_type || 'Unknown'}</span></p>
                        <p className="text-xs text-primary font-bold mt-1">Price: ₹{m.price?.toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-3">
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
              <div className="bg-white border border-dashed border-slate-300 border-slate-200 p-16 text-center">
                <ShoppingBag size={32} className="mx-auto mb-3 text-slate-500" />
                <p className="font-semibold text-slate-500">No build listings yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {localBuildListings.map((m: any) => (
                  <div key={m.id} className="bg-white border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-all duration-300">
                    <div className="flex gap-4">
                      {(m.images && m.images.length > 0) ? (
                        <div className="w-20 h-20 shrink-0 border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center relative">
                          <img src={m.images[0]} alt="" className="max-w-full max-h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <ShoppingBag size={24} className="text-slate-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate hover:text-primary transition-colors">{m.title}</p>
                        <p className="text-xs text-slate-500">{m.location} · <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-700">{m.category || 'Unknown'}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-3">
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

        
        
          {/* ── BOOKINGS TAB ── */}
          {activeTab === "bookings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Booking CRM</h2>
                  <p className="text-sm text-slate-500">Manage service and material bookings.</p>
                </div>
              </div>
              
              {localBookings.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-300 rounded-lg text-slate-500">No bookings found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {localBookings.map((bk: any) => (
                    <div key={bk.id} className="bg-white border rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6 hover:border-primary/30 transition-all">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">{bk.status || 'PENDING'}</span>
                          <h3 className="font-bold text-lg">{bk.build_listings?.title || 'Unknown Listing'} <span className="text-slate-500 font-normal text-sm">({bk.build_listings?.display_id})</span></h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Customer Details</p>
                            <p className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-slate-500"/> {bk.profiles?.full_name || 'Anonymous'}</p>
                            <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-slate-500"/> {bk.profiles?.phone || 'No Phone'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Booking Info</p>
                            <p className="text-sm"><strong>Method:</strong> {bk.payment_method}</p>
                            <p className="text-sm"><strong>Date:</strong> {new Date(bk.created_at).toLocaleString()}</p>
                          </div>
                        </div>

                        {bk.booking_data && Object.keys(bk.booking_data).length > 0 && (
                          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm font-semibold mb-2">Dynamic Form Data</p>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(bk.booking_data).map(([key, value]) => (
                                <div key={key} className="text-sm">
                                  <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span> 
                                  <span className="ml-2 font-medium">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium text-sm transition-colors">
                          Confirm
                        </button>
                        <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm transition-colors">
                          Cancel
                        </button>
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
            
            <div className="bg-white border border-slate-200 p-6 shadow-sm">
              <p className="text-sm text-slate-500 mb-4">
                Configure dynamic fields for different categories. These fields will automatically appear on the website and app posting forms.
              </p>
              
              <div className="grid gap-6 md:grid-cols-2">
                 <div className="border border-slate-200 p-4 h-fit">
                   <h3 className="font-bold mb-3 uppercase text-xs tracking-wider border-b border-slate-200 pb-2">Select Category</h3>
                   <select 
                     value={selectedFormCategory}
                     onChange={e => setSelectedFormCategory(e.target.value)}
                     className="w-full p-2 border border-slate-200 text-sm mb-4 bg-white focus:border-primary focus:outline-none">
                     <optgroup label="Build - People & Services">
                       <option value="architect">Architect</option>
                       <option value="civil_engineer">Civil Engineer</option>
                       <option value="contractor">Contractor</option>
                       <option value="builder">Builder</option>
                       <option value="site_engineer">Site Engineer</option>
                       <option value="mason">Mason</option>
                       <option value="electrician">Electrician</option>
                       <option value="plumber">Plumber</option>
                       <option value="carpenter">Carpenter</option>
                       <option value="painter">Painter</option>
                       <option value="interior_designer">Interior Designer</option>
                       <option value="vasthu_checker">Vasthu Checker</option>
                       <option value="surveyor">Surveyor</option>
                       <option value="borewell_operator">Borewell Operator</option>
                       <option value="site_supervisor">Site Supervisor</option>
                     </optgroup>
                     <optgroup label="Build - Materials & Transport">
                       <option value="material_supplier">Material Supplier (All Materials)</option>
                       <option value="transportation">Transportation (All Vehicles)</option>
                     </optgroup>
                     <optgroup label="Build - Projects">
                       <option value="residential">Residential Project</option>
                       <option value="commercial">Commercial Project</option>
                       <option value="apartment">Apartment</option>
                       <option value="villa">Villa</option>
                     </optgroup>
                     <optgroup label="Marketplace & Rooms">
                       <option value="furniture">Furniture (Marketplace)</option>
                       <option value="electronics">Electronics (Marketplace)</option>
                       <option value="appliances">Appliances (Marketplace)</option>
                       <option value="room">Room</option>
                       <option value="flatmate">Flatmate</option>
                     </optgroup>
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
                 
                 <div className="border border-slate-200 p-4 bg-slate-50">
                   <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
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
                     <p className="text-xs text-slate-500 italic text-center py-8">No fields defined for this category. Click "Add Field" to start building.</p>
                   ) : (
                     <div className="space-y-4 mb-4">
                       {formSchema.map((field, idx) => (
                         <div key={idx} className="border border-slate-200 bg-white p-3 relative group">
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
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-slate-500">Internal Key (Name)</label>
                               <input 
                                 type="text" 
                                 value={field.name}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].name = e.target.value.toLowerCase().replace(/\s+/g, '_');
                                   setFormSchema(updated);
                                 }}
                                 placeholder="e.g. vehicle_type"
                                 className="w-full border border-slate-200 px-2 py-1 text-xs bg-slate-50 focus:outline-none focus:border-primary font-mono"
                               />
                             </div>
                             <div>
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-slate-500">Display Label</label>
                               <input 
                                 type="text" 
                                 value={field.label}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].label = e.target.value;
                                   setFormSchema(updated);
                                 }}
                                 placeholder="e.g. Vehicle Type"
                                 className="w-full border border-slate-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-primary"
                               />
                             </div>
                           </div>
                           
                           <div className="grid grid-cols-2 gap-3">
                             <div>
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-slate-500">Input Type</label>
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
                                 className="w-full border border-slate-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-primary"
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
                             <div className="mt-3 pt-3 border-t border-slate-200/50">
                               <label className="block text-[9px] uppercase tracking-wider font-bold mb-1 text-slate-500">Options (Comma separated)</label>
                               <input 
                                 type="text" 
                                 value={(field.options || []).join(', ')}
                                 onChange={e => {
                                   const updated = [...formSchema];
                                   updated[idx].options = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                   setFormSchema(updated);
                                 }}
                                 placeholder="e.g. Car, Bike, Truck"
                                 className="w-full border border-slate-200 px-2 py-1 text-xs bg-white focus:outline-none focus:border-primary"
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
                               'x-admin-password': currentAdminPwd
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

        {/* ── SOCIAL LEADS CRM TAB ── */}
        {activeTab === "leads" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2 text-white">
                  <Users className="text-primary" size={20} /> Social Leads CRM
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Property buyer and rental leads captured from Instagram & social media via Takevolet Extension
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (localLeads.length === 0) {
                      alert("No leads to export!");
                      return;
                    }
                    const headers = [
                      "S.No",
                      "Lead Name / Handle",
                      "Customer Comment / Inquiry",
                      "Intent / Priority",
                      "Instagram Profile URL",
                      "Source Post / Reel URL",
                      "Telangana District / Location",
                      "Interest Category",
                      "Budget",
                      "Status",
                      "Date Captured"
                    ];
                    const rows = localLeads.map((l, idx) => [
                      `"${idx + 1}"`,
                      `"${(l.name || '').replace(/"/g, '""')}"`,
                      `"${(l.comment_text || '').replace(/"/g, '""')}"`,
                      `"${((l.notes && l.notes.includes('High Intent')) ? '🔥 High Intent (Serious Buyer)' : 'General Inquiry').replace(/"/g, '""')}"`,
                      `"${(l.profile_url || '').replace(/"/g, '""')}"`,
                      `"${(l.source_url || '').replace(/"/g, '""')}"`,
                      `"${(l.location || 'All Telangana').replace(/"/g, '""')}"`,
                      `"${(l.category || 'Real Estate').replace(/"/g, '""')}"`,
                      `"${(l.budget || '').replace(/"/g, '""')}"`,
                      `"${(l.status || 'new').replace(/"/g, '""')}"`,
                      `"${new Date(l.created_at || Date.now()).toLocaleString()}"`
                    ]);
                    const csv = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `Takevolet_Leads_${new Date().toISOString().split("T")[0]}.csv`;
                    link.click();
                  }}
                  className="bg-primary hover:bg-primary/90 text-black px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shadow-sm"
                >
                  <Download size={14} /> Export to Excel (.csv)
                </button>

                <button
                  onClick={async () => {
                    setLeadLoading(true);
                    try {
                      const res = await fetch("/api/admin/leads", { headers: { "x-admin-password": currentAdminPwd } });
                      const json = await res.json();
                      if (json.success) setLocalLeads(json.leads || []);
                    } catch (e) {}
                    setLeadLoading(false);
                  }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-900 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-2 transition-all"
                >
                  <RefreshCw size={14} className={leadLoading ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Leads</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{localLeads.length}</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-yellow-400 font-bold">New Inquiries</p>
                <p className="text-2xl font-black text-yellow-400 mt-1">
                  {localLeads.filter(l => (l.status || 'new') === 'new').length}
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Contacted</p>
                <p className="text-2xl font-black text-blue-400 mt-1">
                  {localLeads.filter(l => l.status === 'contacted').length}
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl">
                <p className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Qualified / Closed</p>
                <p className="text-2xl font-black text-green-400 mt-1">
                  {localLeads.filter(l => l.status === 'qualified' || l.status === 'closed').length}
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2 w-full md:w-80">
                <input
                  type="text"
                  placeholder="Search by name, area, comment..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-lg text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
                {["all", "new", "contacted", "qualified", "closed"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeadFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      leadFilter === st
                        ? "bg-primary text-black"
                        : "bg-slate-50 text-slate-500 hover:text-white border border-slate-200"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Lead / Profile</th>
                      <th className="py-3 px-4 font-bold">Location & Category</th>
                      <th className="py-3 px-4 font-bold">Budget</th>
                      <th className="py-3 px-4 font-bold">Comment / Note</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {localLeads
                      .filter(l => {
                        const matchesFilter = leadFilter === "all" || (l.status || "new") === leadFilter;
                        const query = leadSearch.toLowerCase();
                        const matchesSearch = !query || 
                          (l.name && l.name.toLowerCase().includes(query)) ||
                          (l.location && l.location.toLowerCase().includes(query)) ||
                          (l.comment_text && l.comment_text.toLowerCase().includes(query));
                        return matchesFilter && matchesSearch;
                      })
                      .map((lead, idx) => {
                        const handle = (lead.name || "").replace("@", "");
                        const igDmUrl = handle ? `https://ig.me/m/${handle}` : (lead.profile_url || "#");

                        return (
                          <tr key={lead.id || idx} className="hover:bg-slate-100 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                {lead.name}
                              </div>
                              {lead.profile_url && (
                                <a
                                  href={lead.profile_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-400 hover:underline inline-block mt-0.5"
                                >
                                  View Social Profile ↗
                                </a>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="inline-block bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold">
                                {lead.location || "Hyderabad"}
                              </div>
                              <p className="text-slate-500 text-[11px] mt-1">{lead.category || "Property Buyer"}</p>
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              {lead.budget || "—"}
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              {lead.comment_text ? (
                                <p className="text-slate-700 italic bg-black/30 p-2 rounded border border-slate-200/60 text-[11px]">
                                  "{lead.comment_text}"
                                </p>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                              {lead.source_url && (
                                <a
                                  href={lead.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-slate-500 hover:text-white mt-1 block"
                                >
                                  Source Reel / Post ↗
                                </a>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={lead.status || "new"}
                                onChange={(e) => handleLeadStatusUpdate(lead.id, e.target.value)}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded border focus:outline-none cursor-pointer ${
                                  (lead.status || 'new') === 'new' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                                  lead.status === 'contacted' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                  lead.status === 'qualified' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                  'bg-green-500/10 text-green-400 border-green-500/30'
                                }`}
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="closed">Closed / Won</option>
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={igDmUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-primary hover:bg-primary/90 text-black px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-sm transition-all"
                                >
                                  💬 Send DM
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>

                {localLeads.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <p className="font-semibold text-sm">No leads captured yet.</p>
                    <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                      Use the <strong>Takevolet Lead Clipper Extension</strong> on your browser while browsing Instagram property posts to clip leads and send direct messages in 1-click!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
{/* ── EDIT MODAL ── */}
        <AnimatePresence>
          {editItem && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-slate-200 w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-[#F8FAFC]">
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-wider text-primary">Edit Listing</h3>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{editType} · ID: {editItem.id}</p>
                  </div>
                  <button onClick={() => { setEditItem(null); setEditType(null); }} className="text-slate-500 hover:text-white">
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
                          className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
                        />
                      </div>
                        <div className="mt-4">
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">City</label>
                          <select value={editItem.city || "Hyderabad"} onChange={e => setEditItem({ ...editItem, city: e.target.value })} className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none">
                            <option value="Hyderabad">Hyderabad</option>
                            <option value="Bangalore">Bangalore</option>
                            <option value="Pune">Pune</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Chennai">Chennai</option>
                          </select>
                        </div>


                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Location (Area)</label>
                          <select
                            value={editItem.location || ""}
                            onChange={e => setEditItem({ ...editItem, location: e.target.value })}
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none cursor-pointer"
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
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
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
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Advance Amount</label>
                          <input
                            type="number"
                            required
                            value={editItem.advance || 0}
                            onChange={e => setEditItem({ ...editItem, advance: Number(e.target.value) })}
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
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
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5">Advance Share</label>
                          <input
                            type="number"
                            required
                            value={editItem.advanceShare || editItem.advance_share || 0}
                            onChange={e => setEditItem({ ...editItem, advanceShare: Number(e.target.value), advance_share: Number(e.target.value) })}
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
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
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
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
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
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
                            className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
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
                      className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none font-light leading-relaxed resize-none"
                    />
                  </div>

                  {/* VISUAL MEDIA CRUD SECTION */}
                  {(editType === "room" || editType === "flatmate" || editType === "property_sales" || editType === "build_listings") && (
                    <div className="border border-slate-200 p-4 bg-slate-50 space-y-4">
                      <p className="text-xs uppercase tracking-widest font-bold text-primary">🖼️ & 🎥 Media Management</p>
                      
                      {/* Image Grid with Delete */}
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold mb-1.5 text-slate-500">Current Images ({editItem.images?.length || 0})</label>
                        {(!editItem.images || editItem.images.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">No images present</p>
                        ) : (
                          <div className="grid grid-cols-5 gap-2 mb-2">
                            {editItem.images.map((img: string, idx: number) => (
                              <div key={idx} className="relative aspect-square border border-slate-200 bg-black/95 flex items-center justify-center">
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
                            className="flex-1 border border-slate-200 px-2 py-1 text-xs bg-white focus:border-primary focus:outline-none"
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
                        <label className="block text-[9px] uppercase tracking-widest font-bold mb-1.5 text-slate-500">Current Videos ({editItem.videos?.length || 0})</label>
                        {(!editItem.videos || editItem.videos.length === 0) ? (
                          <p className="text-xs text-slate-500 italic">No videos present</p>
                        ) : (
                          <div className="space-y-1.5 mb-2">
                            {editItem.videos.map((vid: string, idx: number) => (
                              <div key={idx} className="flex items-center justify-between bg-white border border-slate-200 px-2 py-1 text-xs">
                                <span className="truncate flex-1 font-mono text-[10px] text-slate-500 pr-4">{vid}</span>
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
                            className="flex-1 border border-slate-200 px-2 py-1 text-xs bg-white focus:border-primary focus:outline-none"
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
                          className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none cursor-pointer"
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
                          className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none cursor-pointer"
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
                          className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none cursor-pointer"
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
                          className="w-full border border-slate-200 px-3 py-2 text-sm bg-white focus:border-primary focus:outline-none"
                          placeholder="e.g. Software Professional"
                        />
                      </div>
                    </div>
                  )}

                  {/* Dynamic Metadata Section */}
                  {(editType === "room" || editType === "flatmate" || editType === "property_sales" || editType === "build_listings") && (
                    <div className="border border-slate-200 p-4 bg-primary/5 space-y-4">
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
                        <p className="text-xs text-slate-500 italic">No dynamic fields present. Add fields here to show them in the app instantly without updates.</p>
                      ) : (
                        <div className="space-y-3">
                          {Object.entries(editItem.metadata).map(([key, val]) => (
                            <div key={key} className="flex gap-2 items-start">
                              <div className="w-1/3">
                                <input
                                  type="text"
                                  disabled
                                  value={key}
                                  className="w-full border border-slate-200 px-3 py-2 text-xs bg-black/40 text-slate-500 cursor-not-allowed"
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
                                  className="flex-1 border border-slate-200 px-3 py-2 text-xs bg-white focus:border-primary focus:outline-none"
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

                  <div className="border-t border-slate-200 pt-4 flex gap-3 justify-end">
                    <button type="button" onClick={() => { setEditItem(null); setEditType(null); }}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-xs font-bold uppercase transition-colors">
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
                className="bg-white border border-red-200 w-full max-w-sm overflow-hidden shadow-2xl p-6 relative">
                
                <div className="flex items-center gap-3 text-red-600 mb-4">
                  <AlertCircle size={24} />
                  <h3 className="font-black text-sm uppercase tracking-wider">Confirm Delete</h3>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Are you absolutely sure you want to delete <span className="font-bold text-slate-900">&quot;{deleteItem.title}&quot;</span>? This action is permanent and cannot be undone.
                </p>

                <div className="flex gap-3 justify-end">
                  <button onClick={() => { setDeleteItem(null); setDeleteType(null); }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-xs font-bold uppercase transition-colors">
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

        {/* ── FULLSCREEN IMAGE PREVIEW MODAL ── */}
        <AnimatePresence>
          {previewImage && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center relative">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute -top-10 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
                  title="Close preview"
                >
                  <X size={20} />
                </button>
                <div className="relative max-h-[80vh] overflow-hidden rounded-xl border border-white/20 shadow-2xl bg-black flex items-center justify-center">
                  <img src={previewImage} alt="Fullscreen clean listing photo" className="max-w-full max-h-[80vh] object-contain" />
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Sparkles size={12} /> 1080p Clean (Zero Watermark)
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => handleDownloadSingleImage(previewImage, 0)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Download size={14} /> Download Clean Photo
                  </button>
                  <button
                    onClick={() => handleCopyText(previewImage, "Image URL")}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <Copy size={14} /> Copy URL
                  </button>
                  <a
                    href={previewImage}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <ExternalLink size={14} /> Open Full Size
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── PUBLISH EXTRACTED ROOM MODAL ── */}
        <AnimatePresence>
          {showSaveModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-primary/40 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative rounded-2xl my-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-white">Publish Room to Takevolet</h3>
                      <p className="text-xs text-slate-500">Review and adjust details before creating live listing</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSaveModal(false)} className="text-slate-500 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveExtractedRoom} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Listing Title *</label>
                    <input
                      type="text"
                      required
                      value={saveRoomForm.title}
                      onChange={e => setSaveRoomForm({ ...saveRoomForm, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Monthly Rent (₹) *</label>
                      <input
                        type="number"
                        required
                        value={saveRoomForm.rent}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, rent: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Advance Deposit (₹)</label>
                      <input
                        type="number"
                        value={saveRoomForm.advance}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, advance: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Colony / Locality *</label>
                      <input
                        type="text"
                        required
                        value={saveRoomForm.colony}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, colony: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">City / Area *</label>
                      <input
                        type="text"
                        required
                        value={saveRoomForm.location}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, location: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Full Address (Revealed upon unlock)</label>
                    <input
                      type="text"
                      value={saveRoomForm.full_address}
                      onChange={e => setSaveRoomForm({ ...saveRoomForm, full_address: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Furnishing</label>
                      <select
                        value={saveRoomForm.furnishing}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, furnishing: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Furnished">Furnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Tenant Type</label>
                      <select
                        value={saveRoomForm.tenant_type}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, tenant_type: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="bachelor">Bachelor</option>
                        <option value="family">Family</option>
                        <option value="any">Any</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Gender Pref</label>
                      <select
                        value={saveRoomForm.gender_preference}
                        onChange={e => setSaveRoomForm({ ...saveRoomForm, gender_preference: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Any">Any Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-slate-500">Description</label>
                    <textarea
                      rows={3}
                      value={saveRoomForm.description}
                      onChange={e => setSaveRoomForm({ ...saveRoomForm, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-primary rounded-lg px-3 py-2 text-xs text-white focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">
                        Selected Clean Photos ({selectedImages.length})
                      </label>
                      <span className="text-[10px] text-emerald-400">✨ Zero Watermarks</span>
                    </div>
                    {selectedImages.length === 0 ? (
                      <p className="text-xs text-red-400 italic">No images selected! Please select at least one photo.</p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedImages.map((img, i) => (
                          <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-black">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleToggleImageSelect(img)}
                              className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-600 text-white rounded-full p-0.5"
                              title="Remove photo"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setShowSaveModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold uppercase text-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveRoomLoading || selectedImages.length === 0}
                      className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-primary/20 cursor-pointer"
                    >
                      {saveRoomLoading ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      Publish Room Now
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
      </div>
    </div>
  );
}
