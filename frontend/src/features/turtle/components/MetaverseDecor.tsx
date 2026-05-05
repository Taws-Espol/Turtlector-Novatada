import { Text } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color, Group } from 'three'

import {
  METAVERSE_MODE_CONFIG,
  METAVERSE_NEON_COLORS,
  METAVERSE_RADIUS,
  SOLAR_COLORS,
} from '../const/metaverse'
import type { XRMode } from '../domain/xr'

type Props = {
  xrMode: XRMode
}

type TransformItem = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
  speed: number
  color: string
}

type PlanetItem = {
  radius: number
  size: number
  speed: number
  phase: number
  y: number
  color: string
}

function createSeededRandom(seed: number) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function createTransforms(count: number, seed: number, scaleBase: number): TransformItem[] {
  const rand = createSeededRandom(seed)

  return Array.from({ length: count }, () => {
    const radius = METAVERSE_RADIUS.min + rand() * (METAVERSE_RADIUS.max - METAVERSE_RADIUS.min)
    const theta = rand() * Math.PI * 2
    const y = -1.6 + rand() * 4.2

    const x = Math.cos(theta) * radius
    const z = Math.sin(theta) * radius

    const scale = scaleBase * (0.7 + rand() * 1.4)

    return {
      position: [x, y, z],
      rotation: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI],
      scale: [scale, scale, scale],
      speed: 0.18 + rand() * 0.5,
      color: METAVERSE_NEON_COLORS[Math.floor(rand() * METAVERSE_NEON_COLORS.length)],
    }
  })
}

function createPointCloud(count: number, seed: number) {
  const rand = createSeededRandom(seed)
  const geometry = new BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i += 1) {
    const radius = METAVERSE_RADIUS.min + rand() * (METAVERSE_RADIUS.max + 1.8)
    const theta = rand() * Math.PI * 2
    const phi = Math.acos(2 * rand() - 1)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const y = radius * Math.cos(phi)
    const z = radius * Math.sin(phi) * Math.sin(theta)

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z

    const color = new Color(METAVERSE_NEON_COLORS[Math.floor(rand() * METAVERSE_NEON_COLORS.length)])
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))

  return geometry
}

function createPlanets(count: number, seed: number): PlanetItem[] {
  const rand = createSeededRandom(seed)

  return Array.from({ length: count }, (_, idx) => {
    const orbitBand = 2.1 + idx * 0.42 + rand() * 0.28
    return {
      radius: orbitBand,
      size: 0.12 + rand() * 0.17,
      speed: 0.08 + rand() * 0.24,
      phase: rand() * Math.PI * 2,
      y: -0.2 + rand() * 1.2,
      color: SOLAR_COLORS[Math.floor(rand() * SOLAR_COLORS.length)],
    }
  })
}

