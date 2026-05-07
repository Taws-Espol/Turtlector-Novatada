export const turtleAnimationStates = {
  standby: 'standby',
  listening: 'listening',
  thinking: 'thinking',
  speaking: 'speaking',
} as const

export type TurtleAnimationState =
  (typeof turtleAnimationStates)[keyof typeof turtleAnimationStates]
