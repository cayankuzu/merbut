import { Bone, type Object3D } from 'three'

const FACE_ANCHOR_NAMES = ['headfront', 'HeadFront', 'mixamorigHeadFront', 'Head'] as const
export function findAliFaceAnchor(root: Object3D) {
  for (const name of FACE_ANCHOR_NAMES) {
    const candidate = root.getObjectByName(name)
    if (candidate instanceof Bone) return candidate
  }
  let fallback: Bone | null = null
  root.traverse((node) => {
    if (!fallback && node instanceof Bone && /head(front)?/i.test(node.name)) fallback = node
  })
  return fallback
}
