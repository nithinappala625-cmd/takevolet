// ─── Supabase Data Layer ──────────────────────────────────────────────────────
// All DB operations go through this file. No more localStorage.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  owner_name?: string;
  owner_phone?: string;
  avatar_url?: string;
  location?: string;
  colony?: string;
  house_no?: string;
  profession?: string;
  members_count?: number;
  gender?: string;
  dob?: string;
  aadhaar_url?: string;
  aadhaar_back_url?: string;
  is_verified?: boolean;
  created_at?: string;
  payout_method?: string;
  upi_id?: string;
  bank_account?: string;
  bank_ifsc?: string;
  bank_name?: string;
  payout_qr_code?: string;
};

export type Room = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  rent: number;
  advance?: number;
  location: string;
  colony: string;
  house_no?: string;
  full_address?: string;
  leaving_date: string;
  members_allowed?: number;
  current_members?: number;
  gender_preference?: string;
  furnishing?: string;
  parking?: string;
  amenities?: string[];
  furniture?: string[];
  has_items?: boolean;
  items?: string[];
  commission?: number;
  images?: string[];
  videos?: string[];
  is_available?: boolean;
  enquiries?: number;
  contact_unlocks?: number;
  earnings?: number;
  created_at?: string;
  // Joined profile data
  profiles?: Pick<Profile, "full_name" | "phone" | "whatsapp" | "avatar_url" | "profession">;
};

export type Earning = {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description?: string;
  status: "pending" | "completed";
  created_at?: string;
};

export type PayoutRequest = {
  id: string;
  user_id: string;
  user_name?: string;
  amount: number;
  method: "upi" | "bank";
  upi_id?: string;
  bank_account?: string;
  bank_ifsc?: string;
  bank_name?: string;
  status: "pending" | "processing" | "completed" | "rejected";
  notes?: string;
  processed_at?: string;
  created_at?: string;
};

export type Ad = {
  id: string;
  advertiser_name: string;
  title: string;
  description?: string;
  url: string;
  image_url?: string;
  placement: string;
  is_active: boolean;
  created_at?: string;
};

// ─── PROFILES ─────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Profile;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }): Promise<{ error: any }> {
  const { error } = await supabase
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: "id" });
  return { error };
}

export async function isProfileComplete(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  if (!profile) return false;
  return !!(
    profile.full_name &&
    profile.phone &&
    profile.location &&
    profile.colony &&
    profile.gender &&
    profile.dob
  );
}

// ─── ROOMS ────────────────────────────────────────────────────────────────────

/** Fetch all available rooms (with poster profile joined) */
export async function getAllRooms(): Promise<Room[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
  if (error) { console.error("getAllRooms:", error); return []; }
  
  // Manually attach profiles to ensure no FK join issues
  const rooms = data as any[];
  for (const room of rooms) {
    if (room.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, whatsapp, avatar_url, profession")
        .eq("id", room.user_id)
        .single();
      room.profiles = profile || null;
    }
  }
  return rooms as Room[];
}

/** Fetch a single room by ID */
export async function getRoomById(id: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;

  // Manually fetch profile
  if (data.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone, whatsapp, avatar_url, profession")
      .eq("id", data.user_id)
      .single();
    data.profiles = profile || null;
  }
  
  return data as Room;
}

/** Fetch rooms posted by a specific user */
export async function getUserRooms(userId: string): Promise<Room[]> {
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as Room[]) || [];
}

// ─── CONTACT UNLOCKS ──────────────────────────────────────────────────────────

export type ContactUnlock = {
  id: string;
  room_id: string;
  room_title?: string;
  room_location?: string;
  user_id: string;        // the seeker who unlocked
  seeker_name?: string;   // seeker's name from profiles
  seeker_avatar?: string;
  seeker_profession?: string;
  amount: number;
  status: string;
  paid_at?: string;
  created_at?: string;
};

