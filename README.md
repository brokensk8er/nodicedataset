# NO DICE — IMPROV RPG - NO DICE TOOLS (NDT)
### RPG-TOOL · GitHub Pages · Mobile-First

*A suite of tools for live improv RPG shows and TTRPG inspiration. Pull a couple variables; fate does the rest. No actual dice required or permitted.*

---

## Tools

| Tool | File | Status |
|------|------|--------|
| The Vault (hub) | `index.html` | ✅ Live |
| Fate's Flip (coin flip) | `coinflip.html` | ✅ Live |
| Character Generator | `chargen.html` | ✅ Live |
| Loot Table | `loot.html` | ✅ Live |
| The Poll | `poll.html` | ✅ Live — requires Firebase |
| Trait Generator | `traitgen.html` | ✅ Live |
| QR Code display | `qrcode.html` | ✅ Live |
| Adventurer Profile | `profile.html` | ✅ Live — requires Firebase |
| Scenario Generator | `scenario.html` | 🔜 Planned |
| NPC Generator | `npc.html` | 🔜 Planned |

---

## How It Works

Users land on the page (`index.html`) — a scrollable accordion of every tool, usable without leaving the page. Each tool also has a standalone full-page URL for direct linking.

**Data:** Every Google Sheets–backed tool falls back silently to hardcoded data if the sheet is unreachable. Nobody sees a broken screen mid-session.

**Theme:** All pages share a three-state theme toggle (🌙 / ☀️ / 🛑, top-left) cycling dark → light → No Dice → dark. The choice persists across pages via `localStorage` key `vaultTheme`. The No Dice theme uses colors from the physical coin collection: red (235, 46, 46) and green (0, 166, 81) for a pop-art aesthetic with animated shelf borders that sweep from red to green when opened.

**Auth:** A fixed `⚔ Login` / `⚔ Name` cutout tab appears top-right on every page, linking to `profile.html`. Powered by Firebase Auth (Google sign-in + email/password). Profile auth has admin permission checks to for special "showrunner" tools.

---

## File Structure

```
/
├── index.html          — The Vault: accordion hub with all tools inline
├── profile.html        — Adventurer profile: auth, character sheet, admin panel
├── profile-auth.js     — Shared Firebase Auth + Firestore module (imported by all pages)
├── chargen.html        — Character generator (standalone)
├── coinflip.html       — Coin flip / pass-fail (standalone)
├── loot.html           — Loot table (standalone)
├── poll.html           — Audience poll — see FIREBASE_SETUP.md
├── traitgen.html       — Trait generator (standalone)
├── qrcode.html         — QR code display for show night
├── styles.css          — All CSS consolidated: shared + page-specific styles, all three themes
├── character-data.csv  — Starter data for Google Sheets import
├── FIREBASE_SETUP.md   — Firebase setup guide for poll.html and profile.html
├── icons/              — AI-generated loot item artwork (55 images, JPEG ≤450 KB)
└── README.md           — You are here
```

---

## Tool Details

### The Vault (`index.html`)
Accordion of collapsible shelves — one per tool. Each shelf expands inline so players never need to navigate away. A three-state theme toggle (🌙 / ☀️ / 🛑) sits in the top-left corner, cycling dark mode → light mode → No Dice mode, and persists the choice across all pages via localStorage.

### Adventurer Profile (`profile.html` + `profile-auth.js`)
Persistent per-player profile backed by **Firebase Auth + Firestore**. Accessible from any page via the `⚔ Login` / `⚔ Name` cutout tab at the top-right.

**Authentication:** Google sign-in or email/password. `profile-auth.js` is a shared ES module imported on every page to mount the login button and export auth helpers.

**Profile sections:**

- **Attendance & Badges** — session count + six tiered badge SVGs (Initiate → The Undying) unlocked at attendance milestones.
- **Ticket Verification** — player submits their purchase email; an admin verifies it in Firestore to credit attendance.
- **Character Sheet** — six fields (Name, Race/Species, Class/Role, Backstory, Quirk, Secret) with a full randomize system (see below).
- **Showrunner Panel** — admin-only collapsible accordion (see below).

