/*******************************
 * Retrieves the list of blocked URLs from the JSON file,
 * then sets up a listener to intercept and block matching requests.
 *******************************/
let isBlockingEnabled = true;
let blockedUrls = [];

/*******************************
 * loads the blocked URLs from a remote URL.
 *******************************/
async function loadBlockedUrls() {
  try {
    const response = await fetch("https://raw.githubusercontent.com/limmer55/zuckoffmusk/main/blocked-urls.json"); // URL der blockierten URLs
    const data = await response.json();
    blockedUrls = data.blocked || [];
  } catch (error) {
    console.error("Failed to load blocked URLs:", error);
  }
}

/*******************************
 * updates the blocking rules using declarativeNetRequest.
 *******************************/
function updateBlockingRules() {
  const rules = blockedUrls.map((pattern, i) => ({
    id: i + 1,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: pattern, resourceTypes: ["main_frame"] }
  }));
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map((r) => r.id),
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
 * initializes the extension’s blocking logic.
 *******************************/
async function init() {
  await loadBlockedUrls();
  updateBlockingRules();
  // Ensure the icon is updated based on the initial blocking state
  updateIcon();
}

/*******************************
 * toggles the blocking state and updates the icon accordingly.
 *******************************/
function toggleBlocking() {
  isBlockingEnabled = !isBlockingEnabled;
  updateIcon();
  if (isBlockingEnabled) {
    updateBlockingRules();
  } else {
    chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: blockedUrls.map((_, i) => i + 1) });
  }
  // Ensure the icon is updated immediately
  updateIcon();
}

/*******************************
 * updates the extension icon based on the current blocking state.
 *******************************/
function updateIcon() {
  const iconPath = isBlockingEnabled ? "icons/icon-on.png" : "icons/icon-off.png";
  chrome.action.setIcon({ path: iconPath });
}

/*******************************
 * Listen for messages from popup.html to toggle the blocking.
 *******************************/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleBlocking") {
    toggleBlocking();
    sendResponse({ isBlockingEnabled });
  }
});

/*******************************
 * Listen for clicks on the extension icon to toggle blocking.
 *******************************/
chrome.action.onClicked.addListener(() => {
  toggleBlocking();
});

/*******************************
 * Initialize on startup.
 *******************************/
init();
