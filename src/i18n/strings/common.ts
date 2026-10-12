import type { CharacterId } from '../../types/character'
import { defineStrings } from '../define'

/**
 * Words every area shares. Glossary for the English half:
 * Hz. Ali → Hazrat Ali · Samuray Jack → Samurai Jack · Aku → Aku ·
 * Aku'nun Gölgesi → Aku's Shadow · Yaşlı Keşiş → the Old Monk · diyar → realm ·
 * Çifte Hamle → Twin Strike · savuşturma → parry · Zemzem → Zamzam · Zülfikar → Zulfiqar.
 */
export const common = defineStrings({
  heroAli: 'Hz. Ali',
  heroJack: 'Samuray Jack',
  heroName: (id: CharacterId) => (id === 'ali' ? 'Hz. Ali' : 'Samuray Jack'),
  back: 'GERİ',
  close: 'KAPAT',
  gameTitle: 'MERBUT',
  gameSubtitle: 'On Diyar · Tek Kader',
  /** The browser tab and desktop window title. */
  documentTitle: 'Merbut · On Diyar, Tek Kader',
  language: 'Dil',
}, {
  heroAli: 'Hazrat Ali',
  heroJack: 'Samurai Jack',
  heroName: (id) => (id === 'ali' ? 'Hazrat Ali' : 'Samurai Jack'),
  back: 'BACK',
  close: 'CLOSE',
  gameTitle: 'MERBUT',
  gameSubtitle: 'Ten Realms · One Fate',
  documentTitle: 'Merbut · Ten Realms, One Fate',
  language: 'Language',
})
