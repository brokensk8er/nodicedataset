# NO DICE — THE TOOLSET
### Improv D&D · Static GitHub Pages · Mobile-First

*A suite of tools for live improv D&D shows. Players scan a QR code. Fate does the rest. No actual dice required or permitted.*

---

## The Vault — Current Status

| Tool | Status | File |
|------|--------|------|
| Hub / Vault | ✅ Complete | `index.html` |
| Hub v2 (inline chargen) | ✅ Complete | `index2.html` |
| Character Generator | ✅ Complete | `chargen.html` |
| Fate's Flip (coin) | ✅ Complete | `coinflip.html` |
| Loot Table | ✅ Complete | `loot.html` |
| The Poll | ✅ Complete | `poll.html` |
| Trait Generator | ✅ Complete | `traitgen.html` |
| Scenario Generator | 🔜 Planned | `scenario.html` |
| NPC Generator | 🔜 Planned | `npc.html` |

---

## How It Works

Players scan a QR code at the show and land on the hub. Each tool is a self-contained page backed by the same Google Sheet. Data loads live on each visit; if the Sheet is unreachable, every tool falls back silently to hardcoded data so nobody sees a broken screen mid-session.

The **Character Generator** fetches six field pools from Google Sheets and rolls a complete absurd adventurer. Players get **3 shared mulligans** — spend them on individual rerolls or the whole character. Once spent, a **1-hour lockout** begins with a live countdown. Session state persists in `localStorage` so a refresh restores the existing character rather than burning a mulligan.

The **Loot Table** pulls item names and flavour text from a `Loot` sheet tab (Col A: name, Col B: text, Col C: image data URI). A shuffle-bag algorithm ensures no item repeats until the full list has been seen.

The **Trait Generator** discovers every tab in the linked Sheet automatically, then draws one random entry from Column A of any eligible tab. Rolling a Loot entry triggers the full item card — name, flavour text, and SVG artwork. Two config arrays in the script control which tabs are included: `EXCLUDE_TABS` (skip these entirely) and `LOOT_TAB` (fetch this one with the full A:C treatment). Adding a new trait category is as simple as adding a new tab to the Sheet — no code changes needed.

The **Coin Flip** is fully self-contained — no Sheet dependency, no external JS. CSS `scaleX` animation, face-swap at zero width, Web Audio sound effects, confetti on a pass.

The **Poll** uses Firebase Realtime Database for live vote sync across all devices. The showrunner opens `poll.html?admin` to build and control polls; the audience votes at `poll.html`. Results stay hidden until the showrunner reveals them. Supports 2–5 options per poll. Votes are anonymous, tied to a `sessionStorage` UUID that clears when the tab closes.

---

## File Structure

```
/
├── index.html          — Hub (links to all tools)
├── index2.html         — Hub v2 with inline character generator drawer
├── chargen.html        — Character generator
├── coinflip.html       — Coin flip / pass-fail
├── loot.html           — Loot table
├── poll.html           — Audience poll (Firebase)
├── traitgen.html       — Single trait generator
├── scenario.html       — Scenario generator (planned)
├── npc.html            — NPC generator (planned)
├── styles.css          — Shared CSS (colours, fonts, buttons, badges, animations)
├── design-system.css   — Visual reference (not linked, docs only)
├── character-data.csv  — Starter data for Google Sheets import
├── FIREBASE_SETUP.md   — Firebase setup guide for poll.html
└── README.md           — You are here
```

---

## Tool Details

### Hub (`index.html`)
Two-column card grid. Active tools are `<a>` tags; coming-soon tools are styled `<div>` cards with an amber badge.

### Hub v2 (`index2.html`)
Extends `index.html` with an inline character generator drawer — no page navigation needed. Uses `styles.css` for shared styling. The drawer has two modes toggled by a segmented control:

- **Full Character** — rolls all six fields in a single card (same mulligan system as `chargen.html`)
- **Quick Pull** — category buttons (Name, Race, Class, etc.) for rolling a single field on demand; animated fade swap on each pull

