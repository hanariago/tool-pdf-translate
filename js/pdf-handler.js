// PDF loading, page rendering, and text-layer coordinate extraction via pdf.js.

import { PDFJS_CDN, PDFJS_WORKER, PDFJS_VERSION, SCANNED_TEXT_THRESHOLD } from "./config.js";

const PDFJS_ASSETS = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/`;

let pdfjsLib = null;

// Lazy-load the pdf.js ESM build from CDN and configure its worker.
export async function getPdfLib() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import(/* @vite-ignore */ PDFJS_CDN);
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return pdfjsLib;
}

export async function loadDocument(arrayBuffer) {
  const lib = await getPdfLib();
  const task = lib.getDocument({
    data: arrayBuffer,
    cMapUrl: PDFJS_ASSETS + "cmaps/",
    cMapPacked: true,
    standardFontDataUrl: PDFJS_ASSETS + "standard_fonts/",
  });
  return await task.promise;
}

// Render a page onto a canvas, sized to fit `cssWidth` (device-pixel aware).
// Returns { viewport, scale, cssWidth, cssHeight }.
export async function renderPage(page, canvas, cssWidth) {
  const lib = await getPdfLib();
  const base = page.getViewport({ scale: 1 });
  const scale = cssWidth / base.width;
  const viewport = page.getViewport({ scale });

  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = viewport.width + "px";
  canvas.style.height = viewport.height + "px";

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  await page.render({ canvasContext: ctx, viewport }).promise;

  return {
    viewport,
    scale,
    dpr,
    cssWidth: viewport.width,
    cssHeight: viewport.height,
  };
}

// Extract text blocks (grouped into visual lines) with CSS-pixel coordinates.
// Returns { blocks: [{text,x,y,w,h,fontSize}], isScanned, rawLength }.
export async function extractTextBlocks(page, viewport) {
  const lib = await getPdfLib();
  const content = await page.getTextContent();

  const items = [];
  let rawLength = 0;

  for (const item of content.items) {
    if (!item.str) continue;
    const str = item.str;
    if (!str.trim() && !item.hasEOL) continue;
    rawLength += str.trim().length;

    // Map text-space transform into viewport (canvas) space.
    const tx = lib.Util.transform(viewport.transform, item.transform);
    const fontHeight = Math.hypot(tx[2], tx[3]);
    const w = item.width * viewport.scale;
    const x = tx[4];
    const baselineY = tx[5];
    const top = baselineY - fontHeight;

    items.push({
      str,
      x,
      top,
      baselineY,
      w: w || fontHeight * str.length * 0.5,
      h: fontHeight,
      hasEOL: item.hasEOL,
    });
  }

  const isScanned = rawLength < SCANNED_TEXT_THRESHOLD;
  if (isScanned) return { blocks: [], isScanned: true, rawLength };

  const blocks = groupIntoLines(items);
  return { blocks, isScanned: false, rawLength };
}

// Group raw text items into lines using baseline proximity + reading order.
function groupIntoLines(items) {
  if (!items.length) return [];

  // Sort by vertical position, then horizontal.
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.baselineY - b.baselineY) > a.h * 0.6) return a.baselineY - b.baselineY;
    return a.x - b.x;
  });

  const lines = [];
  let cur = null;

  for (const it of sorted) {
    if (
      cur &&
      Math.abs(it.baselineY - cur.baselineY) <= Math.max(it.h, cur.refH) * 0.6 &&
      it.x >= cur.minX - it.h * 4 // same line, roughly left-to-right
    ) {
      // append to current line
      const gap = it.x - (cur.maxX);
      // insert a space if there is a visible horizontal gap and no trailing space
      if (gap > it.h * 0.25 && !cur.text.endsWith(" ")) cur.text += " ";
      cur.text += it.str;
      cur.minX = Math.min(cur.minX, it.x);
      cur.maxX = Math.max(cur.maxX, it.x + it.w);
      cur.top = Math.min(cur.top, it.top);
      cur.bottom = Math.max(cur.bottom, it.top + it.h);
      cur.baselineY = (cur.baselineY + it.baselineY) / 2;
      cur.refH = Math.max(cur.refH, it.h);
    } else {
      cur = {
        text: it.str,
        minX: it.x,
        maxX: it.x + it.w,
        top: it.top,
        bottom: it.top + it.h,
        baselineY: it.baselineY,
        refH: it.h,
      };
      lines.push(cur);
    }
  }

  return lines
    .map((l) => ({
      text: l.text.replace(/\s+/g, " ").trim(),
      x: l.minX,
      y: l.top,
      w: Math.max(l.maxX - l.minX, l.refH),
      h: Math.max(l.bottom - l.top, l.refH),
      fontSize: l.refH,
    }))
    .filter((b) => b.text.length > 0);
}
