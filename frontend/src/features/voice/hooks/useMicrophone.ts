import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'

type StartListeningOptions = {
  continuous?: boolean
  language?: string
}

export function useMicrophone() {
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

  const startListening = (options?: StartListeningOptions) => {
    SpeechRecognition.startListening({
      continuous: options?.continuous ?? true,
      language: options?.language ?? 'es-ES',
    })
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
