import { NextResponse } from "next/server";

const FRONTEND_ADMIN_PASSWORD = "Nithin@Takevolet2026";

function verifyAdmin(request: Request): boolean {
  const pwd = request.headers.get("x-admin-password");
  return pwd === FRONTEND_ADMIN_PASSWORD;
}

export interface ExtractedListing {
  sourceUrl: string;
  platform: "olx" | "generic";
  title: string;
  rent: number;
  advance: number;
  location: string;
  colony: string;
  city: string;
  fullAddress: string;
  description: string;
  furnishing: string;
  tenantType: "bachelor" | "family" | "any";
  bedrooms: string;
  cleanImages: {
    id: string;
    originalUrl: string;
    hdUrl: string;
    thumbnailUrl: string;
    isClean: boolean;
  }[];
  sellerName?: string;
  phone?: string;
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const input = (body.url || body.rawText || "").trim();

    if (!input) {
      return NextResponse.json({ error: "Please provide a valid URL or shared text" }, { status: 400 });
    }

    // 1. Extract URL from raw text or input
    const extractedUrl = extractUrlFromText(input);
    if (!extractedUrl) {
      return NextResponse.json({ error: "Could not find a valid web link or listing ID in the provided input" }, { status: 400 });
    }

    // 2. Determine platform and run specialized or generic extraction
    if (isOlxUrl(extractedUrl)) {
      const data = await extractOlxListing(extractedUrl);
      return NextResponse.json({ success: true, data });
    } else {
      const data = await extractGenericListing(extractedUrl);
      return NextResponse.json({ success: true, data });
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to extract listing data. The link might be expired or protected.";
    console.error("[Extract API Error]:", error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

// ─── HELPER: Extract URL from raw text ──────────────────────────────────────────
function extractUrlFromText(text: string): string | null {
  // If user pasted just numeric ID (like 1854926647)
  if (/^\d{8,12}$/.test(text.trim())) {
    return `https://www.olx.in/item/${text.trim()}`;
  }

  // Regex to find http/https URL
  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (match) {
    let url = match[0];
    url = url.replace(/[),;.]+$/, "");
    return url;
  }

  // If starts with olx.in
  if (text.startsWith("olx.in") || text.startsWith("www.olx.in")) {
    return `https://${text}`;
  }

  return null;
}

function isOlxUrl(url: string): boolean {
  return /olx\.(in|com|com\.pk|pl|ro|com\.br|co\.za)/i.test(url);
}

// ─── OLX Listing Extractor ───────────────────────────────────────────────────
async function extractOlxListing(rawUrl: string): Promise<ExtractedListing> {
  // Normalize OLX URL:
  // OLX often returns 404 for /d/item/ links if fetched directly with curl/fetch,
  // whereas /item/ with the ID redirects smoothly to the canonical item.
  let targetUrl = rawUrl;
  if (targetUrl.includes("/d/item/")) {
    targetUrl = targetUrl.replace("/d/item/", "/item/");
  }

  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,te;q=0.8",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`OLX responded with status ${response.status} (${response.statusText}). Listing may be inactive.`);
  }

  const html = await response.text();

  // 1. Parse Schema.org application/ld+json scripts
  const ldJsonScripts = [...html.matchAll(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let ldItem: Record<string, unknown> | null = null;
  let breadcrumbs: string[] = [];

  for (const scriptMatch of ldJsonScripts) {
    try {
      const parsed = JSON.parse(scriptMatch[1]) as Record<string, unknown>;
      if (parsed["@type"] === "BreadcrumbList" && Array.isArray(parsed.itemListElement)) {
        breadcrumbs = (parsed.itemListElement as Array<Record<string, unknown>>)
          .map((item) => String(item.name || (item.item as Record<string, unknown>)?.name || ""))
          .filter(Boolean);
      }

      const types = Array.isArray(parsed["@type"]) ? parsed["@type"] : [parsed["@type"]];
      if (
        types.some((t: string) =>
          ["Apartment", "Product", "RealEstateListing", "SingleFamilyResidence", "Place", "House"].includes(t)
        ) ||
        parsed.image ||
        parsed.offers
      ) {
        if (!ldItem || parsed.image) {
          ldItem = parsed;
        }
      }
    } catch {
      // ignore invalid json
    }
  }

  // 2. Extract Clean Photos
  // Real user-uploaded listing photos on OLX Apollo CDN have IDs ending with -IN (or similar country tag)
  // Clean URL: https://apollo.olx.in/v1/files/<id>/image (Zero watermark, original camera file!)
  // HD URL:    https://apollo.olx.in/v1/files/<id>/image;s=1080x1920
  const imageIds = new Set<string>();

  // Add from LD+JSON if available
  if (ldItem?.image) {
    const rawImages = Array.isArray(ldItem.image) ? ldItem.image : [ldItem.image];
    for (const imgUrl of rawImages) {
      if (typeof imgUrl === "string") {
        const idMatch = imgUrl.match(/\/v1\/files\/([a-zA-Z0-9_-]+)\//);
        if (idMatch && idMatch[1]) {
          imageIds.add(idMatch[1]);
        }
      }
    }
  }

  // Scan entire HTML for apollo file IDs
  const unescapedHtml = html.replace(/\\u002F/g, "/");
  const apolloMatches = [...unescapedHtml.matchAll(/https?:\/\/apollo\.olx\.in(?::\d+)?\/v1\/files\/([a-zA-Z0-9_-]+)\/image/gi)];
  for (const m of apolloMatches) {
    const fileId = m[1];
    // Filter out UI icons, background banners, logos
    if (
      !fileId.includes("PANAMERA") &&
      !fileId.startsWith("alias-") &&
      !fileId.startsWith("default") &&
      !fileId.includes("icon") &&
      !fileId.includes("pattern") &&
      !fileId.includes("banner") &&
      !fileId.includes("preview")
    ) {
      imageIds.add(fileId);
    }
  }

  const cleanImages = Array.from(imageIds).map((fileId, index) => ({
    id: fileId || `img-${index}`,
    originalUrl: `https://apollo.olx.in/v1/files/${fileId}/image`,
    hdUrl: `https://apollo.olx.in/v1/files/${fileId}/image;s=1080x1920`,
    thumbnailUrl: `https://apollo.olx.in/v1/files/${fileId}/image;s=505x897`,
    isClean: true,
  }));

  // 3. Extract Title
  let title = ldItem?.name || "";
  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1]
        .replace(/\s*\|\s*OLX.*$/i, "")
        .replace(/\s*-\s*Houses & Apartments.*$/i, "")
        .trim();
    }
  }

  // 4. Extract Rent / Price
  let rent = 0;
  if (ldItem?.offers?.price) {
    rent = parseInt(String(ldItem.offers.price).replace(/[^0-9]/g, ""), 10) || 0;
  }
  if (!rent) {
    const priceMatch = html.match(/"price":\s*\{\s*"value":\s*\{\s*"raw":\s*(\d+)/i) ||
      html.match(/₹\s*([0-9,]+)/i);
    if (priceMatch) {
      rent = parseInt(priceMatch[1].replace(/,/g, ""), 10) || 0;
    }
  }

  const advance = rent > 0 ? rent * 2 : 0;

  // 5. Extract Description
  let description = ldItem?.description || "";
  if (!description) {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) {
      description = descMatch[1];
    }
  }

  description = description
    .replace(/\\n/g, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();

  // 6. Extract Location & Address
  let fullAddress = "";
  let location = "";
  let colony = "";
  let city = "Hyderabad";

  if (typeof ldItem?.address === "string") {
    fullAddress = ldItem.address;
  } else if (ldItem?.address && typeof ldItem.address === "object") {
    fullAddress = [ldItem.address.streetAddress, ldItem.address.addressLocality, ldItem.address.addressRegion]
      .filter(Boolean)
      .join(", ");
  }

  if (fullAddress) {
    const parts = fullAddress.split(",").map((p) => p.trim());
    if (parts.length >= 1) colony = parts[0];
    if (parts.length >= 2) location = parts[1];
    if (parts.length >= 3) city = parts[2];
  }

  if (!colony && breadcrumbs.length > 0) {
    const locCrumb = breadcrumbs.find((c) => !c.toLowerCase().includes("apartment") && !c.toLowerCase().includes("rent") && !c.toLowerCase().includes("olx"));
    if (locCrumb) {
      colony = locCrumb;
      location = locCrumb;
    }
  }

  const fullText = `${title} ${description} ${fullAddress}`.toLowerCase();
  if (fullText.includes("hyderabad") || fullText.includes("secunderabad") || fullText.includes("telangana")) {
    city = "Hyderabad";
  } else if (fullText.includes("bangalore") || fullText.includes("bengaluru")) {
    city = "Bangalore";
  } else if (fullText.includes("mumbai") || fullText.includes("pune")) {
    city = fullText.includes("mumbai") ? "Mumbai" : "Pune";
  } else if (fullText.includes("calicut") || fullText.includes("kozhikode")) {
    city = "Calicut";
  }

  const hyderabadLocalities = [
    "Madhapur", "Gachibowli", "Kondapur", "Hitec City", "Kukatpally", "Jubilee Hills",
    "Banjara Hills", "Manikonda", "Ameerpet", "Begumpet", "Miyapur", "KPHB",
    "Hafeezpet", "Nanakramguda", "Tolichowki", "Mehdipatnam", "Financial District",
    "Tellapur", "Nallagandla", "Attapur", "Somajiguda", "Himayatnagar"
  ];
  for (const loc of hyderabadLocalities) {
    if (new RegExp(`\\b${loc}\\b`, "i").test(fullText)) {
      if (!colony || colony === location) colony = loc;
      location = loc;
      break;
    }
  }

  // 7. Extract Furnishing & Tenant Preferences
  let furnishing = "Semi-Furnished";
  if (/fully\s*furnished/i.test(fullText)) {
    furnishing = "Fully Furnished";
  } else if (/unfurnished/i.test(fullText)) {
    furnishing = "Unfurnished";
  }

  let tenantType: "bachelor" | "family" | "any" = "any";
  if (/\bbachelor(s)?\b/i.test(fullText) && !/\bfamil(y|ies)\s+only\b/i.test(fullText)) {
    tenantType = "bachelor";
  } else if (/\bfamil(y|ies)\s+only\b/i.test(fullText)) {
    tenantType = "family";
  }

  // 8. Extract Bedrooms / BHK
  let bedrooms = ldItem?.numberOfRooms || "";
  if (!bedrooms) {
    const bhkMatch = fullText.match(/(\d)\s*bhk/i) || fullText.match(/(\d)\s*bed/i);
    if (bhkMatch) {
      bedrooms = `${bhkMatch[1]} BHK`;
    }
  } else {
    bedrooms = `${bedrooms} BHK`;
  }

  const phoneMatch = description.match(/\b(?:\+91|0)?[6-9]\d{9}\b/);
  const phone = phoneMatch ? phoneMatch[0] : undefined;

  return {
    sourceUrl: targetUrl,
    platform: "olx",
    title: title || "Room / Apartment for Rent",
    rent,
    advance,
    location: location || "Hyderabad",
    colony: colony || location || "Madhapur",
    city,
    fullAddress: fullAddress || `${colony || "Prime Location"}, ${location || "Hyderabad"}`,
    description,
    furnishing,
    tenantType,
    bedrooms: bedrooms || "1 BHK",
    cleanImages,
    sellerName: ldItem?.offers?.seller || undefined,
    phone,
  };
}

// ─── Generic Real Estate Extractor ───────────────────────────────────────────
async function extractGenericListing(url: string): Promise<ExtractedListing> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = ogTitleMatch ? ogTitleMatch[1] : titleTagMatch ? titleTagMatch[1] : "Rental Property";

  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const description = ogDescMatch ? ogDescMatch[1] : metaDescMatch ? metaDescMatch[1] : "";

  const imageSet = new Set<string>();
  const ogImages = [...html.matchAll(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/gi)];
  for (const m of ogImages) {
    if (m[1] && !m[1].includes("logo") && !m[1].includes("icon")) imageSet.add(m[1]);
  }

  const ldJsonScripts = [...html.matchAll(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const scriptMatch of ldJsonScripts) {
    try {
      const parsed = JSON.parse(scriptMatch[1]);
      if (parsed.image) {
        const imgs = Array.isArray(parsed.image) ? parsed.image : [parsed.image];
        imgs.forEach((img: unknown) => {
          const urlStr = typeof img === "string" ? img : (img as Record<string, unknown>)?.url;
          if (typeof urlStr === "string") imageSet.add(urlStr);
        });
      }
    } catch {}
  }

  const cleanImages = Array.from(imageSet).map((imgUrl, i) => ({
    id: `img-${i}`,
    originalUrl: imgUrl,
    hdUrl: imgUrl,
    thumbnailUrl: imgUrl,
    isClean: true,
  }));

  let rent = 0;
  const priceMatch = html.match(/₹\s*([0-9,]+)/) || html.match(/"price":\s*"?(\d+)"?/i);
  if (priceMatch) {
    rent = parseInt(priceMatch[1].replace(/,/g, ""), 10) || 0;
  }

  return {
    sourceUrl: url,
    platform: "generic",
    title: title.trim(),
    rent,
    advance: rent * 2,
    location: "Hyderabad",
    colony: "Madhapur",
    city: "Hyderabad",
    fullAddress: "Hyderabad, Telangana",
    description: description.trim(),
    furnishing: /fully furnished/i.test(description) ? "Fully Furnished" : "Semi-Furnished",
    tenantType: "any",
    bedrooms: "1 BHK",
    cleanImages,
  };
}
