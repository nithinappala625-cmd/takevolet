"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User, Phone, Mail, MapPin, Briefcase, Users, CheckCircle2,
  ArrowRight, Home, Eye, EyeOff, ArrowLeft, Loader2, Camera
} from "lucide-react";
import { HYDERABAD_AREAS, MEMBERS_ALLOWED } from "@/data/locations";
import { saveProfile, getProfile, setPostLoginRedirect, getPostLoginRedirect, clearPostLoginRedirect, UserProfile } from "@/lib/userStore";

const PROFESSIONS = [
  "Software Engineer", "Data Analyst", "Product Manager", "DevOps Engineer",
  "UI/UX Designer", "Business Analyst", "Marketing Manager", "Finance Professional",
  "Doctor / Medical", "Student", "Teacher / Lecturer", "Sales Executive",
  "Entrepreneur", "Government Employee", "Other"
];

const steps = ["Personal", "Location", "Profile", "Done"];

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    sameAsPhone: true,
    location: "",
    colony: "",
    profession: "",
    membersCount: "1",
    gender: "Male",
    password: "",
    showPassword: false,
  });

  // If already registered, redirect
  useEffect(() => {
    const profile = getProfile();
    if (profile) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  const update = (field: string, value: string | boolean | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    const profile: UserProfile = {
      id: `user_${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      whatsapp: form.sameAsPhone ? form.phone.trim() : form.whatsapp.trim(),
      location: form.location,
      colony: form.colony.trim(),
      profession: form.profession,
      membersCount: Number(form.membersCount),
      gender: form.gender as "Male" | "Female" | "Other",
      avatar: avatarPreview || `https://i.pravatar.cc/150?u=${form.email}`,
      createdAt: new Date().toISOString(),
    };

    saveProfile(profile);
    setSubmitting(false);
    setStep(3); // show success

    setTimeout(() => {
      const dest = getPostLoginRedirect();
      clearPostLoginRedirect();
      router.push(dest);
    }, 2000);
  };

  const canNext = () => {
    if (step === 0) return form.name && form.email && form.phone && form.password.length >= 6;
    if (step === 1) return form.location && form.colony;
    if (step === 2) return form.profession;
    return true;
  };

  // ── Step 3 — Done ────────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md p-12 border border-border">
          <div className="w-20 h-20 border-2 border-primary flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-light mb-3">Welcome, <span className="font-bold">{form.name.split(" ")[0]}!</span></h2>
          <p className="text-muted-foreground font-light mb-4 leading-relaxed">
            Your profile is created. You can now post rooms, sell items, and track your earnings.
          </p>
          <div className="flex items-center justify-center gap-1 text-sm text-primary font-semibold">
            <Loader2 size={14} className="animate-spin" /> Taking you to your dashboard…
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-36 pb-16 px-6">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-3">Create Account</p>
          <h1 className="text-4xl font-light mb-2">
            Set up your <span className="font-bold">profile</span>
          </h1>
          <p className="text-muted-foreground font-light text-sm">
            Required before posting rooms or listing items. Takes 2 minutes.
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-10">
          {steps.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step ? "bg-primary border-primary text-primary-foreground" :
                i === step ? "border-primary text-primary" :
                "border-border text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <div className={`flex-1 h-[2px] ${i < step ? "bg-primary" : "bg-border"} ${i === 2 ? "hidden" : ""}`} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 0 — Personal Info ───────────────────────────────────────── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wide">Personal Info</h2>

              {/* Avatar Upload */}
              <div className="flex items-center gap-5 mb-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden bg-secondary/50 flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-muted-foreground" />
                    )}
                  </div>
                  <label htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-all">
                    <Camera size={12} />
                  </label>
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Profile Photo</p>
                  <p className="text-xs text-muted-foreground">Optional, but helps build trust</p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" required value={form.name} onChange={e => update("name", e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Email ID *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="email" required value={form.email} onChange={e => update("email", e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm" />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Mobile Number *</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="tel" required value={form.phone} onChange={e => update("phone", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm" />
                </div>
              </div>

              {/* WhatsApp same? */}
              <div className="flex items-center gap-3">
                <input type="checkbox" id="sameWA" checked={form.sameAsPhone}
                  onChange={e => update("sameAsPhone", e.target.checked)}
                  className="w-4 h-4 accent-primary" />
                <label htmlFor="sameWA" className="text-sm cursor-pointer">WhatsApp is same as mobile number</label>
              </div>
              {!form.sameAsPhone && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">WhatsApp Number *</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="tel" value={form.whatsapp} onChange={e => update("whatsapp", e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm" />
                  </div>
                </motion.div>
              )}

              {/* Password */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Password *</label>
                <div className="relative">
                  <input type={form.showPassword ? "text" : "password"} required value={form.password}
                    onChange={e => update("password", e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm pr-12" />
                  <button type="button" onClick={() => update("showPassword", !form.showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {form.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 1 — Location ───────────────────────────────────────────── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wide">Your Location</h2>

              {/* Main Area */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Main Area in Hyderabad *</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select required value={form.location} onChange={e => update("location", e.target.value)}
                    className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm appearance-none cursor-pointer">
                    <option value="">Select your area</option>
                    {HYDERABAD_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Colony */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Colony / Sub-area *</label>
                <input type="text" required value={form.colony} onChange={e => update("colony", e.target.value)}
                  placeholder="e.g. Cyber Towers Colony, KPHB Phase 1..."
                  className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm" />
                <p className="text-xs text-muted-foreground mt-1.5">Colony/locality only — no house/door numbers</p>
              </div>

              {/* Info box */}
              <div className="bg-primary/5 border border-primary/20 p-4 text-sm text-muted-foreground leading-relaxed">
                <span className="text-primary font-semibold">Why we ask:</span> Your location helps us show your rooms to bachelors searching in your area, and helps you find rooms nearby when you need one.
              </div>
            </motion.div>
          )}

          {/* ── STEP 2 — Profile Details ─────────────────────────────────────── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-5">
              <h2 className="text-lg font-bold mb-6 uppercase tracking-wide">About You</h2>

              {/* Profession */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Profession *</label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select required value={form.profession} onChange={e => update("profession", e.target.value)}
                    className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm appearance-none cursor-pointer">
                    <option value="">Select your profession</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Members Count */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">How many members are currently living with you?</label>
                <div className="relative">
                  <Users size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select value={form.membersCount} onChange={e => update("membersCount", e.target.value)}
                    className="w-full bg-transparent border border-border pl-10 pr-4 py-3.5 outline-none focus:border-primary transition-colors text-sm appearance-none cursor-pointer">
                    <option value="1">Just me (1 person)</option>
                    {MEMBERS_ALLOWED.slice(1).map(m => (
                      <option key={m} value={m}>{m} persons</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-3">Gender</label>
                <div className="flex gap-3">
                  {["Male", "Female", "Other"].map(g => (
                    <button key={g} type="button" onClick={() => update("gender", g)}
                      className={`flex-1 py-3 text-sm font-semibold border transition-all uppercase tracking-wider ${
                        form.gender === g ? "bg-foreground text-background border-foreground" : "border-border hover:border-primary"
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Preview */}
              <div className="border border-border p-5 bg-secondary/20 mt-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">Profile Preview</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full border-2 border-border overflow-hidden bg-secondary flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={22} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{form.name || "Your Name"}</p>
                    <p className="text-xs text-muted-foreground">{form.profession || "Your Profession"}</p>
                    <p className="text-xs text-primary font-semibold">{form.location ? `${form.colony}, ${form.location}` : "Your Location"}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-none px-6 py-4 border border-border text-sm uppercase tracking-wider font-semibold hover:border-primary transition-all flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              className="flex-1 bg-foreground text-background py-4 text-sm uppercase tracking-wider font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canNext() || submitting}
              className="flex-1 bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {submitting ? (
                <><Loader2 size={14} className="animate-spin" /> Creating Profile…</>
              ) : (
                <>Create My Profile <ArrowRight size={14} /></>
              )}
            </button>
          )}
        </div>

        {/* Already have account */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Already registered?{" "}
          <Link href="/dashboard" className="text-primary font-semibold hover:underline">Go to Dashboard</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
