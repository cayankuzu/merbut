import { pick, type Locale } from '../i18n/locale'
import type { CharacterId } from '../types/character'
import type { EnemyKind } from './enemies'

export type RosterPreview =
  | { type: 'hero'; id: CharacterId }
  | { type: 'enemy'; kind: EnemyKind }
  | { type: 'shadow' }
  | { type: 'aku'; form: 'normal' | 'monster' }

export interface RosterEntry {
  id: string
  name: string
  role: string
  health: number
  attackType: string
  range: string
  mobility: string
  accent: string
  traits: readonly string[]
  preview: RosterPreview
}

export const CHARACTER_ROSTER: readonly RosterEntry[] = [
  { id: 'ali', name: 'Hz. Ali', role: 'Kahraman · Ateş Ustası', health: 110, attackType: 'Kılıç / Alev topu', range: 'Yakın + Uzak', mobility: 'Çevik', accent: '#f7c65f', traits: ['4 sn içinde 9 alev topu', '360° serbest dönüş', 'Zemzem ile güç yenileme'], preview: { type: 'hero', id: 'ali' } },
  { id: 'jack', name: 'Samuray Jack', role: 'Kahraman · Koruyucu', health: 110, attackType: 'Katana / Kalkan', range: 'Yakın', mobility: 'Dengeli', accent: '#ff4c87', traits: ['4 sn hareketli kalkan', 'Takım alanını korur', 'Finalde dua kudreti'], preview: { type: 'hero', id: 'jack' } },
  { id: 'myrkhan', name: 'Myrkhan', role: 'Aku Lejyonu · Avcı', health: 70, attackType: 'Döner pençe', range: 'Yakın', mobility: 'Çok hızlı', accent: '#ff6a42', traits: ['Seri yaklaşma', 'Düşük dayanıklılık', 'Ani yön değişimi'], preview: { type: 'enemy', kind: 1 } },
  { id: 'zorvex', name: 'Zorvex', role: 'Aku Lejyonu · Akıncı', health: 90, attackType: 'Atılma darbesi', range: 'Yakın', mobility: 'Hızlı', accent: '#c655ff', traits: ['Mesafe kapatma', 'Orta dayanıklılık', 'Çift taraflı baskı'], preview: { type: 'enemy', kind: 2 } },
  { id: 'kharzul', name: 'Kharzul', role: 'Aku Lejyonu · Ezici', health: 120, attackType: 'Yer sarsıntısı', range: 'Orta alan', mobility: 'Ağır', accent: '#dcdf4c', traits: ['Alan hasarı', 'Yüksek sendeletme', 'Yavaş yaklaşma'], preview: { type: 'enemy', kind: 3 } },
  { id: 'vhalgor', name: 'Vhalgor', role: 'Aku Lejyonu · Nişancı', health: 155, attackType: 'Zehirli taş', range: 'Uzak', mobility: 'Dengeli', accent: '#53e89c', traits: ['Menzil koruma', 'Geri çekilme', 'Yüksek dayanıklılık'], preview: { type: 'enemy', kind: 4 } },
  { id: 'nexrath', name: 'Nexrath', role: 'Aku Lejyonu · Büyücü', health: 190, attackType: 'Karanlık küre', range: 'Çok uzak', mobility: 'Dengeli', accent: '#58cbff', traits: ['Hızlı mermi', 'Alan kontrolü', 'Lejyonun en dayanıklısı'], preview: { type: 'enemy', kind: 5 } },
  { id: 'shadow', name: 'Aku’nun Gölgesi', role: 'Birinci Boss · Karanlık Samuray', health: 950, attackType: 'Kombo / Meteor', range: 'Yakın + Alan', mobility: 'Çok hızlı', accent: '#ff244f', traits: ['İkili ve üçlü kombo', 'Meteor çemberi', 'Yüksek boss zırhı'], preview: { type: 'shadow' } },
  { id: 'aku-normal', name: 'Aku', role: 'Final Boss · Normal Form', health: 1450, attackType: 'Yakın / Portal / Ateş', range: 'Tüm menziller', mobility: 'Hızlı', accent: '#66ec62', traits: ['Zaman portalı fırlatır', 'Canını yeniler', 'Rastgele saldırı seçer'], preview: { type: 'aku', form: 'normal' } },
  { id: 'aku-monster', name: 'Aku · Canavar', role: 'Final Boss · Öfke Formu', health: 1450, attackType: 'Dönüş / Bölünme / Taklit', range: 'Tüm alan', mobility: 'Çok hızlı', accent: '#b7ff45', traits: ['6 küçük Aku’ya bölünür', 'Yaratık biçimlerini taklit eder', 'Gelişmiş kombo havuzu'], preview: { type: 'aku', form: 'monster' } },
] as const

