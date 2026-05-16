"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle2,
  AlertCircle, Loader2, Phone
} from "lucide-react";
import {
  signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword
} from "@/lib/supabase";

type AuthMode = "signin" | "signup" | "forgot";

// ─── Inner form (uses useSearchParams — must be inside Suspense) ──────────────
function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("tab") as AuthMode) || "signin"
  );
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [success, setSuccess]   = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);

  // Form fields
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]     = useState("");

  // Read error from URL (e.g. callback failure)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "callback_failed") setError("Authentication failed. Please try again.");
  }, [searchParams]);

  const reset = () => { setError(null); setSuccess(null); };

  // ── Google Sign-In ─────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    reset();
    setGLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGLoading(false);
    }
    // On success: page redirects to /auth/callback automatically
  };

  // ── Email Sign Up ──────────────────────────────────────────────────────────
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!name.trim()) { setError("Please enter your full name."); return; }
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { data, error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) { setError(error.message); return; }
    // If email confirmation is required
    if (data.user && !data.session) {
      setSuccess(`✅ Verification email sent to ${email}. Please check your inbox and confirm your account.`);
    } else if (data.session) {
      router.replace("/dashboard");
    }
  };

  // ── Email Sign In ──────────────────────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim() || !password) { setError("Email and password are required."); return; }
    setLoading(true);
    const { data, error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) router.replace("/dashboard");
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim()) { setError("Please enter your email."); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSuccess(`Password reset link sent to ${email}. Check your inbox.`);
  };

  // ━━━ RENDER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="min-h-screen flex bg-background">

      {/* LEFT — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/5 blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group mb-16">
            <div className="w-10 h-10 border-2 border-primary flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500">
              <div className="w-2.5 h-2.5 bg-primary -rotate-45" />
            </div>
            <span className="text-2xl font-black tracking-widest uppercase">
              Room<span className="text-primary">Relay</span>
            </span>
          </Link>

          <h1 className="text-5xl font-black leading-tight mb-6">
            Find your<br />
            <span className="text-primary">perfect room</span><br />
            in Hyderabad.
          </h1>
          <p className="text-background/60 font-light text-lg leading-relaxed max-w-sm">
            Trusted by thousands of bachelors. No brokerage. Direct handover.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { value: "5,000+", label: "Rooms Listed" },
            { value: "₹0",     label: "Brokerage" },
            { value: "48h",    label: "Avg. Handover" },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl font-black text-primary">{s.value}</p>
              <p className="text-xs uppercase tracking-widest text-background/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-widest text-background/30 mb-3">Trusted & Secured</p>
          <div className="flex items-center gap-4 text-background/50 text-xs font-semibold">
            <span>🔒 Razorpay</span>
            <span>🏦 Supabase</span>
            <span>🌐 Takevolet Technologies</span>
          </div>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary flex items-center justify-center rotate-45">
                <div className="w-2 h-2 bg-primary -rotate-45" />
              </div>
              <span className="text-xl font-black tracking-widest">Room<span className="text-primary">Relay</span></span>
            </Link>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-secondary rounded-none mb-8 border border-border">
            {(["signin", "signup"] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); reset(); }}
                className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-bold transition-all ${
                  mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>

              {/* Title */}
              <div className="mb-7">
                <h2 className="text-2xl font-black mb-1">
                  {mode === "signin"  ? "Welcome back 👋" :
                   mode === "signup"  ? "Create account 🚀" :
                   "Reset password 🔑"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {mode === "signin"  ? "Sign in to access your dashboard and rooms." :
                   mode === "signup"  ? "Join Takevolet — find or list rooms in Hyderabad." :
                   "We'll send a reset link to your email."}
                </p>
              </div>

              {/* ── GOOGLE BUTTON ─────────────────────────────────────────── */}
              {mode !== "forgot" && (
                <>
                  <button onClick={handleGoogle} disabled={gLoading}
                    className="w-full flex items-center justify-center gap-3 border-2 border-border hover:border-primary py-3.5 text-sm font-bold transition-all mb-5 disabled:opacity-50 hover:bg-secondary/50 group">
                    {gLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    <span className="group-hover:text-primary transition-colors">
                      Continue with Google
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                </>
              )}

              {/* ── ALERTS ────────────────────────────────────────────────── */}
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="flex gap-2.5 bg-red-50 border border-red-200 p-3.5 mb-5 text-sm text-red-700">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  className="flex gap-2.5 bg-green-50 border border-green-200 p-3.5 mb-5 text-sm text-green-700">
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </motion.div>
              )}

              {/* ── SIGN IN form ────────────────────────────────────────── */}
              {mode === "signin" && (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required
                        className="w-full border border-border pl-10 pr-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required
                        className="w-full border border-border pl-10 pr-10 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setMode("forgot"); reset(); }}
                    className="text-xs text-primary font-semibold hover:underline">
                    Forgot password?
                  </button>
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><ArrowRight size={15} /> Sign In</>}
                  </button>
                </form>
              )}

              {/* ── SIGN UP form ─────────────────────────────────────────── */}
              {mode === "signup" && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Nithin Patel" required
                        className="w-full border border-border pl-10 pr-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Email</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required
                        className="w-full border border-border pl-10 pr-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Phone (optional)</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full border border-border pl-10 pr-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Min 6 characters" required minLength={6}
                        className="w-full border border-border pl-10 pr-10 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    By signing up you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms</Link> &{" "}
                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                  </p>
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><ArrowRight size={15} /> Create Account</>}
                  </button>
                </form>
              )}

              {/* ── FORGOT PASSWORD form ──────────────────────────────────── */}
              {mode === "forgot" && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required
                        className="w-full border border-border pl-10 pr-4 py-3 text-sm bg-background focus:border-primary focus:outline-none transition-colors" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-primary text-primary-foreground py-4 text-sm uppercase tracking-wider font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <><Mail size={15} /> Send Reset Link</>}
                  </button>
                  <button type="button" onClick={() => { setMode("signin"); reset(); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to Sign In
                  </button>
                </form>
              )}

              {/* Bottom switch */}
              {mode !== "forgot" && (
                <p className="text-center text-xs text-muted-foreground mt-6">
                  {mode === "signin" ? (
                    <>No account?{" "}
                      <button onClick={() => { setMode("signup"); reset(); }} className="text-primary font-bold hover:underline">
                        Sign up free
                      </button>
                    </>
                  ) : (
                    <>Already have an account?{" "}
                      <button onClick={() => { setMode("signin"); reset(); }} className="text-primary font-bold hover:underline">
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Default export wraps in Suspense (required for useSearchParams) ──────────
export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
