"use server";

import { createClient } from "@supabase/supabase-js";
import type { Room } from "./db";

// Use service role key to bypass RLS for public listing reads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function fetchAllRoomsAction(): Promise<Room[]> {
  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("*, profiles(full_name, phone, whatsapp, avatar_url, profession)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("fetchAllRoomsAction:", error);
    return [];
  }
  return (data as Room[]) || [];
}

export async function fetchRoomByIdAction(id: string): Promise<Room | null> {
  const { data, error } = await supabaseAdmin
    .from("rooms")
    .select("*, profiles(full_name, phone, whatsapp, avatar_url, profession)")
    .eq("id", id)
    .single();
    
  if (error || !data) return null;
  return data as Room;
}

export async function checkRoomUnlockStatusAction(roomId: string, userId: string) {
  if (!roomId || !userId || userId === "guest") return null;

  const { data, error } = await supabaseAdmin
    .from("contact_unlocks")
    .select("id")
    .eq("room_id", roomId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  
  // If paid, fetch contact info to return
  const room = await fetchRoomByIdAction(roomId);
  if (!room) return null;
  
  const p = Array.isArray(room.profiles) ? room.profiles[0] : room.profiles as any;
  if (!p) return null;
  
  return {
    name:       p.full_name  || "Room Poster",
    phone:      p.phone      || "",
    whatsapp:   p.whatsapp   || p.phone || "",
    profession: p.profession || "",
    avatar:     p.avatar_url || "",
  };
}

export async function getUserContactBalanceAction(userId: string) {
  if (!userId || userId === "guest") return 0;
  const { data } = await supabaseAdmin.from("profiles").select("contact_balance").eq("id", userId).single();
  return data?.contact_balance || 0;
}

export async function unlockContactWithBalanceAction(listingId: string, userId: string, type: "room" | "flatmate") {
  if (!userId || userId === "guest") return { success: false, error: "Unauthorized" };
  
  const balance = await getUserContactBalanceAction(userId);
  if (balance <= 0) return { success: false, error: "Insufficient balance" };
  
  // Decrement balance
  await supabaseAdmin.from("profiles").update({ contact_balance: balance - 1 }).eq("id", userId);
  
  // Add unlock record
  const table = type === "room" ? "contact_unlocks" : "flatmate_contact_unlocks";
  const idField = type === "room" ? "room_id" : "flatmate_id";
  
  await supabaseAdmin.from(table).upsert({
    [idField]: listingId,
    user_id: userId,
    razorpay_order_id: "balance_" + Date.now(),
    razorpay_payment_id: "balance_" + Date.now(),
    created_at: new Date().toISOString(),
  }, { onConflict: `${idField},user_id`, ignoreDuplicates: true });
  
  return { success: true };
}

// ─── PAGES (Dynamic Static Pages) ────────────────────────────────────────────

export async function fetchAllPagesAction() {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchAllPagesAction:", error);
    return [];
  }
  return data as any[];
}

export async function fetchPageBySlugAction(slug: string) {
  const { data, error } = await supabaseAdmin
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;
  return data as any;
}

export async function insertPageAction(pageData: any) {
  const { error } = await supabaseAdmin
    .from("pages")
    .insert(pageData);
  return { error };
}

export async function updatePageAction(id: string, pageData: any) {
  const { error } = await supabaseAdmin
    .from("pages")
    .update({ ...pageData, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error };
}

export async function deletePageAction(id: string) {
  const { error } = await supabaseAdmin
    .from("pages")
    .delete()
    .eq("id", id);
  return { error };
}

export async function fetchAllFlatmatesAction() {
  const { data, error } = await supabaseAdmin
    .from("flatmates")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  
  if (error) return null;
  
  const records = data as any[];
  for (const record of records) {
    if (record.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, phone, whatsapp, avatar_url, profession")
        .eq("id", record.user_id)
        .single();
      record.profile = profile || null;
    }
  }
  return records;
}

export async function fetchFlatmateByIdAction(id: string) {
  const { data, error } = await supabaseAdmin
    .from("flatmates")
    .select("*")
    .eq("id", id)
    .single();
    
  if (error || !data) return null;
  
  if (data.user_id) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone, whatsapp, avatar_url, profession")
      .eq("id", data.user_id)
      .single();
    data.profile = profile || null;
  }
  return data;
}

export async function fetchUserFlatmatesAction(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("flatmates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data as any[]) || [];
}

export async function deleteFlatmateAction(id: string) {
  const { error } = await supabaseAdmin
    .from("flatmates")
    .delete()
    .eq("id", id);
  return { error };
}

// ─── MARKETPLACE ITEMS ────────────────────────────────────────────────────────

export async function fetchAllItemsAction() {
  const { data, error } = await supabaseAdmin
    .from("items")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchAllItemsAction:", error);
    return [];
  }

  const items = data as any[];
  for (const item of items) {
    if (item.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("full_name, phone, whatsapp, avatar_url, profession, is_verified")
        .eq("id", item.user_id)
        .single();
      item.seller_profile = profile || null;
    }
  }
  return items;
}

export async function fetchItemByIdAction(id: string) {
  const { data, error } = await supabaseAdmin
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  if (data.user_id) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, phone, whatsapp, avatar_url, profession, is_verified")
      .eq("id", data.user_id)
      .single();
    data.seller_profile = profile || null;
  }
  return data;
}

// ─── ADS & SPONSORSHIPS ────────────────────────────────────────────────────────

export async function fetchActiveAdsAction(placement: string) {
  const { data, error } = await supabaseAdmin
    .from("ads")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as any[];
}

export async function getAllAdsAdminAction() {
  const { data, error } = await supabaseAdmin
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as any[];
}

export async function insertAdAction(adData: any) {
  const { error } = await supabaseAdmin
    .from("ads")
    .insert(adData);
  return { error };
}

export async function updateAdAction(id: string, adData: any) {
  const { error } = await supabaseAdmin
    .from("ads")
    .update(adData)
    .eq("id", id);
  return { error };
}

export async function deleteAdAction(id: string) {
  const { error } = await supabaseAdmin
    .from("ads")
    .delete()
    .eq("id", id);
  return { error };
}

export async function checkFlatmateUnlockStatusAction(flatmateId: string, userId: string) {
  if (!flatmateId || !userId || userId === 'guest') return null;

  const { data, error } = await supabaseAdmin
    .from('flatmate_contact_unlocks')
    .select('id')
    .eq('flatmate_id', flatmateId)
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  
  // If found, fetch contact info to return
  const flatmate = await fetchFlatmateByIdAction(flatmateId);
  if (!flatmate || !flatmate.profile) return null;
  
  const p = flatmate.profile;
  return {
    name:       p.full_name  || 'Flatmate Poster',
    phone:      p.phone      || '',
    whatsapp:   p.whatsapp   || p.phone || '',
    profession: p.profession || '',
    avatar:     p.avatar_url || '',
  };
}

