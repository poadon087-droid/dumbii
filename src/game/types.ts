export type WeaponKey =
  | "popper" | "choir" | "note" | "mortar" | "halo" | "kettle" | "shard"
  | "lobber" | "fountain" | "trio" | "cuckoo" | "accordion" | "yoyo" | "harp" | "frost"
  | "quill" | "popcorn" | "trumpet" | "mitt" | "anvil" | "bubbles" | "boombox" | "phonograph"
  | "peel" | "kazoo" | "barrel" | "syrup" | "whistle" | "umbrella"
  | "grapple" | "slots" | "paint" | "pie" | "stamp"
  | "lance" | "sprinkler" | "candle";

export type CharmKey = "locket" | "smoke" | "coffee" | "sugar" | "penny" | "metronome" | "wind" | "clover" | "magneto"
  | "thimble" | "pepper" | "spurs" | "varnish";

export type CharacterKey = "milo" | "dixie" | "barnaby" | "coco" | "rusty";

export type EnemyKind =
  | "daisy" | "gloop" | "wisp" | "jack" | "bloat" | "eel" | "toad" | "spider"
  | "cap" | "mime" | "nut" | "bell" | "lugger" | "hex" | "ghoul" | "turret" | "candle"
  | "puppet" | "twin" | "phono" | "mirror" | "clown" | "bat" | "skeleton" | "totem"
  | "siren" | "chef" | "balloon" | "organ"
  | "disco" | "skunk" | "strong" | "usher" | "magnet"
  | "cutpurse" | "bellhop" | "drover" | "lancer" | "janitor" | "hooker"
  | "boss";

/** Run modes — same cast, same creeps, different goals. */
export type Mode = "endless" | "bulletdance" | "beat" | "glass" | "blackout";

import type { MapId, StageDef } from "./world";

export type HazardKind =
  | "lava" | "steam" | "saw" | "lightning" | "wisp" | "spinner" | "glaze"
  | "geyser" | "pendulum" | "tomb" | "pillar" | "bolt" | "tome";

export type Point = { x: number; y: number };

export type Enemy = Point & {
  id: number; kind: EnemyKind; hp: number; maxHp: number; r: number; speed: number; phase: number;
  cooldown: number; attack: number; hit: number; pink: boolean; size: number; hidden: boolean; airborne: number;
  /** Elite affix — rolled at spawn, drawn as a coloured crown */
  affix?: "painted" | "mirror" | "swift"; magnetField?: boolean;
  vx: number; vy: number; counter: number; bossName?: string; bossPhase?: number; maxBossPhase?: number;
  pattern: number; spawnT: number; burn: number; slow: number; elite: boolean; blink: number;
  /** BULLET DANCE: this creep is a "lead" — it fires in waltz triples and pays triple on a parry */
  lead?: boolean;
  /** hidden damage type for the CASTING CALL bestiary, 0 = unrevealed */
  tell?: number;
  frozen: number; segments?: Point[]; alpha: number; revived: boolean; buffed: number; rooted: number; laser?: { a: number; t: number };
  anchor?: Point; partner?: number; facingA: number; pull?: Point; shieldHp?: number;
  /** set once the death has been scored so a kill can never be counted twice */
  dead?: boolean;
  /** staggered attacks that must fire on engine time (pause-safe, unlike setTimeout) */
  volley?: { t: number; n: number; color: string; dmg: number; speed: number; pink: boolean }[];
  /** telegraphed lane/column attack used by the Pipe Organist */
  lanes?: { x: number; t: number }[];
  /** how many extra spawns this creep releases when it pops */
  burst?: number;
  stun?: number;
  slippery?: number;
  /** Polka Painter mark: takes +35% damage and is tinted while > 0 */
  paint?: number;
  paintC?: string;
  /** pie in the face: cannot attack while > 0 */
  blind?: number;
  /** Postage Stamp fuse: detonates when it runs out */
  tag?: { t: number };
  /** strongman wind-up armed; clears once the slam lands */
  wound?: boolean;
  /** The Card Sharp: super cards + coins carried off from the player */
  loot?: number;
  /** The Card Sharp: true once he has something of yours */
  holding?: boolean;
  /** Phantom Usher is ghosted: untargetable and harmless */
  phased?: boolean;
  /** Glitter Globe mirror shell is up: player shots bounce off */
  reflect?: number;
};

