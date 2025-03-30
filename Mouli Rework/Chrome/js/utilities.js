function hidePreloader() {
  const preloadOverlay = document.querySelector(".preload-overlay");

  if (preloadOverlay) {
    preloadOverlay.classList.add("loaded");
  }
}

function redirectToError(type, message, returnUrl = null) {
  let url = "../html/error.html?type=" + encodeURIComponent(type);

  if (message) {
    url += "&message=" + encodeURIComponent(message);
  }

  if (returnUrl) {
    url += "&return=" + encodeURIComponent(returnUrl);
  }

  window.location.href = url;
}

function calculateProgress(projectResult) {
  const skills = projectResult.skills;

  if (!skills || typeof skills !== "object") return 0;

  let totalTests = 0;
  let passedTests = 0;

  for (const skillKey in skills) {
    const skill = skills[skillKey];

    if (skill && typeof skill === "object") {
      if (typeof skill.count === "number" && typeof skill.passed === "number") {
        totalTests += skill.count;
        passedTests += skill.passed;
      } else if (skill.BreakdownSkillReport?.breakdown) {
        totalTests += skill.BreakdownSkillReport.breakdown.count;
        passedTests += skill.BreakdownSkillReport.breakdown.passed;
      } else if (
        skill.FullSkillReport &&
        Array.isArray(skill.FullSkillReport.tests)
      ) {
        totalTests += skill.FullSkillReport.tests.length;
        passedTests += skill.FullSkillReport.tests.filter(
          (t) => t.passed
        ).length;
      }
    }
  }

  if (totalTests === 0) return 0;
  return Math.round((passedTests / totalTests) * 100);
}

function getExternalItemValue(items, type, defaultValue = 0) {
  if (!Array.isArray(items)) return defaultValue;

  const item = items.find((i) => i && i.type === type);

  const value = item ? parseFloat(item.value) : defaultValue;

  if (type.startsWith("lint.")) {
    return isNaN(value) ? defaultValue : parseInt(value, 10);
  }
  return isNaN(value) ? defaultValue : value;
}

function findRelevantErrors(items) {
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
    if (items.some((item) => item && item.type === type)) {
      let title = "";

      if (type === "make-error") title = "Build Error";
      else if (type === "delivery-error") title = "Delivery Error";
      else if (type === "crash") title = "Crashed";
      else if (type === "banned") title = "Banned";
      else if (type === "coding-style-fail") title = "Style Fail";
      else if (type === "no-test-passed") title = "No Tests Passed";
      else title = "Error";

      errorsFound.push(title);
    }
  });

  return errorsFound;
}

function createCoverageCircle(label, percentage, size = 80) {
  const radius = size / 2 - 4;

  const circumference = 2 * Math.PI * radius;

  const offset = circumference * (1 - percentage / 100);

  const item = document.createElement("div");

  item.className = "coverage-item";

  const circleProgress = document.createElement("div");

  circleProgress.className = "circle-progress";

  circleProgress.style.width = `${size}px`;

  circleProgress.style.height = `${size}px`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  svg.setAttribute("width", size);

  svg.setAttribute("height", size);

  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

  const bgCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );

  bgCircle.setAttribute("class", "circle-bg");

  bgCircle.setAttribute("cx", size / 2);

  bgCircle.setAttribute("cy", size / 2);

  bgCircle.setAttribute("r", radius);

  const fillCircle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );

  fillCircle.setAttribute("class", "circle-progress-fill");

  if (percentage >= 75) fillCircle.classList.add("high");
  else if (percentage >= 40) fillCircle.classList.add("medium");
  else fillCircle.classList.add("low");

  fillCircle.setAttribute("cx", size / 2);

  fillCircle.setAttribute("cy", size / 2);

  fillCircle.setAttribute("r", radius);

  fillCircle.setAttribute("stroke-dasharray", circumference);

  fillCircle.setAttribute("stroke-dashoffset", circumference);

  requestAnimationFrame(() => {
    setTimeout(() => {
      fillCircle.style.strokeDashoffset = offset;
    }, 50);
  });

  const text = document.createElement("div");

  text.className = "circle-text";

  text.textContent = Math.round(percentage);

  text.style.fontSize = `${size * 0.225}px`;

  svg.appendChild(bgCircle);

  svg.appendChild(fillCircle);

  circleProgress.appendChild(svg);

  circleProgress.appendChild(text);

  const labelDiv = document.createElement("div");

  labelDiv.className = "coverage-label";

  labelDiv.textContent = label;

  item.appendChild(circleProgress);

  item.appendChild(labelDiv);

  return item;
}
