const toggleButton = document.getElementById('toggleButton');
const statusText = document.getElementById('statusText');

function updateUI(isEnabled) {
  toggleButton.innerText = isEnabled ? "Turn Blocking OFF" : "Turn Blocking ON";
  statusText.textContent = isEnabled ? "Blocking is ACTIVE" : "Blocking is INACTIVE";
  statusText.style.color = isEnabled ? "green" : "red";
}

// Add event listener to the toggle button
toggleButton.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "toggleBlocking" }, (response) => {
    if (response) {
      updateUI(response.isBlockingEnabled);
    }
  });
});

// Check the current status and update the button text accordingly
chrome.runtime.sendMessage({ action: "checkStatus" }, (response) => {
  if (response) {
    updateUI(response.isBlockingEnabled);
  }
});

// Listen for updates to the block count
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBlockCount") {
    document.getElementById('blockCount').textContent = `Blocked pages: ${message.count}`;
  }
});