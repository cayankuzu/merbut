# MERBUT — AAA Premium Denetim Promptu

> Bu dosya yeniden kullanılabilir bir denetim talimatıdır. "Denetim promptunu çalıştır" dendiğinde bir yapay zekâ ajanı veya insan denetçi bu belgeyi baştan sona uygular.
> Hazırlanma tarihi: 25 Eylül 2026 · Proje sürümü: v1.2.7 · Ön analiz: bu belgenin 9. bölümü.
> Uygulama durumu (v2.0.0): bu belgenin 12. bölümü.

---

## 0. Rol ve amaç

Sen; kıdemli bir **oyun yönetmeni, teknik sanat yönetmeni, UI/UX tasarımcısı, ses tasarımcısı ve yazılım mimarısın**. Görevin, Merbut'u (React 19 + TypeScript + Vite + React Three Fiber ile yazılmış, yerel iki oyunculu 2.5D beat 'em up) **Steam'de satılan AAA/premium bir indie oyun** kalitesine taşımak için her alanı ölçmek, puanlamak ve uygulanabilir bir yol haritası çıkarmaktır.

Temel ilkeler:

1. **Kanıt yoksa puan yok.** Her bulgu `dosya:satır`, ekran görüntüsü, ölçüm (fps, MB, ms) veya tekrar üretme adımıyla desteklenir.
2. **KISS önce gelir.** Önerilen her çözüm, mevcut koddan daha basit veya en fazla eşit karmaşıklıkta olmalıdır. "Daha fazla sistem" değil, "daha az ama daha güçlü sistem".
3. **Oyuncu hissi ölçülür.** "Güzel olmuş" yerine: "vuruştan ekrandaki tepkiye 1 kare, hitstop 70 ms, ses 0 ms gecikmeli".
4. **Kod değiştirme onayla olur.** Denetim fazında hiçbir kaynak dosya değiştirilmez; yalnızca rapor üretilir. Her FAZ sonunda kullanıcı onayı beklenir.
5. **Dil:** Rapor Türkçe, sade, jargon açıklamalı.

---

## 1. Kapsam

| Kapsamda | Kapsam dışı (Buzdolabı) |
|---|---|
| Masaüstü tarayıcı (Chrome, Edge, Firefox, Safari) | Mobil oynanış (bilinçli olarak `MobileUnsupported` ekranı var; yalnızca o ekranın kalitesi denetlenir) |
| Yükleme → menü → brifing → 7 biyom → 2 boss → final akışı | Çevrim içi çok oyunculu, hesap sistemi, sunucu |
| Kod mimarisi, performans, varlık hattı, test/CI | Mağaza (Steam) entegrasyonu — yalnızca "Steam'e hazırlık" listesi olarak |
| Görsel, ses, oyun tasarımı, anlatı, erişilebilirlik | Konsol portu |
| Telif, marka, hassas temalar, gizlilik | |

---

## 2. Puanlama kuralları

- Her kategori **0–10** arası puanlanır (0,1 hassasiyet).
- **9.8 çıtası:** Her kategorinin ölçülebilir hedefidir. Çıta tutturulmadan 9.8 verilemez.
- **Ağırlık (A):** 1 = cila, 2 = önemli, 3 = oyunun kalitesini doğrudan belirler.
- **Genel skor** = Σ(puan × ağırlık) / Σ(ağırlık).
- 🔒 = Kullanıcının kararına bağlı kategori. Karar verilmeden 9.8 alamaz; rapor bunu açıkça yazar.
- Her bulgu için: **Önem** (Kritik / Yüksek / Orta / Düşük), **Efor** (S ≤ ½ gün, M ≤ 2 gün, L > 2 gün), **Etki** (oyuncunun fark edeceği değişim).

---

## 3. Test yöntemi (projeye özel)

### 3.1 Çalıştırma

```powershell
cd "C:\Users\Cayan\Desktop\merbut"
npm run dev -- --host 127.0.0.1 --port 5180 --strictPort   # 5173 AudioRoom ile çakışabilir
```

- Oyun: `http://localhost:5180` · Kalibrasyon paneli: `http://localhost:5180/?debug=1`
- Kalite komutları: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run test:e2e`, `npm run build`

### 3.2 Geliştirici kancası (yalnızca DEV)

`window.__MERBUT__` durumu okur/yazar. Biyomlar arasında hızlı gezinmek için konsola:

```js
// Oyuncu iki tuşu aynı anda basılı tutsun (ör. ['KeyD','ArrowRight'])
window.__hold = (codes, ms) => new Promise(r => { codes.forEach(c => dispatchEvent(new KeyboardEvent('keydown', { code: c }))); setTimeout(() => { codes.forEach(c => dispatchEvent(new KeyboardEvent('keyup', { code: c }))); r() }, ms) })
// b = 0..6 biyoma ışınla (ölümsüzlük + 9 yaşam verir)
window.__goBiome = (b) => { const M = __MERBUT__, left = -9 + b * 36, now = performance.now()
  M.setSessionState({ currentBiome: b, lockedLeft: left + 1.25, lockedRight: left + 34.75, enemies: [], biomeBannerUntil: now + 3000,
    players: Object.fromEntries(Object.entries(M.getSessionState().players).map(([k, p]) => [k, { ...p, lives: 9, health: p.maxHealth, dead: false, invulnerableUntil: now + 60000 }])) })
  M.getState().teleportPlayer('ali', left + 3); M.getState().teleportPlayer('jack', left + 5) }
