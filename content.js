(function () {
  'use strict';

  // ── State (the only mutable bindings in this module) ──
  const state = { text: '', rect: null };

  const updateState = (text, rect) => {
    state.text = text;
    state.rect = rect;
  };

  const clearState = () => updateState('', null);

  // ── Pure helpers ──

  const DEFAULT_SETTINGS = Object.freeze({
    sourceLang: 'auto',
    targetLang: 'zh-Hant',
    model: 'translategemma:latest'
  });

  const truncate = (text, max = 2000) =>
    text.length > max ? text.substring(0, max) : text;

  const isInsideHost = (e, host) =>
    e.target === host || (e.composedPath?.().includes(host));

  const getSelectedText = () => {
    const selection = window.getSelection();
    return selection ? selection.toString().trim() : '';
  };

  const getSelectionRect = () => {
    const selection = window.getSelection();
    return selection?.rangeCount > 0
      ? selection.getRangeAt(0).getBoundingClientRect()
      : null;
  };

  const calcDotPosition = (rect) => ({
    x: rect.right + window.scrollX + 4,
    y: rect.bottom + window.scrollY + 4
  });

  const calcPopupPosition = (anchorX, anchorY) => {
    const popupWidth = 360;
    const popupHeight = 340;
    const margin = 8;
    const { innerWidth: viewW, innerHeight: viewH, scrollX, scrollY } = window;

    const rawLeft = anchorX + margin;
    const rawTop = anchorY + margin;

    const flippedLeft = rawLeft + popupWidth > scrollX + viewW
      ? anchorX - popupWidth - margin
      : rawLeft;

    const flippedTop = rawTop + popupHeight > scrollY + viewH
      ? anchorY - popupHeight - margin
      : rawTop;

    return {
      left: Math.max(scrollX + margin, flippedLeft),
      top: Math.max(scrollY + margin, flippedTop)
    };
  };

  const resolveLanguageNames = ({ sourceLang, targetLang }) => ({
    sourceName: getLanguageName(sourceLang),
    targetName: getLanguageName(targetLang)
  });

  const buildTranslateMessage = (text, { sourceLang, targetLang, model }) => {
    const { sourceName, targetName } = resolveLanguageNames({ sourceLang, targetLang });
    return {
      type: 'translate',
      text,
      sourceLang,
      sourceName,
      targetLang,
      targetName,
      model
    };
  };

  // ── Shadow DOM setup ──

  const SHADOW_STYLES = `
    .tg-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      background: #e53935;
      border-radius: 50%;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
      transition: transform 0.15s ease, opacity 0.15s ease;
      opacity: 0;
      transform: scale(0);
    }
    .tg-dot.visible {
      opacity: 1;
      transform: scale(1);
    }
    .tg-dot:hover {
      transform: scale(1.3);
      background: #c62828;
    }

    .tg-popup {
      position: absolute;
      width: 360px;
      max-height: 340px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      pointer-events: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .tg-popup.visible {
      display: flex;
    }

    .tg-popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    .tg-popup-title {
      font-weight: 600;
      font-size: 13px;
      color: #555;
    }
    .tg-popup-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #999;
      padding: 0 2px;
      line-height: 1;
    }
    .tg-popup-close:hover {
      color: #333;
    }

    .tg-popup-body {
      padding: 14px;
      overflow-y: auto;
      flex: 1;
    }
    .tg-popup-original {
      font-size: 12px;
      color: #888;
      margin-bottom: 8px;
      max-height: 60px;
      overflow-y: auto;
      line-height: 1.5;
      word-break: break-word;
    }
    .tg-popup-divider {
      height: 1px;
      background: #e8e8e8;
      margin-bottom: 10px;
    }
    .tg-popup-result {
      line-height: 1.6;
      word-break: break-word;
      min-height: 24px;
    }

    .tg-popup-footer {
      padding: 8px 14px;
      font-size: 11px;
      color: #aaa;
      border-top: 1px solid #f0f0f0;
      text-align: right;
    }

    .tg-spinner {
      display: inline-block;
      width: 18px;
      height: 18px;
      border: 2px solid #e0e0e0;
      border-top-color: #e53935;
      border-radius: 50%;
      animation: tg-spin 0.6s linear infinite;
    }
    @keyframes tg-spin {
      to { transform: rotate(360deg); }
    }

    .tg-error {
      color: #c62828;
      font-size: 13px;
    }
  `;

  const POPUP_HTML = `
    <div class="tg-popup-header">
      <span class="tg-popup-title">TranslateGemma</span>
      <button class="tg-popup-close">&times;</button>
    </div>
    <div class="tg-popup-body">
      <div class="tg-popup-original"></div>
      <div class="tg-popup-divider"></div>
      <div class="tg-popup-result"></div>
    </div>
    <div class="tg-popup-footer"></div>
  `;

  const createShadowDOM = () => {
    const host = document.createElement('tg-translate-host');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = SHADOW_STYLES;
    shadow.appendChild(style);

    const dot = document.createElement('div');
    dot.className = 'tg-dot';
    shadow.appendChild(dot);

    const popup = document.createElement('div');
    popup.className = 'tg-popup';
    popup.innerHTML = POPUP_HTML;
    shadow.appendChild(popup);

    return { host, dot, popup };
  };

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

  const renderLoading = (els) => {
    els.original.textContent = state.text;
    els.result.innerHTML = '<span class="tg-spinner"></span>';
    els.footer.textContent = '';
  };

  const renderTranslation = (els, translation) => {
    els.result.textContent = translation;
  };

  const renderError = (els, message) => {
    els.result.innerHTML = `<span class="tg-error">${message}</span>`;
  };

  const renderFooter = (els, sourceName, targetName) => {
    els.footer.textContent = `${sourceName} → ${targetName}`;
  };

  // ── Initialize ──

  const { host, dot, popup } = createShadowDOM();

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
    if (isInsideHost(e, host)) return;

    setTimeout(() => {
      const text = getSelectedText();
      if (text.length === 0) return;

      const rect = getSelectionRect();
      if (!rect) return;

      updateState(truncate(text), rect);
      showDot(dot, calcDotPosition(rect));
      hidePopup(popup);
    }, 10);
  };

  const handleMouseDown = (e) => {
    if (!isInsideHost(e, host)) hideAll();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') hideAll();
  };

  const handleDotClick = async () => {
    if (!state.text) return;

    const text = state.text;
    hideDot(dot);
    renderLoading(els);

    const position = calcPopupPosition(
      parseFloat(dot.style.left),
      parseFloat(dot.style.top)
    );
    showPopup(popup, position);

    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    const { sourceName, targetName } = resolveLanguageNames(settings);
    renderFooter(els, sourceName, targetName);

    const message = buildTranslateMessage(text, settings);

    chrome.runtime.sendMessage(message, (response) => {
      if (!response) {
        renderError(els, 'Failed to connect. Is Ollama running?');
        return;
      }
      response.success
        ? renderTranslation(els, response.translation)
        : renderError(els, response.error);
    });
  };

  // ── Attach event listeners (side effects at the edge) ──

  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('keydown', handleKeyDown);
  els.close.addEventListener('click', () => hidePopup(popup));
  dot.addEventListener('click', handleDotClick);
})();
