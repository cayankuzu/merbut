import { ASSET_PATHS } from '../config/assetPaths'
import type { BiomeId } from '../config/biomes'

/**
 * MERBUT — the whole story as data.
 *
 * Tone guide:
 * - Aku is a vain, theatrical tyrant with a bureaucrat's soul: the comic engine.
 * - His legion are overworked minions (dark humour: insurance, overtime, warranty).
 * - Jack is stoic, courteous and homesick; his wit is dry understatement.
 * - Hz. Ali is written with dignity: brave, just, merciful and brief. His lines
 *   carry wisdom, and when he is funny the joke lands on Aku. Humour is never at
 *   his expense.
 */
export type Speaker = 'ali' | 'jack' | 'aku' | 'golge' | 'anlatici' | 'lejyon' | 'kesis'

export interface Line {
  speaker: Speaker
  text: string
}

export const SPEAKERS: Record<Speaker, { name: string; color: string; pitch: number }> = {
  ali: { name: 'Hz. Ali', color: '#f7c65f', pitch: 150 },
  jack: { name: 'Samuray Jack', color: '#ff7aa8', pitch: 190 },
  aku: { name: 'Aku', color: '#7dff5a', pitch: 95 },
  golge: { name: 'Aku’nun Gölgesi', color: '#ff3b5c', pitch: 120 },
  anlatici: { name: 'Anlatıcı', color: '#e8dcc8', pitch: 0 },
  lejyon: { name: 'Aku Lejyonu', color: '#c9a0ff', pitch: 240 },
  kesis: { name: 'Yaşlı Keşiş', color: '#ffd9a0', pitch: 128 },
}

export interface PrologueBeat {
  image: string
  speaker: 'aku' | 'anlatici'
  text: string
}

/** Aku tells his own version of history; the narrator keeps correcting him. */
export const PROLOGUE: readonly PrologueBeat[] = [
  { image: ASSET_PATHS.story.akuRise, speaker: 'aku', text: 'Çok, çok eskiden... yani benim için daha dün... Ben, Aku, karanlığın şekil değiştiren efendisi, bu dünyayı tek bir saate kurdum: kendi saatime.' },
  { image: ASSET_PATHS.story.jackExile, speaker: 'aku', text: 'Beni kesebilen tek kılıcı taşıyan samurayı bir zaman yarığıyla geleceğe fırlattım. Parlak fikirdi. Hâlâ gurur duyuyorum.' },
  { image: ASSET_PATHS.story.jackWanders, speaker: 'anlatici', text: 'Ama samuray yılmadı. Aku’nun geleceğinde yıllardır yürüyor; kılıcı keskin, gözü hep geride kalan evinde.' },
  { image: ASSET_PATHS.story.timeRift, speaker: 'aku', text: 'Sonra düşündüm: tek kahraman sorun çıkarıyorsa, bütün çağların kahramanlarını toplayıp kilitlerim! Zamanı yırttım. Koleksiyon başlasın!' },
  { image: ASSET_PATHS.story.aliFalls, speaker: 'anlatici', text: 'Yırtıktan ilk düşen; adaletiyle, ilmiyle ve cesaretiyle bilinen bir yiğitti: Hz. Ali. Aku’nun koleksiyonu daha ilk gün ters gitti.' },
  { image: ASSET_PATHS.story.twoSwords, speaker: 'anlatici', text: 'İki yabancı, iki ayrı çağ, tek bir düşman. On diyar aşılacak. Yol, Alev Tahtı’na çıkıyor.' },
]

