export type Difficulty = 'easy' | 'normal' | 'hard' | 'soulslike'

export interface DifficultyDefinition {
  id: Difficulty
  label: string
  description: string
  playerHealth: number
  playerLives: number
  playerDamage: number
  bossDamage: number
  bossSpeed: number
  bossCooldown: number
  extraEnemies: number
  invulnerabilityMs: number
  respawnSeconds: number
  chargeGain: number
  abilityDamage: number
  healAmount: number
  healDuration: number
  healDropChance: number
  bossHealth: number
  bossDamageTaken: number
  bossPlayerHealth: number
  bossRegenPerSecond: number
  prayerPlayerRegen: number
  prayerLifesteal: number
  meteorCount: number
  meteorWarning: number
  akuSpecialCooldown: readonly [number, number]
  /** Multiplies how long enemy attacks are telegraphed before they land. */
  telegraphScale: number
  /** Rank thresholds are divided by this, so harder runs rank up more easily. */
  rankBonus: number
}

/**
 * Every column gets strictly harder from left to right: fewer lives, less
 * health, shorter telegraphs, stronger bosses and scarcer Zemzem.
 */
export const DIFFICULTIES: Record<Difficulty, DifficultyDefinition> = {
  easy: {
    id: 'easy', label: 'Kolay', description: 'Uzun saldırı uyarıları, bol Zemzem ve affedici bosslar. Hikâyeyi yaşamak için.',
    playerHealth: 150, playerLives: 5, playerDamage: 1.28,
    bossDamage: 0.58, bossSpeed: 0.88, bossCooldown: 1.3, extraEnemies: 0,
    invulnerabilityMs: 760, respawnSeconds: 2, chargeGain: 1.45, abilityDamage: 1.25,
    healAmount: 70, healDuration: 2.5, healDropChance: 0.55,
    bossHealth: 0.72, bossDamageTaken: 1, bossPlayerHealth: 200, bossRegenPerSecond: 0.0004,
    prayerPlayerRegen: 3.4, prayerLifesteal: 0.24, meteorCount: 4, meteorWarning: 3.6,
    akuSpecialCooldown: [4, 6], telegraphScale: 1.25, rankBonus: 0.8,
  },
  normal: {
    id: 'normal', label: 'Orta', description: 'Dalga başına bir ek düşman ve dengeli boss baskısı. Önerilen deneyim.',
    playerHealth: 130, playerLives: 4, playerDamage: 1.1,
    bossDamage: 0.9, bossSpeed: 0.97, bossCooldown: 1.05, extraEnemies: 1,
    invulnerabilityMs: 620, respawnSeconds: 2.7, chargeGain: 1.15, abilityDamage: 1.08,
    healAmount: 60, healDuration: 2.6, healDropChance: 0.42,
    bossHealth: 0.95, bossDamageTaken: 0.8, bossPlayerHealth: 180, bossRegenPerSecond: 0.0012,
    prayerPlayerRegen: 2.4, prayerLifesteal: 0.19, meteorCount: 5, meteorWarning: 3,
    akuSpecialCooldown: [3.4, 5.5], telegraphScale: 1, rankBonus: 1,
  },
  hard: {
    id: 'hard', label: 'Zor', description: 'Dalga başına üç ek düşman, kısa uyarılar, az Zemzem ve güçlü bosslar.',
    playerHealth: 115, playerLives: 3, playerDamage: 1.02,
    bossDamage: 1.08, bossSpeed: 1.05, bossCooldown: 0.9, extraEnemies: 3,
    invulnerabilityMs: 560, respawnSeconds: 3.4, chargeGain: 1.08, abilityDamage: 1.04,
    healAmount: 40, healDuration: 3.1, healDropChance: 0.22,
    bossHealth: 1.15, bossDamageTaken: 0.7, bossPlayerHealth: 160, bossRegenPerSecond: 0.002,
    prayerPlayerRegen: 1.8, prayerLifesteal: 0.16, meteorCount: 7, meteorWarning: 2,
    akuSpecialCooldown: [2.2, 4.2], telegraphScale: 0.9, rankBonus: 1.25,
  },
  soulslike: {
    id: 'soulslike', label: 'Acımasız', description: 'Dalga başına dört ek düşman, iki yaşam ve affetmeyen bosslar. Her hata pahalı.',
    playerHealth: 100, playerLives: 2, playerDamage: 1,
    bossDamage: 1.2, bossSpeed: 1.15, bossCooldown: 0.72, extraEnemies: 4,
    invulnerabilityMs: 500, respawnSeconds: 4.2, chargeGain: 1.02, abilityDamage: 1,
    healAmount: 26, healDuration: 3.8, healDropChance: 0.12,
    bossHealth: 1.25, bossDamageTaken: 0.68, bossPlayerHealth: 150, bossRegenPerSecond: 0.0028,
    prayerPlayerRegen: 1.6, prayerLifesteal: 0.15, meteorCount: 9, meteorWarning: 1.5,
    akuSpecialCooldown: [1.7, 3.4], telegraphScale: 0.8, rankBonus: 1.6,
  },
}

export const DIFFICULTY_ORDER: readonly Difficulty[] = ['easy', 'normal', 'hard', 'soulslike']
