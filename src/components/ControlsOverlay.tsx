import { useGameStore } from '../store/gameStore'

export function ControlsOverlay() {
  const togetherWarning = useGameStore((state) => state.togetherWarning)
  const resetScene = useGameStore((state) => state.resetScene)

  return (
    <div className="hud" aria-label="Oyun kontrolleri">
      <header className="brand-lockup">
        <span>MERBUT</span>
        <small>İLK SAHNE · YEREL İKİ OYUNCU</small>
      </header>

      <div className={`together-warning${togetherWarning ? ' is-visible' : ''}`} role="alert">
        <span /> Birlikte kalın
      </div>

      <div className="control-card control-card--ali">
        <h2>Hz. Ali</h2>
        <dl>
          <div><dt>A / D</dt><dd>Hareket</dd></div>
          <div><dt>W</dt><dd>Zıpla</dd></div>
          <div><dt>S</dt><dd>Saldır</dd></div>
          <div><dt>Z / X</dt><dd>Döndür</dd></div>
        </dl>
      </div>

      <div className="control-card control-card--jack">
        <h2>Samuray Jack</h2>
        <dl>
          <div><dt>← / →</dt><dd>Hareket</dd></div>
          <div><dt>↑</dt><dd>Zıpla</dd></div>
          <div><dt>↓</dt><dd>Saldır</dd></div>
          <div><dt>Ö / Ç</dt><dd>Döndür</dd></div>
        </dl>
      </div>

      <button className="reset-button" type="button" onClick={resetScene}>
        <span aria-hidden="true">↻</span> Sahneyi sıfırla
      </button>
    </div>
  )
}
