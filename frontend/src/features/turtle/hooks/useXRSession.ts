import { createXRStore, type XRStore } from '@react-three/xr'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { xrModes, type XRMode, type XRSessionStatus, type XRSupport } from '../domain/xr'

type UseXRSessionResult = {
  xrMode: XRMode
  xrStore: XRStore
  support: XRSupport
  status: XRSessionStatus
  error: string
  enterVR: () => Promise<void>
  enterAR: () => Promise<void>
  exitXR: () => Promise<void>
}

const DEFAULT_SUPPORT: XRSupport = {
  secureContext: typeof window !== 'undefined' ? window.isSecureContext : true,
  hasXR: false,
  vrSupported: false,
  arSupported: false,
}

export function useXRSession(): UseXRSessionResult {
  const xrStore = useMemo(() => createXRStore({ emulate: false }), [])
  const [xrMode, setXRMode] = useState<XRMode>(xrModes.desktop)
  const [status, setStatus] = useState<XRSessionStatus>('idle')
  const [error, setError] = useState('')
  const [support, setSupport] = useState<XRSupport>(DEFAULT_SUPPORT)
  const sessionRef = useRef<XRSession | null>(null)

  const bindSessionEnd = useCallback((session: XRSession) => {
    sessionRef.current = session

    const handleSessionEnd = () => {
      sessionRef.current = null
      setXRMode(xrModes.desktop)
      setStatus('idle')
    }

    session.addEventListener('end', handleSessionEnd, { once: true })
  }, [])

  useEffect(() => {
    let cancelled = false

    const checkSupport = async () => {
      const secureContext = typeof window === 'undefined' ? true : window.isSecureContext

      if (typeof navigator === 'undefined' || !('xr' in navigator) || !navigator.xr) {
        if (!cancelled) {
          setSupport({
            secureContext,
            hasXR: false,
            vrSupported: false,
            arSupported: false,
          })
        }
        return
      }

      try {
        const [vrSupported, arSupported] = await Promise.all([
          navigator.xr.isSessionSupported('immersive-vr'),
          navigator.xr.isSessionSupported('immersive-ar'),
        ])

        if (!cancelled) {
          setSupport({
            secureContext,
            hasXR: true,
            vrSupported,
            arSupported,
          })
        }
      } catch {
        if (!cancelled) {
          setSupport({
            secureContext,
            hasXR: true,
            vrSupported: false,
            arSupported: false,
          })
        }
      }
    }

    void checkSupport()

    return () => {
      cancelled = true
    }
  }, [])

  const enterVR = useCallback(async () => {
    if (!support.secureContext) {
      setError('WebXR requiere HTTPS o localhost para iniciar VR.')
      setStatus('error')
      return
    }

    if (!support.vrSupported) {
      setError('VR no está disponible en este navegador/dispositivo.')
      setStatus('error')
      return
    }

    setStatus('starting')
    setError('')

    try {
      const session = await xrStore.enterVR()
      if (!session) {
        setStatus('error')
        setError('No se pudo iniciar la sesión VR.')
        return
      }

      bindSessionEnd(session)
      setXRMode(xrModes.vr)
      setStatus('active')
    } catch {
      setStatus('error')
      setError('Falló el inicio de la sesión VR.')
    }
  }, [bindSessionEnd, support.secureContext, support.vrSupported, xrStore])

  const enterAR = useCallback(async () => {
    if (!support.secureContext) {
      setError('WebXR requiere HTTPS o localhost para iniciar AR.')
      setStatus('error')
      return
    }

    if (!support.arSupported) {
      setError('AR no está disponible en este navegador/dispositivo.')
      setStatus('error')
      return
    }

    setStatus('starting')
    setError('')

    try {
      const session = await xrStore.enterAR()
      if (!session) {
        setStatus('error')
        setError('No se pudo iniciar la sesión AR.')
        return
      }

      bindSessionEnd(session)
      setXRMode(xrModes.ar)
      setStatus('active')
    } catch {
      setStatus('error')
      setError('Falló el inicio de la sesión AR.')
    }
  }, [bindSessionEnd, support.arSupported, support.secureContext, xrStore])

  const exitXR = useCallback(async () => {
    if (!sessionRef.current) {
      setXRMode(xrModes.desktop)
      setStatus('idle')
      return
    }

    setStatus('ending')

    try {
      await sessionRef.current.end()
      sessionRef.current = null
      setXRMode(xrModes.desktop)
      setStatus('idle')
    } catch {
      setStatus('error')
      setError('No se pudo finalizar la sesión XR.')
    }
  }, [])

  return {
    xrMode,
    xrStore,
    support,
    status,
    error,
    enterVR,
    enterAR,
    exitXR,
  }
}