**Character Sheet Randomizer:**

Each field has an inline **⚄ Roll** button and a **✓ Pin** button. A **🎲 Fully Randomize** button at the top fills all un-pinned fields at once. Pulls from the same Google Sheets source (and fallback arrays) as `chargen.html`.

- First randomize (any button) is always **free** — no mulligan spent.
- Each subsequent randomize costs **1 mulligan** from a shared 3-mulligan pool.
- Diamond pip row appears after the first roll; spent pips dim as mulligans are used.
- Pinned fields (✓ turns gold) are skipped by Fully Randomize but can still be edited manually.
- Manual text editing is always allowed until the character is saved.
- **Clicking "Save Character" triggers a 24-hour lock** — all fields go readonly, all randomize/pin buttons disable, and the note shows the exact unlock date and time. After 24 hours the sheet becomes editable again.

**Back to Vault button:** A `← Vault` cutout tab appears top-right on `profile.html` only, returning to `index.html`.

**Showrunner Panel (Admin):**

A collapsible accordion shelf at the bottom of the profile page, **only visible when the signed-in user's Firestore doc has `isAdmin: true`**. The Firebase Realtime Database listener starts lazily on first open.

Provides the full poll admin workflow:
- Create a question with 2–5 lettered options (A–E); add/remove options dynamically.
- **Launch Poll** → pushes to `nodice/poll` in the Realtime Database; audience on `index.html` / `poll.html` sees the poll immediately.
- Pre-reveal view shows live vote counts and percentage bars — audience sees nothing yet.
- **Reveal Results** → results become visible to the audience.
- **New Poll / Close & Clear** → resets database for next round.

---

### Character Generator (`chargen.html`)
Six fields in a scrollable white card: Name, Race/Species, Class, Backstory, Personality Quirk, Secret/Flaw. Name is assembled from separate `First Names` + `Last Names` pools.

**Mulligan system:** 3 shared rerolls. Once spent, a **1-hour** lockout begins with a live countdown. Session persists in `localStorage`; a refresh restores the existing character without burning a mulligan.

---

### Fate's Flip (`coinflip.html`)
Binary pass/fail. Custom coin artwork embedded as base64 PNGs. Confetti + Web Audio coin chime on pass, womp-womp trombone on fail. 16 flavour lines per outcome. Zero external dependencies.

---

### Loot Table (`loot.html`)
Single card. Sheet tab: `Loot` — Col A: name, Col B: flavour, Col C: image data URI or filename (served from `icons/`). Shuffle-bag ensures the full list is seen before any repeat. Animated fade on each pull. 55 AI-generated item images ship in `icons/` (JPEG, optimised to ≤450 KB each).

---

### The Poll (`poll.html`)
Firebase Realtime Database for live vote sync. See `FIREBASE_SETUP.md`.

Audience view is the default. Showrunner activates admin mode by **holding the 🧙 NPC Gen card for 3 seconds** — a brief icon flash confirms the switch. State persists in `sessionStorage` key `nodice_vault_admin` for the duration of the browser session.

Alternatively, admins can manage polls directly from the **Showrunner Panel** on their `profile.html` (requires `isAdmin: true` in Firestore) — no secret gesture needed.

2–5 options per poll. Results hidden until the showrunner reveals them. Votes are anonymous, tied to a `sessionStorage` UUID that clears when the tab closes.

---

### Trait Generator (`traitgen.html`)
Draws one random entry from Column A of any eligible Sheet tab — the full pool in a single roll. Auto-discovers all tabs; controlled by two config constants:

```js
EXCLUDE_TABS: ['First Names', 'Last Names'],  // skip entirely
LOOT_TAB: 'Loot',                             // fetch A:C, show full item card
```

Adding a trait category = adding a new Sheet tab. No code changes needed. Same 3-mulligan / 1-hour lockout as the Character Generator, stored separately under `nodice_traitgen_session`.

