import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Loader, OrbitControls } from '@react-three/drei'

import type { TurtleAnimationState } from '../domain/types'
import Tortuga3D from './Tortuga3D'

type Props = {
  animationState: TurtleAnimationState
}

export default function Scene3D({ animationState }: Props) {
  return (
    <div className="scene-3d-container">
      <Canvas camera={{ position: [0, 0, 8], fov: 40 }} style={{ width: '100%', height: '100%' }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        <Environment preset="sunset" />

        <Suspense fallback={null}>
          <Tortuga3D animationState={animationState} />
        </Suspense>

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
      </Canvas>
      <Loader />
    </div>
  )
}
