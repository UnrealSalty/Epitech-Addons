document.addEventListener("DOMContentLoaded", () => {
  const errorTitle = document.getElementById("error-title");

  const errorMessage = document.getElementById("error-message");

  const loginButton = document.getElementById("login-button");

  const urlParams = new URLSearchParams(window.location.search);

  const type = urlParams.get("type") || "token";

  const message = urlParams.get("message");

  const returnUrl = urlParams.get("return");

  switch (type) {
    case "token":
      errorTitle.textContent = "Token Expired";

      errorMessage.textContent =
        message ||
        "Your session has expired. Please log in again to continue using Mouli Rework.";

      break;

    case "missing":
      errorTitle.textContent = "Missing Parameter";

      errorMessage.textContent =
        message || "Required parameters are missing from the URL.";

      break;

    case "connection":
      errorTitle.textContent = "Connection Error";

      errorMessage.textContent =
        message ||
        "Failed to connect to the server. Please check your internet connection and try again.";

      break;

    case "not-found":
      errorTitle.textContent = "Not Found";

      errorMessage.textContent =
        message || "The requested resource could not be found.";

      break;

    default:
      errorTitle.textContent = "Error";

      errorMessage.textContent =
        message || "An unexpected error occurred. Please try again later.";
  }

  loginButton.addEventListener("click", () => {
    window.location.href = "https://myresults.epitest.eu/";
  });

  if (returnUrl) {
    const returnButton = document.createElement("button");

    returnButton.textContent = "Return to Dashboard";

    returnButton.className = "secondary-button";

    returnButton.style.marginLeft = "10px";

    returnButton.addEventListener("click", () => {
      window.location.href = returnUrl;
    });

    loginButton.parentNode.insertBefore(returnButton, loginButton.nextSibling);
  }
});
