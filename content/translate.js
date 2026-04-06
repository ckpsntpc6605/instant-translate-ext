window.TG = window.TG || {};

TG.translate = (function () {
  'use strict';

  // Pure: build the message payload for the background service worker
  const buildMessage = (text, { sourceLang, targetLang, model }) => ({
    type: 'translate',
    text,
    sourceLang,
    sourceName: TG.languages.getName(sourceLang),
    targetLang,
    targetName: TG.languages.getName(targetLang),
    model
  });

  // Side-effect: send a translation request via background and dispatch result
  const send = (text, settings, onSuccess, onError) => {
    const message = buildMessage(text, settings);
    chrome.runtime.sendMessage(message, (response) => {
      if (!response) return onError('No response — is Ollama running?');
      response.success ? onSuccess(response.translation) : onError(response.error);
    });
  };

  return Object.freeze({ buildMessage, send });
})();
