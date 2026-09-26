import { useCallback, useEffect, useRef, useState } from 'react'
import { useProgressStore } from '../../meta/progressStore'
import { useSessionStore } from '../../store/sessionStore'
import { useSettingsStore } from '../../store/settingsStore'
import { PROLOGUE, SPEAKERS } from '../../story/script'
import { KeyCap } from '../ui/KeyCap'

const BEAT_MS = 6_200

/**
 * The opening: six album-cover panels with a slow push-in. Aku narrates his
 * own flattering version of history and the narrator keeps correcting him.
 * Any confirm key skips a beat; Esc skips the whole prologue.
 */
export function PrologueCinematic() {
  const [beat, setBeat] = useState(0)
  const [letters, setLetters] = useState(0)
  const startCountdown = useSessionStore((state) => state.startCountdown)
  const speed = useSettingsStore((state) => state.dialogueSpeed)
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    useProgressStore.getState().markPrologueSeen()
    startCountdown()
  }, [startCountdown])

  const advance = useCallback(() => {
    setBeat((current) => {
      if (current >= PROLOGUE.length - 1) {
        finish()
        return current
      }
      return current + 1
    })
  }, [finish])

  useEffect(() => {
    setLetters(0)
    const perSecond = { slow: 24, normal: 36, fast: 60, instant: 500 }[speed]
    const started = performance.now()
    const text = PROLOGUE[beat]!.text
    let frame = requestAnimationFrame(function loop(now) {
      setLetters(Math.min(text.length, Math.floor((now - started) / 1_000 * perSecond)))
      frame = requestAnimationFrame(loop)
    })
    const timer = window.setTimeout(advance, Math.max(BEAT_MS, text.length / perSecond * 1_000 + 2_200))
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [advance, beat, speed])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        event.stopImmediatePropagation()
        finish()
      } else if (event.code === 'Enter' || event.code === 'Space') advance()
    }
    const onPad = () => advance()
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('merbut-any-input', onPad)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('merbut-any-input', onPad)
    }
  }, [advance, finish])

  const current = PROLOGUE[beat]!
  return (
    <section className="prologue" aria-label="Prolog" onClick={advance}>
      <div className="prologue__image" key={beat} style={{ backgroundImage: `url(${current.image})` }} />
      <div className="prologue__bars" aria-hidden="true"><i /><i /></div>
      <p className={`prologue__text is-${current.speaker}`} style={{ '--speaker': SPEAKERS[current.speaker].color } as React.CSSProperties}>
        <small>{SPEAKERS[current.speaker].name}</small>
        {current.text.slice(0, letters)}<span>{current.text.slice(letters)}</span>
      </p>
      <footer>
        <span>{beat + 1} / {PROLOGUE.length}</span>
        <button type="button" onClick={(event) => { event.stopPropagation(); finish() }}>ATLA <KeyCap>Esc</KeyCap></button>
      </footer>
    </section>
  )
}
