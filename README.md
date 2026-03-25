# NO DICE — THE TOOLSET
### Improv D&D · Static GitHub Pages · Mobile-First

*A suite of tools for live improv D&D shows. Players scan a QR code. Fate does the rest. No actual dice required or permitted.*

---

## Tools

| Tool | File | Status |
|------|------|--------|
| The Vault (hub) | `index.html` | ✅ Live |
| Character Generator | `chargen.html` | ✅ Live |
| Fate's Flip (coin flip) | `coinflip.html` | ✅ Live |
| Loot Table | `loot.html` | ✅ Live |
| The Poll | `poll.html` | ✅ Live — requires Firebase |
| Trait Generator | `traitgen.html` | ✅ Live |
| QR Code display | `qrcode.html` | ✅ Live |
| Scenario Generator | `scenario.html` | 🔜 Planned |
| NPC Generator | `npc.html` | 🔜 Planned |

---

## How It Works

Players scan a QR code at the show and land on the Vault (`index.html`) — a scrollable accordion of every tool, usable without leaving the page. Each tool also has a standalone full-page URL for direct linking.

**Data:** Every Google Sheets–backed tool falls back silently to hardcoded data if the sheet is unreachable. Nobody sees a broken screen mid-session.

**Theme:** All pages share a dark/light mode toggle (☀️ / 🌙, top-left). The choice persists across pages via `localStorage` key `vaultTheme`.

---

## File Structure

```
/
├── index.html          — The Vault: accordion hub with all tools inline
├── chargen.html        — Character generator (standalone)
├── coinflip.html       — Coin flip / pass-fail (standalone)
├── loot.html           — Loot table (standalone)
├── poll.html           — Audience poll — see FIREBASE_SETUP.md
├── traitgen.html       — Trait generator (standalone)
├── qrcode.html         — QR code display for show night
├── styles.css          — Shared CSS: tokens, typography, buttons, dark mode
├── design-system.css   — Visual reference (not linked — docs only)
├── character-data.csv  — Starter data for Google Sheets import
├── FIREBASE_SETUP.md   — Firebase setup guide for poll.html
└── README.md           — You are here
```

---

## Tool Details

### The Vault (`index.html`)
Accordion of collapsible shelves — one per tool. Each shelf expands inline so players never need to navigate away. A theme toggle (☀️ / 🌙) sits in the top-left corner and persists the choice across all pages.

### Character Generator (`chargen.html`)
Six fields in a scrollable white card: Name, Race/Species, Class, Backstory, Personality Quirk, Secret/Flaw. Name is assembled from separate `First Names` + `Last Names` pools.

**Mulligan system:** 3 shared rerolls. Once spent, a 1-hour lockout begins with a live countdown. Session persists in `localStorage`; a refresh restores the existing character without burning a mulligan.

### Fate's Flip (`coinflip.html`)
Binary pass/fail. Custom coin artwork embedded as base64 PNGs. Confetti + Web Audio coin chime on pass, womp-womp trombone on fail. 16 flavour lines per outcome. Zero external dependencies.

### Loot Table (`loot.html`)
Single card. Sheet tab: `Loot` — Col A: name, Col B: flavour, Col C: image data URI. Shuffle-bag ensures the full list is seen before any repeat. Animated fade on each pull.

### The Poll (`poll.html`)
Firebase Realtime Database for live vote sync. See `FIREBASE_SETUP.md`.

| URL | Who | What |
|-----|-----|------|
| `poll.html` | Audience | Vote → waiting → results |
| `poll.html?admin` | Showrunner | Build poll → watch votes → reveal |

2–5 options per poll. Results hidden until the showrunner reveals them. Votes are anonymous, tied to a `sessionStorage` UUID that clears when the tab closes.

### Trait Generator (`traitgen.html`)
Draws one random entry from Column A of any eligible Sheet tab — the full pool in a single roll. Auto-discovers all tabs; controlled by two config constants:

```js
EXCLUDE_TABS: ['First Names', 'Last Names'],  // skip entirely
LOOT_TAB: 'Loot',                             // fetch A:C, show full item card
```

Adding a trait category = adding a new Sheet tab. No code changes needed. Same 3-mulligan / 1-hour lockout as the Character Generator, stored separately under `nodice_traitgen_session`.

### QR Code (`qrcode.html`)
Displays the QR code image (`qr.png`) for show night. Tap to enlarge via lightbox overlay.

---

## Google Sheets Setup

### Tabs required

**`chargen.html`:** `First Names` · `Last Names` · `Races` · `Classes` · `Backstories` · `Quirks` · `Secrets`

**`loot.html` and `traitgen.html`:** `Loot` — Col A: item name, Col B: flavour text, Col C: image data URI

Any additional tabs added to the Sheet are auto-discovered by `traitgen.html` unless listed in `EXCLUDE_TABS`.

