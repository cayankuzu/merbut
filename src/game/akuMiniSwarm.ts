export const MINI_AKU_OFFSETS = [-2.25, -1.35, -0.45, 0.45, 1.35, 2.25] as const
export const MINI_AKU_ATTACK_TIMES = [700, 1_250, 1_800, 2_350, 2_900, 3_450] as const
export const MINI_AKU_COUNT = MINI_AKU_OFFSETS.length

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))
const smoothstep = (value: number) => value * value * (3 - 2 * value)
const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount

export interface MiniAkuMotion {
  x: number
  y: number
  direction: -1 | 1
  attacking: boolean
}

export function getMiniAkuMotion(index: number, elapsedMs: number, bossX: number, targetX: number): MiniAkuMotion {
  const safeIndex = Math.max(0, Math.min(MINI_AKU_COUNT - 1, index))
  const offset = MINI_AKU_OFFSETS[safeIndex]!
  const attackAt = MINI_AKU_ATTACK_TIMES[safeIndex]!
  const spawnX = bossX + offset
  const approachSide = spawnX <= targetX ? -1 : 1
  const strikeStartX = targetX + approachSide * 0.92
  const approach = smoothstep(clamp01((elapsedMs - Math.max(0, attackAt - 560)) / 560))
  const lunge = clamp01((elapsedMs - attackAt) / 310)
  const retreat = smoothstep(clamp01((elapsedMs - attackAt - 420) / 780))
  let x = lerp(spawnX, strikeStartX, approach)

  if (elapsedMs >= attackAt) {
    const strikeEndX = targetX - approachSide * 0.7
    x = lerp(strikeStartX, strikeEndX, Math.sin(Math.PI * lunge * 0.5))
  }
  if (elapsedMs > attackAt + 420) x = lerp(x, bossX + offset * 0.66, retreat)

  const direction: -1 | 1 = targetX >= x ? 1 : -1
  return { x, y: 0, direction, attacking: elapsedMs >= attackAt - 90 && elapsedMs <= attackAt + 430 }
}
