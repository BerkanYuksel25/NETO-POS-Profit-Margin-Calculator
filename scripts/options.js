let currentMessageNode = { severity: "", active: false };

const showMessage = (message, severity) => {
  if (!currentMessageNode.active || currentMessageNode.severity !== severity) {
    currentMessageNode.active = true;
    currentMessageNode.severity = severity;

    const icon = document.createElement("span");
    icon.classList.add("material-icons", "status", "status-icon");

    icon.appendChild(
      severity === "success"
        ? document.createTextNode("check_circle")
        : document.createTextNode("error")
    );

    icon.setAttribute(
      "id",
      severity === "success" ? "success-icon" : "error-icon"
    );

    const statusText = document.createElement("span");
    statusText.className = "status";
    statusText.appendChild(document.createTextNode(message));

    const box = document.createElement("div");
    box.classList.add("status-box");
    box.appendChild(icon);
    box.appendChild(statusText);

    const mainContainer = document.getElementById("main-container");
    mainContainer.appendChild(box);

    setTimeout(() => {
      mainContainer.removeChild(box);
      currentMessageNode.active = false;
    }, 4000);
  }
};

const save_options = () => {
  const apiUrl = document.getElementById("api-url").value;
  const apiUser = document.getElementById("api-user").value;
  const apiKey = document.getElementById("api-key").value;

  if (!apiUrl.length || !apiUser.length || !apiKey.length) {
    showMessage("Please provide a NETO API URL, User and Key.", "error");
    return;
  }

  chrome.storage.sync.set(
    { apiUrl: apiUrl, apiUser: apiUser, apiKey: apiKey },
    () => {
      console.log("saved");
    }
  );

  showMessage("Your NETO API settings have been set.", "success");
};

const restore_options = () => {
  chrome.storage.sync.get(["apiUrl", "apiUser", "apiKey"], (items) => {
    if (!items.apiUrl || !items.apiUser || !items.apiKey) {
      document.getElementById("api-url").value = "";
      document.getElementById("api-user").value = "";
      document.getElementById("api-key").value = "";
    } else {
      document.getElementById("api-url").value = items.apiUrl;
      document.getElementById("api-user").value = items.apiUser;
      document.getElementById("api-key").value = items.apiKey;
    }
  });
};

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
