import { useMemo } from 'react'

import { xrModes, type XRMode } from '../domain/xr'

type Props = {
  xrMode: XRMode
  isListening: boolean
  isDisabled: boolean
  onToggle: () => void
}

const MIC_LAYOUT_BY_MODE: Record<XRMode, [number, number, number]> = {
  [xrModes.desktop]: [0, 2.4, 3.2],
  [xrModes.vr]: [0, 3.1, 2.4],
  [xrModes.ar]: [0, 1.8, 0.9],
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
        <capsuleGeometry args={[0.13, 0.34, 8, 18]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.45} />
      </mesh>

      <mesh position={[0, -0.36, 0]}>
        <boxGeometry args={[0.11, 0.26, 0.11]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} />
      </mesh>

      <mesh position={[0, -0.57, 0]}>
        <torusGeometry args={[0.2, 0.04, 12, 30]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
