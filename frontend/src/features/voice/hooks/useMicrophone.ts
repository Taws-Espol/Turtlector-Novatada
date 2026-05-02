import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

export function useMicrophone() {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

  const startListening = () => {
    SpeechRecognition.startListening({ continuous: true, language: 'es-ES' })
  }

  const stopListening = () => {
    SpeechRecognition.stopListening()
  }

  return {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
  }
}