---

### QR Code (`qrcode.html`)
Displays the QR code image (`qr.png`) for show night. Tap to enlarge via lightbox overlay.

---

## Shelf Registry

The Vault (`index.html`) and Adventurer Profile (`profile.html`) use a collapsible shelf accordion pattern. Each shelf is identified by an internal ID and a user-facing display name. Use this registry when working on code or referring to a specific tool/section.

### The Vault (`index.html` — 6 shelves)

| Shelf ID | Display Name | Purpose |
|----------|--------------|---------|
| `shelf-coin` | coinflip | Coin flip / pass-fail tool |
| `shelf-chargen` | chargen | Character generator |
| `shelf-loot` | loot | Loot table roller |
| `shelf-poll` | poll | Audience poll admin |
| `shelf-trait` | traitgen | Trait generator |
| `shelf-qr` | qrcode | QR code display |

### Adventurer Profile (`profile.html` — 5 shelves)

| Shelf ID | Display Name | Purpose |
|----------|--------------|---------|
| `profile-shelf-account` | account | Account/username display with sign out |
| `admin-poll-card` | adminpoll | Admin-only poll management (hidden unless `isAdmin: true`) |
| `profile-shelf-badges` | badges | Session count + badge display |
| `profile-shelf-tickets` | tickets | Player ticket verification |
| `profile-shelf-charsheet` | charsheet | Editable character fields (Name, Race, Class, Backstory, Quirk, Secret) |

---

## Google Sheets Setup

### Tabs required

**`chargen.html` and `profile.html` character sheet:** `First Names` · `Last Names` · `Races` · `Classes` · `Backstories` · `Quirks` · `Secrets`

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

## Firebase Setup

Two Firebase services are used:

| Service | Used by | Purpose |
|---------|---------|---------|
| Realtime Database | `poll.html`, `index.html`, `profile.html` (admin panel) | Live poll votes |
| Firestore + Auth | `profile.html`, all pages (login button) | User accounts, profiles, character sheets |

See **`FIREBASE_SETUP.md`** for the full walkthrough. Short version:
1. Free project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Realtime Database in test mode
3. Enable Firestore Database
4. Enable Authentication (Google + Email/Password providers)
5. Register a web app, copy the config object
6. Paste values into `FIREBASE_CONFIG` in `poll.html` (Realtime DB) and `FIREBASE_CONFIG` in `profile-auth.js` (Firestore + Auth)

Free Spark plan is sufficient: 100 simultaneous connections, 1 GB storage.

**To grant admin access:** In the Firebase Console, open Firestore → `users/{uid}` → set `isAdmin: true`. That user will see the Showrunner Panel on their profile page.

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

**No Dice Theme** (`html[data-theme="nodice"]`) uses colors from the physical No Dice coins for a pop-art aesthetic:
```css
/* No Dice theme palette */
--parchment:   rgba(0, 0, 0, 1);         /* pure black background */
--card-bg:     rgba(255, 255, 255, 1);   /* white card surfaces */
--border:      rgba(235, 46, 46, 1);     /* coin red — shelf borders at rest */
--gold:        rgba(156, 123, 46, 1);    /* coin gold — interactive highlights */
--pass-grn:    rgba(0, 166, 81, 1);      /* coin green — open shelf accent, sweep endpoint */
```

Signature feature: **Animated shelf borders** — cards display a red border at rest; when opened, the border animates in a 45° diagonal sweep from red to green, creating a dynamic visual "reveal." The animation uses a conic-gradient with `clip-path` wipe and has a subtle delay (120ms) after the shelf opens.

**Key rules:**
- `overflow: hidden` intentionally absent from `html/body` — preserves Android pull-to-refresh
- Source badge: green dot = live Sheet data · amber dot = fallback built-in data
- No external JS on any page except `poll.html` and `profile.html` (Firebase SDK via CDN ESM import)

---

## CSS Architecture

**ALL CSS is consolidated in `styles.css` — no more inline styles in HTML files.**

The stylesheet is organized into three sections:

