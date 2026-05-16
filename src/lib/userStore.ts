// ─── UserStore ────────────────────────────────────────────────────────────────
// Persists user profile, posted rooms, and earnings to localStorage.
// This is the single source of truth for the current user's data.
// ─────────────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  location: string; // main area in Hyderabad
  colony: string;   // specific colony/sub-area
  profession: string;
  membersCount: number; // how many members currently living with them
  gender: "Male" | "Female" | "Other";
  avatar: string;
  createdAt: string;
};

export type PostedRoom = {
  id: string;
  userId: string;
  title: string;
  description: string;
  rent: number;
  advance: number;
  location: string;
  colony: string;
  leavingDate: string;
  membersAllowed: number;
  genderPreference: string;
  furnishing: string;
  parking: string;
  commission: number;
  amenities: string[];
  images: string[]; // base64 previews or URLs
  furniture: string[];
  hasItems: boolean;
  items: string[];
  isAvailable: boolean;
  postedBy: {
    name: string;
    phone: string;
    whatsapp: string;
    avatar: string;
    profession: string;
  };
  enquiries: number;
  contactUnlocks: number;
  earnings: number;
  createdAt: string;
};

export type EarningTransaction = {
  id: string;
  userId: string;
  type: "Takevolet Commission" | "Contact Unlock Revenue" | "Item Sale";
  amount: number;
  date: string;
  status: "completed" | "pending";
  description: string;
};

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const PROFILE_KEY = "rr_user_profile";
const ROOMS_KEY = "rr_posted_rooms";
const EARNINGS_KEY = "rr_earnings";
const REDIRECT_KEY = "rr_after_login";

// ─── Profile ─────────────────────────────────────────────────────────────────
export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}

export function isRegistered(): boolean {
  return !!getProfile();
}

// ─── Redirect After Login ─────────────────────────────────────────────────────
export function setPostLoginRedirect(url: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REDIRECT_KEY, url);
}

export function getPostLoginRedirect(): string {
  if (typeof window === "undefined") return "/dashboard";
  return localStorage.getItem(REDIRECT_KEY) || "/dashboard";
}

export function clearPostLoginRedirect(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REDIRECT_KEY);
}

// ─── Posted Rooms ─────────────────────────────────────────────────────────────
export function getPostedRooms(userId?: string): PostedRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    const all: PostedRoom[] = raw ? JSON.parse(raw) : [];
    return userId ? all.filter(r => r.userId === userId) : all;
  } catch { return []; }
}

export function getAllPostedRooms(): PostedRoom[] {
  return getPostedRooms();
}

export function savePostedRoom(room: PostedRoom): void {
  if (typeof window === "undefined") return;
  const rooms = getPostedRooms();
  const existing = rooms.findIndex(r => r.id === room.id);
  if (existing >= 0) {
    rooms[existing] = room;
  } else {
    rooms.unshift(room); // newest first
  }
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

export function deletePostedRoom(roomId: string): void {
  if (typeof window === "undefined") return;
  const rooms = getPostedRooms().filter(r => r.id !== roomId);
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms));
}

// ─── Earnings ─────────────────────────────────────────────────────────────────
export function getEarnings(userId: string): EarningTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(EARNINGS_KEY);
    const all: EarningTransaction[] = raw ? JSON.parse(raw) : [];
    return all.filter(e => e.userId === userId);
  } catch { return []; }
}

export function addEarning(earning: EarningTransaction): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(EARNINGS_KEY);
  const all: EarningTransaction[] = raw ? JSON.parse(raw) : [];
  all.unshift(earning);
  localStorage.setItem(EARNINGS_KEY, JSON.stringify(all));
}

export function calcEarningsSummary(transactions: EarningTransaction[]) {
  const total = transactions.filter(t => t.status === "completed").reduce((sum, t) => sum + t.amount, 0);
  const pending = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);
  const completed = transactions.filter(t => t.status === "completed" && t.type === "Takevolet Commission").length;
  const pendingRelays = transactions.filter(t => t.status === "pending" && t.type === "Takevolet Commission").length;
  return { total, pending, completed, pendingRelays };
}
