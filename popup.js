document.addEventListener("DOMContentLoaded", () => {
  const runBtn = document.getElementById("runBtn");
  const curlInput = document.getElementById("curlInput");

  const sendCurl = (event) => {
    event.preventDefault();
    const text = curlInput.value.trim();
    if (!text) return alert("Please enter a cURL command.");

    chrome.runtime.sendMessage({ type: "EXECUTE_CURL", text }, (response) => {
      if (!response?.success) {
        alert(response?.error || "Something went wrong");
      }
    });
  };

  runBtn.addEventListener("click", sendCurl);
  curlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurl(e);
    }
  });
});
