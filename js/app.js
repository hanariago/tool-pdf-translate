// App controller: file loading, page rendering, translation flow, UI wiring.

import {
  STORAGE_KEY, DEFAULT_SETTINGS, DEFAULT_MODELS,
  TARGET_LANGS, SOURCE_LANGS, OCR_LANGS,
} from "./config.js";
import { loadDocument, renderPage, extractTextBlocks } from "./pdf-handler.js";
import { ocrCanvas } from "./ocr.js";
import { renderOverlay, clearOverlay } from "./overlay.js";
import { buildEngine, detectEnvironment } from "./translator.js";
import { initEditor } from "./editor.js";

// ---------- State ----------
const state = {
  pdfDoc: null,
  numPages: 0,
  current: 1,
  viewMode: "original", // original | translated
  baseName: "page",
  pages: new Map(), // n -> { blocks(normalized), isScanned, translatedDone }
  render: null, // last render info { cssWidth, cssHeight, dpr }
  busy: false,
};

let settings = loadSettings();
const env = detectEnvironment();

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const els = {
  bannerArea: $("banner-area"),
  toolbar: $("toolbar"),
  dropzone: $("dropzone"),
  viewer: $("viewer"),
  pageWrap: $("page-wrap"),
  canvas: $("page-canvas"),
  overlay: $("overlay"),
  fileInput: $("file-input"),
  pageInd: $("page-indicator"),
  btnPrev: $("btn-prev"),
  btnNext: $("btn-next"),
  btnTranslate: $("btn-translate"),
  btnDownload: $("btn-download"),
  btnNew: $("btn-new"),
  viewOriginal: $("view-original"),
  viewTranslated: $("view-translated"),
  progress: $("progress"),
  progressFill: $("progress-fill"),
  progressLabel: $("progress-label"),
  // settings
  btnSettings: $("btn-settings"),
  settings: $("settings"),
  backdrop: $("settings-backdrop"),
  btnSettingsClose: $("btn-settings-close"),
  srcLang: $("src-lang"),
  tgtLang: $("tgt-lang"),
  ocrLang: $("ocr-lang"),
  ocrAuto: $("ocr-auto"),
  llmProvider: $("llm-provider"),
  llmKey: $("llm-key"),
  llmModel: $("llm-model"),
  llmCorrect: $("llm-correct"),
  btnClearKey: $("btn-clear-key"),
};

// ---------- Settings ----------
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (_) {}
  return { ...DEFAULT_SETTINGS };
}
function saveSettings() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_) {}
}

function fillSelect(sel, options, value) {
  sel.innerHTML = "";
  for (const o of options) {
    const opt = document.createElement("option");
    opt.value = o.code; opt.textContent = o.label;
    sel.appendChild(opt);
  }
  sel.value = value;
}

function syncSettingsUI() {
  fillSelect(els.srcLang, SOURCE_LANGS, settings.srcLang);
  fillSelect(els.tgtLang, TARGET_LANGS, settings.tgtLang);
  fillSelect(els.ocrLang, OCR_LANGS, settings.ocrLang);
  els.ocrAuto.checked = settings.ocrAuto;
  els.llmProvider.value = settings.llmProvider;
  els.llmKey.value = settings.llmKey;
  els.llmModel.value = settings.llmModel;
  els.llmCorrect.checked = settings.llmCorrect;
  updateLlmVisibility();
}

function updateLlmVisibility() {
  const show = settings.llmProvider !== "none";
  document.querySelectorAll("[data-llm-only]").forEach((el) => { el.hidden = !show; });
  if (show && !els.llmModel.value) {
    els.llmModel.placeholder = DEFAULT_MODELS[settings.llmProvider] || "모델명";
  }
}

// ---------- Banners ----------
function banner(kind, html, id) {
  if (id && document.getElementById(id)) return;
  const div = document.createElement("div");
  div.className = `banner banner--${kind}`;
  if (id) div.id = id;
  div.innerHTML = `<span>${html}</span><button class="banner__close" aria-label="닫기">✕</button>`;
  div.querySelector(".banner__close").onclick = () => div.remove();
  els.bannerArea.appendChild(div);
}

function showEnvBanners() {
  if (env.isMobile) {
    banner("info",
      "📱 모바일 환경입니다. Chrome 내장 번역은 데스크톱 전용이라, 모바일에서 번역하려면 설정에서 본인 API 키(Claude/OpenAI)를 입력하세요. 키 없이도 텍스트 추출·OCR은 동작합니다.",
      "b-mobile");
  } else if (!env.hasTranslator) {
    banner("warn",
      "이 브라우저는 내장 번역(Translator API)을 지원하지 않습니다. 데스크톱 <b>Chrome / Edge 138+</b>에서 무료 번역이 동작하며, 그 외에는 설정에서 API 키를 입력하면 번역할 수 있습니다. 텍스트 추출·OCR은 어디서나 동작합니다.",
      "b-nosupport");
  }
}

