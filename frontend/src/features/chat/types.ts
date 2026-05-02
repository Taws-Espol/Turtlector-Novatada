export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  ts: number
}

export type ChatSendRequest = {
  message: string
  conversation_id?: string
}

export type ChatSendResponse = {
  response: string
  conversation_id: string
}
