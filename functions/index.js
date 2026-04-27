/**
 * Cloud Functions for Boss Battle Encounter
 * Main entry point - initializes Firebase and imports all functions
 */

const admin = require('firebase-admin');
admin.initializeApp();

// Import and export all functions from validateAttack
module.exports = {
  validateAttack: require('./validateAttack').validateAttack,
  counterAttack: require('./validateAttack').counterAttack,
  initializeEncounter: require('./validateAttack').initializeEncounter,
};
