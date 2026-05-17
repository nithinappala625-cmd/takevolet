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
