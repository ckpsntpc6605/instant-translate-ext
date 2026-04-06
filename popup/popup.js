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
  model: 'translategemma:latest'
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

const populateSelect = (select, languages, formatter) =>
  languages.forEach((lang) =>
    select.appendChild(createOption(lang.code, formatter(lang)))
  );

const renderStatus = ({ connected, modelAvailable }, selectedModel) => {
  const { statusDot, statusText, modelRow, modelDot, modelText } = elements;

  statusDot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
  statusText.textContent = connected ? 'Ollama connected' : 'Ollama not detected';

  modelRow.style.display = connected ? 'flex' : 'none';

  if (connected) {
    modelDot.className = `status-dot ${modelAvailable ? 'connected' : 'disconnected'}`;
    modelText.textContent = modelAvailable
      ? `${selectedModel} available`
      : `${selectedModel} not found — run: ollama pull ${selectedModel}`;
  }
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
  const selectedModel = elements.modelSelect.value;

  chrome.runtime.sendMessage(
    { type: 'check-connection', model: selectedModel },
    (res) => renderStatus(res || { connected: false, modelAvailable: false }, selectedModel)
  );
};

// ── Initialize ──

// Populate dropdowns
populateSelect(
  elements.sourceSelect,
  TRANSLATE_LANGUAGES,
  formatSourceLabel
);

populateSelect(
  elements.targetSelect,
  TRANSLATE_LANGUAGES.filter((l) => l.code !== 'auto'),
  formatTargetLabel
);

// Load saved settings and apply
chrome.storage.sync.get(DEFAULT_SETTINGS, ({ sourceLang, targetLang, model }) => {
  elements.sourceSelect.value = sourceLang;
  elements.targetSelect.value = targetLang;
  elements.modelSelect.value = model;
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
