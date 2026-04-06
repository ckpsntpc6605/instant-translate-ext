window.TG = window.TG || {};

TG.bilingual = (function () {
  'use strict';

  // ── Private state ──

  let _active = false;
  let _queue = [];
  let _settings = null;

  // ── Element selection ──

  const isEligible = (el) => {
    // Skip interactive / navigational elements and their descendants
    if (el.closest('button, nav, label, header, footer, [role="button"], [role="navigation"]')) return false;

    // Skip already-translated nodes or parents that already contain one
    if (el.hasAttribute(TG.CONSTANTS.BILINGUAL_ATTR)) return false;
    if (el.querySelector(`[${TG.CONSTANTS.BILINGUAL_ATTR}]`)) return false;

    return el.innerText.trim().length >= TG.CONSTANTS.MIN_TEXT_LENGTH;
  };

  const collectElements = () =>
    Array.from(document.querySelectorAll(TG.CONSTANTS.BILINGUAL_TARGETS))
      .filter(isEligible);

  // ── Translation injection ──

  const createTranslationNode = (text) => {
    const el = document.createElement('div');
    el.setAttribute(TG.CONSTANTS.BILINGUAL_ATTR, 'true');
    el.textContent = text;
    el.style.cssText = [
      'margin-top: 4px',
      'padding: 4px 0 4px 10px',
      'border-left: 3px solid #e53935',
      'color: #666',
      'font-size: 0.9em',
      'line-height: 1.6',
      'font-style: italic'
    ].join('; ');
    return el;
  };

  const insertTranslation = (originalEl, translatedText) => {
    if (!_active) return; // discard if stopped while request was in-flight
    originalEl.insertAdjacentElement('afterend', createTranslationNode(translatedText));
  };

  // ── Queue processing ──

  const processNext = () => {
    if (!_active || _queue.length === 0) return;

    const el = _queue.shift();

    // Skip elements that were removed from DOM since we collected them
    if (!document.contains(el)) {
      processNext();
      return;
    }

    TG.translate.send(
      el.innerText.trim(),
      _settings,
      (translation) => {
        insertTranslation(el, translation);
        processNext();
      },
      (_err) => processNext() // skip on error, continue queue
    );
  };

  // ── Cleanup ──

  const cleanup = () =>
    document.querySelectorAll(`[${TG.CONSTANTS.BILINGUAL_ATTR}]`)
      .forEach((el) => el.remove());

  // ── Public API ──

  const start = (settings) => {
    if (_active) stop();

    _active = true;
    _settings = settings;
    _queue = collectElements();

    if (_queue.length > 0) processNext();
  };

  const stop = () => {
    _active = false;
    _settings = null;
    _queue = [];
    cleanup();
  };

  return Object.freeze({ start, stop });
})();
