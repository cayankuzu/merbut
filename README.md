# Merbut · On Diyar, Tek Kader

React, TypeScript, Vite ve React Three Fiber ile hazırlanmış, yerel iki oyunculu 2.5D hikâyeli aksiyon oyunu. Hz. Ali ve Samuray Jack, on diyar boyunca Aku’nun lejyonunu yarıp Aku’yu alt etmeye çalışır; final, iki kahramanın zaman portalına düşmesiyle biter ve ikinci oyuna (Hz. Ali’nin zamanı) kapı açar. Her diyar bir albüm parçası gibi açılır; tüm tablolar oyun için özgün olarak kodla üretilmiştir.

## Yerel çalıştırma

```powershell
cd "C:\Users\Cayan\Desktop\merbut"
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Oyun: [http://localhost:5173](http://localhost:5173) · Kalibrasyon paneli: [http://localhost:5173/?debug=1](http://localhost:5173/?debug=1)

5173 başka bir projede açıksa `.claude/launch.json` içindeki `merbut-dev` yapılandırması oyunu 5180 portunda başlatır.

## Oyun akışı

- **Prolog:** Aku kendi büyüklüğünü anlatır, anlatıcı onu düzeltir; altı panelde hikâye kurulur.
- **On diyar**, her biri kendi mekaniğiyle:

| Parça | Diyar | Mekanik |
| --- | --- | --- |
| 01 | Aku Metropolü | Neon tabelaları kır; elektrik yakındaki düşmanları sersemletir. |
| 02 | Günbatımı Limanı | Dalga uyarısında zıpla; gelgit düşmanları da sürükler. |
| 03 | Kum Saati Çölü | Kum saatine vur: çevresinde zaman yavaşlar. Titreyen seraplar tek darbede kuma döner. |
| 04 | Altın Bataklık | Su yavaşlatır; ateş böcekleri yeteneği doldurur. İlk boss: Aku’nun Gölgesi. |
| 05 | Böcek Dökümhanesi | Konveyör bantlar herkesi taşır; presin altında kalan dron hurdaya döner. Mini boss: Ana Böcek. |
| 06 | Kafatası Adası | Kızaran lav çatlaklarından uzak dur; lav düşmanı da yakar. |
| 07 | Yeşim Harabeleri | Sisteki hayaletler yarım hasar alır; iki çana birlikte vurunca sis dağılır. |
| 08 | Şimşek Zirvesi | Paratonere vur: kılıç şimşek taşır, darbeler zincirlenir. Yerde halka belirirse kaç. Yaşlı Keşiş Çifte Hamle'yi öğretir. |
| 09 | Sessiz Kemik Ovası | Tipi geri iter, buz zeminde kayılır; kardan Kemik Devi yükselir. |
| 10 | Alev Tahtı | Alev bacaları sırayla patlar; Aku zayıfladıkça zaman kırılır. |

- **Final:** Jack’in duası iki kahramana melek halkası verir. Aku normal ve canavar formları arasında geçiş yapar, canı %25’in altına düşünce “zaman kırılması” başlar. Aku yenilince zaman portalı açılır ve kahramanlar portala düşer: **DEVAM EDECEK...**
- **Zorluk:** Kolay, Orta, Zor ve Acımasız. Oyuncu canı/yaşamı, düşman sayısı ve hasarı, Zemzem miktarı, boss zırhı ve saldırı uyarı süresi birlikte ölçeklenir.
- **İlerleme:** Kayıttan devam, plak parça listesi biçiminde bölüm seçimi, rütbe, 19 başarım (3’ü gizli) ve istatistikler tarayıcıda saklanır. Eski kayıtlar yeni diyar sırasına otomatik taşınır. **Ayarlar → Kayıt** sekmesinden ilerleme (ayarlar korunarak) ya da her şey (fabrika ayarları) iki adımlı onayla sıfırlanır.
- **Ana menü vitrini:** kahraman ve rastgele bir düşman, oyundaki hareketleri ve efektleriyle (üçlü zincir, dönen bitirici, kılıç izleri, Jack'in kını) karşılıklı dövüşür.
- Ana menüdeki **Karakterler** arşivi kahramanları, yaratıkları ve bossları 360° döndürülebilir modellerle gösterir.

## Kontroller

| Karakter | Hareket | Zıplama | Saldırı | Atılma | Özel yetenek | 360° dönüş |
| --- | --- | --- | --- | --- | --- | --- |
| Hz. Ali | `A` / `D` | `W` | `S` | `Sol Shift` | `R`: 4 sn sınırsız alev topu | `Z` / `X` |
| Samuray Jack | `←` / `→` | `↑` | `↓` | `Sağ Shift` | `L`: 4 sn hareketli kalkan | `Ö` / `Ç` |

- **Saldırı zinciri:** Saldırı tuşuna ritimle üç kez basınca iki hızlı kesişin ardından dönerek kesen bir bitirici gelir.
- **Çifte Hamle:** İki kahraman aynı düşmana 0,4 saniye içinde vurursa ortak saldırı patlar.
- **Savuşturma:** Gelen mermiye doğru anda kılıç sallarsan mermi atana geri döner.
- **Atılma** kısa bir dokunulmazlık penceresi verir; saldırı tam isabet etmeden hemen önce atılırsan zaman yavaşlar (kusursuz kaçış) ve yetenek dolar.
- **Gamepad:** Her oyuncu bir denetleyici bağlayabilir. Sol çubuk / yön tuşları hareket, `A` zıplama, `X` saldırı, `Y` yetenek, `B` / `RT` atılma, `LB` / `RB` dönüş, `Start` duraklatma. Menüler yön tuşları ve `A` / `B` ile gezilir.
- Tuşlar **Ayarlar → Kontroller** sekmesinden yeniden atanabilir; ekrandaki tuş etiketleri klavye düzenine göre gösterilir.
- `Esc` oynanış, geri sayım, boss sinematiği ve final sırasında bütün dünya zamanını durdurur.

## Mimari

| Klasör | Sorumluluk |
| --- | --- |
| `src/sim` | Tek oyun saati (`clock.ts`), 30 Hz sabit adımlı simülasyon (`SimulationLoop`, `director.ts`), düşman yapay zekâsı, boss davranışları, diyar mekanikleri (`mechanics.ts`) ve tipli olay yolu (`events.ts`). |
| `src/content` | Veriye dayalı diyar içeriği (dalgalar, mekanikler, ipuçları), yama notları ve yapımcılar. |
| `src/world` | Prosedürel set dekoru (malzemeye göre birleştirilmiş geometri), mekanik görselleri ve hava durumu. |
| `src/game/vfx` | GPU parçacık havuzları, gerçek kılıcı izleyen kılıç izleri, anime kesik çizgileri ve darbe kareleri. |
| `src/story` | Senaryo metinleri, diyalog kuyruğu ve olaylara tepki veren hikâye yönetmeni. |
| `src/meta` | Kayıt/ilerleme, başarımlar ve oyun istatistikleri. |
| `src/audio` | WebAudio ile sentezlenen uyarlanabilir müzik, ortam sesleri ve olay tabanlı ses efektleri. |
| `src/input` | Klavye, gamepad, menü gezinmesi ve klavye düzeni etiketleri. |
| `src/characters`, `src/game` | Kahraman denetimi, Jack’in kını, düşman ve dron aktörleri, kamera, paralaks arka plan ve 3D sahne. |
| `src/components`, `src/styles` | Menüler, HUD, ayarlar ve tasarım belirteçleri (`tokens.css`). |
| `scripts/art` | Tüm özgün tabloları (diyar katmanları, kapaklar, prolog, portreler, mağaza görselleri) headless Chrome'da Canvas ile çizen sanat üreticisi. |

Oyun mantığı olaylar yayınlar (vuruş, atılma, dalga, boss evresi…); ses, efekt, kamera sarsıntısı, hikâye ve başarımlar bu olayları dinler. Duraklatma saati ilerletmeyi keser; vuruş duraksaması ve yavaş çekim de aynı saat üzerinden çalışır, bu yüzden parçacıklar ve kılıç izleri vuruş anında donar.

## Kalite komutları

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Uçtan uca testler varsayılan olarak 5173 portundaki geliştirme sunucusunu kullanır; başka bir port için `PW_PORT` verilir:

```powershell
$env:PW_PORT = '5180'; npm run test:e2e
```

## Sanat ve yayın

- `npm run art`: Tüm özgün tabloları yeniden üretir (`public/assets/realms`, `covers`, `story`, `ui/portrait-*`, `assets-src/store`, `public/og-image.jpg`). Belirli bir kısım için önek verilebilir: `node scripts/art/generate-art.mjs storm`.
- `npm run package:itch`: Build alır ve `release/merbut-itch-v<sürüm>.zip` üretir (index.html kökte, tüm yollar göreli). itch.io sayfa metni ve ayarlar: [`docs/ITCH_PAGE.md`](docs/ITCH_PAGE.md).
- `node scripts/compress-models.mjs`: GLB modellerini `model-optimizations.json` ayarlarıyla sıkıştırır.
- `npm run prepare:aku`: Masaüstündeki `1.aku` ve `2.aku` klasörlerinden Aku GLB’lerini hazırlar.
- `assets-src/backgrounds` içindeki eski dizi çizimleri artık oyunda kullanılmaz ve build'e girmez.

Ayrıntılı model ve animasyon raporu: [`docs/asset-analysis.md`](docs/asset-analysis.md) · Denetim ve yol haritası: [`docs/MERBUT_DENETIM_PROMPTU.md`](docs/MERBUT_DENETIM_PROMPTU.md) · Emeği geçenler: [`docs/CREDITS.md`](docs/CREDITS.md)
