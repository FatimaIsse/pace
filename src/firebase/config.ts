import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => !!value)

// getAuth() throws synchronously on an empty apiKey, which would crash the whole
// module graph before App can render the "not configured" notice. Fall back to a
// well-formed placeholder so init succeeds; isFirebaseConfigured gates all real use.
const placeholderConfig = {
  apiKey: 'placeholder-key',
  authDomain: 'placeholder.firebaseapp.com',
  projectId: 'placeholder-project',
  storageBucket: 'placeholder.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
}

export const app = initializeApp(isFirebaseConfigured ? firebaseConfig : placeholderConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
