import standbyModelUrl from '../../../assets/models/tortuga.glb'
import listeningModelUrl from '../../../assets/models/cargando.glb'
import speakingModelUrl from '../../../assets/models/MANO.glb'

import { turtleAnimationStates, type TurtleAnimationState } from './types'

export const TURTLE_MODEL_BY_STATE: Record<TurtleAnimationState, string> = {
  [turtleAnimationStates.standby]: standbyModelUrl,
  [turtleAnimationStates.listening]: listeningModelUrl,
  [turtleAnimationStates.speaking]: speakingModelUrl,
}
