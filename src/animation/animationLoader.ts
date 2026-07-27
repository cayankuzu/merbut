import { AnimationUtils, type AnimationClip } from 'three'

interface SubclipOptions {
  startFrame: number
  endFrame: number
  fps: number
}

export function prepareAnimationClip(
  source: AnimationClip | undefined,
  name: string,
  subclip?: SubclipOptions,
) {
  if (!source) throw new Error(`Animation clip missing: ${name}`)

  const clip = subclip
    ? AnimationUtils.subclip(source, name, subclip.startFrame, subclip.endFrame, subclip.fps)
    : source.clone()

  clip.name = name
  clip.optimize()
  return clip
}
