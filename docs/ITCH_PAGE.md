# MERBUT · itch.io yayın paketi

Bu belge, oyunu itch.io'ya hem tarayıcıda oynanacak (HTML5) hem de indirilip bilgisayara kurulacak (Windows) şekilde yüklerken gereken dosyaları, ayarları ve sayfa metinlerini içerir.

> Not: merbut.vercel.app herkese açık **demo**dur (ilk iki diyar, `npm run build:demo`). itch.io'ya yüklenen HTML5 ve Windows dosyaları **tam sürüm**dür.

## 1. Dosyaları üret

```bash
npm run package:itch
```

```bash
npm run package:desktop
```

| Dosya | Ne işe yarar | itch.io'da işaretle |
|---|---|---|
| `release/merbut-itch-v<sürüm>.zip` | Tarayıcıda oynanan **tam** sürüm (index.html kökte, yollar göreli; ücretli sayfada yalnızca satın alana açılır) | **This file will be played in the browser** |
| `release/desktop/Merbut-<sürüm>-Setup.exe` | Windows kurulum sihirbazı: klasör seçimi, masaüstü ve Başlat menüsü kısayolu, kaldırıcı | Platform: **Windows** |

> Kurulum dosyası (Setup.exe) yalnızca Akıllı Uygulama Denetimi **kapalı** bir bilgisayarda üretilebiliyor: derleme sırasında yeni üretilen imzasız kaldırıcı çalıştırılıyor ve bu özellik açıkken Windows bunu engelliyor ("Smart App Control Block"). O zamana kadar Windows indirmesi taşınabilir zip'tir; itch.io uygulaması zip'i kurar ve `.itch.toml` ile `Merbut.exe`'yi başlatır.
| `release/desktop/Merbut-<sürüm>-windows-x64.zip` | Kurulumsuz (taşınabilir) Windows sürümü; itch.io masaüstü uygulaması bunu kurar ve `Merbut.exe`'yi başlatır (`.itch.toml` içinde) | Platform: **Windows** |