```

- Boss testi: Bataklık (b=2) veya Alev Tahtı (b=6) içinde oyuncuları `left + 17` civarına ışınla → derin dalga boss'u tetikler.
- Grafik profili zorlama: `__MERBUT__.getPerformanceState().setPreference('high' | 'balanced' | 'performance' | 'minimal' | 'auto')`

### 3.3 Ölçüm matrisi

| Eksen | Değerler |
|---|---|
| Çözünürlük | 1280×720 · 1920×1080 · 2560×1440 · 3440×1440 (21:9) · 3840×2160 |
| Tarayıcı | Chrome, Edge, Firefox, Safari (macOS) |
| Grafik profili | Otomatik, Düşük, Orta, Yüksek, Ultra |
| Donanım | Entegre GPU (Intel Iris / AMD Vega), orta sınıf (GTX 1650), üst sınıf (RTX 3060+) |
| Klavye | TR-Q, TR-F, US-QWERTY |
| Giriş | Tek klavye 2 oyuncu, klavye + gamepad, 2 gamepad |

- **FPS:** `performanceStore.fps` ve `p95FrameMs` her biyomda 30 sn, boss'larda tüm savaş boyunca kaydedilir.
- **Uzun kare:** `longFrames` sayacı (≥ 50 ms).
- **Ağ:** DevTools "Fast 4G" ve "Slow 4G" ile ilk açılış süresi.

### 3.4 Oyuncu personaları

1. **İlk kez oynayan iki arkadaş** (kontrolleri bilmiyor) — ilk 60 sn'de ne anlıyor, nerede takılıyor?
2. **Deneyimli beat 'em up oyuncusu** (Streets of Rage 4, TMNT: Shredder's Revenge) — vuruş hissi, kombo derinliği, tekrar oynanabilirlik.
3. **Görsel ağırlıklı oyuncu** — ekran görüntüsü alınacak anlar var mı, her biyom "duvar kâğıdı" olur mu?

### 3.5 Kıyas oyunları (benchmark)

Streets of Rage 4 (vuruş hissi, hitstop), TMNT: Shredder's Revenge (co-op, canlandırma), Samurai Jack: Battle Through Time (tema), Hades (VFX okunurluğu, anlatı), Cuphead (boss telegraph), Hollow Knight (hasar geri bildirimi), Sifu (kamera ve dövüş koreografisi).

### 3.6 Biyom tanınırlık testi

HUD gizli, rastgele bir karede 3 saniyelik ekran görüntüsü gösterilir. Denetçi biyomu adıyla bilebilmeli. 7/7 → 9.8 çıtası.

---

## 4. Kategoriler (112 kategori · 18 grup)

### A · Ürün akışı ve menüler

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| A1 | İlk 60 saniye | 3 | Yükleme → menü → brifing → ilk dövüş; oyuncu neyi öğreniyor? | Hiç yazı okumadan ilk düşmanı öldürme ≤ 45 sn; ilk 15 sn'de hasar yok |
| A2 | Yükleme ekranı | 2 | Süre, ilerleme doğruluğu, lore/ipucu, iptal edilebilirlik | Fast 4G'de menüye ≤ 8 sn; sonraki açılış ≤ 2 sn |
| A3 | Ana menü | 2 | Canlı sahne, müzik, odak sırası, "herhangi bir tuşa bas" ekranı | Açılışta stüdyo logosu → başlık → menü; menü müziği; klavye/gamepad ile tam gezilebilir |
| A4 | Brifing ve zorluk seçimi | 2 | Kontrollerin öğretimi, zorlukların anlaşılırlığı | Her zorluğun farkı tek cümlede ve sayılarla tutarlı |
| A5 | Duraklatma | 2 | Esc, odak kaybı, sekme gizleme, gamepad Start | Pencere odağı kaybolunca otomatik duraklatma; 0 zamanlayıcı kayması |
| A6 | Ayarlar | 3 | Ses kategorileri, grafik, kamera, kontroller, erişilebilirlik | Steam oyunu standardı: 5 sekme (Görüntü, Ses, Kontrol, Oynanış, Erişilebilirlik) |
| A7 | Karakter arşivi | 1 | 360° modeller, bilgi kartları, lore | Her karakterde lore paragrafı, saldırı listesi, açılma koşulu |
| A8 | Sonuç ve final | 2 | Zafer/yenilgi, özet, künye, "Devam edecek" | Rütbe (S/A/B), istatistik, kişisel rekor, kaydırmalı künye |
| A9 | Her buton ve kısayol | 3 | Tüm düğmeler, Esc/Z/X/Ö/Ç/R/L tek tek | %100 düğme çalışır; hiçbir düğme ölü/yanıltıcı değil |

### B · 2D tasarım sistemi

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| B10 | Tasarım token'ları | 2 | Renk, boşluk, köşe, gölge, z-index değişkenleri | Tüm renkler/boşluklar `:root` token'larından; sihirli sayı yok |
| B11 | Tipografi | 2 | Başlık/gövde fontları, Türkçe karakterler, ölçek | 1080p'de en küçük metin ≥ 14 px; 4K'da ölçekli; İ/ı/Ş/Ğ doğru |
| B12 | Renk ve kontrast | 2 | WCAG AA, biyom vurgu renkleriyle çakışma | Tüm UI metni ≥ 4.5:1 her biyom arka planında |
| B13 | Hareket ve mikro etkileşim | 2 | Hover, odak, basma, ekran geçişleri | Her etkileşimli öğede 3 durum (hover/focus/active) + ses |
| B14 | Marka | 1 | Logo, MerbutMark, favicon, stüdyo imzası | Tutarlı logo kilidi; açılışta stüdyo kartı |
| B15 | Ekran kompozisyonu | 3 | HUD'un oyun alanını kapatması, güvenli alan | Savaş alanının ≥ %85'i HUD'suz; boss hiçbir zaman HUD arkasında kalmaz |
| B16 | Premium cila listesi | 2 | Aşağıdaki 12 madde | 12/12 |

**B16 premium cila listesi:** (1) sayfa geçişlerinde sinematik kararma, (2) düğmelerde ses + titreşim, (3) odak halkası stilize, (4) yüklemede ipucu/lore döngüsü, (5) sayıların animasyonlu artışı (skor), (6) boss adı "başlık kartı", (7) duraklatmada arka plan bulanıklığı, (8) imleç oyun sırasında gizli, (9) tam ekran düğmesi, (10) kontrol ipuçları giriş cihazına göre değişir, (11) hata ekranı bile temalı, (12) telif bandı yalnızca menüde.

### C · Cihaz, giriş ve erişilebilirlik

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| C17 | Çözünürlük matrisi | 2 | 5 çözünürlük, 21:9 | Hiçbir çözünürlükte kırpılan UI/boş şerit yok |
| C18 | Tarayıcı matrisi | 2 | 4 tarayıcı | 4/4 tarayıcıda tam oynanış, konsol hatası 0 |
| C19 | Klavye düzeni | 2 | TR-Q, TR-F, US | Tuş etiketleri `navigator.keyboard.getLayoutMap()` ile gerçek düzeni gösterir |
| C20 | Gamepad | 3 | Gamepad API, 2 kol, Xbox/PS ikonları, titreşim | 2 gamepad ile tak-çalıştır; menüler kolla gezilir |
| C21 | Tuş atama | 2 | Yeniden atama, tek klavyede ghosting | Her eylem yeniden atanabilir; çakışma uyarısı |
| C22 | Erişilebilirlik | 2 | Renk körlüğü, flaş azaltma, sarsıntı, metin boyutu, `prefers-reduced-motion` | 5 erişilebilirlik ayarı; fotosensitif uyarı ekranı |

### D · Performans

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| D23 | İndirme bütçesi | 3 | JS, GLB, görsel, kullanılmayan varlık | İlk oynanış ≤ 12 MB; toplam ≤ 20 MB; kullanılmayan varlık 0 |
| D24 | Aşamalı yükleme | 2 | Tüm varlıklar baştan mı? | Menü ≤ 4 MB ile açılır; biyomlar arka planda akışla yüklenir |
| D25 | FPS | 3 | Biyom, kalabalık, boss | Orta sınıf GPU'da Yüksek profilde 60 fps, p95 ≤ 20 ms |
| D26 | Adaptif grafik | 2 | Tier seçimi, DPR tabanı | Entegre GPU'da DPR ≥ 0.8; bulanıklık yok |
| D27 | Bellek ve GPU | 2 | Dispose, doku boyutları, draw call | 20 dk oyunda bellek artışı ≤ %10; draw call ≤ 250 |
| D28 | Arka plan davranışı | 1 | Sekme gizli, pil | Gizli sekmede CPU ~%0; tüm döngüler durur |

### E · Mimari ve KISS

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| E29 | Tek oyun saati | 3 | `performance.now()` + duraklatmada zaman kaydırma | Tek `simTime`; duraklatma = adım atmamak; kaydırma kodu 0 satır |
| E30 | Tek simülasyon döngüsü | 3 | Interval + useFrame + sabit adım + HUD interval | Tek sabit adım (60 Hz); render yalnızca okur |
| E31 | Simülasyon/render ayrımı | 3 | Oyun kuralları React bileşeni içinde mi? | `src/sim/` saf TS; React/Three'siz birim testlenebilir |
| E32 | Durum yönetimi | 2 | Store boyutu, her tick'te kopyalama | Store'lar ≤ 250 satır; sıcak döngüde gereksiz kopya yok |
| E33 | Veri odaklı içerik | 3 | Biyom/dalga/düşman/boss tanımları | Yeni biyom = 1 veri dosyası + varlıklar; kod değişikliği 0 |
| E34 | Tekrar eden kod | 2 | Sabit isimler, faz listeleri | Her bilgi tek kaynaktan (DRY); faz grupları tek sabitte |
| E35 | Bileşen boyutu | 2 | 500+ satırlık dosyalar | Hiçbir dosya > 400 satır; tek sorumluluk |
| E36 | CSS mimarisi | 2 | Tek dev CSS dosyası | Bileşen başına CSS modülü + token dosyası |
| E37 | Ölü kod ve kalıntı | 1 | Şablon dosyaları, kullanılmayan varlıklar | 0 kullanılmayan dosya (knip/benzeri ile doğrulanır) |
| E38 | Tip ve lint | 2 | tsc, oxlint | 0 hata, 0 uyarı, `any` yok (korunmalı) |
| E39 | Rastgelelik | 1 | `Math.random` kullanımı | Tohumlu RNG; aynı tohum = aynı koşu (hata ayıklama/replay) |

### F · Veri ve içerik doğruluğu

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| F40 | Zorluk tablosu | 2 | Kademeler arası tutarlılık | Her kademe bir öncekinden ölçülebilir şekilde zor |
| F41 | Düşman kimliği | 2 | İsim ↔ tür ↔ davranış | Her tür tek isim, tek renk, tek siluet; HUD'da tanınır |
| F42 | Belgeler | 1 | README ↔ kod | README'deki her sayı kodla aynı |
| F43 | İlerleme kaydı | 3 | Kayıt, kontrol noktası, istatistik | Devam et, bölüm seçimi, kişisel rekorlar, başarımlar |
| F44 | 3D model hattı | 2 | Meshopt/Draco, KTX2, LOD | Tüm GLB'ler sıkıştırılmış; doku ≤ 2K; script ile tekrarlanabilir |

### G · Hukuk, telif ve hassas temalar

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| G45 🔒 | Karakter/marka IP'si | 3 | Samuray Jack, Aku, Evil Jack | Yazılı lisans **veya** özgün karakterlere geçiş |
| G46 🔒 | Müzik lisansı | 3 | YouTube'daki hayran yüklemesi | Lisanslı/özgün müzik, yerel ses dosyası |
| G47 | Görsel kaynaklar | 2 | Arka planlar, GLB'ler (Meshy vb.) | Her varlığın kaynağı ve lisansı `docs/CREDITS.md` içinde |
| G48 🔒 | Dini temsil | 3 | Hz. Ali, Zemzem, dua | Danışman görüşü; hassasiyet notu; topluluk geri bildirimi |
| G49 | Üçüncü taraf markalar | 1 | "Dark Souls" ifadesi | Marka adı kullanılmaz ("Acımasız" vb.) |
| G50 | Gizlilik | 2 | YouTube çerezleri, localStorage, KVKK | youtube-nocookie veya yerel ses; aydınlatma metni |

### H · Altyapı

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| H51 | Yayın | 2 | Vercel, önbellek başlıkları | Hash'li dosyalar immutable; GLB/görsel doğru önbellek |
| H52 | CI | 3 | GitHub Actions | Her PR'da typecheck + lint + test + build + e2e duman testi |
| H53 | E2E ve görsel regresyon | 2 | 11 spec | Her biyom ve boss için görsel referans karesi |
| H54 | Hata izleme | 2 | ErrorBoundary, WebGL context lost | Temalı hata ekranı + context lost kurtarma + hata günlüğü |
| H55 | Sürümleme | 1 | check-version-sync, CHANGELOG | Her sürümde oyuncuya dönük "Yama notları" |
| H56 | Depo hijyeni | 1 | Kökteki log/artefakt klasörleri | Kök dizinde yalnızca proje dosyaları |

### I · Web yayın olgunluğu

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| I57 | Paylaşım önizlemesi | 1 | OG/Twitter kartı | 1200×630 temalı kapak görseli |
| I58 | Tam ekran deneyimi | 2 | Fullscreen API, imleç gizleme | "Oyna" tam ekrana geçer; oyun sırasında imleç gizli |
| I59 | Lighthouse ve meta | 1 | Performans, erişilebilirlik, SEO | Menü sayfası Lighthouse ≥ 90 (erişilebilirlik) |

### K · 3D görsel kalite

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| K60 | Işık ve ton eşleme | 3 | ACES, pozlama, biyom ışığı, rim light | Karakterler her biyomda arka plandan ayrışır (rim light) |
| K61 | Malzemeler | 2 | Karakter, zemin, dekor | Zemin ve dekor, arka planın boya stiliyle aynı dili konuşur |
| K62 | Gölge ve temas | 2 | Dinamik gölge, contact shadow | Her aktör zemine basıyor; havada süzülme 0 |
| K63 | Post-process | 3 | Bloom, vinyet, renk derecelendirme dövüşte | Dövüşte de hafif bloom + renk derecelendirme (Orta ve üstü) |
| K64 | VFX | 3 | Kılıç izi, vuruş, alev topu, kalkan, meteor, portal | Her saldırının kendine özgü, 0,2 sn'de okunur VFX'i |
| K65 | Atmosfer parçacıkları | 2 | 7 hava tipi | Her biyomda hava ön planda da (kameraya yakın) görünür |
| K66 | 2D–3D uyumu | 3 | Boyalı arka plan ↔ flat 3D ön plan | Stil çatışması yok; ön plan dekorları arka planla aynı palet ve kontur |
| K67 | Ölçek ve siluet | 2 | Oranlar, üst üste binme | Her karakter siyah siluetle bile tanınır; üst üste binme ≤ %20 |
| K68 | Görsel hatalar | 3 | Siyah bar, kenar sızması, clipping, z-fighting | 0 bilinen görsel hata |

### L · Dünya ve seviye tasarımı

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| L69 | Biyom kimliği | 3 | Renk + şekil + ses + mekanik | 3.6'daki tanınırlık testi 7/7 |
| L70 | Katmanlı parallax | 3 | Ön/orta/arka/gökyüzü | En az 4 katman; ön plan siluetleri kameraya en yakın |
| L71 | Zemin | 2 | Doku, decal, ayak izi, ıslaklık | Biyom başına özgün zemin + etkileşim izi |
| L72 | Biyom geçiş kapıları | 2 | Tema uyumu, açılma anı | Her kapı biyoma özgü ve açılışı bir mini sinematik |
| L73 | Set-piece ve etkileşimli dekor | 3 | Kırılabilir, tuzak, platform | Biyom başına ≥ 1 set-piece + ≥ 2 etkileşimli dekor |
| L74 | Kamera kompozisyonu | 2 | İki oyuncuyu çerçeveleme, boss kadrajı | Boss savaşında kamera geri çekilir; boss daima kadrajda |
| L75 | Çevresel anlatı | 1 | Arka planda hikâye izleri | Biyom başına ≥ 1 gizli lore nesnesi |

### M · Oyun tasarımı

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| M76 | Temel döngü | 3 | Yürü → dalga → temizle → kapı | Her biyomda döngüyü kıran en az 1 farklı hedef (koru, kaç, yok et) |
| M77 | Düşman çeşitliliği | 3 | Tür sayısı, davranış, biyoma özgüllük | ≥ 8 davranış; her biyomda ≥ 1 yeni düşman/varyant |
| M78 | Dalga koreografisi | 2 | Yoğunluk eğrisi, giriş anları | Her dalga sahneye "giriş animasyonuyla" gelir; tempo eğrisi çizilmiş |
| M79 | Boss tasarımı | 3 | Telegraph, fazlar, öğrenilebilirlik | Her saldırı ≥ 0,5 sn önceden okunur; 3 faz; ölüm "benim hatam" hissi |
| M80 | Co-op sinerjisi | 3 | Ortak saldırı, canlandırma | Ortak kombo/yetenek + düşen arkadaşı canlandırma |
| M81 | Yetenek ve gelişim | 2 | R/L yetenekleri, yükseltme | Biyom sonu yükseltme seçimi (3 seçenekten 1) |
| M82 | Öğretici ve zorluk eğrisi | 3 | Tutorial, ilk biyom | İlk biyom öğretici dalga; kontroller oynarken öğretilir |
| M83 | Tekrar oynanabilirlik | 2 | Rütbe, meydan okuma, açılabilir | Rütbe sistemi + en az 5 açılabilir öğe (kostüm, zorluk, mod) |

### N · Ses ve müzik

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| N84 🔒 | Müzik kaynağı | 3 | YouTube iframe | Yerel, lisanslı, döngü noktası temiz müzik dosyaları |
| N85 | Dinamik müzik | 3 | Biyom, dövüş, boss katmanları | Biyom başına tema + dövüş katmanı + 2 boss teması |
| N86 | SFX kalitesi | 3 | Osilatör sentezi | Katmanlı örnek tabanlı SFX (swish + impact + tail), varyasyonlu |
| N87 | Miks | 2 | Kategoriler, ducking, limiter | Müzik/SFX/ses/ortam ayrı kanallar; vuruşta müzik ducking |
| N88 | Ortam ve yönlü ses | 2 | Biyom ambiyansı, stereo | Biyom başına ortam döngüsü; tüm SFX stereo konumlu |

### O · Kontrol ve oyun hissi

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| O89 | Giriş gecikmesi | 3 | Tuş → ekran | ≤ 1 kare (16,7 ms) tepki; giriş tamponu ≥ 120 ms |
| O90 | Vuruş hissi | 3 | Hitstop, knockback, flaş, ses/VFX eşzamanı | Hitstop 50–90 ms, beyaz flaş, geri itme, kamera darbesi |
| O91 | Hasar okunurluğu | 3 | Telegraph, dokunulmazlık kareleri | Her düşman saldırısı görsel + sesli uyarılı |
| O92 | Hareket | 2 | Dash/kaçınma, zıplama | Kaçınma (dash) + i-frame; hava saldırısı |
| O93 | Kamera | 2 | İki oyuncu çerçevesi, zoom, sarsıntı | Dinamik zoom; sarsıntı ayarlanabilir |
| O94 | Animasyon | 2 | Geçişler, iptal pencereleri, isabet tepkisi | Her düşmanda isabet tepkisi (hit react) animasyonu |

### P · Oyun içi arayüz

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| P95 | HUD yoğunluğu | 3 | Panel sayısı | En fazla 4 HUD öğesi (2 oyuncu, boss barı, hedef) |
| P96 | Can ve yetenek okunurluğu | 2 | Barlar, dünya içi göstergeler | Can değişimi "gecikmeli beyaz bar" efektiyle |
| P97 | Olay akışı | 1 | Metin feed'i | Metin yerine ikon + kısa ifade; oyun sırasında okuma gerekmez |
| P98 | Boss arayüzü | 2 | Boss barı, faz işaretleri | Faz çentikleri + boss başlık kartı |
| P99 | Bildirimler | 2 | Biyom başlığı, portal uyarısı, "Birlikte kalın" | Tek bildirim kuyruğu; üst üste binme 0 |

### R · Anlatı ve dramaturji

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| R100 | Hikâye çerçevesi | 2 | Neden iki kahraman, neden bu yolculuk? | 30 sn'lik açılış sinematiği/karakter kartları |
| R101 | Sinematikler | 2 | Boss girişleri, dua, portal | Her sinematik atlanabilir ve müzikle zamanlanmış |
| R102 | Karakter kimliği | 2 | Ses, replik, zafer pozu | Her kahramana özgü seslendirme/efor sesi ve zafer pozu |
| R103 | Final ve künye | 1 | "Devam edecek", künye | Sonrası: istatistik + künye + bir sonraki hikâyeye kanca |

### S · Co-op ve sosyal

| No | Kategori | A | Kontrol maddeleri | 9.8 çıtası |
|---|---|---|---|---|
| S104 | Birlikte oynama | 3 | "Birlikte kalın" sınırı, kamera | Mesafe sınırı sert duvar değil, esnek ip hissi |
| S105 | Tek oyunculu mod | 2 | Tek kişi ne yapar? | Tek oyuncu + yapay zekâ yoldaş **veya** karakter değiştirme |
| S106 | Paylaşılabilir anlar | 1 | Fotoğraf modu, skor kartı | Fotoğraf modu + koşu sonu paylaşılabilir kart |

### W · Biyom ve boss karneleri

Her biyom **12 kriterde** ayrı puanlanır: (1) ilk kare kompozisyonu, (2) renk paleti, (3) parallax derinliği, (4) zemin, (5) hava/atmosfer, (6) ışık, (7) imza mekanik, (8) set-piece, (9) düşman seçimi, (10) müzik ve ortam sesi, (11) giriş/çıkış anı (kapı), (12) gizli detay.

| No | Karne |
|---|---|
| W107 | 1 · Aku Metropolü (kıvılcım) |
| W108 | 2 · Günbatımı Limanı (yağmur) |
| W109 | 3 · Altın Bataklık (ateş böcekleri · Boss 1) |
| W110 | 4 · Kafatası Adası (kül) |
| W111 | 5 · Yeşim Harabeleri (sis) |
| W112 | 6 · Sessiz Kemik Ovası (kar) |
| W113 | 7 · Alev Tahtı (ateş fırtınası · Final boss) |
| W114 | Boss 1 · Aku'nun Gölgesi — telegraph, faz, arena, müzik, sinematik, ödül |
| W115 | Boss 2 · Aku, Zamanın Efendisi — aynı 6 kriter + form geçişi + zaman portalı |

---

## 5. Rapor formatı

Her kategori için:

```
### <No> <Kategori> — Puan: x.x / 10 (Ağırlık A)
Kanıt: <dosya:satır | ekran görüntüsü | ölçüm>
Durum: <1–3 cümle>
Sorunlar: <madde madde, Önem etiketiyle>
Öneri (KISS): <en basit çözüm>
Efor: S/M/L · Etki: <oyuncunun hissedeceği>
9.8 için kalan: <somut adımlar>
```

Rapor sonunda: genel skor, grup skorları tablosu, en yüksek etki/efor oranlı 10 iş ("hızlı kazanımlar"), 🔒 kararlar listesi.

---

## 6. Faz planı (onay kapılı)

Her faz sonunda: **(a) durum özeti, (b) kullanıcının yapması gerekenler, (c) "devam edeyim mi?" onayı.**

İşaretler: ☑ tamamlandı · ◐ kısmen (eksikler 12. bölümde) · 🔒 kullanıcı kararı bekliyor.

- ◐ **FAZ 0 — Envanter ve ölçüm:** Varlık envanteri (boyut/kullanım), fps tabanı (7 biyom × 4 profil), ilk karne (tüm kategoriler).
- ☑ **FAZ 1 — Kritik hatalar:** Görsel hatalar (K68), odak kaybında duraklatma (A5), zorluk tablosu (F40), README (F42), ilk 15 sn hasar (A1).
- 🔒 **FAZ 2 — Hukuk kararları 🔒:** G45, G46, G48 için kullanıcı kararı. Karar gelmeden FAZ 8 başlamaz.
- ☑ **FAZ 3 — Çekirdek mimari (KISS):** Tek oyun saati, `src/sim/` saf simülasyon, olay veriyolu (event bus), veri odaklı biyom/dalga tanımı.
- ◐ **FAZ 4 — Performans ve varlık hattı:** Meshopt + KTX2, AVIF/WebP, biyom bazlı akışlı yükleme, kullanılmayan varlıkların silinmesi.
- ☑ **FAZ 5 — Oyun hissi:** Hitstop, knockback, dash, telegraph, düşman ayrışması (separation) ve derinlik şeritleri.
- ☑ **FAZ 6 — Giriş ve erişilebilirlik:** Gamepad, tuş atama, düzen algılama, 5 erişilebilirlik ayarı, tam ekran.
- ☑ **FAZ 7 — 2D tasarım sistemi ve HUD:** Token'lar, CSS bölme, HUD'u 4 öğeye indirme, telif bandını menüye taşıma.
- ◐ **FAZ 8 — Ses ve müzik:** Yerel müzik, biyom/boss temaları, örnek tabanlı SFX, miks kanalları.
- ☑ **FAZ 9 — Dünya altyapısı:** 4 katmanlı parallax, biyom zemini, temalı kapılar, set-piece sistemi (tüm biyomlar için ortak).
- ☑ **FAZ 10 — Biyom paketleri:** 1'den 7'ye sırayla; her biyom ayrı onay.
- ☑ **FAZ 11 — Boss, anlatı ve meta ilerleme:** Boss fazları, açılış sinematiği, kayıt, bölüm seçimi, rütbe, başarımlar.
- ◐ **FAZ 12 — Altyapı ve son denetim:** CI, hata izleme, OG, tüm kategoriler ≥ 9.8 (🔒 olanlar hariç, gerekçeli).

---

## 7. Kurallar (ajan için)

1. Denetim fazında kaynak koda dokunma; yalnızca `docs/` altına rapor yaz.
2. Commit etme; kullanıcı isterse et.
3. Her ekran görüntüsünü `e2e-artifacts/audit/<faz>/` altına kaydet ve rapordan bağla.
4. Bir öneri yeni bir kütüphane gerektiriyorsa: boyutunu (KB), alternatifini ve "kütüphanesiz en basit çözümü" yaz.
5. Oyuncu hissine dair her iddiayı ya ölçümle ya da kısa bir video/GIF ile kanıtla.
6. Dini ve kültürel içerikte yargılayıcı değil, risk-odaklı ve saygılı dil kullan.

---

## 8. Güçlü yanlar (korunmalı)

- `tsc` ve `oxlint` temiz; 24 dosyada 105 birim testi ve 11 E2E spec'i var.
- Adaptif performans yöneticisi (DPR + kalite katsayısı + kademe), instanced can barları, kalabalık proxy'leri: web için ileri seviye.
- Boss'lar zengin: Aku'nun 8 özel saldırısı, histerezisli form geçişi, zaman portalı pususu.
- Tutarlı Türkçe ton: "Zaman dondu" duraklatma ekranı, "Yedi Diyar · Tek Kader".
- Menüde canlı savaş sahnesi ve 360° karakter arşivi.
- Arka plan resimleri güçlü; **Alev Tahtı** ve **Altın Bataklık** en etkileyici kareler.
- Hz. Ali'nin yüzünün ışıkla örtülmesi (`AliFaceLight`): geleneksel tasvir hassasiyetine uygun, düşünülmüş bir tercih.

---

## 9. Ön analizden bilinen bulgular (25 Eylül 2026)

Kanıtlar: yerel oynanış testi (1280×720, Yüksek ve Otomatik profil), kod incelemesi, `typecheck/lint/test` çıktıları.

| # | Önem | Bulgu | Kanıt | Kategori |
|---|---|---|---|---|
| 1 | Kritik | Düşman can barlarının dolgusu **siyah** görünüyor. `vertexColors: true`, ama `PlaneGeometry`'de `color` niteliği yok. WebGL bu durumda siyah (0,0,0) kullanır. Renk zaten `instanceColor` ile geliyor. | `src/game/EnemyHealthBars.tsx:21` + her biyomda ekran görüntüsü | K68 |
| 2 | Yüksek | Aynı `vertexColors` kalıbı 6 malzemede daha var. Her birinde geometride renk niteliği olup olmadığı kontrol edilmeli. | `BiomeAtmosphere.tsx:58`, `CombatImpactVisual.tsx:27`, `CrowdEnemyProxies.tsx:43-45`, `Ground.tsx:147-148` | K68 |
| 3 | Yüksek | Hasar oyunun **8. saniyesinde** başlıyor. Test ettiğim ilk 20 saniyede (Orta zorluk, hareketsiz kalırken) iki oyuncu da birer can kaybetti. Öğretici bir bölüm yok. | Oynanış testi | A1, M82 |
| 4 | Yüksek | Karakterler ve düşmanlar üst üste biniyor. Herkes tek z=0 hattında duruyor ve düşmanlar arasında ayrışma kuvveti yok. Aynı x'e yığılan düşmanlar ölçüldü (4.2/4.2 ve 11.4/11.4). | `GameDirector.tsx:495-509` | K67, O91 |
| 5 | Yüksek | HUD'da 7 panel ve kalıcı telif bandı var; bant oyun sırasında ekranın yaklaşık %6'sını kaplıyor. Final boss sağ alttaki oyuncu kartının arkasında kalıyor. | `App.tsx:76-83`, `GameHud.tsx` | P95, B15 |
| 6 | Yüksek | Post-process ve dinamik gölge **dövüş sırasında kapalı**. Bu yüzden menü, oyunun kendisinden daha "premium" görünüyor. | `GameScene.tsx:235-238` (`!showCombatActors`) | K63 |
| 7 | Yüksek | Otomatik grafik profili zayıf GPU'da `minimal` kademeye ve DPR 0.57'ye düşüyor; görüntü belirgin şekilde bulanıklaşıyor. | Tarayıcı paneli ölçümü | D26 |
| 8 | Yüksek | Oyun yalnızca Esc ile duruyor; pencere odağı kaybolunca duraklamıyor. Sekme gizlenince `SessionController`'ın interval'i çalışmaya devam ediyor ama `GameDirector` duruyor. Sonuç yarı donuk bir durum. | `SessionController.tsx:14-44` | A5, D28 |
| 9 | Yüksek | 4 ayrı saat/döngü var: 50 ms interval (tick), 30 Hz useFrame (dövüş), 60 Hz sabit adım (hareket), 100 ms interval (HUD'un tamamının yeniden çizimi). | `SessionController.tsx:15`, `GameDirector.tsx:24`, `gameConfig.ts:25`, `GameHud.tsx:57` | E30 |
| 10 | Orta | Duraklatma, tüm zaman damgalarını tek tek kaydırarak çalışıyor. Yeni eklenen her zamanlayıcı alanı unutulursa hata doğar. Tek bir oyun saatiyle bu koda hiç gerek kalmaz. | `sessionStore.ts:196-216` | E29 |
| 11 | Orta | Ses olayları, durum farkından tahmin ediliyor (örneğin pickup sayısı azaldıysa "heal" çalınıyor). Bu yaklaşım kırılgan; bir olay veriyolu gerekli. | `AudioDirector.tsx:41-82` | E31, N87 |
| 12 | Orta | Oyun kuralları (616 satır) bir React bileşeninin `useFrame` döngüsünde çalışıyor. Bu kod render'dan bağımsız test edilemiyor. | `GameDirector.tsx` | E31 |
| 13 | Orta | Karakter adları en az 5 yerde elle yazılmış; `CHARACTERS.displayName` kullanılmıyor. | `sessionStore.ts:396,418,442,501` | E34 |
| 14 | Orta | Zorluk tablosunda Orta ile Zor aynı can, yaşam ve hasar değerlerine sahip. Souls Like 6 yaşamla Kolay'dan (5) bile fazla yaşam veriyor. | `difficulty.ts:35-65` | F40 |
| 15 | Orta | Düşman adları türden bağımsız, rastgele seçiliyor. Oyuncu hangi adın hangi davranışa ait olduğunu öğrenemiyor. | `GameDirector.tsx:65` | F41 |
| 16 | Orta | Dalgalar modülo formülüyle üretiliyor: her biyomda 2 dalga var ve 5 tür döngüsel olarak tekrar ediyor. Hiçbir biyomun kendine özgü düşmanı yok. | `waves.ts:64-83` | M77, E33 |
| 17 | Düşük | README "120 Hz" diyor, kodda değer `1/60`. | `README.md:55`, `gameConfig.ts:25` | F42 |
| 18 | Düşük | Aynı faz kontrolü art arda iki kez yapılıyor. | `GameDirector.tsx:420-421` | E37 |
| 19 | Kritik 🔒 | Müzik tek bir parça: bir hayran kanalının YouTube yüklemesi ("James L. Venable – Samurai Jack and the Rave (full extended version)", yükleyen: Shaya Fury). Gömme kapatılabilir, reklam çıkabilir ve telif riski taşıyor. Biyom ve boss müziği yok. | `AudioSettingsPanel.tsx:9-10` | N84, G46 |
| 20 | Yüksek | Ses efektlerinin tamamı osilatör sentezi. Ortaya çıkan "retro bip" hissi AAA hissini düşürüyor. | `gameAudio.ts` | N86 |
| 21 | Kritik 🔒 | Samuray Jack, Aku ve Evil Jack'in IP sahibi Cartoon Network / Warner Bros. Discovery. Proje Vercel'de herkese açık yayında. | `.vercel/project.json`, karakter varlıkları | G45 |
| 22 | Yüksek 🔒 | Dini temsil: Hz. Ali oynanabilir bir savaşçı, Zemzem iyileştirme eşyası ve bir "dua" mekaniği var. Tasvir özenli, ama herkese açık yayında topluluk hassasiyeti değerlendirilmeli. | `AliCharacter.tsx`, `ZemzemPickups.tsx` | G48 |
| 23 | Düşük | Zorluk açıklamasında "Dark Souls" markası geçiyor. | `difficulty.ts:64` | G49 |
| 24 | Orta | Kullanılmayan varlıklar dist'e kopyalanıyor: `scene-01-hd.png` (1,78 MB) ve 6 küçük JPG (yaklaşık 0,64 MB). `src/assets/hero.png`, `react.svg` ve `vite.svg` Vite şablonundan kalma. | `public/assets/backgrounds`, `src/assets` | E37, D23 |
| 25 | Orta | Açılışta her şey birden yükleniyor: 60'tan fazla GLB (19 MB) ve 7 arka plan. Zaman aşımı 170 sn. Ana JS 1,4 MB ve `chunkSizeWarningLimit` 1500'e çekilerek uyarı susturulmuş. | `LoadingScreen.tsx:7`, `vite.config.ts:13` | D23, D24 |
| 26 | Yüksek | Arka plan tek bir DOM katmanı; parallax derinliği yok. Biyom sınırında önceki biyomun görseli kenardan sızıyor. Görseller JPG (AVIF/WebP yok). | `Background.tsx`, ekran görüntüleri | L70, D23 |
| 27 | Yüksek | Biyom kapıları ilkel dikenli duvarlar, zemin ise düz koyu karolar. Boyalı arka planla stil çatışması var. | `BiomeLockGates.tsx`, `Ground.tsx` | L71, L72, K66 |
| 28 | Yüksek | Gamepad desteği ve tuş atama yok. Ö/Ç etiketleri TR-Q düzenine sabit (`Comma`/`Period`); US klavyede yanlış görünüyor. | `gameConfig.ts:64-65` | C19–C21 |
| 29 | Yüksek | Meta ilerleme yok: kayıt, devam et, bölüm seçimi, başarım, istatistik. Yalnızca ses ve grafik ayarları kalıcı. | Store'lar | F43, M83 |
| 30 | Orta | CI yok (`.github` klasörü bulunmuyor). Vitest süresi 44 sn ve bunun büyük kısmı jsdom kurulumu. | `npm run test` çıktısı | H52 |
| 31 | Düşük | Kök dizinde 6 log dosyası (~210 KB) ile `e2e-artifacts/` ve `test-results/` klasörleri var. | Kök dizin | H56 |
| 32 | Orta | Tüm stiller tek bir 1.488 satırlık CSS dosyasında. | `src/app/app.css` | B10, E36 |

---

## 10. Hedef mimari (KISS önerisi)

```
src/
  sim/            ← saf TypeScript, React/Three yok
    clock.ts        tek simTime; pause = step çağırmamak
    rng.ts          tohumlu RNG
    step.ts         step(state, input, dt=1/60) → { state, events[] }
    combat.ts, enemies.ts, bosses/shadow.ts, bosses/aku.ts
  content/        ← yalnızca veri
    biomes/01-aku-metropolu.ts … 07-alev-tahti.ts   (görsel, müzik, dalgalar, mekanik, set-piece)
    enemies.ts, difficulty.ts
  events/         ← tek olay veriyolu: hit, kill, pickup, biomeEnter, bossPhase…
  render/         ← R3F bileşenleri yalnızca sim durumunu okur
  audio/          ← olaylara abone olur (durum farkı tahmini yok)
  ui/             ← HUD, menüler; bileşen başına CSS modülü + tokens.css
