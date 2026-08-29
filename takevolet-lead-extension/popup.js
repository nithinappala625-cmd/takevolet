// ─── Takevolet Lead Clipper & Messenger Extension ───────────────────────────

const DEFAULT_SETTINGS = {
  crmUrl: "http://localhost:3000",
  crmPassword: "Nithin@Takevolet2026",
  agentName: "Takevolet Team",
  tplBuyer: "Hi {name}! 👋 I noticed you commented '{comment}' regarding property in {location}. At Takevolet, we have verified direct-owner & builder options in {location}. Would you like me to share the brochure & price breakdown?",
  tplVilla: "Hello {name}! Saw your interest in luxury properties. We have exclusive gated villa projects across {location} with zero brokerage. Let me know if you'd like a quick video walkthrough!",
  tplPlot: "Hi {name}! If you're exploring high-growth open plots near {location}, we have HMDA/RERA approved plots starting at great prices with Takevolet verified titles. Happy to share details!",
  tplRental: "Hi {name}! Looking for flats / flatmates in {location}? We have verified zero-brokerage rooms & 2BHK/3BHK ready to move. Let me know your preferred move-in date!",
  tplShort: "Hi {name}! Are you looking for property in {location}? We have verified options available with zero brokerage. Let us know your requirements!"
};

let currentSettings = { ...DEFAULT_SETTINGS };
let cachedLeads = [];
let discoveredBulkLeads = [];
let filterSeriousOnly = false;

// ─── Initialize Extension ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  await loadSettings();
  setupTabs();
  setupFormListeners();
  setupBulkClipListeners();
  setupTemplateListeners();
  setupSettingsListeners();
  autoDetectCurrentTab();
  loadCRMLeads();
});

// ─── Load Settings from Storage ─────────────────────────────────────────────
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage?.local?.get(DEFAULT_SETTINGS, (stored) => {
      currentSettings = { ...DEFAULT_SETTINGS, ...stored };
      
      document.getElementById("crmUrl").value = currentSettings.crmUrl;
      document.getElementById("crmPassword").value = currentSettings.crmPassword;
      document.getElementById("agentName").value = currentSettings.agentName;

      document.getElementById("tplBuyer").value = currentSettings.tplBuyer;
      document.getElementById("tplVilla").value = currentSettings.tplVilla;
      document.getElementById("tplPlot").value = currentSettings.tplPlot;

      updateMessagePreview();
      resolve(true);
    });
  });
}

// ─── Tab Switching ──────────────────────────────────────────────────────────
function setupTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      const target = tab.getAttribute("data-tab");
      document.getElementById(target)?.classList.add("active");

      if (target === "tab-leads") {
        loadCRMLeads();
      }
    });
  });
}

// ─── Auto-Detect from Active Tab ────────────────────────────────────────────
function autoDetectCurrentTab() {
  if (!chrome.tabs) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const activeTab = tabs[0];
    const url = activeTab.url || "";

    const profileInput = document.getElementById("profileUrl");
    const sourceInput = document.getElementById("sourceUrl");
    const nameInput = document.getElementById("leadName");

    if (url.includes("instagram.com")) {
      if (url.includes("/reel/") || url.includes("/p/")) {
        sourceInput.value = url;
      } else {
        profileInput.value = url;
        const match = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
        if (match && match[1] && !["explore", "reels", "direct", "stories"].includes(match[1])) {
          nameInput.value = "@" + match[1];
        }
      }
    } else if (url.includes("facebook.com") || url.includes("youtube.com")) {
      sourceInput.value = url;
    }

    updateMessagePreview();
  });
}

