import type { CharacterId, CharacterTransform, WeaponTransform } from '../types/character'

export const BOSS_MODEL_SCALES = {
  shadow: 2.94,
  aku: 3.83,
} as const

export const CHARACTER_TRANSFORMS: Record<CharacterId, CharacterTransform> = {
  ali: {
    modelScale: 1.5,
    modelPosition: [0, 0, 0],
    modelRotation: [0, Math.PI / 2, 0],
    weapon: {
      alignBlade: false,
      // RightHand dinlenme dönüşü telafi edilirken sap noktası sabit kalır.
      bladeDirection: [-1.46, 0, 1.68],
      gripPoint: [0.67, 0.18, -0.79],
      palmLerp: 0,
      position: [0, 0, 0],
      // Uzun uç düşmana, keskin kenar zemine ve geniş yüzey kameraya bakar.
      rotation: [-1.790930078, 0.545735745, -1.712078786],
      scale: [55, 55, 55],
    },
  },
  jack: {
    modelScale: 1.5,
    modelPosition: [0, 0, 0],
    modelRotation: [0, Math.PI / 2, 0],
    weapon: {
      // Katana gövdesi kendi uzun ekseninde 90° çevrilir; sap noktası korunur.
      alignBlade: true,
      bladeDirection: [-1, 0, 0],
      gripPoint: [0.78, 0, 0],
      palmLerp: 0.48,
      position: [0, 0, 0],
      rotation: [Math.PI / 2, Math.PI, 0],
      scale: [75, 75, 75],
    },
  },
}

/**
 * Aku'nun Gölgesi farklı bir sağ el dinlenme pozu kullanır. Bu ofset,
 * Samuray Jack'in katana tutuşunu Gölge rig'ine taşır; sap elin içinde kalır
 * ve saldırı kliplerinde kılıç el kemiğini izler.
 */
export const SHADOW_WEAPON_TRANSFORM: WeaponTransform = {
  ...CHARACTER_TRANSFORMS.jack.weapon,
  alignBlade: false,
  rotation: [-1.9213176356064228, 0.17992370132894234, -3.0545531270324],
}
