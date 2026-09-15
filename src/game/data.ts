import type { CharmKey, CharacterKey, EnemyKind, HazardKind, WeaponKey } from "./types";

export type WeaponDef = {
  name: string; blurb: string; trait: string; ex: string; exDesc: string; rate: number; damage: number; speed: number;
  color: string; spread: number; shots: number; power: number; pace: number; range: number; icon: string; starter: boolean;
};

export const WEAPONS: Record<WeaponKey, WeaponDef> = {
  popper: { name: "Pepper Popper", blurb: "Dependable bank shots that punch through a target and ricochet off the walls.", trait: "PIERCE + RICOCHET \u00b7 BANKING BUILDS", ex: "Mega Pop", exDesc: "A colossal slow shell that bores through every creep in its path.", rate: 190, damage: 24, speed: 820, color: "#ffd75a", spread: .02, shots: 1, power: 2, pace: 4, range: 5, icon: "M9 14h37l8 8-9 7H31l-3 11H14l4-16H9Z", starter: true },
  choir: { name: "Gravel Choir", blurb: "A six-note blast at close range that hurls creeps backwards.", trait: "KNOCKBACK CONE \u00b7 WALL SLAMS", ex: "Eight-Way", exDesc: "Eight piercing spikes burst out in every direction.", rate: 600, damage: 12, speed: 720, color: "#ff8b5c", spread: .5, shots: 6, power: 5, pace: 2, range: 1, icon: "m6 20 43-9 8 7-44 11Zm25 4 10 14H29l-8-12M48 11l4-6", starter: true },
  note: { name: "Blue Note", blurb: "Living sparks that seek their prey and hop to the next.", trait: "HOMING + CHAIN", ex: "Chaos Halo", exDesc: "Six spectral notes orbit you, singeing anything that steps close.", rate: 150, damage: 13, speed: 600, color: "#74e6ff", spread: .14, shots: 1, power: 2, pace: 4, range: 4, icon: "m15 39 29-29 8 8-30 22ZM47 3v8m10 2h-8m4-7-6 6", starter: true },
  mortar: { name: "Moon Mortar", blurb: "A heavy moon shell that ricochets and cracks open in a huge blast.", trait: "BOUNCING SPLASH \u00b7 LEAVES CRATERS", ex: "Kablooey", exDesc: "One enormous shell with a screen-rattling blast radius.", rate: 940, damage: 60, speed: 400, color: "#d9a8ff", spread: .02, shots: 1, power: 5, pace: 1, range: 3, icon: "M7 23h35l11 9H18Zm15 12a7 7 0 1 0 0-1zm25 0a7 7 0 1 0 0-1zM14 22l4-13 25 4-2 10", starter: true },
  halo: { name: "Tin Halo", blurb: "A whirling boomerang that slices out and slices back home.", trait: "BOOMERANG · TWO HITS", ex: "Buzzsaw", exDesc: "A roaming saw blade that bounces around the whole stage.", rate: 540, damage: 30, speed: 660, color: "#c8f26a", spread: 0, shots: 1, power: 3, pace: 3, range: 3, icon: "M12 8c12-6 30-4 40 6-4 8-14 10-20 9-3 8-12 14-22 12 6-4 4-14 2-27Z", starter: true },
  kettle: { name: "Thunder Kettle", blurb: "Hold to boil, release to strike. A fully charged bolt splits the room.", trait: "HOLD TO CHARGE", ex: "Radial Blast", exDesc: "A concussive shockwave erupts around you, flinging creeps away.", rate: 140, damage: 12, speed: 900, color: "#ffe05e", spread: 0, shots: 1, power: 5, pace: 2, range: 4, icon: "M8 26 26 6l-4 13h14L18 40l4-12H8Zm34-14 12 6-8 8", starter: false },
  shard: { name: "Sugar Shard", blurb: "A crystal that flies straight, then shatters into aimed slivers.", trait: "SPLIT + SEEK", ex: "Sentry Star", exDesc: "Plant a twinkling turret that peppers the nearest creep.", rate: 300, damage: 40, speed: 700, color: "#ff7ad9", spread: .02, shots: 1, power: 4, pace: 3, range: 4, icon: "M32 4 46 22 32 40 18 22Zm-4 18h8m-4-6v12", starter: false },
  lobber: { name: "Tar Lobber", blurb: "Lob a bubbling tar ball over the crowd. It bursts and leaves a sticky pool that slows everything.", trait: "ARC + SLOWING POOL", ex: "Tar Pit", exDesc: "Five tar balls rain down in a ring around you.", rate: 720, damage: 52, speed: 520, color: "#6b4fbf", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M8 34c0-9 8-14 16-12l6-14 8 4-6 12c6 4 8 12 4 18-6 8-24 6-28-8Zm26-26 8-4", starter: false },
  fountain: { name: "Ink Fountain", blurb: "A short-range torrent of scalding ink. Anything soaked keeps burning.", trait: "STREAM + BURN", ex: "Ink Nova", exDesc: "A ring of ink erupts in every direction, setting the crowd alight.", rate: 48, damage: 5, speed: 340, color: "#ff6a3d", spread: .26, shots: 1, power: 3, pace: 5, range: 1, icon: "M6 22h20l10-8v20L26 26H6Zm34-6c6 2 10 6 12 12-4-2-8-2-12 0 4-4 4-8 0-12Z", starter: false },
  trio: { name: "Marquee Trio", blurb: "Three theatre beams that cross at your cursor and pierce the whole stage.", trait: "CONVERGING BEAMS", ex: "Spotlight", exDesc: "One blinding beam that cuts clean across the screen.", rate: 500, damage: 26, speed: 1150, color: "#fff0a8", spread: .3, shots: 3, power: 3, pace: 3, range: 5, icon: "M6 8 58 22 6 36Zm0 14h52", starter: false },
  cuckoo: { name: "Cuckoo Cannon", blurb: "Launches a furious little bird that hunts the biggest creep and pecks it silly.", trait: "HUNTING PET", ex: "The Flock", exDesc: "Four birds at once. Feathers everywhere.", rate: 1500, damage: 9, speed: 540, color: "#ffb347", spread: 0, shots: 1, power: 4, pace: 2, range: 5, icon: "M10 24c6-10 16-12 24-8l12-6-4 10 8 6-14 2c-6 8-18 8-26-4Zm12-2h2", starter: false },
  accordion: { name: "Squeezebox", blurb: "Twin notes that weave a wide sine-wave, sweeping everything in a broad lane.", trait: "WAVE PAIR · PIERCE", ex: "Polka Storm", exDesc: "Eight weaving notes fan out across the whole stage.", rate: 260, damage: 15, speed: 560, color: "#ff5aa5", spread: 0, shots: 1, power: 3, pace: 4, range: 4, icon: "M6 10h12v24H6Zm40 0h12v24H46ZM18 14l28 4v8l-28 4Z", starter: false },
  yoyo: { name: "Rubber Yo-Yo", blurb: "A tethered spiked ball that flies out, snaps back, and mows down anything on the string.", trait: "TETHER · MULTI-HIT", ex: "Walk the Dog", exDesc: "The yo-yo orbits you at full length for five seconds.", rate: 900, damage: 14, speed: 880, color: "#5ad1ff", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M8 22h30M38 22a10 10 0 1 0 20 0 10 10 0 1 0-20 0Zm6 0h8", starter: false },
  harp: { name: "Storm Harp", blurb: "Strum a chord of lightning that forks instantly to every creep in a cone.", trait: "INSTANT ARC · CONE", ex: "Thunderclap", exDesc: "Lightning strikes every creep on screen at once.", rate: 620, damage: 22, speed: 0, color: "#b6e4ff", spread: .55, shots: 1, power: 4, pace: 3, range: 4, icon: "M10 40 26 4h8l4 8-12 28Zm10-8 8-18m-2 20 8-18m-2 20 8-18", starter: false },
  frost: { name: "Frost Bugle", blurb: "A honk of freezing air that stops creeps solid. Frozen creeps shatter for double damage.", trait: "FREEZE \u00b7 SHATTER SHARDS", ex: "Cold Snap", exDesc: "Freezes everything within a wide radius.", rate: 420, damage: 10, speed: 480, color: "#aef1ff", spread: .32, shots: 3, power: 3, pace: 3, range: 2, icon: "M6 20h22l14-12v28L28 24H6Zm44-6 6 8-6 8", starter: false },
  quill: { name: "Inkwell Quill", blurb: "A giant fountain pen swung in a wide arc. Point blank, brutal, and every hit fills your meter fast.", trait: "MELEE ARC \u00b7 SIGNATURE FINISH", ex: "Signature", exDesc: "A full 360° flourish that knocks everything away.", rate: 380, damage: 46, speed: 0, color: "#2a2230", spread: 1.5, shots: 1, power: 5, pace: 3, range: 1, icon: "m8 36 30-30 6 2 2 6-30 30H8Zm30-24 6 6", starter: false },
  popcorn: { name: "Popcorn Popper", blurb: "Kernels skitter across the floor, then POP into a burst of four buttery shots.", trait: "DELAYED BURST", ex: "Kettle Corn", exDesc: "A dozen kernels scatter everywhere and all pop at once.", rate: 340, damage: 14, speed: 520, color: "#fff0b8", spread: .1, shots: 1, power: 4, pace: 3, range: 3, icon: "M12 20h40l-6 20H18Zm8-8a6 6 0 1 1 12 0 6 6 0 1 1 12 0", starter: false },
  trumpet: { name: "Ghost Trumpet", blurb: "A spectral note that grows as it travels and passes straight through every creep in a line.", trait: "GROWING WAVE \u00b7 CRESCENDO", ex: "Reveille", exDesc: "Three enormous notes blast out in a fan.", rate: 560, damage: 30, speed: 430, color: "#c9b8ff", spread: .02, shots: 1, power: 3, pace: 3, range: 5, icon: "M6 18h24l20-12v32L30 26H6Zm46-8 8 12-8 12", starter: false },
  mitt: { name: "Magnet Mitt", blurb: "Throws a horseshoe that yanks nearby creeps into a tight pile — then let the splash weapons do the rest.", trait: "GRAVITY WELL · SETUP", ex: "Big Pull", exDesc: "Drags every creep on the stage toward one point.", rate: 900, damage: 12, speed: 560, color: "#d84a45", spread: 0, shots: 1, power: 2, pace: 2, range: 4, icon: "M14 12v14a18 18 0 0 0 36 0V12h-10v14a8 8 0 0 1-16 0V12Z", starter: false },
  anvil: { name: "Dropping Anvil", blurb: "Whistle overhead! A massive cast iron anvil falls from the sky, flattening anything beneath.", trait: "CRUSHING OVERHEAD", ex: "Ten-Ton Stampede", exDesc: "Four enormous anvils rain across the screen at once.", rate: 1100, damage: 85, speed: 0, color: "#444b58", spread: 0, shots: 1, power: 5, pace: 1, range: 4, icon: "M6 14h52v8l-14 6-2 10H22l-2-10-14-6Z", starter: false },
  bubbles: { name: "Soap Gun", blurb: "Drifting, iridescent soap bubbles that trap creeps inside and float them upwards harmlessly.", trait: "FLOAT TRAP + POP", ex: "Giant Bubble", exDesc: "One enormous bubble that swallows whole crowds.", rate: 220, damage: 16, speed: 380, color: "#74f0ff", spread: .22, shots: 2, power: 3, pace: 4, range: 3, icon: "M12 22a10 10 0 1 0 20 0 10 10 0 1 0-20 0Zm24-6a6 6 0 1 0 12 0 6 6 0 1 0-12 0Z", starter: false },
  boombox: { name: "Brass Boombox", blurb: "Pumps out pulsing concentric bass rings that cancel enemy bullets and knock back all foes.", trait: "BULLET SHIELD + BASS", ex: "Megaphone Blast", exDesc: "A concussive screen-wide sonic boom.", rate: 480, damage: 28, speed: 500, color: "#ffd166", spread: .12, shots: 1, power: 4, pace: 3, range: 3, icon: "M8 12h48v24H8Zm12 12a6 6 0 1 0 12 0 6 6 0 1 0-12 0Zm20 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0Z", starter: false },
  peel: { name: "Slapstick Peels", blurb: "Scatter banana peels that send creeps into a spinning pratfall.", trait: "FLOOR TRAPS \u00b7 SLIP STUN", ex: "Bunch o' Peels", exDesc: "A whole crate of peels blankets the stage.", rate: 470, damage: 14, speed: 900, color: "#ffe14d", spread: .3, shots: 3, power: 3, pace: 4, range: 3, icon: "M14 30q10-14 26-10-4 8-14 10 6 2 8 8-12 4-20-8Z", starter: false },
  kazoo: { name: "Hive Kazoo", blurb: "Hum a stream of angry little bees that home in on the nearest creep.", trait: "BEE SWARM \u00b7 HOMING", ex: "Queen's Wrath", exDesc: "A monstrous swarm erupts and strips the stage bare.", rate: 340, damage: 9, speed: 520, color: "#ffd75a", spread: .35, shots: 2, power: 2, pace: 5, range: 4, icon: "M10 24h26l14-8v18l-14-8H10Zm30-2h6", starter: false },
  barrel: { name: "Barrel Roll", blurb: "Kick a rolling barrel that bowls through the crowd and detonates.", trait: "ROLLING BOMB \u00b7 GAINS WEIGHT", ex: "Powder Keg", exDesc: "Three powder kegs roll out and blow the whole floor.", rate: 780, damage: 55, speed: 640, color: "#b3672f", spread: 0, shots: 1, power: 4, pace: 2, range: 4, icon: "M12 12h40v24H12Zm0 6h40m-40 12h40M18 12v24m28-24v24", starter: false },
  phonograph: { name: "Crank Siren", blurb: "Winding siren that spins spiral projectiles outward in dizzying geometric spiral loops.", trait: "SPIRAL DANCE", ex: "Siren Song", exDesc: "Dense outward spiral of 16 cutting melody notes.", rate: 290, damage: 18, speed: 640, color: "#ff8ad3", spread: .08, shots: 2, power: 4, pace: 4, range: 4, icon: "M10 22a12 12 0 1 0 24 0 12 12 0 1 0-24 0Zm12 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0Zm16-8l16-6v28l-16-6Z", starter: false },
  syrup: { name: "Syrup Slinger", blurb: "Drench the whole stage in molasses. Everything stuck in the goo crawls at half speed.", trait: "AREA SLOW FIELD", ex: "Sticky Tsunami", exDesc: "A tidal wave of syrup coats the entire floor.", rate: 640, damage: 18, speed: 460, color: "#b97a2a", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M22 6h20l-3 10c8 6 10 18 4 24-8 8-26 8-32-2-4-6-2-14 5-20Zm-2 24c6 4 22 4 28 0", starter: false },
  whistle: { name: "Referee Whistle", blurb: "A piercing shriek that stuns every creep in a huge cone dead in their tracks.", trait: "CONE STUN \u00b7 FOULS COUNTED", ex: "Final Whistle", exDesc: "A screen-wide blast that stops time itself for three full seconds.", rate: 1500, damage: 8, speed: 0, color: "#e0e6ef", spread: 0, shots: 1, power: 3, pace: 1, range: 4, icon: "M12 20h28a14 14 0 1 1-14 14A14 14 0 0 1 12 20Zm30-8 10-4-2 10", starter: false },
  umbrella: { name: "Brolly Basher", blurb: "Spin open a bullet-proof parasol that deflects enemy fire and smacks creeps away.", trait: "DEFLECT SHIELD", ex: "Typhoon Twirl", exDesc: "The brolly becomes a spinning shield that chases creeps around.", rate: 1300, damage: 22, speed: 520, color: "#4a7fb5", spread: 0, shots: 1, power: 4, pace: 2, range: 2, icon: "M8 32a24 24 0 0 1 48 0Zm24 0v18a6 6 0 0 0 12 0", starter: false },
  grapple: { name: "Hookshot Cane", blurb: "Fire a grapple that snags the biggest creep and reels you in — or reels IT in. Contact is a free punch.", trait: "MOBILITY \u00b7 GAP CLOSER", ex: "Wrecking Ball", exDesc: "A colossal hook drags every creep on screen into one heap.", rate: 820, damage: 30, speed: 1400, color: "#c9863a", spread: 0, shots: 1, power: 3, pace: 3, range: 5, icon: "M10 12h30m-4 0a10 10 0 1 0 10 10M10 12l8-6m-8 6 8 6", starter: false },
  slots: { name: "Jackpot Slots", blurb: "Pull the lever: three spinning reels fire a random pattern of coins every spin. Cherries pay double.", trait: "GAMBIT \u00b7 REELS GET LOADED", ex: "All In", exDesc: "Spin five reels at once. The house always loses.", rate: 900, damage: 16, speed: 620, color: "#f0c24d", spread: .5, shots: 3, power: 3, pace: 3, range: 4, icon: "M8 12h48v26H8Zm12 6v14m12-14v14m12-14v14", starter: false },
  paint: { name: "Polka Paint", blurb: "Splatter creeps with glowing paint. Painted creeps take extra hurt from everything, for everyone.", trait: "MARK \u00b7 GALLERY BLEED", ex: "Fresco Frenzy", exDesc: "Paint the whole crowd at once — a gallery of targets.", rate: 520, damage: 12, speed: 560, color: "#ff5aa5", spread: .18, shots: 2, power: 2, pace: 4, range: 4, icon: "M12 10h34v14c0 8-6 10-10 14l-2 8h-8l-2-8c-6-2-12-6-12-14Zm34 2h8v8h-8", starter: false },
  pie: { name: "Cream Pie", blurb: "The classic. A soggy arc that blinds whatever it hits — creeps stumble around seeing nothing.", trait: "ARC \u00b7 BLINDS", ex: "Bakery Barrage", exDesc: "Pies rain in a whole bakery's worth of arcs.", rate: 700, damage: 34, speed: 620, color: "#ffe9c9", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M10 30c6-12 38-12 44 0l-4 6H14Zm12-14a4 4 0 1 1 8 0m6 2a3 3 0 1 1 6 0", starter: false },
  lance: { name: "The Ticket Lance", blurb: "A single punched ticket that flies the whole room, through everything standing in it.", trait: "RAIL PIERCE \u00b7 WHOLE-ROOM REACH", ex: "Last Train", exDesc: "One colossal rail that stuns and shoves everything it bores through.", rate: 700, damage: 34, speed: 1500, color: "#9ef0e6", spread: 0, shots: 1, power: 4, pace: 2, range: 5, icon: "M6 32h38l12-4-12-4H6Zm8-4v8m30-6 6 2", starter: false },
  sprinkler: { name: "The Sprinkler Saint", blurb: "Every shot opens like a garden sprinkler: ten blessed droplets and no safe side.", trait: "RADIAL BURST \u00b7 NO SAFE SIDE", ex: "Monsoon", exDesc: "Twenty-four droplets and a hard shove in every direction at once.", rate: 420, damage: 11, speed: 620, color: "#7ad9ff", spread: 0, shots: 1, power: 3, pace: 3, range: 2, icon: "M32 6v12m0 0-16 26m16-26 16 26m-16-26v28M16 18a16 16 0 0 1 32 0", starter: false },
  candle: { name: "Vigil Candle", blurb: "Sets a candle on the boards. Its flame keeps biting anything that walks through the light.", trait: "PLACED FLAME \u00b7 AREA DENIAL", ex: "Last Rites", exDesc: "Three candles in a fan ahead of you, burning long and wide.", rate: 900, damage: 16, speed: 300, color: "#ffd98a", spread: 0, shots: 1, power: 3, pace: 1, range: 2, icon: "M28 22h8v24h-8Zm4-4c3-4 3-8 0-11-3 3-3 7 0 11Zm-10 28h20", starter: false },
  stamp: { name: "Postage Stamp", blurb: "Mail a stamped envelope that sticks to a creep — then detonates for a parcel-sized kaboom.", trait: "STICKY BOMB \u00b7 DELAYED", ex: "Special Delivery", exDesc: "Five stamps, five parcels, one very loud post office.", rate: 640, damage: 26, speed: 540, color: "#7ec47e", spread: .06, shots: 1, power: 3, pace: 3, range: 4, icon: "M10 12h44v26H10Zm4 4v18m36-18v18M10 16l44 18M54 16 10 34", starter: false },
};
export const WEAPON_KEYS = Object.keys(WEAPONS) as WeaponKey[];
export const STARTER_WEAPONS = WEAPON_KEYS.filter((k) => WEAPONS[k].starter);

export const CHARMS: Record<CharmKey, { name: string; desc: string; color: string; icon: string }> = {
  locket: { name: "Heart Locket", desc: "+40 max gumption, but shots hit 12% softer.", color: "#e85a5a", icon: "M32 40S12 28 12 16a9 9 0 0 1 20-5 9 9 0 0 1 20 5c0 12-20 24-20 24Z" },
  smoke: { name: "Smoke Bomb", desc: "Dashing makes you fully untouchable and recharges faster.", color: "#9fa7b8", icon: "M14 34c-8 0-8-12 0-12 0-10 16-12 20-4 8-4 18 2 14 10 8 0 8 12 0 12H14Z" },
  coffee: { name: "Hot Coffee", desc: "Your super meter brews on its own over time.", color: "#c58a4a", icon: "M10 14h32v14a12 12 0 0 1-24 0Zm32 4h6a6 6 0 0 1 0 12h-6M8 40h36" },
  sugar: { name: "Parry Sugar", desc: "Pink things near you are parried automatically.", color: "#ff8ad3", icon: "M32 6 42 22 32 38 22 22Zm-16 8 6 8-6 8-6-8Zm32 0 6 8-6 8-6-8Z" },
  penny: { name: "Lucky Penny", desc: "+40% score, more coins, and prize crates arrive sooner.", color: "#f0c24d", icon: "M32 6a16 16 0 1 0 0 32 16 16 0 0 0 0-32Zm0 8v16m-5-12h10m-10 8h10" },
  metronome: { name: "Metronome", desc: "Every 4th shot is a critical hit. Rhythm is everything.", color: "#8fd15a", icon: "M20 40 26 6h12l6 34Zm12-30v22M32 12l14-4" },
  wind: { name: "Second Wind", desc: "Get back up once per run with half gumption and a shockwave.", color: "#74e6ff", icon: "M8 22c8-10 20-10 28 0s20 10 28 0M10 34c6-6 14-6 20 0s14 6 20 0" },
  clover: { name: "Four-Leaf Clover", desc: "Shop items are 30% cheaper and crates contain better armaments.", color: "#6fe08a", icon: "M32 20a8 8 0 1 0-8-8 8 8 0 0 0 8 8zm0 0a8 8 0 1 0 8-8 8 8 0 0 0-8 8zm0 0a8 8 0 1 0-8 8 8 8 0 0 0 8-8zm0 0a8 8 0 1 0 8 8 8 8 0 0 0-8-8zm0 8v14" },
  magneto: { name: "Magnetic Boots", desc: "Magnet strength tripled; draw all coins and hearts effortlessly.", color: "#d95a53", icon: "M16 12v16a16 16 0 0 0 32 0V12h-8v16a8 8 0 0 1-16 0V12Z" },
  thimble: { name: "Steel Thimble", desc: "Start every run with one extra shield pip that refills slowly.", color: "#b8c4d8", icon: "M20 14h24v18a12 12 0 0 1-24 0Zm6 4h12m-12 6h12" },
  pepper: { name: "Pepper Shaker", desc: "Shots set creeps alight. Burning creeps keep hurting.", color: "#ff6a3d", icon: "M24 10h16l4 12v16a6 6 0 0 1-6 6h-12a6 6 0 0 1-6-6V22Zm2-4h12M30 6h4" },
  spurs: { name: "Tap Shoes", desc: "Dashing hurts creeps in a wide arc and leaves you briefly light-footed.", color: "#8fd15a", icon: "M14 12h26l14 20H30l-4 12h-8l4-12H14Zm8 8h10" },
  varnish: { name: "Wet Varnish", desc: "Paint marks last twice as long, and marked creeps hurt 50% extra instead of 35%.", color: "#ff5aa5", icon: "M14 10h36v12H32l-4 16h-8l4-16H14Z" },
};
export const CHARM_KEYS = Object.keys(CHARMS) as CharmKey[];

export type CharacterDef = {
  name: string; title: string; desc: string; trait: string; color: string; accent: string; icon: string;
  speed: number; damage: number; health: number; radius: number; fireRate: number; dashCdMult: number; shield: number;
  power: number; pace: number; grit: number;
};

export const CHARACTERS: Record<CharacterKey, CharacterDef> = {
  milo: { name: "Milo Marlowe", title: "The Everyman", desc: "No bad days, no bad shots. The rubber-hose hero who started it all.", trait: "BALANCED", color: "#e8b88a", accent: "#d84a45", icon: "M22 12h20l2 12H20Zm2 16h16v16H24Z", speed: 1, damage: 1, health: 1, radius: 1, fireRate: 1, dashCdMult: 1, shield: 0, power: 3, pace: 3, grit: 3 },
  dixie: { name: "Dixie Dazzle", title: "The Firecracker", desc: "Blistering pace and a hair-trigger finger. One stiff breeze could fold her.", trait: "SPEED \u00b7 GLASS CANNON", color: "#f2c9a0", accent: "#ff5aa5", icon: "M18 16q14-10 28 0l-4 20H22Zm4 22h18l-4 12H26Z", speed: 1.26, damage: 1, health: .75, radius: .92, fireRate: 1.16, dashCdMult: .78, shield: 0, power: 2, pace: 5, grit: 1 },
  barnaby: { name: "Barnaby Brawn", title: "The Strongman", desc: "A walking brick wall who hits like a freight train \u2014 and winds up like one, too.", trait: "TANK \u00b7 HEAVY HITTER", color: "#d9a06a", accent: "#4a7fb5", icon: "M16 14h32v26H16Zm-6 4h8v14h-8Zm42 0h8v14h-8Z", speed: .82, damage: 1.22, health: 1.55, radius: 1.2, fireRate: .92, dashCdMult: 1.2, shield: 1, power: 5, pace: 1, grit: 5 },
  coco: { name: "Coco Cabaret", title: "The Diva", desc: "Every exit a grand exit. Hits like a falling chandelier \u2014 and tires like one too.", trait: "BURST \u00b7 HIGH DRAMA", color: "#e8c0a0", accent: "#8a4fd0", icon: "M32 8q14 10 12 26l-12 22-12-22Q18 18 32 8Zm-8 20h16", speed: .94, damage: 1.2, health: .88, radius: .98, fireRate: .82, dashCdMult: 1.08, shield: 0, power: 5, pace: 2, grit: 2 },
  rusty: { name: "Rusty Rivet", title: "The Tinker", desc: "Half mechanic, half menace. Keeps a spare plate bolted to the back, just in case.", trait: "SHIELD \u00b7 FAST HANDS", color: "#d8b090", accent: "#4a8f6a", icon: "M40 12a10 10 0 0 0-12 12L12 40l8 8 16-16a10 10 0 0 0 12-12l-6 6-6-2-2-6Z", speed: 1.02, damage: .9, health: 1.05, radius: 1.02, fireRate: 1.12, dashCdMult: .92, shield: 1, power: 2, pace: 4, grit: 4 },
};

/** One outfit per row: a skin recolours the head, the clothes, the hat and its detail.
 *  `house` is always the look the show shipped with; `encore` is the gold ticket (beat a boss). */
export type Skin = { id: string; name: string; head: string; accent: string; trim: string; detail: string; port: string; encore?: boolean };
export const SKINS: Record<CharacterKey, Skin[]> = {
  milo: [
    { id: "house", name: "HOUSE RED", head: "#fbf6ea", accent: "#d84a45", trim: "#d84a45", detail: "#f2c14e", port: "#e8b88a" },
    { id: "matinee", name: "MATINEE", head: "#fbf6ea", accent: "#2a7f8f", trim: "#1f5f6f", detail: "#ffd166", port: "#e8c8a0" },
    { id: "inkrain", name: "INK & RAIN", head: "#dcd6ea", accent: "#3a3550", trim: "#262138", detail: "#8de1d4", port: "#b8b0c8" },
    { id: "encore", name: "GOLD REEL", head: "#fdf3d8", accent: "#a8760b", trim: "#6b4e0a", detail: "#ffe27a", port: "#e8c878", encore: true },
  ],
  dixie: [
    { id: "house", name: "HOUSE PINK", head: "#fbf6ea", accent: "#ff5aa5", trim: "#ff5aa5", detail: "#74e6ff", port: "#f2c9a0" },
    { id: "swan", name: "SWAN LAKE", head: "#fbf6ea", accent: "#e8e4f0", trim: "#b8b4cc", detail: "#ff8ad3", port: "#f0dcc0" },
    { id: "vesper", name: "VESPER", head: "#e8d8f0", accent: "#6a3d9a", trim: "#4a2a70", detail: "#ffd166", port: "#c8a8d8" },
    { id: "encore", name: "MARQUEE GOLD", head: "#fdf3d8", accent: "#b8860b", trim: "#7a5a06", detail: "#ffe27a", port: "#e8c878", encore: true },
  ],
  barnaby: [
    { id: "house", name: "HOUSE BLUE", head: "#fbf6ea", accent: "#4a7fb5", trim: "#3a3038", detail: "#d84a45", port: "#d9a06a" },
    { id: "dockside", name: "DOCKSIDE", head: "#f0e4d0", accent: "#35655a", trim: "#243832", detail: "#e8b34a", port: "#c89868" },
    { id: "ashember", name: "ASH & EMBER", head: "#e8dcd0", accent: "#7a4034", trim: "#402420", detail: "#ff8c4a", port: "#b88460" },
    { id: "encore", name: "GILDED STRONGMAN", head: "#fdf3d8", accent: "#8a6a10", trim: "#4a3a08", detail: "#ffe27a", port: "#d8b060", encore: true },
  ],
  coco: [
    { id: "house", name: "HOUSE VIOLET", head: "#fbf6ea", accent: "#8a4fd0", trim: "#5a2f8a", detail: "#ffd166", port: "#e8c0a0" },
    { id: "opening", name: "OPENING NIGHT", head: "#fbf6ea", accent: "#c22a5a", trim: "#7a1030", detail: "#ffd7f0", port: "#f0c8a8" },
    { id: "greenroom", name: "GREEN ROOM", head: "#e8f0e0", accent: "#3f7a4a", trim: "#264a2c", detail: "#f2c14e", port: "#c0d0a8" },
    { id: "encore", name: "STANDING OVATION", head: "#fdf3d8", accent: "#a8760b", trim: "#5a4008", detail: "#ffe27a", port: "#e8c878", encore: true },
  ],
  rusty: [
    { id: "house", name: "HOUSE GREEN", head: "#fbf6ea", accent: "#4a8f6a", trim: "#2f5a44", detail: "#f2c14e", port: "#d8b090" },
    { id: "oilslick", name: "OIL SLICK", head: "#d8d4cc", accent: "#3a3a44", trim: "#22222a", detail: "#8de1d4", port: "#a8a49c" },
    { id: "copper", name: "COPPER HEAD", head: "#f0d8c0", accent: "#b06030", trim: "#6a3418", detail: "#ffd166", port: "#c89068" },
    { id: "encore", name: "BRASS WORKS", head: "#fdf3d8", accent: "#8a6a10", trim: "#4a3a08", detail: "#ffe27a", port: "#d8b060", encore: true },
  ],
};
export const skinFor = (k: CharacterKey, id: string | undefined): Skin => {
  const list = SKINS[k] ?? SKINS.milo;
  return list.find((s) => s.id === id) ?? list[0];
};
export const CHARACTER_KEYS = Object.keys(CHARACTERS) as CharacterKey[];

export const ENEMIES: Record<EnemyKind, { name: string; hp: number; r: number; speed: number; score: number; contact: number; unlock: number; weight: number; color: string; note: string }> = {
  daisy: { name: "Grinning Bloom", hp: 30, r: 16, speed: 92, score: 80, contact: 10, unlock: 0, weight: 3, color: "#ff9a3c", note: "Swarms in wobbly zig-zags" },
  gloop: { name: "Gloop", hp: 46, r: 19, speed: 120, score: 90, contact: 9, unlock: 0, weight: 2, color: "#5aa8ff", note: "Bounces off walls · splits when popped" },
  wisp: { name: "Cackle Wisp", hp: 26, r: 15, speed: 110, score: 110, contact: 14, unlock: 14, weight: 2, color: "#8de1d4", note: "Blinks beside you, then lunges" },
  jack: { name: "Jack-in-the-Bonk", hp: 40, r: 17, speed: 0, score: 120, contact: 16, unlock: 22, weight: 1.5, color: "#e8c34a", note: "Sits still · springs at you when you get close" },
  bloat: { name: "Bloat Face", hp: 22, r: 18, speed: 46, score: 100, contact: 10, unlock: 28, weight: 2, color: "#7ec8ff", note: "Bursts into bullets when shot · parry the pink ones" },
  eel: { name: "Ink Eel", hp: 70, r: 14, speed: 150, score: 160, contact: 9, unlock: 36, weight: 1.4, color: "#3d3a6e", note: "Long serpent · circles you · only the head takes damage" },
  toad: { name: "Toad Tenor", hp: 52, r: 20, speed: 62, score: 130, contact: 10, unlock: 42, weight: 1.6, color: "#8fc45a", note: "Keeps its distance · three-note volleys" },
  spider: { name: "Sock Spider", hp: 48, r: 18, speed: 84, score: 130, contact: 11, unlock: 50, weight: 1.4, color: "#6d5a8a", note: "Lays sticky webs that root you in place" },
  cap: { name: "Murder Cap", hp: 64, r: 19, speed: 0, score: 140, contact: 8, unlock: 58, weight: 1.1, color: "#e0463b", note: "Hides under its cap · spore rings" },
  mime: { name: "Mime Mister", hp: 44, r: 17, speed: 105, score: 150, contact: 13, unlock: 66, weight: 1.3, color: "#e9e4dc", note: "Invisible until close · mirrors your movement" },
  nut: { name: "Drop Nut", hp: 44, r: 17, speed: 72, score: 120, contact: 12, unlock: 76, weight: 1.3, color: "#b8763a", note: "Falls from above · watch the shadow" },
  bell: { name: "Bellhop", hp: 90, r: 21, speed: 40, score: 190, contact: 10, unlock: 84, weight: .9, color: "#f0b24a", note: "Rings a bell: nearby creeps go fast and mean · kill it first" },
  lugger: { name: "Barrel Bruiser", hp: 120, r: 28, speed: 50, score: 200, contact: 26, unlock: 92, weight: 1, color: "#b3672f", note: "Winds up, then charges" },
  hex: { name: "Top Hat Hex", hp: 58, r: 19, speed: 0, score: 170, contact: 12, unlock: 100, weight: 1, color: "#8b5fc7", note: "Teleports · homing rings" },
  ghoul: { name: "Sheet Ghoul", hp: 56, r: 18, speed: 70, score: 170, contact: 12, unlock: 104, weight: 1.2, color: "#cfd6e2", note: "Gets back up once · finish it again fast" },
  turret: { name: "Peeping Cannon", hp: 110, r: 22, speed: 0, score: 210, contact: 10, unlock: 112, weight: .8, color: "#5c6b8a", note: "Stationary · draws a laser line, then fires down it" },
  candle: { name: "Candle Kid", hp: 38, r: 16, speed: 118, score: 130, contact: 12, unlock: 32, weight: 1.4, color: "#ffd166", note: "Runs in loops · leaves a burning trail you must not touch" },
  puppet: { name: "String Puppet", hp: 60, r: 18, speed: 0, score: 150, contact: 14, unlock: 46, weight: 1.2, color: "#c97a5a", note: "Hangs from the rafters · swings, then drops on you" },
  twin: { name: "Ink Blot Twins", hp: 52, r: 15, speed: 80, score: 180, contact: 10, unlock: 70, weight: .9, color: "#2f3d7a", note: "Come as a pair · the ink rope between them stings" },
  phono: { name: "Gramophone Gus", hp: 96, r: 22, speed: 30, score: 200, contact: 10, unlock: 98, weight: .8, color: "#c9863a", note: "Plays expanding sound rings · every 3rd ring is pink" },
  mirror: { name: "Mirror Mask", hp: 74, r: 19, speed: 64, score: 190, contact: 12, unlock: 108, weight: .9, color: "#b8d8e8", note: "Front-facing mirror bounces your shots back · hit it from behind" },
  clown: { name: "Carnival Unicycle", hp: 68, r: 18, speed: 135, score: 175, contact: 14, unlock: 88, weight: 1.1, color: "#ff5964", note: "Juggles bowling pins into high arcing trajectories" },
  bat: { name: "Belfry Flapper", hp: 32, r: 15, speed: 125, score: 115, contact: 10, unlock: 20, weight: 1.7, color: "#473b66", note: "Flies high, swoops down fast at player angle" },
  skeleton: { name: "Clicky Bones", hp: 80, r: 20, speed: 75, score: 185, contact: 12, unlock: 115, weight: .9, color: "#e5dec9", note: "Hurls rib bones that boomerang backward" },
  totem: { name: "Steam Totem", hp: 130, r: 24, speed: 0, score: 220, contact: 15, unlock: 120, weight: .7, color: "#8c654f", note: "Erupts high pressure scalding steam clouds" },
  siren: { name: "Harbor Siren", hp: 90, r: 19, speed: 80, score: 200, contact: 14, unlock: 130, weight: 1, color: "#4fc3a1", note: "Sings up a shimmering sound shield \u00b7 break it first" },
  chef: { name: "Fry-Cook Fiend", hp: 100, r: 21, speed: 70, score: 205, contact: 14, unlock: 140, weight: 1, color: "#f0e4d0", note: "Lobs sizzling pans and flaming souffles" },
  balloon: { name: "Balloon Baron", hp: 70, r: 23, speed: 55, score: 190, contact: 12, unlock: 150, weight: 1.1, color: "#ff6a9d", note: "Floats high and drops bomb-balloons \u00b7 pops in confetti" },
  organ: { name: "Pipe Organist", hp: 165, r: 24, speed: 26, score: 260, contact: 16, unlock: 170, weight: .7, color: "#c9863a", note: "Plays crushing chords of solid sound" },
  disco: { name: "Disco Destroyer", hp: 120, r: 22, speed: 78, score: 230, contact: 15, unlock: 180, weight: .9, color: "#c0c8e8", note: "Mirror ball \u00b7 your shots bounce off its facets \u00b7 hit the gaps" },
  skunk: { name: "Inkwell Skunk", hp: 70, r: 17, speed: 105, score: 210, contact: 12, unlock: 190, weight: 1.1, color: "#5a5a6e", note: "Sprays sticky ink puddles that gunk you up" },
  strong: { name: "Strongman Slugger", hp: 340, r: 30, speed: 46, score: 320, contact: 28, unlock: 200, weight: .6, color: "#c96a3a", note: "Winds up a barbell haymaker \u00b7 the ring warns you" },
  usher: { name: "Theatre Usher", hp: 90, r: 18, speed: 95, score: 240, contact: 13, unlock: 210, weight: 1, color: "#6e8a5a", note: "Phases through everything \u00b7 sweeps a flashlight beam" },
  magnet: { name: "Magnet Maestro", hp: 150, r: 22, speed: 40, score: 280, contact: 14, unlock: 220, weight: .7, color: "#d84a45", note: "Its horseshoe crown bends your shots away \u00b7 flank it" },
  cutpurse: { name: "The Card Sharp", hp: 62, r: 16, speed: 205, score: 320, contact: 6, unlock: 70, weight: .8, color: "#ff5aa5", note: "Snatches your super cards and bolts for the exits \u00b7 knock him over to get them back" },
  bellhop: { name: "Bellhop Bolt", hp: 110, r: 19, speed: 118, score: 280, contact: 11, unlock: 95, weight: .8, color: "#74e6ff", note: "Tethers a shield onto the biggest creep in the room \u00b7 cut the line first" },
  drover: { name: "Crowd Drover", hp: 150, r: 22, speed: 128, score: 250, contact: 8, unlock: 130, weight: .8, color: "#8fd15a", note: "Never touches you \u00b7 herds the whole cast into your face" },
  lancer: { name: "Marquee Deadeye", hp: 95, r: 20, speed: 74, score: 290, contact: 9, unlock: 150, weight: .7, color: "#ffd166", note: "Paints a light-rail, then fires it clean across the stage and off the walls" },
  janitor: { name: "The Stagehand", hp: 120, r: 20, speed: 150, score: 260, contact: 7, unlock: 175, weight: .7, color: "#cfd6e2", note: "Sweeps up your pickups and puddles before you can reach them" },
  hooker: { name: "The Press Agent", hp: 130, r: 21, speed: 88, score: 310, contact: 13, unlock: 200, weight: .7, color: "#b8672f", note: "Reels YOU across the stage \u00b7 step out of the line and his hook comes up empty" },
  boss: { name: "The Ringmaster", hp: 1200, r: 50, speed: 38, score: 2500, contact: 30, unlock: 9999, weight: 0, color: "#d64545", note: "Multi-phase cartoon titan with dramatic transformations" },
};
export const ENEMY_KEYS = (Object.keys(ENEMIES) as EnemyKind[]).filter((k) => k !== "boss");

export const BOSS_NAMES = [
  { name: "The Ringmaster", title: "Carnival Sovereign of Ink", quote: "Step right up, kiddo... into yer grave!" },
  { name: "Duke Coffin", title: "Baron of the Graveyard Rail", quote: "Six feet under is room service!" },
  { name: "Madame Marmalade", title: "Queen of the Sugar Bayou", quote: "Sweet as sugar, sharp as a razor!" },
  { name: "Baron Von Bellows", title: "Lord of the Clockwork Attic", quote: "Yer time ran out five minutes ago!" },
];

export type Biome = {
  name: string; skyTop: string; skyBottom: string; far: string; mid: string; ground: string; groundDark: string; accent: string;
  decor: "grotto" | "moor" | "carnival" | "frost" | "swamp" | "clock" | "train" | "crypt" | "inferno" | "rooftop" | "library";
  hazardName: string; platformType?: "train" | "cloud" | "cart" | "raft";
  hazard: HazardKind | "platform"; hazardEvery: number; hazardTip: string;
};

export const BIOMES: Biome[] = [
  { name: "Cinder Grotto", skyTop: "#2b1a30", skyBottom: "#5a2c44", far: "#3d2340", mid: "#66334a", ground: "#7a4048", groundDark: "#5f3040", accent: "#ff8c4a", decor: "grotto", hazardName: "Lava Gouts", hazard: "lava", hazardEvery: 6, hazardTip: "Fire pillars erupt from warning circles — keep moving." },
  { name: "Moonlit Moor", skyTop: "#0f1f33", skyBottom: "#27485c", far: "#17303f", mid: "#22454f", ground: "#3a6560", groundDark: "#2b4f4c", accent: "#bfe9c8", decor: "moor", hazardName: "Moor Fog & Will-o-Wisps", hazard: "wisp", hazardEvery: 4.5, hazardTip: "Will-o'-wisps drift in and hunt you — don't stand still." },
  { name: "Crooked Carnival", skyTop: "#2c1633", skyBottom: "#6a2d55", far: "#4a2247", mid: "#7e3a5a", ground: "#a85c58", groundDark: "#8a4649", accent: "#ffd166", decor: "carnival", hazardName: "Carnival Spinners", hazard: "spinner", hazardEvery: 5, hazardTip: "Buzzsaw wheels sweep the floor — hop the gaps." },
  { name: "Phantom Express", skyTop: "#111822", skyBottom: "#243242", far: "#182430", mid: "#2d3d4e", ground: "#414f5e", groundDark: "#27323f", accent: "#8be9fd", decor: "train", hazardName: "Rushing Railway Platforms", platformType: "train", hazard: "platform", hazardEvery: 3.5, hazardTip: "Freight carts barrel through — ride them or dodge them." },
  { name: "Frostbite Rail", skyTop: "#12213a", skyBottom: "#3c6486", far: "#22384f", mid: "#3d5c74", ground: "#5f7a8a", groundDark: "#4a6273", accent: "#c7f0ff", decor: "frost", hazardName: "Slippery Glaze", hazard: "glaze", hazardEvery: 5, hazardTip: "Ice patches make everything slide — mind your momentum." },
  { name: "Sugar Swamp", skyTop: "#2f1d3a", skyBottom: "#7a3f6e", far: "#4d2a55", mid: "#7a4670", ground: "#6f8a5a", groundDark: "#56704a", accent: "#ff9fd6", decor: "swamp", hazardName: "Tar Geysers", hazard: "geyser", hazardEvery: 4, hazardTip: "Tar geysers erupt with little warning — watch the bubbles." },
  { name: "Clockwork Attic", skyTop: "#241a14", skyBottom: "#5a3d26", far: "#3a2a1c", mid: "#6b4a2c", ground: "#8a6a3e", groundDark: "#6a4f2e", accent: "#f2c14e", decor: "clock", hazardName: "Swinging Pendulums", hazard: "pendulum", hazardEvery: 5, hazardTip: "Pendulums sweep the whole stage — time your dashes." },
  { name: "Boneyard Crypt", skyTop: "#15101f", skyBottom: "#2e233d", far: "#20172e", mid: "#3e2f52", ground: "#53426b", groundDark: "#372a47", accent: "#bd93f9", decor: "crypt", hazardName: "Rising Tombstones", hazard: "tomb", hazardEvery: 5.5, hazardTip: "Tombstones rise and stay up — mind the new terrain." },
  { name: "Devil's Inferno", skyTop: "#330a0d", skyBottom: "#66181f", far: "#481216", mid: "#7a2228", ground: "#8c2e2e", groundDark: "#5c1d1d", accent: "#ff5555", decor: "inferno", hazardName: "Brimstone Fire Pillars", hazard: "pillar", hazardEvery: 4, hazardTip: "Inferno pillars come twice as fast. The floor IS the fight." },
  { name: "Midnight Rooftops", skyTop: "#0a1018", skyBottom: "#1c2c44", far: "#141e2e", mid: "#243448", ground: "#3a4a5e", groundDark: "#26303e", accent: "#ffe9a8", decor: "rooftop", hazardName: "Storm Lightning", hazard: "bolt", hazardEvery: 4.5, hazardTip: "Lightning strikes where the shadow falls — vacate the circle." },
  { name: "Forbidden Library", skyTop: "#1c140e", skyBottom: "#3c2a1a", far: "#2a1e12", mid: "#4a3620", ground: "#6a4e30", groundDark: "#4c3820", accent: "#8de1d4", decor: "library", hazardName: "Falling Tomes", hazard: "tome", hazardEvery: 5, hazardTip: "Cursed books fall from the stacks — watch the shadows grow." },
];
export const BIOME_LENGTH = 50;

export const UPGRADES: { id: string; title: string; desc: string; max: number }[] = [
  { id: "damage", title: "Hotter Lead", desc: "+20% attack power", max: 5 },
  { id: "rate", title: "Quick Fingers", desc: "+15% fire rate", max: 4 },
  { id: "speed", title: "Winged Soles", desc: "+12% move speed", max: 4 },
  { id: "heart", title: "Second Helping", desc: "+25 max gumption and a big heal", max: 5 },
  { id: "dash", title: "Greased Heels", desc: "Dash recharges 25% faster", max: 3 },
  { id: "magnet", title: "Sticky Fingers", desc: "Coins and hearts fly to you from farther away", max: 3 },
  { id: "cards", title: "Card Shark", desc: "Super meter fills 30% faster", max: 3 },
  { id: "crit", title: "Lucky Shot", desc: "+12% chance shots deal double damage", max: 4 },
  { id: "regen", title: "Slow Simmer", desc: "Recover 1 gumption every second", max: 3 },
  { id: "twin", title: "Double Trouble", desc: "Fire an extra projectile with every shot", max: 2 },
  { id: "crate", title: "Prize Hound", desc: "Prize crates land 35% more often", max: 2 },
  { id: "shield", title: "Tin Umbrella", desc: "Start each boss fight with a shield", max: 1 },
  { id: "thorns", title: "Cactus Coat", desc: "Creeps that touch you take 40 damage", max: 2 },
  { id: "vampire", title: "Red Straw", desc: "Every 12th knockout restores 8 gumption", max: 3 },
  { id: "dashfire", title: "Heel Sparks", desc: "Dashing leaves a trail of fire", max: 1 },
  { id: "interest", title: "Gold Tooth", desc: "+1 extra coin for every 5 coins banked", max: 2 },
  { id: "parryheal", title: "Sweet Swat", desc: "Successful parries restore 4 gumption", max: 2 },
  { id: "ricochet", title: "Bank Shots", desc: "Every shot bounces off one extra wall", max: 2 },
  { id: "volatile", title: "Volatile Mix", desc: "Explosions burst wider and hurt 40% more", max: 2 },
  { id: "titanbane", title: "Giant Killer", desc: "+45% damage to bosses, per rank", max: 3 },
  { id: "showman", title: "Showman's Flair", desc: "Combo score bonuses grow 50% stronger", max: 2 },
  { id: "scavenger", title: "Scavenger", desc: "Creeps drop coins far more often", max: 2 },
];

export const POWERUPS = {
  rapid: { name: "Hot Hands", desc: "Double fire rate for 8 seconds", color: "#ff6a3d" },
  shield: { name: "Tin Umbrella", desc: "Absorbs the next two hits", color: "#8fd1ff" },
  bomb: { name: "Ink Bomb", desc: "Wipes every bullet and staggers every creep", color: "#2a2230" },
  clock: { name: "Pocket Watch", desc: "Slows the whole world for 6 seconds — except you", color: "#f2c14e" },
  star: { name: "Lucky Star", desc: "Invincible for 6 seconds — bump creeps to pop them", color: "#fff3c4" },
  magnet: { name: "Horseshoe Magnet", desc: "Pulls every coin and heart on stage to you", color: "#d84a45" },
  wind: { name: "Spare Breath", desc: "An extra life — get back up once when flattened", color: "#74e6ff" },
  decoy: { name: "Wooden Dummy", desc: "Drops a decoy every creep chases for 7 seconds", color: "#c9863a" },
  fireworks: { name: "Roman Candle", desc: "Rockets burst all over the stage for 6 seconds", color: "#ff5aa5" },
  nuke: { name: "Fat TNT", desc: "Detonates massive screen-wide cartoon kaboom", color: "#e84a5f" },
  goldbar: { name: "Gold Ingot", desc: "Instantly adds 50 shiny coins to your pouch", color: "#ffd700" },
  mirror: { name: "Funhouse Mirror", desc: "Auto-parries everything for 6 seconds", color: "#b8d8e8" },
  bees: { name: "Jar of Bees", desc: "Angry bees chase and sting creeps for 7 seconds", color: "#ffd75a" },
  grease: { name: "Grease Bucket", desc: "A slick that sends creeps slipping and sliding", color: "#9aa0a8" },
};

export const MODIFIERS = [
  { id: "pink" as const, name: "PINK PANIC", sub: "EVERY SHOT IS PARRYABLE · GO WILD", time: 10 },
  { id: "double" as const, name: "DOUBLE TIME", sub: "CREEPS ARE FASTER · SCORE ×2", time: 12 },
  { id: "coins" as const, name: "PAYDAY", sub: "COINS RAIN FROM THE RAFTERS", time: 8 },
  { id: "fog" as const, name: "PEA SOUP", sub: "THE FOG ROLLS IN · TRUST YOUR EARS", time: 12 },
  { id: "giant" as const, name: "BIG TOP", sub: "EVERYTHING IS HUGE · SCORE ×1.5", time: 10 },
  { id: "meteor" as const, name: "FALLING METEORS", sub: "INCOMING ROCKS FROM ABOVE · WATCH OUT", time: 10 },
  { id: "blackwhite" as const, name: "SILENT FILM", sub: "EXTRA CONTRAST · CRIT CHANCE ×3", time: 10 },
  { id: "rain" as const, name: "DOWNPOUR", sub: "SLICK RAIN · EVERYTHING SLIDES", time: 12 },
  { id: "swarm" as const, name: "SWARM CALL", sub: "CREEPS COME FAST · SCORE ×1.5", time: 14 },
];

export const WAVES = [
  { id: "bloom", name: "BLOOM BOOM", sub: "A FLOWERBED IS COMING", kinds: ["daisy"], count: 14 },
  { id: "gloop", name: "GLOOP FLOOD", sub: "MIND THE BOUNCE", kinds: ["gloop"], count: 8 },
  { id: "wisp", name: "WISP WALTZ", sub: "THEY BLINK · YOU DASH", kinds: ["wisp"], count: 9 },
  { id: "eel", name: "EEL TANGLE", sub: "AIM FOR THE HEADS", kinds: ["eel"], count: 4 },
  { id: "mixed", name: "MIDNIGHT PARADE", sub: "EVERYBODY'S HERE", kinds: ["toad", "spider", "bloat", "jack"], count: 10 },
  { id: "ghoul", name: "SHEET STORM", sub: "THEY GET BACK UP", kinds: ["ghoul"], count: 7 },
  { id: "candle", name: "CANDLELIGHT VIGIL", sub: "WATCH YOUR FEET", kinds: ["candle"], count: 6 },
  { id: "puppet", name: "PUPPET SHOW", sub: "LOOK UP", kinds: ["puppet"], count: 8 },
  { id: "mirror", name: "HALL OF MIRRORS", sub: "FLANK THEM", kinds: ["mirror", "twin"], count: 6 },
  { id: "clowns", name: "CLOWN CORTEGE", sub: "JUGGLING FRENZY", kinds: ["clown", "bat"], count: 8 },
  { id: "skeletons", name: "GRAVEYARD JAMBOREE", sub: "BONES A-RATTLING", kinds: ["skeleton", "totem"], count: 7 },
  { id: "sirens", name: "SIREN SERENADE", sub: "SING ALONG, IF YOU DARE", kinds: ["siren", "toad"], count: 8 },
  { id: "kitchen", name: "KITCHEN NIGHTMARE", sub: "ORDER UP, HOT AND BOTHERED", kinds: ["chef", "gloop"], count: 9 },
  { id: "recital", name: "PIPE RECITAL", sub: "MIND THE NOTES, THEY BITE", kinds: ["organ", "skeleton"], count: 6 },
];

export const SMACKS = ["WHAM!", "POW!", "BONK!", "SPLAT!", "ZOWIE!", "BIFF!", "KA-POW!", "SOCKO!", "KAPOW!", "CLOBBER!"];
export const CARD_DAMAGE = 160;
export const UNLOCK_KEY = "rubberRequiemUnlocks";
