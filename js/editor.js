// Edit-mode controller: thumbnail grid, selection, rotate/delete/reorder,
// extract & merge — all backed by pdf-lib (export) and pdf.js (thumbnails).

import { loadPdfLibDoc, pageRotations, buildPdf } from "./pdf-edit.js";
import { getPdfLib } from "./pdf-handler.js";

const state = {
  sources: new Map(), // srcId -> { name, libDoc, pdfjsDoc }
  pages: [],          // { uid, srcId, srcPageIndex, rotation, selected, thumb, label }
  uid: 0,
  srcId: 0,
};

let els = {};
let dragUid = null;

export function initEditor() {
  els = {
    view: document.getElementById("edit-view"),
    drop: document.getElementById("edit-drop"),
    fileInput: document.getElementById("edit-file-input"),
    workspace: document.getElementById("edit-workspace"),
    grid: document.getElementById("edit-grid"),
    count: document.getElementById("edit-count"),
    selectAll: document.getElementById("edit-select-all"),
    rotL: document.getElementById("edit-rotate-l"),
    rotR: document.getElementById("edit-rotate-r"),
    del: document.getElementById("edit-delete"),
    add: document.getElementById("edit-add"),
    extract: document.getElementById("edit-extract"),
    save: document.getElementById("edit-save"),
    reset: document.getElementById("edit-reset"),
  };

  els.fileInput.addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  els.add.addEventListener("click", () => els.fileInput.click());
  els.selectAll.addEventListener("click", toggleSelectAll);
  els.rotL.addEventListener("click", () => rotateSelected(-90));
  els.rotR.addEventListener("click", () => rotateSelected(90));
  els.del.addEventListener("click", deleteSelected);
  els.extract.addEventListener("click", () => exportPdf(true));
  els.save.addEventListener("click", () => exportPdf(false));
  els.reset.addEventListener("click", resetEditor);

  // Drag & drop files onto the edit dropzone.
  ["dragenter", "dragover"].forEach((ev) =>
    els.drop.addEventListener(ev, (e) => { e.preventDefault(); els.drop.classList.add("is-drag"); }));
  ["dragleave", "drop"].forEach((ev) =>
    els.drop.addEventListener(ev, (e) => {
      e.preventDefault();
      els.drop.classList.remove("is-drag");
      if (ev === "drop" && e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
    }));
}

// ---------- Loading ----------
async function addFiles(list) {
  const files = [...list].filter(
    (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
  );
  if (!files.length) return;

  showWorkspace();
  const lib = await getPdfLib();
  for (const f of files) {
    try {
      const buf = await f.arrayBuffer();
      const libDoc = await loadPdfLibDoc(buf.slice(0));
      const pdfjsDoc = await lib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
      const id = "s" + state.srcId++;
      state.sources.set(id, { name: f.name, libDoc, pdfjsDoc });
      const rots = pageRotations(libDoc);
      const n = libDoc.getPageCount();
      for (let i = 0; i < n; i++) {
        state.pages.push({
          uid: "p" + state.uid++,
          srcId: id,
          srcPageIndex: i,
          rotation: rots[i] || 0,
          selected: false,
          thumb: null,
          label: `${f.name} · ${i + 1}p`,
        });
      }
    } catch (e) {
      alert(`"${f.name}"을(를) 열지 못했습니다: ${e.message || e}`);
    }
  }
  renderGrid();
  generateThumbs();
}

function showWorkspace() {
  els.drop.hidden = true;
  els.workspace.hidden = false;
}

// ---------- Grid rendering ----------
function renderGrid() {
  els.grid.innerHTML = "";
  const frag = document.createDocumentFragment();
  state.pages.forEach((p, idx) => frag.appendChild(makeCard(p, idx)));
  els.grid.appendChild(frag);
  updateCount();
}

function makeCard(p, idx) {
  const card = document.createElement("div");
  card.className = "thumb-card" + (p.selected ? " is-selected" : "");
  card.draggable = true;
  card.dataset.uid = p.uid;

  card.innerHTML = `
    <div class="thumb-card__imgwrap">
      <input type="checkbox" class="thumb-card__check" ${p.selected ? "checked" : ""} aria-label="선택" />
      ${p.thumb
        ? `<img class="thumb-card__img" src="${p.thumb}" alt="" />`
        : `<span class="thumb-card__spinner">미리보기…</span>`}
      ${p.rotation ? `<span class="thumb-card__badge">${p.rotation}°</span>` : ""}
    </div>
    <div class="thumb-card__foot">
      <span class="thumb-card__label" title="${p.label}">${idx + 1}. ${p.label}</span>
      <span class="thumb-card__btns">
        <button class="mini-btn" data-act="left" title="앞으로">◀</button>
        <button class="mini-btn" data-act="rot" title="회전">↻</button>
        <button class="mini-btn" data-act="del" title="삭제">✕</button>
        <button class="mini-btn" data-act="right" title="뒤로">▶</button>
      </span>
    </div>`;

  card.querySelector(".thumb-card__check").addEventListener("change", (e) => {
    p.selected = e.target.checked;
    card.classList.toggle("is-selected", p.selected);
    updateCount();
  });
  card.querySelectorAll(".mini-btn").forEach((b) =>
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      const act = b.dataset.act;
      if (act === "left") movePage(p.uid, -1);
      else if (act === "right") movePage(p.uid, 1);
      else if (act === "rot") rotateOne(p, 90);
      else if (act === "del") deleteOne(p.uid);
    })
  );

  // Drag reorder (desktop).
  card.addEventListener("dragstart", (e) => {
    dragUid = p.uid;
    card.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("dragend", () => {
    dragUid = null;
    card.classList.remove("is-dragging");
    els.grid.querySelectorAll(".is-droptarget").forEach((c) => c.classList.remove("is-droptarget"));
  });
  card.addEventListener("dragover", (e) => { e.preventDefault(); card.classList.add("is-droptarget"); });
  card.addEventListener("dragleave", () => card.classList.remove("is-droptarget"));
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    card.classList.remove("is-droptarget");
    if (dragUid && dragUid !== p.uid) reorder(dragUid, p.uid);
  });

  return card;
}

