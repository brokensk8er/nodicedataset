// profile-auth.js
// Shared auth module — import on every page.
// Handles Firebase Auth + Firestore init, profile button rendering,
// and exposes helpers for other pages to read/write user data.

import { initializeApp, getApps }
  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signOut,
  GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ============================================================
//  CONFIGURATION
//  Same project as poll.html — paste your values here.
// ============================================================
const FIREBASE_CONFIG = {
  apiKey:            'AIzaSyAIwTgubmE9V1XrSF3BS4rxSIr3uNua1a8',
  authDomain:        'nodicetools.firebaseapp.com',
  databaseURL:       'https://nodicetools-default-rtdb.firebaseio.com',
  projectId:         'nodicetools',
  storageBucket:     'nodicetools.firebasestorage.app',
  messagingSenderId: '387258889697',
  appId:             '1:387258889697:web:5467488ab109ea67b74ea0',
};

// ============================================================
//  INIT  (safe across multiple imports — Firebase dedupes by name)
// ============================================================
const _appName = 'ndt-profile';
const _app  = getApps().find(a => a.name === _appName)
            ?? initializeApp(FIREBASE_CONFIG, _appName);
const _auth = getAuth(_app);
const _db   = getFirestore(_app);

// ============================================================
//  PUBLIC API
// ============================================================

export const currentUser = () => _auth.currentUser;
export const db = () => _db;

export async function signOutUser() {
  await signOut(_auth);
  window.location.reload();
}

export const onUser = cb => onAuthStateChanged(_auth, cb);

export async function ensureUserDoc(user) {
  const ref  = doc(_db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email:           user.email   ?? '',
      displayName:     user.displayName ?? '',
      photoURL:        user.photoURL ?? '',
      ticketVerified:  false,
      ticketEmail:     '',
      isAdmin:         false,
      attendanceCount: 0,
      badges:          [],
      magicItems:      [],
      createdAt:       serverTimestamp(),
      character: {
        name:      '',
        race:      '',
        class:     '',
        backstory: '',
        quirk:     '',
        secret:    '',
        lockedAt:  null,
      },
    });
  }
  return (await getDoc(ref)).data();
}

export function mountProfileButton() {
  if (document.getElementById('profile-btn')) return;

  const btn = document.createElement('button');
  btn.id        = 'profile-btn';
  btn.className = 'profile-btn';
  btn.setAttribute('aria-label', 'Profile / Login');
  btn.textContent = '⚔ Login';
  btn.onclick = () => { window.location.href = 'profile.html'; };
  document.body.appendChild(btn);

  onAuthStateChanged(_auth, async user => {
    if (!user) {
      btn.textContent = '⚔ Login';
      btn.classList.remove('profile-btn--signed-in');
      return;
    }
    await ensureUserDoc(user);
    const label = user.displayName
      ? user.displayName.split(' ')[0]
      : (user.email ?? '').split('@')[0];
    btn.textContent = `⚔ ${label}`;
    btn.classList.add('profile-btn--signed-in');
  });
}

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(_auth, provider);
}

export async function signInEmail(email, pw) {
  return signInWithEmailAndPassword(_auth, email, pw);
}

export async function createEmail(email, pw) {
  return createUserWithEmailAndPassword(_auth, email, pw);
}