// ─── ⚡ Bulk Clip Visible Comments ─────────────────────────────────────────
function setupBulkClipListeners() {
  const btnBulkClip = document.getElementById("btnBulkClip");
  const btnCloseBulk = document.getElementById("btnCloseBulk");
  const btnSaveBulkToCRM = document.getElementById("btnSaveBulkToCRM");
  const btnExportBulkExcel = document.getElementById("btnExportBulkExcel");
  const btnExportAllExcel = document.getElementById("btnExportAllExcel");
  const btnFilterSerious = document.getElementById("btnFilterSerious");
  const btnSelectAllBulk = document.getElementById("btnSelectAllBulk");

  btnBulkClip.addEventListener("click", handleBulkClip);
  btnCloseBulk.addEventListener("click", () => {
    document.getElementById("bulkLeadsContainer").classList.add("hidden");
  });

  btnFilterSerious.addEventListener("click", () => {
    filterSeriousOnly = !filterSeriousOnly;
    btnFilterSerious.classList.toggle("active", filterSeriousOnly);
    
    discoveredBulkLeads.forEach(l => {
      l.selected = filterSeriousOnly ? (l.intent === "high") : true;
    });
    renderBulkList();
  });

  btnSelectAllBulk.addEventListener("click", () => {
    const allSelected = discoveredBulkLeads.every(l => l.selected);
    discoveredBulkLeads.forEach(l => {
      l.selected = !allSelected;
    });
    renderBulkList();
  });

  btnSaveBulkToCRM.addEventListener("click", handleSaveBulkToCRM);
  btnExportBulkExcel.addEventListener("click", () => {
    const selected = discoveredBulkLeads.filter(l => l.selected);
    exportToExcel(selected.length > 0 ? selected : discoveredBulkLeads, "Telangana_Clipped_Comments");
  });
  btnExportAllExcel.addEventListener("click", () => exportToExcel(cachedLeads, "Takevolet_All_CRM_Leads"));
}

async function handleBulkClip() {
  const btn = document.getElementById("btnBulkClip");
  btn.disabled = true;
  btn.innerText = "⏳ Reading All Comments & Replies...";

  if (!chrome.tabs) {
    showNotification("Chrome Tabs API not available", "error");
    btn.disabled = false;
    btn.innerText = "⚡ Clip All Visible Comments (1-Click)";
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (!tabs || tabs.length === 0) {
      btn.disabled = false;
      btn.innerText = "⚡ Clip All Visible Comments (1-Click)";
      return;
    }

    const activeTab = tabs[0];
    const url = activeTab.url || "";

    if (!url.includes("instagram.com")) {
      showNotification("Please open an Instagram Post or Reel with comments first!", "error");
      btn.disabled = false;
      btn.innerText = "⚡ Clip All Visible Comments (1-Click)";
      return;
    }

    try {
      chrome.tabs.sendMessage(activeTab.id, { action: "clipComments" }, (response) => {
        if (chrome.runtime.lastError || !response) {
          chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ["content.js"]
          }, () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab.id, { action: "clipComments" }, (res2) => {
                btn.disabled = false;
                btn.innerText = "⚡ Clip All Visible Comments (1-Click)";
                processBulkResponse(res2, url);
              });
            }, 300);
          });
        } else {
          btn.disabled = false;
          btn.innerText = "⚡ Clip All Visible Comments (1-Click)";
          processBulkResponse(response, url);
        }
      });
    } catch (e) {
      btn.disabled = false;
      btn.innerText = "⚡ Clip All Visible Comments (1-Click)";
      showNotification("Error: " + e.message, "error");
    }
  });
}

function processBulkResponse(response, pageUrl) {
  if (!response || !response.leads || response.leads.length === 0) {
    showNotification("No comments detected. Ensure comments are open on screen!", "error");
    return;
  }

  // Auto-select detected district (e.g. Mancherial, Warangal, Gachibowli) if found in post
  if (response.detectedLocation && response.detectedLocation !== "All Telangana") {
    const locSelect = document.getElementById("bulkLocation");
    for (let opt of locSelect.options) {
      if (opt.value.toLowerCase() === response.detectedLocation.toLowerCase()) {
        locSelect.value = opt.value;
        break;
      }
    }
  }

  const defaultArea = document.getElementById("bulkLocation").value;
  const defaultCategory = document.getElementById("bulkCategory").value;

  discoveredBulkLeads = response.leads.map((l, index) => ({
    id: "bulk_" + index + "_" + Date.now(),
    s_no: index + 1,
    name: l.name,
    profile_url: l.profile_url,
    comment_text: l.comment_text,
    comment_date: l.comment_date || "Recent",
    intent: l.intent || "low",
    is_serious: l.intent === "high",
    selected: true,
    source_url: pageUrl,
    location: l.location || defaultArea,
    category: defaultCategory,
    status: "new",
    created_at: new Date().toISOString()
  }));

  document.getElementById("bulkCount").innerText = discoveredBulkLeads.length;
  document.getElementById("bulkLeadsContainer").classList.remove("hidden");
  
  renderBulkList();

  const highCount = discoveredBulkLeads.filter(l => l.intent === "high").length;
  showNotification(`⚡ Captured ${discoveredBulkLeads.length} comments (${highCount} Serious Buyers 🔥)!`, "success");
}

