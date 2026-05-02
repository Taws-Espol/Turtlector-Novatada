import { useEffect, useState } from 'react'

export function useSpeechSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceNameState] = useState('')
  const [hasUserVoiceSelection, setHasUserVoiceSelection] = useState(false)

  const hasSpeechSynthesisSupport =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  useEffect(() => {
    if (!hasSpeechSynthesisSupport) return

    const synth = window.speechSynthesis

    const populateVoices = () => {
      const allVoices = synth.getVoices()
      setVoices(allVoices)

      if (allVoices.length === 0) return

      if (hasUserVoiceSelection) {
        const stillExists = allVoices.some(v => v.name === selectedVoiceName)
        if (stillExists) return
      }

      const spanishVoice = allVoices.find(v => v.lang.toLowerCase().startsWith('es'))
      const fallbackVoice = spanishVoice ?? allVoices[0]
      setSelectedVoiceNameState(fallbackVoice.name)
    }

    populateVoices()
    synth.onvoiceschanged = populateVoices

    return () => {
      synth.onvoiceschanged = null
      synth.cancel()
    }
  }, [hasSpeechSynthesisSupport, hasUserVoiceSelection, selectedVoiceName])

  const speak = (text: string, onEnd?: () => void) => {
    if (!hasSpeechSynthesisSupport) return

    const normalized = text.trim()
    if (!normalized || normalized === '…') return

    const synth = window.speechSynthesis
    const utterance = new window.SpeechSynthesisUtterance(normalized)
    const selectedVoice = voices.find(v => v.name === selectedVoiceName)

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => {
      onEnd?.()
    }

    synth.cancel()
    synth.speak(utterance)
  }

  const setSelectedVoiceName = (voiceName: string) => {
    setSelectedVoiceNameState(voiceName)
    setHasUserVoiceSelection(true)
  }

  return {
    voices,
    selectedVoiceName,
    setSelectedVoiceName,
    speak,
    hasSpeechSynthesisSupport,
  }
}
