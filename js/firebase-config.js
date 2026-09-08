// js/firebase-config.js
// Firebase Web config — this "apiKey" is a public identifier, not a secret.
// It's safe in client code as long as Firestore/Storage Security Rules
// and Firebase Auth are configured correctly (see /README.md).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBB2Rpy9nZIEgJCtaKACvPfN7zrESREjgw",
  authDomain: "johanaadv-af02e.firebaseapp.com",
  projectId: "johanaadv-af02e",
  storageBucket: "johanaadv-af02e.firebasestorage.app",
  messagingSenderId: "972206439123",
  appId: "1:972206439123:web:b97d612bc60e36499d7226"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloudinary — only the cloud name and an UNSIGNED upload preset are used
// on the client. Never put the API Secret in front-end code.
export const CLOUDINARY_CLOUD_NAME = "vcpdu2oa";
export const CLOUDINARY_UPLOAD_PRESET = "johana_admin_unsigned"; // create this in Cloudinary settings, see README
export const CLOUDINARY_FOLDER = "johana-kruger";
