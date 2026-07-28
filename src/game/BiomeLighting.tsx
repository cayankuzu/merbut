import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Object3D,
} from 'three'
import { biomeAtmosphere } from '../config/biomeAtmosphere'
import { getBiomeBlend } from '../config/biomes'
import { useGameStore } from '../store/gameStore'
import { PERFORMANCE_PROFILES, usePerformanceStore } from '../store/performanceStore'
import { useSessionStore } from '../store/sessionStore'

const targetFog = new Color()
const targetSky = new Color()
const targetGround = new Color()
const targetAccent = new Color()
const nextFog = new Color()
const nextSky = new Color()
const nextGround = new Color()
const nextAccent = new Color()

export function BiomeLighting() {
  const { scene } = useThree()
  const group = useRef<Group>(null)
  const ambient = useRef<AmbientLight>(null)
  const hemisphere = useRef<HemisphereLight>(null)
  const directional = useRef<DirectionalLight>(null)
  const directionalTarget = useRef<Object3D>(null)
  const accent = useRef<DirectionalLight>(null)
  const fog = useMemo(() => new Fog('#56342f', 18, 35), [])
  const tier = usePerformanceStore((state) => state.tier)
  const profile = PERFORMANCE_PROFILES[tier]

  useEffect(() => {
    scene.fog = fog
    if (directional.current && directionalTarget.current) {
      directional.current.target = directionalTarget.current
      if (accent.current) accent.current.target = directionalTarget.current
    }
    return () => {
      if (scene.fog === fog) scene.fog = null
    }
  }, [fog, scene])

  useFrame((_, delta) => {
    const cameraX = useGameStore.getState().cameraX
    const blend = getBiomeBlend(cameraX)
    const fromAtmosphere = biomeAtmosphere(blend.from)
    const toAtmosphere = biomeAtmosphere(blend.to)
    const session = useSessionStore.getState()
    const cinematic = session.phase === 'boss-intro' || session.phase === 'final-intro' || session.phase === 'ending'
    const terminal = session.bossPhase === 'portal' || session.bossPhase === 'falling'
    const smoothing = 1 - Math.exp(-Math.min(delta, 0.1) * 2.8)
    const fogNear = fromAtmosphere.fogNear + (toAtmosphere.fogNear - fromAtmosphere.fogNear) * blend.mix
    const fogFar = fromAtmosphere.fogFar + (toAtmosphere.fogFar - fromAtmosphere.fogFar) * blend.mix
    const pulse = 1 + Math.sin(performance.now() * 0.0034) * (terminal ? 0.12 : cinematic ? 0.045 : 0.018)

    targetFog.set(blend.from.fogColor).lerp(nextFog.set(blend.to.fogColor), blend.mix)
    targetSky.set(blend.from.skyColor).lerp(nextSky.set(blend.to.skyColor), blend.mix)
    targetGround.set(blend.from.groundDark).lerp(nextGround.set(blend.to.groundDark), blend.mix)
    targetAccent.set(blend.from.accentColor).lerp(nextAccent.set(blend.to.accentColor), blend.mix)

    fog.color.lerp(targetFog, smoothing)
    fog.near += (fogNear - fog.near) * smoothing
    fog.far += (fogFar - fog.far) * smoothing
    if (group.current) group.current.position.x = cameraX
    if (ambient.current) {
      ambient.current.color.lerp(targetSky, smoothing)
      ambient.current.intensity += ((cinematic ? 1.38 : 1.25) - ambient.current.intensity) * smoothing
    }
    if (hemisphere.current) {
      hemisphere.current.color.lerp(targetSky, smoothing)
      hemisphere.current.groundColor.lerp(targetGround, smoothing)
      hemisphere.current.intensity += ((cinematic ? 1.14 : 1.02) - hemisphere.current.intensity) * smoothing
    }
    if (directional.current) {
      directional.current.color.lerp(targetSky, smoothing)
      directional.current.intensity += ((cinematic ? (terminal ? 2.78 : 2.46) : 2.15) - directional.current.intensity) * smoothing
    }
    if (accent.current) {
      accent.current.color.lerp(targetAccent, smoothing)
      accent.current.intensity += ((cinematic ? (terminal ? 1.05 : 0.84) : 0.62) * pulse - accent.current.intensity) * smoothing
    }
  })

  return (
    <group ref={group} name="biome-light-rig">
      <ambientLight ref={ambient} intensity={1.25} color="#ffe0bb" />
      <hemisphereLight ref={hemisphere} args={['#ffe0bb', '#3d242e', 1.02]} />
      <directionalLight
        ref={directional}
        castShadow={profile.shadows}
        position={[-4, 9, 7]}
        intensity={2.15}
        color="#ffe0bb"
        shadow-mapSize={[profile.shadowMapSize, profile.shadowMapSize]}
        shadow-camera-left={-13}
        shadow-camera-right={13}
        shadow-camera-top={11}
        shadow-camera-bottom={-3}
        shadow-bias={-0.00025}
      />
      <object3D ref={directionalTarget} position={[0, 1.2, 0]} />
      {profile.dynamicLights ? <directionalLight ref={accent} position={[7, 5, 4]} intensity={0.62} color="#ff286f" /> : null}
    </group>
  )
}