### API key
1. [console.cloud.google.com](https://console.cloud.google.com) → Enable **Google Sheets API** → Create API Key
2. Restrict to: Google Sheets API + your GitHub Pages URL (`https://yourusername.github.io/*`)

### Wiring it up
Each tool has a `CONFIG` block near the top of its `<script>`:
```js
const CONFIG = {
  SHEET_ID: 'the-long-string-between-/d/-and-/edit',
  API_KEY:  'your-api-key',
  ...
}
```

---

## Firebase Setup (Poll)

See **`FIREBASE_SETUP.md`** for the full walkthrough. Short version:
1. Free project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Realtime Database in test mode
3. Register a web app, copy the config object
4. Paste values into the `FIREBASE_CONFIG` block in `poll.html`

Free Spark plan is sufficient: 100 simultaneous connections, 1 GB storage.

---

## Design System

*Parchment and gold. Cinzel for gravitas. Lato for readability in a dark theatre.*

**Fonts:** Cinzel 400/600/700 (headings, labels, buttons) · Lato 300/400 (body text)

**Colour tokens (CSS variables in `styles.css`):**
```css
--ink:       #1a1a2e   /* text, dark buttons */
--parchment: #faf7f2   /* page background */
--gold:      #c9a84c   /* accent — labels, pips, hover */
--gold-dim:  #a07c2e   /* subdued gold — nav links, eyebrows */
--gold-bg:   #fffdf5   /* pale gold hover surface */
--card-bg:   #ffffff   /* card backgrounds */
--border:    #e8e2d9   /* borders and dividers */
--muted:     #6b6676   /* secondary text */
```

Dark mode (`html[data-theme="dark"]`) overrides these tokens. All component styles use variables, so dark mode works automatically.

**Key rules:**
- `overflow: hidden` intentionally absent from `html/body` — preserves Android pull-to-refresh
- Source badge: green dot = live Sheet data · amber dot = fallback built-in data
- No external JS on any page except `poll.html` (Firebase SDK via CDN ESM import)

---

## CSS Architecture

All shared styles live in `styles.css`. Each tool page has a small inline `<style>` block for page-specific layout only. Nothing is duplicated.

| In `styles.css` | In page `<style>` |
|-----------------|-------------------|
| CSS variables + dark mode overrides | Body/page layout (height, flex direction) |
| Typography (`.site-label`, `header h1`, `.subtitle`, `.nav-link`) | Card structure (`.character-card`, `.loot-card`, etc.) |
| Buttons (`.btn-primary`, `.roll-btn`, `.pull-btn`) | Page-specific animations (coin flip, wobble) |
| Shared components (`.source-badge`, `.mulligan-bar`, `.card-footer`, `.lock-notice`) | Unique button variants (coinflip's gold `.btn-roll`) |
| `.page-frame` layout container | Per-page `max-height` overrides |
| Animations (`cardIn`, `spin`, `slideUp`) | |
| Theme toggle button (`.theme-toggle-btn`) | |

---

## GitHub Pages Deployment

1. Push all files to a GitHub repo
2. Settings → Pages → source: `main` branch, root folder
3. Your URL: `https://yourusername.github.io/your-repo-name`
4. Point `qr.png` at that URL and display `qrcode.html` at the show

---

## Mulligan System

*The dice gods giveth three chances. After that, they want you to sit with your choices.*

- First roll on page load is always free
- Each reroll (individual field or full character) costs 1 mulligan
- 0 mulligans → 1-hour lockout → countdown → auto-reset to fresh free roll
- Gold pip dots show remaining mulligans; spent pips shrink and grey out
- Full session state in `localStorage` — refresh restores the existing session

---

## Building Future Tools

*Copy, rename, update CONFIG, ship.*

1. Copy `chargen.html` (multi-field) or `loot.html` (single-item) as your base
2. Update `CONFIG.TABS` / `CONFIG.TAB`, `FIELDS`, and `FALLBACK`
3. Update `<title>`, `<h1>`, `.subtitle`
4. Add a shelf entry in `index.html`
5. Optionally override the gold tokens for a distinct per-tool colour:

```css
/* Example: teal for a scenario generator */
:root {
  --gold:     #2d7a5e;
  --gold-dim: #1e5a44;
  --gold-bg:  #f0fff8;
}
```

---

## Show Night Checklist

- [ ] Google Sheet is current; Loot tab has all three columns filled
- [ ] GitHub Pages live and loading on a real phone
- [ ] QR code (`qrcode.html`) tested and points to the live URL
- [ ] Firebase rules not expired (test mode expires 30 days — check the Rules tab)
- [ ] Poll tested end-to-end: create, vote, reveal, clear
- [ ] Showrunner has `poll.html?admin` bookmarked
- [ ] Dev Reset button in `chargen.html` auto-hides until mulligans run out — verify it's not visible before first spend
- [ ] API key restrictions include the live GitHub Pages URL
- [ ] All tools tested on the actual show device in dark mode

---

## Resuming Work With Claude

> *I'm building an improv D&D tool suite on GitHub Pages called "No Dice." The Vault (`index.html`) is an accordion hub — each tool has an inline shelf and a standalone page. Tools: Character Generator (`chargen.html`), Fate's Flip (`coinflip.html`), Loot Table (`loot.html`), Poll (`poll.html`, Firebase), Trait Generator (`traitgen.html`), QR Code (`qrcode.html`). Shared stylesheet: `styles.css` (tokens, typography, buttons, dark mode, animations). Cinzel/Lato, parchment palette. chargen, loot, traitgen pull from Google Sheets (already wired). traitgen auto-discovers Sheet tabs, excludes via `EXCLUDE_TABS`, shows full loot card for the Loot tab. poll.html uses Firebase (already wired); showrunner via `?admin`. chargen and traitgen share 3-mulligan / 1-hour lockout / localStorage. Dark/light toggle on every page via `localStorage` key `vaultTheme`. I'd like to [describe what you need].*

---

*Built with Claude · No Dice · Improv D&D · Your hometown, probably*
