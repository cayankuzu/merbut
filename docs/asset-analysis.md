# Asset analiz raporu

Analiz tarihi: 26 Temmuz 2026

## Kaynak eşlemesi

| Masaüstü kaynağı | Proje kopyası |
| --- | --- |
| `jack_durma.glb` | `public/assets/models/jack/jack-idle.glb` |
| `jack_yürüme.glb` | `public/assets/models/jack/jack-walk.glb` |
| `jack_zıplama.glb` | `public/assets/models/jack/jack-jump.glb` |
| `jack_vurma.glb` | `public/assets/models/jack/jack-attack.glb` |
| `jack_kılınc.glb` | `public/assets/models/jack/jack-sword.glb` |
| `hz_durma.glb` | `public/assets/models/ali/ali-idle.glb` |
| `hz_yürüyüş.glb` | `public/assets/models/ali/ali-walk.glb` |
| `hz_zıplama.glb` | `public/assets/models/ali/ali-jump.glb` |
| `hz_vurma.glb` | `public/assets/models/ali/ali-attack.glb` |
| `hz_kılınc.glb` | `public/assets/models/ali/ali-sword.glb` |
| `1.sahne_arkaplan.jpg` | `public/assets/backgrounds/scene-01.jpg` |

Masaüstü kaynakları silinmedi, taşınmadı veya değiştirilmedi.

## Karakter GLB yapısı

- Biçim: glTF 2.0 / GLB.
- Üretici: Khronos glTF Blender I/O v4.0.43.
- Up axis: Y (glTF 2.0 standardı).
- Sahne kökü: `Armature`, kök ölçeği yaklaşık `0.01`.
- Ana skinned mesh: `char1`.
- Her karakter dosyasında bir skin ve 24 joint bulunur.
- Ana modelin yerel mesh yüksekliği 1.7 birimdir.
- Samuray Jack yerel mesh sınırı: yaklaşık `1.105 × 1.700 × 0.398`.
- Ali yerel mesh sınırı: yaklaşık `1.290 × 1.700 × 0.444`.

Ortak kemik listesi:

`Hips`, `LeftUpLeg`, `LeftLeg`, `LeftFoot`, `LeftToeBase`, `RightUpLeg`, `RightLeg`, `RightFoot`, `RightToeBase`, `Spine02`, `Spine01`, `Spine`, `LeftShoulder`, `LeftArm`, `LeftForeArm`, `LeftHand`, `RightShoulder`, `RightArm`, `RightForeArm`, `RightHand`, `neck`, `Head`, `head_end`, `headfront`.

Her karakterin idle/walk/jump/attack dosyalarında kemik adları ve ebeveyn-çocuk hiyerarşisi birebir aynıdır. Bu nedenle retarget uygulanmamış, diğer dosyalardaki klipler doğrudan idle ana modelinin iskeletine bağlanmıştır. Bağlanamayan klip veya eksik kemik yoktur.

## Animasyon klipleri

| Karakter | Proje dosyası | Kaynak klip | Kaynak süre | Runtime kullanımı |
| --- | --- | --- | ---: | --- |
| Hz. Ali | `ali-idle.glb` | `Armature\|Idle_3\|baselayer` | 10.0000 sn | Döngü |
| Hz. Ali | `ali-walk.glb` | `Armature\|walking_2_inplace\|baselayer` | 1.2333 sn | Döngü |
| Hz. Ali | `ali-jump.glb` | `Armature\|Regular_Jump\|baselayer` | 1.9333 sn | Tek sefer, fizik süresine ölçekli |
| Hz. Ali | `ali-attack.glb` | `Armature\|Right_Hand_Sword_Slash\|baselayer` | 1.5333 sn | Tek sefer |
| Samuray Jack | `jack-idle.glb` | `Armature\|Idle_02\|baselayer` | 2.3667 sn | Döngü |
| Samuray Jack | `jack-walk.glb` | `Armature\|walking_man\|baselayer` | 1.0667 sn | Döngü |
| Samuray Jack | `jack-jump.glb` | `Armature\|Jump_Rope\|baselayer` | 8.6000 sn | İlk tek-zıplama çevrimi, kare 0–33 |
| Samuray Jack | `jack-attack.glb` | `Armature\|Right_Hand_Sword_Slash\|baselayer` | 1.5333 sn | Tek sefer |

Tüm kliplerde 72 kanal vardır: 24 translation, 24 rotation ve 24 scale track.

### Root motion sonucu

Yatay hareket kliplerin sonunda başlangıca dönmektedir; ölçülen net dünya sonu farkları sıfıra çok yakındır. Walk klipleri yerinde (`in-place`) çalışır. `Hips` üzerinde poz/sekme hareketi vardır, fakat sahne kökü taşınmaz. Karakterlerin gerçek X/Y konumu tamamen hareket denetleyicisi tarafından yönetilir.

## Kılıçlar

- `ali-sword.glb`: bir mesh, sıfır skin, sıfır joint, sıfır animasyon; yerel sınır yaklaşık `1.606 × 0.471 × 1.899`.
- `jack-sword.glb`: bir mesh, sıfır skin, sıfır joint, sıfır animasyon; yerel sınır yaklaşık `1.898 × 0.129 × 0.120`.
- Her iki dosya da rijittir ve `meshy-scene` üreticisinden gelir.
- Otomatik el araması her iki karakterde de tam eşleşme olan `RightHand` kemiğini bulur.
- `WeaponSocket`, yalnızca bu kemiğe eklenir; kılıçlar skin weight almaz ve tüm iskelete bağlanmaz.
- Armature kökünün `0.01` ölçeği ayrı kılıçlarda telafi edilmiştir. Kalıcı karaktere özel dönüşümler `src/config/characterTransforms.ts` dosyasındadır.

## Arka plan

- Kaynak çözünürlük: 638×416.
- En-boy oranı: yaklaşık 1.5337.
- Görsel 42 birim genişliğinde, aynı oranı koruyan bir 3D plane üzerinde kullanılır.
- Kamera görünümü plane sınırları içinde tutulur; 16:9 görünümde siyah kenar oluşturmadan cover benzeri kırpma elde edilir.

## Güvenli animasyon optimizasyonu

Walk/jump/attack kopyalarında tekrar eden mesh, skin, materyal ve dokular yalnız runtime aktarımından çıkarılmıştır. 72 kanallı animasyon, kemik hedefleri ve klip süreleri yeniden okunarak doğrulanmıştır. Idle ana modelleri ve iki kılıç görsel olarak değiştirilmemiştir.

| Dosya | Önce | Sonra |
| --- | ---: | ---: |
| `ali-walk.glb` | 7,118,448 B | 33,636 B |
| `ali-jump.glb` | 7,126,172 B | 41,376 B |
| `ali-attack.glb` | 7,121,776 B | 36,972 B |
| `jack-walk.glb` | 13,058,040 B | 32,216 B |
| `jack-jump.glb` | 13,140,784 B | 114,980 B |
| `jack-attack.glb` | 13,062,764 B | 36,920 B |

Optimizasyon yalnızca doğrulanmış proje kopyalarına uygulanmıştır; masaüstü kaynakları geri dönüş noktası olarak aynen korunur.
