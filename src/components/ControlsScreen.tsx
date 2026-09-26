import { useEffect, useState } from 'react'
import { gameAudio } from '../audio/gameAudio'
import { BIOMES } from '../config/biomes'
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../config/difficulty'
import { BIOME_CONTENT } from '../content/biomeContent'
import { useProgressStore } from '../meta/progressStore'
import { useSessionStore } from '../store/sessionStore'
import { useSettingsStore } from '../store/settingsStore'
import { useUiStore } from '../store/uiStore'
import type { CharacterId } from '../types/character'
import type { PlayerAction } from '../types/controls'
import { CharacterPreview3D } from './CharacterPreview3D'
import { ActionKeys } from './ui/KeyCap'

const MOVES: { action: PlayerAction; both?: PlayerAction; label: Record<CharacterId, string> }[] = [
  { action: 'left', both: 'right', label: { ali: 'Hareket', jack: 'Hareket' } },
  { action: 'jump', label: { ali: 'Zıpla · havada bir kez daha', jack: 'Zıpla · havada bir kez daha' } },
  { action: 'attack', label: { ali: 'Alevli kılıç kesişi', jack: 'Katana kesişi' } },
  { action: 'dash', label: { ali: 'Kaçınma · kırmızı halkadan sıyrıl', jack: 'Kaçınma · kırmızı halkadan sıyrıl' } },
  { action: 'ability', label: { ali: 'Alev Penceresi · 4 sn, 9 alev topu', jack: 'Koruyucu Kalkan · 4 sn, takımı korur' } },
  { action: 'rotateLeft', both: 'rotateRight', label: { ali: '360° dön', jack: '360° dön' } },
]

function HeroBrief({ id, ready }: { id: CharacterId; ready: boolean }) {
  return (
    <article className={`hero-brief hero-brief--${id}`}>
      {ready ? <CharacterPreview3D id={id} /> : <div className="character-preview" aria-hidden="true" />}
      <div className="hero-brief__copy">
        <h2>{id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'}</h2>
        <p>{id === 'ali' ? 'Adaletin kılıcı. Ağır ve alevli vurur; dolu güçle bir alev fırtınası salar.' : 'Zamandan sürgün samuray. Hızlı keser; kalkanıyla ikisini birden korur.'}</p>
        <dl>{MOVES.map((move) => <div key={move.action}><dt><ActionKeys player={id} action={move.action} both={move.both} /></dt><dd>{move.label[id]}</dd></div>)}</dl>
      </div>
    </article>
  )
}

export function ControlsScreen() {
  const [previewsReady, setPreviewsReady] = useState(false)
  const pendingBiome = useUiStore((state) => state.pendingBiome)
  const difficulty = useSessionStore((state) => state.difficulty)
  const setDifficulty = useSessionStore((state) => state.setDifficulty)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const showPrologue = useSettingsStore((state) => state.showPrologue)
  const prologueSeen = useProgressStore((state) => state.prologueSeen)

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewsReady(true), 180)
    return () => window.clearTimeout(timer)
  }, [])

  const start = () => {
    gameAudio.play('ui-confirm')
    const session = useSessionStore.getState()
    if (pendingBiome > 0) session.startAtBiome(pendingBiome)
    else if (showPrologue || !prologueSeen) session.startPrologue()
    else {
      session.returnToMenu()
      useSessionStore.getState().startCountdown()
    }
  }

  const content = BIOME_CONTENT[pendingBiome]!
  return (
    <section className="controls-screen" aria-label="Kontroller ve zorluk seçimi">
      <header>
        <small>SAVAŞ BRİFİNGİ · {content.chapter} · {BIOMES[pendingBiome]!.title.toLocaleUpperCase('tr-TR')}</small>
        <h1>Kahramanlarını tanı</h1>
      </header>
      <div className="controls-screen__grid">
        <HeroBrief id="ali" ready={previewsReady} />
        <HeroBrief id="jack" ready={previewsReady} />
      </div>
      <fieldset className="difficulty-select">
        <legend>ZORLUK · Her kademe bir öncekinden ölçülebilir biçimde zordur</legend>
        {DIFFICULTY_ORDER.map((id) => {
          const option = DIFFICULTIES[id]
          return (
            <button className={difficulty === id ? 'is-selected' : ''} type="button" onClick={() => setDifficulty(id)} aria-pressed={difficulty === id} key={id}>
              <b>{option.label}</b>
              <span>{option.description}</span>
              <em>{option.playerHealth} CAN · {option.playerLives} YAŞAM · DALGA +{option.extraEnemies}</em>
            </button>
          )
        })}
      </fieldset>
      <p className="controls-screen__note">Düşman saldırmadan önce kırmızı parlar ve ayağının altında bir halka belirir: tam o anda kaçınırsan zaman yavaşlar. Özel yetenekler isabetle dolar.</p>
      <div className="menu-actions">
        <button type="button" onClick={returnToMenu}>GERİ</button>
        <button className="menu-primary" type="button" autoFocus onClick={start}>SAVAŞA BAŞLA</button>
      </div>
    </section>
  )
}