/** Scenes that open each realm, keyed by biome id. */
export const BIOME_SCENES: Record<BiomeId, readonly Line[]> = {
  'aku-city': [
    { speaker: 'jack', text: 'Yabancı... Sen de mi Aku’nun yırtığından düştün?' },
    { speaker: 'ali', text: 'Düştüm, kalktım. Düşmek kaderdir; kalkmak insanın elinde.' },
    { speaker: 'aku', text: 'Hah! Aku Metropolü’ne hoş geldiniz! Lütfen çıkışta ruhlarınızı görevliye teslim edin.' },
    { speaker: 'jack', text: 'Adım Jack. Omzuna dikkat et: bu yaratıklar saldırmadan önce parlar.' },
    { speaker: 'ali', text: 'Ben Ali. Kalabalık korkutur; adalet saymaz, tartar. Yürüyelim, kardeşim.' },
  ],
  'sunset-harbor': [
    { speaker: 'jack', text: 'Deniz... Evimin kıyısında da güneş böyle batardı. Ama orada dalgalar kimseye hizmet etmezdi.' },
    { speaker: 'ali', text: 'Dalga gelince zıpla. Denizle inatlaşılmaz; onunla yürünür.' },
    { speaker: 'aku', text: 'Liman yönetmeliği, madde bir: kahramanlar boğulur. Madde iki: bkz. madde bir.' },
  ],
  'hourglass-desert': [
    { speaker: 'jack', text: 'Kum saatleri... Biri beni evime, geçmişe götürebilir mi?' },
    { speaker: 'ali', text: 'Kum geri akar ama geçen gün geri gelmez. Geçmişe dönülmez dostum; geçmişten ders alınır.' },
    { speaker: 'jack', text: '...Yine de denemek isterdim.' },
    { speaker: 'aku', text: 'Çölüme hoş geldiniz! Serap mı, gerçek mi? İpucu: hepsi sizden daha hızlı!' },
  ],
  'golden-swamp': [
    { speaker: 'ali', text: 'Bataklıkta acele eden çamura saplanır. Suyun üstünden zıplayarak geç.' },
    { speaker: 'jack', text: 'Ateş böceklerini izle. Işıkları kılıcına güç veriyor.' },
  ],
  'beetle-foundry': [
    { speaker: 'aku', text: 'Böcek Dökümhanesi! Günde bin dron, sıfır tatil! Verimliliğime hayran kalın!' },
    { speaker: 'jack', text: 'Makineler... Garip ama içim rahatladı. Bunlar kanamaz.' },
    { speaker: 'ali', text: 'Yine de dikkatli ol. Presin gölgesi düşmandan önce iner.' },
    { speaker: 'lejyon', text: 'Bip. Garanti süreniz... dolmuştur. Bip.' },
  ],
  'skull-island': [
    { speaker: 'aku', text: 'Kafatası Adası! Tatil için ideal: lav, kül ve sonsuz uyku.' },
    { speaker: 'ali', text: 'Yer kızarınca oradan uzaklaş. Düşmanı çatlağın üstüne çekersek lav bizim için çalışır.' },
    { speaker: 'jack', text: 'Bu kafataslarının hepsi bize bakıyor gibi.' },
    { speaker: 'ali', text: 'Merak etme. Onlar artık kimseye bakmıyor.' },
  ],
  'jade-ruins': [
    { speaker: 'jack', text: 'Sis... Düşmanların yarısı gölge gibi. Kılıcım içlerinden geçiyor.' },
    { speaker: 'ali', text: 'İki çan var. Birlikte vurursak sis dağılır.' },
    { speaker: 'aku', text: 'O çanlar antika! Kırarsanız depozitonuzu yakarım!' },
  ],
  'storm-peak': [
    { speaker: 'jack', text: 'Bu dağlarda bir manastır vardı. Keşişler bana nefesi dinlemeyi öğretmişti.' },
    { speaker: 'ali', text: 'Fırtınanın ortasındaki sükûnet, kalbin kalesidir.' },
    { speaker: 'aku', text: 'Şimşekler benim! Bulutlar benim! Elektrik faturası da... bir dakika, o kimde?' },
  ],
  'skull-field': [
    { speaker: 'ali', text: 'Burada rüzgâr bile fısıldıyor.' },
    { speaker: 'jack', text: 'Buz tutmuş zemin. Dikkatli bas, tipi geri iter.' },
    { speaker: 'lejyon', text: 'Bu ovada mesai hiç bitmiyor... Emeklilik ikramiyesini kemik olarak ödüyorlar.' },
  ],
  'inferno-throne': [
    { speaker: 'aku', text: 'Alev Tahtı’ma hoş geldiniz! Ayakkabılarınızı çıkarmayın, zemin zaten yanıyor.' },
    { speaker: 'jack', text: 'Aku! Bu sefer zaman senin değil.' },
    { speaker: 'ali', text: 'Zulüm ne kadar yüksek taht kursa da temeli çürüktür.' },
  ],
}

