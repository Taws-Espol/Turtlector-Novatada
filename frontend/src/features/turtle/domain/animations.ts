import { turtleAnimationStates, type TurtleAnimationState } from './types'

const STANDBY_CLIPS = ['Standby', 'idle', 'default'] as const
const LISTENING_CLIPS = ['CARGANDO', 'cargando', 'Jump', 'loading', 'idle', 'default'] as const
const SPEAKING_CLIPS = ['Mano', 'MANO', 'Talking', 'talk', 'speak', 'idle', 'default'] as const

export const TURTLE_ACTION_NAMES_BY_STATE: Record<TurtleAnimationState, readonly string[]> = {
  [turtleAnimationStates.standby]: STANDBY_CLIPS,
  [turtleAnimationStates.listening]: LISTENING_CLIPS,
  [turtleAnimationStates.speaking]: SPEAKING_CLIPS,
}
