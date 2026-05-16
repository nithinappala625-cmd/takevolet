"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

// ─── Unified user type for the app ────────────────────────────────────────────
export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location?: string;
  profession?: string;
  membersCount?: number;
  gender?: string;
  // Extended Supabase user metadata
  supabaseUser: User;
};

function mapSupabaseUser(user: User): AppUser {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.full_name || meta.name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    phone: meta.phone || "",
    avatar:
      meta.avatar_url ||
      meta.picture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.full_name || user.email || "U")}&background=D4AF37&color=000000&bold=true`,
    location: meta.location || "",
    profession: meta.profession || "",
    membersCount: meta.members_count || 1,
    gender: meta.gender || "",
    supabaseUser: user,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
      setLoading(false);
    });

    // 2. Listen for auth state changes (login, logout, token refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  /** Update display metadata stored in Supabase user_metadata */
  const updateUser = useCallback(
    async (updates: Partial<Omit<AppUser, "id" | "email" | "supabaseUser">>) => {
      const mapped: Record<string, unknown> = {};
      if (updates.name)         mapped.full_name = updates.name;
      if (updates.phone)        mapped.phone = updates.phone;
      if (updates.location)     mapped.location = updates.location;
      if (updates.profession)   mapped.profession = updates.profession;
      if (updates.membersCount) mapped.members_count = updates.membersCount;
      if (updates.gender)       mapped.gender = updates.gender;

      const { data, error } = await supabase.auth.updateUser({ data: mapped });
      if (!error && data.user) {
        setUser(mapSupabaseUser(data.user));
      }
      return { error };
    },
    []
  );

  return { user, session, loading, logout, updateUser, isLoggedIn: !!user };
}
