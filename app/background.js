const runtime = chrome.runtime;
const tabs = chrome.tabs;
const storage = chrome.storage;
const browserAction = chrome.browserAction;

const githubPattern = /^https:\/\/(.+\.)*github\.com/;
const tabsizeList = [2, 4, 8];
let currentTabsize = 8;

const setIcon = (tabsize, callback) => {
  browserAction.setIcon({path: `assets/tabsize-${tabsize}.png`}, callback);
};

browserAction.onClicked.addListener((tab) => {
  const index = (tabsizeList.indexOf(currentTabsize) + 1) % tabsizeList.length;
  const tabsize = tabsizeList[index];
  setIcon(tabsize, () => {
    if (githubPattern.test(tab.url)) {
      tabs.sendMessage(tab.id, tabsize);
    }
    currentTabsize = tabsize;
    storage.sync.set({tabsize});
  });
});

tabs.onActivated.addListener((activeInfo) => {
  tabs.get(activeInfo.tabId, (tab) => {
    if (githubPattern.test(tab.url)) {
      tabs.sendMessage(tab.id, currentTabsize);
    }
  });
});

runtime.onConnect.addListener((port) => {
  const tab = port.sender.tab;
  if (tab) {
    tabs.sendMessage(tab.id, currentTabsize, () => {
      port.disconnect();
    });
  }
});

runtime.onInstalled.addListener(() => {
  storage.sync.get('tabsize', (data) => {
    if (data.tabsize) {
      currentTabsize = data.tabsize;
    } else {
      storage.sync.set({tabsize: 8});
    }
  });
});

storage.onChanged.addListener((changes) => {
  const newTabsize = changes.tabsize.newValue;

  if (newTabsize === currentTabsize) {
    return;
  }

  setIcon(newTabsize, () => {
    tabs.query({active: true}, (matchedTabs) => {
      const tab = matchedTabs[0];
      if (githubPattern.test(tab.url)) {
        tabs.sendMessage(tab.id, newTabsize);
      }
    });
    currentTabsize = newTabsize;
  });
});

