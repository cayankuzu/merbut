import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils, Quaternion, Vector3 } from 'three'
import { gameAudio } from '../audio/gameAudio'
import { bladeEntry, type BladeKey } from '../game/vfx/bladeRegistry'
import { flash } from '../game/vfx/effects'
import { emitInto, vfxPools, type VfxPools } from '../game/vfx/particles'
import { simClock } from '../sim/clock'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'

/**
 * Jack wears his katana at the left hip, like the samurai he is: it stays in
 * its black lacquer saya while he walks and is drawn in a flash for the cut.
 * After a calm moment he sheathes it again with a soft click.
 */
const SHEATHE_AFTER_MS = 1_600
/** The saya runs back and down from the hip. Local +Y of the group points to the tip. */
const SAYA_DIRECTION = new Vector3(-1, -0.66, 0).normalize()
const UP = new Vector3(0, 1, 0)

/** What drives the saya: the game world by default, or the menu's showcase stage. */
export interface SheathSource {
  /** Attacking or guarding: the blade must be out. */
  fighting: () => boolean
  /** Cinematics keep the blade drawn. */
  keepDrawn: () => boolean
  /** Draw and sheathe are heard only in live play. */
  audible: () => boolean
  /** Whether drawing the blade throws a glint of light. */
  glint: () => boolean
  /** Milliseconds. */
  now: () => number
  sheatheAfterMs: number
  pools: VfxPools
  /** Maps a world position into the pools' frame (the game's pools live in world space). */
  toPoolSpace?: (point: Vector3) => Vector3
}

const GAME_SHEATH: SheathSource = {
  fighting: () => {
    const animation = useGameStore.getState().animationStates.jack
    return animation === 'attack' || animation === 'shield'
  },
  keepDrawn: () => useSessionStore.getState().phase !== 'playing',
  audible: () => useSessionStore.getState().phase === 'playing',
  glint: () => useSessionStore.getState().phase === 'playing',
  now: () => simClock.now(),
  sheatheAfterMs: SHEATHE_AFTER_MS,
  pools: vfxPools,
}

export function JackSheath({ blade = 'jack', facingGroup, source = GAME_SHEATH }: { blade?: BladeKey; facingGroup: React.RefObject<Group | null>; source?: SheathSource }) {
  const saya = useRef<Group>(null)
  const handle = useRef<Group>(null)
  const state = useRef({ drawn: false, lastActionAt: -Infinity, hipHeight: 0 })
  const orientation = useMemo(() => new Quaternion().setFromUnitVectors(UP, SAYA_DIRECTION), [])
  const scratch = useMemo(() => ({ hips: new Vector3(), local: new Vector3(), glint: new Vector3() }), [])

  useFrame(() => {
    const entry = bladeEntry(blade)
    const group = facingGroup.current
    if (!entry || !group || !saya.current) return
    const now = source.now()
    const fighting = source.fighting()
    if (fighting) state.current.lastActionAt = now
    // Cinematics keep the blade drawn: the prayer, the portal, the boss intros.
    const drawn = fighting || source.keepDrawn() || now - state.current.lastActionAt < source.sheatheAfterMs
    if (entry.hips) {
      entry.hips.updateWorldMatrix(true, false)
      entry.hips.getWorldPosition(scratch.hips)
    }
    if (drawn !== state.current.drawn) {
      state.current.drawn = drawn
      if (source.audible()) gameAudio.play(drawn ? 'sword-draw' : 'sword-sheathe', 0)
      // The iai flash: a glint of steel at the hip as the blade leaves the saya.
      if (drawn && entry.hips && source.glint()) {
        const glint = scratch.glint.copy(scratch.hips)
        glint.y += 0.2
        source.toPoolSpace?.(glint)
        emitInto(source.pools, () => flash(glint.x, glint.y, '#e8f6ff', 1.3, 0.1))
      }
    }
    entry.weapon.visible = drawn
    if (handle.current) handle.current.visible = !drawn

    if (entry.hips) {
      group.updateWorldMatrix(true, false)
      scratch.local.copy(scratch.hips)
      group.worldToLocal(scratch.local)
      if (state.current.hipHeight === 0 && scratch.local.y > 0.2) state.current.hipHeight = scratch.local.y
      const size = state.current.hipHeight || 1.2
      // Mouth of the saya just in front of the left hip (left is -Z when facing +X).
      saya.current.position.set(scratch.local.x + size * 0.08, scratch.local.y - size * 0.02, scratch.local.z - size * 0.2)
      saya.current.scale.setScalar(MathUtils.clamp(size * 0.86, 0.5, 1.8))
    }
    saya.current.quaternion.copy(orientation)
  })

  return (
    <group ref={saya} name="jack-saya">
      {/* scabbard: black lacquer, flattened, with a gold end cap and a white cord */}
      <mesh position={[0, 0.5, 0]} scale={[1, 1, 0.72]}>
        <cylinderGeometry args={[0.028, 0.034, 1, 10]} />
        <meshStandardMaterial color="#0c0a0c" roughness={0.18} metalness={0.2} />
      </mesh>
      <mesh position={[0, 1.01, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.04, 10]} />
        <meshStandardMaterial color="#c9a04c" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.16, 0.03]} rotation={[0, 0, 0.4]}>
        <torusGeometry args={[0.04, 0.008, 6, 14]} />
        <meshStandardMaterial color="#f2efe6" roughness={0.8} />
      </mesh>
      <group ref={handle}>
        {/* tsuba guard and the white-wrapped tsuka sticking forward from the mouth */}
        <mesh position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.012, 16]} />
          <meshStandardMaterial color="#2a2420" roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.024, 0.026, 0.28, 8]} />
          <meshStandardMaterial color="#efece4" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.305, 0]}>
          <cylinderGeometry args={[0.027, 0.027, 0.02, 8]} />
          <meshStandardMaterial color="#1a1614" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
