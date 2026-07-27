import { CHARACTERS } from '../config/gameConfig'
import { CharacterController } from './CharacterController'

export function JackCharacter() {
  return <CharacterController definition={CHARACTERS.jack} />
}
