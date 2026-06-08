import { supabase } from "./supabase";
import { Flatmate, MOCK_FLATMATES } from "../data/mock";

// Helper to get local flatmates from localStorage
const LOCAL_STORAGE_KEY = "takevolet_local_flatmates";

function getLocalFlatmates(): Flatmate[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return [];
    const list = JSON.parse(data);
    if (Array.isArray(list)) {
      const STALE_TITLES = [
        "1rk super vacant",
        "1 roommate vacant",
        "1 room vanacy",
        "3bhk room for vacant",
      ];
      const filtered = list.filter((item: any) => {
        const title = (item.title || "").toLowerCase().trim();
        return !STALE_TITLES.includes(title);
      });
      if (filtered.length !== list.length) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }
    return [];
  } catch (err) {
    console.error("Error reading local flatmates:", err);
    return [];
  }
}

function saveLocalFlatmate(flatmate: Flatmate) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalFlatmates();
    const updated = [flatmate, ...existing];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error("Error saving local flatmate:", err);
  }
}

// Convert DB snake_case record to Flatmate type
function mapDbToFlatmate(dbRecord: any, profile?: any): Flatmate {
  return {
    id: dbRecord.id,
    userId: dbRecord.user_id,
    title: dbRecord.title,
    description: dbRecord.description || "",
    rentShare: dbRecord.rent_share,
    advanceShare: dbRecord.advance_share || 0,
    location: dbRecord.location,
    colony: dbRecord.colony,
    city: dbRecord.city || "Hyderabad",
    vacancyCount: dbRecord.vacancy_count || 1,
    professionPref: dbRecord.profession_pref || "Any",
    genderPref: dbRecord.gender_pref || "Any",
    lifestyleHabits: dbRecord.lifestyle_habits || [],
    images: dbRecord.images || [],
    videos: dbRecord.videos || [],
    isAvailable: dbRecord.is_available ?? true,
    postedBy: {
      name: profile?.full_name || "Owner",
      phone: profile?.phone || "+91 99999 88888",
      whatsapp: profile?.whatsapp || "+919999988888",
      avatar: profile?.avatar_url || "https://i.pravatar.cc/150?img=9",
      profession: profile?.profession || "Working Professional",
      age: profile?.age || 25,
    },
    createdAt: dbRecord.created_at,
  };
}

import { fetchAllFlatmatesAction, fetchFlatmateByIdAction } from "./server-actions";

/**
 * Fetch all available flatmates (with fallback to mock data & localStorage)
 */
export async function getAllFlatmates(): Promise<Flatmate[]> {
  try {
    const dbData = await fetchAllFlatmatesAction();

    if (!dbData) {
      // Graceful fallback to Mock + LocalStorage
      return [...getLocalFlatmates(), ...MOCK_FLATMATES];
    }

    // If database exists and works, fetch profiles to enrich the list
    const enrichedFlatmates: Flatmate[] = [];
    for (const record of dbData) {
      enrichedFlatmates.push(mapDbToFlatmate(record, record.profile));
    }

    // Merge with any local listings created by the user on this browser session
    return [...getLocalFlatmates(), ...enrichedFlatmates];
  } catch (err) {
    console.warn("getAllFlatmates: database table flatmates not found or error, using fallback.", err);
    return [...getLocalFlatmates(), ...MOCK_FLATMATES];
  }
}

/**
 * Fetch a single flatmate by ID
 */
export async function getFlatmateById(id: string): Promise<Flatmate | null> {
  // 1. Check local storage first
  const localListings = getLocalFlatmates();
  const localMatch = localListings.find((f) => f.id === id);
  if (localMatch) return localMatch;

  // 2. Check Mock data
  const mockMatch = MOCK_FLATMATES.find((f) => f.id === id);
  if (mockMatch) return mockMatch;

  // 3. Query from Supabase
  try {
    const dbData = await fetchFlatmateByIdAction(id);

    if (!dbData) return null;

    return mapDbToFlatmate(dbData, dbData.profile);
  } catch (err) {
    console.error("getFlatmateById error:", err);
    return null;
  }
}

/**
 * Insert a new flatmate listing
 */
export async function insertFlatmate(
  flatmateData: Omit<Flatmate, "id" | "createdAt" | "isAvailable">
): Promise<{ data: Flatmate | null; error: any }> {
  const generatedId = "f_" + Math.random().toString(36).substr(2, 9);
  const newFlatmate: Flatmate = {
    ...flatmateData,
    id: generatedId,
    isAvailable: true,
    createdAt: new Date().toISOString(),
  };

  try {
    // Attempt Supabase insert
    const dbPayload = {
      id: generatedId,
      user_id: flatmateData.userId,
      title: flatmateData.title,
      description: flatmateData.description,
      rent_share: flatmateData.rentShare,
      advance_share: flatmateData.advanceShare,
      location: flatmateData.location,
      colony: flatmateData.colony,
      city: flatmateData.city || "Hyderabad",
      vacancy_count: flatmateData.vacancyCount,
      profession_pref: flatmateData.professionPref,
      gender_pref: flatmateData.genderPref,
      lifestyle_habits: flatmateData.lifestyleHabits,
      images: flatmateData.images,
      videos: flatmateData.videos || [],
      is_available: true,
    };

    const { data: insertedRecord, error } = await supabase
      .from("flatmates")
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      // Save locally as fallback
      saveLocalFlatmate(newFlatmate);
      return { data: newFlatmate, error: null };
    }

    // Success
    const profile = {
      full_name: flatmateData.postedBy.name,
      phone: flatmateData.postedBy.phone,
      whatsapp: flatmateData.postedBy.whatsapp,
      avatar_url: flatmateData.postedBy.avatar,
      profession: flatmateData.postedBy.profession,
    };

    return { data: mapDbToFlatmate(insertedRecord, profile), error: null };
  } catch (err) {
    console.warn("insertFlatmate: Supabase insert failed, saving to localStorage.", err);
    saveLocalFlatmate(newFlatmate);
    return { data: newFlatmate, error: null };
  }
}
import { fetchUserFlatmatesAction, deleteFlatmateAction } from "./server-actions";

/**
 * Fetch all flatmate listings posted by a specific user
 */
export async function getUserFlatmates(userId: string): Promise<Flatmate[]> {
  try {
    const dbData = await fetchUserFlatmatesAction(userId);
    const dbFlatmates = dbData.map((record: any) => mapDbToFlatmate(record));
    const localFlatmates = getLocalFlatmates().filter((f) => f.userId === userId);
    return [...localFlatmates, ...dbFlatmates];
  } catch (err) {
    console.error("getUserFlatmates error:", err);
    // Fallback: filter localStorage
    return getLocalFlatmates().filter((f) => f.userId === userId);
  }
}

/**
 * Delete a flatmate listing by ID (from DB and localStorage)
 */
export async function deleteUserFlatmate(id: string): Promise<{ error: any }> {
  // Remove from localStorage if present
  if (typeof window !== "undefined") {
    try {
      const existing = getLocalFlatmates();
      const updated = existing.filter((f) => f.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Error removing local flatmate:", err);
    }
  }
  // Delete from DB
  return deleteFlatmateAction(id);
}
