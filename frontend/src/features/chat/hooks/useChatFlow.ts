import { useMemo, useState } from 'react'

import { sendChatMessage } from '../api/chatApi'
import type { ChatMessage } from '../types'
import type { VoiceMode } from '../../voice/hooks/useVoiceMode'

const NETWORK_ERROR_MESSAGE = '¡Ups! Hubo un error al comunicarse con la tortuga.'
const VOICE_PLACEHOLDER_MESSAGE = '🎤 Mensaje de voz'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

const API_URL = '/api'

type AudioPayload = {
  audioB64: string
  audioMimeType: string
}

type ChatFlowParams = {
  voiceMode: VoiceMode
  speak: (text: string, onEnd?: () => void) => void
  playBackendAudio: (audioB64: string) => Promise<void>
}

export function useChatFlow({ voiceMode, speak, playBackendAudio }: ChatFlowParams) {
  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle')
  const [isSpeaking, setIsSpeaking] = useState(false)

  const submitUserMessage = async (text: string) => {
    const normalizedText = text.trim()
    if (!normalizedText) return

    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: normalizedText,
        ts: Date.now(),
      },
    ])

    setRequestStatus('loading')

    try {
      const data = await sendChatMessage(API_URL, {
        message: normalizedText,
        conversation_id: conversationId,
      })

      setRequestStatus('success')
      setConversationId(data.conversation_id)

      const responseText = data.response ?? '…'
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: responseText,
          ts: Date.now(),
        },
      ])

      if (typeof data.response === 'string' && data.response.trim()) {
        setIsSpeaking(true)
        speak(data.response, () => {
          setIsSpeaking(false)
        })
      } else {
        setIsSpeaking(false)
      }
    } catch {
      setRequestStatus('error')
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: NETWORK_ERROR_MESSAGE,
          ts: Date.now(),
        },
      ])
      setIsSpeaking(false)
    }
  }

  const submitUserAudio = async ({ audioB64, audioMimeType }: AudioPayload) => {
    if (!audioB64.trim()) return

    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        text: VOICE_PLACEHOLDER_MESSAGE,
        ts: Date.now(),
      },
    ])

    setRequestStatus('loading')

    try {
      const data = await sendChatMessage(API_URL, {
        audio_b64: audioB64,
        audio_mime_type: audioMimeType,
        conversation_id: conversationId,
      })

      setRequestStatus('success')
      setConversationId(data.conversation_id)

      const responseText = data.response ?? '…'
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: responseText,
          ts: Date.now(),
        },
      ])

      if (voiceMode === 'backend_audio' && data.audio_b64?.trim()) {
        setIsSpeaking(true)
        try {
          await playBackendAudio(data.audio_b64)
        } catch {
          // Playback failures should not fail the chat turn.
        }
      }
      setIsSpeaking(false)
    } catch {
      setRequestStatus('error')
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: NETWORK_ERROR_MESSAGE,
          ts: Date.now(),
        },
      ])
      setIsSpeaking(false)
    }
  }

  const chatState = useMemo(
    () => ({
      conversationId,
      messages,
      requestStatus,
      isSpeaking,
    }),
    [conversationId, isSpeaking, messages, requestStatus],
  )

  return { submitUserMessage, submitUserAudio, chatState }
}
