import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if config is valid
const isConfigValid = Object.values(firebaseConfig).every(value => value && value !== '');

if (!isConfigValid) {
  console.error('Firebase configuration is incomplete. Missing environment variables:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
  });
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export { app };

// Initialize Firebase Authentication with IndexedDB persistence (reliable in PWA/offline)
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence,
});

// Initialize Cloud Firestore with offline persistence
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
