import { initializeApp } from 'firebase/app';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

// With no VITE_FIREBASE_* env vars set, the app targets the local
// Firebase Emulator Suite using the offline-only `demo-fibo` project.
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-fibo';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? `${projectId}.firebaseapp.com`,
  projectId,
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ?? `https://${projectId}-default-rtdb.firebaseio.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-app-id',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
if (isLocalHost && !import.meta.env.VITE_FIREBASE_DATABASE_URL) {
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
}
