import { Bone, Group } from 'three'
import { describe, expect, it } from 'vitest'
import { findAliFaceAnchor } from './aliFaceAnchor'

describe('Hz. Ali face light anchor', () => {
  it('prefers the authored headfront rig point', () => {
    const root = new Group()
    const head = new Bone()
    head.name = 'Head'
    const face = new Bone()
    face.name = 'headfront'
    head.add(face)
    root.add(head)

    expect(findAliFaceAnchor(root)).toBe(face)
  })

  it('falls back to a head bone when a front marker is unavailable', () => {
    const root = new Group()
    const head = new Bone()
    head.name = 'mixamorigHead'
    root.add(head)

    expect(findAliFaceAnchor(root)).toBe(head)
  })
})
