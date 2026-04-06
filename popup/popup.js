// ── DOM references ──

const elements = Object.freeze({
  sourceSelect: document.getElementById('source-lang'),
  targetSelect: document.getElementById('target-lang'),
  modelSelect: document.getElementById('model-select'),
  statusDot: document.getElementById('status-dot'),
  statusText: document.getElementById('status-text'),
  modelRow: document.getElementById('model-row'),
  modelDot: document.getElementById('model-dot'),
  modelText: document.getElementById('model-text'),
  btnCheck: document.getElementById('btn-check')
});

const DEFAULT_SETTINGS = Object.freeze({
  sourceLang: 'auto',
  targetLang: 'zh-Hant',
  model: ''
});

// ── Pure helpers ──

const formatSourceLabel = ({ code, name }) =>
  code !== 'auto' ? `${name} (${code})` : name;

const formatTargetLabel = ({ code, name }) =>
  `${name} (${code})`;

const createOption = (value, text) => {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = text;
  return opt;
};

// ── DOM rendering ──

const populateSelect = (select, items, formatter) =>
  items.forEach((item) => select.appendChild(formatter(item)));

const populateModelSelect = (select, availableModels, savedModel) => {
  select.innerHTML = '';

  if (availableModels.length === 0) {
    select.appendChild(createOption('', 'No model found'));
    return;
  }

  availableModels.forEach((name) => select.appendChild(createOption(name, name)));

  // Restore saved model if still available, otherwise use first found
  select.value = availableModels.includes(savedModel)
    ? savedModel
    : availableModels[0];

  saveSetting('model', select.value);
};

const renderStatus = ({ connected, modelAvailable, availableModels = [] }, savedModel) => {
  const { statusDot, statusText, modelRow, modelDot, modelText } = elements;

  statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  statusText.textContent = connected ? 'Ollama connected' : 'Ollama not detected';
  modelRow.style.display = connected ? 'flex' : 'none';

  if (!connected) return;

  populateModelSelect(elements.modelSelect, availableModels, savedModel);

  modelDot.className = `status-dot ${modelAvailable ? 'connected' : 'disconnected'}`;
  modelText.textContent = modelAvailable
    ? `${elements.modelSelect.value} ready`
    : 'No translategemma model found — run: ollama pull translategemma';
};

const renderLoading = () => {
  const { statusDot, statusText, modelRow } = elements;
  statusDot.className = 'status-dot disconnected';
  statusText.textContent = 'Checking...';
  modelRow.style.display = 'none';
};

// ── Side effects ──

const saveSetting = (key, value) =>
  chrome.storage.sync.set({ [key]: value });

const checkConnection = () => {
  renderLoading();
  chrome.storage.sync.get(DEFAULT_SETTINGS, ({ model }) => {
    chrome.runtime.sendMessage(
      { type: 'check-connection', model },
      (res) => renderStatus(res || { connected: false, modelAvailable: false }, model)
    );
  });
};

// ── Initialize ──

populateSelect(
  elements.sourceSelect,
  TRANSLATE_LANGUAGES,
  ({ code, name }) => createOption(code, formatSourceLabel({ code, name }))
);

populateSelect(
  elements.targetSelect,
  TRANSLATE_LANGUAGES.filter((l) => l.code !== 'auto'),
  ({ code, name }) => createOption(code, formatTargetLabel({ code, name }))
);

// Load saved language settings
chrome.storage.sync.get(DEFAULT_SETTINGS, ({ sourceLang, targetLang }) => {
  elements.sourceSelect.value = sourceLang;
  elements.targetSelect.value = targetLang;
});

// Attach event listeners
elements.sourceSelect.addEventListener('change', () =>
  saveSetting('sourceLang', elements.sourceSelect.value)
);

elements.targetSelect.addEventListener('change', () =>
  saveSetting('targetLang', elements.targetSelect.value)
);

elements.modelSelect.addEventListener('change', () =>
  saveSetting('model', elements.modelSelect.value)
);

elements.btnCheck.addEventListener('click', checkConnection);

// Auto-check on open
checkConnection();