function renderBulkList() {
  const listScroll = document.getElementById("bulkListScroll");
  const selectedCount = discoveredBulkLeads.filter(l => l.selected).length;

  document.getElementById("bulkSelectedCount").innerText = selectedCount;
  document.getElementById("btnSaveCount").innerText = selectedCount;

  const seriousLeads = discoveredBulkLeads.filter(l => l.intent === "high");
  const generalLeads = discoveredBulkLeads.filter(l => l.intent !== "high");

  let html = "";

  // ── Box 1: 🔥 Serious Inquiries Box ──
  if (seriousLeads.length > 0) {
    html += `
      <div class="box-divider-label box-divider-serious">
        <span>🔥 Serious Buyers & Property Inquiries</span>
        <span>(${seriousLeads.length})</span>
      </div>
    `;
    html += seriousLeads.map((l) => {
      const globalIdx = discoveredBulkLeads.findIndex(x => x.id === l.id);
      return `
        <div class="bulk-item-card serious">
          <input type="checkbox" class="bulk-item-checkbox" data-idx="${globalIdx}" ${l.selected ? 'checked' : ''}>
          <div class="bulk-item-body">
            <div class="bulk-item-top">
              <span class="bulk-item-name">#${l.s_no} ${escapeHtml(l.name)}</span>
              <span class="badge-intent-high">🔥 High Intent (${escapeHtml(l.comment_date)})</span>
            </div>
            <div class="bulk-item-comment">
              "${escapeHtml(l.comment_text)}"
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── Box 2: 💬 All General Comments Box ──
  if (generalLeads.length > 0) {
    html += `
      <div class="box-divider-label box-divider-general">
        <span>💬 Other Comments & Reactions</span>
        <span>(${generalLeads.length})</span>
      </div>
    `;
    html += generalLeads.map((l) => {
      const globalIdx = discoveredBulkLeads.findIndex(x => x.id === l.id);
      const badgeHtml = l.intent === "medium" 
        ? `<span class="badge-intent-med">💬 Inquiry (${escapeHtml(l.comment_date)})</span>` 
        : `<span class="text-muted text-xs">${escapeHtml(l.comment_date)}</span>`;

      return `
        <div class="bulk-item-card">
          <input type="checkbox" class="bulk-item-checkbox" data-idx="${globalIdx}" ${l.selected ? 'checked' : ''}>
          <div class="bulk-item-body">
            <div class="bulk-item-top">
              <span class="bulk-item-name">#${l.s_no} ${escapeHtml(l.name)}</span>
              ${badgeHtml}
            </div>
            <div class="bulk-item-comment">
              "${escapeHtml(l.comment_text)}"
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  listScroll.innerHTML = html;

  document.querySelectorAll(".bulk-item-checkbox").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const idx = parseInt(e.target.getAttribute("data-idx"), 10);
      discoveredBulkLeads[idx].selected = e.target.checked;
      
      const newSelectedCount = discoveredBulkLeads.filter(l => l.selected).length;
      document.getElementById("bulkSelectedCount").innerText = newSelectedCount;
      document.getElementById("btnSaveCount").innerText = newSelectedCount;
    });
  });
}

