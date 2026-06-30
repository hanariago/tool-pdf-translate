// Bilingual (ko/en) i18n. Korean is the default and the no-JS fallback (text
// lives in index.html); English is applied on switch. hreflang/sitemap only
// advertise these two languages, per the tool guide ("직접 번역한 언어만").

const STR = {
  ko: {
    metaTitle: "PDF 번역·편집 - 원문 위치 그대로 번역하는 브라우저 PDF 도구",
    metaDesc: "PDF를 브라우저에서 열어 원문 위치 그대로 번역. 스캔본 OCR, 합치기·분할·회전·삭제 편집까지. 설치·서버 전송 없이 무료.",

    appTitle: "PDF 번역", appSub: "원문 위치 그대로 · 서버 전송 없음",
    settings: "설정", close: "닫기",
    tabTranslate: "📖 번역", tabEdit: "✂️ 편집",

    prevPage: "이전 페이지", nextPage: "다음 페이지",
    viewOriginal: "원문", viewTranslated: "번역",
    translateBtn: "번역하기", downloadPng: "현재 페이지 PNG 저장", newPdf: "새 PDF 열기",

    dropTitle: "PDF를 끌어다 놓거나 선택하세요",
    dropHint: "파일은 브라우저 안에서만 처리됩니다. 서버로 전송되지 않습니다.",
    choosePdf: "PDF 선택",

    editDropTitle: "편집할 PDF를 끌어다 놓거나 선택하세요",
    editDropHint: "여러 개를 올리면 합칠 수 있어요. 모든 작업은 브라우저 안에서 처리됩니다.",
    choosePdfMulti: "PDF 선택 (여러 개 가능)",
    selectAll: "전체 선택", deselectAll: "전체 해제",
    rotateLeft: "선택 페이지 왼쪽 회전", rotateRight: "선택 페이지 오른쪽 회전", deleteSel: "선택 페이지 삭제",
    addFiles: "＋ 파일 추가", extractSel: "선택 추출", mergeSave: "합쳐서 저장", reset: "초기화",
    editHint: "썸네일을 드래그해 순서를 바꾸거나, 카드의 ◀▶ 버튼으로 이동하세요. 체크박스로 여러 장을 골라 회전·삭제·추출할 수 있습니다.",
    countLabel: "{sel} / {total} 선택", preview: "미리보기…",
    moveFwd: "앞으로", moveBack: "뒤로", rotate: "회전", del: "삭제",

    legendLang: "언어", srcLangLabel: "원문 언어", tgtLangLabel: "번역 언어",
    legendOcr: "스캔본 OCR", ocrLangLabel: "OCR 인식 언어", ocrAutoLabel: "스캔본 감지 시 자동 OCR",
    ocrNote: "OCR은 이미지에서 글자를 추정하는 방식이라 100% 정확하지 않습니다. 표·작은 글씨·노이즈가 많은 스캔본은 오인식이 생길 수 있습니다.",
    legendLlm: "LLM 보정 번역 (선택)", providerLabel: "제공자", providerNone: "사용 안 함 (Chrome 내장 번역)",
    apiKeyLabel: "API 키", apiKeyPh: "sk-... / 본인 API 키", modelLabel: "모델", modelPh: "모델명",
    llmCorrectLabel: "OCR 결과 문맥 보정",
    llmNote: "API 키는 이 브라우저(localStorage)에만 저장되며 외부로 전송되지 않습니다. 번역 요청은 사용자가 입력한 키로 해당 제공자에게 직접 호출됩니다.",
    clearKey: "저장된 키 삭제",
    langLabel: "언어 / Language",

    footerLicense: "오픈소스 · MIT 라이선스", footerMadeBy: "Made by", footerHub: "🔧 다른 도구 모음 →",

    // guide / onboarding
    guideOpen: "이용 안내",
    guideTitle: "PDF 번역·편집에 오신 걸 환영해요",
    guideLead: "이 도구로 할 수 있는 일이에요. 모든 처리는 브라우저 안에서만 일어나고, 파일은 서버로 올라가지 않습니다.",
    guideNote: "Chrome 내장 번역은 데스크톱 Chrome/Edge 138+ 전용이에요. 모바일·기타 브라우저는 설정에서 본인 API 키를 넣으면 번역할 수 있어요.",
    guideDontShow: "오늘 다시 보지 않기", guideClose: "닫기",
    guideItems: [
      "📄 <b>원문 위치 그대로 번역</b> — PDF를 열면 원문 자리에 번역이 겹쳐 보여요. 위쪽 ‘원문/번역’ 토글로 비교하세요.",
      "🔍 <b>스캔본도 OCR</b> — 글자 레이어가 없는 스캔 PDF는 자동으로 인식해 번역해요.",
      "✂️ <b>편집 탭</b> — 여러 PDF 합치기, 페이지 추출·회전·삭제·순서 변경 후 새 PDF로 저장.",
      "🖼️ <b>PNG 저장</b> — 현재 페이지를 이미지로 내려받을 수 있어요.",
      "🔒 <b>API 키는 브라우저에만</b> — LLM 보정 번역은 선택이고, 키는 이 브라우저에만 저장돼요.",
    ],

    // dynamic — banners / progress / errors
    bMobile: "📱 모바일 환경입니다. Chrome 내장 번역은 데스크톱 전용이라, 모바일에서 번역하려면 설정에서 본인 API 키(Claude/OpenAI)를 입력하세요. 키 없이도 텍스트 추출·OCR은 동작합니다.",
    bNoSupport: "이 브라우저는 내장 번역(Translator API)을 지원하지 않습니다. 데스크톱 <b>Chrome / Edge 138+</b>에서 무료 번역이 동작하며, 그 외에는 설정에서 API 키를 입력하면 번역할 수 있습니다. 텍스트 추출·OCR은 어디서나 동작합니다.",
    bScan: "스캔본으로 보입니다. 설정에서 ‘자동 OCR’을 켜면 글자를 추정해 번역할 수 있습니다.",
    bOcrDone: "🔍 스캔본으로 감지되어 OCR로 글자를 추정했습니다. OCR은 100% 정확하지 않으니 결과를 검토하세요.",
    bOcrFail: "OCR 처리 실패: {msg}",
    errOnlyPdf: "PDF 파일만 열 수 있습니다.",
    errOpen: "PDF를 여는 중 오류가 발생했습니다: {msg}",
    openingPdf: "PDF 여는 중…",
    ocrDetecting: "스캔본 감지 — OCR 처리 중…", ocrStatus: "OCR ({status})…",
    engineChrome: "Chrome 내장 번역", engineClaude: "Claude API", engineOpenAI: "OpenAI API",
    progModelDownload: "번역 모델 다운로드 중…", progTranslating: "번역 중 ({engine})…",
    errEngineInit: "번역 엔진 초기화 실패: {msg}",
    errCantTranslate: "번역할 수 없습니다 — {reason}",
    noEngine: "사용 가능한 번역 수단이 없습니다.",
    errTranslate: "번역 오류: {msg}",
    keyDeleted: "저장된 API 키를 삭제했습니다.",
    reasonSameLang: "원문 언어와 번역 언어가 같습니다.",
    reasonMobile: "모바일에서는 Chrome 내장 번역을 쓸 수 없습니다. 설정에서 API 키를 입력하면 번역할 수 있습니다.",
    reasonNoTranslator: "이 브라우저는 내장 번역(Translator API)을 지원하지 않습니다. 데스크톱 Chrome/Edge를 쓰거나 설정에서 API 키를 입력하세요.",
    reasonPair: "현재 언어쌍으로 번역할 수 없습니다.",
    // editor
    errFileOpen: "\"{name}\"을(를) 열지 못했습니다: {msg}",
    hintRotate: "회전할 페이지를 먼저 선택하세요.", hintDelete: "삭제할 페이지를 먼저 선택하세요.",
    confirmDelete: "선택한 {n}개 페이지를 삭제할까요?",
    hintExtract: "추출할 페이지를 선택하세요.", hintSave: "저장할 페이지가 없습니다.",
    processing: "처리 중…", errBuild: "PDF 생성 실패: {msg}", noPagesExport: "내보낼 페이지가 없습니다.",

    introHtml: "PDF를 브라우저에서 열어 <b>원문 위치 그대로</b> 번역을 보여주는 무료 도구입니다. pdf.js로 텍스트 좌표를 추출해 원문 위에 번역을 겹쳐 보여주고, 스캔본은 Tesseract.js OCR로 글자를 인식합니다. 데스크톱 Chrome·Edge에서는 내장 번역이 무료로 동작하고, 모바일·기타 브라우저에서는 본인 API 키(Claude·OpenAI)로 번역할 수 있습니다. ‘편집’ 탭에서는 pdf-lib로 여러 PDF 합치기, 페이지 추출·회전·삭제·순서 변경까지 전부 브라우저 안에서 처리합니다. 업로드도, 서버 전송도 없습니다.",
    faqTitle: "자주 묻는 질문",
    faq: [
      { q: "PDF 파일이 서버로 전송되나요?", a: "아니요. PDF·텍스트·이미지는 모두 브라우저 안에서만 처리됩니다. LLM 보정을 켠 경우에만, 사용자가 직접 입력한 API 키로 해당 제공자에게 번역 텍스트가 전송됩니다." },
      { q: "모바일에서도 번역이 되나요?", a: "Chrome 내장 번역 API는 데스크톱 Chrome·Edge 138 이상 전용입니다. 모바일에서는 설정에서 본인 API 키(Claude 또는 OpenAI)를 입력하면 번역할 수 있고, 키가 없어도 텍스트 추출과 OCR은 동작합니다." },
      { q: "스캔한 PDF(이미지)도 번역할 수 있나요?", a: "네. 텍스트 레이어가 없는 스캔본은 자동으로 감지해 Tesseract.js OCR로 글자를 인식한 뒤 번역합니다. 다만 OCR은 100% 정확하지 않으니 결과 확인이 필요합니다." },
      { q: "여러 PDF를 하나로 합치거나 페이지를 나눌 수 있나요?", a: "‘편집’ 탭에서 여러 PDF를 올려 순서를 바꿔 합치거나, 원하는 페이지만 골라 추출(분할)하고, 90도 회전·삭제까지 할 수 있습니다. 결과는 새 PDF로 저장됩니다." },
      { q: "무료인가요?", a: "네, 무료입니다. Chrome 내장 번역과 OCR·편집 기능은 비용이 없고, 선택적인 LLM 보정만 사용자 본인 API 키의 사용량에 따라 과금됩니다." },
      { q: "API 키는 안전하게 저장되나요?", a: "API 키는 이 브라우저의 localStorage에만 저장되며 외부로 전송되지 않습니다. 번역 요청 시에만 사용자 키로 해당 제공자에 직접 호출됩니다. 설정에서 언제든 삭제할 수 있습니다." },
    ],
  },
  en: {
    metaTitle: "PDF Translate & Edit - In-place PDF translation in your browser",
    metaDesc: "Open a PDF in your browser and read translations in place. Scanned-PDF OCR plus merge, split, rotate, and delete editing. Free, no install, nothing uploaded.",

    appTitle: "PDF Translate", appSub: "Translation in place · Nothing leaves your browser",
    settings: "Settings", close: "Close",
    tabTranslate: "📖 Translate", tabEdit: "✂️ Edit",

    prevPage: "Previous page", nextPage: "Next page",
    viewOriginal: "Original", viewTranslated: "Translated",
    translateBtn: "Translate", downloadPng: "Save current page as PNG", newPdf: "Open a new PDF",

    dropTitle: "Drop a PDF here or choose one",
    dropHint: "Files are processed entirely in your browser — never uploaded.",
    choosePdf: "Choose PDF",

    editDropTitle: "Drop PDFs to edit, or choose them",
    editDropHint: "Add several to merge them. Everything runs in your browser.",
    choosePdfMulti: "Choose PDFs (multiple)",
    selectAll: "Select all", deselectAll: "Deselect all",
    rotateLeft: "Rotate selected left", rotateRight: "Rotate selected right", deleteSel: "Delete selected",
    addFiles: "＋ Add files", extractSel: "Extract selected", mergeSave: "Merge & save", reset: "Reset",
    editHint: "Drag thumbnails to reorder, or use the ◀▶ buttons. Check multiple pages to rotate, delete, or extract.",
    countLabel: "{sel} / {total} selected", preview: "preview…",
    moveFwd: "Move forward", moveBack: "Move back", rotate: "Rotate", del: "Delete",

    legendLang: "Language", srcLangLabel: "Source language", tgtLangLabel: "Target language",
    legendOcr: "Scanned-PDF OCR", ocrLangLabel: "OCR language", ocrAutoLabel: "Auto-OCR when a scan is detected",
    ocrNote: "OCR estimates text from images and isn't 100% accurate. Tables, tiny text, and noisy scans may be misread.",
    legendLlm: "LLM-enhanced translation (optional)", providerLabel: "Provider", providerNone: "Off (use Chrome built-in)",
    apiKeyLabel: "API key", apiKeyPh: "sk-... / your API key", modelLabel: "Model", modelPh: "model name",
    llmCorrectLabel: "Context-correct OCR output",
    llmNote: "Your API key is stored only in this browser (localStorage) and is never sent elsewhere. Translation requests go directly to the provider using your key.",
    clearKey: "Delete saved key",
    langLabel: "Language / 언어",

    footerLicense: "Open source · MIT License", footerMadeBy: "Made by", footerHub: "🔧 More tools →",

    guideOpen: "How to use",
    guideTitle: "Welcome to PDF Translate & Edit",
    guideLead: "Here's what you can do. Everything runs in your browser — files are never uploaded to a server.",
    guideNote: "Chrome's built-in translator is desktop-only (Chrome/Edge 138+). On mobile or other browsers, enter your own API key in Settings to translate.",
    guideDontShow: "Don't show again today", guideClose: "Close",
    guideItems: [
      "📄 <b>Translate in place</b> — open a PDF and see translations over the original. Use the Original/Translated toggle to compare.",
      "🔍 <b>OCR for scans</b> — scanned PDFs with no text layer are recognized automatically, then translated.",
      "✂️ <b>Edit tab</b> — merge PDFs, extract/rotate/delete/reorder pages, then save as a new PDF.",
      "🖼️ <b>Save as PNG</b> — download the current page as an image.",
      "🔒 <b>Keys stay in your browser</b> — LLM enhancement is optional; your key is stored only here.",
    ],

    bMobile: "📱 You're on mobile. Chrome's built-in translator is desktop-only, so to translate here enter your own API key (Claude/OpenAI) in Settings. Text extraction and OCR work without a key.",
    bNoSupport: "This browser doesn't support built-in translation (Translator API). Free translation works in desktop <b>Chrome / Edge 138+</b>; elsewhere, enter an API key in Settings. Text extraction and OCR work everywhere.",
    bScan: "This looks like a scanned PDF. Turn on \"Auto-OCR\" in Settings to recognize and translate the text.",
    bOcrDone: "🔍 Detected a scanned PDF and recognized text with OCR. OCR isn't 100% accurate, so please review the result.",
    bOcrFail: "OCR failed: {msg}",
    errOnlyPdf: "Only PDF files can be opened.",
    errOpen: "Something went wrong opening the PDF: {msg}",
    openingPdf: "Opening PDF…",
    ocrDetecting: "Scanned PDF detected — running OCR…", ocrStatus: "OCR ({status})…",
    engineChrome: "Chrome built-in translator", engineClaude: "Claude API", engineOpenAI: "OpenAI API",
    progModelDownload: "Downloading translation model…", progTranslating: "Translating ({engine})…",
    errEngineInit: "Failed to start the translation engine: {msg}",
    errCantTranslate: "Can't translate — {reason}",
    noEngine: "No translation method is available.",
    errTranslate: "Translation error: {msg}",
    keyDeleted: "Saved API key deleted.",
    reasonSameLang: "Source and target languages are the same.",
    reasonMobile: "Chrome's built-in translator isn't available on mobile. Enter an API key in Settings to translate.",
    reasonNoTranslator: "This browser doesn't support built-in translation (Translator API). Use desktop Chrome/Edge or enter an API key in Settings.",
    reasonPair: "This language pair can't be translated.",
    errFileOpen: "Couldn't open \"{name}\": {msg}",
    hintRotate: "Select pages to rotate first.", hintDelete: "Select pages to delete first.",
    confirmDelete: "Delete the {n} selected page(s)?",
    hintExtract: "Select pages to extract.", hintSave: "There are no pages to save.",
    processing: "Working…", errBuild: "Failed to build PDF: {msg}", noPagesExport: "There are no pages to export.",

    introHtml: "A free tool that opens a PDF in your browser and shows translations <b>right where the original text sits</b>. It extracts text coordinates with pdf.js and overlays the translation on top; scanned PDFs are recognized with Tesseract.js OCR. On desktop Chrome/Edge, built-in translation is free; on mobile and other browsers you can translate with your own API key (Claude/OpenAI). The \"Edit\" tab uses pdf-lib to merge multiple PDFs and extract, rotate, delete, or reorder pages — all in the browser. No uploads, nothing sent to a server.",
    faqTitle: "Frequently Asked Questions",
    faq: [
      { q: "Is my PDF sent to a server?", a: "No. PDFs, text, and images are processed entirely in your browser. Only if you turn on LLM enhancement is translation text sent — directly to the provider, using the API key you entered yourself." },
      { q: "Does translation work on mobile?", a: "Chrome's built-in Translator API is desktop-only (Chrome/Edge 138+). On mobile you can translate by entering your own API key (Claude or OpenAI) in Settings; even without a key, text extraction and OCR still work." },
      { q: "Can it translate scanned (image) PDFs?", a: "Yes. A PDF with no text layer is detected automatically and recognized with Tesseract.js OCR before translation. OCR isn't 100% accurate, so review the result." },
      { q: "Can I merge multiple PDFs or split out pages?", a: "In the \"Edit\" tab you can load several PDFs, reorder and merge them, extract just the pages you want (split), and rotate or delete pages. The result downloads as a new PDF." },
      { q: "Is it free?", a: "Yes. Chrome's built-in translation, OCR, and editing are free; only the optional LLM enhancement is billed against your own API key's usage." },
      { q: "Is my API key stored safely?", a: "Your API key is kept only in this browser's localStorage and is never sent anywhere else. It's used only to call the provider directly when you translate, and you can delete it anytime in Settings." },
    ],
  },
};

