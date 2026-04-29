// ─────────────────────────────────────────────────────────────────────────────
// Dragon Boss — "The Ancient Dragon"
//
// Each boss type exports an object with this exact shape so boss.html can
// drive any boss generically. To add a new boss (troll, Trogdor, etc.),
// duplicate this file, change the fields, and import it in boss.html.
// ─────────────────────────────────────────────────────────────────────────────

export const DragonBoss = {
  id:   'dragon',
  name: 'The Ancient Dragon',

  // ── Sprite configuration ────────────────────────────────────────────────
  // Set hasSprite: true after running: node scripts/pack-dragon.js <path-to-zip>
  // The script produces assets/dragon/dragon-main.{png,json} and
  // assets/dragon/dragon-actions.{png,json} in Phaser atlas format.
  sprite: {
    hasSprite: false,

    atlases: {
      main:    { image: 'assets/dragon/dragon-main.png',    data: 'assets/dragon/dragon-main.json'    },
      actions: { image: 'assets/dragon/dragon-actions.png', data: 'assets/dragon/dragon-actions.json' },
    },

    // Frame prefix must match what pack-dragon.js outputs (animId + '_' + zeroPad4).
    // frameCount is the number of frames (0-indexed end = frameCount - 1).
    animations: {
      idle:       { atlas: 'main',    prefix: 'idle_',       frameCount: 60,  fps: 24, repeat: -1 },
      idleBattle: { atlas: 'main',    prefix: 'idlebattle_', frameCount: 60,  fps: 24, repeat: -1 },
      attack1:    { atlas: 'actions', prefix: 'attack1_',    frameCount: 80,  fps: 24, repeat: 0, returnTo: 'idleBattle' },
      attack2:    { atlas: 'actions', prefix: 'attack2_',    frameCount: 80,  fps: 24, repeat: 0, returnTo: 'idleBattle' },
      hurt:       { atlas: 'actions', prefix: 'hurt_',       frameCount: 50,  fps: 24, repeat: 0, returnTo: 'idleBattle' },
      death:      { atlas: 'actions', prefix: 'death_',      frameCount: 100, fps: 24, repeat: 0 },
      roar:       { atlas: 'actions', prefix: 'roar_',       frameCount: 80,  fps: 24, repeat: 0, returnTo: 'idleBattle' },
    },

    defaultAnim: 'idle',       // used before any players join
    battleAnim:  'idleBattle', // used once encounter is active

    fallbackEmoji: '🐉',
    fallbackSize:  '200px',
  },

  // ── Abilities ────────────────────────────────────────────────────────────
  // Each ability fires on a random timer. buildEvent() returns the Firebase
  // payload (or null to skip this trigger). The boss engine writes it to
  // nodice/encounters/{id}/bossEvent and bossbattle.html reacts to it.
  abilities: [
    {
      id:          'strike',
      name:        'Dragon Strike',
      animation:   'attack1',
      intervalMin: 20_000,   // ms — earliest next trigger after previous fires
      intervalMax: 45_000,

      // Pick a random active player and put them on 10-second cooldown.
      buildEvent(encounter) {
        const players = Object.entries(encounter.activePlayers || {});
        if (!players.length) return null;
        const [targetId, targetData] = players[Math.floor(Math.random() * players.length)];
        return {
          type:         'strike',
          id:           `strike-${Date.now()}`,
          target:       targetId,
          targetName:   targetData.displayName || 'An adventurer',
          cooldownMs:   10_000,
          cooldownUntil: Date.now() + 10_000,
          timestamp:    Date.now(),
        };
      },

      displayMessage: (ev) => `⚔️ ${ev.targetName} was struck a mighty blow by the dragon!`,
    },

    {
      id:          'fireBath',
      name:        'Fire Bath',
      animation:   'attack2',
      intervalMin: 55_000,
      intervalMax: 100_000,

      // All players scorched — 5-second cooldown, smashable at 0.2s per press.
      buildEvent() {
        return {
          type:            'fireBath',
          id:              `fireBath-${Date.now()}`,
          cooldownMs:      5_000,
          cooldownUntil:   Date.now() + 5_000,
          smashReductionMs: 200,
          timestamp:       Date.now(),
        };
      },

      displayMessage: () => `🔥 The dragon breathes fire! All adventurers are scorched!`,
    },
  ],
};
