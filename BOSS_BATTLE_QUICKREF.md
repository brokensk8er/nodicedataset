# Boss Battle Quick Reference

## Files at a Glance

| File | Purpose | Status |
|------|---------|--------|
| `bossbattle.html` | User attack page | ✅ Ready to test |
| `boss.html` | Display page (Phaser 4) | ✅ Ready to test |
| `functions/` | Cloud Functions | ⚙️ Needs npm install + deploy |
| `database.rules.json` | Realtime DB security | ✅ Deploy with `firebase deploy --only database` |
| `boss-battle-setup.sh` | Automated setup | 📝 Optional helper script |
| `BOSS_BATTLE_HANDOFF.md` | Full implementation guide | 📖 Read first |
| `BOSS_BATTLE_DEBUG.md` | Fixes and troubleshooting | 🔧 If things break |
| `BOSS_BATTLE_MANUAL_SETUP.md` | Step-by-step setup | 👨‍🔬 For manual deployment |

---

## Deployment Commands (Copy-Paste)

### 1. Deploy Database Rules
```bash
firebase deploy --only database
```

### 2. Install Cloud Functions Dependencies
```bash
cd functions/
npm install
cd ..
```

### 3. Deploy Cloud Functions
```bash
firebase deploy --only functions
```

### 4. Initialize Encounter (via CLI)
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

### 5. Check Functions Deployed
```bash
firebase functions:list
```

### 6. Watch Logs During Testing
```bash
firebase functions:log --follow
```

---

## URLs for Testing

```
boss.html:      file:///home/user/nodicedataset/boss.html
bossbattle.html: file:///home/user/nodicedataset/bossbattle.html
profile.html:   file:///home/user/nodicedataset/profile.html  (for login)
index.html:     file:///home/user/nodicedataset/index.html    (vault hub)
```

If running local server on port 8000:
```
boss.html:      http://localhost:8000/boss.html
bossbattle.html: http://localhost:8000/bossbattle.html
```

---

## Key Constants (Tunable)

| Constant | Value | File | How to Adjust |
|----------|-------|------|---------------|
| Damage per hit | 1 HP | `functions/validateAttack.js` line 70 | `const damageAmount = 1;` |
| Failed roll cooldown | 1500 ms | `functions/validateAttack.js` line 80 | `const cooldownUntil = now + 1500;` |
| Counter-attack frequency | 10 minutes | `functions/validateAttack.js` pubsub schedule | `functions.pubsub.schedule('every 10 minutes')` |
| Counter-attack duration | 5000 ms | `functions/validateAttack.js` line 115 | `const cooldownUntil = now + 5000;` |
| Dragon max HP | 500 | Firebase Console or init script | Set in `/encounters/encounter_001/dragonMaxHP` |
| HP animation duration | 500 ms | `boss.html` line 183 | `const duration = 500;` |
| Coin animation duration | 1000 ms | `boss.html` line 211 | `duration: 1000,` |

---

## Common Checks

### Is Encounter Initialized?
```bash
firebase database:get encounters/encounter_001
# Should return object with dragonHP, status, etc.
```

### How Many Players Online?
```bash
firebase database:get encounters/encounter_001/activePlayers | wc -l
```

### How Many Attacks So Far?
```bash
firebase database:get encounters/encounter_001/recentAttacks | wc -l
```

### Are Cloud Functions Running?
```bash
firebase functions:log
# Should show recent function executions
```

---

## Debugging Quick Fixes

### Health bar not updating?
- [ ] `/encounters/encounter_001` exists? → `firebase database:get encounters/encounter_001`
- [ ] Cloud Functions deployed? → `firebase functions:list`
- [ ] Browser console has errors? → Open DevTools (F12)
- [ ] Realtime DB rules correct? → `firebase deploy --only database`

### Cooldown timer not working?
- [ ] Check `BOSS_BATTLE_DEBUG.md` Issue #1 (duplicate timer fix)
- [ ] Test single attack → does button disable? → Check validateAttack.js logic

### Counter-attacks not triggering?
- [ ] Counter-attack scheduled? → Check Cloud Function logs
- [ ] 10 minutes passed? → They trigger every 10 min
- [ ] Players online? → Check `/activePlayers` count

### Memory/Performance Issues?
- [ ] Database too large? → See `BOSS_BATTLE_DEBUG.md` Issue #3 (prune attacks)
- [ ] Animation queue overflowing? → Reduce attack frequency or debounce listeners

---

## Git Commands

```bash
# Check branch
git branch

# See what changed
git status
git diff

# Commit changes
git add .
git commit -m "message"

# Push to remote
git push

# View logs
git log --oneline
```

---

## Firebase Console Quick Links

- **Realtime Database:** nodicetools → Data tab
- **Cloud Functions:** nodicetools → Functions tab
- **Database Rules:** nodicetools → Rules tab
- **Logs:** nodicetools → Functions → View logs

---

## Performance Targets

- **HP bar update latency:** < 500ms from attack click
- **Animation frame rate:** 60 FPS (smooth)
- **Cloud Function execution:** < 1s per attack
- **Realtime DB read cost:** < $0.01 per 1000 battles (watch Console)

---

## When to Read Each Document

| Document | When to Read |
|----------|--------------|
| **BOSS_BATTLE_HANDOFF.md** | First thing in next session |
| **BOSS_BATTLE_MANUAL_SETUP.md** | Setting up deployment step-by-step |
| **BOSS_BATTLE_DEBUG.md** | If something's broken |
| **BOSS_BATTLE_QUICKREF.md** | During testing/deployment (this file!) |

---

## Success Checklist

- [ ] Database rules deployed
- [ ] Cloud Functions deployed
- [ ] Encounter initialized in Firebase
- [ ] boss.html loads without errors
- [ ] bossbattle.html loads, user can sign in
- [ ] Attack button works, coin flip animates
- [ ] HP bar on boss.html updates after attack
- [ ] Cooldown timer appears after failed roll
- [ ] Health bar animates smoothly
- [ ] Open 2+ clients, verify attacks sync
- [ ] Logs show "Attack processed" messages

Once all ✅ → Ready for Phase 2 (Polish)

