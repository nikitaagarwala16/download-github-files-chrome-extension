let tabStates = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      tabStates[tab.id] = { enabled: false };
      chrome.action.setBadgeText({ text: "OFF" });
    });
  });
});

const githubUrlPattern = 'https://github.com/';

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError || !response) {
            // Content script not loaded, so inject it
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['filter_links.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to inject content script:', chrome.runtime.lastError.message);
                    return;
                }
                toggleExtension(tab);
            });
        } else {
            // Content script is loaded, proceed to toggle
            toggleExtension(tab);
        }
    });
});

function toggleExtension(tab) {
    let isEnabled = tabStates[tab.id] && tabStates[tab.id].enabled;
    tabStates[tab.id] = { enabled: !isEnabled };
    chrome.action.setBadgeText({ tabId: tab.id, text: tabStates[tab.id].enabled ? 'ON' : 'OFF' });

    // Send a message to the content script to update its behavior
    let action = tabStates[tab.id].enabled ? 'enable' : 'disable';
    chrome.tabs.sendMessage(tab.id, { action: action });
}



chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith(githubUrlPattern)) {
        const action = tabStates[tabId] && tabStates[tabId].enabled ? 'enable' : 'disable';
        chrome.tabs.sendMessage(tabId, { action: action });
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.downloadUrl) {
        chrome.downloads.download({
            url: message.downloadUrl,
            filename: message.filename
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    delete tabStates[tabId];
});
