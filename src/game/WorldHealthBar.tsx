import { Html } from '@react-three/drei'

interface WorldHealthBarProps {
  label: string
  health: number
  maxHealth: number
  accent: string
  boss?: boolean
  player?: boolean
}

export function WorldHealthBar({ label, health, maxHealth, accent, boss = false, player = false }: WorldHealthBarProps) {
  const percentage = Math.max(0, Math.min(100, health / maxHealth * 100))
  return (
    <Html center distanceFactor={boss ? 9 : player ? 7.2 : 8} zIndexRange={[4, 1]}>
      <div className={`world-health${boss ? ' world-health--boss' : ''}${player ? ' world-health--player' : ''}`}>
        <header><span>{label}</span></header>
        <i><b style={{ width: `${percentage}%`, backgroundColor: accent }} /></i>
      </div>
    </Html>
  )
}
