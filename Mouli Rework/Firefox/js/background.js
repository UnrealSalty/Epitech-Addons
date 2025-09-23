async function validateToken(token, year) {
  if (!token) return false;
  const useYear = year || (await getStoredYear()) || "2024";
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

function getStoredYear() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["apiYear"], function(result) {
      resolve(result.apiYear || null);
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "storeToken") {
    chrome.storage.local.set({ apiToken: message.token });
    return true;
  }

  if (message.action === "storeYear") {
    chrome.storage.local.set({ apiYear: message.year });
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
    chrome.storage.local.get(["apiToken", "apiYear"], function(result) {
      chrome.tabs.update({
        url: chrome.runtime.getURL("html/better_view.html") + `?token=${encodeURIComponent(result.apiToken || "")}&year=${encodeURIComponent(result.apiYear || "2024")}`,
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

  if (message.action === "getYear") {
    chrome.storage.local.get(["apiYear"], function(result) {
      sendResponse({
        year: result.apiYear || "2024",
      });
    });
    return true;
  }

  if (message.action === "openDetails") {
    chrome.storage.local.get(["apiToken", "apiYear"], function(result) {
      chrome.tabs.update({
        url: chrome.runtime.getURL(
          `html/details.html?testRunId=${message.testRunId}&token=${encodeURIComponent(result.apiToken || "")}&year=${encodeURIComponent(result.apiYear || "2024")}`,
        ),
      });
    });
    return true;
  }

  if (message.action === "openHistory") {
    chrome.storage.local.get(["apiToken", "apiYear"], function(result) {
      chrome.tabs.update({
        url: chrome.runtime.getURL(
          `html/history.html?moduleCode=${message.moduleCode}&projectSlug=${message.projectSlug}&token=${encodeURIComponent(result.apiToken || "")}&year=${encodeURIComponent(result.apiYear || "2024")}`,
        ),
      });
    });
    return true;
  }

  return false;
});