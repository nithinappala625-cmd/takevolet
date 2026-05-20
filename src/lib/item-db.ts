import { MOCK_ITEMS } from "@/data/mock";

// Define the type so we don't need to import from mock if it changes
export type MarketplaceItemType = {
  id: string;
  title: string;
  description: string;
  price: number;
  rentPrice?: number;
  category: string;
  condition: string;
  location: string;
  image: string;
  images: string[];
  listingType: "sell" | "rent" | "both";
  postedBy: {
    name: string;
    avatar: string;
    phone?: string;
  };
  createdAt: string;
  userId?: string;
};

/**
 * Save an item to localStorage.
 */
export function saveLocalItem(item: MarketplaceItemType) {
  if (typeof window === "undefined") return;
  const existingStr = localStorage.getItem("my_items");
  const existing: MarketplaceItemType[] = existingStr ? JSON.parse(existingStr) : [];
  existing.push(item);
  localStorage.setItem("my_items", JSON.stringify(existing));
}

/**
 * Get all items from localStorage
 */
export function getLocalItems(): MarketplaceItemType[] {
  if (typeof window === "undefined") return [];
  const existingStr = localStorage.getItem("my_items");
  if (!existingStr) return [];
  try {
    return JSON.parse(existingStr) as MarketplaceItemType[];
  } catch (e) {
    return [];
  }
}

/**
 * Get ALL marketplace items, combining mock and local items.
 */
export async function getAllItems(): Promise<MarketplaceItemType[]> {
  const localItems = getLocalItems();
  // We place local items first so they appear at the top
  return [...localItems, ...(MOCK_ITEMS as MarketplaceItemType[])];
}

/**
 * Get a specific item by ID
 */
export async function getItemById(id: string): Promise<MarketplaceItemType | null> {
  const all = await getAllItems();
  return all.find((i) => i.id === id) || null;
}

/**
 * Get items posted by a specific user ID
 */
export async function getUserItems(userId: string): Promise<MarketplaceItemType[]> {
  const localItems = getLocalItems();
  // Filter local items by userId if applicable
  return localItems.filter(item => item.userId === userId);
}
