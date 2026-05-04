import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, LoopRepeat, Matrix4, Quaternion, Vector3 } from 'three'

import type { TurtleAnimationState } from '../domain/types'
import {
  AR_FOLLOW_MAX_DISTANCE,
  AR_FOLLOW_MIN_DISTANCE,
  AR_FOLLOW_POSITION_LERP,
  AR_FOLLOW_ROTATION_LERP,
  AR_FOLLOW_TARGET_DISTANCE,
  AR_FOLLOW_VERTICAL_OFFSET,
  AR_REACQUIRE_DISTANCE,
  AR_REACQUIRE_FORWARD_DOT,
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

export default function Tortuga3D({ animationState, xrMode, onTurtleInteract }: Props) {
  const groupRef = useRef<Group>(null)
  const arForwardRef = useRef(new Vector3())
  const arToTurtleRef = useRef(new Vector3())
  const arTargetRef = useRef(new Vector3())
  const arLookTargetRef = useRef(new Vector3())
  const arQuaternionRef = useRef(new Quaternion())
  const arLookAtMatrixRef = useRef(new Matrix4())

  const standby = useGLTF(TURTLE_MODEL_BY_STATE.standby)
  const listening = useGLTF(TURTLE_MODEL_BY_STATE.listening)
  const speaking = useGLTF(TURTLE_MODEL_BY_STATE.speaking)

  const sceneByState = useMemo(
    () => ({
      standby: standby.scene.clone(),
      listening: listening.scene.clone(),
      speaking: speaking.scene.clone(),
    }),
    [listening.scene, speaking.scene, standby.scene],
  )

  const animationsByState = useMemo(
    () => ({
      standby: standby.animations,
      listening: listening.animations,
      speaking: speaking.animations,
    }),
    [listening.animations, speaking.animations, standby.animations],
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

      arToTurtleRef.current.copy(groupRef.current.position).sub(camera.position)
      const currentDistance = arToTurtleRef.current.length()
      const forwardAlignment =
        currentDistance > 0.0001
          ? arToTurtleRef.current.normalize().dot(arForwardRef.current)
          : 1

      const shouldReacquire =
        !Number.isFinite(currentDistance) ||
        currentDistance > AR_REACQUIRE_DISTANCE ||
        forwardAlignment < AR_REACQUIRE_FORWARD_DOT

      const nextDistance = shouldReacquire
        ? AR_FOLLOW_TARGET_DISTANCE
        : Math.min(
            AR_FOLLOW_MAX_DISTANCE,
            Math.max(AR_FOLLOW_MIN_DISTANCE, currentDistance || AR_FOLLOW_TARGET_DISTANCE),
          )

      arTargetRef.current.copy(camera.position).add(arForwardRef.current.multiplyScalar(nextDistance))
      arTargetRef.current.y += AR_FOLLOW_VERTICAL_OFFSET

      groupRef.current.position.lerp(arTargetRef.current, AR_FOLLOW_POSITION_LERP)

      arLookTargetRef.current.copy(camera.position)
      arLookTargetRef.current.y = groupRef.current.position.y

      arLookAtMatrixRef.current.lookAt(
        groupRef.current.position,
        arLookTargetRef.current,
        groupRef.current.up,
      )
      arQuaternionRef.current.setFromRotationMatrix(arLookAtMatrixRef.current)
      groupRef.current.quaternion.slerp(arQuaternionRef.current, AR_FOLLOW_ROTATION_LERP)
      groupRef.current.rotateY(Math.PI)
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
        if (xrMode === xrModes.ar) {
          onTurtleInteract?.()
        }
      }}
    >
      <primitive object={currentScene} />
    </group>
  )
}
