import { useCallback, useRef, useState } from 'react'

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

export function useBackendAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setIsPlaying(false)
  }, [])

  const playFromBase64 = useCallback(
    async (audioB64: string, mimeType = 'audio/mpeg') => {
      cleanup()
      const blob = base64ToBlob(audioB64, mimeType)
      const url = URL.createObjectURL(blob)
      objectUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = cleanup
      audio.onerror = cleanup

      setIsPlaying(true)
      await audio.play()
    },
    [cleanup],
  )

  return {
    isPlaying,
    playFromBase64,
    stop: cleanup,
  }
}
