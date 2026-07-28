import { useCallback, useEffect, useRef, useState } from 'react'
import { useGLTF, useProgress } from '@react-three/drei'
import { BACKGROUND_ASSETS, MODEL_ASSETS } from '../config/assetManifest'
import { MerbutMark } from './MerbutMark'
import { MenuBattleStage } from './MenuBattleStage'

const MINIMUM_SPLASH_MS = 1_400
const MAXIMUM_PRELOAD_MS = 170_000
const EXIT_DELAY_MS = 520
const ASSET_COUNT = MODEL_ASSETS.length + BACKGROUND_ASSETS.length

const imagePromises = new Map<string, Promise<void>>()

function loadImage(path: string) {
  const cached = imagePromises.get(path)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    const finish = () => resolve()
    image.onload = () => {
      if (typeof image.decode === 'function') void image.decode().then(finish, finish)
      else finish()
    }
    image.onerror = finish
    image.src = path
  })
  imagePromises.set(path, promise)
  return promise
}

function loadingStage(progress: number, complete: boolean, timedOut: boolean) {
  if (complete) return 'Hazır — savaş sahnesi açılıyor'
  if (timedOut) return 'Bağlantı yavaş; kalan dosyalar oyun sırasında tamamlanacak'
  if (progress < 8) return 'Bağlantı ve oyun çekirdeği hazırlanıyor'
  if (progress < 24) return 'Yedi biyomun görselleri yükleniyor'
  if (progress < 43) return 'Hz. Ali ve Samuray Jack hazırlanıyor'
  if (progress < 72) return 'Aku lejyonunun modelleri ve animasyonları yükleniyor'
  if (progress < 91) return 'Boss karşılaşmaları ve zaman portalı hazırlanıyor'
  return 'Savaş sahnesi son kez denetleniyor'
}

interface LoadingScreenProps {
  onReady: () => void
}

export function LoadingScreen({ onReady }: LoadingScreenProps) {
  const { loaded, total } = useProgress()
  const [backgroundsLoaded, setBackgroundsLoaded] = useState(0)
  const [preloadStarted, setPreloadStarted] = useState(false)
  const [complete, setComplete] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [finished, setFinished] = useState(false)
  const startedAt = useRef(performance.now())
  const finishStarted = useRef(false)

  useEffect(() => {
    for (const path of MODEL_ASSETS) useGLTF.preload(path)
    setPreloadStarted(true)

    let cancelled = false
    BACKGROUND_ASSETS.forEach((path) => {
      void loadImage(path).then(() => {
        if (!cancelled) setBackgroundsLoaded((count) => Math.min(BACKGROUND_ASSETS.length, count + 1))
      })
    })
    return () => { cancelled = true }
  }, [])

  const modelProgress = total > 0 ? loaded / total : 0
  const backgroundProgress = BACKGROUND_ASSETS.length > 0 ? backgroundsLoaded / BACKGROUND_ASSETS.length : 1
  const measuredProgress = Math.min(99, Math.round((modelProgress * 0.86 + backgroundProgress * 0.14) * 100))
  const roundedProgress = complete ? 100 : Math.max(preloadStarted ? 2 : 0, measuredProgress)
  const resourcesReady = preloadStarted
    && total >= MODEL_ASSETS.length
    && loaded >= total
    && backgroundsLoaded >= BACKGROUND_ASSETS.length

  const finish = useCallback((becauseOfTimeout = false) => {
    if (finishStarted.current) return
    finishStarted.current = true
    if (becauseOfTimeout) setTimedOut(true)
    setComplete(true)
    onReady()
    window.setTimeout(() => setFinished(true), EXIT_DELAY_MS)
  }, [onReady])

  useEffect(() => {
    if (!resourcesReady) return
    const remaining = Math.max(0, MINIMUM_SPLASH_MS - (performance.now() - startedAt.current))
    const timer = window.setTimeout(() => finish(false), remaining)
    return () => window.clearTimeout(timer)
  }, [finish, resourcesReady])

  useEffect(() => {
    const timer = window.setTimeout(() => finish(true), MAXIMUM_PRELOAD_MS)
    return () => window.clearTimeout(timer)
  }, [finish])

  if (finished) return null

  const stage = loadingStage(roundedProgress, complete, timedOut)
  const loadedCount = Math.min(ASSET_COUNT, loaded + backgroundsLoaded)
  return (
    <div className={`loading-screen${complete ? ' is-exiting' : ''}`} role="status" aria-live="polite" aria-label={`Merbut yüzde ${roundedProgress} hazır`}>
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
        <p className="loading-count"><span>{loadedCount}/{ASSET_COUNT} OYUN DOSYASI</span><strong>{roundedProgress.toString().padStart(2, '0')}%</strong></p>
        <p className="loading-screen__stage">{stage}</p>
        <p className="loading-screen__notice">Daha akıcı bir deneyim için oyun dosyaları cihazınıza hazırlanıyor. Bu işlem bağlantınıza göre biraz sürebilir; lütfen sekmeyi kapatmayın.</p>
        <p className="loading-screen__cache-note">İlk hazırlıktan sonra tarayıcı önbelleği sayesinde sonraki açılışlar daha hızlı olacaktır.</p>
      </div>
      <div className="loading-screen__factions" aria-hidden="true"><span>KAHRAMANLAR</span><i>VS</i><span>AKU LEJYONU</span></div>
    </div>
  )
}
