document.addEventListener("DOMContentLoaded", () => {
  const historyGridContainer = document.getElementById("history-grid-container");
  const mainContent = document.getElementById("main-content");
  const backButton = document.getElementById("back-button");

  let apiToken = null;
  let moduleCode = null;
  let projectSlug = null;

  function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }

  apiToken = getTokenFromUrl();
  
  if (!apiToken) {
    redirectToError(
      "missing",
      "No authentication token found. Please return to myresults.epitest.eu and try again.",
      null
    );
  } else {
    const params = new URLSearchParams(window.location.search);
    moduleCode = params.get("moduleCode");
    projectSlug = params.get("projectSlug");
    
    if (!moduleCode || !projectSlug) {
      redirectToError(
        "missing",
        "Module code or project slug not found in URL.",
        null
      );
      return;
    }
    
    chrome.runtime.sendMessage({
      action: "storeToken",
      token: apiToken
    });
    
    checkTokenValidity();
    initializeHistory();
  }

  function checkTokenValidity() {
    if (!apiToken) {
      redirectToError("missing", "No authentication token found.", null);
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "validateToken",
          token: apiToken,
        },
        (response) => {
          if (!response || !response.isValid) {
            redirectToError(
              "token",
              "Your session has expired. Please log in again to continue using Mouli Rework.",
              null
            );
            resolve(false);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  function renderHistory(historyEntries) {
    if (mainContent) mainContent.style.display = "block";

    historyGridContainer.innerHTML = "";

    if (!historyEntries || historyEntries.length === 0) {
      historyGridContainer.innerHTML =
        '<div class="alert alert-info">No history found for this project.</div>';

      return;
    }

    historyEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (historyEntries[0].project?.name) {
      document.getElementById(
        "history-project-name"
      ).textContent = `${historyEntries[0].project.name} - History`;
    }
    if (historyEntries[0].project?.module?.code) {
      document.getElementById(
        "history-project-module"
      ).textContent = `Module: ${historyEntries[0].project.module.code}`;
    }

    historyEntries.forEach((entry, index) => {
      if (
        !entry ||
        !entry.project ||
        !entry.results ||
        !entry.results.testRunId
      ) {
        return;
      }

      const progressPercentage = calculateProgress(entry.results);

      const externalItems = entry.results.externalItems || [];

      const card = document.createElement("div");

      card.className = "project-card";

      card.style.setProperty("--card-index", index);

      const header = document.createElement("div");

      header.className = "project-header";

      const dateDiv = document.createElement("div");

      dateDiv.className = "project-date";

      try {
        dateDiv.textContent = new Date(entry.date).toLocaleString();
      } catch (e) {
        dateDiv.textContent = "Invalid Date";
      }
      header.appendChild(dateDiv);

      card.appendChild(header);

      const content = document.createElement("div");

      content.className = "project-content";

      const errorContainer = document.createElement("div");

      errorContainer.className = "history-error-container";

      const errors = findRelevantErrors(externalItems);

      errors.forEach((errorTitle) => {
        const errorTag = document.createElement("span");

        errorTag.className = "history-error-tag";

        if (errorTitle === "Build Error") errorTag.classList.add("build-error");
        else if (errorTitle === "Banned") errorTag.classList.add("banned");
        else if (errorTitle === "Crashed") errorTag.classList.add("crashed");
        else if (errorTitle === "Style Fail")
          errorTag.classList.add("style-fail");

        errorTag.textContent = errorTitle;

        errorContainer.appendChild(errorTag);
      });

      content.appendChild(errorContainer);

      const progressContainer = document.createElement("div");

      progressContainer.className = "progress-container";

      const progressHeader = document.createElement("div");

      progressHeader.className = "progress-header";

      const progressValue = document.createElement("div");

      progressValue.className = "progress-value";

      progressValue.textContent = `Progress: ${progressPercentage}%`;

      const progressRemaining = document.createElement("div");

      progressRemaining.className = "progress-remaining";

      progressRemaining.textContent = `${100 - progressPercentage}% remaining`;

      progressHeader.appendChild(progressValue);

      progressHeader.appendChild(progressRemaining);

      const progressBar = document.createElement("div");

      progressBar.className = "progress-bar";

      const progressFill = document.createElement("div");

      progressFill.className = "progress-fill";

      if (progressPercentage >= 75)
        progressFill.classList.add("progress-fill-high");
      else if (progressPercentage >= 40)
        progressFill.classList.add("progress-fill-medium");
      else progressFill.classList.add("progress-fill-low");

      requestAnimationFrame(() => {
        progressFill.style.width = `${progressPercentage}%`;
      });

      progressBar.appendChild(progressFill);

      progressContainer.appendChild(progressHeader);

      progressContainer.appendChild(progressBar);

      content.appendChild(progressContainer);

      if (externalItems.length > 0) {
        const codingStats = document.createElement("div");

        codingStats.className = "coding-stats";

        const styleDiv = document.createElement("div");

        const styleTitle = document.createElement("div");

        styleTitle.className = "stats-title";

        styleTitle.textContent = "Coding style";

        const styleGrid = document.createElement("div");

        styleGrid.className = "stats-grid";

        ["Fatal", "Major", "Minor", "Info"].forEach((level) => {
          const item = document.createElement("div");

          item.className = "stat-item";

          const label = document.createElement("span");

          label.textContent = level;

          const value = document.createElement("span");

          value.className = "stat-value";

          value.textContent = parseInt(
            getExternalItemValue(externalItems, `lint.${level.toLowerCase()}`),
            10
          );

          item.appendChild(label);

          item.appendChild(value);

          styleGrid.appendChild(item);
        });

        styleDiv.appendChild(styleTitle);

        styleDiv.appendChild(styleGrid);

        codingStats.appendChild(styleDiv);

        const coverageDiv = document.createElement("div");

        const coverageTitle = document.createElement("div");

        coverageTitle.className = "stats-title";

        coverageTitle.textContent = "Coverage";

        const coverageContainer = document.createElement("div");

        coverageContainer.className = "coverage-container";

        const branchCoverage = getExternalItemValue(
          externalItems,
          "coverage.branches"
        );

        const lineCoverage = getExternalItemValue(
          externalItems,
          "coverage.lines"
        );

        coverageContainer.appendChild(
          createCoverageCircle("Branches", branchCoverage)
        );

        coverageContainer.appendChild(
          createCoverageCircle("Lines", lineCoverage)
        );

        coverageDiv.appendChild(coverageTitle);

        coverageDiv.appendChild(coverageContainer);

        codingStats.appendChild(coverageDiv);

        content.appendChild(codingStats);
      }

      const footer = document.createElement("div");

      footer.className = "project-footer";

      const detailsButton = document.createElement("a");

      detailsButton.className = "view-button";

      detailsButton.href = "#";

      detailsButton.onclick = (event) => {
        event.preventDefault();

        chrome.runtime.sendMessage({
          action: "openDetails",
          testRunId: entry.results.testRunId,
        });
      };

      detailsButton.innerHTML = "<span>VIEW DETAILS</span>";

      footer.appendChild(detailsButton);

      content.appendChild(footer);

      card.appendChild(content);

      historyGridContainer.appendChild(card);
    });
  }

  async function initializeHistory() {
    try {
      if (!apiToken || !moduleCode || !projectSlug) {
        redirectToError(
          "missing",
          "Required parameters (token, moduleCode, projectSlug) not found.",
          null
        );
        return;
      }

      const isValid = await checkTokenValidity();
      if (!isValid) return;

      if (mainContent) mainContent.style.display = "block";

      const apiUrl = `https://api.epitest.eu/me/2024/${moduleCode}/${projectSlug}`;

      const headers = {
        Accept: "*/*",
        Authorization: `Bearer ${apiToken}`,
        "User-Agent": "Mouli-Rework-Extension/1.0",
      };

      fetch(apiUrl, {
        headers: headers,
      })
        .then((response) => {
          hidePreloader();

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              redirectToError(
                "token",
                "Your session has expired. Please log in again to continue using Mouli Rework.",
                null
              );

              return;
            } else if (response.status === 404) {
              redirectToError(
                "not-found",
                `History not found for ${moduleCode}/${projectSlug}`,
                null
              );

              return;
            }
            throw new Error(
              `API request failed with status: ${response.status}`
            );
          }
          return response.json();
        })
        .then((data) => {
          renderHistory(data);
        })
        .catch((error) => {
          redirectToError(
            "connection",
            `Failed to load project history: ${error.message}`,
            null
          );
        });

      if (backButton) {
        backButton.onclick = (event) => {
          event.preventDefault();

          chrome.runtime.sendMessage({
            action: "openDashboard",
          });
        };
      }
    } catch (error) {
      hidePreloader();

      redirectToError(
        "connection",
        `An unexpected error occurred: ${error.message}`,
        null
      );
    }
  }
});