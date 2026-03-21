# 🎲 No Dice — Improv D&D Tool Suite

A mobile-friendly web app for live improv Dungeons & Dragons shows. Players scan a QR code and instantly get tools to shape their session. Built as a static GitHub Pages site with Google Sheets as a live editable data backend.

---

## Project Status

| Tool                | Status         | File            |
|--------------------|----------------|-----------------|
| Hub / Vault         | ✅ Complete    | `index.html`    |
| Character Generator | ✅ Complete    | `chargen.html`  |
| Fate's Flip (coin)  | ✅ Complete    | `coinflip.html` |
| Loot Table          | ✅ Complete    | `loot.html`     |
| Scenario Generator  | 🔜 Planned     | `scenario.html` |
| NPC Generator       | 🔜 Planned     | `npc.html`      |

---

## How It Works

Players scan a QR code at the show and land on the hub page, where they choose a tool. The character generator fetches the latest variable data from a Google Sheet and rolls a random character. Players get **3 mulligans** shared across all fields — they can spend them rerolling individual fields or the entire character, but once they're gone, the dice have spoken. After all mulligans are spent, a **1-hour lockout** begins; the page shows a live countdown and auto-resets when the timer expires.

The loot table pulls item names and flavour text from a dedicated Google Sheet tab and uses a shuffle-bag algorithm so no item repeats until the full list has been seen.

The coin flip tool gives a binary pass/fail result with a 3D animated coin, confetti on a pass, and Web Audio sound effects — no external dependencies.

If the Google Sheet is unreachable for any reason, all tools fall back silently to built-in hardcoded data so players never see a broken screen.

---

## File Structure

```
/
├── index.html          — Hub / tool vault (links to all tools)
├── chargen.html        — Character generator
├── coinflip.html       — Coin flip / pass-fail tool
├── loot.html           — Loot table generator
├── scenario.html       — Scenario generator (planned)
├── npc.html            — NPC generator (planned)
├── design-system.css   — Visual design reference (not linked, docs only)
├── character-data.csv  — Starter data for Google Sheets import
└── README.md           — This file
```

---

## Tool Details

### Hub (`index.html`)
A 2-column card grid linking to all tools. Active tools are `<a>` tags; coming-soon tools are styled `<div>` cards with an amber badge. Add new tools here as they're built.

### Character Generator (`chargen.html`)
Generates a full character across six fields, all displayed inside a single white content card. Fields are separated by hairline gold dividers; every other row has a faint gold tint for at-a-glance readability.

| Field             | Description                              |
|------------------|------------------------------------------|
| Name              | Ridiculous first + last name combo       |
| Race / Species    | D&D race with a comedic twist            |
| Class             | Standard class with a silly caveat       |
| Backstory         | One-line absurd origin story             |
| Personality Quirk | A behavioural trait to play into         |
| Secret / Flaw     | Something they'd rather you didn't know  |

Fits on one phone screen without scrolling. Pulls live data from Google Sheets with silent fallback to built-in data. Session state (current character, mulligans remaining, lockout timer) is persisted in `localStorage` so a page refresh restores the player's session.

### Fate's Flip (`coinflip.html`)
A binary pass/fail coin flip tool. Features:
- 3D coin flip animation (CSS `scaleX` squish, face swap at the edge — zero gap between spin end and face reveal)
- Custom pass/fail coin face artwork embedded as base64 PNGs (no external image requests)
- Confetti burst on a pass (5-cannon spread, Web Audio coin chime)
- Womp-womp trombone sound on a fail
- Sassy flavour text on every result (16 pass lines, 16 fail lines)
- No external JS dependencies — all audio synthesised via Web Audio API

### Loot Table (`loot.html`)
Pulls magic item names and flavour text from a `Loot` tab in the Google Sheet (Column A: name, Column B: flavour text). Features:
- Shuffle-bag pick system — no item repeats until the full list has been seen
- Animated fade swap on each pull
- Source badge shows live/fallback status; if the sheet is unreachable the full API error is shown in the badge for debugging
- All content (button, source badge) lives inside a single white content card, consistent with chargen

---

## Mulligan System (Character Generator)

