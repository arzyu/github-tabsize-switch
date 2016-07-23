const runtime = chrome.runtime;

let currentTabsize;
let styleEl;

const setTabsize = (tabsize) => {
  const headEl = document.querySelector('head');
  const newStyleEl = document.createElement('style');

  const cssText = `
  .tab-size[data-tab-size='2'],
  .tab-size[data-tab-size='4'],
  .tab-size[data-tab-size='8'],
  .inline-review-comment,
  .gist table.lines {
    tab-size: ${tabsize} !important;
  }
  `;

  newStyleEl.appendChild(document.createTextNode(cssText));
  headEl.appendChild(newStyleEl);

  if (styleEl) {
    headEl.removeChild(styleEl);
  }

  styleEl = newStyleEl;
};

runtime.onMessage.addListener((tabsize) => {
  if (tabsize !== currentTabsize) {
    currentTabsize = tabsize;
    setTabsize(tabsize);
  }
});

runtime.connect();

