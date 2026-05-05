import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'

import { xrModes, type XRMode } from '../domain/xr'

type Props = {
  xrMode: XRMode
  visible: boolean
}

const THINKING_POSITION_BY_MODE: Record<XRMode, [number, number, number]> = {
  [xrModes.desktop]: [0, 1.0, 0.3],
  [xrModes.vr]: [0, 0.8, -1.8],
  [xrModes.ar]: [0, 0.7, -1.05],
}

const DOT_COLORS = ['#4ee8ff', '#ffdd57', '#8effa1']

export default function ThinkingIndicator3D({ xrMode, visible }: Props) {
  const containerRef = useRef<Group>(null)
  const dotRefs = useRef<Array<Group | null>>([])

  const position = THINKING_POSITION_BY_MODE[xrMode]
  const radii = useMemo(() => [0.18, 0.25, 0.32], [])

  useFrame(({ clock }) => {
    if (!visible || !containerRef.current) return
    const t = clock.getElapsedTime()

    containerRef.current.rotation.y = t * 1.8
    dotRefs.current.forEach((dot, idx) => {
      if (!dot) return
      const bob = Math.sin(t * 4 + idx) * 0.03
      dot.position.y = bob
    })
  })

  if (!visible) return null

  return (
    <group ref={containerRef} position={position}>
      {radii.map((radius, idx) => (
        <group
          key={`thinking-dot-${idx}`}
          ref={node => {
            dotRefs.current[idx] = node
          }}
          position={[
            Math.cos((idx / radii.length) * Math.PI * 2) * radius,
            0,
            Math.sin((idx / radii.length) * Math.PI * 2) * radius,
          ]}
        >
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial
              color={DOT_COLORS[idx]}
              emissive={DOT_COLORS[idx]}
              emissiveIntensity={0.85}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
