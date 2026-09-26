/**
 * Every asset URL is relative to the page's base, so the same build runs at a
 * domain root and inside itch.io's sub-folder iframe.
 */
const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`

export const ASSET_PATHS = {
  ui: {
    aliHud: asset('ui/ali-hud.webp'),
    jackHud: asset('ui/jack-hud.webp'),
  },
  /** Original realm paintings (scripts/art): parallax back/front layers and album covers. */
  realms: {
    'aku-city': { back: asset('realms/aku-city-back.webp'), front: asset('realms/aku-city-front.webp'), cover: asset('covers/aku-city.webp') },
    'sunset-harbor': { back: asset('realms/sunset-harbor-back.webp'), front: asset('realms/sunset-harbor-front.webp'), cover: asset('covers/sunset-harbor.webp') },
    'hourglass-desert': { back: asset('realms/hourglass-desert-back.webp'), front: asset('realms/hourglass-desert-front.webp'), cover: asset('covers/hourglass-desert.webp') },
    'golden-swamp': { back: asset('realms/golden-swamp-back.webp'), front: asset('realms/golden-swamp-front.webp'), cover: asset('covers/golden-swamp.webp') },
    'beetle-foundry': { back: asset('realms/beetle-foundry-back.webp'), front: asset('realms/beetle-foundry-front.webp'), cover: asset('covers/beetle-foundry.webp') },
    'skull-island': { back: asset('realms/skull-island-back.webp'), front: asset('realms/skull-island-front.webp'), cover: asset('covers/skull-island.webp') },
    'jade-ruins': { back: asset('realms/jade-ruins-back.webp'), front: asset('realms/jade-ruins-front.webp'), cover: asset('covers/jade-ruins.webp') },
    'storm-peak': { back: asset('realms/storm-peak-back.webp'), front: asset('realms/storm-peak-front.webp'), cover: asset('covers/storm-peak.webp') },
    'skull-field': { back: asset('realms/skull-field-back.webp'), front: asset('realms/skull-field-front.webp'), cover: asset('covers/skull-field.webp') },
    'inferno-throne': { back: asset('realms/inferno-throne-back.webp'), front: asset('realms/inferno-throne-front.webp'), cover: asset('covers/inferno-throne.webp') },
  },
  portraits: {
    aku: asset('ui/portrait-aku.webp'),
    golge: asset('ui/portrait-golge.webp'),
    kesis: asset('ui/portrait-kesis.webp'),
    lejyon: asset('ui/portrait-lejyon.webp'),
    anlatici: asset('ui/portrait-anlatici.webp'),
  },
  story: {
    akuRise: asset('story/01-aku-rise.webp'),
    jackExile: asset('story/02-jack-exile.webp'),
    jackWanders: asset('story/03-jack-wanders.webp'),
    timeRift: asset('story/04-time-rift.webp'),
    aliFalls: asset('story/05-ali-falls.webp'),
    twoSwords: asset('story/06-two-swords.webp'),
    medina: asset('story/07-medina.webp'),
  },
  ali: {
    idle: asset('models/ali/ali-idle.glb'),
    walk: asset('models/ali/ali-walk.glb'),
    jump: asset('models/ali/ali-jump.glb'),
    attack: asset('models/ali/ali-attack.glb'),
    sword: asset('models/ali/ali-sword.glb'),
  },
  jack: {
    idle: asset('models/jack/jack-idle.glb'),
    walk: asset('models/jack/jack-walk.glb'),
    jump: asset('models/jack/jack-jump.glb'),
    attack: asset('models/jack/jack-attack.glb'),
    sword: asset('models/jack/jack-sword.glb'),
  },
  enemies: Array.from({ length: 5 }, (_, index) => ({
    walk: asset(`models/enemies/monster-${index + 1}/walk.glb`),
    attack: asset(`models/enemies/monster-${index + 1}/attack.glb`),
  })),
  items: {
    zemzem: asset('models/items/zemzem.glb'),
  },
  bosses: {
    evilJack: {
      walk: asset('models/bosses/evil-jack/walk.glb'),
      run: asset('models/bosses/evil-jack/run.glb'),
      slash: asset('models/bosses/evil-jack/left-slash.glb'),
      doubleCombo: asset('models/bosses/evil-jack/double-combo.glb'),
      tripleCombo: asset('models/bosses/evil-jack/triple-combo.glb'),
      cast: asset('models/bosses/evil-jack/cast.glb'),
      hit: asset('models/bosses/evil-jack/hit.glb'),
    },
    aku: {
      normal: {
        mini: asset('models/bosses/aku/normal/mini.glb'),
        walk: asset('models/bosses/aku/normal/walk.glb'), walkLod: asset('models/bosses/aku/normal/walk-lod.glb'), run: asset('models/bosses/aku/normal/run.glb'),
        attack: asset('models/bosses/aku/normal/attack.glb'), heavy: asset('models/bosses/aku/normal/heavy.glb'),
        kick: asset('models/bosses/aku/normal/kick.glb'), triple: asset('models/bosses/aku/normal/triple.glb'),
        ranged: asset('models/bosses/aku/normal/ranged.glb'), dead: asset('models/bosses/aku/normal/dead.glb'),
      },
      monster: {
        idle: asset('models/bosses/aku/monster/idle.glb'), walk: asset('models/bosses/aku/monster/walk.glb'),
        run: asset('models/bosses/aku/monster/run.glb'), slash: asset('models/bosses/aku/monster/slash.glb'),
        double: asset('models/bosses/aku/monster/double.glb'), triple: asset('models/bosses/aku/monster/triple.glb'),
        spin: asset('models/bosses/aku/monster/spin.glb'), bladeSpin: asset('models/bosses/aku/monster/blade-spin.glb'),
        ranged: asset('models/bosses/aku/monster/ranged.glb'), heavy: asset('models/bosses/aku/monster/heavy.glb'),
        dead: asset('models/bosses/aku/monster/dead.glb'),
      },
    },
  },
} as const
