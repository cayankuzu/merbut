import { useEffect, useRef } from 'react'
import { useAnimations } from '@react-three/drei'
import { LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from 'three'
import type { AnimationState } from '../types/animation'

const CROSSFADE_SECONDS = 0.16

export function useCharacterAnimations(
  root: Object3D,
  clips: AnimationClip[],
  state: AnimationState,
  replayToken = 0,
  presentationDurationSeconds?: number,
) {
  const { actions } = useAnimations(clips, root)
  const currentAction = useRef<AnimationAction | null>(null)
  const currentState = useRef<AnimationState | null>(null)
  const currentReplayToken = useRef<number | null>(null)

  useEffect(() => {
    const clipState = state === 'shield' || state === 'fireball' ? 'attack' : state === 'dead' ? 'idle' : state
    const next = actions[clipState]
    if (!next || (currentState.current === state && currentReplayToken.current === replayToken)) return

    const looping = state === 'idle' || state === 'walk' || state === 'fireball'
    next.enabled = true
    next.paused = false
    next.clampWhenFinished = !looping
    next.setLoop(looping ? LoopRepeat : LoopOnce, looping ? Number.POSITIVE_INFINITY : 1)
    next.timeScale = presentationDurationSeconds && (state === 'attack' || state === 'fireball')
      ? next.getClip().duration / presentationDurationSeconds
      : state === 'walk'
      ? 1.15
      : state === 'jump'
        ? clips.find((clip) => clip.name === 'jump')!.duration / 0.95
        : state === 'fireball'
          ? 1.85
          : state === 'attack' || state === 'shield'
            ? 1.25
            : 1
    next.reset().fadeIn(CROSSFADE_SECONDS).play()
    if (state === 'shield') {
      next.time = Math.min(next.getClip().duration * 0.42, next.getClip().duration - 0.01)
      next.paused = true
    }
    if (state === 'dead') next.paused = true

    if (currentAction.current !== next) currentAction.current?.fadeOut(CROSSFADE_SECONDS)
    currentAction.current = next
    currentState.current = state
    currentReplayToken.current = replayToken
  }, [actions, clips, presentationDurationSeconds, replayToken, state])

  useEffect(
    () => () => {
      for (const action of Object.values(actions)) action?.stop()
    },
    [actions],
  )
}
