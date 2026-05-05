import { useMemo, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'recording' | 'error'

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Could not read recorded audio'))
        return
      }
      const commaIndex = result.indexOf(',')
      if (commaIndex === -1) {
        reject(new Error('Invalid data URL for recorded audio'))
        return
      }
      resolve(result.slice(commaIndex + 1))
    }
    reader.onerror = () => reject(new Error('Could not read recorded audio'))
    reader.readAsDataURL(blob)
  })
}

export function useAudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [status, setStatus] = useState<RecorderStatus>('idle')

  const isRecording = status === 'recording'
  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'

  const startRecording = async () => {
    if (!isSupported || isRecording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.start()
      setStatus('recording')
    } catch {
      setStatus('error')
    }
  }

  const stopRecording = async (): Promise<{ audioB64: string; audioMimeType: string } | null> => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === 'inactive') return null

    return new Promise(resolve => {
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const audioB64 = await blobToBase64(blob)
          resolve({ audioB64, audioMimeType: 'audio/webm' })
        } catch {
          resolve(null)
        } finally {
          streamRef.current?.getTracks().forEach(track => track.stop())
          streamRef.current = null
          mediaRecorderRef.current = null
          chunksRef.current = []
          setStatus('idle')
        }
      }

      recorder.stop()
    })
  }

  const hasError = useMemo(() => status === 'error', [status])

  return {
    isSupported,
    isRecording,
    hasError,
    startRecording,
    stopRecording,
  }
}
