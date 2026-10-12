import { pick, type Locale } from '../i18n/locale'

export interface AchievementDefinition {
  id: string
  title: string
  description: string
  /** Hidden achievements show "???" until unlocked. */
  secret?: boolean
}

const ACHIEVEMENT_LIST = [
  { id: 'first-blood', title: 'İlk Kan', description: 'Aku Lejyonu’ndan ilk düşmanı yen.' },
  { id: 'electric-bill', title: 'Elektrik Faturası', description: 'Aku Metropolü’nde üç neon tabelanın üçünü de kır.' },
  { id: 'dry-feet', title: 'Kuru Ayaklar', description: 'Günbatımı Limanı’nı hiçbir kahraman dalgaya yakalanmadan geç.' },
  { id: 'time-bender', title: 'Zaman Bükücü', description: 'Bir koşuda kum saatini üç kez ters çevir.' },
  { id: 'mirage-hunter', title: 'Serap Avcısı', description: 'Altı serabı kuma döndür.' },
  { id: 'shadowless', title: 'Gölgesiz', description: 'Aku’nun Gölgesi’ni yen.' },
  { id: 'scrap-press', title: 'Hurda Presi', description: 'Presin altında üç dron ez.' },
  { id: 'queen-slayer', title: 'Kovanın Sonu', description: 'Ana Böcek’i yen.' },
  { id: 'warm-welcome', title: 'Sıcak Karşılama', description: 'Lav ve alev bacalarıyla toplam beş düşman yak.' },
  { id: 'twin-bells', title: 'İki Çan, Tek Yürek', description: 'Yeşim Harabeleri’nde çan rezonansını tetikle.' },
  { id: 'storm-bearer', title: 'Şimşek Taşıyıcı', description: 'Zincirleme şimşekle on düşmana ulaş.' },
  { id: 'giant-slayer', title: 'Dev Avcısı', description: 'Kemik Devi’ni yen.' },
  { id: 'master-of-nothing', title: 'Zamanın Efendisi Değil', description: 'Aku’yu yen.' },
  { id: 'sword-storm', title: 'Kılıç Fırtınası', description: 'Tek kahramanla 25 vuruşluk kombo yap.' },
  { id: 'like-the-wind', title: 'Rüzgâr Gibi', description: 'Bir koşuda 10 kusursuz kaçış yap.' },
  { id: 'thirstless', title: 'Susuz Savaşçı', description: 'Diyar IV ya da sonrasından birini hiç Zemzem içmeden tamamla.' },
  { id: 'merciless', title: 'Acımasız', description: 'Oyunu Acımasız zorlukta bitir.', secret: true },
  { id: 'beyond-time', title: 'Zamanın Ötesinde', description: 'Oyunu 22 dakikadan kısa sürede bitir.', secret: true },
  { id: 'unbroken', title: 'Kırılmaz Bağ', description: 'Oyunu iki kahramandan hiçbiri düşmeden bitir.', secret: true },
] as const satisfies readonly AchievementDefinition[]

export type AchievementId = (typeof ACHIEVEMENT_LIST)[number]['id']

export const ACHIEVEMENTS: readonly AchievementDefinition[] = ACHIEVEMENT_LIST

export const achievementById = (id: string) => ACHIEVEMENTS.find((achievement) => achievement.id === id)

interface AchievementText { title: string; description: string }

/** English achievement names and conditions, keyed by id. */
const ACHIEVEMENT_TEXT_EN: Record<AchievementId, AchievementText> = {
  'first-blood': { title: 'First Blood', description: 'Defeat your first enemy from Aku’s Legion.' },
  'electric-bill': { title: 'Electric Bill', description: 'Smash all three neon signs in Aku Metropolis.' },
  'dry-feet': { title: 'Dry Feet', description: 'Cross Sunset Harbor without a wave catching either hero.' },
  'time-bender': { title: 'Time Bender', description: 'Turn an hourglass over three times in a single run.' },
  'mirage-hunter': { title: 'Mirage Hunter', description: 'Turn six mirages back to sand.' },
  'shadowless': { title: 'Shadowless', description: 'Defeat Aku’s Shadow.' },
  'scrap-press': { title: 'Scrap Press', description: 'Crush three drones under the press.' },
  'queen-slayer': { title: 'End of the Hive', description: 'Defeat the Queen Beetle.' },
  'warm-welcome': { title: 'Warm Welcome', description: 'Burn five enemies in total with lava and flame vents.' },
  'twin-bells': { title: 'Two Bells, One Heart', description: 'Trigger the bell resonance in the Jade Ruins.' },
  'storm-bearer': { title: 'Stormbearer', description: 'Hit ten enemies with chain lightning.' },
  'giant-slayer': { title: 'Giant Slayer', description: 'Defeat the Bone Giant.' },
  'master-of-nothing': { title: 'Former Master of Time', description: 'Defeat Aku.' },
  'sword-storm': { title: 'Storm of Blades', description: 'Land a 25-hit combo with a single hero.' },
  'like-the-wind': { title: 'Like the Wind', description: 'Pull off 10 perfect dodges in a single run.' },
  'thirstless': { title: 'Parched Warrior', description: 'Clear Realm IV or any later realm without drinking a single drop of Zamzam.' },
  'merciless': { title: 'Merciless', description: 'Finish the game on Merciless difficulty.' },
  'beyond-time': { title: 'Beyond Time', description: 'Finish the game in under 22 minutes.' },
  'unbroken': { title: 'Unbreakable Bond', description: 'Finish the game without either hero falling.' },
}

/** An achievement's name and condition in the player's language. */
export function achievementText(id: string, locale: Locale): AchievementText {
  const definition = achievementById(id)
  const tr = { title: definition?.title ?? id, description: definition?.description ?? '' }
  const english: Partial<Record<string, AchievementText>> = ACHIEVEMENT_TEXT_EN
  return pick(locale, tr, english[id])
}