1. **Shared Styles** (Sections 1–13)
   - CSS Variables (`:root`) — all color tokens
   - Typography, buttons, components, animations
   - Used by every page

2. **Page-Specific Styles** (Sections 14–21)
   - Index/Hub, Chargen, Coinflip, Loot, Poll, QR Code, Traitgen, Profile
   - Layout, cards, unique components
   - Page-specific animations (prefixed: `chargen-spin`, `coinflip-wobble`, etc.)

3. **Theme System**
   - Light (default `:root` values)
   - Dark (`html[data-theme="dark"]`)
   - No Dice (`html[data-theme="nodice"]`)

| Component | Location |
|-----------|----------|
| CSS Variables, color tokens, shadows | `styles.css` Section 1 |
| Typography (`.site-label`, `h1 span`, `.subtitle`, `.nav-link`) | `styles.css` Section 4–5 |
| Buttons (`.btn-primary`, `.roll-btn`, `.pull-btn`, `.btn-roll`) | `styles.css` Sections 9, Page-specific |
| Shared components (`.source-badge`, `.mulligan-bar`, `.card-footer`) | `styles.css` Sections 7, 10, 12 |
| Page layout (flex, height, max-width) | `styles.css` Page-specific section |
| Animations (`cardIn`, `chargen-spin`, `coinflip-wobble`, `coinflip-slideUp`) | `styles.css` Section 13 + Page-specific |
| Theme overrides (dark/nodice) | `styles.css` Sections at end |

## CSS Guidelines & Best Practices

### Color & Variables
- **Always use CSS variables from `:root`** — never hardcode hex values
- `--gold` and `--gold-dim` are primary accent colors
- `--ink` and `--parchment` form the light theme; dark theme overrides both
- Variables like `--pass-grn`, `--fail-red` are for semantic status colors

Example:
```css
/* ✓ Correct */
.my-btn { background: var(--gold); color: var(--ink); }

/* ✗ Wrong */
.my-btn { background: #c9a84c; color: #1a1a2e; }
```

### CSS Organization

**When adding CSS:**
1. If it's **shared** across pages → add to a SHARED section (Sections 1–13)
2. If it's **page-specific** → add to that page's section (Sections 14–21)
3. If it's a **new tool/page** → create a new PAGE-SPECIFIC section

**Page-specific section template:**
```css
/* ─────────────────────────────────────────
   YOUR PAGE NAME
   Brief description of what this page does
   and its key features.
   ───────────────────────────────────────── */

/* Your page styles here */
```

### Animation Naming Convention

Animations are **page-prefixed** to avoid unintended cross-page effects:
- `chargen-spin` (reroll die)
- `coinflip-coinFlip` (coin flip)
- `coinflip-wobble` (result wobble)
- `coinflip-slideUp` (card entrance)
- `traitgen-spin` (trait reroll)

Shared animations (`cardIn`, base `slideUp`) don't have prefixes.

### Button Styling

**Shared button classes:**
- `.btn-primary` — ink background, parchment text (chargen, loot, traitgen roll buttons)
- `.roll-btn` — alias for `.btn-primary`
- `.pull-btn` — alias for `.btn-primary`
- `.btn-roll` — coinflip gold gradient button (page-specific)
- `.btn-draw-trait` — traitgen gold gradient button (page-specific)

All buttons use `transition` for smooth hover effects. Disabled state uses `opacity: .35`.

### Theme Overrides

Each page's theme overrides are in a dedicated subsection at the end of `styles.css`:

```css
html[data-theme="dark"] .my-component { background: var(--card-bg); }
html[data-theme="nodice"] .my-component { background: #000; }
```

**Important:** Theme selectors have specificity `(0,1,1)`, which beats `:root` `(0,1,0)`. Light theme falls back to `:root` defaults.

### Dev-Only Styles

Mark development-only CSS with clear comments:
```css
/* DEV ONLY: Reset button for testing (commented out in production) */
.reset-btn { position: absolute; top: 50%; right: 12px; }
```