### Character Generator (`chargen.html`)
Six fields in a single scrollable white card: Name, Race/Species, Class, Backstory, Personality Quirk, Secret/Flaw. Name is assembled from separate `First Names` and `Last Names` pools. Every other row has a faint gold tint for scan-ability. 3 shared mulligans → 1-hour lockout → countdown → auto-reset.

### Fate's Flip (`coinflip.html`)
Binary pass/fail. Custom coin face artwork embedded as base64 PNGs. Confetti + Web Audio coin chime on pass, womp-womp trombone on fail. 16 flavour lines per outcome. Zero external dependencies.

### Loot Table (`loot.html`)
Single white card. Sheet tab: `Loot` — Col A: name, Col B: flavour, Col C: image data URI. Shuffle-bag ensures full list coverage before any repeat. Animated fade swap on each pull.

### The Poll (`poll.html`)
Requires a free Firebase project — see `FIREBASE_SETUP.md`.

| URL | Who | What |
|-----|-----|------|
| `poll.html` | Audience | Vote → waiting screen → results |
| `poll.html?admin` | Showrunner | Build poll → watch live vote counts → reveal |

2–5 options per poll. Results hidden until the showrunner taps reveal. Audience screens auto-return to standby when a poll is cleared.

### Trait Generator (`traitgen.html`)
Draws one random entry from Column A of any eligible Sheet tab — the full pool in a single roll. Adding a new trait category means adding a new Sheet tab and nothing else.

**Tab control lives in two CONFIG constants:**
```js
EXCLUDE_TABS: ['First Names', 'Last Names'],  // skip these entirely
LOOT_TAB: 'Loot',                             // fetch A:C, show full item card
```

When the rolled entry comes from the Loot tab, the display upgrades to the full loot card layout: image slot (SVG artwork or placeholder), item name, gold divider, flavour text, source tag. All other tabs show the standard large centred trait text. The card is scrollable so long flavour text doesn't overflow; scroll position resets to top on each roll. Same 3-mulligan / 1-hour lockout system as the Character Generator, stored separately under `nodice_traitgen_session`.

### Scenario Generator (`scenario.html`) — Planned
Drop-in quest hooks, locations, and inciting incidents. Multi-field card pattern matching `chargen.html`. Planned accent colour override: teal (`--gold: #2d7a5e`).

### NPC Generator (`npc.html`) — Planned
Instant strangers with names, motivations, and inconvenient timing. Likely to share Name pools with `chargen.html` and add NPC-specific fields.

---

## Mulligan System

*The dice gods giveth three chances. After that, they want you to sit with your choices.*

- First roll on page load is always free
- Each subsequent reroll (individual field or full character) costs 1 mulligan
- 0 mulligans → 1-hour lockout → countdown timer → auto-reset to fresh free roll
- Gold pip dots in the header show remaining mulligans at a glance; spent pips shrink and grey out
- Full session state saved to `localStorage` on every change — pull-to-refresh on Android restores the existing session

---

## Page Structure

Every tool follows the same pattern:

```
<header>   — site label · h1 · subtitle · border-bottom
<main>     — white rounded card (flex: 1, fills viewport)
<footer>   — "← Back to the Vault" nav link only
```

White cards: `border-radius: 16–18px`, `box-shadow: 0 4–6px 24–32px var(--shadow)`. Card footer strip holds the primary CTA button and source badge.

---

## Google Sheets Setup

### Tabs required

**For `chargen.html`:** `First Names` · `Last Names` · `Races` · `Classes` · `Backstories` · `Quirks` · `Secrets`

**For `loot.html` and `traitgen.html`:** `Loot` — Col A: item name, Col B: flavour text, Col C: image data URI

Any additional tabs added to the Sheet will be auto-discovered by `traitgen.html` unless listed in `EXCLUDE_TABS`.

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

## Firebase Setup (Poll Tool)

See **`FIREBASE_SETUP.md`** for the full walkthrough. Short version:
1. Free project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Realtime Database in test mode
3. Register a web app, copy the config object
4. Paste values into the `FIREBASE_CONFIG` block in `poll.html`

