import { AliCharacter } from '../characters/AliCharacter'
import { JackCharacter } from '../characters/JackCharacter'
import { BiomeLighting } from './BiomeLighting'
import { BiomeAtmosphere } from './BiomeAtmosphere'
import { VfxLayer } from './vfx/VfxLayer'
import { DustParticles } from './DustParticles'
import { GameCamera } from './GameCamera'
import { Ground } from './Ground'
import { WeatherSystem } from '../world/WeatherSystem'
import { MechanicsVisuals } from '../world/MechanicsVisuals'
import { BiomeDressing } from '../world/BiomeDressing'
import { BiomeLockGates } from './BiomeLockGates'
import { EnemySystem } from './EnemySystem'
import { FireballProjectiles } from './FireballProjectiles'
import { SimulationLoop } from '../sim/SimulationLoop'
import { JackShield } from './JackShield'
import { ZemzemPickups } from './ZemzemPickups'
import { PlayerDeathEffects } from './PlayerDeathEffects'
import { CombatImpactEffects } from './CombatImpactEffects'
import { EnemyProjectileEffects } from './EnemyProjectileEffects'
import { BossIntroSequence } from './BossIntroSequence'
import { BossBattleEffects } from './BossBattleEffects'
import { FinalPortal } from './FinalPortal'
import { useSessionStore } from '../store/sessionStore'
import { labOff } from '../utils/labFlags'
import { ActorContactShadows } from './ActorContactShadows'
import { DamageNumbers } from './feedback/DamageNumbers'

export function GameWorld() {
  const phase = useSessionStore((state) => state.phase)
  const showCombatActors = phase !== 'menu' && phase !== 'controls'
  return (
    <>
      <GameCamera />
      <SimulationLoop />
      <BiomeLighting />
      <BiomeAtmosphere />

      {showCombatActors ? <>
        <AliCharacter />
        <JackCharacter />
        <ActorContactShadows />
        <EnemySystem />
        <ZemzemPickups />
        {labOff('vfx') ? null : <VfxLayer />}
        <FireballProjectiles />
        <EnemyProjectileEffects />
        <CombatImpactEffects />
        <JackShield />
        <BossIntroSequence />
        <BossBattleEffects />
        <FinalPortal />
        <PlayerDeathEffects />
        {labOff('numbers') ? null : <DamageNumbers />}
      </> : null}
      <Ground />
      {labOff('dressing') ? null : <BiomeDressing />}
      {labOff('mechanics') ? null : <MechanicsVisuals />}
      {labOff('weather') ? null : <WeatherSystem />}
      {labOff('gates') ? null : <BiomeLockGates />}
      <DustParticles />
    </>
  )
}
