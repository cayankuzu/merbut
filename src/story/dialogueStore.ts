import { create } from 'zustand'
import { useSettingsStore } from '../store/settingsStore'
import type { Line } from './script'

/**
 * A tiny subtitle queue. Scenes (story beats) outrank barks (reactions);
 * nothing ever pauses the fight, so a line waits its turn or is dropped.
 */
export interface QueuedLine extends Line {
  id: number
  priority: 'scene' | 'bark'
}

interface DialogueState {
  current: (QueuedLine & { startedAt: number; duration: number }) | null
  queue: QueuedLine[]
  say: (lines: readonly Line[], priority: QueuedLine['priority']) => void
  next: () => void
  clear: () => void
}

let sequence = 0
const CHARS_PER_SECOND = { slow: 22, normal: 34, fast: 55, instant: 400 } as const

export function lineDuration(text: string) {
  const speed = CHARS_PER_SECOND[useSettingsStore.getState().dialogueSpeed]
  return Math.max(2_300, (text.length / speed) * 1_000 + 1_500)
}

function begin(line: QueuedLine | undefined) {
  return line ? { ...line, startedAt: performance.now(), duration: lineDuration(line.text) } : null
}

export const useDialogueStore = create<DialogueState>((set, get) => ({
  current: null,
  queue: [],
  say: (lines, priority) => {
    const queued = lines.map((line) => ({ ...line, id: ++sequence, priority }))
    const state = get()
    if (priority === 'scene') {
      // Story beats are chronological: the newest one replaces whatever is left.
      set({ current: begin(queued[0]), queue: queued.slice(1) })
      return
    }
    if (state.queue.length >= 2) return
    if (!state.current) set({ current: begin(queued[0]), queue: [...state.queue, ...queued.slice(1)] })
    else set({ queue: [...state.queue, ...queued] })
  },
  next: () => set((state) => ({ current: begin(state.queue[0]), queue: state.queue.slice(1) })),
  clear: () => set({ current: null, queue: [] }),
}))
