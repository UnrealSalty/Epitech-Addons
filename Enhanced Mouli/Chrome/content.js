const projects = {};
const skillsCache = {};
const expandedSkills = {};
let settings = {
  autoExpand: false,
  highContrast: false
};

chrome.storage.local.get(['autoExpand', 'highContrast'], (result) => {
  settings.autoExpand = result.autoExpand || false;
  settings.highContrast = result.highContrast || false;
});

chrome.storage.onChanged.addListener((changes) => {
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
  console.log("EnhancedMouli:", ...arguments);
}

function debugWarn() {
  console.warn("EnhancedMouli:", ...arguments);
}

function debugError() {
  console.error("EnhancedMouli:", ...arguments);
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

let historyData = {};

document.addEventListener("__xmlrequest", (event) => {
  try {
    const data = JSON.parse(event.detail);
    
    if (!Array.isArray(data)) return;
    
    const isHistoryPage = window.location.hash?.substring(1).startsWith("p/");
    
    if (isHistoryPage) {
      const hashParts = window.location.hash?.substring(1).split("/");
      const module = hashParts[2];
      const projectSlug = hashParts[3];
      
      if (module && projectSlug) {
        const key = `${module}/${projectSlug}`;
        historyData[key] = data;

        data.forEach(item => {
          if (item && item.project && item.project.name && item.results && item.results.testRunId) {
            const projectName = item.project.name;
            const testRunId = item.results.testRunId;
            projects[`${projectName}_${testRunId}`] = item;
            
            if (item.results.skills) {
              skillsCache[`${projectName}_${testRunId}`] = item.results.skills;
            }
          }
        });
      }
    } else {
      data.forEach(element => {
        if (typeof element !== "object" || typeof element.project !== "object" || typeof element.project.name !== "string")
          return;
        
        projects[element.project.name] = element;
        if (element.results && element.results.skills) {
          skillsCache[element.project.name] = element.results.skills;
        }
      });
    }
  } catch (ex) {
    debugError("Error processing API response:", ex);
  }
});

async function fetchProjects() {
  const hashStr = window.location.hash?.substring(1) || "";
  const hashParts = hashStr.split("/");
  const kind = hashParts[0];
  const year = hashParts[1];
  const module = hashParts[2];
  const projectSlug = hashParts[3];
  
  const isHistoryPage = kind === "p";
  
  try {
    const token = localStorage.getItem("argos-api.oidc-token").replace(/"/g, "");
    if (!token) {
      debugError("No authentication token found!");
      return;
    }
    
    let url;
    if (isHistoryPage && module && projectSlug) {
      url = `https://api.epitest.eu/me/${year}/${module}/${projectSlug}`;
      debugLog("Using history URL:", url);
    } else {
      url = `https://api.epitest.eu/me/${year}`;
      debugLog("Using year URL:", url);
    }
    
    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer " + token
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      debugWarn("API response is not an array!");
      return;
    }
    
    if (isHistoryPage) {
      historyData[`${module}/${projectSlug}`] = data;
      data.forEach(item => {
        if (item && item.project && item.project.name && item.results && item.results.testRunId) {
          const projectName = item.project.name;
          const testRunId = item.results.testRunId;
          
          projects[`${projectName}_${testRunId}`] = item;
          
          if (item.results.skills) {
            skillsCache[`${projectName}_${testRunId}`] = item.results.skills;
          }
        }
      });
    } else {
      data.forEach(element => {
        if (typeof element !== "object" || typeof element.project !== "object" || typeof element.project.name !== "string")
          return;
        
        projects[element.project.name] = element;
        if (element.results && element.results.skills) {
          skillsCache[element.project.name] = element.results.skills;
        }
      });
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

function setEnhancedPercentage(statusElement, projectKey, percentage, error_label) {
  const color = getColorForPercentage(percentage);
  const container = document.createElement('div');
  container.className = 'epi-percentage-container';
  
  if (settings.highContrast) {
    container.classList.add('high-contrast');
  }
  
  if (error_label !== null && error_label !== undefined) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mdl-color-text--accent';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.marginBottom = '10px';
    errorDiv.style.fontWeight = 'bold';
    errorDiv.textContent = error_label;
    container.appendChild(errorDiv);
  }
  
  const validPercentage = !isNaN(percentage) ? percentage : 0;
  
  const percentageText = document.createElement('div');
  percentageText.className = 'epi-percentage-text';
  percentageText.innerHTML = `
    <span>Passed - ${validPercentage}%</span>
    <span>${validPercentage < 100 ? `${100 - validPercentage}% remaining` : 'Complete'}</span>
  `;
  
  const progressBar = document.createElement('div');
  progressBar.className = 'epi-progress-bar';
  
  const progressFill = document.createElement('div');
  progressFill.className = 'epi-progress-fill';
  progressFill.style.width = `${validPercentage}%`;
  progressFill.style.backgroundColor = color;
  
  progressBar.appendChild(progressFill);
  container.appendChild(percentageText);
  container.appendChild(progressBar);
  
  if (skillsCache[projectKey]) {
    const skills = skillsCache[projectKey];
    const skillDetails = document.createElement('div');
    skillDetails.className = 'epi-skill-details';
    skillDetails.style.display = (settings.autoExpand || expandedSkills[projectKey]) ? 'block' : 'none';
    
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
    expandBtn.textContent = (settings.autoExpand || expandedSkills[projectKey]) ? 'Hide skill details' : 'Show skill details';
    expandBtn.onclick = (event) => {
      event.stopPropagation();
      const isHidden = skillDetails.style.display === 'none';
      skillDetails.style.display = isHidden ? 'block' : 'none';
      expandBtn.textContent = isHidden ? 'Hide skill details' : 'Show skill details';
      expandedSkills[projectKey] = isHidden;
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

function findTestRunIdByDate(projectName, dateText) {
  const hashParts = window.location.hash?.substring(1).split("/");
  const module = hashParts[2];
  const projectSlug = hashParts[3];
  const key = `${module}/${projectSlug}`;
  
  const data = historyData[key];
  if (!data || !Array.isArray(data)) return null;
  
  const dateMatch = dateText.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+)/);
  if (!dateMatch) return null;
  
  const day = parseInt(dateMatch[1]);
  const month = parseInt(dateMatch[2]) - 1;
  const year = parseInt(dateMatch[3]);
  const hour = parseInt(dateMatch[4]);
  const minute = parseInt(dateMatch[5]);
  
  const cardDate = new Date(year, month, day, hour, minute);
  
  let bestMatch = null;
  let smallestDiff = Infinity;
  
  for (const item of data) {
    if (item.project.name === projectName && item.results && item.results.testRunId && item.date) {
      const runDate = new Date(item.date);
      const diff = Math.abs(cardDate.getTime() - runDate.getTime());
      
      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestMatch = item;
      }
    }
  }
  
  return bestMatch ? bestMatch.results.testRunId : null;
}

async function updatePercentages() {
  document.querySelectorAll(".remove-on-percentage-update").forEach(e => e.remove());
  const projectStatusElements = document.querySelectorAll(".mdl-typography--title-color-contrast.mdl-cell");
  let error_label = null;
  
  const isHistoryPage = window.location.hash?.substring(1).startsWith("p/");
  
  if (isHistoryPage) {
    const hashParts = window.location.hash?.substring(1).split("/");
    const module = hashParts[2];
    const projectSlug = hashParts[3];
    const key = `${module}/${projectSlug}`;
    
    if (!historyData[key]) {
      await fetchProjects();
    }
  }
  
  for (const projectStatus of projectStatusElements) {
    if (projectStatus.getAttribute('data-epi-processed') === 'true') {
      continue;
    }
    projectStatus.setAttribute('data-epi-processed', 'true');
    
    const computedStyle = window.getComputedStyle(projectStatus);
    const textColor = computedStyle.color;
    const rgbValues = textColor.match(/\d+/g);
    if (rgbValues && (parseInt(rgbValues[0]) !== 63 || parseInt(rgbValues[1]) !== 81 || parseInt(rgbValues[2]) !== 181)) {
      error_label = projectStatus.textContent?.trim();
    } else {
      error_label = null;
    }

    const projectCardElement = findParentBySelector(projectStatus, ".mdl-card");
    if (!projectCardElement) {
      continue;
    }
    
    const projectNameSpan = projectCardElement.querySelector(".mdl-card__title-text span");
    if (!projectNameSpan) {
      continue;
    }
    
    const projectName = projectNameSpan.textContent.trim();
    
    const percentageText = projectStatus.textContent || "";
    let hasNaNPercentage = percentageText.includes("NaN") || percentageText.includes("NA");
    
    const percentageMatch = percentageText.match(/Passed\s*-\s*(\d+)%/);
    let directPercentage = percentageMatch ? parseInt(percentageMatch[1]) : null;
    
    if (isHistoryPage) {
      const dateElement = projectCardElement.querySelector(".mdl-typography--text-right");
      if (!dateElement) continue;
      
      const dateText = dateElement.textContent.trim();
      
      const testRunId = findTestRunIdByDate(projectName, dateText);
      if (!testRunId) {
        debugWarn(`Could not find test run ID for ${projectName} on ${dateText}`);
        continue;
      }
      
      const projectKey = `${projectName}_${testRunId}`;
      
      if (!projects[projectKey] || !projects[projectKey].results) {
        continue;
      }
      
      if (hasNaNPercentage || error_label) {
        setEnhancedPercentage(projectStatus, projectKey, 0, error_label);
        continue;
      }
      
      if (directPercentage !== null) {
        setEnhancedPercentage(projectStatus, projectKey, directPercentage, error_label);
        continue;
      }
      
      if (projects[projectKey].results.skills) {
        const skillsArr = Object.values(projects[projectKey].results.skills);
        if (skillsArr.length === 0) {
          setEnhancedPercentage(projectStatus, projectKey, 0, error_label);
          continue;
        }
        
        const passed = skillsArr.map(s => s.passed).reduce((prev, curr) => prev + curr, 0);
        const count = skillsArr.map(s => s.count).reduce((prev, curr) => prev + curr, 0);
        const percentage = count === 0 ? 0 : (passed / count * 100).toFixed(0);
        
        setEnhancedPercentage(projectStatus, projectKey, percentage, error_label);
      } else {
        setEnhancedPercentage(projectStatus, projectKey, 0, error_label);
      }
    } else {
      if (typeof projects[projectName] === "undefined") {
        await fetchProjects();
      }
      
      if (hasNaNPercentage || error_label) {
        setEnhancedPercentage(projectStatus, projectName, 0, error_label);
        continue;
      }
      
      if (directPercentage !== null) {
        setEnhancedPercentage(projectStatus, projectName, directPercentage, error_label);
        continue;
      }
      
      const projectData = projects[projectName];
      if (!projectData || !projectData.results) {
        continue;
      }
      
      if (projectData.results.skills) {
        const skillsArr = Object.values(projectData.results.skills);
        if (skillsArr.length === 0) {
          setEnhancedPercentage(projectStatus, projectName, 0, error_label);
          continue;
        }
        
        const passed = skillsArr.map(s => s.passed).reduce((prev, curr) => prev + curr, 0);
        const count = skillsArr.map(s => s.count).reduce((prev, curr) => prev + curr, 0);
        const percentage = count === 0 ? 0 : (passed / count * 100).toFixed(0);
        
        setEnhancedPercentage(projectStatus, projectName, percentage, error_label);
      } else {
        setEnhancedPercentage(projectStatus, projectName, 0, error_label);
      }
    }
  }
}

window.addEventListener('hashchange', () => {
  document.querySelectorAll('[data-epi-processed="true"]').forEach(el => {
    el.removeAttribute('data-epi-processed');
  });
});

function initialize() {
  injectStyles();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        setTimeout(updatePercentages, 300);
        return;
      }
    }
  });
  
  observer.observe(document.body, { 
    attributes: true, 
    subtree: true, 
    attributeFilter: ["class"] 
  });
  
  const layoutContainer = document.querySelector(".mdl-layout__container");
  if (layoutContainer) {
    layoutContainer.addEventListener('click', () => {
      setTimeout(updatePercentages, 300);
    });
  } else {
    document.addEventListener('click', () => {
      setTimeout(updatePercentages, 300);
    });
  }
  
  setTimeout(updatePercentages, 500);
}

const inject = () => {
  const send = window.XMLHttpRequest.prototype.send;
  
  function sendreplacement(data) {
    if (this.onreadystatechange)
      this._onreadystatechange = this.onreadystatechange;
    
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
};

initialize();
const actualCode = '(' + inject + ')();';
const script = document.createElement('script');
script.textContent = actualCode;
(document.head || document.documentElement).appendChild(script);
script.remove();