"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { insertFlatmate } from "@/lib/flatmate-db";
import { getProfile, isProfileComplete, type Profile } from "@/lib/db";
import { LOCATIONS, getColonies } from "@/data/locations";
import {
  Users, Upload, X, CheckCircle2, AlertCircle,
  Loader2, Plus, IndianRupee, Sparkles, ChevronDown, ChevronRight, ChevronLeft, MapPin
} from "lucide-react";
import Link from "next/link";

const GENDER_OPTIONS = ["Any", "Male Bachelors Only", "Female Bachelors Only"];
const PROFESSION_OPTIONS = ["Any", "Software Professional", "Working Professional", "Aspirant / Student preferred"];
const LIFESTYLE_HABITS_LIST = [
  "Veg Only preferred",
  "Non-smoker preferred",
  "No drinking inside",
  "Veg/Non-Veg friendly",
  "Quiet hours after 11 PM",
  "Night Owl",
  "Early Bird",
  "No Smoking",
  "No Alcohol",
  "Visitor friendly",
];

// Predefined beautiful room/flat backgrounds to serve as realistic fallbacks for the demo
const MOCK_FLAT_PHOTOS = [
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&h=800&fit=crop&q=80",
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&h=800&fit=crop&q=80",
];

export default function PostFlatmatePage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const photoRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [dbProfile, setDbProfile] = useState<Profile | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rentShare, setRentShare] = useState("");
  const [advanceShare, setAdvanceShare] = useState("");
  const [location, setLocation] = useState("");
  const [colony, setColony] = useState("");
  const [vacancyCount, setVacancyCount] = useState(1);
  const [genderPref, setGenderPref] = useState("Any");
  const [professionPref, setProfessionPref] = useState("Any");
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const colonies = location ? getColonies(location) : [];

  const [profileChecking, setProfileChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("post_login_redirect", "/post/flatmate");
        }
        router.replace("/auth");
      } else {
        isProfileComplete(user.id).then((complete) => {
          if (!complete) {
            router.replace("/profile/complete?redirect=/post/flatmate");
          } else {
            setProfileChecking(false);
          }
        });
      }
    }
  }, [user, loading, router]);

  // Pre-fill location from profile
  useEffect(() => {
    if (user) {
      getProfile(user.id).then((profile) => {
        if (profile) {
          setDbProfile(profile);
          if (profile.location) setLocation(profile.location);
          if (profile.colony) setColony(profile.colony);
        }
      });
    }
  }, [user]);

  const handleHabitToggle = (habit: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habit) ? prev.filter((h) => h !== habit) : [...prev, habit]
    );
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // Convert to object URLs for fast local preview
    const urls = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...urls].slice(0, 4));
  };

  const removePhoto = (idx: number) => {
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1) {
      if (!title.trim()) return setError("Please enter a listing title.");
      if (title.length < 10) return setError("Title must be at least 10 characters.");
      if (!description.trim()) return setError("Please write a detailed description of the flat/roommates.");
    } else if (step === 2) {
      if (!location) return setError("Please select your flat's general area.");
      if (!colony) return setError("Please select your colony/layout.");
      if (!rentShare || Number(rentShare) <= 500) return setError("Please enter a valid monthly rent share (above ₹500).");
      if (!advanceShare || Number(advanceShare) < 0) return setError("Please enter a valid deposit share.");
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNextStep();
      return;
    }
    setError(null);

    if (!user) return;

    setSubmitting(true);

    // If no images uploaded, attach default premium stock room photos
    const finalImages = photoPreviews.length > 0 ? photoPreviews : [MOCK_FLAT_PHOTOS[Math.floor(Math.random() * MOCK_FLAT_PHOTOS.length)]];

    const flatmateData = {
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      rentShare: Number(rentShare),
      advanceShare: Number(advanceShare),
      location,
      colony,
      vacancyCount,
      professionPref,
      genderPref,
      lifestyleHabits: selectedHabits.length > 0 ? selectedHabits : ["Veg/Non-Veg Friendly", "Chill Workspace", "Non-Smoker Preferred"],
      images: finalImages,
      postedBy: {
        name: dbProfile?.full_name || user.name,
        phone: dbProfile?.phone || user.phone || "+91 98765 43210",
        whatsapp: dbProfile?.whatsapp || dbProfile?.phone || user.phone || "+919876543210",
        avatar: dbProfile?.avatar_url || user.avatar || "https://i.pravatar.cc/150?img=12",
        profession: dbProfile?.profession || user.profession || "Working Professional",
        age: 24,
      },
    };

    try {
      const { data: newFlatmate, error: err } = await insertFlatmate(flatmateData);

      if (err) {
        setError("Error publishing flatmate posting. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/flatmates/${newFlatmate?.id}`);
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading || profileChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-12 max-w-md border border-primary/20 bg-primary/5 shadow-2xl"
        >
          <div className="w-16 h-16 bg-primary/10 border border-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-black mb-3 gold-gradient">Listing Live! 🎉</h2>
          <p className="text-muted-foreground text-sm font-light leading-relaxed">
            Your flatmate roommate vacancy has been successfully created. Redirecting to your premium detail page...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-2xl">
        
        {/* Progress Stepper Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 border border-primary/30 px-3.5 py-1 rounded-full mb-4 bg-primary/5 inline-flex">
            <Users size={12} className="text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-primary">
              Flatmate Wizard
            </span>
          </div>
          <h1 className="text-3xl font-black mb-2">Find a compatible Flatmate</h1>
          <p className="text-muted-foreground text-sm font-light leading-relaxed">
            List your flat&apos;s vacant room and compatibility traits to match with high-quality bachelors.
          </p>

          {/* Stepper bar */}
          <div className="flex items-center gap-2 mt-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 transition-all duration-300 ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-2">
            <span className={step === 1 ? "text-primary" : ""}>1. Profile Details</span>
            <span className={step === 2 ? "text-primary" : ""}>2. Location & Pricing</span>
            <span className={step === 3 ? "text-primary" : ""}>3. Traits & Rules</span>
          </div>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault(); }} className="space-y-8">
          
          {/* STEP 1: Details & Media */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Title & Desc */}
              <div className="border border-border p-6 space-y-4 bg-background">
                <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
                  Flatmate Post Details
                </p>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                    Post Heading / Catchy Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. 1 Room Vacant in Deluxe 3BHK Flat - Madhapur"
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                    Description & Vibe <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Mention who is currently living, professions, house configurations (Washing machine, Cook, Wifi) and roommate traits you expect."
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="border border-border p-6 bg-background">
                <p className="text-xs uppercase tracking-widest font-bold text-primary mb-4">
                  Flat photos (Optional)
                </p>
                
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative aspect-square border border-border">
                      <img src={src} alt="Uploaded Room" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 hover:scale-105 transition-transform"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {photoPreviews.length < 4 && (
                    <div
                      onClick={() => photoRef.current?.click()}
                      className="aspect-square border border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer bg-secondary/10 hover:bg-secondary/20 transition-all"
                    >
                      <Upload size={18} className="text-muted-foreground" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-2">Add Photo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <p className="text-[11px] text-muted-foreground font-light">
                  Upload up to 4 high-quality photos. If none added, we will attach premium default stock mock images automatically.
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Location & Financials */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Location Selectors */}
              <div className="border border-border p-6 space-y-4 bg-background">
                <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
                  Location details
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                      Hyderabad Area <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setColony("");
                        }}
                        className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background cursor-pointer"
                      >
                        <option value="">Select general area</option>
                        {LOCATIONS.map((l) => (
                          <option key={l.value} value={l.value}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                      Colony Name / Layout <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select
                        value={colony}
                        onChange={(e) => setColony(e.target.value)}
                        disabled={!location}
                        className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background disabled:opacity-50 cursor-pointer"
                      >
                        <option value="">Select colony</option>
                        {colonies.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Details */}
              <div className="border border-border p-6 space-y-4 bg-background">
                <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
                  Pricing & Vacancies
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                      Monthly Rent Share (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={rentShare}
                      onChange={(e) => setRentShare(e.target.value)}
                      placeholder="e.g. 6500"
                      className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                      Security Deposit Share (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={advanceShare}
                      onChange={(e) => setAdvanceShare(e.target.value)}
                      placeholder="e.g. 13000"
                      className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">
                      Vacancies slots
                    </label>
                    <div className="flex gap-4">
                      {[1, 2].map((slots) => (
                        <button
                          key={slots}
                          type="button"
                          onClick={() => setVacancyCount(slots)}
                          className={`w-16 h-12 border font-bold text-sm transition-all ${
                            vacancyCount === slots
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          {slots} Vacancy
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Compatibility preferences & submit */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Preferences selectors */}
              <div className="border border-border p-6 space-y-4 bg-background">
                <p className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
                  Matching preferences
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                      Gender Restriction
                    </label>
                    <div className="relative">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select
                        value={genderPref}
                        onChange={(e) => setGenderPref(e.target.value)}
                        className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background cursor-pointer"
                      >
                        {GENDER_OPTIONS.map((opt) => (
                          <option key={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                      Profession Restriction
                    </label>
                    <div className="relative">
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <select
                        value={professionPref}
                        onChange={(e) => setProfessionPref(e.target.value)}
                        className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background cursor-pointer"
                      >
                        {PROFESSION_OPTIONS.map((opt) => (
                          <option key={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifestyle Habits select */}
              <div className="border border-border p-6 bg-background">
                <p className="text-xs uppercase tracking-widest font-bold text-primary mb-3">
                  Lifestyle traits & rules
                </p>
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_HABITS_LIST.map((habit) => {
                    const isSelected = selectedHabits.includes(habit);
                    return (
                      <button
                        key={habit}
                        type="button"
                        onClick={() => handleHabitToggle(habit)}
                        className={`px-3 py-1.5 text-xs border font-medium transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {habit}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Premium Announcement */}
              <div className="bg-primary/5 border border-primary/20 p-5 flex gap-4">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm mb-1">Takevolet Launch Celebration Offer!</p>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    Your listing will be published for free with premium placement. Connect with roommates and build a strong startup environment!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex gap-2.5 bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="w-1/3 border border-border py-4 text-sm uppercase tracking-wider font-bold hover:bg-secondary/40 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className={`bg-foreground text-background py-4 text-sm uppercase tracking-wider font-bold hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 ${
                  step === 1 ? "w-full" : "w-2/3"
                }`}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-2/3 bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Publishing...
                  </>
                ) : (
                  <>Publish Flatmate Posting</>
                )}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