export default function MetaverseDecor({ xrMode }: Props) {
  const modeConfig = METAVERSE_MODE_CONFIG[xrMode]

  const ringRefs = useRef<Array<Group | null>>([])
  const shardRefs = useRef<Array<Group | null>>([])
  const pillarRefs = useRef<Array<Group | null>>([])
  const planetRefs = useRef<Array<Group | null>>([])
  const textRingRef = useRef<Group>(null)

  const ringTransforms = useMemo(() => createTransforms(modeConfig.rings, 101, 0.85), [modeConfig.rings])
  const shardTransforms = useMemo(() => createTransforms(modeConfig.shards, 203, 0.4), [modeConfig.shards])
  const pillarTransforms = useMemo(() => createTransforms(modeConfig.pillars, 307, 0.55), [modeConfig.pillars])

  const pointsGeometry = useMemo(() => createPointCloud(modeConfig.points, 409), [modeConfig.points])
  const planets = useMemo(() => createPlanets(modeConfig.planets, 509), [modeConfig.planets])
  const textAnchors = useMemo(() => Array.from({ length: 8 }, (_, idx) => idx), [])
  const farthestDeterministicRadius = METAVERSE_RADIUS.max + 1.8
  const textRingRadius = farthestDeterministicRadius + 0.8

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const motion = modeConfig.motionScale

    ringRefs.current.forEach((node, i) => {
      if (!node) return
      node.rotation.y += 0.0028 * motion
      node.rotation.z = Math.sin(t * 0.24 + i) * 0.22
    })

    shardRefs.current.forEach((node, i) => {
      if (!node) return
      node.rotation.x += 0.005 * motion
      node.rotation.y += 0.0044 * motion
      node.position.y += Math.sin(t * 0.7 + i) * 0.0016 * motion
    })

    pillarRefs.current.forEach((node, i) => {
      if (!node) return
      node.scale.y = Math.max(0.35, 1 + Math.sin(t * 0.8 + i) * 0.22 * motion)
    })

    planetRefs.current.forEach((node, i) => {
      if (!node) return
      const planet = planets[i]
      const orbitAngle = t * planet.speed * motion + planet.phase
      node.position.x = Math.cos(orbitAngle) * planet.radius
      node.position.z = Math.sin(orbitAngle) * planet.radius
      node.position.y = planet.y + Math.sin(t * 0.35 + i) * 0.08
      node.rotation.y += 0.01 * motion
    })

    if (textRingRef.current) {
      textRingRef.current.rotation.y = t * 0.12 * motion
    }
  })

  return (
    <group>
      {ringTransforms.map((item, index) => (
        <group
          key={`ring-${index}`}
          ref={node => {
            ringRefs.current[index] = node
          }}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
        >
          <mesh>
            <torusGeometry args={[0.8, 0.06, 10, 48]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.35} roughness={0.28} metalness={0.15} />
          </mesh>
        </group>
      ))}

      {shardTransforms.map((item, index) => (
        <group
          key={`shard-${index}`}
          ref={node => {
            shardRefs.current[index] = node
          }}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale}
        >
          <mesh>
            <icosahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.22} roughness={0.45} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {pillarTransforms.map((item, index) => (
        <group
          key={`pillar-${index}`}
          ref={node => {
            pillarRefs.current[index] = node
          }}
          position={[item.position[0], -2.1, item.position[2]]}
          rotation={[0, item.rotation[1], 0]}
          scale={[Math.max(0.2, item.scale[0] * 0.45), 1, Math.max(0.2, item.scale[2] * 0.45)]}
        >
          <mesh>
            <cylinderGeometry args={[0.16, 0.22, 2.4, 10]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.3} roughness={0.62} metalness={0.05} />
          </mesh>
        </group>
      ))}

      <points geometry={pointsGeometry}>
        <pointsMaterial size={0.06} vertexColors sizeAttenuation transparent opacity={0.55} />
      </points>

      {/* Lightweight solar-system vibes */}
      <mesh position={[0, 0.2, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#ffe29a" emissive="#ffcf5c" emissiveIntensity={0.65} roughness={0.35} metalness={0.05} />
      </mesh>

      {planets.map((planet, index) => (
        <group
          key={`planet-${index}`}
          ref={node => {
            planetRefs.current[index] = node
          }}
          position={[planet.radius, planet.y, 0]}
        >
          <mesh>
            <sphereGeometry args={[planet.size, 14, 14]} />
            <meshStandardMaterial
              color={planet.color}
              emissive={planet.color}
              emissiveIntensity={0.45}
              roughness={0.36}
              metalness={0.08}
            />
          </mesh>
        </group>
      ))}

      {planets.map((planet, index) => (
        <mesh key={`orbit-${index}`} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.radius - 0.01, planet.radius + 0.01, 80]} />
          <meshBasicMaterial color="#4fc3ff" transparent opacity={0.16} side={2} />
        </mesh>
      ))}

      <group ref={textRingRef} position={[0, 1.1, 0]}>
        {textAnchors.map(index => {
          const angle = (index / textAnchors.length) * Math.PI * 2
          const x = Math.cos(angle) * textRingRadius
          const z = Math.sin(angle) * textRingRadius
          return (
            <group key={`text-orbit-${index}`} position={[x, 0, z]} rotation={[0, angle + Math.PI, 0]}>
              <Text
                fontSize={1.15}
                maxWidth={12}
                anchorX="center"
                anchorY="middle"
                color="#8ef7ff"
                outlineWidth={0.05}
                outlineColor="#04293b"
              >
                MULTIVERSO TAWS
              </Text>
            </group>
          )
        })}
      </group>
    </group>
  )
}
