import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import Scene3D from './components/Scene3D'
import './App.css'

type Msg = {
  id: string
  role: 'user' | 'assistant'
  text: string
  ts: number
}

function App() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition()

  const [conversationId, setConversationId] = useState('')
  const [messages, setMessages] = useState<Msg[]>([])
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState('')
  const [hasUserVoiceSelection, setHasUserVoiceSelection] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
  const hasSpeechSynthesisSupport =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window

  useEffect(() => {
    if (!hasSpeechSynthesisSupport) return

    const synth = window.speechSynthesis

    const chooseVoice = (allVoices: SpeechSynthesisVoice[]) => {
      if (allVoices.length === 0) return ''

      if (hasUserVoiceSelection) {
        const stillExists = allVoices.some(v => v.name === selectedVoiceName)
        if (stillExists) return selectedVoiceName
      }

      const spanishVoice = allVoices.find(v => v.lang.toLowerCase().startsWith('es'))
      if (spanishVoice) return spanishVoice.name

      return allVoices[0].name
    }

    const populateVoices = () => {
      const allVoices = synth.getVoices()
      setVoices(allVoices)
      const nextVoiceName = chooseVoice(allVoices)
      if (nextVoiceName) {
        setSelectedVoiceName(nextVoiceName)
      }
    }

    populateVoices()
    synth.onvoiceschanged = populateVoices

    return () => {
      synth.onvoiceschanged = null
      synth.cancel()
    }
  }, [hasSpeechSynthesisSupport, hasUserVoiceSelection, selectedVoiceName])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const speakText = (text: string) => {
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

    synth.cancel()
    synth.speak(utterance)
  }

  const handleMicrophoneClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (listening) {
      SpeechRecognition.stopListening()

      const text = transcript.trim()
      if (!text) return

      const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', text, ts: Date.now() }
      setMessages(prev => [...prev, userMsg])

      try {
        const res = await fetch(`${API_URL}/chat/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversation_id: conversationId })
        })

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }

        const data = await res.json()

        setConversationId(data.conversation_id)

        const botMsg: Msg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: data.response ?? '…',
          ts: Date.now()
        }

        setMessages(prev => [...prev, botMsg])
        if (typeof data.response === 'string') {
          speakText(data.response)
        }
      } catch (e) {
        const errMsg: Msg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: '¡Ups! Hubo un error al comunicarse con la tortuga.',
          ts: Date.now()
        }
        setMessages(prev => [...prev, errMsg])
      }

      resetTranscript()
    } else {
      SpeechRecognition.startListening({ continuous: true, language: 'es-ES' })
    }
  }

  if (!browserSupportsSpeechRecognition || !hasSpeechSynthesisSupport) {
    return <span>Lo sentimos, tu navegador no soporta el reconocimiento de voz.</span>
  }

  return (
    <div className="turtlector-app">
      <div className="header-edge" />

      <header className="header">
        <div className="brand">
          <div className="logo-ring"><div className="logo-dot" /></div>
          <h1 className="app-title">Turtlector</h1>
        </div>

        <a
          className="pill"
          href="https://taws.espol.edu.ec/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir sitio de TAWS en una nueva pestaña"
        >
          <div className="pill-logo">
            <img src="/taws.svg" width={30} height={30} alt="TAWS"
              onError={(e) => { (e.target as HTMLImageElement).src = '/vite.svg' }} />
          </div>
          <div className="pill-line">BE DIFFERENT&nbsp;&nbsp;BE TAWS</div>
          <span className="pill-dot" />
        </a>
      </header>

      <main className="main-content">
        <div className="layout-chat">
          {/* izquierda: tortuga 3D */}
          <aside className="left-col">
            <div className="tortuga-3d-container">
              <Scene3D animationState={listening ? 'loading' : 'standby'} />
            </div>
          </aside>

          {/* derecha: chat */}
          <section className="chat-panel">
            <div className="voice-selector-row">
              <label className="voice-selector-label" htmlFor="voiceSelect">Voz de la tortuga</label>
              <select
                id="voiceSelect"
                className="voice-selector"
                value={selectedVoiceName}
                onChange={(e) => {
                  setSelectedVoiceName(e.target.value)
                  setHasUserVoiceSelection(true)
                }}
                disabled={voices.length === 0}
              >
                {voices.map((voice) => (
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
                <div className="chat-empty">
                  Empieza a hablar con el micrófono para enviar tu mensaje.
                </div>
              ) : messages.map(m => (
                <div key={m.id} className={`bubble-row ${m.role}`}>
                  <div className={`bubble ${m.role}`}>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <button
          className={`microphone-button ${listening ? 'recording' : ''}`}
          onClick={handleMicrophoneClick}
        >
          <svg className="microphone-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z" fill="white" />
            <path d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z" fill="white" />
            <path d="M11 22H13V24H11V22Z" fill="white" />
          </svg>
        </button>
      </main>

      <div className="footer-edge" />
      <footer className="footer">
        <span>© 2025 TAWS — Todos los derechos reservados.</span>
      </footer>
    </div>
  )
}

export default App
