import { ASSET_PATHS } from '../config/assetPaths'
import type { BiomeId } from '../config/biomes'
import type { Line, PrologueBeat, Speaker } from './script'

/**
 * The English script, line for line with the Turkish one in script.ts: same
 * keys, same speakers, same order, same images (script.test.ts checks it).
 * Same tone guide too. Jack and Hazrat Ali speak without contractions; Aku and
 * his legion may use them. Translate the joke, not the words.
 */
export const SPEAKER_NAMES_EN: Record<Speaker, string> = {
  ali: 'Hazrat Ali',
  jack: 'Samurai Jack',
  aku: 'Aku',
  golge: 'Aku’s Shadow',
  anlatici: 'Narrator',
  lejyon: 'Aku’s Legion',
  kesis: 'The Old Monk',
}

export const PROLOGUE_EN: readonly PrologueBeat[] = [
  { image: ASSET_PATHS.story.akuRise, speaker: 'aku', text: 'Long, long ago... well, practically yesterday, for me... I, Aku, the shape-shifting Master of Darkness, set the whole world to a single clock: my own.' },
  { image: ASSET_PATHS.story.jackExile, speaker: 'aku', text: 'The samurai who carried the only sword that could cut me? I flung him into the future through a rift in time. Brilliant idea. I’m still rather proud of it.' },
  { image: ASSET_PATHS.story.jackWanders, speaker: 'anlatici', text: 'But the samurai did not lose heart. For years he has walked Aku’s future, his sword sharp, his gaze forever turned toward the home he left behind.' },
  { image: ASSET_PATHS.story.timeRift, speaker: 'aku', text: 'Then it came to me: if one hero is this much trouble, I shall round up the heroes of every age and lock them all away! I tore time open. Let the collection begin!' },
  { image: ASSET_PATHS.story.aliFalls, speaker: 'anlatici', text: 'The first to fall through the rift was a warrior known for his justice, his knowledge and his courage: Hazrat Ali. Aku’s collection backfired on the very first day.' },
  { image: ASSET_PATHS.story.twoSwords, speaker: 'anlatici', text: 'Two strangers, two ages, one enemy. Ten realms to cross. The road leads to the Throne of Flames.' },
]

export const BIOME_SCENES_EN: Record<BiomeId, readonly Line[]> = {
  'aku-city': [
    { speaker: 'jack', text: 'Stranger... Did you fall through Aku’s rift as well?' },
    { speaker: 'ali', text: 'I fell, and I rose. Falling is fate; rising is in our own hands.' },
    { speaker: 'aku', text: 'Hah! Welcome to Aku Metropolis! Kindly hand your souls to the attendant on your way out.' },
    { speaker: 'jack', text: 'Call me Jack. Watch your back: these creatures glow before they strike.' },
    { speaker: 'ali', text: 'I am Ali. Numbers may frighten, but justice does not count; it weighs. Let us walk, brother.' },
  ],
  'sunset-harbor': [
    { speaker: 'jack', text: 'The sea... The sun set like this on the shores of my home. But there, the waves served no one.' },
    { speaker: 'ali', text: 'When the wave comes, jump. One does not quarrel with the sea; one walks with it.' },
    { speaker: 'aku', text: 'Harbor regulations, article one: heroes drown. Article two: see article one.' },
  ],
  'hourglass-desert': [
    { speaker: 'jack', text: 'Hourglasses... Could one of them carry me home, back to the past?' },
    { speaker: 'ali', text: 'Sand can flow back, but a day gone does not return. We do not return to the past, my friend; we learn from it.' },
    { speaker: 'jack', text: '...Still, I would like to try.' },
    { speaker: 'aku', text: 'Welcome to my desert! Mirage or real? Hint: all of them are faster than you!' },
  ],
  'golden-swamp': [
    { speaker: 'ali', text: 'In a swamp, whoever hurries sinks into the mud. Leap across the water.' },
    { speaker: 'jack', text: 'Follow the fireflies. Their light lends strength to your blade.' },
  ],
  'beetle-foundry': [
    { speaker: 'aku', text: 'The Beetle Foundry! A thousand drones a day, zero days off! Marvel at my efficiency!' },
    { speaker: 'jack', text: 'Machines... Strange, but I am relieved. These do not bleed.' },
    { speaker: 'ali', text: 'Be careful all the same. The shadow of the press falls before the enemy does.' },
    { speaker: 'lejyon', text: 'Beep. Your warranty... has expired. Beep.' },
  ],
  'skull-island': [
    { speaker: 'aku', text: 'Skull Island! The perfect getaway: lava, ash and eternal rest.' },
    { speaker: 'ali', text: 'When the ground glows red, step away. If we draw the enemy over the cracks, the lava will work for us.' },
    { speaker: 'jack', text: 'Every one of these skulls seems to be staring at us.' },
    { speaker: 'ali', text: 'Do not worry. They look upon no one anymore.' },
  ],
  'jade-ruins': [
    { speaker: 'jack', text: 'Mist... Half of these foes are like shadows. My blade passes right through them.' },
    { speaker: 'ali', text: 'There are two bells. If we strike them together, the mist will lift.' },
    { speaker: 'aku', text: 'Those bells are antiques! Break them and you can kiss your deposit goodbye!' },
  ],
  'storm-peak': [
    { speaker: 'jack', text: 'There was a monastery in these mountains. The monks taught me to listen to my breath.' },
    { speaker: 'ali', text: 'Stillness in the eye of the storm is the fortress of the heart.' },
    { speaker: 'aku', text: 'The lightning is mine! The clouds are mine! And the electricity bill is... hold on. Whose name is that in?' },
  ],
  'skull-field': [
    { speaker: 'ali', text: 'Here, even the wind whispers.' },
    { speaker: 'jack', text: 'Frozen ground. Step carefully; the blizzard pushes you back.' },
    { speaker: 'lejyon', text: 'The shift never ends on this field... and they pay your pension in bones.' },
  ],
  'inferno-throne': [
    { speaker: 'aku', text: 'Welcome to my Throne of Flames! No need to take your shoes off; the floor is already on fire.' },
    { speaker: 'jack', text: 'Aku! This time, time is not on your side.' },
    { speaker: 'ali', text: 'However high tyranny builds its throne, its foundation is rotten.' },
  ],
}

