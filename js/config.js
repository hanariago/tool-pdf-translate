// Shared constants & options.

export const PDFJS_VERSION = "4.10.38";
export const PDFJS_CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
export const PDFJS_WORKER = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

export const STORAGE_KEY = "pdf-translate.settings.v1";

// BCP-47 codes for Chrome Translator / LLM target.
export const TARGET_LANGS = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "中文(简体)" },
  { code: "zh-Hant", label: "中文(繁體)" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "vi", label: "Tiếng Việt" },
];

export const SOURCE_LANGS = [
  { code: "auto", label: "자동 감지" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "中文(简体)" },
  { code: "zh-Hant", label: "中文(繁體)" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];

// Tesseract language codes.
export const OCR_LANGS = [
  { code: "eng", label: "English" },
  { code: "kor", label: "한국어" },
  { code: "jpn", label: "日本語" },
  { code: "chi_sim", label: "中文(简体)" },
  { code: "chi_tra", label: "中文(繁體)" },
  { code: "eng+kor", label: "English + 한국어" },
  { code: "fra", label: "Français" },
  { code: "deu", label: "Deutsch" },
  { code: "spa", label: "Español" },
];

export const DEFAULT_SETTINGS = {
  srcLang: "auto",
  tgtLang: "ko",
  ocrLang: "eng",
  ocrAuto: true,
  llmProvider: "none", // none | claude | openai
  llmKey: "",
  llmModel: "",
  llmCorrect: true,
};

export const DEFAULT_MODELS = {
  claude: "claude-haiku-4-5",
  openai: "gpt-4o-mini",
};

// If a page's extracted text is shorter than this, treat it as a scanned page.
export const SCANNED_TEXT_THRESHOLD = 12;
