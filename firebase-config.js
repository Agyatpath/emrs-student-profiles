// ============================================================================
// PASTE YOUR OWN FIREBASE PROJECT CONFIG HERE.
// You get these exact values from: Firebase Console → Project Settings →
// "Your apps" → the web app (</>) → SDK setup and configuration → Config.
// See SETUP_INSTRUCTIONS.md for click-by-click steps.
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBf3SVk9cX17Q2RR9TflB6Vjach9SOxhKk",
  authDomain: "emrs-student-profiles.firebaseapp.com",
  projectId: "emrs-student-profiles",
  storageBucket: "emrs-student-profiles.firebasestorage.app",
  messagingSenderId: "836106105937",
  appId: "1:836106105937:web:0f00ae1b25801490ad3470"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
