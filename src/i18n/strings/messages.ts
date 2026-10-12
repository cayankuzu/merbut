import { defineStrings } from '../define'

/**
 * Messages the game logic raises during a run: feed toasts (falls, freezes,
 * checkpoints) and Aku's portal alerts. The session keeps what each one says
 * (a `FeedMessage` / `PortalAlertMessage`), and `feedText` / `portalAlertText`
 * in the session store read it here in the player's current language.
 */
export const messages = defineStrings({
  heroDown: (name: string, seconds: number) => `${name} düştü · ${seconds.toFixed(1)} sn sonra kalkacak`,
  heroOut: (name: string) => `${name} savaş dışı`,
  heroFrozen: (name: string) => `${name} zaman portalında 3 sn dondu`,
  shadowDispelled: 'Gölge dağıldı · Zemzem kontrol noktası canları tazeledi',
  portalAmbushTitle: 'ZAMAN PUSUSU',
  portalAmbushDetail: (realm: string, count: number) => `${realm}: ${count} düşman bekliyor`,
  portalOpenedTitle: 'ZAMAN PORTALI AÇILDI',
  portalOpenedDetail: 'Temastan kaçın: Aku sizi başka bir diyara savurabilir',
}, {
  heroDown: (name, seconds) => `${name} is down · back up in ${seconds.toFixed(1)}s`,
  heroOut: (name) => `${name} is out of action`,
  heroFrozen: (name) => `${name} is frozen in the time portal for 3s`,
  shadowDispelled: 'The Shadow is dispelled · the Zamzam checkpoint restored your health',
  portalAmbushTitle: 'TIME AMBUSH',
  portalAmbushDetail: (realm, count) => `${realm}: ${count} ${count === 1 ? 'enemy lies' : 'enemies lie'} in wait`,
  portalOpenedTitle: 'TIME PORTAL OPENED',
  portalOpenedDetail: 'Avoid contact: Aku can fling you into another realm',
})
