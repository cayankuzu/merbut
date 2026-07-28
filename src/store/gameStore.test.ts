import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'

describe('player attack events', () => {
  beforeEach(() => {
    useGameStore.setState({
      animationStates: { ali: 'idle', jack: 'idle' },
      attackSequences: { ali: 0, jack: 0 },
    })
  })

  it('replays consecutive attacks even while the animation state stays attack', () => {
    useGameStore.getState().triggerPlayerAttack('ali')
    useGameStore.getState().triggerPlayerAttack('ali')

    expect(useGameStore.getState().animationStates.ali).toBe('attack')
    expect(useGameStore.getState().attackSequences.ali).toBe(2)
  })

  it('keeps both players attack streams independent', () => {
    useGameStore.getState().triggerPlayerAttack('jack')

    expect(useGameStore.getState().attackSequences).toEqual({ ali: 0, jack: 1 })
  })
})