// ---------- Progress ----------
function setProgress(label, ratio) {
  els.progress.hidden = false;
  els.progressLabel.textContent = label;
  els.progressFill.style.width = Math.round((ratio || 0) * 100) + "%";
}
function hideProgress() { els.progress.hidden = true; }

// ---------- File loading ----------
async function handleFile(file) {
  if (!file) return;
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    banner("warn", "PDF 파일만 열 수 있습니다.");
    return;
  }
  state.baseName = file.name.replace(/\.pdf$/i, "") || "page";
  try {
    setProgress("PDF 여는 중…", 0.1);
    const buf = await file.arrayBuffer();
    state.pdfDoc = await loadDocument(buf);
    state.numPages = state.pdfDoc.numPages;
    state.pages.clear();
    state.current = 1;
    state.viewMode = "original";
    setViewButtons();
    els.dropzone.hidden = true;
    els.viewer.hidden = false;
    els.toolbar.hidden = false;
    hideProgress();
    await goToPage(1);
  } catch (e) {
    console.error(e);
    hideProgress();
    banner("warn", "PDF를 여는 중 오류가 발생했습니다: " + (e.message || e));
  }
}

function computeWidth() {
  const avail = (els.viewer.clientWidth || window.innerWidth) - 4;
  return Math.max(280, Math.min(avail, 1000));
}

// Render the current page's canvas, then ensure its blocks (text or OCR) exist.
async function goToPage(n) {
  if (!state.pdfDoc || state.busy) return;
  n = Math.max(1, Math.min(state.numPages, n));
  state.current = n;
  updateNav();

  const page = await state.pdfDoc.getPage(n);
  const cssWidth = computeWidth();
  const info = await renderPage(page, els.canvas, cssWidth);
  state.render = info;
  els.pageWrap.style.width = info.cssWidth + "px";

  let pdata = state.pages.get(n);
  if (!pdata) {
    pdata = await buildPageData(page, info);
    state.pages.set(n, pdata);
  }

  // Auto-translate if we're viewing translations and this page isn't done.
  if (state.viewMode === "translated" && !pdata.translatedDone) {
    await translatePage(n);
    pdata = state.pages.get(n);
  }
  paintOverlay();
}

// Extract text blocks (or OCR for scanned pages); store normalized coords.
async function buildPageData(page, info) {
  const { blocks, isScanned } = await extractTextBlocks(page, info.viewport);
  let raw = blocks;

  if (isScanned && settings.ocrAuto) {
    try {
      setProgress("스캔본 감지 — OCR 처리 중…", 0.05);
      raw = await ocrCanvas(els.canvas, settings.ocrLang, info.dpr, (status, p) => {
        setProgress(`OCR (${status})…`, p);
      });
      hideProgress();
      banner("warn",
        "🔍 스캔본으로 감지되어 OCR로 글자를 추정했습니다. OCR은 100% 정확하지 않으니 결과를 검토하세요.",
        "b-ocr");
    } catch (e) {
      hideProgress();
      banner("warn", "OCR 처리 실패: " + (e.message || e));
      raw = [];
    }
  } else if (isScanned) {
    banner("info", "스캔본으로 보입니다. 설정에서 ‘자동 OCR’을 켜면 글자를 추정해 번역할 수 있습니다.", "b-scan");
  }

  const W = info.cssWidth, H = info.cssHeight;
  const norm = raw.map((b) => ({
    nx: b.x / W, ny: b.y / H, nw: b.w / W, nh: b.h / H,
    nFont: (b.fontSize || b.h * 0.8) / H,
    text: b.text, translated: "",
  }));
  return { blocks: norm, isScanned, translatedDone: false };
}

// Convert normalized blocks to current-scale px for overlay/export.
function pxBlocks(pdata) {
  const W = state.render.cssWidth, H = state.render.cssHeight;
  return pdata.blocks.map((b) => ({
    x: b.nx * W, y: b.ny * H, w: b.nw * W, h: b.nh * H,
    fontSize: b.nFont * H, text: b.text, translated: b.translated,
  }));
}

