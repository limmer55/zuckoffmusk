document.addEventListener("DOMContentLoaded", () => {
  // Get the full URL of the blocked page
  const urlParams = new URLSearchParams(window.location.search);
  const originalUrl = urlParams.get("url");

  // Display the blocked URL if available
  if (originalUrl) {
    document.getElementById("blockedWebsite").textContent = originalUrl;
  }

  // Fetch and display the block count
  chrome.runtime.sendMessage({ action: "getBlockCount" }, (response) => {
    if (response && typeof response.blockCount === "number") {
      document.getElementById("blockCount").textContent =
        `We have blocked traffic ${response.blockCount} times.`;
    }
  });
});
