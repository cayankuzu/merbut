import { useCallback, useEffect, useRef, useState } from 'react'
import { useGLTF, useProgress } from '@react-three/drei'
import { BACKGROUND_ASSETS, MODEL_ASSETS } from '../config/assetManifest'
import { MerbutMark } from './MerbutMark'
import { MenuBattleStage } from './MenuBattleStage'

const MINIMUM_SPLASH_MS = 1_400
const MAXIMUM_PRELOAD_MS = 75_000
const EXIT_DELAY_MS = 520
const ASSET_COUNT = MODEL_ASSETS.length + BACKGROUND_ASSETS.length

const TIPS = [
  'Düşman saldırmadan önce kırmızı parlar. Tam o anda kaçınırsan zaman yavaşlar.',
  'Aynı kahramana aynı anda en fazla iki düşman saldırır: kalabalıkta sırayla dövüş.',
  'Yeşim Harabeleri’nde iki çana birlikte vurun; sis dağılınca hayaletler tam hasar alır.',
  'Kafatası Adası’nda düşmanı kızaran çatlağın üstüne çek: lav senin yerine savaşır.',
  'Hz. Ali’nin alev penceresi ve Samuray Jack’in kalkanı isabetle dolar.',
  'Aku zayıfladıkça zamanı kırar. Son fazda portallardan uzak dur.',
  'Saldırıya ritimle üç kez bas: üçüncü vuruş dönerek keser.',
  'İkiniz aynı düşmana aynı anda vurursanız Çifte Hamle patlar.',
  'Gelen mermiye doğru anda kılıç salla: sahibine geri döner.',
  'Kum Saati Çölü’nde titreyen düşmanlar seraptır; tek darbede kuma döner.',
  'Dökümhanede presin gölgesi düşmandan önce iner. Dronları altına çek.',
  'Şimşek Zirvesi’nde parlayan paratonere vur: kılıcın zincirleme şimşek taşır.',
]

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
  if (progress < 24) return 'On diyarın tabloları yükleniyor'
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
  const [tip, setTip] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setTip((index) => (index + 1) % TIPS.length), 4_500)
    return () => window.clearInterval(timer)
  }, [])
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
        <p className="loading-screen__eyebrow"><i /> MEMODE SUNAR <i /></p>
        <h1 data-title="MERBUT">MERBUT</h1>
        <div className="loading-screen__sigil"><MerbutMark className="loading-screen__mark" /></div>
        <div className="loading-progress" aria-label={`Yükleme yüzde ${roundedProgress}`}>
          <i style={{ width: `${roundedProgress}%` }} />
          <b /><b /><b />
        </div>
        <p className="loading-count"><span>{loadedCount}/{ASSET_COUNT} OYUN DOSYASI</span><strong>{roundedProgress.toString().padStart(2, '0')}%</strong></p>
        <p className="loading-screen__stage">{stage}</p>
        <p className="loading-screen__notice" key={tip}>İpucu · {TIPS[tip]}</p>
        <p className="loading-screen__cache-note">Bu yapım hayal ürünüdür. Tarihî ve dinî şahsiyetlere saygıyla yaklaşılmıştır. Anılan karakter ve markalar sahiplerine aittir.</p>
      </div>
      <div className="loading-screen__factions" aria-hidden="true"><span>KAHRAMANLAR</span><i>VS</i><span>AKU LEJYONU</span></div>
    </div>
  )
}