Dev styles are kept in the stylesheet for convenience during development but should not affect production.

### Responsive Design

- Uses `clamp()` for fluid scaling — no explicit breakpoints needed
- `max-width: 420px–520px` for tool cards
- `16px` side padding on mobile
- No `overflow: hidden` on `html/body` (preserves Android pull-to-refresh)

Example:
```css
.card { max-width: clamp(320px, 90vw, 480px); }
```

### ⚠️ CRITICAL: Page-Specific Body Selectors (Consolidated CSS Pattern)

**IMPORTANT**: All CSS is in a single `styles.css` file. This creates a potential pitfall: each tool page originally had its own `<style>` block with conflicting `body`, `html`, `header`, and `main` selectors. 

**The Solution**: Page-specific classes prevent these selectors from conflicting globally:

- Each HTML file has `<body class="<page>-page">` (e.g., `<body class="chargen-page">`)
- All page-specific body/html/element selectors are scoped to their class: `.chargen-page body { ... }`
- Only the relevant page's styles apply; other pages are unaffected

**When Adding CSS to a Tool Page:**
```css
/* ✓ CORRECT */
.chargen-page body { display: flex; height: 100dvh; }
.chargen-page header { padding: 10px 16px 6px; }

/* ✗ WRONG - will break other pages */
body { display: flex; }
header { padding: 10px 16px 6px; }
```

**When Adding a New Tool:**
1. Create HTML file with `<body class="mytool-page">`
2. Add CSS section in `styles.css` with page-specific selectors: `.mytool-page body { ... }`
3. Add page-class definition to the "PAGE-SPECIFIC BODY SELECTORS" section (around line 100 of styles.css)

See the **CRITICAL** notation at the top of the PAGE-SPECIFIC STYLES section in `styles.css` for full details.

### 🛑 Known Issues & Prevention (Historic)

**Shelf Alignment Issue (April 2026 - FIXED)**

During CSS consolidation, bare `body { }` and `html, body { }` selectors were accidentally left unscoped in page-specific sections. This caused the INDEX PAGE body styles to apply globally, breaking shelf alignment on all pages (shelves had variable widths and misaligned horizontally).

**What to watch for:**
```css
/* ✗ WRONG - These apply GLOBALLY, breaking other pages */
body { display: flex; }
html, body { height: 100%; }

/* ✓ CORRECT - These apply only to their page */
.chargen-page body { display: flex; }
.chargen-page html,
.chargen-page body { height: 100%; }
```

**Quick check for this issue:**
```bash
# Should return NOTHING:
grep "^  body\s*{" styles.css
grep "^  html\s*{" styles.css

# All results should include page-specific class:
grep "html, body" styles.css
```

If you find bare selectors:
1. Identify which page section they're in
2. Rename: `body {` → `.PAGE-page body {`
3. Test all pages to confirm alignment is fixed

The detailed explanation and prevention checklist are in the `🛑 HISTORIC BUG FIX` comment in `styles.css` around line 86.

---

## GitHub Pages Deployment

1. Push all files to a GitHub repo
2. Settings → Pages → source: `main` branch, root folder
3. Your URL: `https://yourusername.github.io/your-repo-name`
4. Point `qr.png` at that URL and display `qrcode.html` at the show

---

## Mulligan System -- TO BE REMOVED, ADMIN DRAWER CAN BE UTILIZED FOR RESETTING MULLIGAN STATUS

*The dice gods giveth three chances. After that, they want you to sit with your choices.*

Two implementations exist — same rules, different lock durations:

| Context | File | Lock after 0 mulligans |
|---------|------|------------------------|
| Character Generator | `chargen.html` | **1-hour countdown** → auto-reset to fresh free roll |
| Profile character sheet | `profile.html` | **24-hour lock** → fields go readonly until unlock time |

**Shared rules:**
- First roll on page load / first button press is always free
- Each reroll (individual field or full character) costs 1 mulligan
- Gold diamond pip dots show remaining mulligans; spent pips shrink and grey out

