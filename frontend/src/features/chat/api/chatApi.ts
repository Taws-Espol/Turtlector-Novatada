import type { ChatSendRequest, ChatSendResponse } from '../types'

export async function sendChatMessage(apiUrl: string, payload: ChatSendRequest) {
  const res = await fetch(`${apiUrl}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }

  return (await res.json()) as ChatSendResponse
}
