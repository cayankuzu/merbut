import { pick, type Locale } from '../i18n/locale'

export interface PatchNote { version: string; title: string; notes: readonly string[] }

const RELEASES = [
  {
    version: '3.2.0',
    title: 'English ve masaüstü sürümü',
    notes: [
      'Oyunun tamamı artık İngilizce de oynanabiliyor: menüler, HUD, karakter arşivi, başarımlar ve hikâyenin her satırı.',
      'Oyun ilk açılışta tarayıcı dilini izler; Ayarlar → Görüntü → Dil ya da ana menüdeki TR/EN düğmesiyle istediğin an değiştir.',
      'Windows için indirilebilir sürüm: kurulum sihirbazı ya da taşınabilir zip. İnternetsiz çalışır, ilerlemen bilgisayarında saklanır.',
      'Web sürümü artık ilk iki diyarı kapsayan bir demo; tam sürüm itch.io’da.',
      'Oyun ortasında dil değişince ekrandaki bildirimler de yeni dile geçer.',
      'Yazı tipleri oyunla birlikte geliyor; dış bir sunucuya istek atılmıyor.',
      'Hz. Ali’nin karakter kartındaki alev topu bilgisi düzeltildi (4 sn’de en fazla 9 atış). Kum saati sahnesi artık yalnızca saati Hz. Ali çevirince oynuyor.',
    ],
  },
  {
    version: '3.1.1',
    title: 'Buton düzeltmeleri',
    notes: [
      'Bölüm Seç, Başarımlar, Yapımcılar ve Yama Notları ekranlarında GERİ butonu fareyle çalışmıyordu; bölüm seçimindeki parçalar da tıklanmıyordu. Düzeltildi.',
      'Prologdaki ATLA butonu ve tıklayarak sonraki panele geçme fareyle çalışmıyordu. Düzeltildi.',
      'Finaldeki yapımcılar kaydırmasının GEÇ butonu düzeltildi.',
      'Duraklatma menüsünden açılan Ayarlarda ok tuşları ve gamepad artık ayarların içinde geziniyor.',
      'Duraklatma → Kontroller ekranında Esc / gamepad B artık oyuna değil duraklatma menüsüne döner.',
    ],
  },
  {
    version: '3.1.0',
    title: 'Kayıt ve vitrin güncellemesi',
    notes: [
      'Ayarlar → Kayıt: ilerlemeyi (ayarların kalır) ya da her şeyi (fabrika ayarları) iki adımlı onayla sıfırla.',
      'Ana menüde kahraman menünün arkasından çıktı: sahnenin ortasında, düşmanla yüz yüze dövüşüyor.',
      'Vitrinde oyundaki hareketler: iki hızlı kesik ve dönerek kesen bitirici, ateş topu, kalkan.',
      'Menüde de gerçek kılıcı izleyen ışık izleri, kıvılcımlar ve kesik çizgileri; Jack katanasını kınından çekip geri sokuyor.',
      'Kılıç izleri artık ucu izleyen parlak bir hilal; ateş topu, kalkan ve karanlık küreler yeni ışık kabuklarıyla.',
      'Menü daha hafif: tam ekran gölge filtresi kaldırıldı. Grafik bildirimi yalnızca ilk açılışta çıkar.',
    ],
  },
  {
    version: '3.0.0',
    title: 'On Diyar güncellemesi',
    notes: [
      'Üç yeni diyar: Kum Saati Çölü, Böcek Dökümhanesi ve Şimşek Zirvesi; her biri kendi mekaniğiyle.',
      'Tüm tablolar yenilendi: her diyar, prolog ve final özgün “albüm kapağı” sanatıyla, iki katmanlı paralaksla çiziliyor.',
      'Üç vuruşluk saldırı zinciri ve dönerek kesen bitirici; Çifte Hamle; mermileri kılıçla savuşturma.',
      'Gerçek kılıcı izleyen ışık izleri, kıvılcım/mürekkep/kum parçacıkları, anime kesik çizgileri ve darbe kareleri.',
      'Jack katanasını kınında taşıyor; kılıçlar artık parlak çelik.',
      'Yeni düşmanlar: Serap, Böcek Dronları ve Ana Böcek. Yeni karakter: Yaşlı Keşiş.',
      'Prolog Aku’nun ağzından; Hz. Ali’nin “öfkeyle değil, hak için vururum” anı; Medine’ye uzanan final.',
      'Diyar girişleri albüm parçası kartı, bölüm seçimi plak parça listesi. 19 başarım.',
      'Boss olmayan diyarlara orta dalga eklendi; zorluk eki orta dalgalarda yarıya iner.',
      'Erişilebilirlik: renk körlüğü dostu saldırı uyarıları (sarı-beyaz, daha büyük halka).',
      'Bir düşmana yaslanınca arkandakine dönememe hatası düzeltildi.',
      'Bölüm seçimiyle bataklıktan başlarken Gölge’nin yanlışlıkla atlanması düzeltildi.',
      'itch.io’ya hazır: tüm varlık yolları göreli, tek komutla HTML5 paketi.',
    ],
  },
  {
    version: '2.0.0',
    title: 'Yedi Diyar güncellemesi',
    notes: [
      'Hikâye: prolog sinematiği, diyar başlık kartları, boss diyalogları ve “Hz. Ali’nin Zamanı” finali.',
      'Her diyara özgü mekanik: neon tabelalar, gelgit, bataklık suyu ve ateş böcekleri, lav çatlakları, ikiz çanlar, tipi ve buz, alev bacaları.',
      'Aku’ya üçüncü faz eklendi: Zaman Kırılması.',
      'Yeni düşman varyantları: Seçkin, Hayalet ve Kemik Devi.',
      'Vuruş hissi: hitstop, geri itme, sersemleme, saldırı uyarısı, kaçınma (dash) ve kusursuz kaçış ağır çekimi.',
      'Gamepad desteği, tuş atama, klavye düzenine göre tuş etiketleri ve erişilebilirlik ayarları.',
      'Özgün, uyarlanabilir müzik; diyar ortam sesleri ve yenilenen ses efektleri.',
      'Devam et, bölüm seçimi, rütbe sistemi, 14 başarım ve istatistikler.',
      'Her diyar için yeniden tasarlanan 3B set: yollar, ön plan siluetleri, temalı kapılar ve ortam aydınlatması.',
      'Siyah görünen zemin, kalabalık ve can barı renkleri düzeltildi.',
    ],
  },
  {
    version: '1.2.7',
    title: 'Biyom ilerleme düzeltmeleri',
    notes: ['Biyom geçişleri ve görseller sağlamlaştırıldı.'],
  },
] as const satisfies readonly PatchNote[]