export type Bullet = Point & {
  vx: number; vy: number; life: number; maxLife: number; damage: number; r: number; color: string;
  enemy?: boolean; pink?: boolean; weapon?: WeaponKey; pierce: number; bounces: number; chains: number; hitIds: number[];
  splash?: number; homing?: number; boomerang?: boolean; returning?: boolean; orbit?: { angle: number; dist: number };
  roam?: boolean; sentry?: boolean; split?: number; tick?: number; ex?: boolean; charge?: number; knock?: number; spin: number;
  burn?: number; lob?: { sx: number; sy: number; tx: number; ty: number; t: number; dur: number }; pet?: { target: number; hop: number }; beam?: boolean; grow?: number;
  wave?: { amp: number; freq: number; phase: number; bx: number; by: number; nx: number; ny: number; t: number }; tether?: { dist: number; max: number; out: boolean }; arc?: Point[]; freeze?: number; web?: boolean; dead?: boolean;
  slash?: { a: number; w: number }; popAt?: number; gravity?: number; ghostWave?: boolean; ringWave?: boolean; fuse?: number;
  anvilDrop?: { targetY: number; groundT: number }; bubbleFloat?: boolean; sonicRing?: boolean;
  /** Slapstick Peels: sticks to the floor and waits for a creep to step on it */
  trap?: { t: number; armed: number };
  /** Barrel Roll: heavy roller that decelerates and shoves creeps aside */
  roll?: { decay: number };
  /** Charged Thunder Kettle: fully-charged shots detonate paint (INK NOVA synergy) */
  inkBlast?: boolean; nova?: boolean;
  /** Molasses Pot: lobbed jar that leaves a slow + damage-over-time slick */
  syrup?: boolean;
  /** defensive umbrella: orbits the player and eats incoming fire */
  brolly?: { angle: number; dist: number; spin: number };
  /** Hook & Line: flight origin for measuring the cast */
  from?: Point;
  hook?: boolean;
  /** Polka Painter: tints and marks whatever it hits */
  paintMark?: string;
  /** cream pie: blinds the creep it hits */
  pie?: boolean;
  /** Postage Stamp: tags the creep for a delayed kaboom */
  stampTag?: boolean;
  /** Ink Skunk lob: leaves a slowing ink puddle where it lands */
  ink?: boolean;
  /** reflected player-side shot */
  reflected?: boolean;
  /** Barrel Roll: distance travelled, feeds ROLLING THUNDER */
  rolled?: number;
  /** BULLET DANCE: a shot slapped back at the room by a parry */
  riposte?: boolean;
};

export type Puff = Point & { vx: number; vy: number; life: number; max: number; color: string; size: number; ring?: boolean; dead?: boolean;
  /** a brass casing: tumbles, falls, glints — the gun's receipt */
  shell?: boolean; spin?: number };
export type FloatText = Point & { text: string; life: number; max: number; color: string; rot: number; big?: boolean };
export type PickupKind = "heart" | "coin" | "bulb" | "weapon" | "rapid" | "shield" | "bomb" | "clock" | "star" | "magnet" | "wind" | "decoy" | "fireworks" | "nuke" | "goldbar"
  | "mirror" | "bees" | "grease";
export type Pickup = Point & { kind: PickupKind; life: number; phase: number; weapon?: WeaponKey; fresh?: boolean; price?: number };
export type Puddle = Point & { r: number; life: number; max: number; kind: "tar" | "web" | "ice" | "fire" | "decoy" | "geyser" | "syrup" | "grease" | "ink" | "crater" };
export type Ghost = Point & { vx: number; life: number; color: string; size: number; phase: number };

/** A loyal rubber-hose hound summoned by the Dog Whistle (or a bee from the Jar of Bees). */
export type Companion = Point & { vx: number; vy: number; target: number; bite: number; life: number; max: number; facing: number; hop: number; dmg: number; bee?: boolean };

export type StagePlatform = { x: number; y: number; w: number; h: number; kind: "train" | "cloud" | "cart" | "raft" | "plank"; vx: number };
export type StageHazard = {
  x: number; y: number; r: number; kind: HazardKind; timer: number; active: boolean;
  /** 0..1 telegraph progress so the player can read the threat before it bites */
  warn: number; life: number; max: number; angle: number; pivot?: Point; arm?: number; vy?: number; phase?: number; hit?: boolean;
};

export type ShopItem = { id: string; name: string; desc: string; price: number; icon: string; bought: boolean; kind: "weapon" | "charm" | "heart" | "super" | "upgrade"; weaponKey?: WeaponKey; charmKey?: CharmKey; upgradeId?: string };

