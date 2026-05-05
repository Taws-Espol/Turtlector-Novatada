export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  ts: number
}

export type ChatSendRequest = {
  message?: string
  audio_b64?: string
  audio_mime_type?: string
  conversation_id?: string
}

export type ChatSendResponse = {
  response: string
  conversation_id: string
  audio_b64?: string
}
