/**
 * validateAttack.js
 *
 * Cloud Function to validate coin flip results and apply dragon damage.
 * Prevents client-side cheating by running authoritative game logic.
 *
 * Triggered by: bossbattle.html writing to /encounters/{id}/recentAttacks
 *
 * DEPLOYMENT:
 * cd functions/
 * firebase deploy --only functions:validateAttack
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.database();

/**
 * onAttackCreated
 * Listens to new attacks written to /encounters/{id}/recentAttacks/{attackId}
 * Validates the roll, applies damage if valid, manages cooldowns
 */
exports.validateAttack = functions.database
  .ref('/encounters/{encounterId}/recentAttacks/{attackId}')
  .onCreate(async (snapshot, context) => {
    const { encounterId, attackId } = context.params;
    const attack = snapshot.val();
    const { userId, rollResult, timestamp } = attack;

    try {
      // 1. Fetch encounter state
      const encounterRef = db.ref(`encounters/${encounterId}`);
      const encounterSnap = await encounterRef.once('value');
      const encounter = encounterSnap.val();

      if (!encounter) {
        console.error(`Encounter ${encounterId} not found`);
        return;
      }

      // 2. Fetch player cooldown state
      const playerRef = db.ref(`encounters/${encounterId}/activePlayers/${userId}`);
      const playerSnap = await playerRef.once('value');
      const player = playerSnap.val();

      if (!player) {
        console.error(`Player ${userId} not registered in encounter`);
        return;
      }

      // 3. Check if player is on cooldown (prevent spam)
      const now = Date.now();
      if (player.onCooldown && now < player.cooldownUntil) {
        console.log(`Player ${userId} is on cooldown. Ignoring attack.`);
        // Delete invalid attack
        await snapshot.ref.remove();
        return;
      }

      // 4. Validate rollResult
      if (!['go_time', 'no_time'].includes(rollResult)) {
        console.error(`Invalid rollResult: ${rollResult}`);
        await snapshot.ref.remove();
        return;
      }

      // 5. Apply logic based on roll result
      const updates = {};

      if (rollResult === 'go_time') {
        // Damage the dragon (1 HP per hit)
        const damageAmount = 1;
        const newHP = Math.max(0, encounter.dragonHP - damageAmount);
        updates[`encounters/${encounterId}/dragonHP`] = newHP;

        // Check defeat condition
        if (newHP <= 0) {
          updates[`encounters/${encounterId}/status`] = 'defeated';
          console.log(`Dragon defeated! Final HP: ${newHP}`);
        }

        // No cooldown on success (can attack again immediately)
        updates[`encounters/${encounterId}/activePlayers/${userId}/onCooldown`] = false;
        updates[`encounters/${encounterId}/activePlayers/${userId}/cooldownUntil`] = 0;
      } else if (rollResult === 'no_time') {
        // Failed roll: apply 1.5 second cooldown
        const cooldownUntil = now + 1500;
        updates[`encounters/${encounterId}/activePlayers/${userId}/onCooldown`] = true;
        updates[`encounters/${encounterId}/activePlayers/${userId}/cooldownUntil`] = cooldownUntil;
      }

      // Update last attack time
      updates[`encounters/${encounterId}/activePlayers/${userId}/lastAttackTime`] = now;

      // 6. Write all updates atomically
      await db.ref().update(updates);
      console.log(`Attack processed: ${userId} rolled ${rollResult}`);
    } catch (error) {
      console.error('Error processing attack:', error);
    }
  });

/**
 * counterAttack
 * Cloud Function scheduled to run every 10 minutes.
 * Randomly selects an active player and times them out for 5 seconds.
 */
exports.counterAttack = functions.pubsub
  .schedule('every 10 minutes')
  .onRun(async (context) => {
    const encounterId = 'encounter_001';

    try {
      // 1. Fetch active players
      const playersRef = db.ref(`encounters/${encounterId}/activePlayers`);
      const playersSnap = await playersRef.once('value');

      if (!playersSnap.exists()) {
        console.log('No active players');
        return;
      }

      const players = playersSnap.val();
      const playerIds = Object.keys(players);

      if (playerIds.length === 0) {
        console.log('No players to target');
        return;
      }

      // 2. Select random player
      const targetUserId = playerIds[Math.floor(Math.random() * playerIds.length)];
      const now = Date.now();
      const cooldownUntil = now + 5000; // 5 second timeout

      // 3. Apply cooldown
      const updates = {};
      updates[`encounters/${encounterId}/activePlayers/${targetUserId}/onCooldown`] = true;
      updates[`encounters/${encounterId}/activePlayers/${targetUserId}/cooldownUntil`] = cooldownUntil;

      // 4. Log counter-attack
      const counterRef = db.ref(`encounters/${encounterId}/counterAttackLog`).push();
      await counterRef.set({
        targetUserId: targetUserId,
        timestamp: now,
        cooldownUntil: cooldownUntil,
      });

      await db.ref().update(updates);
      console.log(`Counter-attack! Targeted player: ${targetUserId}`);
    } catch (error) {
      console.error('Error in counter-attack:', error);
    }
  });

/**
 * initializeEncounter
 * HTTP-triggered function to set up a new encounter.
 * Call this manually before starting a boss battle.
 *
 * Usage: POST /initializeEncounter with JSON body:
 * {
 *   "encounterId": "encounter_001",
 *   "dragonMaxHP": 500
 * }
 */
exports.initializeEncounter = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User not authenticated');
  }

  const { encounterId, dragonMaxHP } = data;

  if (!encounterId || !dragonMaxHP) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing encounterId or dragonMaxHP');
  }

  try {
    await db.ref(`encounters/${encounterId}`).set({
      dragonHP: dragonMaxHP,
      dragonMaxHP: dragonMaxHP,
      status: 'active',
      startedAt: Date.now(),
      activePlayers: {},
      recentAttacks: {},
      counterAttackLog: {},
    });

    return { success: true, message: `Encounter ${encounterId} initialized` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', `Error initializing encounter: ${error.message}`);
  }
});
