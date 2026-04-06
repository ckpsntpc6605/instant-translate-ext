window.TG = window.TG || {};

TG.languages = Object.freeze({
  LIST: Object.freeze([
    { code: 'auto', name: 'Auto Detect' },
    { code: 'zh-Hant', name: '繁體中文' },
    { code: 'zh-Hans', name: '简体中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'th', name: 'ไทย' },
    { code: 'id', name: 'Bahasa Indonesia' }
  ]),

  find(code) {
    return TG.languages.LIST.find((lang) => lang.code === code);
  },

  getName(code) {
    return TG.languages.find(code)?.name ?? code;
  }
});
