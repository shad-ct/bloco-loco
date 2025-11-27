const API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent";


async function categorizeSite(title, url, apiKey) {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
You are a strict classification engine.
Your job is to assign the browser history title into exactly one category from the list below.

Allowed Categories :
Education
Entertainment
Social Media
Shopping
News
Adult
Gaming
Sports
Finance
Coding / Programming
AI Tools
Productivity
Health
Travel
Food
Other

Instructions:
- Always respond with only the category name, nothing else.
- If the title doesn’t clearly belong to any category, return “Other”.
- Do not invent new categories.
- Interpret the user’s intent behind the title when needed.
- Stay consistent across similar titles.

Website Title: "${title}"
Website URL: "${url}"

Output: Return only one category from the list.
`;

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      console.error("Gemini API Error Status:", response.status);
      return "Others";
    }

    const data = await response.json();
    const category = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    const validCategories = [
      "Education", "Entertainment", "Gaming", "News", "Social Media",
      "Adult", "Sports", "Shopping", "Coding", "Productivity", "Finance",
      "AI Tools", "Health", "Travel", "Food", "Others"
    ];

    let normalized = category;
    if (normalized === "Coding / Programming") normalized = "Coding";
    if (normalized === "Other") normalized = "Others";

    const match = validCategories.find(c => c.toLowerCase() === normalized?.toLowerCase());
    return match || "Others";

  } catch (error) {
    console.error("Gemini API Exception:", error);
    return "Others";
  }
}

// State
let apiKey = null;
let blockedCategories = {}; 
let blockedTitles = []; 
let blockedSites = [];
let titleCache = {}; 
let bypassList = {}; // { tabId: timestamp }

// Initialize State
function loadState() {
  chrome.storage.local.get(['apiKey', 'blockedCategories', 'blockedTitles', 'blockedSites', 'titleCache'], (result) => {
    apiKey = result.apiKey;
    blockedCategories = result.blockedCategories || {};
    blockedTitles = result.blockedTitles || [];
    blockedSites = result.blockedSites || [];
    titleCache = result.titleCache || {};
    console.log("State loaded:", { blockedCategories, blockedTitles, blockedSites });
  });
}

loadState();

// Keep state in sync
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.apiKey) apiKey = changes.apiKey.newValue;
    if (changes.blockedCategories) blockedCategories = changes.blockedCategories.newValue || {};
    if (changes.blockedTitles) blockedTitles = changes.blockedTitles.newValue || [];
    if (changes.blockedSites) blockedSites = changes.blockedSites.newValue || [];
    if (changes.titleCache) titleCache = changes.titleCache.newValue || {};
    console.log("State updated");
  }
});

// Message Handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setApiKey') {
    apiKey = request.key;
    chrome.storage.local.set({ apiKey });
    sendResponse({ success: true });
  } else if (request.action === 'categorizeHistory') {
    processHistory(request.days).then(sendResponse);
    return true; // Async response
  } else if (request.action === 'addBypass') {
    // Add bypass for 5 minutes
    if (sender.tab) {
        bypassList[sender.tab.id] = Date.now() + 5 * 60 * 1000;
        sendResponse({ success: true });
    }
  }
});

async function processHistory(days) {
  if (!apiKey) return { error: "No API Key" };

  const msPerDay = 1000 * 60 * 60 * 24;
  const startTime = Date.now() - (days * msPerDay);

  const historyItems = await chrome.history.search({
    text: '',
    startTime: startTime,
    maxResults: 50 // Limit to avoid hitting rate limits too fast in demo
  });

  const results = [];
  let cacheUpdates = {};
  let hasUpdates = false;

  for (const item of historyItems) {
    if (!item.title) continue;
    
    // Skip internal extension pages
    if (item.title === "Page Blocked" || item.url.startsWith("chrome-extension://")) continue;

    let category = titleCache[item.title];
    
    if (!category) {
      // Simple rate limiting: wait 500ms between calls
      await new Promise(r => setTimeout(r, 500));
      
      try {
        category = await categorizeSite(item.title, item.url, apiKey);
        cacheUpdates[item.title] = category;
        titleCache[item.title] = category; 
        hasUpdates = true;
      } catch (err) {
        console.error(`Failed to categorize ${item.title}:`, err);
        category = "Others"; // Fallback
      }
    }

    results.push({
      title: item.title,
      url: item.url,
      category: category
    });
  }

  if (hasUpdates) {
    chrome.storage.local.set({ titleCache: { ...titleCache, ...cacheUpdates } });
  }
  
  return { items: results };
}

// Blocking Logic

// 1. Fast Site Blocking (webNavigation)
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId !== 0) return; // Only main frame
  
  const url = details.url;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('edge://')) return;

  // Check Bypass
  if (bypassList[details.tabId] && bypassList[details.tabId] > Date.now()) return;

  // Block by Site (Domain/URL)
  const matchedSite = blockedSites.find(site => site && url.toLowerCase().includes(site.toLowerCase()));
  if (matchedSite) {
    console.log(`Blocking site: ${url} matched ${matchedSite}`);
    chrome.tabs.update(details.tabId, {
      url: chrome.runtime.getURL(`block.html?reason=${encodeURIComponent("Site Blocked")}&detected=${encodeURIComponent(matchedSite)}`)
    });
  }
});

// 2. Title & Category Blocking (tabs.onUpdated)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.title) {
    checkAndBlock(tabId, tab);
  }
});

async function checkAndBlock(tabId, tab) {
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://')) return;

  // Check Bypass
  if (bypassList[tabId] && bypassList[tabId] > Date.now()) return;

  const title = tab.title || "";
  const url = tab.url || "";
  
  // Block by Specific Title (Partial Match)
  const lowerTitle = title.toLowerCase();
  const matchedTitle = blockedTitles.find(blocked => blocked && lowerTitle.includes(blocked.toLowerCase()));

  if (matchedTitle) {
    blockTab(tabId, `Title Blocked: "${matchedTitle}"`, title);
    return;
  }

  // Block by Category
  let category = titleCache[title];
  
  if (!category && apiKey && title) {
    // Try to categorize on the fly
    try {
        category = await categorizeSite(title, url, apiKey);
        titleCache[title] = category;
        chrome.storage.local.set({ titleCache });
    } catch (e) {
        console.error(e);
    }
  }

  if (category && blockedCategories[category]) {
    blockTab(tabId, `Category Blocked: ${category}`, title);
  }
}

function blockTab(tabId, reason, detectedValue) {
  const blockUrl = chrome.runtime.getURL(`block.html?reason=${encodeURIComponent(reason)}&detected=${encodeURIComponent(detectedValue)}`);
  chrome.tabs.update(tabId, { url: blockUrl });
}
