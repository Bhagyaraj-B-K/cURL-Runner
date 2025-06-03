// MIT License
// Copyright (c) 2025 Bhagyaraj BK

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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "EXECUTE_CURL" && message.text) {
    try {
      const parsed = parseCurlCommand(message.text);
      const { url, method, headers, body } = parsed;

      chrome.storage.session.set(
        { curlRequest: { url, method, headers, body } },
        () => {
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              chrome.tabs.update(tabs[0].id, {
                url: chrome.runtime.getURL("runner.html"),
              });
            }
          );
        }
      );
      sendResponse({ success: true });
    } catch (err) {
      console.error("Invalid cURL:", err);
      sendResponse({ success: false, error: "Invalid cURL command" });
    }
    return true;
  }
});
