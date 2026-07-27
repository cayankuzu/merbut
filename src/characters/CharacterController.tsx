import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils } from 'three'
import { resolveAnimationState } from '../animation/animationStateMachine'
import { GAME_CONFIG } from '../config/gameConfig'
import { useKeyboard } from '../hooks/useKeyboard'
import { useDebugStore } from '../store/debugStore'
import { useGameStore } from '../store/gameStore'
import { useSessionStore } from '../store/sessionStore'
import type { AnimationState } from '../types/animation'
import type { CharacterDefinition } from '../types/character'
import { resolveCoopAxis, resolveCoopBounds, stepMovement } from '../game/movement'
import { AnimatedCharacter } from './AnimatedCharacter'
import { WorldHealthBar } from '../game/WorldHealthBar'
import { PrayerHalo } from '../game/PrayerHalo'
import { TimeFreezeAura } from '../game/TimeFreezeAura'

interface CharacterControllerProps {
  definition: CharacterDefinition
}

const ATTACK_DURATION = 1.5333 / 1.25
const FULL_TURN = Math.PI * 2

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
  accumulator: number
  facing: number
  manualRotation: number
}

export function CharacterController({ definition }: CharacterControllerProps) {
  const root = useRef<Group>(null)
  const facingGroup = useRef<Group>(null)
  const keyboard = useKeyboard()
  const groundHeight = useDebugStore((state) => state.groundHeight)
  const resetToken = useGameStore((state) => state.resetToken)
  const sessionToken = useSessionStore((state) => state.sessionToken)
  const phase = useSessionStore((state) => state.phase)
  const playerStatus = useSessionStore((state) => state.players[definition.id])
  const showWorldHud = ['countdown', 'boss-intro', 'final-intro', 'playing', 'paused'].includes(phase)
  const prayerActive = useSessionStore((state) => (state.phase === 'final-intro' || state.phase === 'playing') && state.enemies.some((enemy) => enemy.bossType === 'aku' && enemy.animation !== 'dead'))
  const setPlayerPosition = useGameStore((state) => state.setPlayerPosition)
  const setPlayerRotation = useGameStore((state) => state.setPlayerRotation)
  const setPlayerAnimation = useGameStore((state) => state.setPlayerAnimation)
  const setTogetherWarning = useGameStore((state) => state.setTogetherWarning)
  const [animationState, setAnimationState] = useState<AnimationState>('idle')
  const activeAnimation = useRef<AnimationState>('idle')
  const motion = useRef<MotionState>({
    x: definition.startPosition[0],
    y: groundHeight,
    velocityX: 0,
    velocityY: 0,
    grounded: true,
    coyoteRemaining: GAME_CONFIG.movement.coyoteTime,
    jumpBufferRemaining: 0,
    airJumpsRemaining: GAME_CONFIG.movement.airJumps,
    attackRemaining: 0,
    accumulator: 0,
    facing: 0,
    manualRotation: 0,
  })

  useEffect(() => {
    const value = motion.current
    value.x = definition.startPosition[0]
    value.y = groundHeight
    value.velocityX = 0
    value.velocityY = 0
    value.grounded = true
    value.coyoteRemaining = GAME_CONFIG.movement.coyoteTime
    value.jumpBufferRemaining = 0
    value.airJumpsRemaining = GAME_CONFIG.movement.airJumps
    value.attackRemaining = 0
    value.accumulator = 0
    value.facing = 0
    value.manualRotation = 0
    if (facingGroup.current) facingGroup.current.rotation.y = 0
    activeAnimation.current = 'idle'
    setAnimationState('idle')
    setPlayerAnimation(definition.id, 'idle')
    setPlayerRotation(definition.id, 0)
    keyboard.clear()
  }, [definition.id, definition.startPosition, groundHeight, keyboard, resetToken, sessionToken, setPlayerAnimation, setPlayerRotation])

  useFrame((_, frameDelta) => {
    const value = motion.current
    const delta = Math.min(frameDelta, 0.1)
    const { bindings } = definition
    const now = performance.now()
    const session = useSessionStore.getState()
    const status = session.players[definition.id]

    const frozen = status.frozenUntil > now
    if (session.phase !== 'playing' || status.dead || frozen) {
      value.velocityX = 0
      value.accumulator = 0
      const drinking = session.phase === 'boss-intro' && session.bossPhase === 'drinking'
      const praying = session.phase === 'final-intro' && session.bossPhase === 'prayer'
      const inactiveState: AnimationState = status.dead
        ? 'dead'
        : praying && definition.id === 'jack'
          ? 'shield'
        : drinking
          ? definition.id === 'ali' ? 'fireball' : 'attack'
          : 'idle'
      if (inactiveState !== activeAnimation.current) {
        activeAnimation.current = inactiveState
        setAnimationState(inactiveState)
        setPlayerAnimation(definition.id, inactiveState)
      }
      if (root.current) {
        root.current.visible = session.phase !== 'ending' || session.bossPhase !== 'continued'
        if (session.phase === 'ending' && session.bossPhase === 'falling') {
          const progress = MathUtils.clamp((now - session.bossPhaseStartedAt - 5_200) / 2_200, 0, 1)
          const eased = progress * progress * (3 - 2 * progress)
          root.current.position.set(
            value.x + (session.endingPortalX - value.x) * eased,
            value.y - eased * 4.2 - (definition.id === 'ali' ? 0.18 : 0),
            (definition.id === 'ali' ? -0.72 : 0.72) * (1 - eased),
          )
          root.current.rotation.z = eased * (definition.id === 'ali' ? -1.1 : 1.1)
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

    if (keyboard.consumePress(bindings.ability)) {
      if (definition.id === 'jack') session.activateShield(now)
      else session.launchFireball(now, value.x, value.y, value.facing + value.manualRotation)
    }
    const abilityActive = useSessionStore.getState().players[definition.id].abilityActiveUntil > now
    const shielding = definition.id === 'jack' && abilityActive
    const castingFireball = definition.id === 'ali' && abilityActive

    if (keyboard.consumePress(bindings.jump)) {
      value.jumpBufferRemaining = GAME_CONFIG.movement.jumpBuffer
    }
    if (!abilityActive && keyboard.consumePress(bindings.attack) && value.attackRemaining <= 0) {
      value.attackRemaining = ATTACK_DURATION
    }

    value.accumulator = Math.min(value.accumulator + delta, 0.15)
    let movementAxis: -1 | 0 | 1 = 0

    while (value.accumulator >= GAME_CONFIG.movement.fixedStep) {
      const step = GAME_CONFIG.movement.fixedStep
      const left = keyboard.isPressed(bindings.left)
      const right = keyboard.isPressed(bindings.right)
      movementAxis = left === right ? 0 : left ? -1 : 1
      const rotateLeft = keyboard.isPressed(bindings.rotateLeft)
      const rotateRight = keyboard.isPressed(bindings.rotateRight)
      const rotationAxis = rotateLeft === rotateRight ? 0 : rotateLeft ? -1 : 1

      const otherId = definition.id === 'ali' ? 'jack' : 'ali'
      const otherX = useGameStore.getState().positions[otherId][0]
      const otherAlive = !useSessionStore.getState().players[otherId].dead
      movementAxis = resolveCoopAxis(value.x, otherX, movementAxis, otherAlive, GAME_CONFIG.world.maxPlayerDistance)
      const characterLeftBound = GAME_CONFIG.world.left + (definition.id === 'jack' ? 2.3 : 0)
      const characterRightBound = GAME_CONFIG.world.right - (definition.id === 'ali' ? 2.3 : 0)
      const coopBounds = resolveCoopBounds({
        characterLeft: characterLeftBound,
        characterRight: characterRightBound,
        lockedLeft: useSessionStore.getState().lockedLeft,
        lockedRight: useSessionStore.getState().lockedRight,
        otherX,
        otherAlive,
        maxDistance: GAME_CONFIG.world.maxPlayerDistance,
      })
      const movementLeftBound = coopBounds.left
      const movementRightBound = coopBounds.right

      value.coyoteRemaining = value.grounded
        ? GAME_CONFIG.movement.coyoteTime
        : Math.max(0, value.coyoteRemaining - step)
      value.jumpBufferRemaining = Math.max(0, value.jumpBufferRemaining - step)
      value.attackRemaining = Math.max(0, value.attackRemaining - step)

      const canGroundJump = value.grounded || value.coyoteRemaining > 0
      const canAirJump = !canGroundJump && value.airJumpsRemaining > 0
      const shouldJump = value.jumpBufferRemaining > 0 && (canGroundJump || canAirJump)
      if (shouldJump) {
        value.jumpBufferRemaining = 0
        value.coyoteRemaining = 0
        if (canAirJump) value.airJumpsRemaining -= 1
      }

      const result = stepMovement({
        x: value.x,
        y: value.y,
        velocityX: value.velocityX,
        velocityY: value.velocityY,
        axis: movementAxis,
        jumpRequested: shouldJump,
        grounded: value.grounded,
        delta: step,
        groundHeight,
        leftBound: movementLeftBound,
        rightBound: movementRightBound,
        maxSpeed: GAME_CONFIG.movement.maxSpeed,
        acceleration: value.grounded
          ? GAME_CONFIG.movement.groundAcceleration
          : GAME_CONFIG.movement.airAcceleration,
        deceleration: value.grounded
          ? GAME_CONFIG.movement.groundDeceleration
          : GAME_CONFIG.movement.airAcceleration,
        gravity: GAME_CONFIG.movement.gravity,
        jumpVelocity: GAME_CONFIG.movement.jumpVelocity,
      })

      Object.assign(value, result)
      if (result.grounded) value.airJumpsRemaining = GAME_CONFIG.movement.airJumps
      if (movementAxis !== 0) {
        const movementFacing = movementAxis > 0 ? 0 : Math.PI
        value.facing = nearestEquivalentAngle(
          movementFacing,
          value.facing + value.manualRotation,
        )
        value.manualRotation = 0
      } else if (rotationAxis !== 0) {
        value.manualRotation += rotationAxis * GAME_CONFIG.movement.rotationSpeed * step
      }
      value.accumulator -= step
    }

    const targetRotation = value.facing + value.manualRotation
    if (facingGroup.current) {
      facingGroup.current.rotation.y = MathUtils.damp(
        facingGroup.current.rotation.y,
        targetRotation,
        16,
        delta,
      )
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
    if (nextAnimation !== activeAnimation.current) {
      activeAnimation.current = nextAnimation
      setAnimationState(nextAnimation)
      setPlayerAnimation(definition.id, nextAnimation)
    }

    setPlayerPosition(definition.id, [value.x, value.y, 0])
    setPlayerRotation(definition.id, targetRotation)
    const positions = useGameStore.getState().positions
    const bothAlive = !useSessionStore.getState().players.ali.dead && !useSessionStore.getState().players.jack.dead
    setTogetherWarning(
      bothAlive && Math.abs(positions.ali[0] - positions.jack[0]) >= GAME_CONFIG.world.warningDistance,
    )
  })

  return (
    <group ref={root} name={definition.id} position={definition.startPosition}>
      <group ref={facingGroup}>
        <AnimatedCharacter definition={definition} animationState={animationState} />
      </group>
      {!playerStatus.dead && showWorldHud ? (
        <group position={[0, 3.18, 0]}>
          <WorldHealthBar
            label={definition.displayName}
            health={playerStatus.health}
            maxHealth={playerStatus.maxHealth}
            accent={definition.accent}
            player
          />
        </group>
      ) : null}
      <PrayerHalo active={prayerActive} id={definition.id} />
      <TimeFreezeAura id={definition.id} />
    </group>
  )
}
