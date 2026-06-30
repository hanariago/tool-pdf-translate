// Onboarding guide modal (per the tool guide's "첫 방문 가이드 팝업" standard).
//   - localStorage date  -> "오늘 다시 보지 않기": hidden for the rest of the day
//   - sessionStorage flag -> closed without the checkbox: hidden for this session
//   - shows again on a new visit (new session) / next day
// Keys are tool-prefixed because every tool shares the hanariago.github.io origin.

const HIDE_KEY = "pdftGuideHide"; // localStorage: YYYY-MM-DD
const SEEN_KEY = "pdftGuideSeen"; // sessionStorage: "1"

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function initGuide() {
  const overlay = document.getElementById("guide-overlay");
  const checkbox = document.getElementById("guide-dontshow");
  if (!overlay) return;

  function show() { overlay.hidden = false; }
  function close() {
    if (checkbox.checked) {
      try { localStorage.setItem(HIDE_KEY, today()); } catch (_) {}
    }
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (_) {}
    overlay.hidden = true;
  }
  function openManual() { checkbox.checked = false; show(); } // ❔ — always reopen

  document.getElementById("btn-guide").addEventListener("click", openManual);
  document.getElementById("guide-x").addEventListener("click", close);
  document.getElementById("guide-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) close();
  });

  // Auto-show only on a fresh visit that hasn't been dismissed today.
  let hide = null, seen = null;
  try { hide = localStorage.getItem(HIDE_KEY); } catch (_) {}
  try { seen = sessionStorage.getItem(SEEN_KEY); } catch (_) {}
  if (hide !== today() && !seen) show();
}