/** One-shot story scenes, keyed by story beat. */
export const SCENES: Record<string, readonly Line[]> = {
  'neon-first': [
    { speaker: 'aku', text: 'Neon tabelalarıma dokunmayın! Onlar çok pahalı! Faturaları bile çok pahalı!' },
    { speaker: 'jack', text: 'Demek pahalılar.' },
    { speaker: 'ali', text: 'Zalimin süsü, mazlumun alın teridir. Kıralım.' },
  ],
  'hourglass-first': [
    { speaker: 'ali', text: 'Kum saatini çevirdim; çevresindeki zaman ağırlaştı. Şimdi vur!' },
    { speaker: 'jack', text: 'Zamanı durduran kılıç değil, sabırmış.' },
  ],
  'mirage-first': [
    { speaker: 'jack', text: 'Kuma döndü. Sahte düşman, sahte korku.' },
    { speaker: 'ali', text: 'Serap susuzu kandırır; gözü tok olanı değil.' },
  ],
  'shadow-intro': [
    { speaker: 'golge', text: 'Ben senin gölgenim, samuray. Her kaçtığın yerde ben zaten oradaydım.' },
    { speaker: 'jack', text: 'Gölgem daha az konuşurdu.' },
    { speaker: 'ali', text: 'Gölgeyle dövüşülmez; ışığı büyütürsün. İç şu Zemzem’i.' },
  ],
  'shadow-defeated': [
    { speaker: 'jack', text: 'Gölgem düştü. Garip... hafifledim sanki.' },
    { speaker: 'ali', text: 'İnsanın en ağır yükü çoğu zaman kendi karanlığıdır.' },
  ],
  'queen': [
    { speaker: 'aku', text: 'Ana Böcek! Dokuz yüz doksan dokuz dronun annesi... ve hepsinin nafakası benden çıkıyor!' },
    { speaker: 'jack', text: 'Büyük olan ağır döner. Arkasına geç.' },
  ],
  'press-kill': [
    { speaker: 'lejyon', text: 'Bip... Bu bir iş kazası değildir. Bip. Bu bir iş kazasıdır.' },
  ],
  'rod-first': [
    { speaker: 'jack', text: 'Kılıcım gök gürültüsüyle titriyor.' },
    { speaker: 'ali', text: 'Gökten gelen güç emanettir. Emanet israf edilmez.' },
  ],
  'monk': [
    { speaker: 'kesis', text: 'İki çağdan iki kılıç... Aku’nun tahtındaki saat ancak birlikte kesilir. Aynı düşmana aynı anda vurun.' },
    { speaker: 'jack', text: 'Birlikte, usta.' },
    { speaker: 'ali', text: 'Tek el ses vermez. İki el birleşince duyulur.' },
  ],
  'bell-hint': [
    { speaker: 'ali', text: 'Tek çan yetmez. Sen öbürüne, ben buna. Aynı anda!' },
  ],
  'resonance': [
    { speaker: 'jack', text: 'Sis dağılıyor! Şimdi görünüyorlar.' },
    { speaker: 'ali', text: 'İki yürek aynı anda vurursa dağ bile yankılanır.' },
  ],
  'giant': [
    { speaker: 'aku', text: 'Kemik Devi! Kendisi bu ayın çalışanı. Her ay.' },
    { speaker: 'jack', text: 'Büyük olan yavaş vurur. Saldırısını gör, sonra kaç.' },
  ],
  'aku-intro': [
    { speaker: 'jack', text: 'Atalarımın ruhu... bize güç verin.' },
    { speaker: 'ali', text: 'Dua kalbin kılıcıdır. Bileği güçlendirir.' },
    { speaker: 'aku', text: 'Dua mı? Ben de bir dilek tutuyorum: ikinizin de sonu!' },
  ],
  // A moment drawn from the Battle of the Trench: Ali will not strike in anger.
  'aku-wrath': [
    { speaker: 'aku', text: 'Sen de kimsin, çöl yolcusu? Bir samurayın gölgesi! Yüzüne tükürürüm!' },
    { speaker: 'ali', text: 'Bir nefes bekle, Jack. Öfkeyle vurmam; hak için vururum.' },
    { speaker: 'jack', text: 'Anlıyorum. Nefesini topla. Ben buradayım.' },
  ],
  'aku-monster': [
    { speaker: 'aku', text: 'Yeter! Gerçek yüzümü görün!' },
    { speaker: 'jack', text: 'Gerçek yüzün de pek güzel değil.' },
  ],
  'aku-fracture': [
    { speaker: 'aku', text: 'Zaman benim oyuncağım! Bakın, bütün diyarlar tek bir kâbusta!' },
    { speaker: 'ali', text: 'Zamanı yırtan, en sonunda kendi saatini kırar.' },
    { speaker: 'jack', text: 'Şimdi, Ali! Birlikte!' },
  ],
  'aku-defeated': [
    { speaker: 'aku', text: 'Hayır... Olamaz! Ama son bir oyunum var! Zaman yarığı, YUT ONLARI!' },
  ],
  'portal': [
    { speaker: 'jack', text: 'Ali! Portal bizi çekiyor, elimi tut!' },
    { speaker: 'ali', text: 'Tuttum. Nereye düşersek düşelim, yol aynı yol.' },
    { speaker: 'jack', text: 'Belki de bu sefer... eve dönüyorumdur.' },
  ],
  'teaser': [
    { speaker: 'anlatici', text: 'Portal kapandı. İki kahraman zamanın kıyısından aşağı, çok eski bir çağa doğru düştü...' },
    { speaker: 'anlatici', text: 'Hurma gölgeleri, çöl rüzgârı ve uzakta yükselen bir şehir: Medine.' },
    { speaker: 'anlatici', text: 'Sıradaki durak: Hz. Ali’nin zamanı.' },
  ],
}

