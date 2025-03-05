const projects = {};
const skillsCache = {};
let settings = {
  autoExpand: false,
  highContrast: false
};
browser.storage.local.get(['autoExpand', 'highContrast']).then((result) => {
  settings.autoExpand = result.autoExpand || false;
  settings.highContrast = result.highContrast || false;
});
browser.storage.onChanged.addListener((changes) => {
  if (changes.autoExpand) {
    settings.autoExpand = changes.autoExpand.newValue;
  }
  if (changes.highContrast) {
    settings.highContrast = changes.highContrast.newValue;
    updatePercentages();
  }
});
const styles = `
.epi-percentage-container {
  margin-top: 10px;
  width: 100%;
  font-family: 'Roboto', sans-serif;
}

.epi-progress-bar {
  height: 10px;
  border-radius: 5px;
  margin: 5px 0;
  overflow: hidden;
  background-color: rgba(200, 200, 200, 0.3);
  position: relative;
}

.epi-progress-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.5s ease-in-out;
}

.epi-percentage-text {
  font-weight: 500;
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.epi-skill-details {
  margin-top: 10px;
  font-size: 14px;
  border-left: 3px solid #ccc;
  padding-left: 10px;
}

.epi-skill-item {
  margin: 8px 0;
  display: flex;
  justify-content: space-between;
}

.epi-skill-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px;
}

.epi-skill-status {
  font-weight: 500;
}

.epi-skill-passed {
  color: #4caf50;
}

.epi-skill-failed {
  color: #f44336;
}

.epi-expand-btn {
  background: none;
  border: none;
  color: #3f51b5;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: 13px;
  margin-top: 5px;
}

.epi-expand-btn:hover {
  color: #5c6bc0;
}

.epi-summary {
  margin-top: 5px;
  font-size: 13px;
  color: #666;
}

/* High contrast mode */
.high-contrast .epi-skill-passed {
  color: #00c853;
  font-weight: bold;
}

.high-contrast .epi-skill-failed {
  color: #d50000;
  font-weight: bold;
}
`;
function injectStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);
}
function debugLog() {
  console.log("EnhancedEpitechPercentages:", ...arguments);
}

function debugWarn() {
  console.warn("EnhancedEpitechPercentages:", ...arguments);
}

function debugError() {
  console.error("EnhancedEpitechPercentages:", ...arguments);
}
function includes(a, b) {
  const len = a.length;
  for(let i = 0; i < len; i++) {
    if(a[i] == b)
      return true;
  }
  return false;
}

