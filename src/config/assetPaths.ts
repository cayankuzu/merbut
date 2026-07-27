export const ASSET_PATHS = {
  backgrounds: {
    city: '/assets/backgrounds/scene-01-master.jpg',
    harbor: '/assets/backgrounds/scene-02-harbor-hd.jpg',
    swamp: '/assets/backgrounds/scene-03-swamp-hd.jpg',
    skullIsland: '/assets/backgrounds/scene-04-skull-island-hd.jpg',
    ruins: '/assets/backgrounds/scene-05-ruins-hd.jpg',
    skullField: '/assets/backgrounds/scene-06-skull-field-hd.jpg',
    finalBoss: '/assets/backgrounds/scene-07-final-boss-hd.jpg',
  },
  ali: {
    idle: '/assets/models/ali/ali-idle.glb',
    walk: '/assets/models/ali/ali-walk.glb',
    jump: '/assets/models/ali/ali-jump.glb',
    attack: '/assets/models/ali/ali-attack.glb',
    sword: '/assets/models/ali/ali-sword.glb',
  },
  jack: {
    idle: '/assets/models/jack/jack-idle.glb',
    walk: '/assets/models/jack/jack-walk.glb',
    jump: '/assets/models/jack/jack-jump.glb',
    attack: '/assets/models/jack/jack-attack.glb',
    sword: '/assets/models/jack/jack-sword.glb',
  },
  enemies: Array.from({ length: 5 }, (_, index) => ({
    walk: `/assets/models/enemies/monster-${index + 1}/walk.glb`,
    attack: `/assets/models/enemies/monster-${index + 1}/attack.glb`,
  })),
  items: {
    zemzem: '/assets/models/items/zemzem.glb',
  },
  bosses: {
    evilJack: {
      walk: '/assets/models/bosses/evil-jack/walk.glb',
      run: '/assets/models/bosses/evil-jack/run.glb',
      slash: '/assets/models/bosses/evil-jack/left-slash.glb',
      doubleCombo: '/assets/models/bosses/evil-jack/double-combo.glb',
      tripleCombo: '/assets/models/bosses/evil-jack/triple-combo.glb',
      cast: '/assets/models/bosses/evil-jack/cast.glb',
      hit: '/assets/models/bosses/evil-jack/hit.glb',
    },
    aku: {
      normal: {
        walk: '/assets/models/bosses/aku/normal/walk.glb', run: '/assets/models/bosses/aku/normal/run.glb',
        attack: '/assets/models/bosses/aku/normal/attack.glb', heavy: '/assets/models/bosses/aku/normal/heavy.glb',
        kick: '/assets/models/bosses/aku/normal/kick.glb', triple: '/assets/models/bosses/aku/normal/triple.glb',
        ranged: '/assets/models/bosses/aku/normal/ranged.glb', dead: '/assets/models/bosses/aku/normal/dead.glb',
      },
      monster: {
        idle: '/assets/models/bosses/aku/monster/idle.glb', walk: '/assets/models/bosses/aku/monster/walk.glb',
        run: '/assets/models/bosses/aku/monster/run.glb', slash: '/assets/models/bosses/aku/monster/slash.glb',
        double: '/assets/models/bosses/aku/monster/double.glb', triple: '/assets/models/bosses/aku/monster/triple.glb',
        spin: '/assets/models/bosses/aku/monster/spin.glb', bladeSpin: '/assets/models/bosses/aku/monster/blade-spin.glb',
        ranged: '/assets/models/bosses/aku/monster/ranged.glb', heavy: '/assets/models/bosses/aku/monster/heavy.glb',
        dead: '/assets/models/bosses/aku/monster/dead.glb',
      },
    },
  },
} as const
