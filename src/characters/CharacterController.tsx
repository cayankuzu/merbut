import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils } from 'three'
import { resolveAnimationState } from '../animation/animationStateMachine'
import { ATTACK_DURATION, CHAIN_WINDOW_MS, LUNGE } from '../config/combat'
import { GAME_CONFIG } from '../config/gameConfig'
import { keyboard } from '../input/keyboardManager'
import { playerInput } from '../input/playerInput'
import { simClock } from '../sim/clock'
import { groundModifiers } from '../sim/mechanics'
import { heroGap } from '../sim/enemyAI'
import { resolveCoopAxis, resolveCoopBounds, stepMovement } from '../sim/movement'
import { useDebugStore } from '../store/debugStore'
import { useGameStore, type AttackStep } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import { useTutorialStore } from '../store/tutorialStore'
import type { AnimationState } from '../types/animation'
import type { CharacterDefinition } from '../types/character'
import { AnimatedCharacter } from './AnimatedCharacter'
import { JackSheath } from './JackSheath'
import { PrayerHalo } from '../game/PrayerHalo'
import { TimeFreezeAura } from '../game/TimeFreezeAura'
import { DashTrail } from '../game/DashTrail'
import { HeroMarker } from '../game/HeroMarker'
import { labOff } from '../utils/labFlags'

interface CharacterControllerProps {
  definition: CharacterDefinition
}

const FULL_TURN = Math.PI * 2
const { movement } = GAME_CONFIG

function nearestEquivalentAngle(target: number, current: number) {
  return current + MathUtils.euclideanModulo(target - current + Math.PI, FULL_TURN) - Math.PI
}

interface MotionState {
  x: number
  y: number
  velocityX: number
  velocityY: number
  grounded: boolean
  coyoteRemaining: number
  jumpBufferRemaining: number
  airJumpsRemaining: number
  attackRemaining: number
  dashRemaining: number
  dashCooldown: number
  dashDirection: -1 | 1
  accumulator: number
  facing: number
  manualRotation: number
}

const freshMotion = (x: number, y: number): MotionState => ({
  x,
  y,
  velocityX: 0,
  velocityY: 0,
  grounded: true,
  coyoteRemaining: movement.coyoteTime,
  jumpBufferRemaining: 0,
  airJumpsRemaining: movement.airJumps,
  attackRemaining: 0,
  dashRemaining: 0,
  dashCooldown: 0,
  dashDirection: 1,
  accumulator: 0,
  facing: 0,
  manualRotation: 0,
})

