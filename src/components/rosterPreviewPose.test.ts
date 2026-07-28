import { CHARACTER_ROSTER } from '../config/characterRoster'
import { getRosterPoseSpec } from './rosterPreviewPose'

describe('roster static pose selection', () => {
  it('uses the model idle/locomotion source instead of a combat clip for every character', () => {
    CHARACTER_ROSTER.forEach(({ preview }) => {
      const pose = getRosterPoseSpec(preview)
      expect(pose.poseSource).toBe(pose.modelSource)
      expect(pose.poseSource).not.toMatch(/attack|slash|combo|heavy|kick|spin|ranged/i)
      expect(pose.poseFraction).toBeGreaterThan(0)
      expect(pose.poseFraction).toBeLessThan(0.5)
    })
  })

  it('keeps weapon-bearing hero and shadow rigs on their dedicated preview paths', () => {
    expect(getRosterPoseSpec({ type: 'hero', id: 'ali' }).kind).toBe('hero')
    expect(getRosterPoseSpec({ type: 'hero', id: 'jack' }).kind).toBe('hero')
    expect(getRosterPoseSpec({ type: 'shadow' }).kind).toBe('shadow')
  })
})