// ---------- Thumbnails ----------
async function generateThumbs() {
  for (const p of state.pages) {
    if (p.thumb) continue;
    await makeThumb(p);
  }
}

async function makeThumb(p) {
  const src = state.sources.get(p.srcId);
  if (!src) return;
  try {
    const page = await src.pdfjsDoc.getPage(p.srcPageIndex + 1);
    const base = page.getViewport({ scale: 1, rotation: p.rotation });
    const scale = 150 / base.width;
    const vp = page.getViewport({ scale, rotation: p.rotation });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Guard against hung rendering (e.g. throttled background tab).
    await Promise.race([
      page.render({ canvasContext: ctx, viewport: vp }).promise,
      new Promise((_, rej) => setTimeout(() => rej(new Error("render-timeout")), 15000)),
    ]);
    p.thumb = canvas.toDataURL("image/jpeg", 0.7);
    updateCardImage(p);
  } catch (_) {
    // leave placeholder; export still works without a thumbnail
  }
}

function updateCardImage(p) {
  const card = els.grid.querySelector(`[data-uid="${p.uid}"]`);
  if (!card || !p.thumb) return;
  const wrap = card.querySelector(".thumb-card__imgwrap");
  const spinner = wrap.querySelector(".thumb-card__spinner");
  if (spinner) spinner.remove();
  let img = wrap.querySelector(".thumb-card__img");
  if (!img) {
    img = document.createElement("img");
    img.className = "thumb-card__img";
    img.alt = "";
    wrap.insertBefore(img, wrap.querySelector(".thumb-card__badge") || null);
  }
  img.src = p.thumb;
}

// ---------- Operations ----------
function selectedPages() { return state.pages.filter((p) => p.selected); }

