"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FileText, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing or using Takevolet (accessible at Takevolet.in), you confirm that you are at least 18 years of age, have read and understood these Terms of Service, and agree to be bound by them. If you do not agree, please do not use the platform.

These Terms govern your use of all services offered by Takevolet Technologies, including room listing, contact unlock, item marketplace, and partner programs.`,
  },
  {
    title: "2. Description of Services",
    content: `Takevolet is an online marketplace that connects:
• Bachelors leaving rented accommodation ("Posters") with bachelors seeking accommodation ("Seekers")
• Sellers/renters of household items with buyers in the same locality
• Property owners/PG managers with the partner program

Takevolet is NOT a real estate broker or agent. We are a technology platform that facilitates direct peer-to-peer connections. All transactions, negotiations, and agreements are between the Poster and Seeker directly.`,
  },
  {
    title: "3. Contact Unlock Service & Pricing",
    content: `Takevolet operates a "pay-per-contact" model to maintain quality listings and prevent spam.

PRICING:
• Contact Unlock Pack: ₹1,500 (One-Time)
• Pack includes: 5 contact unlocks
• Validity: 30 days from date of purchase
• Per contact cost: ₹300

WHAT YOU GET:
• Full name of the room poster
• Direct mobile number (call or SMS)
• WhatsApp number for direct messaging
• Profession and location verified

All payments are processed securely via Razorpay. Prices are inclusive of applicable taxes.`,
  },
  {
    title: "4. User Accounts & Registration",
    content: `To post a room or purchase contact packs, you must create an account with accurate information including your full name, email address, mobile number, location, and profession.

You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information. Takevolet reserves the right to suspend or terminate accounts found to have false information.

By registering, you consent to receiving platform notifications via email and SMS/WhatsApp.`,
  },
  {
    title: "5. Poster Responsibilities",
    content: `As a room poster, you agree to:
• Provide accurate and truthful information about the room
• Not include house/door numbers in listings (colony/area only, for your own privacy)
• Upload real photos of the actual room
• Respond promptly to genuine enquiries from paying seekers
• Not list rooms you do not have the right to sublet or hand over
• Notify Takevolet if the room has been filled or taken down

Posters earn commission (₹500–₹1,000 per successful handover) as set while posting. Commission is credited within 48 hours of confirmed handover.`,
  },
  {
    title: "6. Prohibited Activities",
    content: `The following are strictly prohibited on Takevolet:
• Posting fake, misleading, or fraudulent room listings
• Sharing contact details of others without their consent
• Using the platform for any illegal subletting or rental activity
• Circumventing the contact unlock system (e.g., embedding phone numbers in listing descriptions)
• Creating multiple accounts to misuse free credits
• Spamming or harassing other users
• Scraping or copying listing data for other platforms

Violation of these terms may result in immediate account suspension and legal action.`,
  },
  {
    title: "7. Intellectual Property",
    content: `All content on Takevolet — including the platform design, logo, text, graphics, software, and data — is the property of Takevolet Technologies and is protected under Indian copyright and intellectual property laws.

Users retain ownership of the photos and content they upload, but grant Takevolet a non-exclusive, royalty-free license to display that content on the platform.`,
  },
  {
    title: "8. Limitation of Liability",
    content: `Takevolet is a marketplace platform. We do not verify, endorse, or guarantee:
• The accuracy of listing information provided by posters
• The condition, legality, or availability of any room
• The behavior or intentions of any user
• The outcome of any room handover transaction

Takevolet's maximum liability in any dispute shall not exceed the amount paid by you for the contact unlock pack (₹1,500). We are not responsible for any losses arising from transactions between users.`,
  },
  {
    title: "9. Governing Law & Dispute Resolution",
    content: `These Terms are governed by the laws of India. Any disputes arising from the use of Takevolet shall be subject to the exclusive jurisdiction of the courts of Hyderabad, Telangana, India.

For any disputes or grievances, please first contact our support team at legal@takevolet.online. We aim to resolve all issues within 7 business days.`,
  },
  {
    title: "10. Changes to Terms",
    content: `Takevolet reserves the right to modify these Terms at any time. Significant changes will be communicated via email to registered users. Continued use of the platform after such changes constitutes acceptance of the new Terms.

Last Updated: May 16, 2026 | Effective From: January 1, 2026`,
  },
];

export default function TermsPage() {
  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 rounded-full mb-6">
            <FileText size={12} className="text-primary" />
            <span className="text-xs uppercase tracking-[0.2em] font-medium text-muted-foreground">Legal</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light mb-6 leading-tight">
            Terms of <span className="font-bold">Service</span>
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Last Updated: May 16, 2026</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> Effective From: January 1, 2026</span>
          </div>
          <p className="text-muted-foreground font-light leading-relaxed max-w-2xl mt-6">
            These Terms govern your access to and use of Takevolet. By using our platform, you agree to these terms. Please read them carefully.
          </p>
        </motion.div>

        {/* Key Points box */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-primary/5 border border-primary/20 p-6 mb-14">
          <p className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">Key Points</p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "Takevolet is a platform, not a broker — zero brokerage charged",
              "Contact unlock pack: ₹1,500 for 5 contacts, valid 30 days",
              "Posters earn ₹500–₹1,000 commission per successful handover",
              "All payments are secured via Razorpay",
              "No house numbers in listings — colony/area only for privacy",
              "Disputes governed by Hyderabad courts under Indian law",
            ].map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                {point}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="border-t border-border pt-8">
              <h2 className="text-lg font-bold mb-4">{section.title}</h2>
              <div className="text-sm text-muted-foreground font-light leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-16 border border-border p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-bold mb-1">Questions about these Terms?</p>
            <p className="text-sm text-muted-foreground">Email <a href="mailto:legal@takevolet.online" className="text-primary font-semibold hover:underline">legal@takevolet.online</a></p>
          </div>
          <Link href="/contact" className="border border-border px-6 py-3 text-sm uppercase tracking-wider font-semibold hover:border-primary hover:text-primary transition-all flex items-center gap-2 whitespace-nowrap">
            Contact Support <ArrowRight size={14} />
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
