import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from './config'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB

export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error('Please choose an image under 5MB.')
  }
  const extension = file.name.split('.').pop() || 'jpg'
  const photoRef = ref(storage, `users/${uid}/profile.${extension}`)
  await uploadBytes(photoRef, file)
  return getDownloadURL(photoRef)
}
