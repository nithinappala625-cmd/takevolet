import { NextResponse } from "next/server";

/**
 * Pings Google and Bing with the sitemap URL to request re-crawling.
 * Call this API route after new listings are posted.
 * 
 * GET /api/sitemap-ping
 */
export async function GET() {
  const sitemapUrl = "https://takevolet.online/sitemap.xml";

  const results: { engine: string; status: string }[] = [];

  // Ping Google
  try {
    const googleResponse = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );
    results.push({
      engine: "Google",
      status: googleResponse.ok ? "success" : `failed (${googleResponse.status})`,
    });
  } catch (e) {
    results.push({ engine: "Google", status: "error" });
  }

  // Ping Bing / IndexNow
  try {
    const bingResponse = await fetch(
      `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      { method: "GET", signal: AbortSignal.timeout(10000) }
    );
    results.push({
      engine: "Bing",
      status: bingResponse.ok ? "success" : `failed (${bingResponse.status})`,
    });
  } catch (e) {
    results.push({ engine: "Bing", status: "error" });
  }

  return NextResponse.json({
    message: "Sitemap ping completed",
    sitemap: sitemapUrl,
    results,
    timestamp: new Date().toISOString(),
  });
}
