import { Bone, type Object3D } from 'three'

const exactCandidates = [
  'RightHand',
  'right_hand',
  'hand.R',
  'mixamorigRightHand',
  'RightWrist',
  'wrist.R',
]

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

export function findRightHandBone(root: Object3D): Bone | null {
  for (const name of exactCandidates) {
    const match = root.getObjectByName(name)
    if (match instanceof Bone) return match
  }

  const bones: Bone[] = []
  root.traverse((node) => {
    if (node instanceof Bone) bones.push(node)
  })

  const scored = bones
    .map((bone) => {
      const name = normalize(bone.name)
      let score = 0
      if (name.includes('right')) score += 5
      if (name.includes('hand')) score += 6
      if (name.includes('wrist')) score += 4
      if (name.endsWith('r')) score += 2
      if (name.includes('left')) score -= 10
      return { bone, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored[0]?.score > 4 ? scored[0].bone : null
}
