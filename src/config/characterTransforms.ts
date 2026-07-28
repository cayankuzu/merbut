import type { CharacterId, CharacterTransform } from '../types/character'

export const CHARACTER_TRANSFORMS: Record<CharacterId, CharacterTransform> = {
  ali: {
    modelScale: 1.5,
    modelPosition: [0, 0, 0],
    modelRotation: [0, Math.PI / 2, 0],
    weapon: {
      // Ali'nin kılıcı kendi X eksenindeki aşağı dönüşünü korumalıdır.
      alignBlade: false,
      bladeDirection: [-1.46, 0, 1.68],
      gripPoint: [0.67, 0.18, -0.79],
      palmLerp: 0,
      position: [0, 0, 0],
      // Kılıcın keskin ucu aynı sap konumunda, doğrudan aşağıya bakar.
      rotation: [-Math.PI / 2, 0, Math.PI / 2],
      scale: [55, 55, 55],
    },
  },
  jack: {
    modelScale: 1.5,
    modelPosition: [0, 0, 0],
    modelRotation: [0, Math.PI / 2, 0],
    weapon: {
      bladeDirection: [-1, 0, 0],
      gripPoint: [0.78, 0, 0],
      palmLerp: 0.48,
      position: [0, 0, 0],
      rotation: [0, Math.PI, 0],
      scale: [75, 75, 75],
    },
  },
}
