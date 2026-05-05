import { useMemo } from 'react'

import { xrModes, type XRMode } from '../domain/xr'

type Props = {
  xrMode: XRMode
  isListening: boolean
  isDisabled: boolean
  onToggle: () => void
}

const MIC_LAYOUT_BY_MODE: Record<XRMode, [number, number, number]> = {
  [xrModes.desktop]: [1.8, -0.8, 0.7],
  [xrModes.vr]: [0.95, -0.55, -1.55],
  [xrModes.ar]: [0.85, -0.45, -0.85],
}

export default function VoiceMic3D({ xrMode, isListening, isDisabled, onToggle }: Props) {
  const color = useMemo(() => {
    if (isDisabled) return '#8b8b95'
    if (isListening) return '#ff4f63'
    return '#2fc7ff'
  }, [isDisabled, isListening])

  const emissive = useMemo(() => {
    if (isDisabled) return '#1e1e2a'
    if (isListening) return '#ff1f49'
    return '#00a5e0'
  }, [isDisabled, isListening])

  const position = MIC_LAYOUT_BY_MODE[xrMode]

  const handleToggle = () => {
    if (isDisabled) return
    onToggle()
  }

  return (
    <group
      position={position}
      onClick={event => {
        event.stopPropagation()
        handleToggle()
      }}
      onPointerDown={event => {
        event.stopPropagation()
      }}
    >
      <mesh>
        <capsuleGeometry args={[0.09, 0.25, 8, 16]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.45} />
      </mesh>

      <mesh position={[0, -0.28, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.08]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} />
      </mesh>

      <mesh position={[0, -0.43, 0]}>
        <torusGeometry args={[0.14, 0.03, 10, 28]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
