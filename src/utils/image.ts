// Resizes/compresses an image client-side into a small square JPEG data URL,
// small enough to store as a plain Firestore field — this avoids needing
// Firebase Storage (which now requires the paid Blaze plan) for something as
// small as a single avatar photo.
const MAX_DIMENSION = 256
const MAX_DATA_URL_BYTES = 400_000 // leaves comfortable room under Firestore's 1MB document cap

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image.'))
    }
    img.src = url
  })
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const img = await loadImage(file)
  const size = Math.min(img.width, img.height, MAX_DIMENSION)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not process that image.')

  // Center-crop to a square so it fills the round avatar cleanly.
  const cropSize = Math.min(img.width, img.height)
  const sx = (img.width - cropSize) / 2
  const sy = (img.height - cropSize) / 2
  ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size)

  let quality = 0.85
  let dataUrl = canvas.toDataURL('image/jpeg', quality)
  while (dataUrl.length > MAX_DATA_URL_BYTES && quality > 0.3) {
    quality -= 0.15
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  if (dataUrl.length > MAX_DATA_URL_BYTES) {
    throw new Error('That photo is too complex to store — try a simpler image.')
  }

  return dataUrl
}
