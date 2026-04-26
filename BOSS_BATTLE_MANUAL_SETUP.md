# Boss Battle Manual Setup Guide

If you prefer not to use the automated script, follow these steps to deploy and test.

## Step 1: Deploy Database Rules

```bash
cd /home/user/nodicedataset

# Check current rules
firebase database:get .settings/rules

# Deploy updated rules (includes /encounters path)
firebase deploy --only database
```

**Verify:** Go to Firebase Console → Realtime Database → Rules tab. You should see `/encounters` path.

---

## Step 2: Setup Cloud Functions

### 2a: Check Node/npm
```bash
node --version    # Should be 18+
npm --version     # Should be 8+
```

### 2b: Install dependencies
```bash
cd functions/
npm install
cd ..
```

### 2c: Verify files exist
```bash
ls -la functions/
# Should show:
# - index.js
# - validateAttack.js
# - package.json
```

---

## Step 3: Test Cloud Functions Locally (Optional but Recommended)

```bash
cd functions/

# Start emulator
firebase emulators:start --only functions

# In another terminal, test the initializeEncounter function:
curl -X POST http://localhost:5001/nodicetools/us-central1/initializeEncounter \
  -H "Content-Type: application/json" \
  -d '{"encounterId": "encounter_001", "dragonMaxHP": 500}'
```

Expected response:
```json
{"success": true, "message": "Encounter encounter_001 initialized"}
```

---

## Step 4: Deploy Cloud Functions to Production

```bash
firebase deploy --only functions
```

This will take 1-3 minutes. Watch for any errors in the output.

**Verify:**
```bash
firebase functions:list
# Should show:
# - validateAttack (Database Trigger)
# - counterAttack (Pub/Sub Scheduled)
# - initializeEncounter (Callable)
```

---

## Step 5: Initialize Encounter

### Option A: Via Firebase Console (Easiest)

1. Go to Firebase Console → Project Settings
2. Select "Realtime Database"
3. Click the green "+" next to "encounters"
4. Add this data:
```json
{
  "encounter_001": {
    "dragonHP": 500,
    "dragonMaxHP": 500,
    "status": "active",
    "startedAt": 0,
    "activePlayers": {},
    "recentAttacks": {},
    "counterAttackLog": {}
  }
}
```

### Option B: Via CLI

```bash
firebase database:set encounters/encounter_001 --data '{
  "dragonHP": 500,
  "dragonMaxHP": 500,
  "status": "active",
  "startedAt": 0,
  "activePlayers": {},
  "recentAttacks": {},
  "counterAttackLog": {}
}' --confirm
```

**Verify:**
```bash
firebase database:get encounters/encounter_001
# Should return the JSON above
```

---

## Step 6: Test End-to-End

### In Browser 1: Open Boss Display
```
Open: http://localhost:8000/boss.html
(Or: file:///home/user/nodicedataset/boss.html if no local server)

You should see:
- A dragon emoji (🐉) in the center
- Health bar below it showing "HP: 500 / 500"
- Player count: 0
```

### In Browser 2: Open Attack Page
```
Open: http://localhost:8000/bossbattle.html

You should see:
- "Please sign in to join the battle" OR
- Attack button if already authenticated
```

If not authenticated:
1. Click "Back to the Vault" → go to index.html
2. Click profile button → sign in
3. Return to bossbattle.html

### Test Attack
1. On bossbattle.html, click "⚔ Attack the Dragon"
2. Watch for:
   - Coin flip animation (question mark rotates)
   - Result text appears (flavor text)
   - On boss.html: HP bar updates and animates down
   - Small coin (✓ or ✗) floats up above health bar

If HP doesn't update:
- Check browser console for errors
- Verify `/encounters/encounter_001` exists in database
- Check Cloud Function logs: `firebase functions:log`

---

## Step 7: Multipl Player Test

1. Open bossbattle.html on multiple devices (phones/tablets)
2. Sign in on each one
3. Click "Attack" simultaneously on all devices
4. Verify on boss.html:
   - All attacks register (health bar updates multiple times)
   - Player count increases (top-left)
   - No errors in console

---

## Troubleshooting

### Issue: "Player not registered in encounter"
**In Cloud Function logs:**
```
Error: Player {userId} not registered in encounter
```

**Fix:** The player needs to register BEFORE attacking. This happens automatically when bossbattle.html loads, but there's a race condition. Increase the wait time in validateAttack.js:

```javascript
// Line 32 in validateAttack.js
await new Promise(r => setTimeout(r, 500));  // Increase from 0ms
```

Then redeploy: `firebase deploy --only functions`

---

### Issue: "Encounter not found"
**In boss.html console:**
```
Encounter encounter_001 not found
```

**Fix:** Initialize the encounter. Check Step 5 above, then refresh boss.html.

---

### Issue: Health bar doesn't animate (just jumps)
**Fix:** This is actually normal if multiple attacks come within 500ms. The animation queue processes them. But if it feels janky:

```javascript
// In boss.html, line ~85
const duration = 500;  // Change to 300 for faster animations
```

---

### Issue: Cloud Functions not deploying
```
Error: Deployment failed
```

**Check:**
```bash
# Are dependencies installed?
npm list -g firebase-tools
npm list firebase-functions
npm list firebase-admin

# Is Node version correct?
node --version  # Should be 18+
```

If missing:
```bash
npm install -g firebase-tools
cd functions/
npm install
```

---

### Issue: Attacks not applying damage

**Checklist:**
1. [ ] Cloud Function deployed successfully
2. [ ] `/encounters/encounter_001` exists in Realtime Database
3. [ ] Database rules include `/encounters` path
4. [ ] Browser console shows no JavaScript errors
5. [ ] Cloud Function logs show attack processing:
   ```bash
   firebase functions:log
   # Should see: "Attack processed: {userId} rolled {result}"
   ```

---

## Monitoring

### Check Cloud Function Logs
```bash
firebase functions:log

# Filter for errors only
firebase functions:log --limit 50 | grep -i error
```

### Check Database Growth
```bash
firebase database:get encounters/encounter_001/recentAttacks | wc -l
# If > 1000, the database is getting large (see BOSS_BATTLE_DEBUG.md for fix)
```

### Test Database Rules
```bash
# Try reading as authenticated user (if they sign in)
firebase database:get encounters/encounter_001 --auth-file=serviceAccountKey.json

# Try reading as anonymous (should fail)
firebase database:get encounters/encounter_001
```

---

## Cleanup / Reset

### Clear an Encounter
```bash
firebase database:remove encounters/encounter_001
firebase database:set encounters/encounter_001 --data '{
  "dragonHP": 500,
  "dragonMaxHP": 500,
  "status": "active",
  "startedAt": 0,
  "activePlayers": {},
  "recentAttacks": {},
  "counterAttackLog": {}
}' --confirm
```

### Clear All Boss Battle Data
```bash
firebase database:remove encounters
firebase database:set encounters/encounter_001 --data '...' --confirm
```

### Redeploy Functions
```bash
firebase deploy --only functions
```

---

## Next Steps

Once everything is working:

1. **Monitor the battle:** Watch Cloud Function logs and database for issues
2. **Adjust HP:** If battle ends too fast/slow, update dragonMaxHP
3. **Test counter-attacks:** They should trigger every 10 minutes
4. **Phase 2:** Add visual polish (red flash, enhanced victory screen)

See **BOSS_BATTLE_HANDOFF.md** for the complete roadmap.
