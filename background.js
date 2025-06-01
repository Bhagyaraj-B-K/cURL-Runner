importScripts("parse-curl.js");

chrome.omnibox.onInputEntered.addListener(async (text) => {
  try {
    const parsed = parseCurlCommand(text);
    const { url, method, headers, body } = parsed;

    await chrome.storage.session.set({
      curlRequest: { url, method, headers, body },
    });

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.update(tabs[0].id, {
        url: chrome.runtime.getURL("runner.html"),
      });
    });
  } catch (err) {
    console.error("Invalid curl:", err);
  }
});

chrome.omnibox.onInputChanged.addListener((text) => {
  chrome.action.setBadgeText({ text });
});