// ─── Save Bulk Leads to Takevolet CRM ────────────────────────────────────────
async function handleSaveBulkToCRM() {
  const selectedLeads = discoveredBulkLeads.filter(l => l.selected);
  if (selectedLeads.length === 0) {
    showNotification("Please select at least one lead to save!", "error");
    return;
  }

  const area = document.getElementById("bulkLocation").value;
  const category = document.getElementById("bulkCategory").value;
  const btn = document.getElementById("btnSaveBulkToCRM");

  btn.disabled = true;
  btn.innerText = `⏳ Saving ${selectedLeads.length} leads...`;

  let savedCount = 0;

  for (const lead of selectedLeads) {
    const payload = {
      name: lead.name,
      profile_url: lead.profile_url,
      source_url: lead.source_url,
      comment_text: lead.comment_text,
      location: area,
      category: category,
      platform: "Instagram",
      notes: `[${lead.comment_date}] ` + (lead.intent === "high" ? "🔥 High Intent. " : "") + `Captured on ${new Date().toLocaleDateString()}`
    };

    try {
      const res = await fetch(`${currentSettings.crmUrl}/api/admin/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": currentSettings.crmPassword
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        savedCount++;
        cachedLeads.unshift({ ...payload, id: Date.now() + Math.random(), created_at: new Date().toISOString() });
      }
    } catch (e) {
      cachedLeads.unshift({ ...payload, id: Date.now() + Math.random(), created_at: new Date().toISOString() });
      savedCount++;
    }
  }

  chrome.storage?.local?.set({ cachedLeads: cachedLeads.slice(0, 200) });

  btn.disabled = false;
  btn.innerText = "💾 Save Selected to Takevolet CRM";
  showNotification(`✅ Successfully saved ${savedCount} leads to Takevolet CRM!`, "success");
  document.getElementById("bulkLeadsContainer").classList.add("hidden");
}

// ─── 📊 Export to Excel (.CSV) Function with S.No and Date ───────────────────
function exportToExcel(leadsArray, filenamePrefix = "Telangana_Leads") {
  if (!leadsArray || leadsArray.length === 0) {
    showNotification("No leads available to export!", "error");
    return;
  }

  const headers = [
    "S.No",
    "Lead Name / Handle",
    "Customer Comment / Inquiry",
    "Intent / Priority",
    "Instagram Profile URL",
    "Source Post / Reel URL",
    "Telangana District / Location",
    "Interest Category",
    "Comment Date / Age",
    "Budget",
    "Status",
    "Date Captured"
  ];

  const rows = leadsArray.map((l, idx) => [
    `"${l.s_no || (idx + 1)}"`,
    `"${(l.name || '').replace(/"/g, '""')}"`,
    `"${(l.comment_text || '').replace(/"/g, '""')}"`,
    `"${(l.intent === 'high' || l.is_serious ? '🔥 High Intent (Serious Buyer)' : 'General Inquiry').replace(/"/g, '""')}"`,
    `"${(l.profile_url || '').replace(/"/g, '""')}"`,
    `"${(l.source_url || '').replace(/"/g, '""')}"`,
    `"${(l.location || 'All Telangana').replace(/"/g, '""')}"`,
    `"${(l.category || 'Real Estate').replace(/"/g, '""')}"`,
    `"${(l.comment_date || 'Recent').replace(/"/g, '""')}"`,
    `"${(l.budget || '').replace(/"/g, '""')}"`,
    `"${(l.status || 'new').replace(/"/g, '""')}"`,
    `"${new Date(l.created_at || Date.now()).toLocaleString()}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_${timestamp}.csv`;

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showNotification(`📊 Exported ${leadsArray.length} leads with S.No & Comments to Excel!`, "success");
}

// ─── Single Lead Form & Message Listeners ───────────────────────────────────
function setupFormListeners() {
  const leadName = document.getElementById("leadName");
  const leadLocation = document.getElementById("leadLocation");
  const leadCategory = document.getElementById("leadCategory");
  const commentText = document.getElementById("commentText");
  const msgTemplateSelect = document.getElementById("msgTemplateSelect");
  const btnAutoDetect = document.getElementById("btnAutoDetect");
  const btnCopyMsg = document.getElementById("btnCopyMsg");
  const btnOpenDM = document.getElementById("btnOpenDM");
  const btnSaveLead = document.getElementById("btnSaveLead");

  leadName.addEventListener("input", updateMessagePreview);
  leadLocation.addEventListener("change", updateMessagePreview);
  leadCategory.addEventListener("change", updateMessagePreview);
  commentText.addEventListener("input", updateMessagePreview);
  msgTemplateSelect.addEventListener("change", updateMessagePreview);

  btnAutoDetect.addEventListener("click", () => {
    autoDetectCurrentTab();
    showNotification("Tab detected successfully!", "success");
  });

  btnCopyMsg.addEventListener("click", () => {
    const msg = document.getElementById("msgPreview").value;
    if (!msg) return;
    navigator.clipboard.writeText(msg).then(() => {
      showNotification("Message copied to clipboard! Ready to paste in DM.", "success");
    });
  });

  btnOpenDM.addEventListener("click", () => {
    const name = document.getElementById("leadName").value.trim().replace("@", "");
    const profileUrl = document.getElementById("profileUrl").value.trim();

    let targetUrl = "";
    if (name) {
      targetUrl = `https://ig.me/m/${name}`;
    } else if (profileUrl) {
      targetUrl = profileUrl;
    } else {
      targetUrl = "https://instagram.com/direct/inbox/";
    }

    if (chrome.tabs) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, "_blank");
    }
  });

  btnSaveLead.addEventListener("click", handleSaveLead);
}

