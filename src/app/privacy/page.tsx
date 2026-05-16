"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Lock, Eye, Database, Bell, Mail, ArrowRight } from "lucide-react";

const sections = [
  {
    icon: Database,
    title: "1. Information We Collect",
    content: [
      { heading: "Account Information", text: "When you register on Takevolet, we collect your name, email address, mobile number, WhatsApp number, location (area and colony), profession, and profile photo. This is required to verify your identity and display your listings." },
      { heading: "Listing Information", text: "When you post a room or item, we collect the listing details you provide: rent, location (colony/area — no house numbers), amenities, photos, and videos. This information is displayed publicly to help seekers find rooms." },
      { heading: "Payment Information", text: "When you purchase a contact unlock pack (₹1,500), we collect transaction details. We do NOT store credit/debit card numbers. Payments are processed via secure third-party gateways (Razorpay / UPI)." },
      { heading: "Usage Data", text: "We collect data on how you interact with our platform — pages visited, searches performed, and listings viewed. This helps us improve the product experience." },
    ],
  },
  {
    icon: Eye,
    title: "2. How We Use Your Information",
    content: [
      { heading: "To Provide the Service", text: "Your profile information is used to display your listings, connect you with room seekers or posters, and process your earnings and payouts." },
      { heading: "Contact Unlock", text: "When a seeker pays ₹1,500 for a contact pack, your phone number and WhatsApp are shared with them. By posting a listing, you consent to this disclosure to verified, paying users." },
      { heading: "Earnings & Commissions", text: "We use your payment details to process commission payouts for successful room handovers and your share of contact unlock revenue." },
      { heading: "Platform Improvement", text: "Usage data helps us identify popular areas, improve search filters, and build features that matter to our community." },
    ],
  },
  {
    icon: Lock,
    title: "3. Data Protection & Security",
    content: [
      { heading: "House Numbers Hidden", text: "We explicitly do NOT allow house/door numbers in listings. Only colony and area names are shown publicly. Your exact address is never displayed." },
      { heading: "Encryption", text: "All data is transmitted over HTTPS with SSL encryption. Passwords are hashed using bcrypt and are never stored in plain text." },
      { heading: "Access Control", text: "Your contact details (phone, WhatsApp) are only revealed to users who have purchased a verified contact unlock pack. They are never publicly visible." },
      { heading: "Data Retention", text: "Your account data is retained as long as your account is active. You may request deletion of your data at any time by emailing privacy@Takevolet.in." },
    ],
  },
  {
    icon: Bell,
    title: "4. Cookies & Tracking",
    content: [
      { heading: "Essential Cookies", text: "We use cookies to maintain your login session and remember your preferences. These are necessary for the platform to function." },
      { heading: "Analytics", text: "We use privacy-first analytics to understand platform usage. We do not use invasive third-party tracking tools or sell your data to advertisers." },
      { heading: "Opt Out", text: "You can disable cookies in your browser settings. Note that disabling essential cookies may affect your ability to stay logged in." },
    ],
  },
  {
    icon: Shield,
    title: "5. Your Rights",
    content: [
      { heading: "Access", text: "You can view all the data we hold about you in your Dashboard profile section at any time." },
      { heading: "Correction", text: "You can update your profile information (name, phone, location, profession) at any time from your Dashboard." },
      { heading: "Deletion", text: "You can delete your account and all associated data by emailing privacy@Takevolet.in. We will process your request within 7 business days." },
      { heading: "Portability", text: "You may request an export of your data in JSON format by contacting our support team." },
    ],
  },
  {
    icon: Mail,
    title: "6. Contact & Updates",
    content: [
      { heading: "Privacy Contact", text: "For any privacy-related questions or requests, email us at privacy@Takevolet.in or use the contact form on our website." },
      { heading: "Policy Updates", text: "We may update this Privacy Policy as the platform evolves. Significant changes will be notified to you via email. The 'Last Updated' date at the top of this page will always reflect the most recent version." },
      { heading: "Governing Law", text: "This Privacy Policy is governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Hyderabad, Telangana." },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-6">
            <Shield size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Legal</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
            Privacy <span className="font-bold">Policy</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Last Updated: May 16, 2026</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Effective From: January 1, 2026</span>
          </div>
          <p className="text-muted-foreground font-light leading-relaxed max-w-2xl mt-6">
            At Takevolet, your privacy is fundamental. This policy explains what data we collect, why we collect it, and how we protect it. We built this platform around trust — and that starts with being transparent about data.
          </p>
        </motion.div>

        {/* Quick summary box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-primary/5 border border-primary/20 p-6 mb-14">
          <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Quick Summary</p>
          <ul className="space-y-2">
            {[
              "We never show your exact house/door number publicly — only colony and area.",
              "Your phone number is shared ONLY with users who pay ₹1,500 for a verified contact pack.",
              "We do NOT sell your data to advertisers or third parties.",
              "You can delete your account and all data at any time.",
              "All payments are processed securely — we never store card details.",
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {point}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((section, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 * i }}
              className="border-t border-border pt-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 border border-border flex items-center justify-center shrink-0">
                  <section.icon size={18} className="text-primary" strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <div className="space-y-6 pl-0 md:pl-13">
                {section.content.map((item, j) => (
                  <div key={j}>
                    <h3 className="font-bold text-sm mb-1.5">{item.heading}</h3>
                    <p className="text-sm text-muted-foreground font-light leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-16 border border-border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold mb-1">Questions about this policy?</p>
            <p className="text-sm text-muted-foreground">Email us at <a href="mailto:privacy@Takevolet.in" className="text-primary font-semibold hover:underline">privacy@Takevolet.in</a></p>
          </div>
          <Link href="/contact" className="border border-border px-6 py-3 text-sm uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-2 whitespace-nowrap">
            Contact Support <ArrowRight size={14} />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