function paintOverlay() {
  const pdata = state.pages.get(state.current);
  if (!pdata) return;
  if (state.viewMode === "original") {
    els.overlay.classList.add("is-hidden");
    clearOverlay(els.overlay);
  } else {
    els.overlay.classList.remove("is-hidden");
    renderOverlay(els.overlay, pxBlocks(pdata));
  }
}

// ---------- Translation ----------
async function translatePage(n) {
  const pdata = state.pages.get(n);
  if (!pdata) return;
  const pending = pdata.blocks.filter((b) => !b.translated && b.text.trim());
  if (!pending.length) { pdata.translatedDone = true; return; }

  const sample = pending.slice(0, 5).map((b) => b.text).join(" ");
  let engine;
  try {
    engine = await buildEngine(settings, env, sample);
  } catch (e) {
    banner("warn", "번역 엔진 초기화 실패: " + (e.message || e));
    return;
  }

  if (!engine.ready) {
    banner("warn", "번역할 수 없습니다 — " + (engine.reason || "사용 가능한 번역 수단이 없습니다."));
    return;
  }

  state.busy = true;
  els.btnTranslate.disabled = true;
  try {
    const texts = pending.map((b) => b.text);
    const engineName = engine.kind === "chrome" ? "Chrome 내장 번역"
      : engine.kind === "llm" ? `${engine.provider === "openai" ? "OpenAI" : "Claude"} API` : "";
    setProgress(`번역 중 (${engineName})…`, 0.02);
    const out = await engine.translate(texts, (type, ratio) => {
      if (type === "model") setProgress("번역 모델 다운로드 중…", ratio);
      else setProgress(`번역 중 (${engineName})…`, ratio);
    });
    pending.forEach((b, i) => { b.translated = out[i] || b.text; });
    pdata.translatedDone = true;
    hideProgress();
  } catch (e) {
    console.error(e);
    hideProgress();
    banner("warn", "번역 오류: " + (e.message || e));
  } finally {
    state.busy = false;
    els.btnTranslate.disabled = false;
  }
}

async function onTranslateClick() {
  if (!state.pdfDoc) return;
  state.viewMode = "translated";
  setViewButtons();
  await translatePage(state.current);
  paintOverlay();
}

// ---------- View toggle ----------
function setViewButtons() {
  els.viewOriginal.classList.toggle("is-active", state.viewMode === "original");
  els.viewTranslated.classList.toggle("is-active", state.viewMode === "translated");
}
async function setView(mode) {
  if (state.viewMode === mode) return;
  state.viewMode = mode;
  setViewButtons();
  const pdata = state.pages.get(state.current);
  if (mode === "translated" && pdata && !pdata.translatedDone) {
    await translatePage(state.current);
  }
  paintOverlay();
}

// ---------- Navigation ----------
function updateNav() {
  els.pageInd.textContent = `${state.current} / ${state.numPages}`;
  els.btnPrev.disabled = state.current <= 1;
  els.btnNext.disabled = state.current >= state.numPages;
}

// ---------- PNG export ----------
async function downloadPng() {
  if (!state.render) return;
  const src = els.canvas;
  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  const ctx = out.getContext("2d");
  ctx.drawImage(src, 0, 0);

  if (state.viewMode === "translated") {
    const pdata = state.pages.get(state.current);
    const dpr = state.render.dpr;
    ctx.textBaseline = "middle";
    for (const b of pxBlocks(pdata)) {
      if (!b.translated) continue;
      const x = b.x * dpr, y = b.y * dpr, w = b.w * dpr, h = b.h * dpr;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "#25302B";
      let fs = fitExportFont(ctx, b.translated, w - 2, h, b.fontSize * dpr);
      ctx.font = `${fs}px "Noto Sans KR", sans-serif`;
      ctx.fillText(b.translated, x + 1, y + h / 2, w - 2);
    }
  }
  out.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.baseName}_p${state.current}_${state.viewMode === "translated" ? "번역" : "원문"}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

function fitExportFont(ctx, text, maxW, maxH, start) {
  let fs = Math.min(start, maxH * 0.9);
  ctx.font = `${fs}px "Noto Sans KR", sans-serif`;
  let guard = 30;
  while (ctx.measureText(text).width > maxW && fs > 7 && guard-- > 0) {
    fs -= 1;
    ctx.font = `${fs}px "Noto Sans KR", sans-serif`;
  }
  return fs;
}

// ---------- Settings drawer ----------
function openSettings() { els.settings.hidden = false; els.backdrop.hidden = false; }
function closeSettings() { els.settings.hidden = true; els.backdrop.hidden = true; }

