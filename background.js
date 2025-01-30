// Blocking enabled/disabled status
let isBlockingEnabled = true;

// List of blocked URL patterns
let blockedUrls = [];

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

/*******************************
 * Toggle blocking and update rules.
 *******************************/
function toggleBlocking() {
  isBlockingEnabled = !isBlockingEnabled;
  updateIcon();

  if (isBlockingEnabled) {
    updateBlockingRules();
  } else {
    // Remove all dynamic rules
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: blockedUrls.map((_, i) => i + 1)
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error removing rules:", chrome.runtime.lastError);
      }
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

/*******************************
 * Message listener for popup.js actions.
 *******************************/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleBlocking") {
    toggleBlocking();
    sendResponse({ isBlockingEnabled });
  } else if (request.action === "checkStatus") {
    sendResponse({ isBlockingEnabled });
  }
  return true;
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
  await loadBlockedUrls();
  updateBlockingRules();
  updateIcon();
}

init();
