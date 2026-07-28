import { describe, expect, it } from 'vitest'
import { isMobileDeviceFromSignals } from './deviceSupport'

const desktop = {
  coarsePointer: false,
  hoverNone: false,
  maxTouchPoints: 0,
  shortestViewportSide: 720,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/151 Safari/537.36',
}

describe('mobile device support gate', () => {
  it('allows a desktop browser even at a compact viewport', () => {
    expect(isMobileDeviceFromSignals(desktop)).toBe(false)
  })

  it('blocks phones reported by user-agent client hints', () => {
    expect(isMobileDeviceFromSignals({ ...desktop, userAgentDataMobile: true })).toBe(true)
  })

  it('blocks iPadOS devices that identify as Macintosh', () => {
    expect(isMobileDeviceFromSignals({
      ...desktop,
      coarsePointer: true,
      hoverNone: true,
      maxTouchPoints: 5,
      shortestViewportSide: 820,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
    })).toBe(true)
  })
})
