"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { RefreshCw, AlertCircle, CheckCircle2, Clock, ArrowRight, Phone, Mail } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-6">
            <RefreshCw size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Legal</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
            Refund & Cancellation <span className="font-bold">Policy</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Last Updated: May 16, 2026</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Effective From: January 1, 2026</span>
          </div>
          <p className="text-muted-foreground font-light leading-relaxed max-w-2xl mt-6">
            At Takevolet, we aim to be fully transparent about our refund and cancellation policy. Please read this carefully before making any purchase on our platform.
          </p>
        </motion.div>

        {/* Quick Summary */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid md:grid-cols-3 gap-4 mb-14">
          <div className="border border-green-200 bg-green-50 p-5">
            <CheckCircle2 size={20} className="text-green-600 mb-3" />
            <p className="font-bold text-sm text-green-800 mb-1">Eligible for Refund</p>
            <p className="text-xs text-green-700">Pack purchased but zero contacts unlocked, within 24 hours of purchase</p>
          </div>
          <div className="border border-yellow-200 bg-yellow-50 p-5">
            <Clock size={20} className="text-yellow-600 mb-3" />
            <p className="font-bold text-sm text-yellow-800 mb-1">Partial Refund</p>
            <p className="text-xs text-yellow-700">Technical error prevented contact from being shown after payment deducted</p>
          </div>
          <div className="border border-red-200 bg-red-50 p-5">
            <AlertCircle size={20} className="text-red-600 mb-3" />
            <p className="font-bold text-sm text-red-800 mb-1">Non-Refundable</p>
            <p className="text-xs text-red-700">Contact already unlocked and shown to user — digital service delivered</p>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">

          {/* Section 1 */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-5">1. Contact Unlock Pack — Refund Policy</h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-5">
              The Contact Unlock Pack (₹1,500 for 5 contacts, valid 30 days) is a digital service. Once a contact is revealed to you, the service is considered delivered and is non-refundable for that specific contact.
            </p>
            <div className="space-y-4">
              <div className="border border-border p-5">
                <p className="font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500" /> Full Refund Eligible</p>
                <ul className="text-sm text-muted-foreground font-light space-y-1.5">
                  <li>• You purchased the pack but have NOT unlocked any contacts yet</li>
                  <li>• Refund request made within <strong>24 hours</strong> of purchase</li>
                  <li>• Payment was deducted but the pack was not credited to your account (technical failure)</li>
                </ul>
              </div>
              <div className="border border-border p-5">
                <p className="font-bold text-sm mb-2 flex items-center gap-2"><CheckCircle2 size={14} className="text-yellow-500" /> Partial Refund Eligible</p>
                <ul className="text-sm text-muted-foreground font-light space-y-1.5">
                  <li>• A technical error on Takevolet's platform prevented a contact from loading after payment was made</li>
                  <li>• Duplicate charge was made for the same pack</li>
                  <li>• Reported within <strong>48 hours</strong> with proof (screenshot)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">Refund amount = ₹300 per affected contact (₹1,500 ÷ 5 contacts)</p>
              </div>
              <div className="border border-border p-5">
                <p className="font-bold text-sm mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-red-500" /> Non-Refundable</p>
                <ul className="text-sm text-muted-foreground font-light space-y-1.5">
                  <li>• Contact has already been successfully unlocked and displayed to you</li>
                  <li>• You chose not to proceed with the room after seeing the contact — the service was delivered</li>
                  <li>• Pack has expired (30-day validity period has passed)</li>
                  <li>• Refund request made more than 24 hours after purchase</li>
                  <li>• Account suspended due to violation of Terms of Service</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Section 2 */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-5">2. Cancellation Policy</h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed mb-4">
              Takevolet provides digital services only. There are no physical goods involved.
            </p>
            <div className="space-y-4 text-sm text-muted-foreground font-light">
              <div className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-foreground mb-1">Contact Pack Cancellation</p>
                <p>You may cancel your contact pack purchase and request a full refund within <strong>24 hours</strong> of payment, provided no contacts have been unlocked. After 24 hours or after any contact is unlocked, cancellation is not possible.</p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-foreground mb-1">Room Listing Cancellation</p>
                <p>Posting a room listing is free. You may remove your listing at any time from your Dashboard → My Listings → Remove. There is no charge for listing or removing listings.</p>
              </div>
              <div className="border-l-2 border-primary pl-4">
                <p className="font-semibold text-foreground mb-1">Account Cancellation</p>
                <p>You may delete your account at any time by emailing support@Takevolet.in. Any unused contact unlocks in your pack at the time of account deletion are non-refundable.</p>
              </div>
            </div>
          </motion.div>

          {/* Section 3 */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-5">3. How to Request a Refund</h2>
            <div className="space-y-3">
              {[
                { step: "01", title: "Email Us", desc: "Send an email to refunds@Takevolet.in with subject line: \"Refund Request — [Your Name] — [Order ID]\"" },
                { step: "02", title: "Provide Details", desc: "Include your registered email, Razorpay Order ID / Payment ID, date of purchase, reason for refund, and screenshot if applicable" },
                { step: "03", title: "Review (48 hrs)", desc: "Our team will review your request within 48 business hours and respond with a decision" },
                { step: "04", title: "Refund Processed", desc: "Approved refunds are processed back to the original payment method within 5–7 business days via Razorpay" },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-5 border border-border">
                  <span className="text-3xl font-black text-primary/20 shrink-0 leading-none">{item.step}</span>
                  <div>
                    <p className="font-bold text-sm mb-1">{item.title}</p>
                    <p className="text-sm text-muted-foreground font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 4 */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-5">4. Refund Timeline</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-secondary">
                    <th className="text-left p-3 text-[11px] uppercase tracking-wider font-bold">Refund Type</th>
                    <th className="text-left p-3 text-[11px] uppercase tracking-wider font-bold">Processing Time</th>
                    <th className="text-left p-3 text-[11px] uppercase tracking-wider font-bold">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Full Refund (pack unused, &lt;24h)", "5–7 business days", "Original payment method"],
                    ["Partial Refund (technical error)", "5–7 business days", "Original payment method"],
                    ["UPI Refunds", "2–3 business days", "UPI ID used for payment"],
                    ["Credit/Debit Card", "5–7 business days", "Same card used"],
                    ["Net Banking", "3–5 business days", "Same bank account"],
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-light" dangerouslySetInnerHTML={{ __html: row[0] }} />
                      <td className="p-3 font-semibold">{row[1]}</td>
                      <td className="p-3 text-muted-foreground">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Section 5 */}
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="border-t border-border pt-8">
            <h2 className="text-xl font-bold mb-4">5. Disputes & Chargebacks</h2>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              We strongly encourage you to contact us directly at <a href="mailto:refunds@Takevolet.in" className="text-primary font-semibold hover:underline">refunds@Takevolet.in</a> before initiating a chargeback with your bank. Chargebacks initiated without prior contact will be disputed and may result in account suspension.
            </p>
            <p className="text-sm text-muted-foreground font-light leading-relaxed mt-3">
              We are committed to resolving all genuine disputes within 48 hours.
            </p>
          </motion.div>

        </div>

        {/* Contact for Refunds */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-14 bg-foreground text-background p-8">
          <p className="font-bold text-base mb-4">Need a Refund? Contact Us Directly:</p>
          <div className="grid md:grid-cols-3 gap-4">
            <a href="mailto:refunds@Takevolet.in" className="flex items-center gap-3 border border-background/20 p-4 hover:border-primary transition-colors">
              <Mail size={18} className="text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-background/50 mb-0.5">Email</p>
                <p className="text-sm font-semibold">refunds@Takevolet.in</p>
              </div>
            </a>
            <a href="tel:+917981994870" className="flex items-center gap-3 border border-background/20 p-4 hover:border-primary transition-colors">
              <Phone size={18} className="text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-background/50 mb-0.5">Call / WhatsApp</p>
                <p className="text-sm font-semibold">+91 79819 94870</p>
              </div>
            </a>
            <Link href="/contact" className="flex items-center gap-3 border border-background/20 p-4 hover:border-primary transition-colors">
              <ArrowRight size={18} className="text-primary" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-background/50 mb-0.5">Contact Form</p>
                <p className="text-sm font-semibold">Takevolet.in/contact</p>
              </div>
            </Link>
          </div>
          <p className="text-xs text-background/40 mt-5">Response within 48 hours · Mon–Sat, 9 AM – 9 PM IST</p>
        </motion.div>

      </div>
    </div>
  );
}
