window.TG = window.TG || {};

TG.tooltip = (function () {
  'use strict';

  // Mutable state — the only two bindings that change over time
  const state = { text: '', rect: null };

  const updateState = (text, rect) => { state.text = text; state.rect = rect; };
  const clearState = () => updateState('', null);

  // ── DOM rendering (thin side-effect wrappers) ──

  const showDot = (dot, { x, y }) => {
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.classList.add('visible');
  };

  const hideDot = (dot) => dot.classList.remove('visible');

  const showPopup = (popup, { left, top }) => {
    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;
    popup.classList.add('visible');
  };

  const hidePopup = (popup) => popup.classList.remove('visible');

  const renderLoading = (els, text) => {
    els.original.textContent = text;
    els.result.innerHTML = '<span class="tg-spinner"></span>';
    els.footer.textContent = '';
  };

  const renderResult = (els, translation) => {
    els.result.textContent = translation;
  };

  const renderError = (els, message) => {
    els.result.innerHTML = `<span class="tg-error">${message}</span>`;
  };

  const renderFooter = (els, sourceName, targetName) => {
    els.footer.textContent = `${sourceName} → ${targetName}`;
  };

  // ── Public: init wires everything to the provided DOM nodes ──

  const init = (dot, popup, host) => {
    const els = Object.freeze({
      original: popup.querySelector('.tg-popup-original'),
      result: popup.querySelector('.tg-popup-result'),
      footer: popup.querySelector('.tg-popup-footer'),
      close: popup.querySelector('.tg-popup-close')
    });

    const hideAll = () => {
      hideDot(dot);
      hidePopup(popup);
      clearState();
    };

    // ── Event handlers ──

    const handleMouseUp = (e) => {
      if (TG.core.isInsideHost(e, host)) return;
      setTimeout(() => {
        const text = TG.core.getSelectedText();
        if (text.length === 0) return;

        const rect = TG.core.getSelectionRect();
        if (!rect) return;

        updateState(TG.core.truncate(text), rect);
        showDot(dot, TG.core.calcDotPosition(rect));
        hidePopup(popup);
      }, 10);
    };

    const handleMouseDown = (e) => {
      if (!TG.core.isInsideHost(e, host)) hideAll();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') hideAll();
    };

    const handleDotClick = async () => {
      if (!state.text) return;

      const text = state.text;
      hideDot(dot);
      renderLoading(els, text);

      const position = TG.core.calcPopupPosition(
        parseFloat(dot.style.left),
        parseFloat(dot.style.top)
      );
      showPopup(popup, position);

      const settings = await chrome.storage.sync.get(TG.CONSTANTS.DEFAULT_SETTINGS);
      renderFooter(
        els,
        TG.languages.getName(settings.sourceLang),
        TG.languages.getName(settings.targetLang)
      );

      TG.translate.send(
        text,
        settings,
        (translation) => renderResult(els, translation),
        (error) => renderError(els, error)
      );
    };

    // Attach listeners
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    els.close.addEventListener('click', () => hidePopup(popup));
    dot.addEventListener('click', handleDotClick);

    return Object.freeze({ hideAll });
  };

  return Object.freeze({ init });
})();
