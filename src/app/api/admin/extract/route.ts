import { NextResponse } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

function verifyAdmin(request: Request): boolean {
  return verifyAdminRequest(request);
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
    const { rawHtml, rawText } = body;
    const input = (body.url || rawText || "").trim();

    // Direct HTML/Text mode: bypass network fetch entirely if HTML or apollo links provided
    if (rawHtml && typeof rawHtml === "string" && rawHtml.length > 50) {
      const data = parseOlxHtml(rawHtml, input || "https://www.olx.in");
      return NextResponse.json({ success: true, data });
    }

    if (!input) {
      return NextResponse.json({ error: "Please provide a valid URL or shared text" }, { status: 400 });
    }

    // 1. Extract URL from raw text or input
    const extractedUrl = extractUrlFromText(input);
    if (!extractedUrl) {
      // If raw text has apollo image links directly:
      if (input.includes("apollo.olx.in")) {
        const data = parseOlxHtml(input, "https://www.olx.in");
        return NextResponse.json({ success: true, data });
      }
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
  if (/^\d{8,12}$/.test(text.trim())) {
    return `https://www.olx.in/item/${text.trim()}`;
  }

  const match = text.match(/https?:\/\/[^\s"'<>]+/i);
  if (match) {
    let url = match[0];
    url = url.replace(/[),;.]+$/, "");
    return url;
  }

  if (text.startsWith("olx.in") || text.startsWith("www.olx.in")) {
    return `https://${text}`;
  }

  return null;
}

function isOlxUrl(url: string): boolean {
  return /olx\.(in|com|com\.pk|pl|ro|com\.br|co\.za)/i.test(url);
}

// ─── Resilient Multi-Tier HTML Fetcher ─────────────────────────────────────────
async function fetchHtmlWithFallback(targetUrl: string): Promise<string> {
  let normalizedUrl = targetUrl;
  if (normalizedUrl.includes("/d/item/")) {
    normalizedUrl = normalizedUrl.replace("/d/item/", "/item/");
  }

  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,te;q=0.8",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  // Tier 1: Direct fetch
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(normalizedUrl, {
      headers: browserHeaders,
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();
      if (html && html.length > 500) {
        return html;
      }
    }
  } catch (directErr) {
    console.warn("Direct OLX fetch failed or timed out, trying fallback proxies...", directErr);
  }

  // Tier 2: Resilient Proxies
  const fallbackGateways = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(normalizedUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(normalizedUrl)}`,
    `https://r.jina.ai/${normalizedUrl}`,
  ];

  for (const proxyUrl of fallbackGateways) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(proxyUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const text = await res.text();
        if (text && text.length > 500) {
          return text;
        }
      }
    } catch (_) {}
  }

  throw new Error("OLX is currently blocking server access from this network. Please switch to the 'Paste Page HTML / Text' tab below to extract immediately!");
}

// ─── OLX Listing Extractor ───────────────────────────────────────────────────
async function extractOlxListing(rawUrl: string): Promise<ExtractedListing> {
  const html = await fetchHtmlWithFallback(rawUrl);
  return parseOlxHtml(html, rawUrl);
}

// ─── Core OLX HTML & Data Parser ──────────────────────────────────────────────
function parseOlxHtml(html: string, sourceUrl: string): ExtractedListing {
  // 1. Parse Schema.org application/ld+json scripts
  const ldJsonScripts = [...html.matchAll(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  let ldItem: any = null;
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
    } catch {}
  }

  // 2. Extract Clean Photos from Apollo CDN
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
    const addrObj = ldItem.address as Record<string, string>;
    fullAddress = [addrObj.streetAddress, addrObj.addressLocality, addrObj.addressRegion, addrObj.addressCountry]
      .filter(Boolean)
      .join(", ");
    if (addrObj.addressLocality) colony = addrObj.addressLocality;
    if (addrObj.addressRegion) location = addrObj.addressRegion;
  }

  if (breadcrumbs.length > 1) {
    const relevantCrumbs = breadcrumbs.filter(
      (b) => !["Home", "Properties", "For Rent: Houses & Apartments", "Houses & Apartments"].includes(b)
    );
    if (relevantCrumbs.length >= 2) {
      colony = relevantCrumbs[relevantCrumbs.length - 1];
      location = relevantCrumbs[relevantCrumbs.length - 2];
    } else if (relevantCrumbs.length === 1) {
      location = relevantCrumbs[0];
    }
  }

  if (!location) {
    const locMatch = html.match(/"location":\s*\{[^}]*"name":\s*"([^"]+)"/i) ||
      html.match(/item_location["']\s*:\s*["']([^"']+)["']/i);
    if (locMatch) {
      location = locMatch[1];
    }
  }

  const knownCities = ["Hyderabad", "Bangalore", "Bengaluru", "Mumbai", "Pune", "Delhi", "Chennai", "Kolkata", "Noida", "Gurgaon"];
  for (const c of knownCities) {
    if (new RegExp(c, "i").test(fullAddress) || new RegExp(c, "i").test(location) || new RegExp(c, "i").test(colony)) {
      city = c === "Bengaluru" ? "Bangalore" : c;
      break;
    }
  }

  // 7. Furnishing
  let furnishing = "Semi-Furnished";
  if (/unfurnished/i.test(html) || /unfurnished/i.test(description)) {
    furnishing = "Unfurnished";
  } else if (/fully furnished/i.test(html) || /fully furnished/i.test(description)) {
    furnishing = "Fully Furnished";
  }

  // 8. Tenant Type
  let tenantType: "bachelor" | "family" | "any" = "any";
  if (/bachelor/i.test(description) || /bachelor/i.test(title)) {
    tenantType = "bachelor";
  } else if (/family/i.test(description) || /family/i.test(title)) {
    tenantType = "family";
  }

  // 9. Bedrooms / BHK
  let bedrooms = "1 BHK";
  const bhkMatch = (title + " " + description).match(/(\d)\s*(?:bhk|bed|bedroom)/i);
  if (bhkMatch) {
    bedrooms = `${bhkMatch[1]} BHK`;
  } else if (/1\s*rk/i.test(title + " " + description)) {
    bedrooms = "1 RK";
  }

  // 10. Extract Phone Number
  let phone: string | undefined = undefined;
  const phoneMatch = description.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
  if (phoneMatch) {
    phone = phoneMatch[0].replace(/\s+/g, "");
  }

  return {
    sourceUrl,
    platform: "olx",
    title: title || "Room / Flat for Rent",
    rent,
    advance,
    location: location || "Hyderabad",
    colony: colony || location || "Prime Area",
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
