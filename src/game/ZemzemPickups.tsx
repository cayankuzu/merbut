import { useSessionStore } from '../store/sessionStore'
import { ZemzemBottle } from './ZemzemBottle'

export function ZemzemPickups() {
  const pickups = useSessionStore((state) => state.pickups)
  return <>{pickups.map((pickup) => <ZemzemBottle id={pickup.id} key={pickup.id} x={pickup.x} />)}</>
}