/** Fetch all contact unlocks on the poster's rooms (so poster knows who unlocked) */
export async function getContactUnlocks(posterId: string): Promise<ContactUnlock[]> {
  // Fetch poster's room IDs first
  const { data: rooms, error: roomsErr } = await supabase
    .from("rooms")
    .select("id, title, location")
    .eq("user_id", posterId);

  if (roomsErr || !rooms || rooms.length === 0) return [];

  const roomIds = rooms.map((r: any) => r.id);
  const roomMap: Record<string, { title: string; location: string }> = {};
  rooms.forEach((r: any) => { roomMap[r.id] = { title: r.title, location: r.location }; });

  // Fetch interests (unlocks) for those rooms
  const { data: interests, error: intErr } = await supabase
    .from("interests")
    .select("id, room_id, user_id, amount, status, paid_at, created_at")
    .in("room_id", roomIds)
    .eq("status", "paid")
    .order("paid_at", { ascending: false });

  if (intErr || !interests) return [];

  // Enrich with seeker profiles
  const unlocks: ContactUnlock[] = [];
  for (const interest of interests as any[]) {
    let seekerName = "Anonymous Bachelor";
    let seekerAvatar = undefined;
    let seekerProfession = undefined;

    if (interest.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, profession")
        .eq("id", interest.user_id)
        .single();
      if (profile) {
        seekerName = profile.full_name || seekerName;
        seekerAvatar = profile.avatar_url;
        seekerProfession = profile.profession;
      }
    }

    const room = roomMap[interest.room_id] || {};
    unlocks.push({
      id: interest.id,
      room_id: interest.room_id,
      room_title: room.title,
      room_location: room.location,
      user_id: interest.user_id,
      seeker_name: seekerName,
      seeker_avatar: seekerAvatar,
      seeker_profession: seekerProfession,
      amount: interest.amount || 0,
      status: interest.status,
      paid_at: interest.paid_at,
      created_at: interest.created_at,
    });
  }

  return unlocks;
}


/** Insert a new room */
export async function insertRoom(room: Omit<Room, "id" | "created_at">): Promise<{ data: Room | null; error: any }> {
  const { data, error } = await supabase
    .from("rooms")
    .insert(room)
    .select()
    .single();
  return { data: data as Room, error };
}

/** Delete a room */
export async function deleteRoom(roomId: string): Promise<{ error: any }> {
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  return { error };
}

// ─── STORAGE — Upload room photo/video ────────────────────────────────────────

export async function uploadRoomMedia(
  userId: string,
  file: File,
  type: "image" | "video"
): Promise<{ url: string | null; error: any }> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("room-media")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (uploadError) return { url: null, error: uploadError };

  const { data } = supabase.storage.from("room-media").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function uploadAadhaar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: any }> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/aadhaar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("kyc-docs")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) return { url: null, error: uploadError };
  return { url: path, error: null };
}

// ─── EARNINGS ────────────────────────────────────────────────────────────────

export async function getUserEarnings(userId: string): Promise<Earning[]> {
  const { data, error } = await supabase
    .from("earnings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as Earning[]) || [];
}

export function calcEarningsSummary(earnings: Earning[]) {
  const total = earnings.filter(e => e.status === "completed").reduce((s, e) => s + e.amount, 0);
  const pending = earnings.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const completed = earnings.filter(e => e.status === "completed").length;
  return { total, pending, completed };
}

// ─── PAYOUTS ─────────────────────────────────────────────────────────────────

export async function getUserPayouts(userId: string): Promise<PayoutRequest[]> {
  const { data, error } = await supabase
    .from("payouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data as PayoutRequest[]) || [];
}

export async function insertPayoutRequest(
  req: Omit<PayoutRequest, "id" | "status" | "created_at">
): Promise<{ data: PayoutRequest | null; error: any }> {
  const { data, error } = await supabase
    .from("payouts")
    .insert({ ...req, status: "pending" })
    .select()
    .single();
  return { data: data as PayoutRequest, error };
}

// ─── ADMIN (uses service role via API routes) ────────────────────────────────

export async function getAllRoomsAdmin() {
  // Called from API routes with service role key
  const { data } = await supabase
    .from("rooms")
    .select("*, profiles(full_name, phone, email)")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getAllProfilesAdmin() {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getAllPayoutsAdmin() {
  const { data } = await supabase
    .from("payouts")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function updatePayoutStatus(
  payoutId: string,
  status: string,
  notes?: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from("payouts")
    .update({
      status,
      notes: notes || null,
      processed_at: status !== "pending" ? new Date().toISOString() : null,
    })
    .eq("id", payoutId);
  return { error };
}

export async function getFlatmateById(id: string): Promise<any | null> {
  const { data } = await supabase.from('flatmates').select('*, profiles(full_name, phone, whatsapp, avatar_url, profession)').eq('id', id).single();
  return data;
}
