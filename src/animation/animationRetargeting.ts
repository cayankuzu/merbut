import type { AnimationClip, Object3D } from 'three'

export function validateClipTargets(root: Object3D, clip: AnimationClip) {
  const missingTargets = new Set<string>()

  for (const track of clip.tracks) {
    const targetName = track.name.split('.')[0]
    if (targetName && !root.getObjectByName(targetName)) missingTargets.add(targetName)
  }

  if (missingTargets.size > 0) {
    throw new Error(
      `${clip.name} cannot bind to the base skeleton. Missing: ${[...missingTargets].join(', ')}`,
    )
  }

  return clip
}
