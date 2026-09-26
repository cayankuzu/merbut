/** Toggles browser fullscreen; silently ignored where the API is blocked. */
export function toggleFullscreen() {
  if (typeof document === 'undefined') return
  if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
  else void document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => undefined)
}
