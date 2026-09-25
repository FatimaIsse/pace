// Generates short loopable White/Pink/Brown noise clips entirely
// client-side — pure math, no audio file, so there's nothing to license.
// Encoded as WAV data URLs so they play through a plain <audio> element,
// same as the licensed focus-sound tracks, instead of needing a separate
// Web Audio API playback path just for these three options.
export type NoiseColor = 'white' | 'pink' | 'brown'

const SAMPLE_RATE = 44100
const DURATION_SECONDS = 8

function generateWhiteNoise(length: number): Float32Array {
  const samples = new Float32Array(length)
  for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1
  return samples
}

// Paul Kellet's refined pink noise filter — a standard, well-known
// approximation that sounds smooth rather than harsh.
function generatePinkNoise(length: number): Float32Array {
  const samples = new Float32Array(length)
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.969 * b2 + white * 0.153852
    b3 = 0.8665 * b3 + white * 0.3104856
    b4 = 0.55 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.016898
    const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362
    b6 = white * 0.115926
    samples[i] = pink * 0.11
  }
  return samples
}

function generateBrownNoise(length: number): Float32Array {
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

const cache = new Map<NoiseColor, string>()

export function getNoiseDataUrl(color: NoiseColor): string {
  const cached = cache.get(color)
  if (cached) return cached

  const length = SAMPLE_RATE * DURATION_SECONDS
  const samples =
    color === 'white' ? generateWhiteNoise(length) : color === 'pink' ? generatePinkNoise(length) : generateBrownNoise(length)
  const url = URL.createObjectURL(encodeWav(samples, SAMPLE_RATE))
  cache.set(color, url)
  return url
}
