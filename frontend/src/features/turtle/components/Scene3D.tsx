import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Loader, OrbitControls } from '@react-three/drei'
import { XR, type XRStore } from '@react-three/xr'

import type { TurtleAnimationState } from '../domain/types'
import { xrModes, type XRMode } from '../domain/xr'
import MetaverseDecor from './MetaverseDecor'
import ThinkingIndicator3D from './ThinkingIndicator3D'
import Tortuga3D from './Tortuga3D'
import VoiceMic3D from './VoiceMic3D'

type Props = {
  animationState: TurtleAnimationState
  xrMode: XRMode
  xrStore: XRStore
  isListening: boolean
  isThinking: boolean
  micDisabled: boolean
  onMicToggle: () => void
  onTurtleInteract?: () => void
}

export default function Scene3D({
  animationState,
  xrMode,
  xrStore,
  isListening,
  isThinking,
  micDisabled,
  onMicToggle,
  onTurtleInteract,
}: Props) {
  const isDesktop = xrMode === xrModes.desktop

  return (
    <div className="scene-3d-container">
      <Canvas camera={{ position: [0, 0, 8], fov: 40 }} style={{ width: '100%', height: '100%' }} shadows>
        <XR store={xrStore}>
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {isDesktop && <Environment preset="sunset" />}

          <MetaverseDecor xrMode={xrMode} />

          <Suspense fallback={null}>
            <Tortuga3D
              animationState={animationState}
              xrMode={xrMode}
              onTurtleInteract={onTurtleInteract}
            />
            <VoiceMic3D
              xrMode={xrMode}
              isListening={isListening}
              isDisabled={micDisabled}
              onToggle={onMicToggle}
            />
            <ThinkingIndicator3D xrMode={xrMode} visible={isThinking} />
          </Suspense>

          {isDesktop && (
            <OrbitControls
              enableZoom
              enablePan={false}
              autoRotate={false}
              target={[0, -1, 0]}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 3}
              minDistance={5}
              maxDistance={15}
            />
          )}
        </XR>
      </Canvas>
      <Loader />
    </div>
  )
}
