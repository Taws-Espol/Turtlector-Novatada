import { useMemo, useState } from 'react'

import { sendChatMessage } from '../api/chatApi'
import type { ChatMessage } from '../types'

const NETWORK_ERROR_MESSAGE = '¡Ups! Hubo un error al comunicarse con la tortuga.'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

const API_URL = '/api'

export function useChatFlow(speak: (text: string, onEnd?: () => void) => void) {
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

  const chatState = useMemo(
    () => ({
      conversationId,
      messages,
      requestStatus,
      isSpeaking,
    }),
    [conversationId, isSpeaking, messages, requestStatus],
  )

  return { submitUserMessage, chatState }
}
