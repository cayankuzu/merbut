import { useEffect } from 'react'
import { Leva, useControls } from 'leva'
import { MathUtils } from 'three'
import { CHARACTER_TRANSFORMS } from '../config/characterTransforms'
import { GAME_CONFIG } from '../config/gameConfig'
import { useDebugStore } from '../store/debugStore'
import type { CharacterTransform, Vec3Tuple } from '../types/character'

const degrees = (value: number) => MathUtils.radToDeg(value)
const radians = (value: number) => MathUtils.degToRad(value)

function useCharacterControls(name: string, defaults: CharacterTransform) {
  return useControls(name, {
    modelScale: { value: defaults.modelScale, min: 0.2, max: 3, step: 0.01, label: 'Karakter ölçeği' },
    modelX: { value: defaults.modelPosition[0], min: -2, max: 2, step: 0.01, label: 'Model X' },
    modelY: { value: defaults.modelPosition[1], min: -2, max: 2, step: 0.01, label: 'Model Y' },
    modelZ: { value: defaults.modelPosition[2], min: -2, max: 2, step: 0.01, label: 'Model Z' },
    modelRotX: { value: degrees(defaults.modelRotation[0]), min: -180, max: 180, step: 1, label: 'Model dönüş X°' },
    modelRotY: { value: degrees(defaults.modelRotation[1]), min: -180, max: 180, step: 1, label: 'Model dönüş Y°' },
    modelRotZ: { value: degrees(defaults.modelRotation[2]), min: -180, max: 180, step: 1, label: 'Model dönüş Z°' },
    weaponX: { value: defaults.weapon.position[0], min: -100, max: 100, step: 0.5, label: 'Kılıç X' },
    weaponY: { value: defaults.weapon.position[1], min: -100, max: 100, step: 0.5, label: 'Kılıç Y' },
    weaponZ: { value: defaults.weapon.position[2], min: -100, max: 100, step: 0.5, label: 'Kılıç Z' },
    gripX: { value: defaults.weapon.gripPoint[0], min: -1, max: 1, step: 0.01, label: 'Kabza noktası X' },
    gripY: { value: defaults.weapon.gripPoint[1], min: -1, max: 1, step: 0.01, label: 'Kabza noktası Y' },
    gripZ: { value: defaults.weapon.gripPoint[2], min: -1, max: 1, step: 0.01, label: 'Kabza noktası Z' },
    palmLerp: { value: defaults.weapon.palmLerp ?? 0.48, min: 0, max: 1.2, step: 0.01, label: 'Avuç içi konumu' },
    bladeDirectionX: { value: defaults.weapon.bladeDirection[0], min: -2, max: 2, step: 0.01, label: 'Bıçak ekseni X' },
    bladeDirectionY: { value: defaults.weapon.bladeDirection[1], min: -2, max: 2, step: 0.01, label: 'Bıçak ekseni Y' },
    bladeDirectionZ: { value: defaults.weapon.bladeDirection[2], min: -2, max: 2, step: 0.01, label: 'Bıçak ekseni Z' },
    weaponRotX: { value: degrees(defaults.weapon.rotation[0]), min: -180, max: 180, step: 1, label: 'Kılıç dönüş X°' },
    weaponRotY: { value: degrees(defaults.weapon.rotation[1]), min: -180, max: 180, step: 1, label: 'Kılıç dönüş Y°' },
    weaponRotZ: { value: degrees(defaults.weapon.rotation[2]), min: -180, max: 180, step: 1, label: 'Kılıç dönüş Z°' },
    weaponScale: { value: defaults.weapon.scale[0], min: 1, max: 100, step: 0.5, label: 'Kılıç ölçeği' },
  })
}

function toTransform(values: ReturnType<typeof useCharacterControls>): CharacterTransform {
  const scale: Vec3Tuple = [values.weaponScale, values.weaponScale, values.weaponScale]
  return {
    modelScale: values.modelScale,
    modelPosition: [values.modelX, values.modelY, values.modelZ],
    modelRotation: [radians(values.modelRotX), radians(values.modelRotY), radians(values.modelRotZ)],
    weapon: {
      palmLerp: values.palmLerp,
      bladeDirection: [values.bladeDirectionX, values.bladeDirectionY, values.bladeDirectionZ],
      gripPoint: [values.gripX, values.gripY, values.gripZ],
      position: [values.weaponX, values.weaponY, values.weaponZ],
      rotation: [radians(values.weaponRotX), radians(values.weaponRotY), radians(values.weaponRotZ)],
      scale,
    },
  }
}

export function DebugCalibrationPanel() {
  const debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1'
  const setTransform = useDebugStore((state) => state.setTransform)
  const setSceneValues = useDebugStore((state) => state.setSceneValues)
  const ali = useCharacterControls('Hz. Ali kalibrasyonu', CHARACTER_TRANSFORMS.ali)
  const jack = useCharacterControls('Samuray Jack kalibrasyonu', CHARACTER_TRANSFORMS.jack)
  const scene = useControls('Sahne kalibrasyonu', {
    groundHeight: { value: GAME_CONFIG.world.groundHeight, min: -2, max: 2, step: 0.01, label: 'Zemin yüksekliği' },
    cameraHeight: { value: GAME_CONFIG.camera.height, min: 1, max: 9, step: 0.05, label: 'Kamera yüksekliği' },
    cameraDistance: { value: GAME_CONFIG.camera.distance, min: 7, max: 24, step: 0.1, label: 'Kamera uzaklığı' },
    backgroundScale: { value: GAME_CONFIG.backgroundScale, min: 0.7, max: 1.5, step: 0.01, label: 'Arka plan ölçeği' },
  })
  const aliSnapshot = JSON.stringify(ali)
  const jackSnapshot = JSON.stringify(jack)
  const sceneSnapshot = JSON.stringify(scene)

  useEffect(() => setTransform('ali', toTransform(ali)), [ali, aliSnapshot, setTransform])
  useEffect(() => setTransform('jack', toTransform(jack)), [jack, jackSnapshot, setTransform])
  useEffect(() => setSceneValues(scene), [scene, sceneSnapshot, setSceneValues])

  return <Leva hidden={!debugEnabled} collapsed oneLineLabels titleBar={{ title: 'Merbut · Kalibrasyon' }} />
}
