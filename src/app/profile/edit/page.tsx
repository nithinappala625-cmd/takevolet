"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { upsertProfile, uploadAadhaar, getProfile } from "@/lib/db";
import {
  User, MapPin, Phone, Briefcase, Users, Camera,
  ArrowRight, CheckCircle2, Upload, AlertCircle, Loader2,
  Home, Mail, CreditCard, ChevronDown
} from "lucide-react";
import { LOCATIONS, getColonies } from "@/data/locations";
import Link from "next/link";

const PROFESSIONS = [
  "Software Engineer", "IT Professional", "Student", "Doctor", "Pharmacist",
  "Architect", "CA/Finance", "Banker", "Teacher/Lecturer", "Business Owner",
  "Marketing/Sales", "Designer", "Data Analyst", "Other"
];

const GENDERS = ["Male", "Female", "Other"];

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const aadhaarRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAadhaar, setUploadingAadhaar] = useState(false);
  const [aadhaarPreview, setAadhaarPreview] = useState<string | null>(null);
  const [aadhaarPath, setAadhaarPath] = useState<string | null>(null);
  const [redirect, setRedirect] = useState("/dashboard?tab=profile");
  const [profileLoading, setProfileLoading] = useState(true);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [location, setLocation] = useState("");
  const [colony, setColony] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [profession, setProfession] = useState("");
  const [membersCount, setMembersCount] = useState(1);
  const [gender, setGender] = useState("");

  const colonies = location ? getColonies(location) : [];

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("redirect");
    if (q) setRedirect(q);
  }, []);

  useEffect(() => {
    if (!loading && !user) { router.replace("/auth"); return; }
    if (user) {
      getProfile(user.id).then(profile => {
        if (profile) {
          setFullName(profile.full_name || user.name || "");
          setPhone(profile.phone || "");
          setWhatsapp(profile.whatsapp || "");
          setLocation(profile.location || "");
          setColony(profile.colony || "");
          setHouseNo(profile.house_no || "");
          setOwnerName(profile.owner_name || "");
          setOwnerPhone(profile.owner_phone || "");
          setProfession(profile.profession || "");
          setMembersCount(profile.members_count || 1);
          setGender(profile.gender || "");
          setAadhaarPath(profile.aadhaar_url || null);
        } else {
          setFullName(user.name || "");
          const meta = (user as any).supabaseUser?.user_metadata;
          if (meta?.phone) setPhone(meta.phone);
        }
        setProfileLoading(false);
      });
    }
  }, [user, loading, router]);

  const handleAadhaar = async (file: File) => {
    if (!user) return;
    setUploadingAadhaar(true);
    const preview = URL.createObjectURL(file);
    setAadhaarPreview(preview);
    const { url, error } = await uploadAadhaar(user.id, file);
    if (error) {
      setError("Failed to upload Aadhaar. Try again.");
    } else {
      setAadhaarPath(url);
    }
    setUploadingAadhaar(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) return setError("Full name is required.");
    if (!phone.trim() || phone.length < 10) return setError("Valid 10-digit phone number is required.");
    if (!location) return setError("Please select your area.");
    if (!colony) return setError("Please select your colony.");
    if (!gender) return setError("Please select your gender.");
    if (!profession) return setError("Please select your profession.");
    if (!ownerName.trim()) return setError("House owner name is required.");
    if (!ownerPhone.trim() || ownerPhone.length < 10) return setError("Valid 10-digit owner phone number is required.");

    if (!user) return;
    setSaving(true);

    const { error: saveErr } = await upsertProfile({
      id: user.id,
      full_name: fullName.trim(),
      email: user.email,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      owner_name: ownerName.trim(),
      owner_phone: ownerPhone.trim(),
      location,
      colony,
      house_no: houseNo.trim(),
      profession,
      members_count: membersCount,
      gender,
      aadhaar_url: aadhaarPath || undefined,
      avatar_url: user.avatar,
    });

    setSaving(false);
    if (saveErr) {
      setError("Failed to save profile. Please try again.");
      return;
    }
    router.replace(redirect);
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-2xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3">Update Info</p>
          <h1 className="text-3xl font-black mb-2">Edit Your Profile</h1>
          <p className="text-muted-foreground text-sm">
            Keep your details up to date to maintain trust within the community.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ── PERSONAL INFO ──────────────────────────────────── */}
          <div className="border border-border p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-2">
              <User size={12} className="text-primary" /> Personal Information
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="As on Aadhaar card"
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={user?.email || ""} disabled
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm bg-secondary/50 text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">WhatsApp Number</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Same as phone if same"
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background"
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  Profession <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={profession} onChange={e => setProfession(e.target.value)}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background"
                  >
                    <option value="">Select profession</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  House Owner Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={ownerName} onChange={e => setOwnerName(e.target.value)}
                    placeholder="Owner's full name"
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  House Owner Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)}
                    placeholder="Owner's contact number"
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                Number of People (including you)
              </label>
              <div className="flex items-center gap-3">
                {[1,2,3,4,5,6].map(n => (
                  <button
                    key={n} type="button"
                    onClick={() => setMembersCount(n)}
                    className={`w-10 h-10 border font-bold text-sm transition-all ${membersCount === n ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                  >
                    {n}
                  </button>
                ))}
                <span className="text-xs text-muted-foreground">person{membersCount > 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>

          {/* ── LOCATION ───────────────────────────────────────── */}
          <div className="border border-border p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2 flex items-center gap-2">
              <MapPin size={12} className="text-primary" /> Current Location in Hyderabad
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  Area / Zone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={location} onChange={e => { setLocation(e.target.value); setColony(""); }}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background"
                  >
                    <option value="">Select area</option>
                    {LOCATIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  Colony / Sub-area <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select
                    value={colony} onChange={e => setColony(e.target.value)}
                    disabled={!location}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background disabled:opacity-50"
                  >
                    <option value="">Select colony</option>
                    {colonies.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                  House / Flat Number <span className="text-muted-foreground font-normal">(private — only visible to admin)</span>
                </label>
                <div className="relative">
                  <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={houseNo} onChange={e => setHouseNo(e.target.value)}
                    placeholder="e.g. Flat 3B, Sri Ram Residency"
                    className="w-full border border-border pl-9 pr-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  🔒 Your house number is never shown publicly. Only revealed to seekers after ₹500 payment.
                </p>
              </div>
            </div>
          </div>

          {/* ── AADHAAR / KYC ──────────────────────────────────── */}
          <div className="border border-border p-6">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4 flex items-center gap-2">
              <CreditCard size={12} className="text-primary" /> Identity Verification (Aadhaar)
            </p>

            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              Upload a photo of your Aadhaar card for identity verification. This is stored securely and only accessible to the Takevolet admin. It will not be shared publicly.
            </p>

            <div
              onClick={() => aadhaarRef.current?.click()}
              className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${aadhaarPreview ? "border-green-400 bg-green-50" : "border-border hover:border-primary"}`}
            >
              {aadhaarPreview ? (
                <div>
                  <img src={aadhaarPreview} alt="Aadhaar" className="max-h-40 mx-auto mb-2 object-contain" />
                  <p className="text-xs text-green-600 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} /> Aadhaar uploaded
                  </p>
                </div>
              ) : (
                <div>
                  {uploadingAadhaar ? (
                    <Loader2 size={28} className="animate-spin text-primary mx-auto mb-2" />
                  ) : (
                    <Upload size={28} className="text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm font-semibold mb-1">
                    {uploadingAadhaar ? "Uploading…" : "Click to upload Aadhaar photo"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">JPG, PNG, PDF up to 10MB</p>
                </div>
              )}
              <input
                ref={aadhaarRef}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleAadhaar(e.target.files[0])}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Optional but required for payout withdrawals above ₹10,000.
            </p>
          </div>

          {/* ── ERROR ─────────────────────────────────────────── */}
          {error && (
            <div className="flex gap-2.5 bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── SUBMIT ────────────────────────────────────────── */}
          <button
            type="submit" disabled={saving}
            className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <><Loader2 size={15} className="animate-spin" /> Saving Profile…</>
            ) : (
              <><CheckCircle2 size={15} /> Save & Continue</>
            )}
          </button>

          <p className="text-center text-[10px] text-muted-foreground">
            By saving, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and{" "}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

        </motion.form>
      </div>
    </div>
  );
}
