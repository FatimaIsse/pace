import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './config'
import type { UserProfile } from '@/types'

// Generic helpers for the users/{uid}/{collectionName}/{docId} pattern used
// by every feature collection (tasks, projects, habits, goals, ...).

export function userCollection(uid: string, collectionName: string) {
  return collection(db, 'users', uid, collectionName)
}

export function userDoc(uid: string, collectionName: string, docId: string) {
  return doc(db, 'users', uid, collectionName, docId)
}

export async function createDoc<T extends Record<string, unknown>>(
  uid: string,
  collectionName: string,
  data: T,
) {
  const ref = await addDoc(userCollection(uid, collectionName), data)
  return ref.id
}

export async function setDocById<T extends Record<string, unknown>>(
  uid: string,
  collectionName: string,
  docId: string,
  data: T,
) {
  await setDoc(userDoc(uid, collectionName, docId), data)
}

export async function patchDoc(
  uid: string,
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
) {
  await updateDoc(userDoc(uid, collectionName, docId), data)
}

export async function removeDoc(uid: string, collectionName: string, docId: string) {
  await deleteDoc(userDoc(uid, collectionName, docId))
}

export function subscribeToCollection<T>(
  uid: string,
  collectionName: string,
  onData: (items: (T & { id: string })[]) => void,
  constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')],
) {
  const q = query(userCollection(uid, collectionName), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as T) }))
    onData(items)
  })
}

// User profile lives at users/{uid} directly (not a subcollection).

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export async function createUserProfile(profile: UserProfile) {
  await setDoc(doc(db, 'users', profile.uid), profile)
}

// setDoc(merge:true) rather than updateDoc — updateDoc throws NOT_FOUND if
// the profile document doesn't exist yet (which has happened for real
// accounts), while merge quietly creates it instead of hard-failing.
export async function patchUserProfile(uid: string, data: Partial<UserProfile>) {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

// The collections that count as "this account actually has stuff in it" —
// used to tell a returning user with real data apart from a genuinely new
// one, independent of whatever the onboardingComplete flag says.
const CONTENT_COLLECTIONS = ['tasks', 'habits', 'goals', 'projects']

export async function hasAnyUserData(uid: string): Promise<boolean> {
  const results = await Promise.all(
    CONTENT_COLLECTIONS.map(async (name) => {
      const snap = await getDocs(query(userCollection(uid, name), limit(1)))
      return !snap.empty
    }),
  )
  return results.some(Boolean)
}

export async function getPreferences(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid, 'preferences', 'main'))
  return snap.exists() ? snap.data() : null
}

export async function setPreferences(uid: string, data: Record<string, unknown>) {
  await setDoc(doc(db, 'users', uid, 'preferences', 'main'), data, { merge: true })
}

// Every subcollection ever written under users/{uid} — kept in sync with the
// COLLECTION/HABITS/SESSIONS/etc constants in src/hooks/*.ts. Firestore has no
// cascading delete, so account deletion has to enumerate and clear each one.
const USER_SUBCOLLECTIONS = [
  'tasks',
  'projects',
  'habits',
  'habitSessions',
  'brainDumps',
  'goals',
  'weeklyFocus',
  'checkIns',
  'preferences',
]

export async function deleteAllUserData(uid: string) {
  const batch = writeBatch(db)
  for (const name of USER_SUBCOLLECTIONS) {
    const snap = await getDocs(userCollection(uid, name))
    snap.forEach((d) => batch.delete(d.ref))
  }
  batch.delete(doc(db, 'users', uid))
  await batch.commit()
}

// A plain JSON snapshot of everything under users/{uid} — the profile doc
// plus every subcollection — for the "Export data" action.
export async function exportAllUserData(uid: string): Promise<Record<string, unknown>> {
  const profileSnap = await getDoc(doc(db, 'users', uid))
  const data: Record<string, unknown> = {
    profile: profileSnap.exists() ? profileSnap.data() : null,
  }
  for (const name of USER_SUBCOLLECTIONS) {
    if (name === 'preferences') continue
    const snap = await getDocs(userCollection(uid, name))
    data[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  return data
}
