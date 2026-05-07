import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, LoopRepeat, Vector3 } from 'three'

import type { TurtleAnimationState } from '../domain/types'
import {
  AR_CAMERA_RELATIVE_DISTANCE,
  AR_CAMERA_RELATIVE_VERTICAL_OFFSET,
  AR_CAMERA_RELATIVE_YAW_OFFSET,
} from '../const/ar'
import { TURTLE_ACTION_NAMES_BY_STATE } from '../domain/animations'
import { TURTLE_MODEL_BY_STATE } from '../domain/models'
import { xrModes, type XRMode } from '../domain/xr'

type Props = {
  animationState: TurtleAnimationState
  xrMode: XRMode
  onTurtleInteract?: () => void
}

const PRELOAD_MODELS = Array.from(new Set(Object.values(TURTLE_MODEL_BY_STATE)))

for (const modelUrl of PRELOAD_MODELS) {
  useGLTF.preload(modelUrl)
}

const TURTLE_LAYOUT_BY_MODE: Record<XRMode, { position: [number, number, number]; scale: [number, number, number] }> = {
  [xrModes.desktop]: {
    position: [0, -2, 0],
    scale: [1.5, 1.5, 1.5],
  },
  [xrModes.vr]: {
    position: [0, -1.35, -2.1],
    scale: [0.95, 0.95, 0.95],
  },
  [xrModes.ar]: {
    position: [0, -1.1, -1.3],
    scale: [0.8, 0.8, 0.8],
  },
}

export default function Tortuga3D({
  animationState,
  xrMode,
  onTurtleInteract,
}: Props) {
  const groupRef = useRef<Group>(null)
  const arForwardRef = useRef(new Vector3())
  const arTargetRef = useRef(new Vector3())

  const standby = useGLTF(TURTLE_MODEL_BY_STATE.standby)
  const listening = useGLTF(TURTLE_MODEL_BY_STATE.listening)
  const thinking = useGLTF(TURTLE_MODEL_BY_STATE.thinking)
  const speaking = useGLTF(TURTLE_MODEL_BY_STATE.speaking)

  const sceneByState = useMemo(
    () => ({
      standby: standby.scene.clone(),
      listening: listening.scene.clone(),
      thinking: thinking.scene.clone(),
      speaking: speaking.scene.clone(),
    }),
    [listening.scene, speaking.scene, standby.scene, thinking.scene],
  )

  const animationsByState = useMemo(
    () => ({
      standby: standby.animations,
      listening: listening.animations,
      thinking: thinking.animations,
      speaking: speaking.animations,
    }),
    [listening.animations, speaking.animations, standby.animations, thinking.animations],
  )

  const currentScene = sceneByState[animationState]
  const currentAnimations = animationsByState[animationState]
  const { actions } = useAnimations(currentAnimations, groupRef as never)

  const resolveTargetAction = () => {
    if (!actions || Object.keys(actions).length === 0) return null

    const preferredClipNames = TURTLE_ACTION_NAMES_BY_STATE[animationState]
    return (
      preferredClipNames.map(name => actions[name]).find(action => action) ||
      Object.values(actions)[0] ||
      null
    )
  }

  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return

    Object.values(actions).forEach(action => action?.stop())

    const targetAction = resolveTargetAction()
    if (!targetAction) return

    targetAction.reset()
    targetAction.setLoop(LoopRepeat, Infinity)
    targetAction.setEffectiveWeight(1)
    targetAction.setEffectiveTimeScale(1)
    targetAction.play()
  }, [actions, animationState])

  useFrame(({ camera }) => {
    if (xrMode === xrModes.ar && groupRef.current) {
      camera.getWorldDirection(arForwardRef.current)
      arTargetRef.current
        .copy(camera.position)
        .add(arForwardRef.current.multiplyScalar(AR_CAMERA_RELATIVE_DISTANCE))
      arTargetRef.current.y += AR_CAMERA_RELATIVE_VERTICAL_OFFSET

      groupRef.current.position.copy(arTargetRef.current)
      groupRef.current.quaternion.copy(camera.quaternion)
      groupRef.current.rotateY(Math.PI + AR_CAMERA_RELATIVE_YAW_OFFSET)
    }

    const targetAction = resolveTargetAction()
    if (targetAction && !targetAction.isRunning()) {
      targetAction.play()
    }
  })

  const layout = TURTLE_LAYOUT_BY_MODE[xrMode]

  return (
    <group
      ref={groupRef}
      position={layout.position}
      scale={layout.scale}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={() => {
        if (xrMode === xrModes.vr) {
          onTurtleInteract?.()
        }
      }}
    >
      <primitive object={currentScene} />
    </group>
  )
}
