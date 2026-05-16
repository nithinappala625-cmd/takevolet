"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, MessageCircle, Clock, CheckCircle2, Loader2, Send, ArrowRight } from "lucide-react";

const contactInfo = [
  { icon: Mail, label: "Email Us", value: "hello@takevolet.online", sub: "We reply within 6 hours" },
  { icon: Phone, label: "Call / WhatsApp", value: "+91 79819 94870", sub: "Nithin Patel · Founder & CEO" },
  { icon: MapPin, label: "Based In", value: "Hyderabad, Telangana", sub: "India — 500081" },
  { icon: Clock, label: "Support Hours", value: "9 AM – 9 PM", sub: "Monday to Saturday" },
];

const topics = [
  "General Enquiry",
  "Report a Listing",
  "Payment Issue",
  "Partnership / Bulk Listing",
  "Press / Media",
  "Feedback / Suggestion",
  "Other",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", topic: "", message: "" });

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-6">
            <MessageCircle size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">We&apos;re here to help</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
            Get in <span className="font-bold gold-gradient">Touch</span>
          </h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Have a question about a listing, payment issue, or partnership opportunity? Fill in the form or reach us directly. We respond fast.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="border border-border p-5 flex items-start gap-4 hover:border-primary/30 transition-all group">
                <div className="w-10 h-10 border border-border group-hover:border-primary flex items-center justify-center shrink-0 transition-all">
                  <c.icon size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-0.5">{c.label}</p>
                  <p className="font-bold text-sm">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.sub}</p>
                </div>
              </motion.div>
            ))}

            {/* WhatsApp Quick Contact */}
            <motion.a initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            href="https://wa.me/917981994870?text=Hi%20Nithin%2C%20I%20need%20help%20with%20Takevolet..." target="_blank"
              className="flex items-center justify-between border-2 border-green-500 p-5 hover:bg-green-500 hover:text-white transition-all group">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-green-500 group-hover:text-white transition-colors" />
                <div>
                  <p className="font-bold text-sm">Chat on WhatsApp</p>
                  <p className="text-xs text-muted-foreground group-hover:text-white/80 transition-colors">Fastest response</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-green-500 group-hover:text-white transition-colors" />
            </motion.a>
          </div>

          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
            {submitted ? (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="border border-border p-16 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-2 border-primary flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} className="text-primary" />
                </div>
                <h3 className="text-2xl font-light mb-3">Message <span className="font-bold">Sent!</span></h3>
                <p className="text-muted-foreground font-light text-sm mb-2">
                  Thanks, <strong>{form.name.split(" ")[0]}</strong>! We&apos;ve received your message.
                </p>
                <p className="text-xs text-muted-foreground">We&apos;ll reply to <strong>{form.email}</strong> within 6 hours.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", phone: "", topic: "", message: "" }); }}
                  className="mt-8 border border-border px-6 py-3 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all">
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-border p-8 space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-2">Send Us a Message</h3>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Your Name *</label>
                    <input required type="text" name="name" value={form.name} onChange={update} placeholder="e.g. Rahul Verma"
                      className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm font-light" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Phone (Optional)</label>
                    <input type="tel" name="phone" value={form.phone} onChange={update} placeholder="+91 98765 43210"
                      className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm font-light" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Email Address *</label>
                  <input required type="email" name="email" value={form.email} onChange={update} placeholder="you@example.com"
                    className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm font-light" />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Topic *</label>
                  <select required name="topic" value={form.topic} onChange={update}
                    className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm font-light appearance-none cursor-pointer">
                    <option value="">Select a topic</option>
                    {topics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Your Message *</label>
                  <textarea required name="message" value={form.message} onChange={update} rows={5}
                    placeholder="Describe your question or issue in detail. The more info you give, the faster we can help."
                    className="w-full bg-transparent border border-border px-4 py-3.5 outline-none focus:border-primary transition-colors text-sm font-light resize-none" />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full bg-foreground text-background py-4 text-sm uppercase tracking-widest font-bold hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting ? (
                    <><Loader2 size={15} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Send size={15} /> Send Message</>
                  )}
                </button>
                <p className="text-center text-[10px] text-muted-foreground">We typically respond within 6 hours · Mon–Sat</p>
              </form>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
