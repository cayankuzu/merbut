# Değişiklik günlüğü

## 3.1.0 · Kayıt ve vitrin güncellemesi (26 Eylül 2026)

### Kayıt
- **Ayarlar → Kayıt** sekmesi: açılan diyar, kayıt noktası, başarım ve galibiyet özeti.
- **İlerlemeyi sıfırla:** bölümler, kayıt noktası, en iyi süre/rütbeler, başarımlar, istatistikler, prolog ve ipuçları silinir; tuş, ses ve grafik ayarları kalır.
- **Fabrika ayarlarına dön:** ilerlemeye ek olarak tüm ayarlar varsayılana döner ve oyun temiz başlar.
- İki adımlı onay (varsayılan odak "Vazgeç"); sürmekte olan bir yolculuğu bozmasın diye yalnızca ana menüden.

### Ana menü vitrini
- Kahraman artık menü sütununun arkasında kalmıyor: ana menüde sahnenin ortasına çıkıp düşmanla yüz yüze dövüşüyor.
- Kahramanlar oyundaki hareketlerini yapıyor: iki hızlı kesik + dönerek kesen bitirici, Ali'nin ateş topu, Jack'in kalkanı.
- Oyundaki efekt dili menüde de: gerçek kılıcı izleyen ışık izi, GPU kıvılcımları, anime kesik çizgileri, yer şok dalgası.
- Jack katanasını menüde de kınından çekip hamleden sonra kınına sokuyor.
- Eski düz plaka / tetrahedron / tel kafes efektleri kaldırıldı; düşman hamleleri (kesik, alev nefesi, şok dalgası, mermiler) parçacıklarla yeniden yazıldı.

### Efektler (oyun ve menü)
- Kılıç izi geniş bir "cam yelpaze" yerine ucu izleyen parlak bir hilal + hafif renkli süpürme.
- Ali'nin ateş topu: beyaz sıcak çekirdek, yuvarlanan alev kabuğu ve kıvılcım/alev dili izi (eski düz disk ve baklava izler kaldırıldı).
- Jack'in kalkanı ve Aku'nun karanlık küreleri tel kafes küre yerine parlayan enerji kabuğu.
- Işık efektleri şeffaf tuval üzerinde doğru karışıyor (arka plandaki tabloyu karartmıyor, gri örtü bırakmıyor).

### Düzeltmeler ve performans
- Menü tuvalindeki tam ekran `drop-shadow` filtresi kaldırıldı (her karede pahalı bir bulanıklık geçişiydi ve ışık efektlerinin altına siyah gölge düşürüyordu).
- "Grafik kalibrasyonu" bildirimi her açılışta başlığı kapatmıyor; yalnızca ilk açılışta (ve fabrika ayarlarından sonra) görünür.
- Kullanılmayan eski efekt bileşenleri silindi; saldırı zinciri zamanlamaları tek yerde (`src/config/combat.ts`).

## 3.0.0 · On Diyar güncellemesi (26 Eylül 2026)

### Dünya ve sanat
- Üç yeni diyar: **Kum Saati Çölü** (kum saati zaman alanları, seraplar), **Böcek Dökümhanesi** (konveyör bantlar, presler, Böcek Dronları ve Ana Böcek), **Şimşek Zirvesi** (paratonerle zincirleme şimşek, yıldırım düşüşleri).
- Dizinin telifli arka plan çizimleri tamamen kaldırıldı. Tüm diyarlar, prolog panelleri, konuşmacı portreleri ve mağaza görselleri `scripts/art` ile kodla üretilen özgün "albüm kapağı" tablolarıdır.
- Her diyar iki katmanlı paralaks: gökyüzü ve uzak dağlar yavaş, orta plan silüetleri zeminle birlikte kayar. Tablonun zemin çizgisi 3B zeminin canlı ufkuna kilitlidir.
- Yeni diyarlar için 3B set tasarımı, temalı kapılar, hava durumu (kum fırtınası, kıvılcım yağmuru, fırtına) ve ortam sesleri.

### Oynanış
- Üç vuruşluk saldırı zinciri; üçüncü vuruş dönerek kesen bir bitirici.
- **Çifte Hamle:** iki kahraman aynı düşmana 0,4 sn içinde vurursa ortak saldırı.
- **Savuşturma:** doğru anda sallanan kılıç mermiyi atana geri yollar.
- Jack katanasını kınında taşır; saldırıda çeker, sakinleşince kınına sokar.

### Efekt ve his
- Gerçek kılıç ucunu izleyen ışık izleri, GPU parçacık sistemi (kıvılcım, mürekkep, kum, yağ, toz), anime kesik çizgileri, darbe kareleri, hız çizgileri, iniş tozu.
- Parlak çelik kılıçlar (kılıç başına küçük ortam yansıması).
- Yeni sesler: savuşturma çınlaması, bitirici, çifte hamle taikosu, kılıç çekme/kına sokma, kum saati, pres, şimşek.

