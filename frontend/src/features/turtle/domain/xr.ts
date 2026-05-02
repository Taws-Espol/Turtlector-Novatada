export const xrModes = {
  desktop: 'desktop',
  vr: 'vr',
  ar: 'ar',
} as const

export type XRMode = (typeof xrModes)[keyof typeof xrModes]

export type XRSessionStatus = 'idle' | 'starting' | 'active' | 'ending' | 'error'

export type XRSupport = {
  secureContext: boolean
  hasXR: boolean
  vrSupported: boolean
  arSupported: boolean
}