function updateCount() {
  const sel = selectedPages().length;
  els.count.textContent = `${sel} / ${state.pages.length} 선택`;
  els.selectAll.textContent = sel === state.pages.length && sel > 0 ? "전체 해제" : "전체 선택";
}

function toggleSelectAll() {
  const allSel = state.pages.every((p) => p.selected);
  state.pages.forEach((p) => { p.selected = !allSel; });
  renderGrid();
}

function rotateSelected(delta) {
  const sel = selectedPages();
  if (!sel.length) { hint("회전할 페이지를 먼저 선택하세요."); return; }
  sel.forEach((p) => applyRotation(p, delta));
}

function rotateOne(p, delta) { applyRotation(p, delta); }

function applyRotation(p, delta) {
  p.rotation = (((p.rotation + delta) % 360) + 360) % 360;
  p.thumb = null;
  // re-render this card's thumb + badge
  const card = els.grid.querySelector(`[data-uid="${p.uid}"]`);
  if (card) {
    const wrap = card.querySelector(".thumb-card__imgwrap");
    const img = wrap.querySelector(".thumb-card__img");
    if (img) img.remove();
    let badge = wrap.querySelector(".thumb-card__badge");
    if (p.rotation) {
      if (!badge) { badge = document.createElement("span"); badge.className = "thumb-card__badge"; wrap.appendChild(badge); }
      badge.textContent = p.rotation + "°";
    } else if (badge) badge.remove();
    if (!wrap.querySelector(".thumb-card__spinner")) {
      const s = document.createElement("span"); s.className = "thumb-card__spinner"; s.textContent = "미리보기…"; wrap.appendChild(s);
    }
  }
  makeThumb(p);
}

function deleteSelected() {
  const sel = selectedPages();
  if (!sel.length) { hint("삭제할 페이지를 먼저 선택하세요."); return; }
  if (!confirm(`선택한 ${sel.length}개 페이지를 삭제할까요?`)) return;
  state.pages = state.pages.filter((p) => !p.selected);
  afterMutate();
}

function deleteOne(uid) {
  state.pages = state.pages.filter((p) => p.uid !== uid);
  afterMutate();
}

function afterMutate() {
  if (!state.pages.length) { resetEditor(); return; }
  renderGrid();
}

function movePage(uid, dir) {
  const i = state.pages.findIndex((p) => p.uid === uid);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= state.pages.length) return;
  [state.pages[i], state.pages[j]] = [state.pages[j], state.pages[i]];
  renderGrid();
}

function reorder(fromUid, toUid) {
  const from = state.pages.findIndex((p) => p.uid === fromUid);
  const dragged = state.pages.splice(from, 1)[0];
  const to = state.pages.findIndex((p) => p.uid === toUid);
  state.pages.splice(to, 0, dragged);
  renderGrid();
}

async function exportPdf(selectedOnly) {
  const pages = selectedOnly ? selectedPages() : state.pages;
  if (!pages.length) { hint(selectedOnly ? "추출할 페이지를 선택하세요." : "저장할 페이지가 없습니다."); return; }
  const btn = selectedOnly ? els.extract : els.save;
  const old = btn.textContent;
  btn.disabled = true; btn.textContent = "처리 중…";
  try {
    const bytes = await buildPdf(pages, new Map([...state.sources].map(([k, v]) => [k, v.libDoc])));
    const base = state.sources.size ? [...state.sources.values()][0].name.replace(/\.pdf$/i, "") : "document";
    download(bytes, `${base}_${selectedOnly ? "추출" : "편집"}.pdf`);
  } catch (e) {
    alert("PDF 생성 실패: " + (e.message || e));
  } finally {
    btn.disabled = false; btn.textContent = old;
  }
}

function download(bytes, name) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resetEditor() {
  state.sources.clear();
  state.pages = [];
  els.grid.innerHTML = "";
  els.workspace.hidden = true;
  els.drop.hidden = false;
}

let hintTimer = null;
function hint(msg) {
  els.count.textContent = msg;
  els.count.style.color = "var(--warn-text)";
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { els.count.style.color = ""; updateCount(); }, 2500);
}
