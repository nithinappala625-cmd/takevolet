"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { insertBuildListing, uploadRoomMedia, getProfile, isProfileComplete } from "@/lib/db";
import { compressImage } from "@/lib/imageCompression";
import { CITIES, getAreas } from "@/data/locations";
import {
  HardHat, Upload, X, CheckCircle2, AlertCircle,
  Loader2, Plus, Image as ImageIcon,
  ChevronDown, IndianRupee
} from "lucide-react";
import Link from "next/link";

const MAIN_CATEGORIES = ["service", "material", "transport"];

export default function PostBuildPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const photoRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  // Location
  const [city, setCity]           = useState("Hyderabad");
  const [location, setLocation]   = useState("");

  // Build details
  const [mainCategory, setMainCategory] = useState("service");
  const [subCategory, setSubCategory]   = useState("");
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [price, setPrice]               = useState("");
  const [priceUnit, setPriceUnit]       = useState("per project");
  const [contactNumber, setContactNumber] = useState("");

  // Media
  const [photoFiles, setPhotoFiles]   = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [profileChecking, setProfileChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("post_login_redirect", "/post/build");
        }
        router.replace("/auth");
      } else {
        isProfileComplete(user.id).then(async (complete) => {
          if (!complete) {
            router.replace("/profile/complete?redirect=/post/build");
          } else {
            const profile = await getProfile(user.id);
            if (profile?.phone) {
              setContactNumber(profile.phone);
            }
            setProfileChecking(false);
          }
        });
      }
    }
  }, [user, loading, router]);

  const handlePhotos = async (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 4 - photoFiles.length);
    for (const f of newFiles) {
      try {
        const compressed = await compressImage(f);
        const url = URL.createObjectURL(compressed);
        setPhotoPreviews(prev => [...prev, url]);
        setPhotoFiles(prev => [...prev, compressed]);
      } catch (e) {
        console.error("Compression failed", e);
      }
    }
  };

  const removePhoto = (i: number) => {
    setPhotoFiles(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setError(null);

    if (!title.trim())    return setError("Title is required.");
    if (!subCategory.trim()) return setError("Sub category (e.g. Architect, Bricks) is required.");
    if (!price || +price <= 0) return setError("Please enter a valid price.");
    if (!location)        return setError("Please select your service area.");
    if (!contactNumber)   return setError("Contact number is required.");
    if (photoFiles.length === 0) return setError("At least 1 photo is required.");
    if (!user)            return;

    setSubmitting(true);

    // Upload photos
    const imageUrls: string[] = [];
    for (let i = 0; i < photoFiles.length; i++) {
      setUploadProgress(`Uploading photo ${i + 1} of ${photoFiles.length}…`);
      const { url, error: upErr } = await uploadRoomMedia(user.id, photoFiles[i], "image");
      if (upErr) { setError("Photo upload failed. Check storage bucket setup."); setSubmitting(false); return; }
      if (url) imageUrls.push(url);
    }

    setUploadProgress("Saving listing…");

    const { data: newBuild, error: insertErr } = await insertBuildListing({
      user_id: user.id,
      main_category: mainCategory,
      sub_category: subCategory.trim(),
      title: title.trim(),
      description: description.trim(),
      price: +price,
      price_unit: priceUnit.trim(),
      location_name: location,
      contact_number: contactNumber.trim(),
      media_urls: imageUrls,
      metadata: {}
    });

    setSubmitting(false);
    setUploadProgress("");

    if (insertErr) {
      setError("Failed to save service. Please try again. (" + insertErr.message + ")");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push(`/build`), 2000);
  };

  if (loading || profileChecking) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-primary" />
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center p-12 max-w-md">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 size={32} className="text-blue-500" />
        </div>
        <h2 className="text-2xl font-black mb-2">Service Listed! 🎉</h2>
        <p className="text-muted-foreground text-sm">Your build service is now live on Takevolet. Redirecting…</p>
      </motion.div>
    </div>
  );

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-3xl">

        {/* Header */}
        <div className="mb-10">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3">List Your Service or Material</p>
          <h1 className="text-3xl font-black mb-2">List Build Service</h1>
          <p className="text-muted-foreground text-sm">Provide details about your construction service, architectural firm, or building materials.</p>
        </div>

        <div className="space-y-8">

          {/* ── ERROR DISPLAY ────────────────────────────────────── */}
          {error && (
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 flex gap-3 text-red-500 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* ── CATEGORY ─────────────────────────────────────── */}
          <div className="border border-border p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <HardHat size={12} className="text-primary" /> Category & Title
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Main Category <span className="text-red-500">*</span></label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select value={mainCategory} onChange={e => setMainCategory(e.target.value)}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background capitalize">
                    {MAIN_CATEGORIES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Sub Category <span className="text-red-500">*</span></label>
                <input type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)}
                  placeholder="e.g. Architect, Bricks, Excavator..."
                  className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">
                Listing Title <span className="text-red-500">*</span>
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Premium Interior Designing Services"
                className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none" />
            </div>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Describe your services, years of experience, or material quality..."
                className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none" />
            </div>
          </div>

          {/* ── PRICING ─────────────────────────────────────── */}
          <div className="border border-border p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              <IndianRupee size={12} className="text-primary" /> Pricing
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Price (₹) <span className="text-red-500">*</span></label>
                <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Price Unit <span className="text-red-500">*</span></label>
                <input type="text" value={priceUnit} onChange={e => setPriceUnit(e.target.value)}
                  placeholder="e.g. per sqft, per hour, per truck..."
                  className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none" />
              </div>
            </div>
          </div>

          {/* ── LOCATION & CONTACT ─────────────────────────────────────── */}
          <div className="border border-border p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
              📍 Location & Contact
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">City <span className="text-red-500">*</span></label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select value={city} onChange={e => { setCity(e.target.value); setLocation(""); }}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background">
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Service Area <span className="text-red-500">*</span></label>
                <div className="relative">
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <select value={location} onChange={e => { setLocation(e.target.value); }}
                    className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none appearance-none bg-background">
                    <option value="">Select area</option>
                    {getAreas(city).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Contact Number <span className="text-red-500">*</span></label>
              <input type="text" value={contactNumber} onChange={e => setContactNumber(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>

          {/* ── PHOTOS ─────────────────────────────────────────── */}
          <div className="border border-border p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
              <ImageIcon size={12} className="text-primary" /> Service Photos (up to 4)
            </h3>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {photoPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover border border-border" />
                  <button type="button" onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-full">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {photoFiles.length < 4 && (
                <div onClick={() => photoRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Plus size={20} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                </div>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => e.target.files && handlePhotos(e.target.files)} />
          </div>

          {/* ── SUBMIT ─────────────────────────────────────────── */}
          <div className="pt-4 flex flex-col items-center">
            {submitting ? (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 size={24} className="animate-spin text-primary" />
                <p className="text-sm font-medium animate-pulse">{uploadProgress}</p>
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                className="w-full md:w-auto px-12 py-4 bg-foreground text-background font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
              >
                List Service
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