/** Short reactive lines; one variant is picked at random, with cooldowns. */
export const BARKS: Record<string, readonly Line[]> = {
  'gate-open': [
    { speaker: 'jack', text: 'Kapı açıldı. İleri!' },
    { speaker: 'ali', text: 'Yol açıldı. Oyalanmayalım.' },
    { speaker: 'aku', text: 'Kim o kapıyı açık bıraktı?! Kesintiyi maaşınızdan keseceğim!' },
    { speaker: 'aku', text: 'Kapı mı açıldı? Güvenlik şirketini hemen kovun!' },
  ],
  'ali-down': [
    { speaker: 'jack', text: 'Ali! Kalk, daha yolumuz var!' },
    { speaker: 'aku', text: 'Biri düştü! Bugün şanslı günüm!' },
  ],
  'jack-down': [
    { speaker: 'ali', text: 'Düşmek ayıp değil, dostum. Kalkmamak ayıp.' },
    { speaker: 'aku', text: 'Samuray yere yapıştı! Bunu çerçeveletip asacağım.' },
  ],
  'revive': [
    { speaker: 'jack', text: 'Yeniden ayaktayım.' },
    { speaker: 'ali', text: 'Bu kadar kolay değil.' },
  ],
  'combo': [
    { speaker: 'jack', text: 'Kılıcım bugün konuşkan.' },
    { speaker: 'ali', text: 'Saymayı çoktan bıraktım.' },
    { speaker: 'lejyon', text: 'Bu sözleşmede böyle bir madde yoktu!' },
  ],
  'perfect': [
    { speaker: 'jack', text: 'Rüzgâr kadar hızlı.' },
    { speaker: 'ali', text: 'Darbe boşa, sabır bizde.' },
  ],
  'team': [
    { speaker: 'jack', text: 'İki kılıç, tek nefes!' },
    { speaker: 'ali', text: 'Birlikte vurduk; birlikte kazanırız.' },
    { speaker: 'lejyon', text: 'İkisi birden mi?! Bu adil değil!' },
  ],
  'wave': [
    { speaker: 'lejyon', text: 'Patron izliyor, çalışıyormuş gibi yapın!' },
    { speaker: 'lejyon', text: 'Sigortam bunu karşılıyor mu acaba?' },
    { speaker: 'lejyon', text: 'Bugün mesaim bitmişti ama...' },
    { speaker: 'lejyon', text: 'İnsan kaynaklarına şikâyet edeceğim. Tabii kalırsam.' },
    { speaker: 'aku', text: 'Lejyonum! Onları durdurun! Ya da en azından yorun!' },
  ],
  'drone-wave': [
    { speaker: 'lejyon', text: 'Bip. Görev: kahramanları yok et. Bip. Yan görev: kahve getir.' },
    { speaker: 'lejyon', text: 'Bip... Bataryam yüzde üç. Bip. Heyecanlıyım.' },
    { speaker: 'aku', text: 'Dronlarım! En ucuz tedarikçiden, en yüksek fiyata aldım!' },
  ],
  'tide-warn': [
    { speaker: 'ali', text: 'Dalga geliyor, zıpla!' },
  ],
  'lava-warn': [
    { speaker: 'jack', text: 'Yer kızarıyor, çekil!' },
  ],
  'gust-warn': [
    { speaker: 'ali', text: 'Tipi geliyor, yere sağlam bas.' },
  ],
  'press-warn': [
    { speaker: 'jack', text: 'Presin gölgesi! Çekil!' },
  ],
  'bolt-warn': [
    { speaker: 'ali', text: 'Yerde halka var, şimşek iniyor!' },
  ],
  'portal-ambush': [
    { speaker: 'jack', text: 'Bizi başka bir diyara fırlattı!' },
    { speaker: 'aku', text: 'Sürpriz! Eski dostlarınızla tanışın!' },
  ],
  'aku-taunt': [
    { speaker: 'aku', text: 'Yoruldunuz mu kahramanlar? Uzanın biraz... sonsuza dek!' },
    { speaker: 'aku', text: 'Ben zamanın efendisiyim! Siz ise gecikmiş iki misafir.' },
    { speaker: 'aku', text: 'Bu kadar mı? Lejyonum daha iyi dövüşüyordu. Pek iyi dövüşmüyordu yani.' },
    { speaker: 'aku', text: 'Şu kılıçlar... Ahh! Kim onları bu kadar keskin yapıyor?!' },
  ],
}
