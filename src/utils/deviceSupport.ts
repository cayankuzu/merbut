export interface DeviceSupportSignals {
  coarsePointer: boolean
  hoverNone: boolean
  maxTouchPoints: number
  shortestViewportSide: number
  userAgent: string
  userAgentDataMobile?: boolean
}

export function isMobileDeviceFromSignals(signals: DeviceSupportSignals) {
  if (signals.userAgentDataMobile) return true
  if (/(Android|iPhone|iPad|iPod|IEMobile|Opera Mini|Mobile)/i.test(signals.userAgent)) return true
  if (/Macintosh/i.test(signals.userAgent) && signals.maxTouchPoints > 1) return true
  return signals.coarsePointer
    && signals.hoverNone
    && signals.maxTouchPoints > 0
    && signals.shortestViewportSide <= 1024
}

export function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const userAgentDataMobile = (navigator as Navigator & {
    userAgentData?: { mobile?: boolean }
  }).userAgentData?.mobile
  return isMobileDeviceFromSignals({
    coarsePointer: window.matchMedia?.('(pointer: coarse)').matches ?? false,
    hoverNone: window.matchMedia?.('(hover: none)').matches ?? false,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    shortestViewportSide: Math.min(window.innerWidth, window.innerHeight),
    userAgent: navigator.userAgent,
    userAgentDataMobile,
  })
}