export type Player = Point & {
  r: number; health: number; maxHealth: number; invuln: number; speed: number; damage: number; angle: number; facing: number;
  dashTime: number; dashCd: number; dashDir: Point; charge: number; squash: number; parryFlash: number; cards: number;
  moving: boolean; superTime: number; fireRate: number; dashCdMult: number; magnet: number; cardGain: number; crit: number;
  regen: number; extraShots: number; scoreMult: number; trail: Point[]; parryCd: number; rapid: number; shield: number; blink: number;
  star: number; clock: number; magnetBoost: number; webbed: number; rhythm: number; wind: number; burning: number;
  coins: number; comboStreak: number;
  character: CharacterKey;
  /** which outfit the cast member is wearing (Skin id; "" = the house look) */
  skin: string;
  /** footstep dust clock */
  step: number;
  /** Slippery Glaze: how much momentum the player is carrying (0 = full control) */
  momentum: number; mx: number; my: number;
  mirror: number; bees: number; grease: number;
  /** skunk ink / spilled tome: temporary move-slow */
  gunk: number;
  /** Hook & Line: while set, the player is reeled toward the point */
  grapple: { tx: number; ty: number; t: number } | null;
  shieldTimer: number; anim: number; recoil: number; runCycle: number;
  /** Trigger buffer, in seconds. A press that lands during hit-stop, a dash, or the last frames
   *  of a weapon's cooldown is remembered here instead of being thrown away — this is the reason
   *  a shot always comes out when the player asks for one. */
  trigger: number;
};

export type Input = {
  mx: number; my: number; aim: Point | null; fire: boolean; dash: boolean; parry: boolean; ex: boolean; superMove: boolean;
  autoFire: boolean; swap: boolean; interact: boolean;
};

export type Modifier = { id: "pink" | "double" | "coins" | "fog" | "giant" | "meteor" | "blackwhite" | "rain" | "swarm"; name: string; sub: string; time: number };

export type GameState = {
  player: Player;
  enemies: Enemy[]; bullets: Bullet[]; puffs: Puff[]; texts: FloatText[]; pickups: Pickup[]; puddles: Puddle[]; ghosts: Ghost[];
  platforms: StagePlatform[]; hazards: StageHazard[]; companions: Companion[];
  score: number; kills: number; parries: number; damageTaken: number; level: number; combo: number; comboTime: number;
  elapsed: number; spawn: number; shot: number; id: number; shake: number; nextUpgrade: number;
  weapons: [WeaponKey, WeaponKey]; active: 0 | 1; charm: CharmKey; boss: Enemy | null; bossTimer: number; bossesBeaten: number;
  announce: { title: string; sub: string; life: number } | null; over: boolean; upgradeReady: boolean; flash: number;
  slowmo: number; hitstop: number; biome: number; upgrades: Record<string, number>; events: string[]; bulbTimer: number; maxCombo: number;
  crateTimer: number; modifier: Modifier | null; modTimer: number;
  /** viewport in CSS px — what the canvas actually shows */
  viewW: number; viewH: number;
  /** the map: a grid of `districts` viewports across by `rows` down, one biome each */
  worldW: number; districts: number; worldH: number; rows: number;
  /** which tile of that grid the camera is standing in (hysteresis lives here, not in `biome`) */
  tCol: number; tRow: number;
  /** which authored map this run is walking — see src/game/world.ts */
  map: MapId;
  /** the screen under your feet: its name, its light, its set dressing (null on the arena) */
  stage: StageDef | null;
  /** left edge of the viewport, in world x */
  cam: Point;
  /** the district the seam is dissolving into, and how far across the seam we are (0..1) */
  biomeNext: number; biomeMix: number;
  /** Jackpot Slots: spins since the last jackpot — the pity counter */
  slotPity: number;
  /** the last thing that took a hit off you — the gameover letter names it */
  lastThreat: string;
  /** Daily seeded reel: fixed biome order + one modifier all run */
  dailyOrder?: number[]; dailySeed?: number;
  /** Active run mode + its goal state */
  mode: Mode;
  /** BULLET DANCE: parry streak, the best streak so far, and the heat it buys */
  dance: { streak: number; best: number; heat: number; riposte: number };
  /** Mode clocks: ON THE BEAT band time, BLACKOUT light radius */
  beatT: number; onBeat: boolean;
  lightR: number;
  /** BLACKOUT: how far the light has dimmed since the last bulb */
  bulbPulse: number;
  stats: { shots: number; hits: number; byWeapon: Partial<Record<WeaponKey, number>> }; unlocks: WeaponKey[]; found: WeaponKey[]; cratesOpened: number;
  wave: number; waveTimer: number; waveKind: string | null; lowFx: boolean; fxBudget: number; revives: number; fireworks: number;
  shopOpen: boolean; shopNpc: { x: number; y: number; active: boolean; talkTimer: number } | null; shopItems: ShopItem[];
  bossIntro: { name: string; title: string; quote: string; life: number } | null;
  hazardTimer: number; hazardKind: HazardKind | null;
};
