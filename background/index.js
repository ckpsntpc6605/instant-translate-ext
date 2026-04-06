const OLLAMA_BASE = 'http://localhost:11434';
const DEFAULT_MODEL = 'translategemma:latest';
const TRANSLATEGEMMA_PREFIX = 'translategemma';

// Pure: build translation prompt from parameters
const buildPrompt = ({ text, sourceLang, sourceName, targetLang, targetName }) =>
  sourceLang === 'auto'
    ? `Translate the following text to ${targetName} (${targetLang}). Automatically detect the source language. Produce only the translation, without any additional explanations or commentary.\n\n${text}`
    : `Translate the following text from ${sourceName} (${sourceLang}) to ${targetName} (${targetLang}). Produce only the translation, without any additional explanations or commentary.\n\n${text}`;

// Pure: build request body
const buildChatBody = (model, prompt) => JSON.stringify({
  model,
  messages: [{ role: 'user', content: prompt }],
  stream: false
});

// Side-effect: call Ollama chat API
const handleTranslate = async ({ text, sourceLang, sourceName, targetLang, targetName, model }) => {
  const prompt = buildPrompt({ text, sourceLang, sourceName, targetLang, targetName });

  try {
    const response = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildChatBody(model || DEFAULT_MODEL, prompt)
    });

    if (!response.ok) throw new Error(`Ollama returned status ${response.status}`);

    const data = await response.json();
    return { success: true, translation: data.message.content.trim() };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// Pure: extract translategemma models from list
const filterTranslateGemmaModels = (models) =>
  models
    .filter((m) => m.name.startsWith(TRANSLATEGEMMA_PREFIX))
    .map((m) => m.name);

// Side-effect: check Ollama connection and return all available translategemma models
const handleCheckConnection = async (selectedModel) => {
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/tags`);
    if (!res.ok) throw new Error('Not OK');

    const { models } = await res.json();
    const availableModels = filterTranslateGemmaModels(models);

    return {
      connected: true,
      modelAvailable: availableModels.length > 0,
      availableModels
    };
  } catch {
    return { connected: false, modelAvailable: false, availableModels: [] };
  }
};

// Message router
const messageHandlers = Object.freeze({
  translate: (message) => handleTranslate(message),
  'check-connection': (message) => handleCheckConnection(message.model)
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message).then(sendResponse);
    return true;
  }
});
