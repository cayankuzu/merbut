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
  { id: 'ali', name: 'Hz. Ali', role: 'Kahraman · Ateş Ustası', health: 110, attackType: 'Kılıç / Alev topu', range: 'Yakın + Uzak', mobility: 'Çevik', accent: '#f7c65f', traits: ['4 sn sınırsız alev topu', '360° serbest dönüş', 'Zemzem ile güç yenileme'], preview: { type: 'hero', id: 'ali' } },
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
