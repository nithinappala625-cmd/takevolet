// ─── Supabase Client ─────────────────────────────────────────────────────────
// Browser-side client — uses anon key (safe for public use)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",           // explicit PKCE flow — required for Google OAuth
  },
});

// ─── Callback URL helper ──────────────────────────────────────────────────────
// Always use the full URL including /auth/callback
// Must be whitelisted in: Supabase Dashboard → Auth → URL Configuration → Redirect URLs
function getCallbackUrl() {
  if (typeof window !== "undefined") {
    // Use the actual current origin so localhost AND production both work
    return `${window.location.origin}/auth/callback`;
  }
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`;
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/** Sign up with email + password */
export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, display_name: name },
      emailRedirectTo: getCallbackUrl(),
    },
  });
  return { data, error };
}

/** Sign in with email + password */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { data, error };
}

/** Sign in with Google OAuth (PKCE flow) */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getCallbackUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "select_account",   // let user pick account each time
      },
    },
  });
  return { data, error };
}

/** Send password reset email */
export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getCallbackUrl().replace("/auth/callback", "/auth/reset-password")}`,
  });
  return { data, error };
}

/** Sign out */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/** Get current session */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/** Get current user */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}
