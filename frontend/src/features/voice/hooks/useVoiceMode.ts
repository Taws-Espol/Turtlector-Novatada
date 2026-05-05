export type VoiceMode = 'native' | 'backend_audio'

export function useVoiceMode(
  browserSupportsSpeechRecognition: boolean,
  hasSpeechSynthesisSupport: boolean,
): VoiceMode {
  if (!browserSupportsSpeechRecognition || !hasSpeechSynthesisSupport) {
    return 'backend_audio'
  }
  return 'native'
}
