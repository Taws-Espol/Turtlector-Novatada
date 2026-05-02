import { useMemo } from 'react'
import type { MouseEvent } from 'react'

import ChatPanel from './features/chat/components/ChatPanel'
import { useChatFlow } from './features/chat/hooks/useChatFlow'
import Scene3D from './features/turtle/components/Scene3D'
import { turtleAnimationStates } from './features/turtle/domain/types'
import { useMicrophone } from './features/voice/hooks/useMicrophone'
import { useSpeechSynthesis } from './features/voice/hooks/useSpeechSynthesis'
import './App.css'

function App() {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    startListening,
    stopListening,
  } = useMicrophone()

  const { voices, selectedVoiceName, setSelectedVoiceName, speak, hasSpeechSynthesisSupport } =
    useSpeechSynthesis()

  const { submitUserMessage, chatState } = useChatFlow(speak)

  const turtleAnimationState = useMemo(() => {
    if (listening || chatState.requestStatus === 'loading') {
      return turtleAnimationStates.listening
    }

    if (chatState.isSpeaking) {
      return turtleAnimationStates.speaking
    }

    return turtleAnimationStates.standby
  }, [chatState.isSpeaking, chatState.requestStatus, listening])

  const handleMicrophoneClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (!listening) {
      startListening()
      return
    }

    stopListening()

    const text = transcript.trim()
    if (!text) {
      resetTranscript()
      return
    }

    await submitUserMessage(text)
    resetTranscript()
  }

  if (!browserSupportsSpeechRecognition || !hasSpeechSynthesisSupport) {
    return <span>Lo sentimos, tu navegador no soporta el reconocimiento de voz.</span>
  }

  return (
    <div className="turtlector-app">
      <div className="header-edge" />

      <header className="header">
        <div className="brand">
          <div className="logo-ring">
            <div className="logo-dot" />
          </div>
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
            <img
              src="/taws.svg"
              width={30}
              height={30}
              alt="TAWS"
              onError={e => {
                ;(e.target as HTMLImageElement).src = '/vite.svg'
              }}
            />
          </div>
          <div className="pill-line">BE DIFFERENT  BE TAWS</div>
          <span className="pill-dot" />
        </a>
      </header>

      <main className="main-content">
        <div className="layout-chat">
          <aside className="left-col">
            <div className="tortuga-3d-container">
              <Scene3D animationState={turtleAnimationState} />
            </div>
          </aside>

          <ChatPanel
            messages={chatState.messages}
            listening={listening}
            voices={voices}
            selectedVoiceName={selectedVoiceName}
            onVoiceChange={setSelectedVoiceName}
          />
        </div>

        <button
          className={`microphone-button ${listening ? 'recording' : ''}`}
          onClick={handleMicrophoneClick}
        >
          <svg className="microphone-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
              fill="white"
            />
            <path
              d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10H7V12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12V10H19Z"
              fill="white"
            />
            <path d="M11 22H13V24H11V22Z" fill="white" />
          </svg>
        </button>
      </main>

      <div className="footer-edge" />
      <footer className="footer">
        <span>© 2025 TAWS - Todos los derechos reservados.</span>
      </footer>
    </div>
  )
}

export default App
