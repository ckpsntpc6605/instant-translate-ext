window.TG = window.TG || {};

TG.CONSTANTS = Object.freeze({
  DEFAULT_SETTINGS: Object.freeze({
    sourceLang: 'auto',
    targetLang: 'zh-Hant',
    model: 'translategemma:latest'
  }),
  BILINGUAL_ATTR: 'data-tg-bilingual',
  BILINGUAL_TARGETS: 'p, h1, h2, h3, h4, h5, h6, li, td, blockquote, figcaption',
  MIN_TEXT_LENGTH: 20
});
