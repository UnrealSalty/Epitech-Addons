document.addEventListener("DOMContentLoaded", () => {
  const projectGridContainer = document.getElementById("project-grid-container");
  const filterContainer = document.getElementById("filter-container");
  const mainContent = document.getElementById("main-content");
  
  let apiToken = null;
  let allProjectsData = [];
  let currentFilter = "ALL";

  function getTokenFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }

  apiToken = getTokenFromUrl();
  
  if (!apiToken) {
    redirectToError(
      "missing",
      "No authentication token found. Please return to my.epitech.eu and try again.",
      null
    );
  } else {
    checkTokenValidity();
    initializeDashboard();
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

  function renderProjects(projectsToRender) {
    if (mainContent) mainContent.style.display = "block";

    projectGridContainer.innerHTML = "";

    if (!projectsToRender || projectsToRender.length === 0) {
      projectGridContainer.innerHTML = `<div class="alert alert-info">No projects found ${
        currentFilter === "ALL"
          ? "for this year"
          : 'matching filter "' + currentFilter + '"'
      }.</div>`;

      return;
    }

    projectsToRender.forEach((project, index) => {
      if (
        !project ||
        !project.project ||
        !project.results ||
        !project.results.testRunId ||
        !project.project.module?.code ||
        !project.project.slug
      ) {
        return;
      }

      const progressPercentage = calculateProgress(project.results);

      const externalItems = project.results.externalItems || [];

      const card = document.createElement("div");

      card.className = "project-card";

      card.style.setProperty("--card-index", index);

      const header = document.createElement("div");

      header.className = "project-header";

      const projectName = document.createElement("h3");

      projectName.className = "project-name";

      projectName.textContent = project.project.name || "Unknown Project";

      const projectModule = document.createElement("div");

      projectModule.className = "project-module";

      projectModule.textContent = `Module: ${project.project.module.code}`;

      header.appendChild(projectName);

      header.appendChild(projectModule);

      const content = document.createElement("div");

      content.className = "project-content";

      const projectDate = document.createElement("div");

      projectDate.className = "project-date";

      try {
        projectDate.textContent = `Last run: ${new Date(
          project.date
        ).toLocaleDateString()}`;
      } catch (e) {
        projectDate.textContent = `Last run: Invalid Date`;
      }
      content.appendChild(projectDate);

      const errors = findRelevantErrors(externalItems);

      const errorContainer = document.createElement("div");

      errorContainer.className = "error-tags-container";

      if (errors.length > 0) {
        errors.forEach((errorTitle) => {
          const errorTag = document.createElement("span");

          errorTag.className = "error-tag";

          if (errorTitle === "Build Error")
            errorTag.classList.add("build-error");
          else if (errorTitle === "Banned") errorTag.classList.add("banned");
          else if (errorTitle === "Crashed") errorTag.classList.add("crashed");
          else if (errorTitle === "Style Fail")
            errorTag.classList.add("style-fail");

          errorTag.textContent = errorTitle;

          errorContainer.appendChild(errorTag);
        });
      }
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
          testRunId: project.results.testRunId,
        });
      };

      detailsButton.innerHTML = "<span>DETAILS</span>";

      const historyButton = document.createElement("a");

      historyButton.className = "view-button";

      historyButton.href = "#";

      historyButton.onclick = (event) => {
        event.preventDefault();

        chrome.runtime.sendMessage({
          action: "openHistory",
          moduleCode: project.project.module.code,
          projectSlug: project.project.slug,
        });
      };

      historyButton.innerHTML = "<span>HISTORY</span>";

      footer.appendChild(detailsButton);

      footer.appendChild(historyButton);

      content.appendChild(footer);

      card.appendChild(header);

      card.appendChild(content);

      projectGridContainer.appendChild(card);
    });
  }

  function populateFilters() {
    const moduleCodes = [
      ...new Set(
        allProjectsData.map((p) => p.project.module?.code).filter(Boolean)
      ),
    ].sort((a, b) => {
      const partsA = a.split("-");

      const partsB = b.split("-");

      if (partsA.length === 3 && partsB.length === 3) {
        if (partsA[1] !== partsB[1]) return partsA[1].localeCompare(partsB[1]);

        return parseInt(partsA[2]) - parseInt(partsB[2]);
      }
      return a.localeCompare(b);
    });

    const allButton = filterContainer.querySelector('[data-module="ALL"]');

    filterContainer.innerHTML = "";

    filterContainer.appendChild(allButton);

    moduleCodes.forEach((code) => {
      const button = document.createElement("button");

      button.className = "filter-button";

      button.dataset.module = code;

      button.textContent = code;

      button.addEventListener("click", handleFilterClick);

      filterContainer.appendChild(button);
    });

    allButton.addEventListener("click", handleFilterClick);

    allButton.classList.add("active");
  }

  function handleFilterClick(event) {
    const selectedModule = event.target.dataset.module;

    if (selectedModule === currentFilter) return;

    currentFilter = selectedModule;

    filterContainer.querySelectorAll(".filter-button").forEach((btn) => {
      btn.classList.remove("active");

      if (btn.dataset.module === currentFilter) {
        btn.classList.add("active");
      }
    });

    let filteredProjects =
      currentFilter === "ALL"
        ? allProjectsData
        : allProjectsData.filter(
            (p) => p.project.module?.code === currentFilter
          );

    renderProjects(filteredProjects);
  }

  async function initializeDashboard() {
    try {
      if (!apiToken) {
        redirectToError(
          "missing",
          "No authentication token found in URL.",
          null
        );
        return;
      }

      const isValid = await checkTokenValidity();
      if (!isValid) return;

      chrome.runtime.sendMessage({
        action: "storeToken",
        token: apiToken
      });

      const apiUrl = `https://api.epitest.eu/me/2024`;

      const headers = {
        Accept: "*/*",
        Authorization: `Bearer ${apiToken}`,
        "User-Agent": "Mouli-Rework-Extension/1.0",
      };

      try {
        const response = await fetch(apiUrl, {
          headers: headers,
        });

        hidePreloader();

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            redirectToError(
              "token",
              "Your session has expired. Please log in again to continue using Mouli Rework.",
              null
            );

            return;
          }
          throw new Error(`API request failed with status: ${response.status}`);
        }

        const data = await response.json();

        allProjectsData = data.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        populateFilters();

        renderProjects(allProjectsData);
      } catch (fetchError) {
        redirectToError(
          "connection",
          `Failed to load project data: ${fetchError.message}`,
          null
        );
      }
    } catch (initError) {
      hidePreloader();

      redirectToError(
        "connection",
        `An unexpected error occurred: ${initError.message}`,
        null
      );
    }
  }
});