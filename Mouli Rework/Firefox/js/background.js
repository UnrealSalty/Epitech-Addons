let apiTokenStore = null;

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
    apiTokenStore = message.token;
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
    chrome.tabs.update({
      url: chrome.runtime.getURL("html/better_view.html") + "?token=" + encodeURIComponent(apiTokenStore),
    });
    return true;
  }

  if (message.action === "getToken") {
    sendResponse({
      token: apiTokenStore,
    });
    return true;
  }

  if (message.action === "openDetails") {
    chrome.tabs.update({
      url: chrome.runtime.getURL(
        `html/details.html?testRunId=${message.testRunId}&token=${encodeURIComponent(apiTokenStore)}`,
      ),
    });
    return true;
  }

  if (message.action === "openHistory") {
    chrome.tabs.update({
      url: chrome.runtime.getURL(
        `html/history.html?moduleCode=${message.moduleCode}&projectSlug=${message.projectSlug}&token=${encodeURIComponent(apiTokenStore)}`,
      ),
    });
    return true;
  }

  return false;
});