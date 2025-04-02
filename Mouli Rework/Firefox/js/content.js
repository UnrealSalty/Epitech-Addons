const BUTTON_ID = "mouli-rework-button";
const BUTTON_STYLE_ID = "mouli-rework-button-style";
const TARGET_HASH_REGEX = /^#y\/\d+$/;
const TOKEN_KEY = "argos-api.oidc-token";
let visibilityCheckInterval = null;
let tokenCheckInterval = null;

function addButtonStyle() {
  if (document.getElementById(BUTTON_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = BUTTON_STYLE_ID;
  style.textContent = `
    :root {
      --mr-primary: #5d5fef;
      --mr-primary-dark: #4945e4;
      --mr-accent: #ff6b6b;
    }

    #${BUTTON_ID} {
      position: fixed;
      top: 130px;
      right: 20px;
      z-index: 99999;
      padding: 12px 24px;
      font-family: "Manrope", sans-serif;
      font-size: 15px;
      font-weight: 700;
      color: white;
      background: linear-gradient(90deg, var(--mr-primary, #5D5FEF), var(--mr-primary-dark, #4945E4));
      border: none;
      border-radius: 10px;
      cursor: pointer;
      text-decoration: none;
      box-shadow: 0 5px 15px rgba(73, 69, 228, 0.35);
      transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
      opacity: 0.95;
      transform: perspective(1px) translateZ(0);
    }

    #${BUTTON_ID}:hover {
      background: linear-gradient(90deg, var(--mr-primary-dark, #4945E4), var(--mr-accent, #FF6B6B));
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 10px 25px rgba(255, 107, 107, 0.4);
      opacity: 1;
    }

    #${BUTTON_ID}:active {
       transform: translateY(-1px) scale(1.02);
       box-shadow: 0 4px 10px rgba(73, 69, 228, 0.3);
    }
  `;

  document.head.appendChild(style);
}

function addBetterViewButton() {
  if (document.getElementById(BUTTON_ID)) {
    return;
  }

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return;
  }

  if (token.startsWith('"') && token.endsWith('"')) {
    token = token.substring(1, token.length - 1);
  }

  chrome.runtime.sendMessage(
    {
      action: "validateToken",
      token: token,
    },
    (response) => {
      if (response && response.isValid) {
        addButtonStyle();
        const button = document.createElement("button");
        button.id = BUTTON_ID;
        button.textContent = "Mouli Rework";
        button.addEventListener("click", () => {
          try {
            chrome.runtime.sendMessage({
              action: "storeToken",
              token: token,
            });
            chrome.runtime.sendMessage({
              action: "openDashboard",
            });
          } catch (error) {
            alert(
              "Mouli Rework: An error occurred while trying to open the view."
            );
          }
        });

        if (document.body) {
          document.body.appendChild(button);
        }
      } else {
        removeBetterViewButton();
      }
    }
  );
}

function removeBetterViewButton() {
  const button = document.getElementById(BUTTON_ID);
  if (button) {
    button.remove();
  }
}

function checkUrlAndToggleButton() {
  const shouldShow = TARGET_HASH_REGEX.test(window.location.hash);
  if (shouldShow) {
    addBetterViewButton();
  } else {
    removeBetterViewButton();
  }
}

function stopVisibilityCheck() {
  if (visibilityCheckInterval !== null) {
    clearInterval(visibilityCheckInterval);
    visibilityCheckInterval = null;
  }
  if (tokenCheckInterval !== null) {
    clearInterval(tokenCheckInterval);
    tokenCheckInterval = null;
  }
}

function watchForTokenChanges() {
  let prevToken = localStorage.getItem(TOKEN_KEY);
  if (tokenCheckInterval) {
    clearInterval(tokenCheckInterval);
  }

  tokenCheckInterval = setInterval(() => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    if (currentToken !== prevToken) {
      prevToken = currentToken;
      if (TARGET_HASH_REGEX.test(window.location.hash)) {
        addBetterViewButton();
      }
    }
  }, 1000);
}

function initializeExtension() {
  addButtonStyle();
  window.addEventListener("hashchange", checkUrlAndToggleButton, false);
  startVisibilityCheck();
  window.addEventListener("unload", stopVisibilityCheck);
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === TOKEN_KEY) {
      setTimeout(checkUrlAndToggleButton, 500);
    }
  };
}

function startVisibilityCheck() {
  stopVisibilityCheck();
  checkUrlAndToggleButton();
  visibilityCheckInterval = setInterval(checkUrlAndToggleButton, 5000);
  watchForTokenChanges();
}

initializeExtension();