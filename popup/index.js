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
  btnCheck: document.getElementById('btn-check'),
  bilingualToggle: document.getElementById('bilingual-toggle'),
  bilingualHint: document.getElementById('bilingual-hint')
});

// ── Pure helpers ──

const createOption = (value, text) => {
  const opt = document.createElement('option');
  opt.value = value;
  opt.textContent = text;
  return opt;
};

const formatSourceLabel = ({ code, name }) =>
  code !== 'auto' ? `${name} (${code})` : name;

const formatTargetLabel = ({ code, name }) =>
  `${name} (${code})`;

// ── DOM rendering ──

const populateSelect = (select, items, formatter) =>
  items.forEach((item) => select.appendChild(createOption(item.code, formatter(item))));

const populateModelSelect = (select, availableModels, savedModel) => {
  select.innerHTML = '';

  if (availableModels.length === 0) {
    select.appendChild(createOption('', 'No model found'));
    return;
  }

  availableModels.forEach((name) => select.appendChild(createOption(name, name)));

  select.value = availableModels.includes(savedModel) ? savedModel : availableModels[0];
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
  elements.statusDot.className = 'status-dot disconnected';
  elements.statusText.textContent = 'Checking...';
  elements.modelRow.style.display = 'none';
};

// ── Side effects ──

const saveSetting = (key, value) =>
  chrome.storage.sync.set({ [key]: value });

const checkConnection = () => {
  renderLoading();
  chrome.storage.sync.get(TG.CONSTANTS.DEFAULT_SETTINGS, ({ model }) => {
    chrome.runtime.sendMessage(
      { type: 'check-connection', model },
      (res) => renderStatus(res || { connected: false, modelAvailable: false }, model)
    );
  });
};

const sendBilingualToggle = (enabled) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: 'bilingual-toggle', enabled },
      () => void chrome.runtime.lastError // suppress error on restricted pages
    );
  });
};

// ── Initialize ──

populateSelect(elements.sourceSelect, TG.languages.LIST, formatSourceLabel);
populateSelect(
  elements.targetSelect,
  TG.languages.LIST.filter((l) => l.code !== 'auto'),
  formatTargetLabel
);

chrome.storage.sync.get(TG.CONSTANTS.DEFAULT_SETTINGS, ({ sourceLang, targetLang }) => {
  elements.sourceSelect.value = sourceLang;
  elements.targetSelect.value = targetLang;
});

// Settings change listeners
elements.sourceSelect.addEventListener('change', () =>
  saveSetting('sourceLang', elements.sourceSelect.value)
);
elements.targetSelect.addEventListener('change', () =>
  saveSetting('targetLang', elements.targetSelect.value)
);
elements.modelSelect.addEventListener('change', () =>
  saveSetting('model', elements.modelSelect.value)
);

// Connection check
elements.btnCheck.addEventListener('click', checkConnection);
checkConnection();

// ── Bilingual toggle ──

elements.bilingualToggle.addEventListener('change', () => {
  const enabled = elements.bilingualToggle.checked;
  elements.bilingualHint.textContent = enabled
    ? 'Translating paragraphs... toggle off to stop.'
    : '';
  sendBilingualToggle(enabled);
});
