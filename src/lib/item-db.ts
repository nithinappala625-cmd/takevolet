import { supabase } from "@/lib/supabase";

export type MarketplaceItemType = {
  id?: string;
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
  is_available?: boolean;
  // Poster info fetched separately from auth.users or a profiles table
  poster_name?: string;
  poster_avatar?: string;
  poster_phone?: string;
};

/**
 * Save an item to Supabase.
 * Called when a user posts a new marketplace item.
 */
export async function saveItem(
  item: MarketplaceItemType
): Promise<{ data: MarketplaceItemType | null; error: any }> {
  const { data, error } = await supabase
    .from("items")
    .insert([
      {
        user_id: item.user_id,
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        price: item.price,
        rent_price: item.rent_price || null,
        location: item.location,
        image: item.image,
        images: item.images,
        listing_type: item.listing_type,
        is_available: true,
      },
    ])
    .select()
    .single();

  return { data: data as MarketplaceItemType, error };
}

/**
 * Get all available marketplace items — no profile join to keep query simple and reliable.
 */
export async function getAllItems(): Promise<MarketplaceItemType[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[item-db] Error fetching items:", error.message);
    return [];
  }
  return (data as MarketplaceItemType[]) || [];
}

/**
 * Get a specific item by ID.
 */
export async function getItemById(
  id: string
): Promise<MarketplaceItemType | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("[item-db] Error fetching item:", error?.message);
    return null;
  }
  return data as MarketplaceItemType;
}

/**
 * Get items posted by a specific user.
 */
export async function getUserItems(
  userId: string
): Promise<MarketplaceItemType[]> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[item-db] Error fetching user items:", error.message);
    return [];
  }
  return (data as MarketplaceItemType[]) || [];
}

/**
 * Mark an item as no longer available (soft delete).
 */
export async function deleteItem(id: string): Promise<{ error: any }> {
  const { error } = await supabase
    .from("items")
    .update({ is_available: false })
    .eq("id", id);
  return { error };
}
