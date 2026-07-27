import { BIOMES } from '../config/biomes'
import { DIFFICULTIES } from '../config/difficulty'
import type { CharacterId } from '../types/character'
import type { PlayerStatus } from '../types/session'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { CharacterPreview3D } from './CharacterPreview3D'

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  const tenths = Math.floor(totalSeconds * 10) % 10
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`
}

function PlayerHud({ id, player, prayerActive, now }: { id: CharacterId; player: PlayerStatus; prayerActive: boolean; now: number }) {
  const isAli = id === 'ali'
  const health = Math.max(0, Math.min(100, player.health / player.maxHealth * 100))
  const abilityActive = player.abilityActiveUntil > now
  const ability = abilityActive ? 100 : Math.max(0, Math.min(100, player.abilityCharge))
  const frozen = player.frozenUntil > now
  const skill = isAli ? 'ALEV PENCERESİ' : 'KORUYUCU KALKAN'
  return (
    <article className={`player-hud player-hud--${id}${player.dead ? ' is-dead' : ''}${prayerActive ? ' is-prayer-active' : ''}${frozen ? ' is-time-frozen' : ''}`} aria-label={`${isAli ? 'Hz. Ali' : 'Samuray Jack'} savaş bilgisi`}>
      <CharacterPreview3D id={id} compact />
      <div className="player-hud__data">
        <header><div><small>{player.dead ? 'DÜŞTÜ' : frozen ? 'ZAMAN DONMASI' : 'KAHRAMAN'}</small><h2>{isAli ? 'Hz. Ali' : 'Samuray Jack'}</h2></div><b>{Math.ceil(player.health)}<em>/{player.maxHealth}</em></b></header>
        <div className="player-hud__health" aria-label={`Can yüzde ${Math.round(health)}`}><i style={{ width: `${health}%` }} /></div>
        <div className="player-hud__ability" aria-label={`${skill} yüzde ${Math.round(ability)}`}><i style={{ width: `${ability}%` }} /><span>{skill}{abilityActive ? ' · AKTİF' : ''}</span></div>
        <footer><span className="player-hud__lives" aria-label={`${player.lives} can`}>♥ <b>{player.lives}</b> CAN</span><strong>ÖLDÜRME {player.kills}</strong></footer>
      </div>
    </article>
  )
}

export function GameHud() {
  const phase = useSessionStore((state) => state.phase)
  const elapsed = useSessionStore((state) => state.elapsedSeconds)
  const biome = useSessionStore((state) => state.currentBiome)
  const biomeBannerUntil = useSessionStore((state) => state.biomeBannerUntil)
  const difficulty = useSessionStore((state) => state.difficulty)
  const players = useSessionStore((state) => state.players)
  const allEnemies = useSessionStore((state) => state.enemies)
  const spawnedWaves = useSessionStore((state) => state.spawnedWaves)
  const feed = useSessionStore((state) => state.feed)
  const togetherWarning = useGameStore((state) => state.togetherWarning)
  if (!['countdown', 'boss-intro', 'final-intro', 'playing', 'paused'].includes(phase)) return null

  const now = performance.now()
  const enemies = allEnemies.filter((enemy) => enemy.animation !== 'dead')
  const biomeEnemies = enemies.filter((enemy) => enemy.biome === biome && !enemy.boss)
  const visibleEnemies = biomeEnemies.slice(0, 7)
  const boss = enemies.find((enemy) => enemy.boss)
  const prayerActive = boss?.bossType === 'aku' && (phase === 'final-intro' || phase === 'playing')
  const gateStatus = biomeEnemies.length > 0
    ? `Ön geçit mühürlü · ${biomeEnemies.length} tehdit kaldı`
    : spawnedWaves.length === 0
      ? 'İlk dalga yaklaşıyor'
      : 'Biyom taranıyor · geçit durumu güncelleniyor'
  const flow = feed.slice(-5).reverse()

  return (
    <div className="combat-hud" aria-label="Oyun bilgi ekranı">
      <header className="brand-lockup"><span>MERBUT</span><small>{BIOMES[biome].title.toUpperCase()} · {DIFFICULTIES[difficulty].label.toUpperCase()}</small></header>
      <div className="hud-timer"><small>GEÇEN SÜRE</small><b>{formatTime(elapsed)}</b></div>
      {biomeBannerUntil > now ? <div className="biome-banner" role="status"><small>YENİ BİYOM</small><strong>{BIOMES[biome].title}</strong><i /></div> : null}
      {boss ? <div className={`boss-hud${boss.bossType === 'aku' ? ' boss-hud--aku' : ''}`}><small>{boss.bossType === 'aku' ? `FINAL BOSS · ${boss.bossForm === 'monster' ? 'CANAVAR FORMU' : 'NORMAL FORM'}` : 'BOSS · AKU’NUN GÖLGESİ'}</small><strong>{boss.title}</strong><i><b style={{ width: `${boss.health / boss.maxHealth * 100}%`, background: boss.bossForm === 'monster' ? '#b7ff45' : boss.accent }} /></i><span>{Math.ceil(boss.health)} / {boss.maxHealth}{boss.bossType === 'aku' ? ' · CAN YENİLENİYOR' : ''}</span></div> : null}
      {prayerActive ? <div className="prayer-status" role="status"><i /> DUA KUDRETİ · VURUŞLA VE ZAMANLA CAN YENİLEME</div> : null}
      <div className={`together-warning${togetherWarning ? ' is-visible' : ''}`} role="alert"><span /> Birlikte kalın</div>

      <aside className="score-stack" aria-label="Skorlar">
        <div><span>HZ. ALİ</span><b>{players.ali.score.toLocaleString('tr-TR')}</b><em>{players.ali.kills} KILL</em></div>
        <div><span>SAMURAY JACK</span><b>{players.jack.score.toLocaleString('tr-TR')}</b><em>{players.jack.kills} KILL</em></div>
        <section className="combat-flow" aria-live="polite"><header><span>OYUN AKIŞI</span><b>{biome + 1}/7</b></header><p className="is-objective">{gateStatus}</p>{flow.map((item, index) => <p className={`is-${item.tone}`} key={item.id}><i>{String(index + 1).padStart(2, '0')}</i>{item.text}</p>)}</section>
      </aside>

      <aside className="enemy-roster" aria-label="Canavar durumları">
        <header><small>TEHDİT TARAMASI</small><b>{biomeEnemies.length}</b></header>
        {visibleEnemies.map((enemy) => <div key={enemy.id}><span><strong>{enemy.title}</strong><em>{Math.ceil(enemy.health)}/{enemy.maxHealth}</em></span><i><b style={{ width: `${enemy.health / enemy.maxHealth * 100}%`, background: enemy.accent }} /></i></div>)}
        {biomeEnemies.length > visibleEnemies.length ? <p>+{biomeEnemies.length - visibleEnemies.length} tehdit sahada</p> : null}
        {biomeEnemies.length === 0 ? <p className="is-clear">TARAMA SÜRÜYOR</p> : null}
      </aside>

      <PlayerHud id="ali" player={players.ali} prayerActive={prayerActive} now={now} />
      <PlayerHud id="jack" player={players.jack} prayerActive={prayerActive} now={now} />
    </div>
  )
}
