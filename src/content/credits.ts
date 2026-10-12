import { pick, type Locale } from '../i18n/locale'

export interface CreditBlock { role: string; names: readonly string[] }

export const CREDITS: readonly CreditBlock[] = [
  { role: 'Yapım ve yönetim', names: ['MeMoDe'] },
  { role: 'Oyun tasarımı, dünya ve hikâye', names: ['MeMoDe'] },
  { role: 'Programlama ve teknik sanat', names: ['MeMoDe'] },
  { role: 'Diyar tabloları, prolog ve kapak sanatı', names: ['Merbut sanat üreticisi (kodla çizilen özgün tablolar)'] },
  { role: 'Özgün uyarlanabilir müzik ve ses tasarımı', names: ['Merbut ses motoru (gerçek zamanlı sentez)'] },
  { role: '3B karakter modelleri', names: ['Meshy ile üretilmiş ve projeye uyarlanmış modeller'] },
  { role: 'Teknoloji', names: ['React', 'Three.js', 'React Three Fiber', 'Vite', 'Zustand'] },
  { role: 'Esin kaynakları', names: ['Samuray Jack (Genndy Tartakovsky)', 'Hz. Ali’nin hikmetli sözleri', 'Albüm kapağı sanatı ve UPA çizgi film geleneği'] },
  { role: 'Yasal not', names: ['Kâr amacı gütmeyen hayran yapımı', 'Samurai Jack ve Aku, Cartoon Network / Warner Bros. Discovery’ye aittir'] },
  { role: 'Teşekkürler', names: ['Oynayan herkese'] },
]

/** English credits, block for block. */
const CREDITS_EN: readonly CreditBlock[] = [
  { role: 'Production and direction', names: ['MeMoDe'] },
  { role: 'Game design, world and story', names: ['MeMoDe'] },
  { role: 'Programming and technical art', names: ['MeMoDe'] },
  { role: 'Realm paintings, prologue and cover art', names: ['The Merbut art generator (original paintings drawn in code)'] },
  { role: 'Original adaptive music and sound design', names: ['The Merbut sound engine (real-time synthesis)'] },
  { role: '3D character models', names: ['Models generated with Meshy and adapted for the project'] },
  { role: 'Technology', names: ['React', 'Three.js', 'React Three Fiber', 'Vite', 'Zustand'] },
  { role: 'Inspirations', names: ['Samurai Jack (Genndy Tartakovsky)', 'The words of wisdom of Hazrat Ali', 'Album cover art and the UPA animation tradition'] },
  { role: 'Legal notice', names: ['An unofficial, non-profit fan work', 'Samurai Jack and Aku belong to Cartoon Network / Warner Bros. Discovery'] },
  { role: 'Special thanks', names: ['Everyone who plays'] },
]

export const creditsFor = (locale: Locale): readonly CreditBlock[] => pick(locale, CREDITS, CREDITS_EN)
