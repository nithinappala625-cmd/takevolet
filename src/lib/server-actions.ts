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
    .from("interests")
    .select("payment_status")
    .eq("room_id", roomId)
    .eq("seeker_id", userId)
    .single();

  if (error || !data || data.payment_status !== "paid") return null;
  
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
