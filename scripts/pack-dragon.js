#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// pack-dragon.js
//
// Packs the Cethiel "Dragon - Fully Animated" (CC0) PNG frame sequences
// into two Phaser atlas files ready for boss.html.
//
// Usage:
//   npm install free-tex-packer-core extract-zip
//   node scripts/pack-dragon.js <path-to-downloaded-zip>
//
// Expects the ZIP to contain either:
//   small/Attack 1/0001.png ... or  Attack 1/0001.png ...
//
// Outputs (into assets/dragon/):
//   dragon-main.png    + dragon-main.json    (Idle, Idle Battle)
//   dragon-actions.png + dragon-actions.json (Attack 1, Attack 2, Hurt, Death, Roar)
//
// After running, set sprite.hasSprite = true in boss-types/dragon.js.
// ─────────────────────────────────────────────────────────────────────────────

const fs          = require('fs');
const path        = require('path');
const os          = require('os');
const { execSync} = require('child_process');

let ftp, extractZip;
try {
  ftp       = require('free-tex-packer-core');
  extractZip = require('extract-zip');
} catch {
  console.error('Missing dependencies. Run: npm install free-tex-packer-core extract-zip');
  process.exit(1);
}

const zipPath  = process.argv[2];
if (!zipPath) {
  console.error('Usage: node scripts/pack-dragon.js <path-to-zip>');
  process.exit(1);
}

const outDir   = path.resolve(__dirname, '../assets/dragon');
const tmpDir   = path.join(os.tmpdir(), 'dragon-unpack-' + Date.now());
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmpDir, { recursive: true });

// Animation folder name → internal animId (prefix for frame names)
const ANIM_MAP = {
  'Idle':         'idle',
  'Idle Battle':  'idlebattle',
  'Attack 1':     'attack1',
  'Attack 2':     'attack2',
  'Hurt':         'hurt',
  'Death':        'death',
  'Roar':         'roar',
  'Walking':      'walking',
  'Intimidation': 'intimidation',
  'Sleeping':     'sleeping',
  'Waking Up':    'wakingup',
};

// Which animations go into which atlas
const ATLAS_GROUPS = {
  main:    ['idle', 'idlebattle'],
  actions: ['attack1', 'attack2', 'hurt', 'death', 'roar'],
};

async function run() {
  console.log('Extracting ZIP…');
  await extractZip(path.resolve(zipPath), { dir: tmpDir });

  // Find the root of the animation folders (may be under small/ or original/)
  const useSmall = fs.existsSync(path.join(tmpDir, 'small'));
  const animRoot = useSmall
    ? path.join(tmpDir, 'small')
    : tmpDir;

  // Collect all frames grouped by animId
  const framesByAnim = {};
  for (const [folderName, animId] of Object.entries(ANIM_MAP)) {
    const folderPath = path.join(animRoot, folderName);
    if (!fs.existsSync(folderPath)) {
      console.warn(`  Skipping missing folder: ${folderName}`);
      continue;
    }
    const files = fs.readdirSync(folderPath)
      .filter(f => /\.(png|jpg)$/i.test(f))
      .sort();
    framesByAnim[animId] = files.map(f => ({
      path: path.join(folderPath, f),
      name: f,
    }));
    console.log(`  Found ${files.length} frames for "${folderName}" → "${animId}"`);
  }

  // Pack each atlas group
  for (const [atlasName, animIds] of Object.entries(ATLAS_GROUPS)) {
    console.log(`\nPacking atlas: dragon-${atlasName}`);
    const images = [];
    for (const animId of animIds) {
      const frames = framesByAnim[animId] || [];
      frames.forEach((frame, i) => {
        const buf = fs.readFileSync(frame.path);
        // Frame name: animId_0000, animId_0001, ...
        images.push({ path: `${animId}_${String(i).padStart(4, '0')}`, contents: buf });
      });
    }

    if (!images.length) {
      console.warn(`  No frames found for atlas ${atlasName}, skipping.`);
      continue;
    }

    await new Promise((resolve, reject) => {
      ftp(images, {
        textureName:      `dragon-${atlasName}`,
        width:            4096,
        height:           4096,
        fixedSize:        false,
        padding:          2,
        allowRotation:    false,
        detectIdentical:  true,
        allowTrim:        true,
        exporter:         'Phaser3',
        removeFileExtension: true,
        prependFolderName:   false,
      }, (files, error) => {
        if (error) { reject(error); return; }
        files.forEach(f => {
          const outPath = path.join(outDir, f.name);
          fs.writeFileSync(outPath, f.buffer);
          console.log(`  Wrote ${outPath}`);
        });
        resolve();
      });
    });
  }

  // Clean up tmp
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\nDone! Now set sprite.hasSprite = true in boss-types/dragon.js');
}

run().catch(err => { console.error(err); process.exit(1); });
