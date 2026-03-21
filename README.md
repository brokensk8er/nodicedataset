# 🎲 No Dice — Improv D&D Tool Suite

A mobile-friendly web app for live improv Dungeons & Dragons shows. Players scan a QR code and instantly get tools to shape their session. Built as a static GitHub Pages site with Google Sheets as a live editable data backend.

---

## Project Status

| Tool                | Status         | File            |
|--------------------|----------------|-----------------|
| Hub / Vault         | ✅ Complete    | `index.html`    |
| Character Generator | ✅ Complete    | `chargen.html`  |
| Fate's Flip (coin)  | ✅ Complete    | `coinflip.html` |
| Scenario Generator  | 🔜 Planned     | `scenario.html` |
| NPC Generator       | 🔜 Planned     | `npc.html`      |
| Loot Table          | 🔜 Planned     | `loot.html`     |

---

## How It Works

Players scan a QR code at the show and land on the hub page, where they choose a tool. The character generator fetches the latest variable data from a Google Sheet and rolls a random character. Players get **3 mulligans** shared across all fields — they can spend them rerolling individual fields or the entire character, but once they're gone, the dice have spoken.

The coin flip tool gives a binary pass/fail result with a 3D animated coin, confetti on a pass, and Web Audio sound effects — no external dependencies.

If the Google Sheet is unreachable for any reason, the character generator falls back silently to built-in hardcoded data so players never see a broken screen.

---

## File Structure

```
/
├── index.html          — Hub / tool vault (links to all tools)
├── chargen.html        — Character generator (live)
├── coinflip.html       — Coin flip / pass-fail tool (live)
├── scenario.html       — Scenario generator (planned)
├── npc.html            — NPC generator (planned)
├── loot.html           — Loot table generator (planned)
├── design-system.css   — Visual design reference (not linked, docs only)
├── character-data.csv  — Starter data for Google Sheets import
└── README.md           — This file
```

---

## Tool Details

### Hub (`index.html`)
A 2-column card grid linking to all tools. Active tools are `<a>` tags; coming-soon tools are styled `<div>` cards with an amber badge. Add new tools here as they're built.

### Character Generator (`chargen.html`)
Generates a full character across six fields:

| Field             | Description                              |
|------------------|------------------------------------------|
| Name              | Ridiculous first + last name combo       |
| Race / Species    | D&D race with a comedic twist            |
| Class             | Standard class with a silly caveat       |
| Backstory         | One-line absurd origin story             |
| Personality Quirk | A behavioural trait to play into         |
| Secret / Flaw     | Something they'd rather you didn't know  |

Designed to fit entirely on one phone screen without scrolling — cards stretch to fill `100dvh` using flexbox. Pulls live data from Google Sheets with silent fallback to built-in data.

### Fate's Flip (`coinflip.html`)
A binary pass/fail coin flip tool. Features:
- 3D coin flip animation (CSS `scaleX` squish, face swap at edge)
- Confetti burst on a pass (5-cannon spread, Web Audio coin chime)
- Womp-womp sound on a fail
- Sassy flavour text on every result
- No external JS dependencies — all audio synthesised via Web Audio API

---

## Mulligan System (Character Generator)

- Players start with **3 mulligans** shared across all fields
- Each mulligan can be spent on any field reroll, or on "Roll New Character" (rerolls everything)
- The first roll on page load is always free
- Once all 3 are spent, all reroll buttons disable — fate is sealed
- The pip counter (gold dots) shows remaining mulligans at a glance

---

## Google Sheets Setup

### One-time setup

1. Create a new Google Sheet
2. Create 7 tabs along the bottom named **exactly**:
   - `First Names`
   - `Last Names`
   - `Races`
   - `Classes`
   - `Backstories`
   - `Quirks`
   - `Secrets`
3. Import `character-data.csv` to populate starter data (File → Import → Insert new sheet(s))
4. Set sharing to **Anyone with the link can view**

### Google Sheets API key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable the **Google Sheets API**
3. Credentials → Create → **API Key**
4. Restrict the key to: Google Sheets API only
5. Add your GitHub Pages URL as a website restriction (e.g. `https://yourusername.github.io/*`)

### Wire it up

Open `chargen.html` and fill in the `CONFIG` block near the top of the `<script>`:

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
--parchment: #faf7f2   /* page background */
--gold:      #c9a84c   /* accent — labels, pips, hover states */
--gold-dim:  #a07c2e   /* subdued gold — site labels, back links */
--card-bg:   #ffffff   /* field card background */
--border:    #e8e2d9   /* all borders */
--muted:     #6b6676   /* secondary text */
```

**Design principles**
- Mobile-first, `100dvh` layouts — no scrolling required
- Cards animate in with a staggered slide-up on each roll
- Die icon spins on reroll, field value fades out/in
- Source badge shows green (live sheet) or amber (fallback data)
- No external JS dependencies — vanilla HTML/CSS/JS only
- Parchment background with subtle noise texture and gold radial gradients

---

## Building Future Generators

Each new generator (scenario, NPC, loot) follows the same pattern:

1. Copy `chargen.html` as your starting point
2. Update `CONFIG.TABS` to point at the new sheet's tab names
3. Update `FIELDS` with the new category keys and labels
4. Update `FALLBACK` with starter data for the new generator
5. Change `<title>`, `<h1>`, and `.subtitle` text
6. Update `index.html`: change the tool card from `class="coming-soon"` to `class="active"` and wrap the `<div>` in an `<a href="yourtool.html">`
7. Optionally override `--gold` and `--gold-dim` for a different accent colour:

```css
/* Example: teal accent for a scenario generator */
:root {
  --gold:    #2d7a5e;
  --gold-dim: #1e5a44;
}
```

The mulligan system, Google Sheets wiring, source badge, animations, and fallback behaviour all carry over unchanged.

---

## Resuming Work With Claude

When starting a new Claude conversation to continue this project, paste this at the top:

> *I'm building an improv D&D random generator suite on GitHub Pages called "No Dice". It has a hub page (`index.html`), a character generator (`chargen.html`), and a coin flip tool (`coinflip.html`). It uses a Cinzel/Lato design system with a parchment colour palette, pulls variable data from Google Sheets (one tab per category), and has a 3-mulligan shared reroll system. I'd like to continue building [describe what you need].*

Then paste in the relevant file(s) for context.

---

## Show Night Checklist

- [ ] Google Sheet is up to date with any new variables
- [ ] GitHub Pages site is live and loading correctly
- [ ] QR code tested on at least one phone
- [ ] Fallback data is current (matches sheet content roughly)
- [ ] API key restrictions include the live GitHub Pages URL
- [ ] Test both tools on the actual show device before the night

---

*Built with Claude · No Dice · Improv D&D · Your hometown, probably*
