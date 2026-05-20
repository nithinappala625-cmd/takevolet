import { supabase } from "./supabase";
import { Flatmate, MOCK_FLATMATES } from "../data/mock";

// Helper to get local flatmates from localStorage
const LOCAL_STORAGE_KEY = "takevolet_local_flatmates";

function getLocalFlatmates(): Flatmate[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
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
    vacancyCount: dbRecord.vacancy_count || 1,
    professionPref: dbRecord.profession_pref || "Any",
    genderPref: dbRecord.gender_pref || "Any",
    lifestyleHabits: dbRecord.lifestyle_habits || [],
    images: dbRecord.images || [],
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

/**
 * Fetch all available flatmates (with fallback to mock data & localStorage)
 */
export async function getAllFlatmates(): Promise<Flatmate[]> {
  try {
    const { data: dbData, error } = await supabase
      .from("flatmates")
      .select("*")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (error || !dbData) {
      // Graceful fallback to Mock + LocalStorage
      return [...getLocalFlatmates(), ...MOCK_FLATMATES];
    }

    // If database exists and works, fetch profiles to enrich the list
    const enrichedFlatmates: Flatmate[] = [];
    for (const record of dbData) {
      let profile = null;
      if (record.user_id) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("full_name, phone, whatsapp, avatar_url, profession")
          .eq("id", record.user_id)
          .single();
        profile = profData;
      }
      enrichedFlatmates.push(mapDbToFlatmate(record, profile));
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
    const { data: dbData, error } = await supabase
      .from("flatmates")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !dbData) return null;

    let profile = null;
    if (dbData.user_id) {
      const { data: profData } = await supabase
        .from("profiles")
        .select("full_name, phone, whatsapp, avatar_url, profession")
        .eq("id", dbData.user_id)
        .single();
      profile = profData;
    }

    return mapDbToFlatmate(dbData, profile);
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
      user_id: flatmateData.userId,
      title: flatmateData.title,
      description: flatmateData.description,
      rent_share: flatmateData.rentShare,
      advance_share: flatmateData.advanceShare,
      location: flatmateData.location,
      colony: flatmateData.colony,
      vacancy_count: flatmateData.vacancyCount,
      profession_pref: flatmateData.professionPref,
      gender_pref: flatmateData.genderPref,
      lifestyle_habits: flatmateData.lifestyleHabits,
      images: flatmateData.images,
      is_available: true,
    };

    const { data: insertedRecord, error } = await supabase
      .from("flatmates")
      .insert(dbPayload)
      .select()
      .single();

    if (error) {
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
