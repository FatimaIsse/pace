// Firestore reads can hang indefinitely (not just slowly) when the backend is
// unreachable — they don't reliably reject on their own. This forces a promise
// to settle within `ms`, falling back instead of leaving callers stuck forever.
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        console.error(error)
        resolve(fallback)
      },
    )
  })
}
