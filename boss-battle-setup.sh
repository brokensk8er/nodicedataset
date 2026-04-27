#!/bin/bash

# boss-battle-setup.sh
# Quick setup script for boss battle encounter
# Run this after deploying Cloud Functions to initialize the first encounter

set -e

echo "🐉 Boss Battle Setup Script"
echo "============================"
echo ""

# Check if firebase-cli is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ firebase-cli not found. Install with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ firebase-cli found"
echo ""

# Check if we're in the right directory
if [ ! -f "bossbattle.html" ]; then
    echo "❌ bossbattle.html not found. Run this script from /home/user/nodicedataset/"
    exit 1
fi

echo "✅ Running from correct directory"
echo ""

# Step 1: Check Firebase login
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not authenticated. Run: firebase login"
    exit 1
fi
echo "✅ Firebase authenticated"
echo ""

# Step 2: Ensure functions directory exists
echo "📁 Checking Cloud Functions setup..."
if [ ! -d "functions" ]; then
    echo "Creating functions/ directory..."
    mkdir -p functions
    cd functions
    npm init -y
    npm install firebase-functions firebase-admin
    cd ..
    echo "⚠️  Created new functions/ directory. You may need to configure it further."
else
    echo "✅ functions/ directory exists"
fi
echo ""

# Step 3: Deploy database rules
echo "📋 Deploying database rules..."
firebase deploy --only database
echo "✅ Database rules deployed"
echo ""

# Step 4: Deploy Cloud Functions
echo "☁️  Deploying Cloud Functions..."
echo "   (This may take 1-2 minutes...)"
firebase deploy --only functions
echo "✅ Cloud Functions deployed"
echo ""

# Step 5: Initialize encounter
echo "🎮 Initializing encounter..."
echo "   Creating /encounters/encounter_001 with 500 HP..."

# Use firebase realtime database to create initial data
firebase database:set encounters/encounter_001 --data '{
  "dragonHP": 500,
  "dragonMaxHP": 500,
  "status": "active",
  "startedAt": 0,
  "activePlayers": {},
  "recentAttacks": {},
  "counterAttackLog": {}
}' --confirm

echo "✅ Encounter initialized"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Open boss.html in a browser window (full screen)"
echo "  2. Open bossbattle.html on a phone"
echo "  3. Sign in via profile.html"
echo "  4. Click 'Attack the Dragon' and watch the HP bar update"
echo ""
echo "If something goes wrong, check:"
echo "  - Firebase Console: Realtime Database > encounters"
echo "  - Browser console for JavaScript errors"
echo "  - Cloud Functions logs: firebase functions:log"
