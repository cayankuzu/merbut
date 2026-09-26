export interface AchievementDefinition {
  id: string
  title: string
  description: string
  /** Hidden achievements show "???" until unlocked. */
  secret?: boolean
}

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
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
]

export const achievementById = (id: string) => ACHIEVEMENTS.find((achievement) => achievement.id === id)
