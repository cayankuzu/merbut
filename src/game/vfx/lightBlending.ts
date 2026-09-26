import { AddEquation, CustomBlending, OneFactor, OneMinusSrcAlphaFactor, SrcAlphaFactor, type Material } from 'three'

/**
 * Additive light that stays valid on a transparent canvas.
 *
 * The game and menu canvases are transparent: the painted realms live in the
 * DOM behind them. Three's additive preset writes alpha as a² while colour
 * grows by rgb·a, which leaves "impossible" premultiplied pixels (colour
 * brighter than alpha) over the sky; browsers composite those unpredictably
 * (grey sheets, or nothing at all). Here colour still adds up like light, and
 * alpha composites normally, so a glow over the painting reads as its own
 * colour and over opaque 3D pixels it is plain additive.
 */
export const LIGHT_BLENDING = {
  blending: CustomBlending,
  blendEquation: AddEquation,
  blendSrc: SrcAlphaFactor,
  blendDst: OneFactor,
  blendSrcAlpha: OneFactor,
  blendDstAlpha: OneMinusSrcAlphaFactor,
} as const

export function asLight<T extends Material>(material: T): T {
  Object.assign(material, LIGHT_BLENDING)
  return material
}
