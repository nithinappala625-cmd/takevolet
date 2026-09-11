import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { HYDERABAD_AREAS, BANGALORE_AREAS, PUNE_AREAS, MUMBAI_AREAS, DELHI_AREAS, CHENNAI_AREAS } from "@/data/locations";
import { ARTICLES } from "@/data/articles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_URL = "https://takevolet.online";

export const revalidate = 3600; // Re-generate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static Pages ───────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/rooms`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.95 },
    { url: `${BASE_URL}/rooms/family`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/flatmates`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/marketplace`, lastModified: new Date(), changeFrequency: "daily", priority: 0.85 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/pricing`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/contact-us`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms-and-conditions`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/refund-policy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/list`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/post/room`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/post/flatmate`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/post/item`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  // ── Area Landing Pages (Hyderabad) ─────────────────────────────────────────
  const hyderabadAreaPages: MetadataRoute.Sitemap = HYDERABAD_AREAS.map(area => ({
    url: `${BASE_URL}/rooms/in/${area.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // ── Area Landing Pages (Bangalore) ─────────────────────────────────────────
  const bangaloreAreaPages: MetadataRoute.Sitemap = BANGALORE_AREAS.map(area => ({
    url: `${BASE_URL}/rooms/in/${area.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  const puneAreaPages: MetadataRoute.Sitemap = PUNE_AREAS.map(area => ({
    url: `${BASE_URL}/rooms/in/${area.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  const mumbaiAreaPages: MetadataRoute.Sitemap = MUMBAI_AREAS.map(area => ({
    url: `${BASE_URL}/rooms/in/${area.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  const delhiAreaPages: MetadataRoute.Sitemap = DELHI_AREAS.map(area => ({
    url: `${BASE_URL}/rooms/in/${area.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  const chennaiAreaPages: MetadataRoute.Sitemap = CHENNAI_AREAS.map(area => ({
    url: `${BASE_URL}/rooms/in/${area.toLowerCase().replace(/\s+/g, "-").replace(/[.]/g, "")}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.75,
  }));

  // ── Article Pages ──────────────────────────────────────────────────────────
  const articlePages: MetadataRoute.Sitemap = ARTICLES.map(article => ({
    url: `${BASE_URL}/articles/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ── Dynamic Room Pages from Supabase ───────────────────────────────────────
  let roomPages: MetadataRoute.Sitemap = [];
  try {
    const { data: rooms } = await supabase
      .from("rooms")
      .select("id, created_at")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (rooms) {
      roomPages = rooms.map(room => ({
        url: `${BASE_URL}/rooms/${room.id}`,
        lastModified: new Date(room.created_at),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));
    }
  } catch (e) {
    console.error("Sitemap: Error fetching rooms", e);
  }

  // ── Dynamic Flatmate Pages from Supabase ───────────────────────────────────
  let flatmatePages: MetadataRoute.Sitemap = [];
  try {
    const { data: flatmates } = await supabase
      .from("flatmates")
      .select("id, created_at")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (flatmates) {
      flatmatePages = flatmates.map(fm => ({
        url: `${BASE_URL}/flatmates/${fm.id}`,
        lastModified: new Date(fm.created_at),
        changeFrequency: "daily" as const,
        priority: 0.75,
      }));
    }
  } catch (e) {
    console.error("Sitemap: Error fetching flatmates", e);
  }

  // ── Dynamic Marketplace Item Pages from Supabase ───────────────────────────
  let itemPages: MetadataRoute.Sitemap = [];
  try {
    const { data: items } = await supabase
      .from("items")
      .select("id, created_at")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (items) {
      itemPages = items.map(item => ({
        url: `${BASE_URL}/marketplace/${item.id}`,
        lastModified: new Date(item.created_at),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
    }
  } catch (e) {
    console.error("Sitemap: Error fetching items", e);
  }

  // ── Dynamic Pages from Supabase (custom pages) ────────────────────────────
  let dynamicPages: MetadataRoute.Sitemap = [];
  try {
    const { data: pages } = await supabase
      .from("pages")
      .select("slug, updated_at, created_at")
      .order("created_at", { ascending: false });

    if (pages) {
      dynamicPages = pages.map(page => ({
        url: `${BASE_URL}/${page.slug}`,
        lastModified: new Date(page.updated_at || page.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch (e) {
    console.error("Sitemap: Error fetching pages", e);
  }

  return [
    ...staticPages,
    ...hyderabadAreaPages,
    ...bangaloreAreaPages,
    ...puneAreaPages,
    ...mumbaiAreaPages,
    ...delhiAreaPages,
    ...chennaiAreaPages,
    ...articlePages,
    ...roomPages,
    ...flatmatePages,
    ...itemPages,
    ...dynamicPages,
  ];
}
