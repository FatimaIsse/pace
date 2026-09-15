import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth'
import { Capacitor } from '@capacitor/core'
import { FirebaseAuthentication } from '@capacitor-firebase/authentication'
import { auth } from './config'
import { deleteAllUserData } from './firestore'

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: name })
  return credential.user
}

export async function signInWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// Native (iOS/Android): Google blocks OAuth sign-in inside an app's embedded
// WebView, so this has to go through the native Google Sign-In SDK instead —
// then bridges the resulting credential into the JS SDK's `auth` so the rest
// of the app (which only knows about the JS SDK) sees the same signed-in user.
// Web: uses a redirect instead of a popup, since modern browsers'
// Cross-Origin-Opener-Policy restrictions can silently break Firebase's
// popup-closed detection even after the user finishes picking an account.
//
// Returns the signed-in user on native (sign-in completes immediately) or
// null on web (the page navigates away; completeGoogleRedirect() picks up
// the result after the browser returns).
export async function signInWithGoogle(): Promise<User | null> {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle()
    const idToken = result.credential?.idToken
    if (!idToken) throw new Error('Google sign-in did not return a token.')
    const credential = GoogleAuthProvider.credential(idToken)
    const jsResult = await signInWithCredential(auth, credential)
    return jsResult.user
  }
  const provider = new GoogleAuthProvider()
  await signInWithRedirect(auth, provider)
  return null
}

export async function completeGoogleRedirect() {
  const credential = await getRedirectResult(auth)
  return credential?.user ?? null
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email)
}

export function hasPasswordProvider(user: User): boolean {
  return user.providerData.some((p) => p.providerId === 'password')
}

export async function updateDisplayName(name: string) {
  const user = auth.currentUser
  if (!user) return
  await updateProfile(user, { displayName: name })
}

export async function updatePhotoURL(photoURL: string) {
  const user = auth.currentUser
  if (!user) return
  await updateProfile(user, { photoURL })
}

// updatePassword() also requires a recent sign-in (auth/requires-recent-login),
// so re-authenticate with the current password first — that doubles as
// verifying the user actually knows it before letting them set a new one.
export async function changePassword(currentPassword: string, newPassword: string) {
  const user = auth.currentUser
  if (!user?.email) return
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await updatePassword(user, newPassword)
}

// Sends a confirmation link to the new address rather than changing it
// immediately — the email only actually updates once that link is clicked,
// which is Firebase's recommended (and more secure) flow over the older
// updateEmail(), which changed it instantly with no verification.
export async function changeEmail(currentPassword: string, newEmail: string) {
  const user = auth.currentUser
  if (!user?.email) return
  const credential = EmailAuthProvider.credential(user.email, currentPassword)
  await reauthenticateWithCredential(user, credential)
  await verifyBeforeUpdateEmail(user, newEmail)
}

export async function logOut() {
  await signOut(auth)
}

// deleteUser() requires a recent sign-in; if the session is old it throws
// auth/requires-recent-login, which authErrorMessage below turns into a
// "sign in again" prompt rather than a generic failure.
export async function deleteAccount() {
  const user = auth.currentUser
  if (!user) return
  await deleteAllUserData(user.uid)
  await deleteUser(user)
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.'
    case 'auth/invalid-email':
      return 'That email address doesn’t look right.'
    case 'auth/weak-password':
      return 'Please use at least 6 characters.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'That email and password don’t match.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in was closed before finishing.'
    case 'auth/requires-recent-login':
      return 'For your security, please log out and sign in again before doing this.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
