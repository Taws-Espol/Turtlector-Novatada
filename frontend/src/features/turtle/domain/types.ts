export const turtleAnimationStates = {
  standby: 'standby',
  listening: 'listening',
  speaking: 'speaking',
} as const

export type TurtleAnimationState =
  (typeof turtleAnimationStates)[keyof typeof turtleAnimationStates]
