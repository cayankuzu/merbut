import { useEffect } from 'react'
import { keyboard } from '../input/keyboardManager'

export function useKeyboard() {
  useEffect(() => {
    keyboard.start()
    return () => keyboard.stop()
  }, [])

  return keyboard
}
