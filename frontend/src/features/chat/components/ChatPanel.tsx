import { useEffect, useRef } from 'react'

import type { ChatMessage } from '../types'

type Props = {
  messages: ChatMessage[]
  listening: boolean
  voices: SpeechSynthesisVoice[]
  selectedVoiceName: string
  onVoiceChange: (voiceName: string) => void
}

export default function ChatPanel({
  messages,
  listening,
  voices,
  selectedVoiceName,
  onVoiceChange,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  return (
    <section className="chat-panel">
      <div className="voice-selector-row">
        <label className="voice-selector-label" htmlFor="voiceSelect">
          Voz de la tortuga
        </label>
        <select
          id="voiceSelect"
          className="voice-selector"
          value={selectedVoiceName}
          onChange={e => onVoiceChange(e.target.value)}
          disabled={voices.length === 0}
        >
          {voices.map(voice => (
            <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </select>
      </div>

      <div className="chat-header">
        <span className="chat-title">Chat</span>
        <span className={`chat-dot ${listening ? 'on' : ''}`} />
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">Empieza a hablar con el micrófono para enviar tu mensaje.</div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`bubble-row ${m.role}`}>
              <div className={`bubble ${m.role}`}>
                <p>{m.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
