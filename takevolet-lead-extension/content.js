// ─── Takevolet Content Script ────────────────────────────────────────────────
// Precision Instagram comment parser:
// 1. Traverses DOM comment containers + replies
// 2. Dual-engine fallback: Text stream regex parser for nested React DOM
// 3. Captures S.No, Profile Name, Profile URL, Exact Comment Text, Post URL, Date/Age, Intent
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "clipComments") {
      const result = extractAllInstagramComments();
      sendResponse(result);
    }
    if (request.action === "getPageInfo") {
      sendResponse({
        url: window.location.href,
        title: document.title
      });
    }
    return true;
  });

  const TELANGANA_DISTRICTS = [
    "Hyderabad", "Rangareddy", "Medchal-Malkajgiri", "Sangareddy", "Vikarabad",
    "Yadadri Bhuvanagiri", "Nalgonda", "Suryapet", "Siddipet", "Medak", "Kamareddy",
    "Nizamabad", "Karimnagar", "Rajanna Sircilla", "Jagtial", "Peddapalli", "Warangal",
    "Hanamkonda", "Jangaon", "Mahabubabad", "Jayashankar Bhupalpally", "Mulugu",
    "Khammam", "Bhadradri Kothagudem", "Mahabubnagar", "Nagarkurnool", "Wanaparthy",
    "Jogulamba Gadwal", "Narayanpet", "Adilabad", "Nirmal", "Mancherial", "Kumuram Bheem Asifabad",
    "Gachibowli", "Madhapur", "Hitec City", "Kondapur", "Kokapet", "Financial District",
    "Tellapur", "Mokila", "Shadnagar", "Shamshabad", "Kompally", "Bachupally", "Uppal"
  ];

  const HIGH_INTENT_KEYWORDS = [
    "price", "cost", "rate", "location", "details", "interested", "dm", 
    "contact", "number", "call", "phone", "bhk", "sqft", "sq yds", "sqft", 
    "sqyd", "acres", "acre", "gajalu", "gajam", "guntas", "gunta", "slab", 
    "total land", "area", "villa", "plot", "flot", "flat", "apartment", 
    "rera", "hmda", "dtcp", "budget", "ready", "visit", "site visit", 
    "loan", "emi", "advance", "possession", "brochure", "share details", 
    "send details", "where is this", "how much", "available", "negotiable", 
    "vunda", "unnavar", "facing", "corner", "east facing", "west facing", 
    "north facing", "south facing", "road", "water", "electricity", "patta", 
    "passbook", "registered", "resale", "commercial"
  ];

  const SYSTEM_PATHS = new Set([
    "explore", "reels", "reel", "stories", "direct", "accounts",
    "about", "legal", "terms", "privacy", "help", "developer",
    "p", "tv", "live", "tags", "locations", "nametag",
    "web", "emails", "session", "challenge", "ar", "audio"
  ]);

  function detectDistrictFromPage(pageText) {
    if (!pageText) return "All Telangana";
    const lower = pageText.toLowerCase();
    for (const dist of TELANGANA_DISTRICTS) {
      const cleanDist = dist.toLowerCase().replace(/[\s\-_]/g, '');
      if (lower.includes(cleanDist) || lower.includes('#' + cleanDist)) {
        return dist;
      }
    }
    return "All Telangana";
  }

  function calculateIntent(text) {
    if (!text || text.trim().length === 0) return "low";
    const lower = text.toLowerCase();
    
    // Indian 10-digit mobile number
    if (/(\+91[\-\s]?)?[6-9]\d{9}/.test(text)) return "high";

    for (const kw of HIGH_INTENT_KEYWORDS) {
      if (lower.includes(kw)) return "high";
    }

    if (text.length > 20) return "medium";
    return "low";
  }

  /**
   * Main Comment Extraction Function
   */
  function extractAllInstagramComments() {
    const postUrl = window.location.href;
    const leads = [];
    const seenUsernames = new Set();
    const detectedArea = detectDistrictFromPage(document.body.innerText);

    // ── Method 1: DOM Container Walker (Inspect comment rows & replies) ──
    const commentContainers = document.querySelectorAll('ul li, div[role="button"], article div');
    
    commentContainers.forEach(container => {
      const userLink = container.querySelector('a[href^="/"]');
      if (!userLink) return;

      const href = userLink.getAttribute('href') || '';
      const m = href.match(/^\/([a-zA-Z0-9._]{1,30})\/?$/);
      if (!m) return;

      const username = m[1];
      if (SYSTEM_PATHS.has(username.toLowerCase())) return;
      if (seenUsernames.has(username.toLowerCase())) return;

      // Extract comment text from Instagram specific classes or spans
      let commentText = "";
      const textSpan = container.querySelector('span._a9zs, div._a9zs, span[dir="auto"], span.x193iq5w');
      if (textSpan && textSpan.textContent.trim() !== username) {
        commentText = textSpan.textContent.trim();
      }

      // If textSpan empty or same as username, parse text content cleanly
      if (!commentText) {
        commentText = cleanContainerText(container, username);
      }

      // Extract time elapsed / date (e.g. 4d, 7h, 5d ago)
      let timeText = "";
      const timeTag = container.querySelector('time');
      if (timeTag) {
        timeText = timeTag.textContent.trim() || timeTag.getAttribute('datetime') || "";
      }
      if (!timeText) {
        const timeMatch = container.textContent.match(/\b(\d+[smhdw]|\d+\s*days?\s*ago|\d+\s*hours?\s*ago)\b/i);
        if (timeMatch) timeText = timeMatch[1];
      }

      const intent = calculateIntent(commentText);
      seenUsernames.add(username.toLowerCase());

      leads.push({
        name: "@" + username,
        profile_url: "https://www.instagram.com/" + username + "/",
        comment_text: commentText || "Commented on post",
        comment_date: timeText || "Recent",
        intent: intent,
        is_serious: intent === "high",
        location: detectedArea,
        source_url: postUrl,
        platform: "Instagram"
      });
    });

    // ── Method 2: High-Precision Text Stream Engine ────────────────────
    // If Method 1 captured fewer than 3 leads, parse the visible text stream
    if (leads.length < 3) {
      const fullText = document.body.innerText || "";
      
      // Match pattern: {username} [{time}] {comment} [{likes} likes] Reply
      const streamRegex = /([a-zA-Z0-9._]{3,30})\s*(?:(\d+[smhdw]|[\d]+\s*days?\s*ago|[\d]+\s*hours?\s*ago)?\s*)([\s\S]*?)(?:\s*(?:\d+\s*likes?|\d+\s*like)\s*Reply|\s*Reply)(?:\s*See translation)?(?:\s*View (?:all\s*)?\d+\s*replies)?/gi;
      
      let match;
      while ((match = streamRegex.exec(fullText)) !== null) {
        const u = match[1];
        const t = match[2] || "";
        let c = (match[3] || "").trim();

        if (SYSTEM_PATHS.has(u.toLowerCase())) continue;
        if (seenUsernames.has(u.toLowerCase())) continue;

        // Clean leftover trailing metadata from comment
        c = c.replace(/\b\d+\s*likes?\b/gi, '').replace(/\bReply\b/gi, '').replace(/•/g, '').trim();

        if (c.length > 0) {
          const intent = calculateIntent(c);
          seenUsernames.add(u.toLowerCase());
          leads.push({
            name: "@" + u,
            profile_url: "https://www.instagram.com/" + u + "/",
            comment_text: c,
            comment_date: t || "Recent",
            intent: intent,
            is_serious: intent === "high",
            location: detectedArea,
            source_url: postUrl,
            platform: "Instagram"
          });
        }
      }
    }

    // Sort: Serious buyers first
    leads.sort((a, b) => {
      const scoreA = a.intent === "high" ? 3 : a.intent === "medium" ? 2 : 1;
      const scoreB = b.intent === "high" ? 3 : b.intent === "medium" ? 2 : 1;
      return scoreB - scoreA;
    });

    return {
      success: true,
      postUrl: postUrl,
      detectedLocation: detectedArea,
      count: leads.length,
      highIntentCount: leads.filter(l => l.intent === "high").length,
      leads: leads
    };
  }

  function cleanContainerText(container, username) {
    if (!container) return "";
    const clone = container.cloneNode(true);
    clone.querySelectorAll('button, svg, img, script, style').forEach(n => n.remove());

    let raw = clone.textContent || "";
    const uRegex = new RegExp(`@?${escapeRegex(username)}`, 'gi');
    raw = raw.replace(uRegex, ' ');

    raw = raw
      .replace(/•/g, ' ')
      .replace(/\b\d+\s*(likes?|liked|views?)\b/gi, ' ')
      .replace(/\b\d+\s*[smhdw]\b/gi, ' ')
      .replace(/\b(Reply|Replies|View all \d+ replies|View replies|Hide replies|See translation|View more answers|Author|Follow)\b/gi, ' ')
      .replace(/\b(Edited|Translated)\b/gi, ' ');

    return raw.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
})();
