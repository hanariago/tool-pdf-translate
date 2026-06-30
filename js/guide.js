// Onboarding guide modal. Shows on first visit of the day; "don't show again
// today" persists a date in localStorage. The ❔ button reopens it anytime.

const KEY = "pdftGuideHideDate";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function initGuide() {
  const overlay = document.getElementById("guide-overlay");
  const checkbox = document.getElementById("guide-dontshow");
  if (!overlay) return;

  function open() { checkbox.checked = false; overlay.hidden = false; }
  function close() {
    if (checkbox.checked) {
      try { localStorage.setItem(KEY, today()); } catch (_) {}
    }
    overlay.hidden = true;
  }

  document.getElementById("btn-guide").addEventListener("click", open);
  document.getElementById("guide-x").addEventListener("click", close);
  document.getElementById("guide-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  // Auto-show unless dismissed earlier today.
  let hideDate = null;
  try { hideDate = localStorage.getItem(KEY); } catch (_) {}
  if (hideDate !== today()) overlay.hidden = false;
}
