document.addEventListener("DOMContentLoaded", () => {
    /**
     * Helper function to extract a clear domain name from wildcard patterns
     * such as "*://*.x.com/*" and return "x.com".
     */
    function simplifyPattern(pattern) {
      // Step 1: Remove the prefix "*://"
      pattern = pattern.replace(/^(\*:\/\/)/, "");
  
      // Step 2: Remove the trailing "/*"
      pattern = pattern.replace(/\/\*$/, "");
  
      // Step 3: Remove the prefix "*."
      pattern = pattern.replace(/^\*\./, "");
  
      // Step 4: Remove "www." if present
      pattern = pattern.replace(/^www\./, "");
  
      return pattern;
    }
  
    // Get the wildcard pattern from the URL query parameter (?url=...)
    const urlParams = new URLSearchParams(window.location.search);
    const originalPattern = urlParams.get("url");
  
    // If there's a pattern, simplify it to the domain name; otherwise empty
    let domain = originalPattern ? simplifyPattern(originalPattern) : "";
  
    // Display the sentence "phew... we successfully blocked you from visiting x.com."
    document.getElementById("blockedInfo").textContent = 
      `phew... we successfully stopped you from visiting ${domain}.`;
  
    // Fetch and display the block count
    chrome.runtime.sendMessage({ action: "getBlockCount" }, (response) => {
      if (response && typeof response.blockCount === "number") {
        document.getElementById("blockCount").textContent =
          `We have prevented generating traffic to Meta or Twitter/X ${response.blockCount} pages times.`;
      }
    });
  });
  