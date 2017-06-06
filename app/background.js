const storage = chrome.storage;
const runtime = chrome.runtime;
const tabs = chrome.tabs;
const browserAction = chrome.browserAction;

const tabsizeList = [2, 4, 8];
const DEFAULT_TABSIZE = 8;

let currentTabsize;

const isGithub = (url) => {
  const githubPatterns = [
    /^https:\/\/([^\.]+\.)*github\.com/,
    /^https:\/\/github\./
  ];
  return githubPatterns.some(regex => regex.test(url));
};

const setIcon = (tabsize) => {
  browserAction.setIcon({path: `assets/tabsize-${tabsize}.png`});
};

browserAction.onClicked.addListener((tab) => {
  const index = (tabsizeList.indexOf(currentTabsize) + 1) % tabsizeList.length;
  const tabsize = tabsizeList[index];

  currentTabsize = tabsize;
  setIcon(tabsize);

  // need permission: `activeTab` for tab.url
  if (isGithub(tab.url)) {
    tabs.connect(tab.id).postMessage(tabsize);
  }

  storage.local.set({tabsize}, () => {
    storage.sync.set({tabsize});
  });
});

tabs.onActivated.addListener((activeInfo) => {
  tabs.get(activeInfo.tabId, (tab) => {
    // need permission: `activeTab` for tab.url
    if (isGithub(tab.url)) {
      tabs.connect(tab.id).postMessage(currentTabsize);
    }
  });
});

runtime.onConnect.addListener((port) => {
  const sender = port.sender;
  const tab = sender ? sender.tab : null;

  port.disconnect();

  if (tab) {
    tabs.connect(tab.id).postMessage(currentTabsize);
  }
});

storage.onChanged.addListener((changes, area) => {
  if (!changes.tabsize) {
    return;
  }

  const newTabsize = changes.tabsize.newValue;

  switch (area) {
  case 'sync':
    storage.local.set({tabsize: newTabsize});
    break;

  case 'local':
    setIcon(newTabsize);

    tabs.query({active: true}, (matchedTabs) => {
      matchedTabs.forEach((tab) => {
        // need permission `tabs` for tab.url
        if (tab && isGithub(tab.url)) {
          tabs.connect(tab.id).postMessage(newTabsize);
        }
      });
    });
    break;

  default:
  }
});

storage.local.get('tabsize', (data) => {
  let tabsize = data.tabsize;

  if (!tabsize) {
    tabsize = DEFAULT_TABSIZE;
    storage.local.set({tabsize});
  }

  currentTabsize = tabsize;
  setIcon(tabsize);
});
