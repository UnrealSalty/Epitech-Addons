
let apiTokenStore = null;
let apiYearStore = "2024";

async function validateToken(token, year) {
  if (!token) return false;
  const useYear = year || apiYearStore || "2024";
  try {
    const response = await fetch(`https://api.epitest.eu/me/${useYear}`, {
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

  if (message.action === "storeYear") {
    apiYearStore = message.year;
    return true;
  }

  if (message.action === "validateToken") {
    validateToken(message.token, message.year).then((isValid) => {
      sendResponse({
        isValid: isValid,
      });
    });
    return true;
  }

  if (message.action === "openDashboard") {
    chrome.tabs.update({
      url: chrome.runtime.getURL("html/better_view.html") + `?token=${encodeURIComponent(apiTokenStore)}&year=${encodeURIComponent(apiYearStore)}`,
    });
    return true;
  }

  if (message.action === "getToken") {
    sendResponse({
      token: apiTokenStore,
    });
    return true;
  }

  if (message.action === "getYear") {
    sendResponse({
      year: apiYearStore,
    });
    return true;
  }

  if (message.action === "openDetails") {
    chrome.tabs.update({
      url: chrome.runtime.getURL(
        `html/details.html?testRunId=${message.testRunId}&token=${encodeURIComponent(apiTokenStore)}&year=${encodeURIComponent(apiYearStore)}`,
      ),
    });
    return true;
  }

  if (message.action === "openHistory") {
    chrome.tabs.update({
      url: chrome.runtime.getURL(
        `html/history.html?moduleCode=${message.moduleCode}&projectSlug=${message.projectSlug}&token=${encodeURIComponent(apiTokenStore)}&year=${encodeURIComponent(apiYearStore)}`,
      ),
    });
    return true;
  }

  return false;
});