Free Spark plan is sufficient: 100 simultaneous connections, 1 GB storage, no billing.

---

## Design System

*Parchment and gold. Cinzel for anything that needs gravitas. Lato for anything that needs to be readable on a phone at arm's length in a dark theatre.*

**Fonts:** Cinzel 400/600/700 (headings, labels, buttons) · Lato 300/400 (body, values)

**Colour tokens:**
```css
--ink:       #1a1a2e   /* text, dark buttons */
--parchment: #faf7f2   /* page background */
--gold:      #c9a84c   /* accent — labels, pips, hover */
--gold-dim:  #a07c2e   /* subdued gold — site labels, back links */
--gold-bg:   #fffdf5   /* tinted hover surface */
--card-bg:   #ffffff   /* white card */
--border:    #e8e2d9   /* all borders and dividers */
--muted:     #6b6676   /* secondary text */
--shadow:    rgba(26,26,46,.10–.12)
```

**Key rules:**
- `overflow: hidden` is **intentionally absent** from `html/body` — preserves Android pull-to-refresh
- Source badge: green dot = live Sheet data · amber dot = fallback built-in data
- No external JS dependencies on any page except `poll.html` (Firebase SDK via CDN ESM import)
- All layouts use `clamp()` for type scaling; no explicit breakpoints needed

---

## GitHub Pages Deployment

1. Push all files to a GitHub repo
2. Settings → Pages → source: `main` branch, root folder
3. Your URL: `https://yourusername.github.io/your-repo-name`
4. Generate a QR code pointing there and display it at the show

---

## Building Future Tools

*Copy, rename, update CONFIG, ship. The scaffold is already laid.*

1. Copy `chargen.html` (multi-field) or `loot.html` (single-item) as your base
2. Update `CONFIG.TABS` / `CONFIG.TAB`, `FIELDS`, and `FALLBACK`
3. Update `<title>`, `<h1>`, `.subtitle`
4. Promote the card in `index.html` from `coming-soon div` to `active anchor`
5. Optionally override the gold tokens for a distinct visual flavour per tool:

```css
/* Example: teal for a scenario generator */
:root {
  --gold:     #2d7a5e;
  --gold-dim: #1e5a44;
  --gold-bg:  #f0fff8;
}
```

---

## Resuming Work With Claude

Paste this at the top of a new conversation:

> *I'm building an improv D&D tool suite on GitHub Pages called "No Dice." Live tools: hub (`index.html`), hub v2 with inline chargen drawer (`index2.html`), character generator (`chargen.html`), coin flip (`coinflip.html`), loot table (`loot.html`), audience poll (`poll.html`), trait generator (`traitgen.html`). Shared stylesheet: `styles.css`. Cinzel/Lato design system, parchment palette. chargen, loot, and traitgen pull from Google Sheets (already wired). traitgen auto-discovers all Sheet tabs, excludes via `EXCLUDE_TABS`, and shows a full loot card when a Loot tab entry is rolled. poll.html uses Firebase Realtime Database (already wired); showrunner via `?admin`. chargen and traitgen share the same 3-mulligan / 1-hour lockout / localStorage pattern. index2.html has an inline chargen drawer with Full Character and Quick Pull modes. overflow:hidden intentionally absent from html/body. I'd like to continue building [describe what you need].*

Then paste in the relevant file(s).

---

## Show Night Checklist

- [ ] Google Sheet is current; Loot tab has all three columns filled
- [ ] GitHub Pages live and loading on a real phone
- [ ] QR code tested on at least one device
- [ ] Firebase rules not expired (test mode expires 30 days after setup — check the Rules tab)
- [ ] Poll tested: dummy poll created, audience screen updates, poll cleared
- [ ] Showrunner has `poll.html?admin` bookmarked on their device
- [ ] Dev Reset button in `chargen.html` / `index2.html` auto-hides until all 3 mulligans are spent — no manual hiding needed; verify it's not visible before mulligans run out
- [ ] API key restrictions include the live GitHub Pages URL
- [ ] All active tools tested on the actual show device

---

*Built with Claude · No Dice · Improv D&D · Your hometown, probably*