- Masaüstü sürümü tamamen çevrimdışı çalışır (yazı tipleri dahil her şey pakette); kayıtlar oyuncunun kullanıcı profilinde saklanır, oyunu kapatıp açınca kaybolmaz.
- Kurulum dosyası dijital imzalı değil: Windows ilk açılışta "Windows kişisel bilgisayarınızı korudu" (SmartScreen) uyarısı gösterebilir → **Ek bilgi → Yine de çalıştır**. Bunu sayfaya da yazın (aşağıdaki metinlerde var).
- **Akıllı Uygulama Denetimi (Smart App Control):** Windows 11'de bu özellik açıksa imzasız kurulum dosyası "Uygulama Denetimi ilkesi bu dosyayı engelledi" diye **hiç çalıştırılamaz** ve "yine de çalıştır" seçeneği yoktur (geliştirme bilgisayarında bu yaşandı). Kalıcı çözüm dosyaları **kod imzalamak**tır: Microsoft *Trusted Signing* (aylık abonelik, kimlik doğrulaması gerekir) ya da bir sertifika sağlayıcıdan OV/EV kod imzalama sertifikası. Sertifika alındığında electron-builder `win.signtoolOptions` / `azureSignOptions` ile otomatik imzalar. O zamana kadar Smart App Control açık oyuncular tarayıcı sürümünü oynayabilir.
- Not: Bu repo üzerinde çalışan otomasyon ortamında Masaüstü klasörüne yazma kısıtlıydı; normal bir terminalde `npm run package:desktop` doğrudan `release/desktop/` altına üretir.
- Linux için `npm run package:desktop:linux` (bir Linux makinede çalıştırın). macOS sürümü ancak bir Mac'te derlenip imzalanabilir; Mac oyuncuları tarayıcı sürümünü oynayabilir.
- İsterseniz [butler](https://itch.io/docs/butler/) ile yükleyin: `butler push release/desktop/win-unpacked <kullanıcı>/merbut:windows` ve `butler push release/merbut-itch-v<sürüm>.zip <kullanıcı>/merbut:html5`.

itch.io → **Create new project**:

| Alan | Değer |
|---|---|
| Kind of project | HTML (tarayıcı sürümü sayfada oynanır, indirilebilir dosyalar da listelenir) |
| Uploads | Yukarıdaki üç dosya: HTML5 zip'i "played in the browser", Setup.exe ve Windows zip'i "Windows" |
| Pricing | Ücretli satış ya da "No payments"/"Donate" seçimi sizin kararınız; bkz. aşağıdaki **Telif notu** |
| Embed options | Viewport **1280 × 720**, "Mobile friendly" **kapalı**, **Fullscreen button** açık, "Automatically start on page load" kapalı (ses için tıklama gerekir) |
| Frame options | "SharedArrayBuffer support" gerekmez |
| Genre | Action |
| Tags | beat-em-up, co-op, local-multiplayer, 2.5d, story-rich, samurai, fan-game, stylized |
| Input | Keyboard, Gamepad (Xbox / PlayStation), Mouse (menüler) |
| Languages | Turkish, English (oyun tarayıcı diline göre açılır; Ayarlar → Görüntü → Dil ve ana menüdeki TR/EN düğmesiyle değişir) |
| Accessibility | Subtitles, configurable controls, reduced flashing option, screen shake slider |
| Community | Comments |
| Visibility | Önce **Draft** → test → **Public** |

Kapak ve görseller (repo içinde, build'e girmez):

- Kapak: `assets-src/store/itch-cover-630x500.png`
- Anahtar görsel / banner: `assets-src/store/key-art-1920x1080.jpg`
- Ekran görüntüleri: `assets-src/store/screenshots/*.png` (1280×720)

## 2. Sayfa metni (Türkçe)

**Başlık:** MERBUT · On Diyar, Tek Kader

**Kısa açıklama:** Hz. Ali ve Samuray Jack, zamanı yırtan Aku'ya karşı on diyarı birlikte aşar. Aynı klavyede ya da iki gamepad ile oynanan, albüm kapağı estetiğinde, hikâye odaklı 2.5D aksiyon.

**Açıklama:**

> Çok, çok eskiden... yani Aku için daha dün... Karanlığın şekil değiştiren efendisi zamanı yırttı ve bütün çağların kahramanlarını kendi hapishanesine toplamaya başladı. Yırtıktan ilk düşen, adaletiyle ve ilmiyle bilinen bir yiğitti: Hz. Ali. Onu karşılayan ise yıllardır evine dönmenin yolunu arayan bir samuraydı.
>
> İki yabancı, iki ayrı çağ, tek bir düşman.

- **On diyar, on mekanik:** neon tabelalar, gelgit, kum saatleri ve seraplar, altın bataklık, dron presleri, lav, ikiz çanlar, şimşek paratonerleri, tipi ve Alev Tahtı.
- **Birlikte savaşın:** aynı düşmana aynı anda vurunca Çifte Hamle, iki çana birlikte vurunca sis dağılır, Jack'in kalkanı Ali'yi de korur.
- **Vuruş hissi:** üç vuruşluk zincirler ve dönen bitirici, atılma ve kusursuz kaçışta ağır çekim, gelen mermiyi kılıçla savuşturup geri gönderme, darbe kareleri.
- **İki boss, bir final:** Aku'nun Gölgesi ve üç evreli Aku. Final bir portalla biter; hikâye ikinci oyunda devam edecek.
- **Albüm kapağı sanatı:** her diyar bir albüm parçası gibi açılır; tüm tablolar oyun için özgün olarak üretildi.
- **Özgün müzik:** Hicaz makamı ile Japon pentatonik dizileri buluşturan, dövüşe göre değişen müzik.
- 4 zorluk, 19 başarım, rütbe sistemi, kayıttan devam ve bölüm seçimi. Ayarlar → Kayıt'tan ilerlemeyi ya da her şeyi sıfırlayıp baştan başlayabilirsiniz.
- **Türkçe ve İngilizce:** oyun tarayıcı dilinizle açılır; Ayarlar → Görüntü → Dil ya da ana menüdeki TR/EN düğmesiyle istediğiniz an değiştirin.
- **Tarayıcıda oyna ya da indir:** Windows için kurulum sihirbazını (Setup.exe) çalıştırın ya da taşınabilir zip'i açıp Merbut.exe'yi başlatın. İnternetsiz çalışır, ilerlemeniz bilgisayarınızda saklanır.
- Windows sürümü henüz dijital imzalı değil; ilk açılışta SmartScreen uyarısı çıkarsa **Ek bilgi → Yine de çalıştır**.

**Kontroller:**

| | Hz. Ali | Samuray Jack |
|---|---|---|
| Hareket | A / D | ← / → |
| Zıpla | W | ↑ |
| Saldır (3'lü zincir) | S | ↓ |
| Atıl | Sol Shift | Sağ Shift |
| Yetenek | R (alev topu) | L (kalkan) |
| Dön | Z / X | Ö / Ç |

Gamepad: sol çubuk hareket, A zıpla, X saldır, Y yetenek, B/RT atıl, LB/RB dön, Start duraklat. Tuşlar Ayarlar → Kontroller'den değiştirilebilir.

**Sistem:** Masaüstü tarayıcı (Chrome, Edge, Firefox). WebGL 2 gerekir. Tümleşik GPU'larda otomatik grafik profili devreye girer.

## 3. Page text (English)

**Tagline:** Hazrat Ali and Samurai Jack cross ten realms together to stop Aku, who tore time apart. A story-driven 2.5D couch co-op brawler painted like a series of album covers.

**Description:**

> Aku, the shape-shifting master of darkness, has torn time open and started collecting heroes from every age. The first to fall through the rift is Hazrat Ali, known for his justice, knowledge and courage. The one waiting for him is a samurai who has spent years looking for a way home.

- Ten realms, ten signature mechanics: neon signs, tides, hourglasses and mirages, a golden swamp, drone presses, lava, twin bells, lightning rods, a blizzard and the Throne of Flames.
- Fight as a pair: hit the same enemy together for a Twin Strike, ring two bells at once to lift the fog, shelter behind Jack's shield.
- Three-hit chains with a spinning finisher, dodge with a slow-motion perfect evade, parry projectiles back at their thrower.
- Two bosses and a cliffhanger ending through a time portal.
- Original, procedurally painted album-cover art and an adaptive score blending the Hijaz maqam with Japanese pentatonic scales.
- Fully playable in English and Turkish (it follows your browser language; switch any time in Settings → Display → Language or with the TR/EN button in the main menu).
- Play in the browser, or download it for Windows: run the installer (Setup.exe) or unzip the portable build and start Merbut.exe. Works fully offline; your progress is saved on your PC.
- The Windows build is not code-signed yet, so Windows SmartScreen may warn on first launch: choose **More info → Run anyway**.

## 4. Yasal not (sayfanın altına)

> MERBUT kâr amacı gütmeyen bir hayran yapımıdır. Samurai Jack ve Aku karakterleri Cartoon Network / Warner Bros. Discovery'ye aittir; bu proje onlarla bağlantılı değildir ve onlar tarafından onaylanmamıştır. Hz. Ali saygıyla tasvir edilmiştir: yüzü gösterilmez, sözleri bilgelik ve adaletini yansıtır. Oyun içindeki tüm arka plan tabloları, müzik ve ses efektleri bu proje için özgün olarak üretilmiştir.

### Telif notu (satış öncesi mutlaka okuyun)

Samurai Jack ve Aku, Cartoon Network / Warner Bros. Discovery'nin karakterleridir. Bu karakterleri kullanan bir oyunu **ücretli satmak**, hayran yapımlarına çoğu zaman göz yumulan “kâr amacı gütmeyen” alanın dışına çıkar: telif ihlali bildirimi (DMCA) ile itch.io sayfasının kaldırılması ve hak sahibinin talepleri riskini doğurur. Ayrıca oyun içindeki yapımcılar ekranı ve yukarıdaki yasal not oyunu “kâr amacı gütmeyen hayran yapımı” olarak tanımlıyor; ücret alınırsa bu ifade doğru olmaz.

Daha güvenli seçenekler: itch.io'da **No payments** (ücretsiz) ya da **Name your own price** ile en az fiyatı **0** bırakmak; bağış/ödeme açmadan önce IP sahibinin hayran yapımı politikasına bakmak ya da Samurai Jack/Aku yerine tamamen özgün karakterlerle ticari bir sürüm planlamak. Karar yayıncınındır.
