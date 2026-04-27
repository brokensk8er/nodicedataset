# Boss Battle Debugging Guide

## Quick Fixes Needed (Before Deploying)

### Issue 1: Duplicate Cooldown Timers (bossbattle.html)
**Problem:** `listenToCooldownState()` fires on EVERY player update, causing cooldown timer to restart multiple times.

**Fix:** Track whether cooldown is already running
```javascript
let cooldownRunning = false;

function listenToCooldownState(userId) {
  const playerRef = ref(_db, `encounters/${ENCOUNTER_ID}/activePlayers/${userId}`);
  onValue(playerRef, snapshot => {
    if (!snapshot.exists()) return;

    const player = snapshot.val();
    if (player.onCooldown && !cooldownRunning) {  // ← ADD THIS CHECK
      cooldownUntil = player.cooldownUntil || Date.now() + 1500;
      cooldownRunning = true;  // ← ADD THIS
      startCooldownTimer();
    }
  });
}

function startCooldownTimer() {
  // ... existing code ...
  const updateTimer = () => {
    const remaining = Math.ceil((cooldownUntil - Date.now()) / 1000);

    if (remaining <= 0) {
      cooldownTimer.style.display = 'none';
      btnAttack.disabled = false;
      cooldownRunning = false;  // ← ADD THIS
      attackStatus.textContent = 'Ready to attack!';
    } else {
      // ... rest of code ...
    }
  };
  updateTimer();
}
```

**Line numbers:** bossbattle.html lines 240-249, 310-330

---

### Issue 2: Counter-Attack Events Duplicate (bossbattle.html)
**Problem:** If multiple counter-attacks happen, only checks latest one. Multiple users might see the same counter-attack trigger.

**Fix:** Track last processed counter-attack ID
```javascript
let lastProcessedCounterId = null;

function listenForCounterAttacks(userId) {
  const counterLogsRef = ref(_db, `encounters/${ENCOUNTER_ID}/counterAttackLog`);
  onValue(counterLogsRef, snapshot => {
    if (!snapshot.exists()) return;

    const logs = snapshot.val();
    const entries = Object.entries(logs).reverse();
    
    for (const [counterId, counter] of entries) {
      if (counterId !== lastProcessedCounterId && counter.targetUserId === userId) {
        lastProcessedCounterId = counterId;
        triggerCounterAttack(counter.cooldownUntil);
        break;  // Only process one per listener update
      }
    }
  });
}
```

**Line numbers:** bossbattle.html lines 223-235

---

### Issue 3: Memory Leak in boss.html
**Problem:** `/recentAttacks` listener keeps all attacks in memory forever. After 1000 attacks, animations may lag.

**Fix:** Limit to last 20 attacks, or prune old ones periodically

**Option A: Limit listener to recent attacks only (simpler)**
```javascript
// In boss.html, replace the attacks listener (around line 130):
const attacksRef = ref(_db, `encounters/${ENCOUNTER_ID}/recentAttacks`);
onValue(attacksRef, snapshot => {
  if (!snapshot.exists()) return;

  const attacks = snapshot.val();
  const entries = Object.entries(attacks).slice(-20);  // ← Keep only last 20
  const recentAttack = entries.reverse()[0];

  if (recentAttack && recentAttack[1]) {
    animationQueue.push({
      type: 'attack',
      rollResult: recentAttack[1].rollResult,
    });
  }
});
```

**Option B: Prune old attacks from database (better long-term)**
- Requires Cloud Function to clean up attacks older than 1 minute
- More complex, but prevents database bloat

Recommend Option A for now.

**Line numbers:** boss.html lines 118-130

---

## Testing Checklist

### Before Deploying Cloud Functions

- [ ] Read the validateAttack.js file - verify damage/cooldown logic is correct
- [ ] Check that Cloud Function deployment will work (npm dependencies installed)
- [ ] Manually initialize encounter via Firebase Console

### After Deploying

**Test 1: Single User Attack**
1. Open boss.html in one window
2. Open bossbattle.html in another window, sign in
3. Click "Attack" → verify HP bar updates within 1 second
4. Check browser console for errors

**Test 2: Failed Roll Cooldown**
1. Click Attack 5 times rapidly
2. ~33% should fail (no cooldown on success)
3. Failed roll → 1.5s cooldown should appear
4. Verify button is disabled during cooldown
5. After cooldown expires, button re-enables

**Test 3: Counter-Attack**
1. Let the encounter run
2. Every 10 minutes, one player should get hit
3. That player sees 5s "Dragon Counter-Attack!" message
4. Button disabled for 5s
5. Then back to normal

**Test 4: Multiplayer**
1. Open bossbattle.html on 2-3 devices
2. All attack simultaneously
3. All HP updates sync on boss.html
4. Check that player count is correct (top-left)

---

## Common Error Messages & Fixes

### "Player not registered in encounter"
**Cause:** Cloud Function triggered before player registered
**Fix:** Add small delay in validateAttack.js before checking player state
```javascript
// Wait 100ms for player to be registered
await new Promise(r => setTimeout(r, 100));
const playerSnap = await playerRef.once('value');
```

### "Encounter not found" in boss.html console
**Cause:** /encounters/encounter_001 doesn't exist
**Fix:** Initialize via Firebase Console or script before running boss.html

### Health bar doesn't animate (just jumps)
**Cause:** HP is updating faster than animation completes
**Fix:** Don't queue multiple animations at once. In boss.html, add debounce:
```javascript
let lastHPUpdateTime = 0;
if (newHP !== dragonCurrentHP && Date.now() - lastHPUpdateTime > 100) {
  lastHPUpdateTime = Date.now();
  animationQueue.push({ ... });
}
```

### Cooldown timer says "0s" forever
**Cause:** `cooldownUntil` is set but never updates
**Fix:** Make sure `startCooldownTimer()` actually runs and `updateTimer()` loops

---

## Performance Monitoring

### Check Realtime DB costs
```bash
firebase database:get encounters/encounter_001/activePlayers
# Count keys — each should be < 20 for this test
```

### Monitor Cloud Function execution
```bash
firebase functions:log
# Look for errors or slow executions (> 1s = concerning)
```

### Measure client-side latency
In browser console, add timing logs:
```javascript
const startTime = Date.now();
await push(attackRef, { userId, rollResult, timestamp: serverTimestamp() });
console.log(`Attack sent in ${Date.now() - startTime}ms`);
```

---

## Rollback Plan

If something breaks:

1. **Disable attacks:** Set `/encounters/encounter_001/status` to "paused"
2. **Clear bad data:** Reset `/encounters/encounter_001/recentAttacks` to `{}`
3. **Redeploy function:** Fix code, `firebase deploy --only functions`
4. **Restart encounter:** Reset `/encounters/encounter_001` with fresh values

---

## Notes for Next Session

1. **Fix the 3 issues above** before testing with real users
2. **Deploy carefully:** Test in functions emulator first if possible (`firebase emulators:start`)
3. **Monitor the first battle:** Watch Cloud Function logs and Realtime DB for errors
4. **Adjust HP**: If battle ends in < 5 min, increase dragonMaxHP. If > 20 min, decrease it.