export const SCENES_EN: Record<string, readonly Line[]> = {
  'neon-first': [
    { speaker: 'aku', text: 'Hands off my neon signs! They’re terribly expensive! Even their electricity bill is terribly expensive!' },
    { speaker: 'jack', text: 'Expensive, you say.' },
    { speaker: 'ali', text: 'A tyrant’s finery is the sweat of the oppressed. Let us break them.' },
  ],
  'hourglass-first': [
    { speaker: 'ali', text: 'I turned the hourglass; time has grown heavy around it. Strike now!' },
    { speaker: 'jack', text: 'So it is not the sword that stops time, but patience.' },
  ],
  'mirage-first': [
    { speaker: 'jack', text: 'It turned to sand. A false enemy, a false fear.' },
    { speaker: 'ali', text: 'A mirage deceives the thirsty, not the contented.' },
  ],
  'shadow-intro': [
    { speaker: 'golge', text: 'I am your shadow, samurai. Everywhere you ran, I was already there.' },
    { speaker: 'jack', text: 'My shadow used to talk less.' },
    { speaker: 'ali', text: 'One does not fight a shadow; one makes the light greater. Here, drink this Zamzam.' },
  ],
  'shadow-defeated': [
    { speaker: 'jack', text: 'My shadow has fallen. Strange... I feel lighter.' },
    { speaker: 'ali', text: 'The heaviest burden a person carries is often their own darkness.' },
  ],
  'queen': [
    { speaker: 'aku', text: 'The Queen Beetle! Mother of nine hundred and ninety-nine drones... and I pay child support for every last one!' },
    { speaker: 'jack', text: 'The large ones turn slowly. Get behind her.' },
  ],
  'press-kill': [
    { speaker: 'lejyon', text: 'Beep... This is not a workplace accident. Beep. This is a workplace accident.' },
  ],
  'rod-first': [
    { speaker: 'jack', text: 'My sword trembles with the thunder.' },
    { speaker: 'ali', text: 'Power from the heavens is a trust. A trust is not to be squandered.' },
  ],
  'monk': [
    { speaker: 'kesis', text: 'Two swords from two ages... The clock on Aku’s throne can only be cut by both blades together. Strike the same foe at the same moment.' },
    { speaker: 'jack', text: 'Together, master.' },
    { speaker: 'ali', text: 'One hand alone makes no sound. When two hands meet, they are heard.' },
  ],
  'bell-hint': [
    { speaker: 'ali', text: 'One bell is not enough. You take that one; I will take this one. Together, now!' },
  ],
  'resonance': [
    { speaker: 'jack', text: 'The mist is lifting! Now we can see them.' },
    { speaker: 'ali', text: 'When two hearts beat as one, even the mountain echoes.' },
  ],
  'giant': [
    { speaker: 'aku', text: 'The Bone Giant! Employee of the Month. Every month.' },
    { speaker: 'jack', text: 'The large ones strike slowly. Read the attack, then dodge.' },
  ],
  'aku-intro': [
    { speaker: 'jack', text: 'Spirits of my ancestors... grant us strength.' },
    { speaker: 'ali', text: 'Prayer is the sword of the heart. It steadies the arm.' },
    { speaker: 'aku', text: 'Prayer? Then I shall make a wish too: the end of you both!' },
  ],
  // A moment drawn from the Battle of the Trench: Ali will not strike in anger.
  'aku-wrath': [
    { speaker: 'aku', text: 'And who might you be, desert wanderer? A samurai’s shadow, nothing more! I spit in your face!' },
    { speaker: 'ali', text: 'Give me one breath, Jack. I do not strike in anger; I strike only for what is right.' },
    { speaker: 'jack', text: 'I understand. Gather your breath. I am here.' },
  ],
  'aku-monster': [
    { speaker: 'aku', text: 'Enough! Behold my true face!' },
    { speaker: 'jack', text: 'Your true face is not much of an improvement.' },
  ],
  'aku-fracture': [
    { speaker: 'aku', text: 'Time is my plaything! Behold, every realm in a single nightmare!' },
    { speaker: 'ali', text: 'Whoever tears time apart will, in the end, break his own clock.' },
    { speaker: 'jack', text: 'Now, Ali! Together!' },
  ],
  'aku-defeated': [
    { speaker: 'aku', text: 'No... Impossible! But I have one last trick! Time rift, SWALLOW THEM!' },
  ],
  'portal': [
    { speaker: 'jack', text: 'Ali! The portal is pulling us in, take my hand!' },
    { speaker: 'ali', text: 'I have you. Wherever we fall, our road is the same.' },
    { speaker: 'jack', text: 'Perhaps this time... I am going home.' },
  ],
  'teaser': [
    { speaker: 'anlatici', text: 'The portal closed. The two heroes fell from the edge of time, down toward an age long past...' },
    { speaker: 'anlatici', text: 'The shade of date palms, a desert wind and a city rising in the distance: Medina.' },
    { speaker: 'anlatici', text: 'Next stop: the age of Hazrat Ali.' },
  ],
}

