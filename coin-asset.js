// coin-asset.js
// Shared coin face assets used by coinflip.html and bossbattle.html.
//
// There are three face states:
//   MYSTERY  — the "?" shown while the coin is still spinning
//   PASS     — revealed on a "go_time" (success) result
//   FAIL     — revealed on a "no_time" (failure) result
//
// PASS_IMG and FAIL_IMG are data URIs (base64-encoded PNG).
// To update them: open coinflip.html, copy the full string assigned
// to PASS_IMG / FAIL_IMG, and paste it below between the backticks.
// The string starts with: data:image/png;base64,iVBOR...

// ─── MYSTERY FACE ────────────────────────────────────────────────
// Inline SVG. The faint hexagon outline + translucent "?" glyph.
// Safe to edit directly — no external data needed.
export const MYSTERY_SVG = `<svg viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="55,22 86,39 86,71 55,88 24,71 24,39"
    stroke="rgba(255,255,255,0.20)" stroke-width="1.5" fill="none"/>
  <text x="55" y="70" text-anchor="middle"
    font-family="Georgia, serif" font-size="52" font-weight="bold"
    fill="rgba(26,26,46,0.75)">?</text>
</svg>`;

// ─── FAIL FACE ───────────────────────────────────────────────────
// Shown on a "no_time" result.
// Palette: dark reds / blacks — the "unlucky" coin side.
//
// PLACEHOLDER — paste the full base64 data URI from coinflip.html here:
//   const FAIL_IMG = 'data:image/png;base64,...'   (line 141 of coinflip.html)
export const FAIL_IMG = '';

// ─── PASS FACE ───────────────────────────────────────────────────
// Shown on a "go_time" result.
// Palette: golds / greens — the "lucky" coin side.
//
// PLACEHOLDER — paste the full base64 data URI from coinflip.html here:
//   const PASS_IMG = 'data:image/png;base64,...'   (line 142 of coinflip.html)
export const PASS_IMG = '';

// ─── HELPERS ─────────────────────────────────────────────────────
// Convenience: returns an <img> tag string suitable for innerHTML,
// sized to fill a circular container with object-fit:cover.
function imgTag(src) {
  return `<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
}

// Apply the mystery face to a DOM element.
export function setFaceMystery(el) {
  el.className = 'face face-mystery';
  el.innerHTML = MYSTERY_SVG;
}

// Apply the fail face to a DOM element.
// Falls back to a text glyph if FAIL_IMG has not been pasted in yet.
export function setFaceFail(el) {
  el.className = 'face face-fail';
  el.innerHTML = FAIL_IMG ? imgTag(FAIL_IMG) : '✗';
}

// Apply the pass face to a DOM element.
// Falls back to a text glyph if PASS_IMG has not been pasted in yet.
export function setFacePass(el) {
  el.className = 'face face-pass';
  el.innerHTML = PASS_IMG ? imgTag(PASS_IMG) : '✓';
}
