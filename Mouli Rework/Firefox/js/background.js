async function validateToken(token) {
  if (!token) return false;
  
  try {
    const response = await fetch("https://api.epitest.eu/me/2024", {
      headers: {
        Accept: "*/*",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Mouli-Rework-Extension/1.0",
      },
      cache: "no-store",
    });
    
    return response.ok;
  } catch (error) {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "storeToken") {
    chrome.storage.local.set({ apiToken: message.token });
    return true;
  }

  if (message.action === "validateToken") {
    validateToken(message.token).then((isValid) => {
      sendResponse({
        isValid: isValid,
      });
    });
    return true;
  }

  if (message.action === "openDashboard") {
    chrome.storage.local.get(["apiToken"], function(result) {
      chrome.tabs.update({
        url: chrome.runtime.getURL("html/better_view.html") + "?token=" + encodeURIComponent(result.apiToken || ""),
      });
    });
    return true;
  }

  if (message.action === "getToken") {
    chrome.storage.local.get(["apiToken"], function(result) {
      sendResponse({
        token: result.apiToken || null,
      });
    });
    return true;
  }

  if (message.action === "openDetails") {
    chrome.storage.local.get(["apiToken"], function(result) {
      chrome.tabs.update({
        url: chrome.runtime.getURL(
          `html/details.html?testRunId=${message.testRunId}&token=${encodeURIComponent(result.apiToken || "")}`,
        ),
      });
    });
    return true;
  }

  if (message.action === "openHistory") {
    chrome.storage.local.get(["apiToken"], function(result) {
      chrome.tabs.update({
        url: chrome.runtime.getURL(
          `html/history.html?moduleCode=${message.moduleCode}&projectSlug=${message.projectSlug}&token=${encodeURIComponent(result.apiToken || "")}`,
        ),
      });
    });
    return true;
  }

  return false;
});