export const BARKS_EN: Record<string, readonly Line[]> = {
  'gate-open': [
    { speaker: 'jack', text: 'The gate is open. Onward!' },
    { speaker: 'ali', text: 'The way is open. Let us not linger.' },
    { speaker: 'aku', text: 'Who left that gate open?! I’m docking your wages! Plus a docking fee!' },
    { speaker: 'aku', text: 'The gate is open? Fire the security company at once!' },
  ],
  'ali-down': [
    { speaker: 'jack', text: 'Ali! Get up! Our road is not over yet!' },
    { speaker: 'aku', text: 'One down! It’s my lucky day!' },
  ],
  'jack-down': [
    { speaker: 'ali', text: 'There is no shame in falling, my friend. Only in staying down.' },
    { speaker: 'aku', text: 'The samurai is flat on the floor! I’m having this framed!' },
  ],
  'revive': [
    { speaker: 'jack', text: 'On my feet once more.' },
    { speaker: 'ali', text: 'It will take more than that.' },
  ],
  'combo': [
    { speaker: 'jack', text: 'My sword is talkative today.' },
    { speaker: 'ali', text: 'I stopped counting long ago.' },
    { speaker: 'lejyon', text: 'There was no such clause in my contract!' },
  ],
  'perfect': [
    { speaker: 'jack', text: 'Swift as the wind.' },
    { speaker: 'ali', text: 'Their blow is wasted; patience is on our side.' },
  ],
  'team': [
    { speaker: 'jack', text: 'Two swords, one breath!' },
    { speaker: 'ali', text: 'We struck together; together we prevail.' },
    { speaker: 'lejyon', text: 'Both at once?! That’s not fair!' },
  ],
  'wave': [
    { speaker: 'lejyon', text: 'The boss is watching, look busy!' },
    { speaker: 'lejyon', text: 'Does my insurance even cover this?' },
    { speaker: 'lejyon', text: 'My shift was already over, but...' },
    { speaker: 'lejyon', text: 'I’m taking this to HR. If there’s anything left of me.' },
    { speaker: 'aku', text: 'My Legion! Stop them! Or at least tire them out!' },
  ],
  'drone-wave': [
    { speaker: 'lejyon', text: 'Beep. Objective: destroy the heroes. Beep. Side quest: fetch coffee.' },
    { speaker: 'lejyon', text: 'Beep... Battery at three percent. Beep. So excited.' },
    { speaker: 'aku', text: 'My drones! Bought from the cheapest supplier, at the highest price!' },
  ],
  'tide-warn': [
    { speaker: 'ali', text: 'A wave is coming, jump!' },
  ],
  'lava-warn': [
    { speaker: 'jack', text: 'The ground is glowing red! Get back!' },
  ],
  'gust-warn': [
    { speaker: 'ali', text: 'A blizzard is coming, plant your feet firmly.' },
  ],
  'press-warn': [
    { speaker: 'jack', text: 'The shadow of the press! Move!' },
  ],
  'bolt-warn': [
    { speaker: 'ali', text: 'A ring on the ground! Lightning is about to strike!' },
  ],
  'portal-ambush': [
    { speaker: 'jack', text: 'He has thrown us into another realm!' },
    { speaker: 'aku', text: 'Surprise! Say hello to some old friends!' },
  ],
  'aku-taunt': [
    { speaker: 'aku', text: 'Tired, heroes? Lie down for a bit... forever!' },
    { speaker: 'aku', text: 'I am the master of time! And you two are very late guests.' },
    { speaker: 'aku', text: 'Is that all? My Legion fought better than that. Which is to say, not very well.' },
    { speaker: 'aku', text: 'Those swords... Aagh! Who keeps making them so SHARP?!' },
  ],
}
