import { supabase } from "@/lib/supabase";

export type MarketplaceItemType = {
  id?: string; // Supabase uses UUID, optional before insert
  user_id?: string;
  title: string;
  description: string;
  price: number;
  rent_price?: number;
  category: string;
  condition: string;
  location: string;
  image: string;
  images: string[];
  listing_type: "sell" | "rent" | "both";
  created_at?: string;
  
  // Joined fields
  profiles?: {
    full_name: string;
    avatar_url: string;
    phone?: string;
  };
};

/**
 * Save an item to Supabase
 */
export async function saveItem(item: MarketplaceItemType): Promise<{ data: MarketplaceItemType | null; error: any }> {
  const { data, error } = await supabase
    .from("items")
    .insert([item])
    .select()
    .single();
    
  return { data: data as MarketplaceItemType, error };
}

/**
 * Get all available marketplace items
 */
export async function getAllItems(): Promise<MarketplaceItemType[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*, profiles(full_name, avatar_url, phone)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching items:", error);
    return [];
  }
  return data as MarketplaceItemType[];
}

/**
 * Get a specific item by ID
 */
export async function getItemById(id: string): Promise<MarketplaceItemType | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*, profiles(full_name, avatar_url, phone)")
    .eq("id", id)
    .single();
    
  if (error || !data) return null;
  return data as MarketplaceItemType;
}

/**
 * Get items posted by a specific user ID
 */
export async function getUserItems(userId: string): Promise<MarketplaceItemType[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*, profiles(full_name, avatar_url, phone)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
    
  if (error) return [];
  return data as MarketplaceItemType[];
}
