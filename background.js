let tabStates = {};

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "update" || details.reason === "install") {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
                tabStates[tab.id] = { enabled: false };
                chrome.action.setBadgeText({ text: "OFF" });
                if (tab.url && tab.url.startsWith("https://github.com/")) {
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['filter_links.js']
                    });
                }
            });
        });
    }
});

const githubUrlPattern = 'https://github.com/';

chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.startsWith(githubUrlPattern)) {
        let isEnabled = tabStates[tab.id] && tabStates[tab.id].enabled;
        tabStates[tab.id] = { enabled: !isEnabled };
        const action = tabStates[tab.id].enabled ? 'enable' : 'disable';

        chrome.action.setBadgeText({ tabId: tab.id, text: tabStates[tab.id].enabled ? 'ON' : 'OFF' });

        if (tabStates[tab.id].enabled && !isEnabled) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['filter_links.js']
            });
        }
        
        chrome.tabs.sendMessage(tab.id, { action: action });
    }
});

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