/** The parts of a roster entry a player reads; numbers, colours and models stay shared. */
export type RosterText = Pick<RosterEntry, 'name' | 'role' | 'attackType' | 'range' | 'mobility' | 'traits'>

const ROSTER_TEXT_EN: Record<string, RosterText> = {
  ali: { name: 'Hazrat Ali', role: 'Hero · Master of Fire', attackType: 'Sword / Fireball', range: 'Close + Far', mobility: 'Agile', traits: ['Up to 9 fireballs in 4s', '360° free rotation', 'Restores power with Zamzam'] },
  jack: { name: 'Samurai Jack', role: 'Hero · Guardian', attackType: 'Katana / Shield', range: 'Close', mobility: 'Balanced', traits: ['4s mobile shield', 'Shields the whole team', 'Power of prayer in the finale'] },
  myrkhan: { name: 'Myrkhan', role: 'Aku’s Legion · Hunter', attackType: 'Spinning claw', range: 'Close', mobility: 'Very fast', traits: ['Rapid approach', 'Low toughness', 'Sudden changes of direction'] },
  zorvex: { name: 'Zorvex', role: 'Aku’s Legion · Raider', attackType: 'Lunge strike', range: 'Close', mobility: 'Fast', traits: ['Closes the distance', 'Medium toughness', 'Pressure from both sides'] },
  kharzul: { name: 'Kharzul', role: 'Aku’s Legion · Crusher', attackType: 'Ground quake', range: 'Mid-range area', mobility: 'Heavy', traits: ['Area damage', 'Heavy stagger', 'Slow approach'] },
  vhalgor: { name: 'Vhalgor', role: 'Aku’s Legion · Marksman', attackType: 'Poison stone', range: 'Far', mobility: 'Balanced', traits: ['Keeps its distance', 'Falls back', 'High toughness'] },
  nexrath: { name: 'Nexrath', role: 'Aku’s Legion · Sorcerer', attackType: 'Dark orb', range: 'Very far', mobility: 'Balanced', traits: ['Fast projectiles', 'Area control', 'Toughest of the Legion'] },
  shadow: { name: 'Aku’s Shadow', role: 'First Boss · Dark Samurai', attackType: 'Combo / Meteor', range: 'Close + Area', mobility: 'Very fast', traits: ['Double and triple combos', 'Meteor ring', 'Heavy boss armor'] },
  'aku-normal': { name: 'Aku', role: 'Final Boss · Normal Form', attackType: 'Melee / Portal / Fire', range: 'All ranges', mobility: 'Fast', traits: ['Hurls time portals', 'Regenerates health', 'Picks his attacks at random'] },
  'aku-monster': { name: 'Aku · Monster', role: 'Final Boss · Wrath Form', attackType: 'Spin / Split / Mimicry', range: 'Whole arena', mobility: 'Very fast', traits: ['Splits into 6 tiny Akus', 'Mimics creature forms', 'Expanded combo pool'] },
}

const ROSTER_EN: readonly RosterEntry[] = CHARACTER_ROSTER.map((entry) => ({ ...entry, ...ROSTER_TEXT_EN[entry.id] }))

/** The whole roster with its text in the player's language (same order and ids). */
export const rosterFor = (locale: Locale): readonly RosterEntry[] => pick(locale, CHARACTER_ROSTER, ROSTER_EN)

/** One roster entry's readable text in the player's language. */
export function rosterText(id: string, locale: Locale): RosterText {
  const entry = CHARACTER_ROSTER.find((candidate) => candidate.id === id) ?? CHARACTER_ROSTER[0]!
  const tr: RosterText = { name: entry.name, role: entry.role, attackType: entry.attackType, range: entry.range, mobility: entry.mobility, traits: entry.traits }
  return pick(locale, tr, ROSTER_TEXT_EN[entry.id])
}
