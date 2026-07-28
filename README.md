# Merbut

React, TypeScript, Vite ve React Three Fiber ile hazırlanmış yerel iki oyunculu 2.5D aksiyon oyunu.

## Yerel çalıştırma

```powershell
cd "C:\Users\Cayan\Desktop\merbut"
npm install
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Oyun: [http://localhost:5173](http://localhost:5173)

Kalibrasyon paneli: [http://localhost:5173/?debug=1](http://localhost:5173/?debug=1)

## Oyun akışı

- Ana menüdeki **Karakterler** arşivi, iki kahramanı, beş yaratığı, Aku’nun Gölgesi’ni ve Aku’nun iki formunu 360° döndürülebilir modellerle gösterir.
- Zorluk seçimi; oyuncu canı ve yaşamı, vuruş gücü, düşman canı/sayısı/hızı/hasarı, Zemzem miktarı, boss zırhı, iyileşme ve saldırı uyarılarını birlikte belirler.
- Modlar: Kolay, Orta, Zor ve Souls Like.
- Birinci boss Aku’nun Gölgesi’dir. Final boss Aku, can oranına göre normal ve canavar formu arasında histerezisli geçiş yapar.
- Finalde Samuray Jack’in duası iki kahramana melek halkası verir; can vurdukça ve zamanla yenilenir. Aku da zamanla can yeniler.
- Aku yenildiğinde hareketli zaman portalı açılır, iki kahraman portala düşer ve final **DEVAM EDECEK...** metniyle biter.

## Kontroller

| Karakter | Hareket | Zıplama | Saldırı | Özel yetenek | 360° dönüş |
| --- | --- | --- | --- | --- | --- |
| Hz. Ali | `A` / `D` | `W` | `S` | `R`: 4 sn boyunca sınırsız alev topu | `Z` / `X` |
| Samuray Jack | `←` / `→` | `↑` | `↓` | `L`: hareket edilebilir 4 sn kalkan | `Ö` / `Ç` |

`Esc`, oynanış, geri sayım, boss sinematiği ve final sırasında bütün dünya zamanını durdurur.

## Kalite komutları

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

Aku kaynak GLB’leri yeniden hazırlanacaksa masaüstündeki `1.aku` ve `2.aku` klasörleri korunarak şu komut çalıştırılır:

```powershell
npm run prepare:aku
```

Animasyon kopyalarındaki tekrar eden mesh ve dokular çıkarılır; tam normal ve canavar ana modelleri değişmeden proje varlıklarına kopyalanır.

## Teknik notlar

- Hareket 120 Hz sabit zaman adımında çözülür; coyote time, jump buffer ve ortak mesafe sınırı içerir.
- Yedi biyom toplam on dört yatay panelden oluşur.
- Final Aku bütün geçmiş kapıları açar; oyuncular dünya sınırları içinde ileri ve geri gidebilir.
- Aku saldırı, dönüşüm ve bekleme sürelerini her oturumda çalışma anında yeniden rastgele seçer; sayfa yenilemesi gerekmez.
- Ayrıntılı model ve animasyon raporu: [`docs/asset-analysis.md`](docs/asset-analysis.md)
