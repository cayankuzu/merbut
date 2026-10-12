import { defineStrings } from '../define'

/**
 * Interface strings for the "menu" area: title screen, main menu, the album
 * tracklist (chapter select), achievements, credits, patch notes, loading
 * screen, crash and notice panels. Turkish first, English second; the keys must match.
 */
export const menu = defineStrings({
  // Title screen
  titleSection: 'Başlık',
  presents: 'MEMODE SUNAR',
  pressAnyKey: 'Başlamak için bir tuşa bas',

  // Main menu
  mainMenu: 'Ana menü',
  mainMenuOptions: 'Ana menü seçenekleri',
  continueGame: 'DEVAM ET',
  continueHint: (chapter: string, realm: string, difficulty: string) => `${chapter} · ${realm} · ${difficulty}`,
  newGame: 'YENİ OYUN',
  newGameHint: 'Prologla başlayan yolculuk: on diyar, iki boss ve bir portal.',
  chapterSelect: 'BÖLÜM SEÇ',
  chapterSelectHint: 'Ulaştığın diyarlardan birinden yeniden başla.',
  characters: 'KARAKTERLER',
  charactersHint: 'Kahramanlar, Aku Lejyonu ve bosslar: 360° arşiv.',
  achievements: 'BAŞARIMLAR',
  achievementsHint: 'Açtığın başarımlar, rekorların ve istatistiklerin.',
  settings: 'AYARLAR',
  settingsHint: 'Görüntü, ses, kontroller, oynanış ve erişilebilirlik.',
  credits: 'YAPIMCILAR',
  creditsHint: 'Merbut’u yapanlar ve teşekkürler.',
  patchNotes: 'YAMA NOTLARI',
  fullscreen: '⛶ TAM EKRAN',
  fullscreenLabel: 'Tam ekranı aç veya kapat',
  /** The language toggle shows the language it switches to. */
  languageToggle: 'EN',
  languageToggleLabel: 'Dili değiştir: English',

  // Copyright footer (rendered by the app shell)
  copyrightLabel: 'Telif hakkı ve yapımcı bilgisi',
  madeByBefore: '',
  madeByAfter: ' yapımı',
  versionWord: 'SÜRÜM',

  // Shared sub-screen frame
  backArrow: (back: string) => `← ${back}`,

  // Chapter select: the album tracklist
  chapterEyebrow: 'ON DİYAR · TEK KADER',
  tracklist: 'Parça listesi',
  trackCaption: (number: string, chapter: string) => `PARÇA ${number} · ${chapter}`,
  lockedTrack: 'Kilitli parça',
  lockedTrackHint: 'Önceki diyarı geçince açılır',
  locked: 'Kilitli',
  lockedHint: 'Önceki diyarı geç',
  chapterNote: 'Bölüm seçimi rekor tablosuna sayılmaz; en iyi süre ve rütbe yalnız baştan oynanan koşularda kaydedilir.',

  // Achievements and records
  unlockedCount: (count: number, total: number) => `${count} / ${total} AÇILDI`,
  achievementsTitle: 'Başarımlar',
  hiddenAchievement: 'Gizli başarım.',
  difficulty: 'Zorluk',
  bestTime: 'En iyi süre',
  bestRank: 'En iyi rütbe',
  statRuns: 'Koşu',
  statVictories: 'Zafer',
  statKills: 'Yenilen düşman',
  statPerfectDodges: 'Kusursuz kaçış',
  statBestCombo: 'En uzun kombo',
  statPlayTime: 'Toplam süre',
  /** BCP 47 tag for number formatting. */
  numberLocale: 'tr-TR',

  // Credits and patch notes
  creditsTitle: 'Yapımcılar',
  disclaimer: 'Bu yapım hayal ürünüdür. Tarihî ve dinî şahsiyetlere saygıyla yaklaşılmıştır. Anılan karakter ve markalar sahiplerine aittir.',
  versionEyebrow: (version: string) => `SÜRÜM v${version}`,
  patchNotesTitle: 'Yama notları',

  // Loading screen
  loadingReadyAria: (percent: number) => `Merbut yüzde ${percent} hazır`,
  loadingProgressAria: (percent: number) => `Yükleme yüzde ${percent}`,
  loadingFiles: (loaded: number, total: number) => `${loaded}/${total} OYUN DOSYASI`,
  loadingReady: 'Hazır — savaş sahnesi açılıyor',
  loadingSlow: 'Bağlantı yavaş; kalan dosyalar oyun sırasında tamamlanacak',
  loadingCore: 'Bağlantı ve oyun çekirdeği hazırlanıyor',
  loadingPaintings: 'On diyarın tabloları yükleniyor',
  loadingHeroes: 'Hz. Ali ve Samuray Jack hazırlanıyor',
  loadingLegion: 'Aku lejyonunun modelleri ve animasyonları yükleniyor',
  loadingBosses: 'Boss karşılaşmaları ve zaman portalı hazırlanıyor',
  loadingCheck: 'Savaş sahnesi son kez denetleniyor',
  tip: (text: string) => `İpucu · ${text}`,
  tip1: 'Düşman saldırmadan önce kırmızı parlar. Tam o anda kaçınırsan zaman yavaşlar.',
  tip2: 'Aynı kahramana aynı anda en fazla iki düşman saldırır: kalabalıkta sırayla dövüş.',
  tip3: 'Yeşim Harabeleri’nde iki çana birlikte vurun; sis dağılınca hayaletler tam hasar alır.',
  tip4: 'Kafatası Adası’nda düşmanı kızaran çatlağın üstüne çek: lav senin yerine savaşır.',
  tip5: 'Hz. Ali’nin alev penceresi ve Samuray Jack’in kalkanı isabetle dolar.',
  tip6: 'Aku zayıfladıkça zamanı kırar. Son fazda portallardan uzak dur.',
  tip7: 'Saldırıya ritimle üç kez bas: üçüncü vuruş dönerek keser.',
  tip8: 'İkiniz aynı düşmana aynı anda vurursanız Çifte Hamle patlar.',
  tip9: 'Gelen mermiye doğru anda kılıç salla: sahibine geri döner.',
  tip10: 'Kum Saati Çölü’nde titreyen düşmanlar seraptır; tek darbede kuma döner.',
  tip11: 'Dökümhanede presin gölgesi düşmandan önce iner. Dronları altına çek.',
  tip12: 'Şimşek Zirvesi’nde parlayan paratonere vur: kılıcın zincirleme şimşek taşır.',
  factionHeroes: 'KAHRAMANLAR',
  factionVersus: 'VS',
  factionLegion: 'AKU LEJYONU',

  // Mobile devices
  mobileEyebrow: 'MERBUT · MASAÜSTÜ DENEYİMİ',
  mobileTitle: 'Bu savaş mobil cihazlarda açılamaz.',
  mobileBody: 'Kontroller, 3B sahne ve iki kişilik oynanış masaüstü donanımı için tasarlandı.',
  mobileCall: 'Lütfen masaüstü veya dizüstü bilgisayarınızdaki güncel bir web tarayıcısından girin.',

  // First-launch graphics notice
  tierMinimal: 'AKICI',
  tierPerformance: 'ORTA',
  tierBalanced: 'YÜKSEK',
  tierHigh: 'ULTRA',
  graphicsCalibrated: 'GRAFİK KALİBRASYONU TAMAMLANDI',
  graphicsAutoApplied: 'Cihazınız için en akıcı profil otomatik uygulandı.',
  graphicsSavedApplied: 'Kayıtlı grafik tercihiniz uygulandı.',
  graphicsDetails: (tier: string, dpr: string, budget: number) => `${tier} · İç çözünürlük ${dpr}× · Adaptif bütçe %${budget} · Değiştirmek için Ayarlar’ı açın.`,
  graphicsEdit: 'GRAFİĞİ DÜZENLE',
  graphicsClose: 'Grafik bildirimini kapat',

  // Crash screen and lost GPU context
  crashEyebrow: 'MERBUT · ZAMAN ÇİZGİSİ KIRILDI',
  crashTitle: 'Bir şeyler ters gitti',
  crashBody: 'Aku zamanı yine karıştırdı. İlerlemen ve ayarların kayıtlı; sayfayı yenileyerek kaldığın diyardan devam edebilirsin.',
  crashRestart: 'YENİDEN BAŞLAT',
  contextLostTitle: 'Grafik bağlamı kayboldu',
  contextLostBody: 'Ekran kartı sürücüsü sıfırlandı. Oyun duraklatıldı; bağlam geri gelince devam edebilirsin.',
  contextLostReload: 'YENİDEN YÜKLE',

  // Menu battle stage
  stageLabel: 'Hz. Ali, Samuray Jack ve Aku lejyonu dikey sütunlarda savaş pozunda',
  stageHeroes: 'Kahramanlar',
  stageMelee: 'Yakın dövüşçüler',
  stageBosses: 'Bosslar',
  stageRanged: 'Uzak dövüşçüler',
  stageAkuMonster: 'Aku · Canavar',
  emblem: 'Merbut amblemi',

  // Web demo
  demoBadge: 'DEMO',
  fullGame: 'TAM SÜRÜM · itch.io',
  fullGameHint: 'Demo ilk iki diyarı kapsar. On diyarın tamamı, iki boss ve final itch.io’daki tam sürümde.',
  lockedInDemo: 'Tam sürümde',
  lockedInDemoHint: 'Bu diyar itch.io’daki tam sürümde',
}, {
  // Title screen
  titleSection: 'Title',
  presents: 'MEMODE PRESENTS',
  pressAnyKey: 'Press any key to begin',

  // Main menu
  mainMenu: 'Main menu',
  mainMenuOptions: 'Main menu options',
  continueGame: 'CONTINUE',
  continueHint: (chapter, realm, difficulty) => `${chapter} · ${realm} · ${difficulty}`,
  newGame: 'NEW GAME',
  newGameHint: 'The journey begins with the prologue: ten realms, two bosses and one portal.',
  chapterSelect: 'CHAPTER SELECT',
  chapterSelectHint: 'Start again from any realm you have reached.',
  characters: 'CHARACTERS',
  charactersHint: 'Heroes, Aku’s Legion and the bosses: a 360° archive.',
  achievements: 'ACHIEVEMENTS',
  achievementsHint: 'Your unlocked achievements, records and stats.',
  settings: 'SETTINGS',
  settingsHint: 'Display, audio, controls, gameplay and accessibility.',
  credits: 'CREDITS',
  creditsHint: 'The people who made Merbut, and our thanks.',
  patchNotes: 'PATCH NOTES',
  fullscreen: '⛶ FULLSCREEN',
  fullscreenLabel: 'Toggle fullscreen',
  languageToggle: 'TR',
  languageToggleLabel: 'Change language: Türkçe',

  // Copyright footer (rendered by the app shell)
  copyrightLabel: 'Copyright and creator information',
  madeByBefore: 'Made by ',
  madeByAfter: '',
  versionWord: 'VERSION',

  // Shared sub-screen frame
  backArrow: (back) => `← ${back}`,

  // Chapter select: the album tracklist
  chapterEyebrow: 'TEN REALMS · ONE FATE',
  tracklist: 'Tracklist',
  trackCaption: (number, chapter) => `TRACK ${number} · ${chapter}`,
  lockedTrack: 'Locked track',
  lockedTrackHint: 'Unlocks when you clear the previous realm',
  locked: 'Locked',
  lockedHint: 'Clear the previous realm',
  chapterNote: 'Chapter select runs do not count toward the records; best time and rank are only saved on runs played from the start.',

  // Achievements and records
  unlockedCount: (count, total) => `${count} / ${total} UNLOCKED`,
  achievementsTitle: 'Achievements',
  hiddenAchievement: 'Hidden achievement.',
  difficulty: 'Difficulty',
  bestTime: 'Best time',
  bestRank: 'Best rank',
  statRuns: 'Runs',
  statVictories: 'Victories',
  statKills: 'Enemies defeated',
  statPerfectDodges: 'Perfect dodges',
  statBestCombo: 'Longest combo',
  statPlayTime: 'Total time',
  numberLocale: 'en-US',

  // Credits and patch notes
  creditsTitle: 'Credits',
  disclaimer: 'This game is a work of fiction. Historical and religious figures are portrayed with respect. All named characters and trademarks belong to their respective owners.',
  versionEyebrow: (version) => `VERSION v${version}`,
  patchNotesTitle: 'Patch notes',

  // Loading screen
  loadingReadyAria: (percent) => `Merbut ${percent}% ready`,
  loadingProgressAria: (percent) => `Loading ${percent}%`,
  loadingFiles: (loaded, total) => `${loaded}/${total} GAME FILES`,
  loadingReady: 'Ready — opening the battlefield',
  loadingSlow: 'Slow connection; the remaining files will finish loading during play',
  loadingCore: 'Preparing the connection and the game core',
  loadingPaintings: 'Loading the paintings of the ten realms',
  loadingHeroes: 'Preparing Hazrat Ali and Samurai Jack',
  loadingLegion: 'Loading the models and animations of Aku’s Legion',
  loadingBosses: 'Preparing the boss encounters and the time portal',
  loadingCheck: 'Giving the battlefield one final inspection',
  tip: (text) => `Tip · ${text}`,
  tip1: 'Enemies flash red just before they strike. Dodge at that exact moment and time slows down.',
  tip2: 'No more than two enemies attack the same hero at once: in a crowd, fight them in turn.',
  tip3: 'In the Jade Ruins, strike both bells together; once the mist clears, the ghosts take full damage.',
  tip4: 'On Skull Island, lure enemies onto a glowing crack: the lava fights for you.',
  tip5: 'Hazrat Ali’s Flame Window and Samurai Jack’s Guardian Shield charge up as your hits land.',
  tip6: 'The weaker Aku gets, the more he breaks time. In the final phase, keep clear of the portals.',
  tip7: 'Press attack three times in rhythm: the third blow is a spinning cut.',
  tip8: 'Hit the same enemy at the same moment as your partner and a Twin Strike erupts.',
  tip9: 'Swing your sword at an incoming projectile at just the right moment: it flies back to its owner.',
  tip10: 'In the Hourglass Desert, flickering enemies are mirages; one hit turns them back to sand.',
  tip11: 'In the Beetle Foundry, the press’s shadow falls before the press does. Lure the drones underneath.',
  tip12: 'On Storm Peak, strike a glowing lightning rod: your blade will carry chain lightning.',
  factionHeroes: 'HEROES',
  factionVersus: 'VS',
  factionLegion: 'AKU’S LEGION',

  // Mobile devices
  mobileEyebrow: 'MERBUT · A DESKTOP EXPERIENCE',
  mobileTitle: 'This battle can’t be fought on mobile devices.',
  mobileBody: 'The controls, the 3D stage and two-player co-op were designed for desktop hardware.',
  mobileCall: 'Please visit again from an up-to-date web browser on a desktop or laptop computer.',

  // First-launch graphics notice
  tierMinimal: 'LOW',
  tierPerformance: 'MEDIUM',
  tierBalanced: 'HIGH',
  tierHigh: 'ULTRA',
  graphicsCalibrated: 'GRAPHICS CALIBRATION COMPLETE',
  graphicsAutoApplied: 'The smoothest profile for your device was applied automatically.',
  graphicsSavedApplied: 'Your saved graphics preference was applied.',
  graphicsDetails: (tier, dpr, budget) => `${tier} · Internal resolution ${dpr}× · Adaptive budget ${budget}% · Open Settings to change it.`,
  graphicsEdit: 'ADJUST GRAPHICS',
  graphicsClose: 'Close graphics notice',

  // Crash screen and lost GPU context
  crashEyebrow: 'MERBUT · THE TIMELINE HAS SHATTERED',
  crashTitle: 'Something went wrong',
  crashBody: 'Aku has tangled time again. Your progress and settings are saved; reload the page to pick up in the realm where you left off.',
  crashRestart: 'RESTART',
  contextLostTitle: 'Graphics context lost',
  contextLostBody: 'The graphics driver was reset. The game is paused; you can carry on once the context comes back.',
  contextLostReload: 'RELOAD',

  // Menu battle stage
  stageLabel: 'Hazrat Ali, Samurai Jack and Aku’s Legion in battle stances, in vertical columns',
  stageHeroes: 'Heroes',
  stageMelee: 'Melee fighters',
  stageBosses: 'Bosses',
  stageRanged: 'Ranged fighters',
  stageAkuMonster: 'Aku · Monster',
  emblem: 'Merbut emblem',

  demoBadge: 'DEMO',
  fullGame: 'FULL GAME · itch.io',
  fullGameHint: 'The demo covers the first two realms. All ten realms, both bosses and the finale are in the full game on itch.io.',
  lockedInDemo: 'In the full game',
  lockedInDemoHint: 'This realm is in the full game on itch.io',
})
