import { CHARACTERS } from '../config/gameConfig'
import { CharacterController } from './CharacterController'

export function AliCharacter() {
  return <CharacterController definition={CHARACTERS.ali} />
}
