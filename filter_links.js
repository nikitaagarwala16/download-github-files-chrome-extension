if (!window.hasDownloadListenersInjected) {
    window.hasDownloadListenersInjected = true;

    let links = [];
    let observer; // To keep track of the observer

    function addDownloadListeners() {

        if(links.length != 0)
        removeDownloadListeners()

        links = document.querySelectorAll('a[href*="blob"]');

        // filtering out files starting with . for example .gitignore 
        links = Array.from(links).filter(link => {
            const filename = link.href.split('/').pop();
            return !filename.startsWith('.');
        });

        var linkUrls = Array.from(links).map(link => link.href);
    
        // Remove duplicates and sort
        linkUrls = [...new Set(linkUrls)];
    
        // Logging the links (for debugging purposes, remove in production)
        for (const link of linkUrls) {
        console.log(link);
        }

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
        event.preventDefault();
        var url = event.currentTarget.href;

        if (url.includes('github.com') && url.includes('/blob/')) {
            url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        var filename = url.split('/').pop(); // Extract the file name

        try {
            // Attempt to send the message
            chrome.runtime.sendMessage({ downloadUrl: url, filename: filename });
        } catch (error) {
            // Log the error or handle it as needed
            console.error('This is known error, currently extension does not support private repositories', error);
        }
    }

    function observePageChanges() {
        observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    addDownloadListeners();
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'ping') {
            sendResponse({ status: 'active' });
        }
        else if (message.action === 'enable') {
            addDownloadListeners();
            observePageChanges();
        } else if (message.action === 'disable') {
            removeDownloadListeners();
            observer.disconnect();
        }
    });

    // Initial setup
    document.addEventListener('DOMContentLoaded', () => {
        addDownloadListeners();
        observePageChanges();
    });
}



