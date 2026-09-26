import type { CharacterDefinition } from '../types/character'
import { ASSET_PATHS } from './assetPaths'
import { CAMERA_MAX_X, CAMERA_MIN_X } from './biomes'

const PLAYER_EDGE_REACH = 4.8

export const GAME_CONFIG = {
  world: {
    left: CAMERA_MIN_X - PLAYER_EDGE_REACH,
    right: CAMERA_MAX_X + PLAYER_EDGE_REACH,
    groundHeight: 0,
    maxPlayerDistance: 7.2,
    warningDistance: 6.6,
  },
  movement: {
    maxSpeed: 4.25,
    groundAcceleration: 30,
    groundDeceleration: 36,
    airAcceleration: 12,
    gravity: -23,
    jumpVelocity: 9.15,
    airJumps: 1,
    coyoteTime: 0.11,
    jumpBuffer: 0.13,
    fixedStep: 1 / 60,
    dashSpeed: 12.5,
    dashSeconds: 0.19,
    dashCooldown: 0.62,
    rotationSpeed: Math.PI * 0.92,
  },
  camera: {
    height: 4.65,
    distance: 15.6,
    maxDistance: 19,
    xBounds: [CAMERA_MIN_X, CAMERA_MAX_X] as [number, number],
  },
  backgroundScale: 1,
} as const

export const CHARACTERS: Record<'ali' | 'jack', CharacterDefinition> = {
  ali: {
    id: 'ali',
    displayName: 'Hz. Ali',
    accent: '#f7c65f',
    startPosition: [-1.15, GAME_CONFIG.world.groundHeight, 0],
    bindings: {
      left: 'KeyA',
      right: 'KeyD',
      jump: 'KeyW',
      attack: 'KeyS',
      rotateLeft: 'KeyZ',
      rotateRight: 'KeyX',
      ability: 'KeyR',
      dash: 'ShiftLeft',
    },
    assets: ASSET_PATHS.ali,
  },
  jack: {
    id: 'jack',
    displayName: 'Samuray Jack',
    accent: '#ff4c87',
    startPosition: [1.15, GAME_CONFIG.world.groundHeight, 0],
    bindings: {
      left: 'ArrowLeft',
      right: 'ArrowRight',
      jump: 'ArrowUp',
      attack: 'ArrowDown',
      rotateLeft: 'Comma',
      rotateRight: 'Period',
      ability: 'KeyL',
      dash: 'ShiftRight',
    },
    assets: ASSET_PATHS.jack,
    jumpSubclip: { startFrame: 0, endFrame: 33, fps: 30 },
  },
}
