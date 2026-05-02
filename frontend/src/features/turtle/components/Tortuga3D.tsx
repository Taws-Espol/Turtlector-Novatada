import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, LoopRepeat } from 'three'

import type { TurtleAnimationState } from '../domain/types'
import { TURTLE_ACTION_NAMES_BY_STATE } from '../domain/animations'
import { TURTLE_MODEL_BY_STATE } from '../domain/models'

type Props = {
  animationState: TurtleAnimationState
}

const PRELOAD_MODELS = Array.from(new Set(Object.values(TURTLE_MODEL_BY_STATE)))

for (const modelUrl of PRELOAD_MODELS) {
  useGLTF.preload(modelUrl)
}

export default function Tortuga3D({ animationState }: Props) {
  const groupRef = useRef<Group>(null)

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
  const { actions } = useAnimations(currentAnimations, groupRef)

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

  useFrame(() => {
    const targetAction = resolveTargetAction()
    if (targetAction && !targetAction.isRunning()) {
      targetAction.play()
    }
  })

  return (
    <group
      ref={groupRef}
      position={[0, -2, 0]}
      scale={[1.5, 1.5, 1.5]}
      rotation={[0, -Math.PI / 2, 0]}
    >
      <primitive object={currentScene} />
    </group>
  )
}