`chargen.html` state lives in `localStorage` (`nodice_chargen_session`). Profile character sheet lock state is stored in Firestore (`character.lockedAt` timestamp).

---

## Building Future Tools

*Copy, rename, update CONFIG, add CSS section, ship.*

1. Copy `chargen.html` (multi-field) or `loot.html` (single-item) as your base
2. Update `CONFIG.TABS` / `CONFIG.TAB`, `FIELDS`, and `FALLBACK`
3. Update `<title>`, `<h1>`, `.subtitle`
4. Add a shelf entry in `index.html`
5. **Add your page's CSS to `styles.css`:**
   - Create a new PAGE-SPECIFIC section in `styles.css` with your page name
   - Copy your page's inline styles into this section
   - Prefix any animations with your page name (e.g., `mypage-spin`)
   - Use CSS variables for all colors — no hardcoded hex values
6. Optionally override the gold tokens for a distinct per-tool colour (in `styles.css` root or page-specific section):

```css
/* Example: teal for a scenario generator */
.my-page-root {
  --gold:     #2d7a5e;
  --gold-dim: #1e5a44;
  --gold-bg:  #f0fff8;
}
```

**CSS Section Template:**
```css
/* ─────────────────────────────────────────
   MY NEW TOOL
   Brief description of the tool
   ───────────────────────────────────────── */

/* Page layout */
.my-tool-card { /* styles */ }

/* Theme overrides at end of styles.css */
html[data-theme="dark"] .my-tool-card { /* dark styles */ }
html[data-theme="nodice"] .my-tool-card { /* nodice styles */ }
```

---

## Show Night Checklist

TBD

---

## Resuming Work With Claude

> *I'm building an improv RPG tool suite on GitHub Pages called "No Dice." The Vault (`index.html`) is an accordion hub — each tool has an inline shelf and a standalone page.*
>
> **Tools:** Character Generator (`chargen.html`), Fate's Flip (`coinflip.html`), Loot Table (`loot.html`), Poll (`poll.html`, Firebase Realtime Database), Trait Generator (`traitgen.html`), QR Code (`qrcode.html`), Adventurer Profile (`profile.html`, Firebase Auth + Firestore).
>
> **Styling:**
> - Consolidated stylesheet: `styles.css` (ALL styles centralized)
> - Organized into: Shared Styles (Sections 1–13) + Page-Specific Styles (Sections 14–21) + Theme System
> - Three themes: Light, Dark (`html[data-theme="dark"]`), No Dice (`html[data-theme="nodice"]`)
> - All colors use CSS variables from `:root` — never hardcode hex values
> - Page-specific animations are prefixed: `chargen-spin`, `coinflip-wobble`, `coinflip-slideUp`, `traitgen-spin`
> - Shared typography: Cinzel (headings) + Lato (body); parchment palette
> - Dark/light toggle on every page via `localStorage` key `vaultTheme`
> - When adding CSS: use page-specific section in `styles.css` (no inline styles)
>
> **Shared Features:**
> - Auth module: `profile-auth.js` (Firebase Auth + Firestore, profile button on every page, badge system)
> - Data: chargen, loot, traitgen pull from Google Sheets (already wired)
> - traitgen auto-discovers Sheet tabs, excludes via `EXCLUDE_TABS`, shows full loot card for the Loot tab
> - poll.html uses Firebase Realtime Database; showrunner toggles admin mode via 3-second long-press on the 🧙 NPC Gen card (persists in sessionStorage key `nodice_vault_admin`)
> - chargen and traitgen share 3-mulligan / 1-hour lockout / localStorage
> - profile.html: auth (Google + email/password), attendance + badges, character sheet with Roll/Pin buttons, 3-mulligan pool, 24h save lock (Firestore)
> - Admin Showrunner Panel on profile.html (isAdmin: true in Firestore) — full poll admin UI
> - `← Vault` back button top-right on profile.html only
>
> *I'd like to [describe what you need].*

---

*Built with Claude · No Dice · Improv RPG · Your hometown, probably*