// ---------- Event wiring ----------
function wire() {
  // file input
  els.fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  // drag & drop (translate mode only — edit mode has its own dropzone)
  const inTranslateMode = () => !document.getElementById("translate-view").hidden;
  ["dragenter", "dragover"].forEach((ev) =>
    window.addEventListener(ev, (e) => {
      e.preventDefault();
      if (inTranslateMode() && els.viewer.hidden) els.dropzone.classList.add("is-drag");
    }));
  ["dragleave", "drop"].forEach((ev) =>
    window.addEventListener(ev, (e) => {
      if (!inTranslateMode()) return;
      e.preventDefault();
      if (ev === "drop" && e.dataTransfer?.files?.length) {
        els.dropzone.hidden = false; // ensure visible for state reset path
        handleFile(e.dataTransfer.files[0]);
      }
      els.dropzone.classList.remove("is-drag");
    }));

  // nav
  els.btnPrev.addEventListener("click", () => goToPage(state.current - 1));
  els.btnNext.addEventListener("click", () => goToPage(state.current + 1));
  document.addEventListener("keydown", (e) => {
    if (els.viewer.hidden) return;
    if (e.key === "ArrowLeft") goToPage(state.current - 1);
    if (e.key === "ArrowRight") goToPage(state.current + 1);
  });

  // view + translate
  els.viewOriginal.addEventListener("click", () => setView("original"));
  els.viewTranslated.addEventListener("click", () => setView("translated"));
  els.btnTranslate.addEventListener("click", onTranslateClick);
  els.btnDownload.addEventListener("click", downloadPng);
  els.btnNew.addEventListener("click", () => {
    els.viewer.hidden = true; els.toolbar.hidden = true; els.dropzone.hidden = false;
    state.pdfDoc = null; state.pages.clear();
  });

  // mode tabs
  const tabT = document.getElementById("tab-translate");
  const tabE = document.getElementById("tab-edit");
  const viewT = document.getElementById("translate-view");
  const viewE = document.getElementById("edit-view");
  function switchMode(mode) {
    const isT = mode === "translate";
    tabT.classList.toggle("is-active", isT);
    tabE.classList.toggle("is-active", !isT);
    tabT.setAttribute("aria-selected", isT);
    tabE.setAttribute("aria-selected", !isT);
    viewT.hidden = !isT;
    viewE.hidden = isT;
  }
  tabT.addEventListener("click", () => switchMode("translate"));
  tabE.addEventListener("click", () => switchMode("edit"));

  // settings open/close
  els.btnSettings.addEventListener("click", openSettings);
  els.btnSettingsClose.addEventListener("click", closeSettings);
  els.backdrop.addEventListener("click", closeSettings);

  // settings change
  els.srcLang.addEventListener("change", (e) => { settings.srcLang = e.target.value; saveSettings(); invalidateTranslations(); });
  els.tgtLang.addEventListener("change", (e) => { settings.tgtLang = e.target.value; saveSettings(); invalidateTranslations(); });
  els.ocrLang.addEventListener("change", (e) => { settings.ocrLang = e.target.value; saveSettings(); });
  els.ocrAuto.addEventListener("change", (e) => { settings.ocrAuto = e.target.checked; saveSettings(); });
  els.llmProvider.addEventListener("change", (e) => {
    settings.llmProvider = e.target.value;
    if (!settings.llmModel) els.llmModel.placeholder = DEFAULT_MODELS[settings.llmProvider] || "모델명";
    saveSettings(); updateLlmVisibility();
  });
  els.llmKey.addEventListener("input", (e) => { settings.llmKey = e.target.value; saveSettings(); });
  els.llmModel.addEventListener("input", (e) => { settings.llmModel = e.target.value; saveSettings(); });
  els.llmCorrect.addEventListener("change", (e) => { settings.llmCorrect = e.target.checked; saveSettings(); });
  els.btnClearKey.addEventListener("click", () => {
    settings.llmKey = ""; els.llmKey.value = ""; saveSettings();
    banner("info", "저장된 API 키를 삭제했습니다.");
  });

  // responsive re-render (debounced)
  let rt = null;
  window.addEventListener("resize", () => {
    if (!state.pdfDoc || state.busy) return;
    clearTimeout(rt);
    rt = setTimeout(() => { goToPage(state.current); }, 200);
  });
}

// Changing source/target language invalidates existing translations.
function invalidateTranslations() {
  for (const pdata of state.pages.values()) {
    pdata.translatedDone = false;
    pdata.blocks.forEach((b) => { b.translated = ""; });
  }
  if (state.viewMode === "translated") paintOverlay();
}

// ---------- Init ----------
syncSettingsUI();
showEnvBanners();
wire();
initEditor();
