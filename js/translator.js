// Translation engine routing:
//   1) Chrome built-in Translator API (desktop Chrome/Edge 138+)
//   2) User-key LLM (Claude / OpenAI) — also the mobile / unsupported-browser path
//   3) none -> disabled

import { llmTranslate } from "./llm.js";
import { TARGET_LANGS } from "./config.js";

export function detectEnvironment() {
  const hasTranslator = typeof self !== "undefined" && "Translator" in self;
  const hasDetector = typeof self !== "undefined" && "LanguageDetector" in self;
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (navigator.maxTouchPoints > 1 && /Mac/i.test(ua) === false && window.innerWidth < 900);
  return { hasTranslator, hasDetector, isMobile };
}

export function langLabel(code) {
  return TARGET_LANGS.find((l) => l.code === code)?.label || code;
}

// Resolve a promise but give up after `ms`, returning `fallback`. Guards against
// browsers that expose the built-in AI surface but stall on its backing service.
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ---- Chrome Translator ----

async function chromeAvailability(src, tgt) {
  if (!("Translator" in self)) return "unavailable";
  // Some Chrome builds expose the API but never resolve availability() — cap it.
  return await withTimeout(
    Translator.availability({ sourceLanguage: src, targetLanguage: tgt }),
    8000,
    "unavailable"
  );
}

async function detectLanguage(text) {
  if (!("LanguageDetector" in self)) return null;
  const run = (async () => {
    const det = await LanguageDetector.create();
    const results = await det.detect(text);
    const top = results?.[0];
    return top && top.detectedLanguage !== "und" ? top.detectedLanguage : null;
  })();
  return await withTimeout(run, 8000, null);
}

// Build an engine object: { kind, translate(texts, onProgress), ready }.
// `settings`: { srcLang, tgtLang, llmProvider, llmKey, llmModel, llmCorrect }
export async function buildEngine(settings, env, sampleText) {
  const tgt = settings.tgtLang;
  const tgtLabel = langLabel(tgt);

  // Resolve source language for Chrome (needs an explicit source).
  let src = settings.srcLang;
  if (src === "auto") {
    src = (sampleText && (await detectLanguage(sampleText))) || "en";
  }

  // LLM path (explicitly chosen, or forced because Chrome is unavailable here).
  const llmConfigured = settings.llmProvider !== "none" && settings.llmKey.trim();
  const chromeUsable =
    env.hasTranslator && !env.isMobile &&
    (await chromeAvailability(src, tgt)) !== "unavailable" &&
    src !== tgt;

  // Prefer LLM when the user turned it on; otherwise use Chrome when usable.
  if (llmConfigured && (settings.llmProvider !== "none")) {
    return makeLlmEngine(settings, tgtLabel);
  }
  if (chromeUsable) {
    return await makeChromeEngine(src, tgt);
  }
  if (llmConfigured) {
    return makeLlmEngine(settings, tgtLabel);
  }
  return { kind: "none", ready: false, reason: reasonFor(env, src, tgt) };
}

// Returns an i18n key; the caller localizes it.
function reasonFor(env, src, tgt) {
  if (src === tgt) return "reasonSameLang";
  if (env.isMobile) return "reasonMobile";
  if (!env.hasTranslator) return "reasonNoTranslator";
  return "reasonPair";
}

async function makeChromeEngine(src, tgt) {
  let translator = null;
  async function ensure(onProgress) {
    if (translator) return translator;
    translator = await Translator.create({
      sourceLanguage: src,
      targetLanguage: tgt,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          onProgress?.("model", e.loaded);
        });
      },
    });
    return translator;
  }
  return {
    kind: "chrome",
    ready: true,
    src,
    tgt,
    async translate(texts, onProgress) {
      const t = await ensure(onProgress);
      const out = [];
      for (let i = 0; i < texts.length; i++) {
        try {
          out.push(await t.translate(texts[i]));
        } catch (_) {
          out.push(texts[i]);
        }
        onProgress?.("text", (i + 1) / texts.length);
      }
      return out;
    },
  };
}

function makeLlmEngine(settings, tgtLabel) {
  return {
    kind: "llm",
    ready: true,
    provider: settings.llmProvider,
    async translate(texts, onProgress) {
      return await llmTranslate({
        provider: settings.llmProvider,
        key: settings.llmKey.trim(),
        model: settings.llmModel.trim(),
        texts,
        tgtLabel,
        correctOcr: settings.llmCorrect,
        onProgress: (done, total) => onProgress?.("text", done / total),
      });
    },
  };
}
