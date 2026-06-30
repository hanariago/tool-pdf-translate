// Scanned-PDF OCR via Tesseract.js (loaded as a global UMD script in index.html).

let activeWorker = null;
let activeLang = null;

// Create/reuse a Tesseract worker for the requested language.
async function getWorker(lang, onStatus) {
  if (activeWorker && activeLang === lang) return activeWorker;
  if (activeWorker) {
    try { await activeWorker.terminate(); } catch (_) {}
    activeWorker = null;
  }
  if (typeof Tesseract === "undefined") {
    throw new Error("Tesseract.js를 불러오지 못했습니다. 네트워크를 확인하세요.");
  }
  activeWorker = await Tesseract.createWorker(lang, 1, {
    logger: (m) => {
      if (onStatus && m.status) {
        onStatus(m.status, typeof m.progress === "number" ? m.progress : 0);
      }
    },
  });
  activeLang = lang;
  return activeWorker;
}

// Run OCR on a canvas. Returns blocks in CSS-pixel coordinates.
// `dpr` maps OCR pixel-space (canvas backing store) back to CSS px.
export async function ocrCanvas(canvas, lang, dpr, onStatus) {
  const worker = await getWorker(lang, onStatus);
  const { data } = await worker.recognize(canvas);

  const blocks = [];
  const lines = (data.lines && data.lines.length ? data.lines : flattenLines(data)) || [];

  for (const line of lines) {
    const text = (line.text || "").replace(/\s+/g, " ").trim();
    if (!text) continue;
    const b = line.bbox;
    if (!b) continue;
    const x = b.x0 / dpr;
    const y = b.y0 / dpr;
    const w = (b.x1 - b.x0) / dpr;
    const h = (b.y1 - b.y0) / dpr;
    if (w < 4 || h < 4) continue;
    blocks.push({ text, x, y, w, h, fontSize: h * 0.85 });
  }
  return blocks;
}

// Fallback when data.lines is not populated: walk blocks -> paragraphs -> lines.
function flattenLines(data) {
  const out = [];
  for (const blk of data.blocks || []) {
    for (const par of blk.paragraphs || []) {
      for (const line of par.lines || []) out.push(line);
    }
  }
  return out;
}

export async function terminateOcr() {
  if (activeWorker) {
    try { await activeWorker.terminate(); } catch (_) {}
    activeWorker = null;
    activeLang = null;
  }
}
