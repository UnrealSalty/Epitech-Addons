document.addEventListener("DOMContentLoaded", () => {
  const detailsContent = document.getElementById("details-content");
  const backButton = document.getElementById("back-button");
  const mainContent = document.getElementById("main-content");
  const errorMessageBox = document.getElementById("error-message-box");
  const errorBoxTitle = document.getElementById("error-message-title");
  const errorBoxContent = document.getElementById("error-message-content");
  const statusTagContainer = document.getElementById("details-status-tag");
  const testResultsContainer = document.getElementById("test-results-container");
  const styleDetailsListContainer = document.getElementById("style-details-list");
  const coverageDetailsContainer = document.getElementById("coverage-details-container");

  let apiToken = null;
  let testRunId = null;
  let projectData = null;

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
    testRunId = params.get("testRunId");
    
    if (!testRunId) {
      redirectToError("missing", "No test run ID found in URL.", null);
      return;
    }
    
    chrome.runtime.sendMessage({
      action: "storeToken",
      token: apiToken
    });
    
    checkTokenValidity();
    initializeDetails();
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

  const codingStyleRules = {
    "C-G1": "File header required",
    "C-G2": "One empty line between functions",
    "C-G3": "Proper indentation for preprocessor directives",
    "C-G4": "Avoid global variables (except const)",
    "C-G5": "Only include .h files",
    "C-G6": "UNIX line endings only",
    "C-G7": "No trailing spaces",
    "C-G8": "No leading empty lines, max 1 trailing",
    "C-G9": "Use macros or constants for non-trivial values",
    "C-G10": "No inline assembly",
    "C-F1": "Function must follow single responsibility",
    "C-F2": "Function names must include verbs",
    "C-F3": "Max 80 columns per line",
    "C-F4": "Max 20 lines per function",
    "C-F5": "Max 4 parameters per function",
    "C-F6": "Use (void) in parameter-less functions",
    "C-F7": "Pass structs by pointer, not by value",
    "C-F8": "No comments inside functions",
    "C-F9": "No nested functions",
    "C-L1": "One statement per line (or avoid sneaky multi-statements)",
    "C-L2": "4-space indentation, no tabs",
    "C-L3": "Correct spacing (e.g., around operators, after keywords)",
    "C-L4": "Proper placement of curly brackets",
    "C-L5": "Vars declared at top, one per line",
    "C-L6": "One blank line between declarations and code",
    "C-V1": "Naming conventions (snake_case, etc.)",
    "C-V2": "Structs must be coherent",
    "C-V3": "Proper spacing with * in pointers",
    "C-C1": "Max 3 branches in conditionals, avoid deep nesting",
    "C-C2": "Ternary ops must be simple and used meaningfully",
    "C-C3": "No goto",
    "C-H1": "Header files contain only valid declarations",
    "C-H2": "Header guard required",
    "C-H3": "Macros must fit on one line and be a single statement",
    "C-O1": "No compiled or temp files in repo / Compiler warning check",
    "C-O2": "Only .c and .h files allowed",
    "C-O3": "File must match one logical entity, max 10 functions / Compiler warning check",
    "C-O4": "File names in English, snake_case",
    "C-A1": "Use const for read-only pointers",
    "C-A2": "Use accurate types (size_t, etc.)",
    "C-A3": "File must end with newline",
    "C-A4": "Unused globals/functions must be marked static",
  };

  function getExternalItemComment(items, type, defaultValue = null) {
    if (!Array.isArray(items)) return defaultValue;

    const item = items.find((i) => i && i.type === type);

    return item && item.comment ? item.comment : defaultValue;
  }

  function findDetailedRelevantErrors(items) {
    const priority = [
      "make-error",
      "delivery-error",
      "crash",
      "banned",
      "coding-style-fail",
      "no-test-passed",
    ];

    const errorsFound = [];

    priority.forEach((type) => {
      const errorItem = items.find((item) => item && item.type === type);

      if (errorItem) {
        let title = "";

        if (type === "make-error") title = "Build Error";
        else if (type === "delivery-error") title = "Delivery Error";
        else if (type === "crash") title = "Project Crashed";
        else if (type === "banned") title = "Banned Function Used";
        else if (type === "coding-style-fail")
          title = "Coding Style Prerequisites Failed";
        else if (type === "no-test-passed") title = "No Tests Passed";
        else title = "Error";

        errorsFound.push({
          type: type,
          title: title,
          comment: errorItem.comment || null,
        });
      }
    });

    return errorsFound;
  }

  function renderDetails(data) {
    detailsContent.style.display = "block";

    const instance = data.instance || {};
    const externalItems = data.externalItems || [];
    const skills = data.skills || [];
    const styleDetails = data.style?.Details || {};

    document.getElementById("details-project-name").textContent =
      instance.projectName || "Unknown Project";

    document.getElementById("details-project-module").innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="16" height="16">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .01.01M6 16.5h12M6 16.5a9 9 0 1 1-12 0h12Z" />
          </svg>
          <span>${instance.moduleCode || "N/A"}</span>
      `;

    try {
      document.getElementById("details-run-date").innerHTML = `
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
              </svg>
              <span>${new Date(data.date).toLocaleString()}</span>
          `;
    } catch (e) {
      document.getElementById("details-run-date").innerHTML = `
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>
              <span>Invalid Date</span>`;
    }
    const commitHashSpan = document.getElementById("details-commit-hash");

    commitHashSpan.textContent = data.gitCommit
      ? `Commit: ${data.gitCommit.substring(0, 8)}`
      : `Commit: Not recorded`;

    statusTagContainer.innerHTML = "";

    errorMessageBox.classList.remove("visible");

    const errors = findDetailedRelevantErrors(externalItems);

    if (errors.length > 0) {
      errors.forEach((error) => {
        const tag = document.createElement("span");

        tag.className = "error-tag";

        tag.innerHTML = `<svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>${error.title}`;

        statusTagContainer.appendChild(tag);
      });

      let errorToDisplay = errors[0];

      const bannedError = errors.find((err) => err.type === "banned");

      if (bannedError) errorToDisplay = bannedError;

      errorBoxTitle.lastChild.textContent = errorToDisplay.title;

      let errorComment =
        errorToDisplay.comment || "No specific error details provided.";

      if (errorToDisplay.type === "banned") {
        if (
          !errorComment ||
          errorComment === "No specific error details provided."
        ) {
          const bannedItem = externalItems.find(
            (item) =>
              item &&
              item.type === "banned" &&
              item.comment &&
              item.comment.includes("Functions used but not allowed")
          );

          if (bannedItem && bannedItem.comment) {
            errorComment = bannedItem.comment;
          } else {
            const bannedInfo = externalItems.find(
              (item) =>
                item &&
                item.comment &&
                item.comment.includes("Functions used but not allowed")
            );

            errorComment = bannedInfo
              ? bannedInfo.comment
              : "Banned functions detected. Check your code for prohibited function calls.";
          }
        }
      } else if (
        errorToDisplay.type === "make-error" &&
        (!errorComment ||
          errorComment === "No specific error details provided.")
      ) {
        errorComment = getExternalItemComment(
          externalItems,
          "make-error",
          "Build failed. Check Makefile and compilation output."
        );
      }

      errorBoxContent.textContent = errorComment;

      errorMessageBox.classList.add("visible");
    }

    let fatalCount = 0,
      majorCount = 0,
      minorCount = 0,
      infoCount = 0;

    styleDetailsListContainer.innerHTML = "";

    const severities = ["fatal", "major", "minor", "info"];

    severities.forEach((severity) => {
      const severityData = styleDetails[severity] || {};

      Object.keys(severityData).forEach((ruleCode) => {
        const violations = severityData[ruleCode] || [];

        const count = violations.length;

        if (severity === "fatal") fatalCount += count;
        else if (severity === "major") majorCount += count;
        else if (severity === "minor") minorCount += count;
        else if (severity === "info") infoCount += count;

        const ruleDesc =
          codingStyleRules[ruleCode] || "Unknown Rule Description";

        const severityText =
          severity.charAt(0).toUpperCase() + severity.slice(1);

        violations.forEach((fileLine) => {
          const itemDiv = document.createElement("div");

          itemDiv.className = "style-violation-item";

          const headerDiv = document.createElement("div");

          headerDiv.className = "style-violation-header";

          const codeSpan = document.createElement("span");

          codeSpan.className = `style-rule-code style-severity-${severity}`;

          codeSpan.textContent = `${severityText} ${ruleCode}`;

          const fileLineSpan = document.createElement("span");

          fileLineSpan.className = "style-file-line";

          fileLineSpan.textContent = fileLine;

          headerDiv.appendChild(codeSpan);

          headerDiv.appendChild(fileLineSpan);

          const descP = document.createElement("p");

          descP.className = "style-rule-desc";

          descP.textContent = ruleDesc;

          itemDiv.appendChild(headerDiv);

          itemDiv.appendChild(descP);

          styleDetailsListContainer.appendChild(itemDiv);
        });
      });
    });

    document.getElementById("style-fatal").textContent = fatalCount;

    document.getElementById("style-major").textContent = majorCount;

    document.getElementById("style-minor").textContent = minorCount;

    document.getElementById("style-info").textContent = infoCount;

    if (styleDetailsListContainer.children.length === 0) {
      styleDetailsListContainer.innerHTML =
        '<p class="placeholder-text">No specific coding style violations reported.</p>';
    }

    const branchCoverage = getExternalItemValue(
      externalItems,
      "coverage.branches"
    );

    const lineCoverage = getExternalItemValue(externalItems, "coverage.lines");

    document
      .getElementById("coverage-branch-item")
      .replaceChildren(createCoverageCircle("Branches", branchCoverage, 90));

    document
      .getElementById("coverage-line-item")
      .replaceChildren(createCoverageCircle("Lines", lineCoverage, 90));

    const coverageDetailsText = getExternalItemComment(
      externalItems,
      "coverage.main"
    );

    coverageDetailsContainer.innerHTML = "";

    if (coverageDetailsText) {
      const pre = document.createElement("pre");

      pre.className = "coverage-details";

      pre.textContent = coverageDetailsText;

      coverageDetailsContainer.appendChild(pre);
    } else {
      coverageDetailsContainer.innerHTML =
        '<p class="placeholder-text">No GCC coverage report found.</p>';
    }

    testResultsContainer.innerHTML = "";

    const hasSkillsData =
      skills.length > 0 &&
      skills.some((s) => s.FullSkillReport || s.BreakdownSkillReport);

    if (!hasSkillsData) {
      testResultsContainer.innerHTML =
        '<p class="placeholder-text">No test results available for this run.</p>';
    } else {
      skills.forEach((skill, groupIndex) => {
        let report = null;

        let reportType = "";

        if (skill.FullSkillReport) {
          report = skill.FullSkillReport;

          reportType = "full";
        } else if (skill.BreakdownSkillReport) {
          report = skill.BreakdownSkillReport;

          reportType = "breakdown";
        }

        if (report) {
          const tests = reportType === "full" ? report.tests || [] : [];

          const groupDiv = document.createElement("div");

          groupDiv.className = "test-group";

          const groupHeaderDiv = document.createElement("div");

          groupHeaderDiv.className = "test-group-header";

          const headerTopDiv = document.createElement("div");

          headerTopDiv.className = "test-group-header-top";

          const title = document.createElement("span");

          title.className = "test-group-title";

          title.textContent = report.name || `Unnamed Group ${groupIndex + 1}`;

          const counts = document.createElement("span");

          counts.className = "test-group-counts";

          let passedCount = 0,
            totalCount = 0,
            failedCount = 0,
            crashedCount = 0,
            skippedCount = 0;

          if (reportType === "full") {
            tests.forEach((t) => {
              totalCount++;

              if (t.passed) passedCount++;
              else if (t.crashed) crashedCount++;
              else if (t.skipped) skippedCount++;
              else failedCount++;
            });
          } else if (reportType === "breakdown" && report.breakdown) {
            passedCount = report.breakdown.passed;

            totalCount = report.breakdown.count;

            failedCount = totalCount - passedCount;
          }
          counts.innerHTML = `<span>Tests: ${totalCount}</span><span class="passed">Passed: ${passedCount}</span><span class="failed">Failed: ${
            failedCount + crashedCount
          }</span>`;

          headerTopDiv.appendChild(title);

          headerTopDiv.appendChild(counts);

          groupHeaderDiv.appendChild(headerTopDiv);

          const progressBar = document.createElement("div");

          progressBar.className = "test-group-progress-bar";

          const progressFill = document.createElement("div");

          progressFill.className = "test-group-progress-fill";

          let groupPercentage =
            totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

          if (groupPercentage >= 75) progressFill.classList.add("high");
          else if (groupPercentage >= 40) progressFill.classList.add("medium");
          else progressFill.classList.add("low");

          requestAnimationFrame(() => {
            progressFill.style.width = `${groupPercentage}%`;
          });

          progressBar.appendChild(progressFill);

          groupHeaderDiv.appendChild(progressBar);

          groupDiv.appendChild(groupHeaderDiv);

          const testListDiv = document.createElement("div");

          testListDiv.className = "test-list";

          if (reportType === "full") {
            if (totalCount === 0) {
              testListDiv.innerHTML =
                '<p class="placeholder-text">No tests found.</p>';
            } else {
              const failedTests = tests.filter(
                (t) => !t.passed && !t.skipped && !t.crashed
              );

              const crashedTests = tests.filter((t) => t.crashed);

              const skippedTests = tests.filter((t) => t.skipped);

              const passedTests = tests.filter((t) => t.passed);

              [...failedTests, ...crashedTests].forEach((test) =>
                testListDiv.appendChild(createTestItem(test))
              );

              passedTests.forEach((test) =>
                testListDiv.appendChild(createTestItem(test))
              );

              skippedTests.forEach((test) =>
                testListDiv.appendChild(createTestItem(test))
              );
            }
          } else if (reportType === "breakdown") {
            testListDiv.innerHTML = `<p class="placeholder-text">Breakdown Summary: ${passedCount} passed, ${failedCount} failed.</p>`;
          }
          groupDiv.appendChild(testListDiv);

          testResultsContainer.appendChild(groupDiv);
        }
      });
    }

    if (backButton) {
      backButton.onclick = (event) => {
        event.preventDefault();

        chrome.runtime.sendMessage({
          action: "openDashboard",
        });
      };
    }

    function createTestItem(test) {
      const itemWrapper = document.createElement("div");

      const itemDiv = document.createElement("div");

      itemDiv.className = "test-item";

      if (test.passed) itemDiv.classList.add("test-passed");
      else if (test.crashed) itemDiv.classList.add("test-crashed");
      else if (test.skipped) itemDiv.classList.add("test-skipped");
      else itemDiv.classList.add("test-failed");

      const infoDiv = document.createElement("div");

      infoDiv.className = "test-item-info";

      const nameSpan = document.createElement("span");

      nameSpan.className = "test-name";

      nameSpan.textContent = test.name || "Unnamed Test";

      infoDiv.appendChild(nameSpan);

      const statusLine = document.createElement("div");

      statusLine.className = "test-status-line";

      const statusLabel = document.createElement("span");

      statusLabel.className = "test-status-label";

      if (test.passed) {
        statusLabel.classList.add("passed");

        statusLabel.textContent = "Status: Passed";
      } else if (test.skipped) {
        statusLabel.classList.add("skipped");

        statusLabel.textContent = "Status: Skipped";
      } else if (test.crashed) {
        statusLabel.classList.add("crashed");

        statusLabel.textContent = "Status: Crashed";
      } else {
        statusLabel.classList.add("failed");

        statusLabel.textContent = "Status: Failed";
      }
      statusLine.appendChild(statusLabel);

      if (test.comment && test.comment.trim() !== "") {
        const commentPreview = document.createElement("span");

        commentPreview.className = "test-comment-preview";

        commentPreview.textContent = `Comment: ${test.comment.split("\n")[0]}`;

        statusLine.appendChild(commentPreview);
      }
      infoDiv.appendChild(statusLine);

      itemDiv.appendChild(infoDiv);

      itemWrapper.appendChild(itemDiv);

      let detailsDiv = null;

      if (test.comment && test.comment.trim() !== "") {
        detailsDiv = document.createElement("div");

        detailsDiv.className = "test-item-details";

        detailsDiv.style.display = "none";

        const pre = document.createElement("pre");

        pre.textContent = test.comment;

        detailsDiv.appendChild(pre);

        itemWrapper.appendChild(detailsDiv);

        itemDiv.style.cursor = "pointer";

        itemDiv.onclick = () => {
          detailsDiv.style.display =
            detailsDiv.style.display === "none" ? "block" : "none";
        };
      }
      return itemWrapper;
    }
  }

  async function initializeDetails() {
    try {
      if (!apiToken || !testRunId) {
        redirectToError(
          "missing",
          !apiToken
            ? "No authentication token found."
            : "No test run ID found in URL.",
          null
        );
        return;
      }

      const isValid = await checkTokenValidity();
      if (!isValid) return;

      const apiUrl = `https://api.epitest.eu/me/details/${testRunId}`;

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
                `Test run details not found (Status: ${response.status}). Invalid ID?`,
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
          if (!data || !data.instance) {
            throw new Error("Received invalid data structure from API.");
          }
          projectData = data;

          renderDetails(projectData);
        })
        .catch((error) => {
          redirectToError(
            "connection",
            `Failed to load project details: ${error.message}`,
            null
          );
        });
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