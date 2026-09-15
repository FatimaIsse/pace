import { useEffect, useRef, useState } from 'react'

// Not every browser exposes this (notably Firefox, and iOS WKWebView) — callers
// check `supported` and hide the mic entirely rather than show a dead button.
function getSpeechRecognitionCtor(): typeof window.SpeechRecognition | undefined {
  if (typeof window === 'undefined') return undefined
  return window.SpeechRecognition ?? window.webkitSpeechRecognition
}

export function useSpeechToText() {
  const [supported] = useState(() => Boolean(getSpeechRecognitionCtor()))
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    return () => recognitionRef.current?.stop()
  }, [])

  function start(onResult: (transcriptSoFar: string) => void) {
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || 'en-US'

    let finalTranscript = ''

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += chunk + ' '
        } else {
          interim += chunk
        }
      }
      onResult((finalTranscript + interim).trim())
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  function stop() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return { supported, listening, start, stop }
}
