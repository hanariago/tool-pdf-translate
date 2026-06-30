// PDF editing operations via pdf-lib (merge / extract / rotate / delete).
// All in-browser; nothing is uploaded.

import { PDFDocument, degrees } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";

// Load bytes into a pdf-lib document used as a copy source.
export async function loadPdfLibDoc(arrayBuffer) {
  return await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
}

// Read the original rotation (degrees) of each page in a source document.
export function pageRotations(libDoc) {
  const out = [];
  const pages = libDoc.getPages();
  for (const p of pages) {
    let a = 0;
    try { a = p.getRotation().angle || 0; } catch (_) {}
    out.push(((a % 360) + 360) % 360);
  }
  return out;
}

// Build a new PDF from an ordered page list.
// pages: [{ srcId, srcPageIndex, rotation }]
// sourceDocs: Map(srcId -> pdf-lib PDFDocument)
// Returns Uint8Array of the saved PDF.
export async function buildPdf(pages, sourceDocs) {
  if (!pages.length) throw new Error("내보낼 페이지가 없습니다.");
  const out = await PDFDocument.create();

  // Group consecutive copies from the same source for fewer copyPages calls,
  // while preserving exact order.
  for (const p of pages) {
    const src = sourceDocs.get(p.srcId);
    if (!src) continue;
    const [copied] = await out.copyPages(src, [p.srcPageIndex]);
    const r = (((p.rotation || 0) % 360) + 360) % 360;
    copied.setRotation(degrees(r));
    out.addPage(copied);
  }
  return await out.save();
}
