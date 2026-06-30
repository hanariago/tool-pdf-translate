// Render translated text boxes over the page at the original coordinates,
// shrinking the font so each translation fits its source box.

export function clearOverlay(overlay) {
  overlay.innerHTML = "";
}

// blocks: [{x,y,w,h,fontSize,text,translated}]
export function renderOverlay(overlay, blocks) {
  overlay.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const b of blocks) {
    const el = document.createElement("div");
    el.className = "tblock" + (b.translated ? "" : " tblock--pending");
    el.style.left = b.x + "px";
    el.style.top = b.y + "px";
    el.style.width = Math.max(b.w, 6) + "px";
    el.style.height = Math.max(b.h, 8) + "px";
    el.style.fontSize = (b.fontSize || b.h * 0.8) + "px";
    el.textContent = b.translated || "";
    el.title = b.translated ? `${b.translated}\n\n원문: ${b.text}` : b.text;
    el.dataset.block = "1";
    frag.appendChild(el);
  }
  overlay.appendChild(frag);
  // Fit synchronously: each block has an explicit pixel size, so scroll metrics
  // are valid immediately on read (no rAF dependency — works in background tabs).
  overlay.querySelectorAll(".tblock").forEach((el) => fitText(el));
}

// Shrink font-size until the text fits both width and height (min 7px).
function fitText(el) {
  if (!el.textContent) return;
  const boxW = el.clientWidth;
  const boxH = el.clientHeight;
  if (boxW < 2 || boxH < 2) return;

  let size = parseFloat(el.style.fontSize) || boxH * 0.8;
  size = Math.min(size, boxH * 0.95);
  el.style.fontSize = size + "px";

  let guard = 40;
  while (
    (el.scrollWidth > boxW + 1 || el.scrollHeight > boxH + 1) &&
    size > 7 &&
    guard-- > 0
  ) {
    size -= 0.5;
    el.style.fontSize = size + "px";
  }
  // If it still overflows at min size, keep it clipped (hover reveals full).
  if (el.scrollWidth > boxW + 1 || el.scrollHeight > boxH + 1) {
    el.classList.add("tblock--clipped");
  }
}
