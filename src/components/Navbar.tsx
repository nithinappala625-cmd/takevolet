"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Home, ShoppingBag, Handshake, User, LayoutDashboard, LogOut, Shield, Users } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useRouter, usePathname } from "next/navigation";
import { isProfileComplete } from "@/lib/db";

// ─── Smart Avatar: shows photo or gold initials fallback ──────────────────────
function Avatar({ src, name, size = 9 }: { src?: string; name: string; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Reset on src change (new login)
  useEffect(() => { setImgFailed(false); }, [src]);

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sizeClass = `w-${size} h-${size}`;

  if (!src || imgFailed) {
    return (
      <div className={`${sizeClass} rounded-full border-2 border-primary bg-primary flex items-center justify-center`}>
        <span className="text-primary-foreground font-bold text-xs leading-none">{initials}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full border-2 border-primary overflow-hidden`}>
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setImgFailed(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPostDropdownOpen, setIsPostDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, logout } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [profileDone, setProfileDone] = useState(false);

  useEffect(() => {
    if (user?.id) {
      isProfileComplete(user.id).then((complete) => {
        setProfileDone(complete);
      }).catch((err) => {
        console.error("Error checking profile in Navbar:", err);
      });
    } else {
      setProfileDone(false);
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Rooms", href: "/rooms" },
    { name: "Flatmates", href: "/flatmates" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Articles", href: "/articles" },
    { name: "Refer & Earn", href: "/refer" },
  ];

  const postOptions = [
    { icon: Home, name: "Post a Room", desc: "Leaving your flat? List it", href: "/post/room" },
    { icon: Users, name: "Find a Flatmate", desc: "Have a vacancy? Get roommate", href: "/post/flatmate" },
    { icon: ShoppingBag, name: "Sell / Rent Items", desc: "Furniture, electronics & more", href: "/post/item" },
    { icon: Handshake, name: "Become a Partner", desc: "PG / multiple properties", href: "/post/partner" },
  ];

  const handleLogout = async () => {
    await logout();
    setIsUserDropdownOpen(false);
    router.push("/");
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b ${
      isScrolled ? "bg-background/80 backdrop-blur-xl border-border" : "bg-transparent border-transparent"
    }`}>
      {/* ── TICKER ── */}
      <div className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest py-1.5 overflow-hidden whitespace-nowrap flex items-center">
        <div className="animate-ticker inline-block whitespace-nowrap">
          <span className="mx-12">🔥 OFFER FOR BACHELORS: Post 50 rooms & earn ₹500 directly from Takevolet! Grab the offer now! 🔥</span>
          <span className="mx-12">✨ HEY HOUSE OWNERS: Register your house today and get the "Bachelor Verified" badge instantly! ✨</span>
          <span className="mx-12">🤝 FLATMATES: Find your roommate or flatmate if single or two members looking for vacancy instantly! 🤝</span>
          <span className="mx-12">🔥 OFFER FOR BACHELORS: Post 50 rooms & earn ₹500 directly from Takevolet! Grab the offer now! 🔥</span>
          <span className="mx-12">✨ HEY HOUSE OWNERS: Register your house today and get the "Bachelor Verified" badge instantly! ✨</span>
          <span className="mx-12">🤝 FLATMATES: Find your roommate or flatmate if single or two members looking for vacancy instantly! 🤝</span>
        </div>
      </div>

      <div className={`container mx-auto px-6 md:px-12 flex justify-between items-center transition-all ${isScrolled ? "py-4" : "py-6"}`}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Inline SVG — transparent, adapts to any bg */}
          <img
            src="/logo.png"
            alt="Takevolet logo"
            className="w-10 h-10 group-hover:scale-110 transition-transform duration-300 rounded-sm"
          />
          <span className="text-xl font-bold tracking-widest uppercase text-foreground">
            TAKE<span className="text-primary">VOLET</span>
          </span>
        </Link>


        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || 
                             pathname.startsWith(link.href + "/") || 
                             (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link key={link.name} href={link.href}
                className={`inline-block py-1 text-sm uppercase tracking-widest transition-all duration-300 border-b-2 font-bold ${
                  isActive
                    ? "text-primary border-primary"
                    : "text-foreground/75 border-transparent hover:text-primary hover:border-primary/50"
                }`}>
                {link.name}
              </Link>
            );
          })}

          {/* List Space Dropdown */}
          <div className="relative"
            onMouseEnter={() => setIsPostDropdownOpen(true)}
            onMouseLeave={() => setIsPostDropdownOpen(false)}>
            <button className="flex items-center gap-1.5 text-sm uppercase tracking-widest font-medium text-foreground/70 hover:text-primary transition-colors">
              List Space <ChevronDown size={12} className={`transition-transform ${isPostDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {isPostDropdownOpen && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute top-full right-0 mt-3 w-64 bg-background border border-border shadow-2xl overflow-hidden z-50">
                  {postOptions.map((opt) => (
                    <Link key={opt.href} href={opt.href}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 group">
                      <div className="w-8 h-8 border border-border group-hover:border-primary flex items-center justify-center shrink-0 transition-all mt-0.5">
                        <opt.icon size={14} className="group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-bold group-hover:text-primary transition-colors">{opt.name}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </Link>
                  ))}
                  <Link href="/list" className="block px-5 py-3 text-center text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/5 transition-colors border-t border-border">
                    See All Options →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-[1px] bg-border" />

          {/* User Area */}
          {/* User / Auth Area */}
          {user ? (
            <div className="relative"
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={() => setIsUserDropdownOpen(false)}>
              <button className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                <Avatar src={user.avatar} name={user.name} size={9} />
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold leading-none">{user.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{user.location}</p>
                </div>
                <ChevronDown size={12} className={`text-muted-foreground transition-transform ${isUserDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full right-0 mt-3 w-52 bg-background border border-border shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-bold">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {profileDone && (
                      <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-sm font-medium">
                        <LayoutDashboard size={14} /> My Dashboard
                      </Link>
                    )}
                    <Link href="/post/room" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-sm font-medium">
                      <Home size={14} /> Post a Room
                    </Link>
                    {user.email === "nithinappala625@gmail.com" && (
                      <Link href="/admin" className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-sm font-medium border-t border-border">
                        <Shield size={14} className="text-primary" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-medium border-t border-border">
                      <LogOut size={14} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth"
                className="bg-primary text-primary-foreground px-6 py-2.5 text-sm uppercase tracking-wider font-semibold hover:bg-primary/90 transition-all border border-primary hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-background border-b border-border md:hidden overflow-hidden">
            <div className="p-6 flex flex-col space-y-5">
              {user && (
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <Avatar src={user.avatar} name={user.name} size={10} />
                  <div>
                    <p className="font-bold text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              )}
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)}
                    className={`text-base uppercase tracking-widest transition-colors ${
                      isActive ? "text-primary font-bold" : "text-foreground/75 font-medium hover:text-primary"
                    }`}>
                    {link.name}
                  </Link>
                );
              })}
              <hr className="border-border" />
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">List Your Space</p>
              {postOptions.map((opt) => (
                <Link key={opt.href} href={opt.href} onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 text-sm font-semibold hover:text-primary transition-colors">
                  <opt.icon size={15} /> {opt.name}
                </Link>
              ))}
              <hr className="border-border" />
              {user ? (
                <>
                  {profileDone && (
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-base uppercase tracking-widest font-medium hover:text-primary transition-colors flex items-center gap-2">
                      <LayoutDashboard size={15} /> My Dashboard
                    </Link>
                  )}
                  {user.email === "nithinappala625@gmail.com" && (
                    <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="text-base uppercase tracking-widest font-medium hover:text-primary transition-colors flex items-center gap-2">
                      <Shield size={15} className="text-primary" /> Admin Panel
                    </Link>
                  )}
                  <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="text-base uppercase tracking-widest font-medium text-red-500 flex items-center gap-2">
                    <LogOut size={15} /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth" onClick={() => setIsMobileMenuOpen(false)} className="text-base uppercase tracking-widest font-medium hover:text-primary transition-colors flex items-center gap-2">
                    <User size={15} /> Sign Up / Login
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