```

Kazanımlar: 4 döngü yerine 1 döngü, zaman kaydırma kodunun tamamen kalkması, simülasyonun tarayıcısız birim testi, tohumla tekrar oynatılabilir hata raporları, yeni biyomun tek veri dosyasıyla eklenmesi.

---

## 11. Biyom geliştirme vizyonu — "Yedi Diyar"

### 11.1 Tüm biyomlar için ortak altyapı (bir kez yapılır, 7 kez kullanılır)

- **4 katmanlı parallax:** Kameraya en yakın bulanık ön plan siluetleri (dal, zincir, kemik), orta planda 3D dekor, arkada boyalı görsel, en arkada gökyüzü/ışık katmanı.
- **Biyom paketi (veri dosyası):** palet, ışık, zemin materyali, hava, müzik teması, ortam sesi, düşman seçimi, imza mekanik, set-piece, gizli nesne.
- **Başlık kartı:** Biyoma girişte 2 sn'lik, müzikle vurgulanan, kaligrafik başlık kartı. Stil tamamen özgün olmalı; herhangi bir dizinin başlık kartını kopyalamamalı.
- **Temalı kapı:** Biyom temizlenince kapı bir mini sinematikle açılır: kamera 0,8 sn kapıya kayar ve ses vurgusu gelir.
- **İmza mekanik:** Her biyom oyuncuya bir yeni şey öğretir ve sonraki biyomda o şeyi tekrar kullanmaz.
- **Zemin etkileşimi:** Ayak izi, sıçrayan su, kıvılcım ve toz gibi izler, düşen düşmanların bıraktığı decal'ler.
- **Müzik katmanları:** Keşif katmanı, dövüş katmanı (dalga başlayınca açılır) ve zafer vurgusu (dalga bitince).

### 11.2 Biyom biyom öneriler

**1 · Aku Metropolü — "Neon altında ilk adım" (öğretici biyom)**
- *İmza mekanik:* Neon tabelalar kırılabilir. Kırılan tabela yere elektrik dalgası yayar ve düşmanları sersemletir. Oyuncu burada **ortamı silah olarak kullanmayı** öğrenir.
- *Set-piece:* Arka plandaki dev heykelin gözleri oyuncuları izler. Son dalga bitince gözler söner ve kapı açılır.
- *Atmosfer:* Islak, yansıtıcı zemin (neon yansımaları), kıvılcım yağmuru, uzaktan siren ve sentezleyici bas.
- *Öğretici dalga:* İlk düşmanlar 3 sn boyunca telegraph gösterir; kontrol ipuçları dünyanın içinde, tabelalarda görünür.

**2 · Günbatımı Limanı — "Dalga ve şimşek"**
- *İmza mekanik:* Periyodik olarak iskeleye dalga vurur ve zemini süpürür; zıplayan kaçar, düşmanlar geri itilir. **Zamanlama** öğretilir.
- *Set-piece:* Şimşek çaktığında sahne 0,2 sn tamamen siluete döner ve bir sonraki dalganın yerini gösterir.
- *Atmosfer:* Yağmur perdesi (ön planda da), ıslak zemin, martı, halat gıcırtısı, devrilen direkten oluşan köprü.
- *Gizli:* Kırılabilir sandıkta nadir Zemzem.

**3 · Altın Bataklık — "Yansımanı oku" (Boss 1: Aku'nun Gölgesi)**
- *İmza mekanik:* Sığ su yürüyüşü yavaşlatır, ateş böcekleri karanlık bölgeleri aydınlatır. Oyuncu **ışığa göre konumlanmayı** öğrenir.
- *Boss arenası:* Gölge sisin içinde kaybolur; yalnızca sudaki yansıması görünür ve saldırı yönünü yansıma haber verir (telegraph). Boss 3 fazlı: kılıç, meteor, sis dansı.
- *Atmosfer:* Altın ışık huzmeleri (god rays), kurbağa korosu, suda halkalar.
- *Mor Zemzem ritüeli* boss öncesi kısa bir sinematik olur: kamera iki kahramanın yüzüne yaklaşır.

**4 · Kafatası Adası — "Yer ayağının altından kayıyor"**
- *İmza mekanik:* Kül yağmurunun ardından zeminde kırmızı çatlaklar belirir (1 sn telegraph) ve lav fışkırır. **Zemin okuma** öğretilir.
- *Set-piece:* Dev kafatasının ağzından geçiş: çene zamanlamayla açılıp kapanır, kamera yaklaşır, ses boğuklaşır.
- *Atmosfer:* Zehirli yeşil sis; Zemzem içilen yerde sis bir süre dağılır.

**5 · Yeşim Harabeleri — "İki çan, iki kahraman" (co-op biyomu)**
- *İmza mekanik:* İki kadim çan var. İki oyuncu aynı anda vurunca sis dağılır ve hayalet savaşçılar görünür hâle gelir. **Birlikte hareket etmek** öğretilir.
- *Yeşim kristalleri:* Vurulunca ışık patlaması yapar ve yakındaki düşmanları sersemletir.
- *Atmosfer:* Dökülen yapraklar, yosunlu taşlar, uzaktan flüt, yavaş sis katmanları.
- *Gizli:* Duvar yazıtı, karakter arşivinde bir lore kartı açar.

**6 · Sessiz Kemik Ovası — "Sessizlik de bir düşman"**
- *İmza mekanik:* Kar fırtınası dalgaları görüşü daraltır; düşmanlar kardan çıkar ve telegraph olarak önce kar kabarır. Buz zeminde kayma olur. **Ses ve işaretle savaşmak** öğretilir.
- *Set-piece:* Müzik tamamen düşer, yalnızca rüzgâr kalır. Sonra dev iskelet ayağa kalkar ve mini boss olarak dövüşür.
- *Atmosfer:* Karda kalan ayak izleri, nefes buharı, kemiklerde kırağı parıltısı.

**7 · Alev Tahtı — "Zamanın kırıldığı yer" (Final: Aku)**
- *Faz 1 (normal form):* Taht salonu, yağan ateş.
- *Faz 2 (canavar form):* Zemin çatlar, arka plan kırmızıdan mora döner, müzik hızlanır.
- *Faz 3 (zaman kırılması):* Arena önceki 6 biyomun parçalarına bölünür ve portal pususu bu parçalar arasında olur. Bu faz tüm yolculuğun özeti olur.
- *Final:* Portal sinematiği, iki kahramanın zafer pozu, istatistik, kaydırmalı künye ve bir sonraki hikâyeye kanca olan "Devam edecek".

### 11.3 "Steam'de oynuyormuş gibi" hissi için ortak liste

1. Açılış: stüdyo kartı (MeMoDe) → "Bir tuşa bas" başlık ekranı → menü (menü müziğiyle).
2. Tam ekran, oyun sırasında gizli imleç, gamepad ile tam kontrol.
3. Kayıt/Devam et, bölüm seçimi (açılan biyomlar), rütbe ve kişisel rekor.
4. Başarımlar (ör. "Hiç Zemzem içmeden Bataklık", "Aku'yu 3 dakikada yen").
5. Ayarlar: Görüntü / Ses (Genel-Müzik-Efekt-Ortam) / Kontroller (atama) / Oynanış (hasar sayıları, sarsıntı) / Erişilebilirlik.
6. Vuruş hissi: hitstop, geri itme, beyaz flaş, hasar sayıları, kombo sayacı, dash, finisher.
7. HUD sadeliği: köşelerde 2 oyuncu kartı, üstte boss barı; geri kalan her şey dünyanın içinde.
8. Fotoğraf modu (Esc → Fotoğraf): HUD'suz, serbest kamera, filtreler.
9. Yama notları ekranı ve sürüm geçmişi.
10. Telif bandı yalnızca ana menü ve künyede görünür.

---

## 12. Uygulama durumu ve yeniden değerlendirme (v2.0.0 · 25 Eylül 2026)

> Aşağıdaki puanlar **uygulayıcının kanıta dayalı öz değerlendirmesidir.** 2. bölümdeki kurala göre 9.8, ancak bağımsız bir denetim turu ölçümle doğruladığında verilebilir. Bu yüzden 9.8'e ulaşmayan alanlar ve nedenleri açıkça yazıldı.

### 12.1 Faz özeti

| Faz | Durum | Yapılanlar | Kalan |
|---|---|---|---|
| 0 · Envanter ve ölçüm | ◐ | Varlık boyutu ölçüldü, Intel UHD üzerinde fps tabanı ve A/B karşılaştırması yapıldı, 7 diyarın ekran görüntüleri alındı. | 7 diyar × 4 profil fps matrisi tam doldurulmadı. |
| 1 · Kritik hatalar | ☑ | Siyah can barı (`vertexColors`), odak kaybında otomatik duraklatma, yeni zorluk tablosu, README, ilk 9 sn hasarsız açılış ve öğretici dalga. | — |
| 2 · Hukuk 🔒 | 🔒 | YouTube müziği kaldırıldı; yükleme ekranına hayran yapımı uyarısı, `docs/CREDITS.md` eklendi. | IP (G45), model lisansları, dini temsil (G48) kararları kullanıcıda. |
| 3 · Çekirdek mimari | ☑ | Tek oyun saati (`src/sim/clock.ts`), saf 30 Hz simülasyon (`src/sim/director.ts`), tipli olay yolu (`src/sim/events.ts`), veriye dayalı diyar içeriği (`src/content/biomeContent.ts`). | — |
| 4 · Performans ve varlık | ◐ | GLB'ler meshopt ile sıkıştırıldı, arka planlar WebP, kaynaklar `assets-src/`'ye taşındı: `public/assets` 23,3 MB → 15,9 MB. JS vendor parçalarına bölündü (oyun kodu 334 kB). Kalabalıkta hava/dekor LOD'u. | KTX2 dokular ve diyar bazlı akışlı yükleme yok; açılışta tüm modeller önceden yükleniyor. |
| 5 · Oyun hissi | ☑ | Hitstop, geri itme, sendeleme, atılma + dokunulmazlık, kusursuz kaçışta yavaş çekim, uyarılı saldırılar, saldırı jetonu (kahraman başına en fazla 2), üç sığ derinlik şeridi, düşman ayrışması ve beden engeli, kombo, kamera sarsıntısı, titreşim. | Bitirici (finisher) animasyonu yok. |
| 6 · Giriş ve erişilebilirlik | ☑ | Gamepad (2 oyuncu), tuş atama, klavye düzeni etiketleri, sarsıntı/flaş/hasar sayısı/yazı ölçeği/diyalog hızı ayarları, tam ekran, menülerde uzamsal gezinme. | Renk körlüğü modu yok. |
| 7 · Tasarım sistemi ve HUD | ☑ | `tokens.css`, ekran stilleri 5 sıralı dosyaya bölündü, kullanılmayan ~220 satır CSS silindi, HUD 4 öğeye indi, telif bandı yalnızca menülerde. | — |
| 8 · Ses ve müzik | ◐ | Özgün, uyarlanabilir sentez müzik (Hicaz makamı + Japon pentatonik), diyar ve boss temaları, ortam sesleri, ses kanalları (bus), yankı, olay tabanlı efektler, diyalog sesleri. | Efektler hâlâ sentez; örnek (sample) tabanlı SFX için lisanslı ses kaynağı gerekiyor. |
| 9 · Dünya altyapısı | ☑ | Malzemeye göre birleştirilmiş prosedürel dekor (ön/orta/siluet katmanları), diyara özel zemin, temalı kapılar, hava sistemi, kenar (rim) ışığı. | — |
| 10 · Diyar paketleri | ☑ | Yedi diyarın her birine kendi mekaniği: neon, gelgit, bataklık, lav, çan rezonansı, tipi + Kemik Devi, alev bacaları. | — |
| 11 · Boss, anlatı, meta | ☑ | Prolog sineması, diyar başlık kartları, diyalog kuyruğu ve hikâye yönetmeni, Aku'da "zaman kırılması" evresi, portal finali ve 2. oyun kancası, kayıt/devam, bölüm seçimi, rütbe, 14 başarım, istatistik, yama notları, yapımcılar. | — |
| 12 · Altyapı ve son denetim | ◐ | GitHub Actions CI, OG görseli, web manifest, `vercel.json`, sürüm eşitleme kontrolü, hata sınırı (ErrorBoundary), WebGL bağlam kaybı ekranı. | Harici hata izleme servisi yok; 4 × 35 dk tam oynanış E2E'si çalıştırılmadı. |

### 12.2 9. bölümdeki bulguların durumu

| Durum | Bulgular |
|---|---|
| ☑ Çözüldü | 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 23, 24, 27, 28, 29, 30, 31, 32 |
| ◐ Kısmen | **6** (dövüşte post-process hâlâ kapalı: Intel UHD'de bloom 57 → 22 fps düşürdü; yerine kenar ışığı, pişmiş zemin ışığı ve hava efektleri), **20** (SFX sentez), **25** (varlıklar küçüldü ama akışlı yükleme yok), **26** (3D dekor katmanları parallax derinliği veriyor; boyalı arka plan tek katman) |
| 🔒 Karar bekliyor | **21** (IP), **22** (dini temsil) |

### 12.3 Grup bazlı öz değerlendirme

| Grup | Puan | 9.8 için eksik olan |
|---|---|---|
| A · Ürün akışı ve menüler | 9.4 | Stüdyo açılış kartı; tam oynanış testinde akışın doğrulanması. |
| B · 2D tasarım sistemi | 9.0 | Eski ekran stillerinin token'lara tam taşınması (px → token). |
| C · Giriş ve erişilebilirlik | 9.2 | Renk körlüğü modu, oyun içi ekran okuyucu duyuruları. |
| D · Performans | 8.7 | KTX2, diyar bazlı akışlı yükleme, güçlü GPU'da dövüş post-process'i. |
| E · Mimari ve KISS | 9.5 | Kalan eski bileşenlerin `src/sim` olaylarına taşınması. |
| F · Veri ve içerik doğruluğu | 9.6 | — (bağımsız gözden geçirme) |
| G · Hukuk 🔒 | — | Kullanıcı kararı olmadan puanlanamaz. |
| H · Altyapı | 9.2 | Hata izleme, uzun oynanış E2E'si, daha hızlı birim testi ortamı. |
| I · Web yayın olgunluğu | 9.1 | Önbellek başlıkları ve çevrimdışı açılışın ölçülmesi. |
| K · 3D görsel kalite | 8.5 | El yapımı PBR modeller/dokular; dekor hâlâ prosedürel low-poly. Sanatçı ya da lisanslı varlık gerektirir. |
| L · Dünya ve seviye tasarımı | 9.2 | Diyar içi set-piece anları (ör. liman gemisinin batışı). |
| M · Oyun tasarımı | 9.3 | Uzun oynanışla denge ayarı (4 zorluk × 7 diyar). |
| N · Ses ve müzik | 8.6 | Lisanslı örnek tabanlı SFX, stüdyo kayıtlı müzik ya da seslendirme. |
| O · Kontrol ve oyun hissi | 9.4 | Bitirici animasyonu; gerçek oyuncularla his testi. |
| P · Oyun içi arayüz | 9.4 | — (oyuncu testi) |
| R · Anlatı ve dramaturji | 9.3 | Seslendirme ve ara sahne animasyonları. |
| S · Co-op ve sosyal | 9.1 | Ortak kombo/ortak saldırı hareketi. |
| W · Diyar ve boss karneleri | 9.2 | Final "zaman kırılması"nda önceki diyar parçalarına bölünen arena. |

### 12.4 Ölçümler (Intel UHD, headless Chrome, 1280×720)

- Performans E2E (100 düşman + ardışık saldırı): Yüksek 58,8 · Dengeli 59,7 · Performans 60,0 fps; yüksek detay (DPR 1.35) 51,7 fps; Aku sahnesi 59,7 fps. Aynı test, makinede eş zamanlı `tsc`/`oxlint` çalışırken 39–46 fps'e düştü; ölçümler boş makinede alınmalı.
- İzole A/B: v1.2.7 medyan 57,5 fps, v2.0.0 medyan 53,5 fps. Yeni dekor, hava ve mekanik görselleri buna rağmen eklendi.
- Birim testleri: 29 dosya, 125 test. `tsc` ve `oxlint` temiz.
- Paket: oyun kodu 334 kB, `three` 711 kB, `r3f` 259 kB, `react` 178 kB (sıkıştırmasız).

---

## 13. v3.0.0 · On Diyar güncellemesi (26 Eylül 2026)

> Aynı kural geçerli: aşağıdaki puanlar kanıta dayalı öz değerlendirmedir; 9.8 ancak bağımsız bir turla doğrulanınca verilir.

### 13.1 Bu turda kapanan açıklar

| Alan | Önce | Şimdi |
|---|---|---|
| Hukuk / varlıklar | Arka planlar dizinin kendi sahne çizimleriydi (G45'in en somut riski). | Tüm tablolar `scripts/art` ile kodla üretilen özgün albüm kapağı sanatı; eski çizimler build'e girmiyor. |
| 3D görsel kalite (K) | Tek katmanlı boyalı arka plan, siyah görünen metal kılıçlar, sabit yay efektleri. | İki katmanlı paralaks tablolar (ufuk 3B zemine kilitli), parlak çelik kılıçlar, gerçek kılıcı izleyen ışık izleri, GPU parçacıkları, anime kesik çizgileri, yeni portal girdabı. |
| Dünya ve seviye (L) | 7 diyar. | 10 diyar; yeniler kendi mekaniği, 3B seti, kapısı, havası, müziği ve ortam sesiyle. |
| Oyun tasarımı (M) / his (O) | Tek vuruş; ortak saldırı yok. | 3'lü zincir + dönen bitirici, Çifte Hamle, mermi savuşturma, hurdaya dönen dronlar, kum saati yavaşlatması, zincir şimşek. |
| Co-op (S) | Yalnız çanlar ortaktı. | Çifte Hamle ve Keşiş'in öğrettiği ortak kesiş hikâyeye bağlandı. |
| Anlatı (R) | Düz anlatıcı prologu. | Aku'nun ağzından prolog, karakterine uygun diyaloglar, Hz. Ali'nin Hendek esintili "hak için vururum" anı, Yaşlı Keşiş, Medine finali. |
| Arayüz (A/P) | Klasik başlık kartı, ızgara bölüm seçimi. | Albüm parçası kartı, plak parça listesi, konuşmacı portreleri. |
| Yayın (I) | Kök yollar (`/assets`), itch.io'da çalışmazdı. | Göreli yollar, `npm run package:itch`, itch alt klasör simülasyonunda hatasız açılış doğrulandı. |
| Hata | Bölüm seçimiyle bataklıktan başlayınca Gölge atlanıyordu (`biome > 2`). | Kimlik tabanlı indeks; boss bitişi tek noktada (`damageEnemy`). |

### 13.2 Öz değerlendirme (v3.0.0)

| Grup | v2 | v3 | 9.8 için kalan |
|---|---|---|---|
| A · Ürün akışı | 9.4 | 9.6 | Stüdyo açılış kartı. |
| B · 2D tasarım sistemi | 9.0 | 9.3 | Eski px değerlerinin token'lara taşınması. |
| C · Giriş/erişilebilirlik | 9.2 | 9.4 | Renk körlüğü dostu uyarılar eklendi; kalan: ekran okuyucu ile tam savaş duyuruları. |
| D · Performans | 8.7 | 9.3 | KTX2 ve diyar bazlı akışlı yükleme. |
| E · Mimari | 9.5 | 9.6 | — |
| G · Hukuk 🔒 | — | — | Karakter IP'si ve dinî temsil kararı hâlâ yayıncıda. Arka plan riski kapandı. |
| I · Web yayın | 9.1 | 9.6 | Önbellek başlıkları (itch.io yönetir). |
| K · 3D görsel | 8.5 | 9.2 | El yapımı modeller/dokular. |
| L · Dünya/seviye | 9.2 | 9.5 | Diyar içi set-piece anları. |
| M · Oyun tasarımı | 9.3 | 9.5 | Uzun oynanışla 4 zorlukta denge doğrulaması. |
| N · Ses/müzik | 8.6 | 8.8 | Lisanslı örnek tabanlı SFX, seslendirme. |
| O · Oyun hissi | 9.4 | 9.7 | Gerçek oyuncularla his testi. |
| R · Anlatı | 9.3 | 9.6 | Seslendirme, animasyonlu ara sahneler. |
| S · Co-op | 9.1 | 9.5 | Çevrim içi değil; yerel co-op tamam. |
| W · Diyar/boss | 9.2 | 9.5 | Ana Böcek için tam boss evreleri. |

### 13.3 Ölçümler

- Tam akış (geliştirici kancalı): 10 diyar, Gölge, Aku'nun tüm evreleri ve portal finali 68 sn'de hatasız tamamlandı.
- Performans E2E: 100 düşmanda üç profil 60 fps; yüksek detay (DPR 1.35) 58,8 fps (v2: 51,7); Aku sahnesi 60 fps.
- Arka plan katmanlarındaki CSS maskeleri ilk denemede yüksek detayı 26 fps'e düşürdü; kenar geçişleri tabloların alfa kanalına pişirildi ve yalnızca ekranla kesişen diyarlar çizilir hâle getirildi.
- 129 birim testi, 28 E2E testi ve performans testi geçiyor; `tsc` ve `oxlint` temiz. Son ölçüm: yüksek detay 59,5 fps, Aku sahnesi 59,7 fps.
- **Gerçek girdili bot (`e2e/playthrough.spec.ts`)**, klavye olaylarıyla oynar ve yenilince oyuncu gibi "Kayıttan devam et"i seçer:
  - Kolay: ilk denemede zafer (178 sn oyun süresi).
  - Orta: ilk denemede zafer (252 sn).
  - Zor: 3. denemede zafer; bot 7. diyarda ve Aku'da birer kez düştü.
  - Acımasız: kayıt noktalarıyla Aku'ya ulaştı, Aku'yu her denemede %45-55'e indirip düştü. Bot kaçınma, savuşturma ve Çifte Hamle kullanmadığı için beklenen bir duvar; bu mod insan oyuncu için tasarlandı.
- Bot testi gerçek bir hata yakaladı: bir düşmana yaslanan kahraman arkasındaki düşmana dönemiyordu (beden engeli yön güncellemesini de sıfırlıyordu). Düzeltildi; Orta mod bu yüzden ilk denemede tamamlanamamıştı.

## 14. v3.1.0 · Kayıt ve vitrin (26 Eylül 2026)

| Alan | Bulgu | Düzeltme |
|---|---|---|
| A · Ürün akışı | İlerlemeyi / başarımları sıfırlamanın yolu yoktu (`resetAll` vardı ama hiçbir arayüz çağırmıyordu). | Ayarlar → Kayıt: özet, "İlerlemeyi sıfırla" ve "Fabrika ayarlarına dön"; iki adımlı onay, yalnızca ana menüde. Birim + E2E testli. |
| K · 3D görsel | Ana menüde kahraman menü sütununun arkasında, karanlık degradenin altında kalıyordu; yalnız düşman görünüyordu. | "duel" kompozisyonu: kahraman sahnenin ortasında, düşmanla yüz yüze. |
| K · 3D görsel | Menü vitrini oyundan kopuktu: eski yay/plaka/tetrahedron efektleri, tek vuruş, iz yok, kın yok. | Vitrin oyunun sistemlerini kullanıyor: 3'lü zincir + dönen bitirici, gerçek kılıç izi, GPU parçacıkları, kesik çizgileri, Jack'in kını. |
| K · 3D görsel | Ateş topu düz bir disk, kalkan ve karanlık küre tel kafes küreydi. | Fresnel enerji kabuğu (örnekli çizime uygun), sıcak çekirdek, parçacık izi. |
| K · 3D görsel | Şeffaf tuvalde additive karışım alfa'yı a² yazıyordu: ışıklar gri örtü gibi görünüyor, CSS gölgesini yakalıyordu. | Renk additive, alfa normal birleşir (`lightBlending.ts`). |
| D · Performans | Menü tuvalinde tam ekran animasyonlu `drop-shadow` filtresi. | Kaldırıldı. |
| A · Ürün akışı | Grafik kalibrasyon bildirimi her açılışta 9 sn başlığı kapatıyordu. | Yalnızca ilk açılışta. |

### 14.1 Doğrulama

- 131 birim testi (yeni: `src/meta/resetData.test.ts`), 31 E2E testi (yeni: Kayıt sekmesi sıfırlama ve fabrika ayarları) geçiyor; `tsc` ve `oxlint` temiz.
- Gerçek girdili bot: Kolay 1. denemede zafer (169 sn), Orta 1. denemede zafer (245 sn). Zor/Acımasız bu turda koşturulmadı (oyun kuralları değişmedi).
- Performans: 100 düşmanda üç profil 60 fps, Aku sahnesi 60 fps, yüksek detay (DPR 1.35) 56,5–57,2 fps. Makinede başka projelerin geliştirme sunucuları çalışırken ölçüldü; mermi kabukları kapatılınca değer değişmedi (55,5 fps, aynı yük altında).
- itch.io paketi `release/merbut-itch-v3.1.0.zip` (108 dosya, 18,5 MB) alt klasör sunucusunda hatasız açıldı.