export function CharacterController({ definition }: CharacterControllerProps) {
  const root = useRef<Group>(null)
  const facingGroup = useRef<Group>(null)
  const id = definition.id
  const groundHeight = useDebugStore((state) => state.groundHeight)
  const resetToken = useGameStore((state) => state.resetToken)
  const sessionToken = useSessionStore((state) => state.sessionToken)
  const prayerActive = useSessionStore((state) => (state.phase === 'final-intro' || state.phase === 'playing') && state.enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead'))
  const teleportRequest = useGameStore((state) => state.teleports[id])
  const impulse = useGameStore((state) => state.impulses[id])
  const appliedTeleportToken = useRef(0)
  const appliedImpulseToken = useRef(0)
  const transformPublishElapsed = useRef(0)
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const [animationSignal, setAnimationSignal] = useState(0)
  const [attackDuration, setAttackDuration] = useState(ATTACK_DURATION[1])
  const chain = useRef<{ step: AttackStep; startedAt: number }>({ step: 1, startedAt: -Infinity })
  const activeAnimation = useRef<AnimationState>('idle')
  const motion = useRef<MotionState>(freshMotion(definition.startPosition[0], groundHeight))

  useEffect(() => {
    keyboard.start()
    return () => keyboard.stop()
  }, [])

  useEffect(() => {
    motion.current = freshMotion(definition.startPosition[0], groundHeight)
    transformPublishElapsed.current = 0
    if (facingGroup.current) facingGroup.current.rotation.y = 0
    activeAnimation.current = 'idle'
    setAnimationState('idle')
    setAnimationSignal(0)
    useGameStore.getState().setPlayerAnimation(id, 'idle')
    useGameStore.getState().setPlayerRotation(id, 0)
    playerInput.clear()
  }, [definition.startPosition, groundHeight, id, resetToken, sessionToken])

  useEffect(() => {
    if (teleportRequest.token <= appliedTeleportToken.current) return
    appliedTeleportToken.current = teleportRequest.token
    const value = motion.current
    Object.assign(value, { x: teleportRequest.x, y: groundHeight, velocityX: 0, velocityY: 0, grounded: true, airJumpsRemaining: movement.airJumps, accumulator: 0, dashRemaining: 0 })
    root.current?.position.set(teleportRequest.x, groundHeight, 0)
    useGameStore.getState().setPlayerPosition(id, [teleportRequest.x, groundHeight, 0])
  }, [groundHeight, id, teleportRequest])

  useEffect(() => {
    if (impulse.token <= appliedImpulseToken.current) return
    appliedImpulseToken.current = impulse.token
    const value = motion.current
    value.velocityX += impulse.vx
    if (impulse.vy > 0) {
      value.velocityY = impulse.vy
      value.grounded = false
    }
  }, [impulse])

  const setAnimation = (next: AnimationState) => {
    if (next === activeAnimation.current) return
    activeAnimation.current = next
    setAnimationState(next)
    useGameStore.getState().setPlayerAnimation(id, next)
  }

  useFrame((_, frameDelta) => {
    const value = motion.current
    const now = simClock.now()
    const delta = Math.min(frameDelta, 0.1) * simClock.scale()
    const session = useSessionStore.getState()
    const status = session.players[id]
    const tutorial = useTutorialStore.getState()

    if (session.phase !== 'playing' || status.dead || status.frozenUntil > now) {
      value.velocityX = 0
      value.accumulator = 0
      value.attackRemaining = 0
      value.dashRemaining = 0
      const drinking = session.phase === 'boss-intro' && session.bossPhase === 'drinking'
      const praying = session.phase === 'final-intro' && session.bossPhase === 'prayer'
      setAnimation(status.dead
        ? 'dead'
        : praying && id === 'jack'
          ? 'shield'
          : drinking
            ? id === 'ali' ? 'fireball' : 'attack'
            : 'idle')
      if (root.current) {
        root.current.visible = session.phase !== 'ending' || session.bossPhase !== 'continued'
        if (session.phase === 'ending' && session.bossPhase === 'falling') {
          const progress = MathUtils.clamp((now - session.bossPhaseStartedAt - 5_200) / 2_200, 0, 1)
          const eased = progress * progress * (3 - 2 * progress)
          root.current.position.set(
            value.x + (session.endingPortalX - value.x) * eased,
            value.y - eased * 4.2 - (id === 'ali' ? 0.18 : 0),
            (id === 'ali' ? -0.72 : 0.72) * (1 - eased),
          )
          root.current.rotation.z = eased * (id === 'ali' ? -1.1 : 1.1)
          root.current.scale.setScalar(1 - eased * 0.72)
        } else {
          root.current.position.set(value.x, value.y, 0)
          root.current.rotation.z = 0
          root.current.scale.setScalar(1)
        }
      }
      return
    }

    if (root.current) {
      root.current.visible = true
      root.current.scale.setScalar(1)
    }

    if (playerInput.consumePress(id, 'ability')) {
      const used = id === 'jack'
        ? session.activateShield(now)
        : session.launchFireball(now, value.x, value.y, value.facing + value.manualRotation)
      if (used) tutorial.markLearned(id, 'ability')
    }
    const abilityActive = useSessionStore.getState().players[id].abilityActiveUntil > now
    const shielding = id === 'jack' && abilityActive
    const castingFireball = id === 'ali' && abilityActive
    let attackTriggered = false

    if (playerInput.consumePress(id, 'jump')) value.jumpBufferRemaining = movement.jumpBuffer
    if (playerInput.consumePress(id, 'dash') && value.dashCooldown <= 0 && session.startDodge(id, now)) {
      const left = playerInput.isDown(id, 'left')
      const right = playerInput.isDown(id, 'right')
      const facingSign = Math.cos(value.facing + value.manualRotation) >= 0 ? 1 : -1
      value.dashDirection = left !== right ? (left ? -1 : 1) : facingSign
      value.dashRemaining = movement.dashSeconds
      value.dashCooldown = movement.dashCooldown
      value.attackRemaining = 0
      value.velocityY = Math.max(0, value.velocityY) * 0.35
      tutorial.markLearned(id, 'dash')
    }
    let attackStep: AttackStep = 1
    if (playerInput.consumePress(id, 'attack') && !abilityActive && value.attackRemaining <= 0 && value.dashRemaining <= 0) {
      const previous = chain.current
      attackStep = now - previous.startedAt < CHAIN_WINDOW_MS && previous.step < 3 ? (previous.step + 1) as AttackStep : 1
      chain.current = { step: attackStep, startedAt: now }
      value.attackRemaining = ATTACK_DURATION[attackStep]
      // Every cut steps into the blow; the finisher lunges hardest.
      if (value.grounded) value.velocityX += (Math.cos(value.facing + value.manualRotation) >= 0 ? 1 : -1) * LUNGE[attackStep]
      attackTriggered = true
      tutorial.markLearned(id, 'attack')
    }

    // Never repay a long render stall with a second CPU-heavy catch-up frame.
    value.accumulator = Math.min(value.accumulator + delta, 0.075)
    const game = useGameStore.getState()

    while (value.accumulator >= movement.fixedStep) {
      const step = movement.fixedStep
      const left = playerInput.isDown(id, 'left')
      const right = playerInput.isDown(id, 'right')
      let movementAxis: -1 | 0 | 1 = left === right ? 0 : left ? -1 : 1
      const rotateLeft = playerInput.isDown(id, 'rotateLeft')
      const rotateRight = playerInput.isDown(id, 'rotateRight')
      const rotationAxis = rotateLeft === rotateRight ? 0 : rotateLeft ? -1 : 1

      const otherId = id === 'ali' ? 'jack' : 'ali'
      const otherX = game.positions[otherId][0]
      const otherAlive = !useSessionStore.getState().players[otherId].dead
      // What the player is pressing, before co-op distance and bodies veto the step:
      // the hero still turns that way, so pushing into an enemy behind you faces it.
      const intendedAxis = movementAxis
      movementAxis = resolveCoopAxis(value.x, otherX, movementAxis, otherAlive, GAME_CONFIG.world.maxPlayerDistance)
      // Bodies block: a hero cannot walk through a living creature (a dash can).
      if (movementAxis !== 0 && value.dashRemaining <= 0 && value.grounded) {
        const blocked = useSessionStore.getState().enemies.some((enemy) => enemy.animation !== 'dead'
          && (enemy.x - value.x) * movementAxis > 0
          && Math.abs(enemy.x - value.x) < heroGap(enemy.scale) + 0.05)
        if (blocked) movementAxis = 0
      }
      const bounds = resolveCoopBounds({
        characterLeft: GAME_CONFIG.world.left + (id === 'jack' ? 2.3 : 0),
        characterRight: GAME_CONFIG.world.right - (id === 'ali' ? 2.3 : 0),
        lockedLeft: useSessionStore.getState().lockedLeft,
        lockedRight: useSessionStore.getState().lockedRight,
        otherX,
        otherAlive,
        maxDistance: GAME_CONFIG.world.maxPlayerDistance,
      })

      value.coyoteRemaining = value.grounded ? movement.coyoteTime : Math.max(0, value.coyoteRemaining - step)
      value.jumpBufferRemaining = Math.max(0, value.jumpBufferRemaining - step)
      value.attackRemaining = Math.max(0, value.attackRemaining - step)
      value.dashCooldown = Math.max(0, value.dashCooldown - step)

      const canGroundJump = value.grounded || value.coyoteRemaining > 0
      const canAirJump = !canGroundJump && value.airJumpsRemaining > 0
      const shouldJump = value.jumpBufferRemaining > 0 && (canGroundJump || canAirJump)
      if (shouldJump) {
        value.jumpBufferRemaining = 0
        value.coyoteRemaining = 0
        if (canAirJump) value.airJumpsRemaining -= 1
        tutorial.markLearned(id, 'jump')
      }

      const ground = groundModifiers(value.x, now)
      const dashing = value.dashRemaining > 0
      if (dashing) {
        value.dashRemaining = Math.max(0, value.dashRemaining - step)
        value.velocityX = value.dashDirection * movement.dashSpeed
      }
      const result = stepMovement({
        x: value.x,
        y: value.y,
        velocityX: value.velocityX,
        velocityY: value.velocityY,
        axis: dashing ? value.dashDirection : movementAxis,
        jumpRequested: shouldJump,
        grounded: value.grounded,
        delta: step,
        groundHeight,
        leftBound: bounds.left,
        rightBound: bounds.right,
        maxSpeed: dashing ? movement.dashSpeed : movement.maxSpeed * ground.speed,
        acceleration: dashing ? 0 : (value.grounded ? movement.groundAcceleration : movement.airAcceleration) * (ground.traction < 1 ? 0.35 : 1),
        deceleration: dashing ? 0 : (value.grounded ? movement.groundDeceleration * ground.traction : movement.airAcceleration),
        gravity: dashing ? movement.gravity * 0.2 : movement.gravity,
        jumpVelocity: movement.jumpVelocity,
        // Belts only carry feet that touch them; wind pushes in the air too.
        drift: ground.windX + (value.grounded && !dashing ? ground.belt : 0),
      })

      Object.assign(value, result)
      if (result.grounded) value.airJumpsRemaining = movement.airJumps
      if (intendedAxis !== 0 && !dashing) {
        value.facing = nearestEquivalentAngle(intendedAxis > 0 ? 0 : Math.PI, value.facing + value.manualRotation)
        value.manualRotation = 0
        if (Math.abs(value.velocityX) > 1) tutorial.markLearned(id, 'move')
      } else if (rotationAxis !== 0) {
        value.manualRotation += rotationAxis * movement.rotationSpeed * step
      }
      value.accumulator -= step
    }

    const targetRotation = value.facing + value.manualRotation
    if (facingGroup.current) {
      const spinning = chain.current.step === 3 && value.attackRemaining > 0
      if (spinning) {
        // The finisher turns a full circle and ends facing the same way.
        const progress = 1 - value.attackRemaining / ATTACK_DURATION[3]
        const eased = progress * progress * (3 - 2 * progress)
        facingGroup.current.rotation.y = targetRotation + eased * Math.PI * 2
      } else {
        // Unwind any leftover full turn so the damp never spins back the long way.
        const current = nearestEquivalentAngle(facingGroup.current.rotation.y, targetRotation)
        facingGroup.current.rotation.y = MathUtils.damp(current, targetRotation, 16, delta)
      }
      // A short forward lean sells the dash without a dedicated clip.
      const lean = value.dashRemaining > 0 ? -0.32 : 0
      facingGroup.current.rotation.z = MathUtils.damp(facingGroup.current.rotation.z, lean, 18, delta)
    }
    if (root.current) root.current.position.set(value.x, value.y, 0)

    const nextAnimation: AnimationState = shielding
      ? 'shield'
      : castingFireball
        ? 'fireball'
        : resolveAnimationState({
          attacking: value.attackRemaining > 0,
          grounded: value.grounded,
          speed: Math.abs(value.velocityX),
        })
    if (attackTriggered) {
      if (activeAnimation.current !== 'attack') {
        activeAnimation.current = 'attack'
        setAnimationState('attack')
      }
      setAnimationSignal((signal) => signal + 1)
      setAttackDuration(ATTACK_DURATION[attackStep])
      game.triggerPlayerAttack(id, attackStep)
    } else {
      setAnimation(nextAnimation)
    }

    transformPublishElapsed.current += delta
    if (attackTriggered || transformPublishElapsed.current >= 1 / 30) {
      transformPublishElapsed.current %= 1 / 30
      game.setPlayerTransform(id, [value.x, value.y, 0], targetRotation)
      const positions = useGameStore.getState().positions
      const players = useSessionStore.getState().players
      game.setTogetherWarning(!players.ali.dead && !players.jack.dead && Math.abs(positions.ali[0] - positions.jack[0]) >= GAME_CONFIG.world.warningDistance)
    }
  })

  return (
    <group ref={root} name={id} position={definition.startPosition}>
      <group ref={facingGroup}>
        <AnimatedCharacter
          bladeId={definition.id}
          definition={definition}
          animationDurationSeconds={animationState === 'attack' ? attackDuration : undefined}
          animationSignal={animationSignal}
          animationState={animationState}
        />
        {id === 'jack' ? <JackSheath facingGroup={facingGroup} /> : null}
      </group>
      {labOff('markers') ? null : <HeroMarker definition={definition} />}
      {labOff('markers') ? null : <DashTrail id={id} />}
      <PrayerHalo active={prayerActive} id={id} />
      <TimeFreezeAura id={id} />
    </group>
  )
}