- Players start with **3 mulligans** shared across all fields
- Each mulligan can be spent rerolling any individual field, or on "Roll New Character" (costs 1 mulligan, rerolls everything)
- The very first roll on page load is always free (doesn't cost a mulligan)
- Once all 3 are spent, a **1-hour lockout** begins — all reroll buttons disable and a countdown timer is shown inside the card
- When the countdown expires the page auto-resets to a fresh free roll
- A dev **Reset** button appears in the header during the lockout period (small, red-bordered) for testing — remove or hide this before a live show if preferred
- The pip counter (gold dots, top of page) shows remaining mulligans at a glance; spent pips shrink and go grey
- Full session state is saved to `localStorage` on every change — **pull-to-refresh on Android safely restores the existing session** rather than starting fresh

---

## Layout & Navigation Standards

All tool pages follow the same structural pattern:

```
<header>   — site label, page title, subtitle (compact, border-bottom)
<main>     — tool content (flex: 1, fills remaining viewport height)
<footer>   — "← Back to the Vault" nav link only (outside the white card)
```

The "Back to the Vault" footer nav uses `color: var(--gold-dim)`, `font-family: Cinzel`, `font-size: .65rem`, `letter-spacing: .18em`. It sits below the white content card with `padding-bottom: 1.5rem`.

White content cards use `border-radius: 16–18px`, `box-shadow: 0 4–6px 24–32px var(--shadow)`, and a `.card-footer` strip at the bottom (border-top, faint gold tint) that holds the primary action button and source badge.

---

## Google Sheets Setup

### One-time setup

1. Create a new Google Sheet
2. Create tabs named **exactly** as listed below (case-sensitive):

**For chargen.html:**
- `First Names`
- `Last Names`
- `Races`
- `Classes`
- `Backstories`
- `Quirks`
- `Secrets`

**For loot.html:**
- `Loot` — Column A: item name, Column B: flavour text description

3. Import `character-data.csv` to populate starter chargen data (File → Import → Insert new sheet(s))
4. Set sharing to **Anyone with the link can view**

### Google Sheets API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable the **Google Sheets API**
3. Credentials → Create → **API Key**
4. Restrict the key to: Google Sheets API only
5. Add your GitHub Pages URL as a website restriction (e.g. `https://yourusername.github.io/*`)

### Wire it up

Every tool that reads from Google Sheets has a `CONFIG` block near the top of its `<script>`. Fill in the same Sheet ID and API key in each file:

```js
const CONFIG = {
  SHEET_ID: 'paste-your-sheet-id-here',
  API_KEY:  'paste-your-api-key-here',
  ...
}
```

The Sheet ID is the long string in your Google Sheet URL between `/d/` and `/edit`.

### Editing variables

Just open the Google Sheet and edit any tab. Add rows, delete rows, change wording — changes are live immediately. No code edits required.

---

## GitHub Pages Deployment

1. Push all files to a GitHub repo (e.g. `improv-dnd`)
2. Go to Settings → Pages
3. Set source to `main` branch, root folder
4. Your URL will be `https://yourusername.github.io/improv-dnd`
5. Generate a QR code pointing at that URL and display it at the show

---

## Design System

Full reference lives in `design-system.css`. Summary:

**Fonts**
- `Cinzel 400/600/700` — headings, field labels, buttons, nav links (D&D serif flavour)
- `Lato 300/400` — body text and generated values (clean, phone-readable)

**Colour tokens**
```css
--ink:       #1a1a2e   /* text, dark buttons */
--ink-hover: #2e2e4a   /* button hover */
--parchment: #faf7f2   /* page background */
--gold:      #c9a84c   /* accent — labels, pips, hover states */
--gold-dim:  #a07c2e   /* subdued gold — site labels, back links */
--gold-bg:   #fffdf5   /* tinted surface on hover */
--card-bg:   #ffffff   /* white content card background */
--border:    #e8e2d9   /* all borders and dividers */
--muted:     #6b6676   /* secondary text */
--shadow:    rgba(26,26,46,.10–.12)  /* card drop shadows */
```

**Design principles**
- Mobile-first, `100dvh` layouts — designed to fit one phone screen without scrolling
- `overflow: hidden` is intentionally **not** set on `html/body` — this preserves Android pull-to-refresh
- All tool content lives inside a single white rounded card; buttons and source badge sit in a `.card-footer` strip at the bottom of the card
- Cards animate in on load (`slideUp`, cubic-bezier easing)
- Parchment background with fractal noise texture overlay and gold radial gradients
- Source badge: green dot = live Google Sheets data, amber dot = fallback built-in data
- No external JS dependencies on any page — vanilla HTML/CSS/JS only

---

## Building Future Generators

Each new generator (scenario, NPC) follows the same pattern:

1. Copy `chargen.html` (multi-field) or `loot.html` (single-item display) as your starting point depending on the UI shape needed
2. Update `CONFIG.TABS` (or `CONFIG.TAB`) to point at the new sheet tab names
3. Update `FIELDS` / `FALLBACK` with the new categories and starter data
4. Change `<title>`, `<h1>`, and `.subtitle` text
5. Update `index.html`: change the tool card from `class="coming-soon"` to `class="active"` and wrap the `<div>` in an `<a href="yourtool.html">`
6. Optionally override `--gold` and `--gold-dim` in a `:root` block for a different accent colour per tool:

```css
/* Example: teal accent for a scenario generator */
:root {
  --gold:    #2d7a5e;
  --gold-dim: #1e5a44;
  --gold-bg: #f0fff8;
}
```

The Google Sheets wiring, source badge, card layout, footer nav, and fallback behaviour all carry over unchanged.

---

## Resuming Work With Claude

When starting a new Claude conversation to continue this project, paste this at the top:

> *I'm building an improv D&D random generator suite on GitHub Pages called "No Dice". Current tools: hub (`index.html`), character generator (`chargen.html`), coin flip (`coinflip.html`), loot table (`loot.html`). Uses Cinzel/Lato design system with a parchment colour palette. Data is pulled live from Google Sheets (Sheet ID and API key are already wired in). chargen has a 3-mulligan shared reroll system with 1-hour lockout and localStorage session persistence. All content lives in single white cards with a `.card-footer` strip. `overflow: hidden` is intentionally absent to preserve Android pull-to-refresh. I'd like to continue building [describe what you need].*

Then paste in the relevant file(s) for context.

---

## Show Night Checklist

- [ ] Google Sheet is up to date with any new or edited variables
- [ ] Loot tab has both columns filled (Column A: name, Column B: flavour text)
- [ ] GitHub Pages site is live and loading correctly
- [ ] QR code tested on at least one phone
- [ ] Fallback data is reasonably current (matches sheet content roughly)
- [ ] API key restrictions include the live GitHub Pages URL
- [ ] Test all active tools on the actual show device before the night
- [ ] Consider hiding or removing the dev Reset button in chargen if players shouldn't see it

---

*Built with Claude · No Dice · Improv D&D · Your hometown, probably*
