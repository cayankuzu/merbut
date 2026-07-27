import type { ImpactKind } from '../types/session'

export const COMBAT_EFFECT_STYLE: Record<ImpactKind, { primary: string; secondary: string; shape: 'spark' | 'ring' | 'shard' }> = {
  ember: { primary: '#fff0a8', secondary: '#ff4b12', shape: 'spark' },
  void: { primary: '#ff67ef', secondary: '#6d1aff', shape: 'ring' },
  quake: { primary: '#ffdf63', secondary: '#5a2c12', shape: 'shard' },
  stone: { primary: '#c8ffca', secondary: '#446b47', shape: 'shard' },
  frost: { primary: '#e6fbff', secondary: '#36bfff', shape: 'ring' },
  boss: { primary: '#ffccd5', secondary: '#ff123f', shape: 'spark' },
  holy: { primary: '#fff7b0', secondary: '#6cfff0', shape: 'ring' },
  portal: { primary: '#9aefff', secondary: '#4d1bff', shape: 'ring' },
}
