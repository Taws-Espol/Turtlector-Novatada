import { useEffect, useMemo, useRef } from 'react'
import type { MouseEvent } from 'react'

import ChatPanel from './features/chat/components/ChatPanel'
import { useChatFlow } from './features/chat/hooks/useChatFlow'
import type { ChatMessage } from './features/chat/types'
import Scene3D from './features/turtle/components/Scene3D'
import { turtleAnimationStates } from './features/turtle/domain/types'
import { xrModes } from './features/turtle/domain/xr'
import { useXRSession } from './features/turtle/hooks/useXRSession'
import { useMicrophone } from './features/voice/hooks/useMicrophone'
import { useSpeechSynthesis } from './features/voice/hooks/useSpeechSynthesis'
import { useAudioRecorder } from './features/voice/hooks/useAudioRecorder'
import { useBackendAudioPlayer } from './features/voice/hooks/useBackendAudioPlayer'
import { useVoiceMode } from './features/voice/hooks/useVoiceMode'
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
  const { isSupported: recorderSupported, isRecording, startRecording, stopRecording } =
    useAudioRecorder()
  const { isPlaying: isBackendPlaying, playFromBase64 } = useBackendAudioPlayer()

  const voiceMode = useVoiceMode(browserSupportsSpeechRecognition, hasSpeechSynthesisSupport)
  const canUseBackendAudio = voiceMode === 'backend_audio' && recorderSupported

  const { submitUserMessage, submitUserAudio, chatState } = useChatFlow({
    voiceMode,
    speak,
    playBackendAudio: audioB64 => playFromBase64(audioB64),
  })
  const { xrMode, xrStore, support, status, error, enterVR, enterAR, exitXR } = useXRSession()

  const arListeningTriggeredRef = useRef(false)
  const previousListeningRef = useRef(false)

  const turtleAnimationState = useMemo(() => {
    if (listening || isRecording || chatState.requestStatus === 'loading') {
      return turtleAnimationStates.listening
    }

    if (chatState.isSpeaking || isBackendPlaying) {
      return turtleAnimationStates.speaking
    }

    return turtleAnimationStates.standby
  }, [chatState.isSpeaking, chatState.requestStatus, isBackendPlaying, isRecording, listening])

  const lastAssistantMessage = useMemo(() => {
    for (let i = chatState.messages.length - 1; i >= 0; i -= 1) {
      const candidate: ChatMessage = chatState.messages[i]
      if (candidate.role === 'assistant') {
        return candidate.text
      }
    }

    return 'No hay respuesta aún.'
  }, [chatState.messages])

  const arConversationStatus = useMemo(() => {
    if (xrMode !== xrModes.ar) return ''
    if (chatState.requestStatus === 'loading') return 'Pensando...'
    if (chatState.isSpeaking || isBackendPlaying) return 'Tortuga hablando...'
    if (listening || isRecording) return 'Escuchando...'
    return 'Toca la tortuga para hablar'
  }, [chatState.isSpeaking, chatState.requestStatus, isBackendPlaying, isRecording, listening, xrMode])

  const handleMicrophoneClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    if (voiceMode === 'backend_audio') {
      if (!canUseBackendAudio) return
      if (!isRecording) {
        await startRecording()
        return
      }

      const payload = await stopRecording()
      if (!payload) return
      await submitUserAudio(payload)
      return
    }

    if (!listening) {
      startListening({ continuous: true, language: 'es-ES' })
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

  const handleARTurtleInteract = () => {
    if (xrMode !== xrModes.ar) return
    if (listening || chatState.requestStatus === 'loading' || chatState.isSpeaking || isBackendPlaying) {
      return
    }

    arListeningTriggeredRef.current = true
    if (voiceMode === 'backend_audio') {
      if (!canUseBackendAudio) return
      if (!isRecording) {
        void startRecording()
        return
      }

      arListeningTriggeredRef.current = false
      void stopRecording().then(payload => {
        if (!payload) return
        void submitUserAudio(payload)
      })
      return
    }

    resetTranscript()
    startListening({ continuous: false, language: 'es-ES' })
  }

  useEffect(() => {
    const wasListening = previousListeningRef.current
    previousListeningRef.current = listening

    if (xrMode !== xrModes.ar) {
      arListeningTriggeredRef.current = false
      return
    }

    if (voiceMode === 'backend_audio') return
    if (!wasListening || listening) return
    if (!arListeningTriggeredRef.current) return

    arListeningTriggeredRef.current = false

    const text = transcript.trim()
    if (!text) {
      resetTranscript()
      return
    }

    void submitUserMessage(text)
    resetTranscript()
  }, [listening, resetTranscript, submitUserMessage, transcript, voiceMode, xrMode])

  return (
    <div className="turtlector-app">
      <div className="header-edge" />

      <header className="header">
        <div className="brand">
          <div className="logo-ring">
            <div className="logo-dot" />
          </div>
          <div>
            <h1 className="app-title">Turtlector</h1>
            <p className="conversation-id">
              Conversation ID: {chatState.conversationId || 'not started'}
            </p>
          </div>
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

      <div className="xr-toolbar">
        <div className="xr-actions">
          <button
            className="xr-btn"
            onClick={() => {
              void enterVR()
            }}
            disabled={!support.vrSupported || status === 'starting' || status === 'ending'}
          >
            Enter VR
          </button>
          <button
            className="xr-btn"
            onClick={() => {
              void enterAR()
            }}
            disabled={!support.arSupported || status === 'starting' || status === 'ending'}
          >
            Enter AR
          </button>
          <button
            className="xr-btn xr-btn-secondary"
            onClick={() => {
              void exitXR()
            }}
            disabled={xrMode === xrModes.desktop || status === 'starting' || status === 'ending'}
          >
            Exit XR
          </button>
        </div>
        <p className="xr-status">
          XR Mode: {xrMode.toUpperCase()} | Status: {status}
          {!support.secureContext ? ' | Requires HTTPS or localhost' : ''}
          {error ? ` | ${error}` : ''}
        </p>
      </div>

      {xrMode === xrModes.ar && (
        <section className="ar-overlay" aria-live="polite">
          <p className="ar-overlay-status">{arConversationStatus}</p>
          <p className="ar-overlay-message">{lastAssistantMessage}</p>
        </section>
      )}

      <main className="main-content">
        <div className="layout-chat">
          <aside className="left-col">
            <div className="tortuga-3d-container">
              <Scene3D
                animationState={turtleAnimationState}
                xrMode={xrMode}
                xrStore={xrStore}
                onTurtleInteract={handleARTurtleInteract}
              />
            </div>
          </aside>

          <ChatPanel
            messages={chatState.messages}
            listening={listening || isRecording}
            showVoiceSelector={voiceMode === 'native'}
            voices={voices}
            selectedVoiceName={selectedVoiceName}
            onVoiceChange={setSelectedVoiceName}
          />
        </div>

        <button
          className={`microphone-button ${listening || isRecording ? 'recording' : ''}`}
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
