import type { XRMode } from '../domain/xr'

export type MetaverseModeConfig = {
  rings: number
  shards: number
  pillars: number
  points: number
  planets: number
  motionScale: number
}

export const METAVERSE_MODE_CONFIG: Record<XRMode, MetaverseModeConfig> = {
  desktop: {
    rings: 5,
    shards: 20,
    pillars: 10,
    points: 140,
    planets: 7,
    motionScale: 1,
  },
  vr: {
    rings: 4,
    shards: 14,
    pillars: 8,
    points: 90,
    planets: 5,
    motionScale: 0.8,
  },
  ar: {
    rings: 2,
    shards: 8,
    pillars: 5,
    points: 40,
    planets: 3,
    motionScale: 0.45,
  },
}

export const METAVERSE_NEON_COLORS = ['#3fe0ff', '#7af3ff', '#34c7ff', '#54f0d8'] as const
export const SOLAR_COLORS = [
  '#ffb347',
  '#ff6b6b',
  '#ffd166',
  '#4ecdc4',
  '#6ecbff',
  '#a78bfa',
  '#f472b6',
] as const

export const METAVERSE_RADIUS = {
  min: 2.2,
  max: 7.2,
}