function findParentBySelector(node, selector) {
  const all = document.querySelectorAll(selector);
  let cur = node.parentNode;

  while (cur && !includes(all, cur)) {
    cur = cur.parentNode;
  }
  return cur;
}
document.addEventListener("__xmlrequest", (event) => {
  const elements = JSON.parse(event.detail);

  if (!Array.isArray(elements))
    return;
  
  for (let element of elements) {
    if (typeof element !== "object" || typeof element.project !== "object" || typeof element.project.name !== "string")
      continue;
    
    projects[element.project.name] = element;
    if (element.results && element.results.skills) {
      skillsCache[element.project.name] = element.results.skills;
    }
  }
});
async function fetchProjects() {
  debugLog("Fetching projects...");
  const [kind, year] = window.location.hash?.split("/");
  
  if (kind == "p")
    debugLog("History not yet supported!");
  
  try {
    const token = localStorage.getItem("argos-api.oidc-token").replace(/"/g, "");
    if (!token) {
      debugError("No authentication token found!");
      return;
    }
    
    const response = await fetch("https://api.epitest.eu/me/" + year, {
      headers: {
        Authorization: "Bearer " + token
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const elements = await response.json();
    
    if (!Array.isArray(elements)) {
      debugWarn("Projects JSON is not an array!");
      return;
    }
    
    for (let element of elements) {
      if (typeof element !== "object" || typeof element.project !== "object" || typeof element.project.name !== "string")
        continue;
      
      projects[element.project.name] = element;
      if (element.results && element.results.skills) {
        skillsCache[element.project.name] = element.results.skills;
      }
    }
  } catch (error) {
    debugError("Error fetching projects:", error);
  }
}
function getColorForPercentage(percentage) {
  if (settings.highContrast) {
    if (percentage >= 90) return '#00c853';
    if (percentage >= 75) return '#64dd17';
    if (percentage >= 50) return '#ffd600';
    if (percentage >= 25) return '#ff9100';
    return '#d50000';
  } else {
    if (percentage >= 90) return '#4caf50';
    if (percentage >= 75) return '#8bc34a';
    if (percentage >= 50) return '#ffc107';
    if (percentage >= 25) return '#ff9800';
    return '#f44336';
  }
}
function setEnhancedPercentage(statusElement, projectName, percentage) {
  const color = getColorForPercentage(percentage);
  const container = document.createElement('div');
  container.className = 'epi-percentage-container';
  if (settings.highContrast) {
    container.classList.add('high-contrast');
  }
  const percentageText = document.createElement('div');
  percentageText.className = 'epi-percentage-text';
  percentageText.innerHTML = `
    <span>Passed - ${percentage}%</span>
    <span>${percentage < 100 ? `${100 - percentage}% remaining` : 'Complete'}</span>
  `;
  const progressBar = document.createElement('div');
  progressBar.className = 'epi-progress-bar';
  
  const progressFill = document.createElement('div');
  progressFill.className = 'epi-progress-fill';
  progressFill.style.width = `${percentage}%`;
  progressFill.style.backgroundColor = color;
  
  progressBar.appendChild(progressFill);
  container.appendChild(percentageText);
  container.appendChild(progressBar);
  if (skillsCache[projectName]) {
    const skills = skillsCache[projectName];
    const skillDetails = document.createElement('div');
    skillDetails.className = 'epi-skill-details';
    skillDetails.style.display = settings.autoExpand ? 'block' : 'none';
    
    const skillsList = Object.entries(skills).map(([skillName, skillData]) => {
      const passRate = skillData.passed / skillData.count * 100;
      const status = skillData.passed === skillData.count ? 'passed' : 'failed';
      
      return `
        <div class="epi-skill-item">
          <div class="epi-skill-name">${skillName}</div>
          <div class="epi-skill-status epi-skill-${status}">
            ${skillData.passed}/${skillData.count} (${passRate.toFixed(0)}%)
          </div>
        </div>
      `;
    }).join('');
    
    skillDetails.innerHTML = skillsList;
    const expandBtn = document.createElement('button');
    expandBtn.className = 'epi-expand-btn';
    expandBtn.textContent = settings.autoExpand ? 'Hide skill details' : 'Show skill details';
    expandBtn.onclick = () => {
      const isHidden = skillDetails.style.display === 'none';
      skillDetails.style.display = isHidden ? 'block' : 'none';
      expandBtn.textContent = isHidden ? 'Hide skill details' : 'Show skill details';
    };
    
    container.appendChild(expandBtn);
    container.appendChild(skillDetails);
    const failedSkills = Object.entries(skills).filter(([_, skillData]) => 
      skillData.passed < skillData.count
    );
    
    if (failedSkills.length > 0) {
      const summary = document.createElement('div');
      summary.className = 'epi-summary';
      
      if (failedSkills.length <= 3) {
        summary.textContent = `Focus on: ${failedSkills.map(([name, _]) => name).join(', ')}`;
      } else {
        summary.textContent = `${failedSkills.length} skills need improvement`;
      }
      
      container.appendChild(summary);
    }
  }
  statusElement.innerHTML = '';
  statusElement.appendChild(container);
}
async function updatePercentages() {
  debugLog("Updating percentages...");
  document.querySelectorAll(".remove-on-percentage-update").forEach(e => e.remove());
  const projectStatusElements = document.querySelectorAll(".mdl-color-text--primary.mdl-typography--title-color-contrast.mdl-cell");
  
  for (const projectStatus of projectStatusElements) {
    if (!projectStatus.textContent.includes("Prerequisites met") && !projectStatus.textContent.trim().startsWith("Passed - ")) continue;
    const projectCardElement = findParentBySelector(projectStatus, ".mdl-card");
    if (!projectCardElement) {
      debugLog("Project card not found!");
      continue;
    }
    
    const projectNameSpan = projectCardElement.querySelector(".mdl-card__title-text span");
    if (!projectNameSpan) {
      debugLog("Project name span not found!");
      continue;
    }
    
    const projectName = projectNameSpan.textContent.trim();
    if (typeof projects[projectName] === "undefined") {
      debugLog("Project " + projectName + " not fetched yet!");
      await fetchProjects();
    }
    
    const projectData = projects[projectName];
    if (!projectData || !projectData.results || !projectData.results.skills) {
      debugWarn(`No skill data available for ${projectName}`);
      continue;
    }
    const skillsArr = Object.values(projectData.results.skills);
    const passed = skillsArr.map(s => s.passed).reduce((prev, curr) => prev + curr, 0);
    const count = skillsArr.map(s => s.count).reduce((prev, curr) => prev + curr, 0);
    const percentage = (passed / count * 100).toFixed(0);
    setEnhancedPercentage(projectStatus, projectName, percentage);
  }
}
function initialize() {
  debugLog("Initializing Enhanced Epitech Percentages...");
  injectStyles();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        updatePercentages();
        return;
      }
    }
  });
  
  observer.observe(document.querySelector("body"), { 
    attributes: true, 
    subtree: true, 
    attributeFilter: ["class"] 
  });
  document.querySelector(".mdl-layout__container").addEventListener('click', () => {
    setTimeout(updatePercentages, 300);
  });
  setTimeout(updatePercentages, 500);
}
const inject = () => {
  const send = window.XMLHttpRequest.prototype.send;
  
  function sendreplacement(data) {
    if (this.onreadystatechange)
      this._onreadystatechange = this.onreadystatechange;
    
    debugLog("Request: send");
    this.onreadystatechange = onreadystatechangereplacement;
    return send.apply(this, arguments);
  }
  
  function onreadystatechangereplacement(event) {
    try {
      if (event.target.readyState === 4 && event.target.status === 200) {
        const responseContent = event.target.response;
        if (event.target.responseURL.includes("api.epitest.eu")) {
          document.dispatchEvent(new CustomEvent('__xmlrequest', {
            detail: responseContent
          }));
        }
      }
    } catch(ex) { 
      debugError("Error in XHR intercept:", ex);
    }
    
    if (this._onreadystatechange)
      return this._onreadystatechange.apply(this, arguments);
  }
  
  window.XMLHttpRequest.prototype.send = sendreplacement;
  debugLog("XHR Interceptor injected");
};
initialize();
const actualCode = '(' + inject + ')();';
const script = document.createElement('script');
script.textContent = actualCode;
(document.head || document.documentElement).appendChild(script);
script.remove();