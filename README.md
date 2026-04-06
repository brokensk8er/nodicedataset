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

**Theme:** All pages share a dark/light mode toggle (☀️ / 🌙, top-left). The choice persists across pages via `localStorage` key `vaultTheme`. Planning on additional themes based on potential alternate show styles -- current visual focus is on instituting a pop-art white/black/green/red color.

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
├── styles.css          — Shared CSS: tokens, typography, buttons, dark mode
├── design-system.css   — Visual reference (not linked — docs only)
├── character-data.csv  — Starter data for Google Sheets import
├── FIREBASE_SETUP.md   — Firebase setup guide for poll.html and profile.html
├── icons/              — AI-generated loot item artwork (55 images, JPEG ≤450 KB)
└── README.md           — You are here
```

---

## Tool Details

### The Vault (`index.html`)
Accordion of collapsible shelves — one per tool. Each shelf expands inline so players never need to navigate away. A theme toggle (☀️ / 🌙 -- one additional mode to come utilizing 🛑) sits in the top-left corner and persists the choice across all pages.

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

A collapsible accordion drawer at the bottom of the profile page, **only visible when the signed-in user's Firestore doc has `isAdmin: true`**. The Firebase Realtime Database listener starts lazily on first open.

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

**Key rules:**
- `overflow: hidden` intentionally absent from `html/body` — preserves Android pull-to-refresh
- Source badge: green dot = live Sheet data · amber dot = fallback built-in data
- No external JS on any page except `poll.html` and `profile.html` (Firebase SDK via CDN ESM import)

---

## CSS Architecture

All shared styles live in `styles.css`. Each tool page has a small inline `<style>` block for page-specific layout only. `profile.html` carries a larger inline block due to its multi-section layout and the admin poll styles being scoped to that page.

| In `styles.css` | In page `<style>` |
|-----------------|-------------------|
| CSS variables + dark mode overrides | Body/page layout (height, flex direction) |
| Typography (`.site-label`, `header h1`, `.subtitle`, `.nav-link`) | Card structure (`.character-card`, `.loot-card`, etc.) |
| Buttons (`.btn-primary`, `.roll-btn`, `.pull-btn`) | Page-specific animations (coin flip, wobble) |
| Shared components (`.source-badge`, `.mulligan-bar`, `.card-footer`, `.lock-notice`) | Unique button variants (coinflip's gold `.btn-roll`) |
| `.page-frame` layout container | Per-page `max-height` overrides |
| Animations (`cardIn`, `spin`, `slideUp`) | `profile.html`: auth forms, character sheet controls, admin drawer, poll admin styles |
| Theme toggle button (`.theme-toggle-btn`) | |
| Profile button (`.profile-btn`, `.profile-btn--signed-in`) | |

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

TBD

---

## Resuming Work With Claude

> *I'm building an improv RPG tool suite on GitHub Pages called "No Dice." The Vault (`index.html`) is an accordion hub — each tool has an inline shelf and a standalone page. Tools: Character Generator (`chargen.html`), Fate's Flip (`coinflip.html`), Loot Table (`loot.html`), Poll (`poll.html`, Firebase Realtime Database), Trait Generator (`traitgen.html`), QR Code (`qrcode.html`), Adventurer Profile (`profile.html`, Firebase Auth + Firestore). Shared stylesheet: `styles.css` (tokens, typography, buttons, dark mode, animations, profile button). Shared auth module: `profile-auth.js` (Firebase Auth + Firestore, profile button on every page, badge system). Cinzel/Lato, parchment palette. chargen, loot, traitgen pull from Google Sheets (already wired). traitgen auto-discovers Sheet tabs, excludes via `EXCLUDE_TABS`, shows full loot card for the Loot tab. poll.html uses Firebase Realtime Database (already wired); showrunner toggles admin mode via 3-second long-press on the 🧙 NPC Gen card (persists in sessionStorage key `nodice_vault_admin`). chargen and traitgen share 3-mulligan / 1-hour lockout / localStorage. profile.html has: auth (Google + email/password), attendance + badges, ticket verification, character sheet with per-field Roll/Pin buttons + Fully Randomize + 3-mulligan pool + 24h save lock (Firestore). Admin Showrunner Panel on profile.html (isAdmin: true in Firestore) — full poll admin UI connected to same Realtime Database. `← Vault` back button top-right on profile.html only. Dark/light toggle on every page via `localStorage` key `vaultTheme`. I'd like to [describe what you need].*

---

*Built with Claude · No Dice · Improv RPG · Your hometown, probably*
