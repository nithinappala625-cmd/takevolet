"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { HYDERABAD_AREAS, CATEGORIES, ITEM_CONDITIONS } from "@/data/locations";
import { IndianRupee, MapPin, Camera, CheckCircle2, ArrowLeft, X, Upload, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { isProfileComplete } from "@/lib/db";

export default function PostItemPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const [profileChecking, setProfileChecking] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (typeof window !== "undefined") {
          localStorage.setItem("post_login_redirect", "/post/item");
        }
        router.replace("/auth");
      } else {
        isProfileComplete(user.id).then((complete) => {
          if (!complete) {
            router.replace("/profile/complete?redirect=/post/item");
          } else {
            setProfileChecking(false);
          }
        });
      }
    }
  }, [user, loading, router]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [listingType, setListingType] = useState<"sell" | "rent" | "both">("sell");

  const [form, setForm] = useState({
    title: "",
    category: "Furniture",
    condition: "Good",
    price: "",
    rentPrice: "",
    location: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files).slice(0, 8 - uploadedFiles.length);
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedFiles(prev => [...prev, { file, preview: e.target?.result as string }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => setUploadedFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading || profileChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-36 px-6">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center p-16 border border-border max-w-lg w-full">
          <div className="w-20 h-20 border-2 border-primary flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-light mb-4">Item <span className="font-bold">Listed!</span></h2>
          <p className="text-muted-foreground mb-10 font-light leading-relaxed">
            Your item is now live on the marketplace. Bachelors in your area can see and contact you.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/marketplace" className="bg-foreground text-background py-4 text-sm uppercase tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground transition-all block text-center">
              View Marketplace
            </Link>
            <button onClick={() => setSubmitted(false)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              List Another Item
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-3xl">
        <div className="mb-12">
          <Link href="/list" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} /> Back
          </Link>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Sell or Rent Items</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-light">
            List your <span className="font-bold">items</span>
          </motion.h1>
        </div>

        {/* Listing Type */}
        <div className="flex mb-8 border border-border">
          {(["sell", "rent", "both"] as const).map(t => (
            <button key={t} onClick={() => setListingType(t)}
              className={`flex-1 py-4 text-sm uppercase tracking-wider font-semibold transition-all border-r last:border-r-0 border-border ${listingType === t ? "bg-foreground text-background" : "hover:bg-secondary/50"}`}>
              {t === "both" ? "Sell & Rent" : t === "sell" ? "Sell Only" : "Rent Only"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3">Item Title</label>
            <input required type="text" name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Samsung 32&quot; Smart TV"
              className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-3">Category</label>
              <select required name="category" value={form.category} onChange={handleChange}
                className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light appearance-none cursor-pointer">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-3">Condition</label>
              <select required name="condition" value={form.condition} onChange={handleChange}
                className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light appearance-none cursor-pointer">
                {ITEM_CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(listingType === "sell" || listingType === "both") && (
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-3">Selling Price (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input required type="number" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 5000"
                    className="w-full bg-transparent border border-border pl-10 pr-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
                </div>
              </div>
            )}
            {(listingType === "rent" || listingType === "both") && (
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold mb-3">Rent / Month (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input required type="number" name="rentPrice" value={form.rentPrice} onChange={handleChange} placeholder="e.g. 500"
                    className="w-full bg-transparent border border-border pl-10 pr-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3">Location</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select required name="location" value={form.location} onChange={handleChange}
                className="w-full bg-transparent border border-border pl-10 pr-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light appearance-none cursor-pointer">
                <option value="">Select area</option>
                {HYDERABAD_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3">Description</label>
            <textarea required name="description" value={form.description} onChange={handleChange} rows={4}
              placeholder="Describe the item — brand, model, age, condition details, any damage..."
              className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light resize-none" />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3">Photos (Up to 8)</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border p-10 text-center hover:border-primary/50 transition-colors cursor-pointer group mb-4">
              <Upload size={28} className="mx-auto text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
              <p className="font-medium text-sm mb-1">Click to upload photos</p>
              <p className="text-xs text-muted-foreground">JPG, PNG • Max 10MB each • Up to 8 photos</p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
              onChange={e => e.target.files && handleFiles(e.target.files)} />

            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {uploadedFiles.map((f, i) => (
                  <div key={i} className="relative aspect-square border border-border overflow-hidden group">
                    <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-foreground text-background py-5 text-sm uppercase tracking-widest font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Publishing...</> : "Publish Item Listing"}
          </button>
        </form>
      </div>
    </div>
  );
}
