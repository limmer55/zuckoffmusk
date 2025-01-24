// Blocking enabled/disabled status
let isBlockingEnabled = true;

// List of blocked URL patterns
let blockedUrls = [];

// Counter for blocked pages
let blockCount = 0;

/*******************************
 * Load block count from Chrome storage.
 *******************************/
async function loadBlockCountFromStorage() {
  const result = await chrome.storage.local.get("blockCount");
  if (typeof result.blockCount === "number") {
    blockCount = result.blockCount;
  }
}

/*******************************
 * Save block count to Chrome storage.
 *******************************/
function saveBlockCountToStorage() {
  chrome.storage.local.set({ blockCount });
}

/*******************************
 * Load blocked URL patterns from an external JSON file.
 *******************************/
async function loadBlockedUrls() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/limmer55/zuckoffmusk/main/blocked-urls.json");
    const data = await response.json();
    blockedUrls = data.blocked || [];
  } catch (error) {
    console.error("Failed to load blocked URLs:", error);
  }
}

/*******************************
 * Determine priority based on URL pattern.
 *******************************/
function determinePriority(pattern) {
  const isApexDomain = /^(\*\:\/\/)(?!\*\.)[^*]+\/\*$/.test(pattern);
  return isApexDomain ? 2 : 1;
}

/*******************************
 * Update Chrome blocking rules using declarativeNetRequest.
 *******************************/
function updateBlockingRules() {
  const rules = blockedUrls.map((pattern, i) => ({
    id: i + 1,
    priority: determinePriority(pattern),
    action: { type: "redirect", redirect: { url: chrome.runtime.getURL("blocked.html") } },
    condition: { urlFilter: pattern, resourceTypes: ["main_frame"] },
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error updating rules:", chrome.runtime.lastError);
    } else {
      console.log("Blocking rules updated:", rules);
    }
  });
}

/*******************************
 * Toggle blocking and update rules.
 *******************************/
function toggleBlocking() {
  isBlockingEnabled = !isBlockingEnabled;
  updateIcon();

  if (isBlockingEnabled) {
    updateBlockingRules();
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: blockedUrls.map((_, i) => i + 1)
    });
  }
}

/*******************************
 * Update the extension icon based on blocking status.
 *******************************/
function updateIcon() {
  const iconPath = isBlockingEnabled ? "icons/icon-on.png" : "icons/icon-off.png";
  chrome.action.setIcon({ path: iconPath });
}

/********************************************************************
 * Track when each domain was last blocked to limit counting frequency.
 ********************************************************************/
let domainLastBlockedTime = {};
const TIME_WINDOW = 1000; // 1 second

/*******************************
 * Listener for rule matches.
 *******************************/
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
  if (!isBlockingEnabled) return;

  let urlObj;
  try {
    urlObj = new URL(info.request.url);
  } catch (err) {
    console.error("URL parsing error:", err);
    return;
  }

  const domain = urlObj.hostname.replace(/^www\./, "");
  const now = Date.now();
  const lastTime = domainLastBlockedTime[domain] || 0;

  if (now - lastTime > TIME_WINDOW) {
    blockCount++;
    saveBlockCountToStorage();
    domainLastBlockedTime[domain] = now;
    console.log(`Blocked pages: ${blockCount} (Domain: ${domain})`);
  } else {
    console.log(`Domain "${domain}" was blocked less than ${TIME_WINDOW}ms ago. Ignored.`);
  }
});

/*******************************
 * Message listener for popup.js actions.
 *******************************/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleBlocking") {
    toggleBlocking();
    sendResponse({ isBlockingEnabled });
  } else if (request.action === "checkStatus") {
    sendResponse({ isBlockingEnabled });
  } else if (request.action === "getBlockCount") {
    sendResponse({ blockCount });
  }
  return true; // Allow async sendResponse
});

/*******************************
 * Toggle blocking on extension icon click.
 *******************************/
chrome.action.onClicked.addListener(() => {
  toggleBlocking();
});

/*******************************
 * Initialization function.
 *******************************/
async function init() {
  await loadBlockCountFromStorage();
  await loadBlockedUrls();
  updateBlockingRules();
  updateIcon();
}

function updateBlockingRules() {
  const rules = blockedUrls.map((pattern, i) => ({
    id: i + 1,
    priority: determinePriority(pattern),
    action: { 
      type: "redirect", 
      redirect: { url: `${chrome.runtime.getURL("blocked.html")}?url=${encodeURIComponent(pattern)}` } 
    },
    condition: { urlFilter: pattern, resourceTypes: ["main_frame"] },
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error updating rules:", chrome.runtime.lastError);
    } else {
      console.log("Blocking rules updated:", rules);
    }
  });
}


init();
