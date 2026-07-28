import { AliCharacter } from '../characters/AliCharacter'
import { JackCharacter } from '../characters/JackCharacter'
import { BiomeLighting } from './BiomeLighting'
import { BiomeAtmosphere } from './BiomeAtmosphere'
import { CombatEffects } from './CombatEffects'
import { DustParticles } from './DustParticles'
import { GameCamera } from './GameCamera'
import { Ground } from './Ground'
import { BiomeScenery } from './BiomeScenery'
import { BiomeLockGates } from './BiomeLockGates'
import { EnemySystem } from './EnemySystem'
import { FireballProjectiles } from './FireballProjectiles'
import { GameDirector } from './GameDirector'
import { JackShield } from './JackShield'
import { ZemzemPickups } from './ZemzemPickups'
import { PlayerDeathEffects } from './PlayerDeathEffects'
import { CombatImpactEffects } from './CombatImpactEffects'
import { EnemyProjectileEffects } from './EnemyProjectileEffects'
import { BossIntroSequence } from './BossIntroSequence'
import { BossBattleEffects } from './BossBattleEffects'
import { FinalPortal } from './FinalPortal'
import { useSessionStore } from '../store/sessionStore'

export function GameWorld() {
  const phase = useSessionStore((state) => state.phase)
  const showCombatActors = phase !== 'menu' && phase !== 'controls'
  return (
    <>
      <GameCamera />
      <GameDirector />
      <BiomeLighting />
      <BiomeAtmosphere />

      {showCombatActors ? <>
        <AliCharacter />
        <JackCharacter />
        <EnemySystem />
        <ZemzemPickups />
        <CombatEffects />
        <FireballProjectiles />
        <EnemyProjectileEffects />
        <CombatImpactEffects />
        <JackShield />
        <BossIntroSequence />
        <BossBattleEffects />
        <FinalPortal />
        <PlayerDeathEffects />
      </> : null}
      <Ground />
      <BiomeScenery />
      <BiomeLockGates />
      <DustParticles />
    </>
  )
}
