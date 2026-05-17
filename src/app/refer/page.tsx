"use client";

import { motion } from "framer-motion";
import { Copy, Gift, ArrowRight, Wallet, Users, CheckCircle2, Share2, MessageCircle } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";
import Link from "next/link";

export default function ReferAndEarnPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  
  const referralCode = user ? `TAKEVOLET-${user.id.substring(0, 6).toUpperCase()}` : "LOGIN-TO-GET-CODE";
  const referralLink = `https://takevolet.online/auth?ref=${referralCode}`;

  const handleCopy = () => {
    if (!user) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!user) return;
    const text = `Hey! I'm using Takevolet to find zero brokerage bachelor rooms in Hyderabad. Use my invite link to sign up and we both earn ₹100 when you post a room! 🏠\n\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-background">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
            <Gift size={40} />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-light mb-4">
            Refer Friends, <span className="font-bold">Earn ₹100</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-muted-foreground font-light text-lg max-w-xl mx-auto">
            Invite bachelors leaving their flats to post on Takevolet. When they verify their first room, ₹100 goes straight to your Takevolet Wallet.
          </motion.p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-secondary/30 border border-border p-6 text-center">
            <div className="w-12 h-12 bg-background border border-border flex items-center justify-center mx-auto mb-4 rounded-full text-primary font-bold">1</div>
            <h3 className="font-bold mb-2">Share Link</h3>
            <p className="text-xs text-muted-foreground">Send your unique invite link to bachelors who are vacating their rooms.</p>
          </div>
          <div className="bg-secondary/30 border border-border p-6 text-center">
            <div className="w-12 h-12 bg-background border border-border flex items-center justify-center mx-auto mb-4 rounded-full text-primary font-bold">2</div>
            <h3 className="font-bold mb-2">They Post</h3>
            <p className="text-xs text-muted-foreground">They sign up and successfully list their available room on the platform.</p>
          </div>
          <div className="bg-secondary/30 border border-border p-6 text-center">
            <div className="w-12 h-12 bg-primary flex items-center justify-center mx-auto mb-4 rounded-full text-primary-foreground font-bold">3</div>
            <h3 className="font-bold mb-2">You Both Earn</h3>
            <p className="text-xs text-muted-foreground">₹100 is instantly credited to your wallet. Withdraw to UPI anytime.</p>
          </div>
        </div>

        {/* Referral Action */}
        <div className="bg-background border border-primary/20 p-8 md:p-12 shadow-[0_0_40px_-15px_rgba(197,160,89,0.3)]">
          {!user ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Login to get your invite link</h2>
              <p className="text-muted-foreground mb-6">Start building your referral income today.</p>
              <Link href="/auth" className="bg-foreground text-background px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-primary transition-colors inline-block">
                Login / Sign Up
              </Link>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-bold uppercase tracking-widest text-center mb-6">Your Unique Invite Link</h2>
              
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 bg-secondary border border-border px-4 py-3 font-mono text-sm flex items-center overflow-x-auto whitespace-nowrap">
                  {referralLink}
                </div>
                <button 
                  onClick={handleCopy}
                  className="bg-foreground text-background px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-primary transition-colors flex items-center justify-center gap-2 shrink-0">
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pt-8 border-t border-border">
                <button 
                  onClick={handleWhatsAppShare}
                  className="bg-[#25D366] text-white px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-[#1DA851] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                  <MessageCircle size={16} /> Share on WhatsApp
                </button>
                <Link href="/dashboard?tab=earnings" className="bg-secondary text-foreground border border-border px-6 py-3 font-bold text-xs uppercase tracking-widest hover:bg-border transition-colors flex items-center justify-center gap-2 w-full sm:w-auto">
                  <Wallet size={16} /> View Earnings
                </Link>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
