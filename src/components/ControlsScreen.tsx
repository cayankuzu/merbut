import { useEffect, useState } from 'react'
import { DIFFICULTIES, type Difficulty } from '../config/difficulty'
import { useSessionStore } from '../store/sessionStore'
import { CharacterPreview3D } from './CharacterPreview3D'

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard', 'soulslike']

export function ControlsScreen() {
  const [previewsReady, setPreviewsReady] = useState(false)
  const startCountdown = useSessionStore((state) => state.startCountdown)
  const returnToMenu = useSessionStore((state) => state.returnToMenu)
  const difficulty = useSessionStore((state) => state.difficulty)
  const setDifficulty = useSessionStore((state) => state.setDifficulty)
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewsReady(true), 180)
    return () => window.clearTimeout(timer)
  }, [])
  return (
    <section className="controls-screen" aria-label="Kontroller ve zorluk seçimi">
      <header><small>SAVAŞ BRİFİNGİ</small><h1>Kahramanlarını tanı</h1></header>
      <div className="controls-screen__grid">
        <article className="hero-brief hero-brief--ali">
          {previewsReady ? <CharacterPreview3D id="ali" /> : <div className="character-preview" aria-hidden="true" />}
          <div className="hero-brief__copy"><h2>Hz. Ali</h2>
            <dl><div><dt>A / D</dt><dd>Hareket</dd></div><div><dt>W</dt><dd>Zıpla</dd></div><div><dt>S</dt><dd>Kılıç izinden alevli kesiş</dd></div><div><dt>Z / X</dt><dd>360° dön</dd></div><div><dt>R</dt><dd>Dolu güçle 4 sn boyunca en fazla 9 alev topu</dd></div></dl>
          </div>
        </article>
        <article className="hero-brief hero-brief--jack">
          {previewsReady ? <CharacterPreview3D id="jack" /> : <div className="character-preview" aria-hidden="true" />}
          <div className="hero-brief__copy"><h2>Samuray Jack</h2>
            <dl><div><dt>← / →</dt><dd>Hareket</dd></div><div><dt>↑</dt><dd>Zıpla</dd></div><div><dt>↓</dt><dd>Beyaz kesiş</dd></div><div><dt>Ö / Ç</dt><dd>360° dön</dd></div><div><dt>L</dt><dd>Hareket ederken 4 sn koruyucu kalkan</dd></div></dl>
          </div>
        </article>
      </div>
      <fieldset className="difficulty-select">
        <legend>ZORLUK · DÜŞMAN SAYISINI, BOSS GÜCÜNÜ VE KAYNAKLARI BELİRLER</legend>
        {DIFFICULTY_ORDER.map((id) => {
          const option = DIFFICULTIES[id]
          return <button className={difficulty === id ? 'is-selected' : ''} type="button" onClick={() => setDifficulty(id)} aria-pressed={difficulty === id} key={id}><b>{option.label}</b><span>{option.description}</span><em>{option.playerHealth} CAN · {option.playerLives} YAŞAM · DALGA +{option.extraEnemies}</em></button>
        })}
      </fieldset>
      <p className="controls-screen__note">Özel yetenekler isabet ve öldürme puanlarıyla dolar. Final Aku başladığında geçmiş bütün biyom kapıları açılır.</p>
      <div className="menu-actions"><button type="button" onClick={returnToMenu}>GERİ</button><button className="menu-primary" type="button" onClick={startCountdown}>SAVAŞA BAŞLA</button></div>
    </section>
  )
}
