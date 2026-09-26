# MERBUT · itch.io yayın paketi

Bu belge, oyunu itch.io'ya HTML5 olarak yüklerken sayfaya yapıştırılacak metinleri ve ayarları içerir.

## 1. Yükleme

```bash
npm run package:itch
```

Çıktı: `release/merbut-itch-v<sürüm>.zip` (index.html zip'in kökünde, tüm yollar göreli).

itch.io → **Create new project**:

| Alan | Değer |
|---|---|
| Kind of project | HTML |
| Uploads | `merbut-itch-v<sürüm>.zip` → "This file will be played in the browser" |
| Embed options | Viewport **1280 × 720**, "Mobile friendly" **kapalı**, **Fullscreen button** açık, "Automatically start on page load" kapalı (ses için tıklama gerekir) |
| Frame options | "SharedArrayBuffer support" gerekmez |
| Genre | Action |
| Tags | beat-em-up, co-op, local-multiplayer, 2.5d, story-rich, samurai, fan-game, stylized |
| Input | Keyboard, Gamepad (Xbox / PlayStation), Mouse (menüler) |
| Languages | Turkish |
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

**Tagline:** Hz. Ali and Samurai Jack cross ten realms together to stop Aku, who tore time apart. A story-driven 2.5D couch co-op brawler painted like a series of album covers.

**Description:**

> Aku, the shape-shifting master of darkness, has torn time open and started collecting heroes from every age. The first to fall through the rift is Hz. Ali, known for his justice, knowledge and courage. The one waiting for him is a samurai who has spent years looking for a way home.

- Ten realms, ten signature mechanics: neon signs, tides, hourglasses and mirages, a golden swamp, drone presses, lava, twin bells, lightning rods, a blizzard and the Throne of Flames.
- Fight as a pair: hit the same enemy together for a Twin Strike, ring two bells at once to lift the fog, shelter behind Jack's shield.
- Three-hit chains with a spinning finisher, dodge with a slow-motion perfect evade, parry projectiles back at their thrower.
- Two bosses and a cliffhanger ending through a time portal.
- Original, procedurally painted album-cover art and an adaptive score blending the Hijaz maqam with Japanese pentatonic scales.
- The game text is in Turkish.

## 4. Yasal not (sayfanın altına)

> MERBUT kâr amacı gütmeyen bir hayran yapımıdır. Samurai Jack ve Aku karakterleri Cartoon Network / Warner Bros. Discovery'ye aittir; bu proje onlarla bağlantılı değildir ve onlar tarafından onaylanmamıştır. Hz. Ali saygıyla tasvir edilmiştir: yüzü gösterilmez, sözleri bilgelik ve adaletini yansıtır. Oyun içindeki tüm arka plan tabloları, müzik ve ses efektleri bu proje için özgün olarak üretilmiştir.

Yayın öncesi karar: IP sahibinin hayran yapımı politikası ve topluluk hassasiyetleri yayıncının sorumluluğundadır. Oyun **ücretsiz** yayınlanmalı, bağış/ödeme açılmamalıdır.