export const BADGES = [
  {
    id: 'initiate', minCount: 1, name: 'The Initiate',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,4 44,14 44,34 24,44 4,34 4,14"
        fill="#a07c2e" stroke="#c9a84c" stroke-width="1.5"/>
      <polygon points="24,10 38,18 38,30 24,38 10,30 10,18"
        fill="none" stroke="#fffdf5" stroke-width="0.8" opacity="0.5"/>
      <text x="24" y="28" text-anchor="middle"
        font-family="serif" font-size="14" fill="#fffdf5">I</text>
    </svg>`,
  },
  {
    id: 'adventurer', minCount: 3, name: 'Seasoned Adventurer',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,3 45,13 45,35 24,45 3,35 3,13"
        fill="#a07c2e" stroke="#c9a84c" stroke-width="1.5"/>
      <polygon points="24,9 39,17 39,31 24,39 9,31 9,17"
        fill="none" stroke="#fffdf5" stroke-width="0.8" opacity="0.5"/>
      <polygon points="24,15 33,20 33,28 24,33 15,28 15,20"
        fill="none" stroke="#c9a84c" stroke-width="0.6" opacity="0.7"/>
      <text x="24" y="28" text-anchor="middle"
        font-family="serif" font-size="11" fill="#fffdf5">III</text>
    </svg>`,
  },
  {
    id: 'veteran', minCount: 5, name: 'Veteran of the Realm',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <polygon points="24,2 46,12 46,36 24,46 2,36 2,12"
        fill="#8a6520" stroke="#c9a84c" stroke-width="1.8"/>
      <polygon points="24,8 40,16 40,32 24,40 8,32 8,16"
        fill="none" stroke="#e2bc6a" stroke-width="1" opacity="0.6"/>
      <polygon points="24,13 35,19 35,29 24,35 13,29 13,19"
        fill="none" stroke="#fffdf5" stroke-width="0.7" opacity="0.5"/>
      <line x1="24" y1="2" x2="24" y2="8" stroke="#c9a84c" stroke-width="1"/>
      <line x1="46" y1="12" x2="40" y2="16" stroke="#c9a84c" stroke-width="1"/>
      <line x1="46" y1="36" x2="40" y2="32" stroke="#c9a84c" stroke-width="1"/>
      <line x1="24" y1="46" x2="24" y2="40" stroke="#c9a84c" stroke-width="1"/>
      <line x1="2" y1="36" x2="8" y2="32" stroke="#c9a84c" stroke-width="1"/>
      <line x1="2" y1="12" x2="8" y2="16" stroke="#c9a84c" stroke-width="1"/>
      <text x="24" y="28" text-anchor="middle"
        font-family="serif" font-size="10" fill="#fffdf5">V</text>
    </svg>`,
  },
  {
    id: 'legend', minCount: 10, name: 'Living Legend',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="21" fill="#7a5510" stroke="#c9a84c" stroke-width="1.8"/>
      <polygon points="24,3 46,12 46,36 24,46 2,36 2,12"
        fill="none" stroke="#c9a84c" stroke-width="1.2" opacity="0.7"/>
      <circle cx="24" cy="24" r="13" fill="none" stroke="#e2bc6a" stroke-width="0.8" opacity="0.6"/>
      <circle cx="24" cy="24" r="7"  fill="none" stroke="#fffdf5" stroke-width="0.6" opacity="0.4"/>
      <text x="24" y="28" text-anchor="middle"
        font-family="serif" font-size="10" fill="#fffdf5">X</text>
    </svg>`,
  },
  {
    id: 'ascendant', minCount: 20, name: 'The Ascendant',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#5c3d08" stroke="#e2bc6a" stroke-width="2"/>
      <polygon points="24,2 46,12 46,36 24,46 2,36 2,12"
        fill="none" stroke="#c9a84c" stroke-width="1.4"/>
      <polygon points="24,7 41,16 41,32 24,41 7,32 7,16"
        fill="none" stroke="#c9a84c" stroke-width="0.8" opacity="0.6"/>
      <circle cx="24" cy="24" r="10" fill="none" stroke="#e2bc6a" stroke-width="1" opacity="0.5"/>
      <circle cx="24" cy="24" r="5"  fill="#c9a84c" opacity="0.4"/>
      <line x1="24" y1="2"  x2="24" y2="7"  stroke="#e2bc6a" stroke-width="1.2"/>
      <line x1="46" y1="12" x2="41" y2="16" stroke="#e2bc6a" stroke-width="1.2"/>
      <line x1="46" y1="36" x2="41" y2="32" stroke="#e2bc6a" stroke-width="1.2"/>
      <line x1="24" y1="46" x2="24" y2="41" stroke="#e2bc6a" stroke-width="1.2"/>
      <line x1="2"  y1="36" x2="7"  y2="32" stroke="#e2bc6a" stroke-width="1.2"/>
      <line x1="2"  y1="12" x2="7"  y2="16" stroke="#e2bc6a" stroke-width="1.2"/>
      <text x="24" y="27" text-anchor="middle"
        font-family="serif" font-size="8" fill="#fffdf5">XX</text>
    </svg>`,
  },
  {
    id: 'lich', minCount: 50, name: 'The Undying',
    svg: `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#1a0a2e" stroke="#c9a84c" stroke-width="2"/>
      <circle cx="24" cy="24" r="18" fill="none" stroke="#9b6fd4" stroke-width="0.8" opacity="0.6"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="#c9a84c" stroke-width="0.6" opacity="0.5"/>
      <circle cx="24" cy="24" r="9"  fill="none" stroke="#e2bc6a" stroke-width="0.5" opacity="0.4"/>
      <polygon points="24,2 46,12 46,36 24,46 2,36 2,12"
        fill="none" stroke="#9b6fd4" stroke-width="1" opacity="0.5"/>
      <polygon points="24,6 44,15 44,33 24,42 4,33 4,15"
        fill="none" stroke="#c9a84c" stroke-width="0.7" opacity="0.4"/>
      <line x1="24" y1="2"  x2="24" y2="6"  stroke="#9b6fd4" stroke-width="1.2"/>
      <line x1="46" y1="12" x2="44" y2="15" stroke="#9b6fd4" stroke-width="1.2"/>
      <line x1="46" y1="36" x2="44" y2="33" stroke="#9b6fd4" stroke-width="1.2"/>
      <line x1="24" y1="46" x2="24" y2="42" stroke="#9b6fd4" stroke-width="1.2"/>
      <line x1="2"  y1="36" x2="4"  y2="33" stroke="#9b6fd4" stroke-width="1.2"/>
      <line x1="2"  y1="12" x2="4"  y2="15" stroke="#9b6fd4" stroke-width="1.2"/>
      <circle cx="24" cy="24" r="3" fill="#9b6fd4" opacity="0.8"/>
    </svg>`,
  },
];

export function earnedBadges(attendanceCount) {
  return BADGES.filter(b => attendanceCount >= b.minCount);
}

export function highestBadge(attendanceCount) {
  const earned = earnedBadges(attendanceCount);
  return earned.length ? earned[earned.length - 1] : null;
}