### Hikâye ve arayüz
- Prolog Aku'nun kendi ağzından, anlatıcı düzeltmeleriyle; 6 yeni panel.
- Yeni diyar sahneleri, Yaşlı Keşiş karakteri, Hz. Ali'nin "öfkeyle değil, hak için vururum" anı, Medine'ye uzanan final kancası.
- Diyar girişleri albüm parçası kartı; bölüm seçimi plak parça listesi.
- 5 yeni başarım (toplam 19), eski kayıtlar yeni diyar sırasına otomatik taşınır.

### Denge ve düzeltmeler
- Boss olmayan 8 diyara orta dalga; zorluk ekinin yarısı orta dalgalara uygulanır.
- Düşmana yaslanınca arkadaki düşmana dönülemeyen yön hatası düzeltildi (gerçek girdili bot testinde yakalandı).
- Bölüm seçimiyle bataklıktan başlayınca Gölge boss'unun atlanması düzeltildi; boss bitişi tek noktada.
- Erişilebilirlik: renk körlüğü dostu saldırı uyarıları.

### Yayın
- Göreli varlık yolları ve `npm run package:itch`: itch.io'ya doğrudan yüklenebilir HTML5 zip.

## 2.0.0 · Yedi Diyar güncellemesi (25 Eylül 2026)

### Hikâye ve dünya
- Prolog sinematiği, diyar başlık kartları, altyazılı ve seslendirme efektli diyaloglar.
- Aku’nun Gölgesi ve Aku için sahne diyalogları; final: “MERBUT II · Hz. Ali’nin Zamanı”.
- Her diyara özgü mekanik: neon tabelalar, gelgit, bataklık suyu ve ateş böcekleri, lav çatlakları, ikiz çanlar, tipi ve buz, alev bacaları.
- Aku’ya üçüncü faz: Zaman Kırılması.
- Her diyar için prosedürel 3B set (yol, orta plan, ön plan siluetleri), temalı kapılar, biyoma özel ortam ışığı ve kenar (rim) ışığı.
- Kameranın etrafında yaşayan hava sistemi (yağmur çizgileri, kar, kül, ateş böcekleri, sis).

### Oynanış ve his
- Tek oyun saati ve tek simülasyon döngüsü; duraklatma ve odak kaybında otomatik duraklatma.
- Saldırı uyarısı (kırmızı parıltı + yer halkası + ses), saldırı jetonları, geri itme, sersemleme.
- Kaçınma (dash) ve kusursuz kaçış ağır çekimi; hitstop, gamepad titreşimi, travma tabanlı kamera sarsıntısı.
- Kombo sayacı, hasar sayıları, gövde engeli, kalabalık ayrışması ve derinlik şeritleri.
- Düşman varyantları (Seçkin, Hayalet, Kemik Devi), her türe tek isim.
- Zorluk tablosu yeniden dengelendi; “Souls Like” yerine “Acımasız”.

### Arayüz ve erişilebilirlik
- Yeni başlık ekranı, ana menü, bölüm seçimi, başarımlar, yapımcılar, yama notları.
- 4 öğeli savaş HUD’u, boss barında faz çentikleri, başarım bildirimleri.
- 5 sekmeli ayarlar: görüntü, ses (5 kanal), kontroller (tuş atama + gamepad), oynanış, erişilebilirlik.
- Klavye düzenine duyarlı tuş etiketleri (TR-Q, TR-F, US), gamepad ile tam menü gezintisi, tam ekran.

### Ses
- YouTube’daki hayran yüklemesi kaldırıldı; yerine özgün, uyarlanabilir müzik (14 tema).
- Diyar ortam sesleri, katmanlı ses efektleri, yankı, 5 ayrı ses kanalı.

### Teknik
- Oyun kuralları React’ten ayrıldı (`src/sim`), olay veriyolu, veri odaklı biyom içeriği (`src/content`).
- Zemin, kalabalık, parçacık ve can barlarını siyaha boyayan `vertexColors` hatası düzeltildi.
- Model sıkıştırma (Zemzem 1,9 MB → 0,23 MB), arka planlar WebP (2,8 MB → 0,75 MB).
- Hata ekranı, WebGL bağlam kaybı kurtarma, CI, paylaşım önizlemesi ve manifest.
- Ana JS paketi 1,4 MB’lık tek dosyadan önbelleğe uygun parçalara bölündü (oyun kodu 334 kB); ekran stilleri 5 sıralı dosyaya ayrıldı, kullanılmayan CSS silindi.

## 1.2.7
- Biyom ilerlemesi ve görseller sağlamlaştırıldı.
