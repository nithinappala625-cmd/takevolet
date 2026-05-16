"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

// ─── The actual callback handler ─────────────────────────────────────────────
// Supabase with detectSessionInUrl: true automatically exchanges the OAuth code
// for a session. We just need to WAIT for the session to be available, then
// redirect. Do NOT call exchangeCodeForSession manually — it breaks PKCE.
function AuthCallbackInner() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Completing sign-in…");

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // wait up to 10 seconds

    const checkSession = async () => {
      attempts++;

      // Supabase automatically detects the code in the URL and exchanges it
      // because detectSessionInUrl: true is set in the client config.
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("[Auth Callback] Session error:", error.message);
        setStatus("error");
        setMessage("Authentication failed. Please try again.");
        setTimeout(() => router.replace("/auth?error=callback_failed"), 2000);
        return;
      }

      if (data.session) {
        // Check if profile is complete
        const { isProfileComplete } = await import("@/lib/db");
        const profileDone = await isProfileComplete(data.session.user.id);

        const displayName =
          data.session.user.user_metadata?.full_name ||
          data.session.user.user_metadata?.name ||
          data.session.user.email;
        setStatus("success");
        setMessage(`Welcome${displayName ? `, ${displayName}` : ""}! Redirecting…`);

        const dest = profileDone ? "/dashboard" : "/profile/complete";
        setTimeout(() => router.replace(dest), 1000);
        return;
      }

      // No session yet — Supabase may still be processing the code exchange.
      // Retry after 500ms.
      if (attempts < maxAttempts) {
        setTimeout(checkSession, 500);
      } else {
        // Timeout — something went wrong
        setStatus("error");
        setMessage("Sign-in timed out. Please try again.");
        setTimeout(() => router.replace("/auth?error=callback_failed"), 2000);
      }
    };

    // Small initial delay so Supabase has time to process the URL hash/code
    const timer = setTimeout(checkSession, 300);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 max-w-sm"
      >
        {/* Spinner / icon */}
        {status === "loading" && (
          <div className="w-12 h-12 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-5" />
        )}
        {status === "success" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-green-600 text-2xl"
          >
            ✓
          </motion.div>
        )}
        {status === "error" && (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-red-600 text-2xl">
            ✕
          </div>
        )}

        {/* Logo */}
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3">
          Takevolet
        </p>

        {/* Status message */}
        <p className="text-sm font-semibold text-foreground">{message}</p>

        {status === "error" && (
          <button
            onClick={() => router.replace("/auth")}
            className="mt-5 text-xs text-primary font-bold hover:underline"
          >
            ← Back to Sign In
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
