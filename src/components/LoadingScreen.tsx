import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { MerbutMark } from './MerbutMark'
import { MenuBattleStage } from './MenuBattleStage'

export function LoadingScreen() {
  const { active, progress, total, loaded } = useProgress()
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    if (total === 0 || active || loaded < total) return
    const timeout = window.setTimeout(() => setFinished(true), 1_200)
    return () => window.clearTimeout(timeout)
  }, [active, loaded, total])

  if (finished) return null

  const roundedProgress = Math.round(progress)
  return (
    <div className="loading-screen" role="status" aria-label={`Merbut yüzde ${roundedProgress} hazır`}>
      <MenuBattleStage variant="splash" />
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
