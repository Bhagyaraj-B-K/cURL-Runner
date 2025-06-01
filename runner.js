(async () => {
  const output = document.getElementById("output");

  const payload = await new Promise((resolve) => {
    chrome.storage.session.get("curlRequest", (result) => {
      resolve(result.curlRequest);
    });
  });

  if (!payload) {
    output.textContent = "No request payload found.";
    return;
  }

  const { url, method, headers, body } = payload;

  try {
    delete headers["if-none-match"];
    delete headers["if-modified-since"];

    const res = await fetch(url, {
      method,
      headers,
      body: body || undefined,
    });

    const status = res.status;
    document.title = `Response (${status})`;

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    window.location.href = blobUrl;
  } catch (err) {
    output.textContent = "Request failed: " + err.message;
  }
})();