// ─── Dynamic Message Generator ─────────────────────────────────────────────
function updateMessagePreview() {
  const name = document.getElementById("leadName").value.trim() || "there";
  const location = document.getElementById("leadLocation").value;
  const category = document.getElementById("leadCategory").value;
  const comment = document.getElementById("commentText").value.trim() || "your inquiry";
  const templateType = document.getElementById("msgTemplateSelect").value;

  let templateText = currentSettings.tplBuyer;
  if (templateType === "villa") templateText = currentSettings.tplVilla;
  if (templateType === "plot") templateText = currentSettings.tplPlot;
  if (templateType === "rental") templateText = currentSettings.tplRental;
  if (templateType === "short") templateText = currentSettings.tplShort;

  let formatted = templateText
    .replace(/{name}/g, name.startsWith("@") ? name.substring(1) : name)
    .replace(/{location}/g, location)
    .replace(/{category}/g, category)
    .replace(/{comment}/g, comment)
    .replace(/{agent}/g, currentSettings.agentName);

  document.getElementById("msgPreview").value = formatted;
}

// ─── Save Single Lead to Takevolet CRM ──────────────────────────────────────
async function handleSaveLead() {
  const name = document.getElementById("leadName").value.trim();
  const location = document.getElementById("leadLocation").value;
  const category = document.getElementById("leadCategory").value;
  const budget = document.getElementById("leadBudget").value.trim();
  const profileUrl = document.getElementById("profileUrl").value.trim();
  const sourceUrl = document.getElementById("sourceUrl").value.trim();
  const commentText = document.getElementById("commentText").value.trim();

  if (!name && !profileUrl) {
    showNotification("Please provide at least a Lead Name or Profile URL.", "error");
    return;
  }

  const leadPayload = {
    name: name || "Instagram Lead",
    location: location,
    category: category,
    budget: budget,
    profile_url: profileUrl,
    source_url: sourceUrl,
    comment_text: commentText,
    platform: "Instagram",
    notes: `Captured via Extension on ${new Date().toLocaleDateString()}`
  };

  const btn = document.getElementById("btnSaveLead");
  btn.disabled = true;
  btn.innerText = "⏳ Saving to CRM...";

  try {
    const res = await fetch(`${currentSettings.crmUrl}/api/admin/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": currentSettings.crmPassword
      },
      body: JSON.stringify(leadPayload)
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showNotification("✅ Lead saved to Takevolet CRM successfully!", "success");
      cachedLeads.unshift({ ...leadPayload, id: result.lead?.id || Date.now(), created_at: new Date().toISOString() });
      chrome.storage?.local?.set({ cachedLeads: cachedLeads.slice(0, 200) });
      document.getElementById("commentText").value = "";
    } else {
      showNotification(`⚠️ Note: ${result.warning || result.error || "Saved locally"}`, "success");
    }
  } catch (err) {
    cachedLeads.unshift({ ...leadPayload, id: Date.now(), created_at: new Date().toISOString(), offline: true });
    chrome.storage?.local?.set({ cachedLeads: cachedLeads.slice(0, 200) });
    showNotification("✅ Saved locally to extension (CRM Server is offline)", "success");
  } finally {
    btn.disabled = false;
    btn.innerText = "💾 Save Single Lead to Takevolet CRM";
  }
}

// ─── Templates Tab Listeners ────────────────────────────────────────────────
function setupTemplateListeners() {
  document.getElementById("btnSaveTemplates").addEventListener("click", () => {
    currentSettings.tplBuyer = document.getElementById("tplBuyer").value;
    currentSettings.tplVilla = document.getElementById("tplVilla").value;
    currentSettings.tplPlot = document.getElementById("tplPlot").value;

    chrome.storage?.local?.set(currentSettings, () => {
      showNotification("Templates saved successfully!", "success");
      updateMessagePreview();
    });
  });
}

// ─── Settings Tab Listeners ────────────────────────────────────────────────
function setupSettingsListeners() {
  document.getElementById("btnSaveSettings").addEventListener("click", () => {
    currentSettings.crmUrl = document.getElementById("crmUrl").value.trim().replace(/\/$/, "");
    currentSettings.crmPassword = document.getElementById("crmPassword").value.trim();
    currentSettings.agentName = document.getElementById("agentName").value.trim();

    chrome.storage?.local?.set(currentSettings, () => {
      showNotification("Settings updated!", "success");
      checkConnection();
    });
  });

  document.getElementById("btnTestConn").addEventListener("click", checkConnection);
}

async function checkConnection() {
  const indicator = document.getElementById("connIndicator");
  indicator.className = "status-dot offline";

  try {
    const res = await fetch(`${currentSettings.crmUrl}/api/admin/leads`, {
      headers: { "x-admin-password": currentSettings.crmPassword }
    });
    if (res.ok) {
      indicator.className = "status-dot online";
      showNotification("Connected to Takevolet CRM successfully!", "success");
    } else {
      showNotification("Failed to authenticate with CRM. Check password.", "error");
    }
  } catch (err) {
    indicator.className = "status-dot offline";
    showNotification("Cannot reach CRM Server at " + currentSettings.crmUrl, "error");
  }
}

// ─── Load & Render CRM Leads ────────────────────────────────────────────────
async function loadCRMLeads() {
  try {
    const res = await fetch(`${currentSettings.crmUrl}/api/admin/leads`, {
      headers: { "x-admin-password": currentSettings.crmPassword }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.leads && data.leads.length > 0) {
        cachedLeads = data.leads;
      }
    }
  } catch (e) {
    chrome.storage?.local?.get(["cachedLeads"], (res) => {
      if (res.cachedLeads) cachedLeads = res.cachedLeads;
      renderLeadsList();
    });
    return;
  }

  renderLeadsList();
}

function renderLeadsList() {
  const leadsContainer = document.getElementById("leadsList");
  const countSpan = document.getElementById("leadsCount");
  countSpan.innerText = cachedLeads.length;

  if (cachedLeads.length === 0) {
    leadsContainer.innerHTML = `<div class="empty-state">No leads captured yet. Clip comments from social posts to see them here!</div>`;
    return;
  }

  leadsContainer.innerHTML = cachedLeads.map((lead, idx) => `
    <div class="lead-item">
      <div class="lead-item-header">
        <span class="lead-name">#${idx + 1} ${escapeHtml(lead.name)}</span>
        <span class="badge badge-gold">${escapeHtml(lead.location || "Telangana")}</span>
      </div>
      <div class="lead-meta">
        <span>📍 ${escapeHtml(lead.category || "Buyer")}</span>
        ${lead.budget ? `<span>💰 ${escapeHtml(lead.budget)}</span>` : ""}
      </div>
      ${lead.comment_text ? `<div class="lead-comment">"${escapeHtml(lead.comment_text)}"</div>` : ""}
      <div class="lead-actions">
        ${lead.profile_url ? `<a href="${escapeHtml(lead.profile_url)}" target="_blank" class="btn btn-sm btn-ghost">🔗 Profile</a>` : ""}
        <button class="btn btn-sm btn-gold btn-lead-dm" data-name="${escapeHtml(lead.name)}">💬 DM</button>
      </div>
    </div>
  `).join("");

  document.querySelectorAll(".btn-lead-dm").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const name = e.target.getAttribute("data-name").replace("@", "");
      if (chrome.tabs) {
        chrome.tabs.create({ url: `https://ig.me/m/${name}` });
      } else {
        window.open(`https://ig.me/m/${name}`, "_blank");
      }
    });
  });
}

// ─── Notification Helper ────────────────────────────────────────────────────
function showNotification(msg, type = "success") {
  const el = document.getElementById("saveNotification");
  el.innerText = msg;
  el.className = `notification ${type}`;
  el.classList.remove("hidden");

  setTimeout(() => {
    el.classList.add("hidden");
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