const LOCALE = { ko: "ko_KR", en: "en_US" };
let currentLang = "ko";
const subscribers = [];

export function getLang() { return currentLang; }
export function onLangChange(fn) { subscribers.push(fn); }

export function t(key, vars) {
  let s = (STR[currentLang] && STR[currentLang][key]);
  if (s == null) s = STR.ko[key];
  if (s == null) return key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}
export function tFaq() { return (STR[currentLang] || STR.ko).faq; }

export function applyLang(lang) {
  if (!STR[lang]) lang = "en";
  currentLang = lang;

  document.documentElement.lang = lang;
  document.title = t("metaTitle");
  setMeta('meta[name="description"]', "content", t("metaDesc"));
  setMeta('meta[property="og:title"]', "content", t("metaTitle"));
  setMeta('meta[property="og:description"]', "content", t("metaDesc"));
  setMeta('meta[name="twitter:title"]', "content", t("metaTitle"));
  setMeta('meta[name="twitter:description"]', "content", t("metaDesc"));
  setMeta('meta[property="og:locale"]', "content", LOCALE[lang]);

  // text content
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const v = t(el.getAttribute("data-i18n"));
    if (v) el.textContent = v;
  });
  // titles / aria / placeholders
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const v = t(el.getAttribute("data-i18n-title"));
    if (v) { el.title = v; el.setAttribute("aria-label", v); }
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const v = t(el.getAttribute("data-i18n-ph"));
    if (v) el.placeholder = v;
  });

  // SEO content blocks
  const intro = document.getElementById("seo-intro");
  if (intro) intro.innerHTML = t("introHtml");
  const faqTitle = document.getElementById("seo-faq-title");
  if (faqTitle) faqTitle.textContent = t("faqTitle");
  const faqList = document.getElementById("seo-faq-list");
  if (faqList) {
    faqList.innerHTML = tFaq()
      .map((it) => `<details><summary>${esc(it.q)}</summary><div class="faq-a">${esc(it.a)}</div></details>`)
      .join("");
  }

  // guide list (HTML allowed — from our own dictionary, not user input)
  const guideList = document.getElementById("guide-list");
  if (guideList) {
    const items = (STR[lang] || STR.ko).guideItems || [];
    guideList.innerHTML = items.map((it) => `<li>${it}</li>`).join("");
  }

  const sel = document.getElementById("lang-select");
  if (sel) sel.value = lang;
  try { localStorage.setItem("pdftLang", lang); } catch (_) {}

  subscribers.forEach((fn) => { try { fn(lang); } catch (_) {} });
}

export function initLang() {
  const param = new URLSearchParams(location.search).get("lang");
  let saved = null;
  try { saved = localStorage.getItem("pdftLang"); } catch (_) {}
  const nav = (navigator.language || "ko").slice(0, 2).toLowerCase();
  const pick = [param, saved, nav, "ko"].find((l) => l && STR[l]) || "ko";
  applyLang(pick);
}

function setMeta(selector, attr, value) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
