if (!window.hasDownloadListenersInjected) {
    window.hasDownloadListenersInjected = true;

    let links = [];
    let observer;
    let isExtensionEnabled = false; 

    function updateLinks() {
        // Get all links and filter them
        links = document.querySelectorAll('a[href*="blob"]');
        links = Array.from(links).filter(link => {
            const filename = link.href.split('/').pop();
            return !filename.startsWith('.');
        });
    }

    function addDownloadListeners() {
        if (!isExtensionEnabled) return; // Listeners are not added if the extension is disabled

        updateLinks(); // Update the list of links

        links.forEach(link => {
            link.addEventListener('click', handleDownload);
        });

        console.log('Download listeners added.');
    }

    function removeDownloadListeners() {
        links.forEach(link => {
            link.removeEventListener('click', handleDownload);
        });

        console.log('Download listeners removed.');
    }

    function handleDownload(event) {
        if (!isExtensionEnabled) return; // Prevent download if the extension is disabled

        event.preventDefault();
        var url = event.currentTarget.href;

        if (url.includes('github.com') && url.includes('/blob/')) {
            url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        var filename = url.split('/').pop(); // Extract the file name

        chrome.runtime.sendMessage({ downloadUrl: url, filename: filename });
        }

    function observePageChanges() {
        observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    updateLinks(); // Update the list of links on DOM changes
                    if (isExtensionEnabled) {
                        addDownloadListeners();
                    }
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'ping') {
            sendResponse({ status: 'active' });
            return true; }
        if (message.action === 'enable') {
            isExtensionEnabled = true;
            addDownloadListeners();
            // Observe page changes only if the extension is enabled
            observePageChanges();
        } else if (message.action === 'disable') {
            isExtensionEnabled = false;
            removeDownloadListeners();
            if (observer) {
                observer.disconnect();
            }
        }
    });

    // Initial setup
    document.addEventListener('DOMContentLoaded', () => {
        updateLinks(); // Update links on DOM content loaded
        observePageChanges();
    });
}