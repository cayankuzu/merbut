import { ASSET_PATHS } from '../config/assetPaths'
import type { RosterPreview } from '../config/characterRoster'
import { BOSS_MODEL_SCALES } from '../config/characterTransforms'
import { ENEMIES } from '../config/enemies'
import { CHARACTERS } from '../config/gameConfig'

export interface RosterPoseSpec {
  kind: 'hero' | 'shadow' | 'generic'
  modelSource: string
  poseSource: string
  poseFraction: number
  scale: number
}

/** Every gallery entry samples one calm frame and then remains completely still. */
export function getRosterPoseSpec(preview: RosterPreview): RosterPoseSpec {
  if (preview.type === 'hero') return {
    kind: 'hero',
    modelSource: CHARACTERS[preview.id].assets.idle,
    poseSource: CHARACTERS[preview.id].assets.idle,
    poseFraction: 0.18,
    scale: 1,
  }
  if (preview.type === 'enemy') return {
    kind: 'generic',
    modelSource: ENEMIES[preview.kind].walk,
    poseSource: ENEMIES[preview.kind].walk,
    poseFraction: 0.12,
    scale: ENEMIES[preview.kind].scale,
  }
  if (preview.type === 'shadow') return {
    kind: 'shadow',
    modelSource: ASSET_PATHS.bosses.evilJack.walk,
    poseSource: ASSET_PATHS.bosses.evilJack.walk,
    poseFraction: 0.1,
    scale: BOSS_MODEL_SCALES.shadow,
  }
  if (preview.form === 'normal') return {
    kind: 'generic',
    modelSource: ASSET_PATHS.bosses.aku.normal.walk,
    poseSource: ASSET_PATHS.bosses.aku.normal.walk,
    poseFraction: 0.1,
    scale: BOSS_MODEL_SCALES.aku,
  }
  return {
    kind: 'generic',
    modelSource: ASSET_PATHS.bosses.aku.monster.idle,
    poseSource: ASSET_PATHS.bosses.aku.monster.idle,
    poseFraction: 0.18,
    scale: BOSS_MODEL_SCALES.aku,
  }
}
