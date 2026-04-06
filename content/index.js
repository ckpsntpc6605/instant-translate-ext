(function () {
  'use strict';

  // Bootstrap: create Shadow DOM and hand off to tooltip module
  const { host, dot, popup } = TG.core.createShadowDOM();
  TG.tooltip.init(dot, popup, host);

  // Listen for messages from the popup (bilingual toggle)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type !== 'bilingual-toggle') return;

    if (message.enabled) {
      chrome.storage.sync.get(TG.CONSTANTS.DEFAULT_SETTINGS, (settings) => {
        TG.bilingual.start(settings);
      });
    } else {
      TG.bilingual.stop();
    }
  });
})();
