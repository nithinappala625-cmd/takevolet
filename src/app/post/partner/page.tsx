"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft, Handshake, Building2, Loader2, Phone, Mail, MapPin } from "lucide-react";
import Link from "next/link";

export default function PartnerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", properties: "", type: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-6">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center p-16 border border-border max-w-lg w-full">
          <div className="w-20 h-20 border-2 border-primary flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={40} className="text-primary" />
          </div>
          <h2 className="text-3xl font-light mb-4">Application <span className="font-bold">Received!</span></h2>
          <p className="text-muted-foreground mb-10 font-light leading-relaxed">
            Our partner team will review your application and reach out within 24 hours to set up your account.
          </p>
          <Link href="/" className="bg-foreground text-background py-4 px-8 text-sm uppercase tracking-wider font-semibold hover:bg-primary hover:text-primary-foreground transition-all inline-block">
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-3xl">
        <div className="mb-12">
          <Link href="/list" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft size={16} /> Back
          </Link>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Partner Program</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-light mb-4">
            Become a <span className="font-bold">Takevolet Partner</span>
          </motion.h1>
          <p className="text-muted-foreground font-light">
            For PG owners, landlords, and property managers with multiple listings. Get priority placement, bulk tools, and a dedicated account manager.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Building2, title: "Bulk Posting", desc: "Post up to 50 listings at once with our bulk upload tool." },
            { icon: Handshake, title: "Dedicated Support", desc: "Your own account manager available 9 AM – 9 PM every day." },
            { icon: CheckCircle2, title: "Featured Badge", desc: "All your listings get a 'Verified Partner' badge for higher trust." },
          ].map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-6 border border-border bg-secondary/20">
              <b.icon size={20} className="text-primary mb-3" />
              <h3 className="font-bold text-sm mb-2">{b.title}</h3>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-3">Full Name</label>
              <input required type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your name"
                className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-3">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input required type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210"
                  className="w-full bg-transparent border border-border pl-10 pr-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                className="w-full bg-transparent border border-border pl-10 pr-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-3">City / Area</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input required type="text" name="city" value={form.city} onChange={handleChange} placeholder="e.g. Madhapur, Hyderabad"
                  className="w-full bg-transparent border border-border pl-10 pr-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light" />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest font-bold mb-3">Number of Properties</label>
              <select required name="properties" value={form.properties} onChange={handleChange}
                className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light appearance-none cursor-pointer">
                <option value="">Select range</option>
                <option>2–5 properties</option>
                <option>6–15 properties</option>
                <option>16–50 properties</option>
                <option>50+ properties</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest font-bold mb-3">Property Type</label>
            <select required name="type" value={form.type} onChange={handleChange}
              className="w-full bg-transparent border border-border px-5 py-4 outline-none focus:border-primary transition-colors text-sm font-light appearance-none cursor-pointer">
              <option value="">Select type</option>
              <option>PG / Hostel</option>
              <option>Independent Flats</option>
              <option>Apartment Complex</option>
              <option>Mixed (Flats + PG)</option>
              <option>Real Estate Agent</option>
            </select>
          </div>

          <button type="submit" disabled={submitting}
            className="w-full bg-foreground text-background py-5 text-sm uppercase tracking-widest font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : "Apply for Partner Program"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Our team will contact you within 24 hours.</p>
        </form>
      </div>
    </div>
  );
}
