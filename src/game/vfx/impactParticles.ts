import type { ImpactKind } from '../../types/session'
import { COMBAT_EFFECT_STYLE } from '../combatEffectConfig'
import { EFFECTS, burst } from './effects'

/** Each impact kind speaks with its own particles the moment it lands. */
export function emitImpactParticles(kind: ImpactKind, x: number, y: number, lethal: boolean) {
  const style = COMBAT_EFFECT_STYLE[kind]
  switch (kind) {
    case 'ember': EFFECTS.embers(x, Math.max(0.3, y), '#ff8a3a', lethal ? 18 : 10); break
    case 'void': burst({ x, y: Math.max(0.5, y), count: 14, kind: 'glow', color: style.primary, endColor: style.secondary, speed: [1, 4], life: [0.3, 0.6], size: [0.18, 0.02], drag: 2 }); break
    case 'quake': EFFECTS.slam(x, '#8a6a4a'); break
    case 'stone': burst({ x, y: Math.max(0.4, y), count: 12, kind: 'blob', color: '#6a7a5a', endColor: '#2a3324', speed: [2, 6], life: [0.4, 0.7], size: [0.14, 0.04], gravity: -14, drag: 1 }); break
    case 'frost': EFFECTS.sparkle(x, Math.max(0.6, y), '#bff2ff', lethal ? 26 : 12); break
    case 'boss': EFFECTS.shower(x, Math.max(0.3, y), '#ffd0d8', '#ff123f', 20); break
    case 'holy': EFFECTS.sparkle(x, Math.max(1, y), '#fff2a8', 36); break
    default: break
  }
}