export const PATCH_NOTES: readonly PatchNote[] = RELEASES

type ReleaseVersion = (typeof RELEASES)[number]['version']

/** English patch notes, release for release. */
const PATCH_NOTES_EN: Record<ReleaseVersion, Omit<PatchNote, 'version'>> = {
  '3.2.0': {
    title: 'English and the desktop edition',
    notes: [
      'The whole game is now playable in English: menus, HUD, the character archive, achievements and every line of the story.',
      'On first launch the game follows your browser language; switch any time in Settings → Display → Language or with the TR/EN button in the main menu.',
      'A downloadable Windows edition: an installer or a portable zip. It runs fully offline and keeps your progress on your PC.',
      'The web version is now a demo of the first two realms; the full game is on itch.io.',
      'If you switch languages mid-run, the messages on screen switch too.',
      'The fonts now ship with the game; nothing is fetched from an outside server.',
      'Fixed the fireball details on Hazrat Ali’s character card (at most 9 shots in 4 s). The hourglass scene now plays only when Hazrat Ali turns the hourglass.',
    ],
  },
  '3.1.1': {
    title: 'Button fixes',
    notes: [
      'The BACK button on the Chapter Select, Achievements, Credits and Patch Notes screens ignored the mouse, and the tracks in Chapter Select could not be clicked. Fixed.',
      'The SKIP button in the prologue, and clicking to move on to the next panel, did not work with the mouse. Fixed.',
      'Fixed the SKIP button on the ending’s credits roll.',
      'In Settings opened from the pause menu, the arrow keys and gamepad now stay within the settings.',
      'On the Pause → Controls screen, Esc / gamepad B now returns to the pause menu instead of the game.',
    ],
  },
  '3.1.0': {
    title: 'Save and showcase update',
    notes: [
      'Settings → Save Data: reset your progress (your settings stay) or everything (factory reset), with a two-step confirmation.',
      'On the main menu the hero has stepped out from behind the menu: center stage, fighting an enemy face to face.',
      'The showcase uses real in-game moves: two quick slashes and a spinning finisher, the fireball, the shield.',
      'The menu now has light trails that follow the sword itself, plus sparks and slash lines; Jack draws his katana and sheathes it again.',
      'Sword trails are now a bright crescent that follows the tip; the fireball, shield and dark orbs get new glowing shells.',
      'A lighter menu: the full-screen shadow filter is gone. The graphics notice only appears on first launch.',
    ],
  },
  '3.0.0': {
    title: 'Ten Realms update',
    notes: [
      'Three new realms: Hourglass Desert, Beetle Foundry and Storm Peak, each with its own mechanic.',
      'Every painting redone: each realm, the prologue and the ending are drawn as original “album cover” art with two-layer parallax.',
      'A three-hit attack chain and a spinning finisher; Twin Strike; parry projectiles with your sword.',
      'Light trails that follow the sword itself, spark/ink/sand particles, anime slash lines and impact frames.',
      'Jack carries his katana in its scabbard; swords are now gleaming steel.',
      'New enemies: Mirages, Beetle Drones and the Queen Beetle. New character: the Old Monk.',
      'The prologue in Aku’s own words; Hazrat Ali’s “I do not strike in anger; I strike only for what is right” moment; an ending that reaches all the way to Medina.',
      'Realm intros are album track cards; chapter select is a record tracklist. 19 achievements.',
      'Realms without a boss gained a middle wave; the difficulty’s extra enemies are halved in middle waves.',
      'Accessibility: colorblind-friendly attack warnings (yellow-white, a larger ring).',
      'Fixed a bug where leaning against one enemy kept you from turning to face the one behind you.',
      'Fixed the Shadow being skipped by mistake when starting from the swamp through chapter select.',
      'Ready for itch.io: every asset path is relative, and one command builds the HTML5 package.',
    ],
  },
  '2.0.0': {
    title: 'Seven Realms update',
    notes: [
      'Story: a prologue cinematic, realm title cards, boss dialogue and the finale, “The Age of Hazrat Ali”.',
      'A mechanic unique to each realm: neon signs, the tide, swamp water and fireflies, lava cracks, twin bells, blizzard and ice, flame vents.',
      'Aku gained a third phase: Time Fracture.',
      'New enemy variants: Elite, Ghost and Bone Giant.',
      'Combat feel: hitstop, knockback, stuns, attack warnings, dodging (dash) and perfect-dodge slow motion.',
      'Gamepad support, key rebinding, key labels that match your keyboard layout, and accessibility settings.',
      'Original adaptive music; ambient sound for every realm and reworked sound effects.',
      'Continue, chapter select, a rank system, 14 achievements and statistics.',
      'A redesigned 3D set for every realm: paths, foreground silhouettes, themed gates and ambient lighting.',
      'Fixed ground, crowd and health bar colors that showed up black.',
    ],
  },
  '1.2.7': {
    title: 'Realm progression fixes',
    notes: ['Realm transitions and visuals made sturdier.'],
  },
}

const PATCH_NOTES_EN_LIST: readonly PatchNote[] = RELEASES.map((release) => ({ version: release.version, ...PATCH_NOTES_EN[release.version] }))

export const patchNotesFor = (locale: Locale): readonly PatchNote[] => pick(locale, PATCH_NOTES, PATCH_NOTES_EN_LIST)
