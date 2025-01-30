document.addEventListener("DOMContentLoaded", () => {
  /**
   * Helper function to extract a clear domain name from wildcard patterns
   * such as "*://*.x.com/*" and return "x.com".
   */
  function simplifyPattern(pattern) {
    return pattern
      .replace(/^(\*:\/\/|\*\.|www\.)/, "") // Removes "*://", "*." and "www."
      .replace(/\/\*$/, "");               // Removes the trailing "/*"
  }

  // Get the wildcard pattern from the URL query parameter (?url=...)
  const urlParams = new URLSearchParams(window.location.search);
  const originalPattern = urlParams.get("url");

  // If there's a pattern, simplify it to the domain name; otherwise empty
  let domain = originalPattern ? simplifyPattern(originalPattern) : "";

  // Display the sentence "phew... we successfully blocked you from visiting x.com."
  document.getElementById("blockedInfo").textContent = 
    `phew... we successfully stopped you from visiting ${domain}.`;
});
