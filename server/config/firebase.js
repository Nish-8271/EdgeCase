const admin = require('firebase-admin');

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production: Load from Environment Variable string
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local Dev: Fallback to the local gitignored file
  try {
    serviceAccount = require('../../serviceAccountKey.json');
  } catch (error) {
    console.error("Firebase Service Account JSON missing! Deployment will fail without FIREBASE_SERVICE_ACCOUNT environment variable.");
  }
}

if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;