import { useEffect, useState } from 'react'
import { MerbutMark } from './MerbutMark'

const INTRO_DURATION_MS = 900
const EXIT_DELAY_MS = 180

export function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    const startedAt = performance.now()
    let frame = 0
    let exitTimer = 0
    const update = (now: number) => {
      const nextProgress = Math.min(100, Math.round(((now - startedAt) / INTRO_DURATION_MS) * 100))
      setProgress(nextProgress)
      if (nextProgress < 100) {
        frame = window.requestAnimationFrame(update)
        return
      }
      exitTimer = window.setTimeout(() => setFinished(true), EXIT_DELAY_MS)
    }
    frame = window.requestAnimationFrame(update)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(exitTimer)
    }
  }, [])

  if (finished) return null

  const roundedProgress = Math.round(progress)
  return (
    <div className="loading-screen" role="status" aria-label={`Merbut yüzde ${roundedProgress} hazır`}>
      <div className="loading-screen__frame" aria-hidden="true" />
      <div className="loading-screen__core">
        <p className="loading-screen__eyebrow"><i /> YEDİ DİYAR · TEK KADER <i /></p>
        <h1 data-title="MERBUT">MERBUT</h1>
        <div className="loading-screen__sigil"><MerbutMark className="loading-screen__mark" /></div>
        <div className="loading-progress" aria-label={`Yükleme yüzde ${roundedProgress}`}>
          <i style={{ width: `${roundedProgress}%` }} />
          <b /><b /><b />
        </div>
        <p className="loading-count"><span>SAHNE HAZIRLANIYOR</span><strong>{roundedProgress.toString().padStart(2, '0')}%</strong></p>
      </div>
      <div className="loading-screen__factions" aria-hidden="true"><span>KAHRAMANLAR</span><i>VS</i><span>AKU LEJYONU</span></div>
    </div>
  )
}
