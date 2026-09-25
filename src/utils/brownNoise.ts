// Generates a short loopable brown-noise clip entirely client-side — pure
// math, no audio file, so there's nothing to license. Encoded as a WAV data
// URL so it can be played through a plain <audio> element, the same as the
// licensed focus-sound tracks, instead of needing a separate Web Audio API
// playback path just for this one option.
const SAMPLE_RATE = 44100
const DURATION_SECONDS = 8

function generateBrownNoiseSamples(length: number): Float32Array {
  const samples = new Float32Array(length)
  let lastOut = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    lastOut = (lastOut + 0.02 * white) / 1.02
    samples[i] = lastOut * 3.5 // compensate for the leaky integrator's amplitude loss
  }
  return samples
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2
  const blockAlign = bytesPerSample
  const dataSize = samples.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, clamped * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

let cachedUrl: string | null = null

export function getBrownNoiseDataUrl(): string {
  if (cachedUrl) return cachedUrl
  const samples = generateBrownNoiseSamples(SAMPLE_RATE * DURATION_SECONDS)
  const blob = encodeWav(samples, SAMPLE_RATE)
  cachedUrl = URL.createObjectURL(blob)
  return cachedUrl
}
