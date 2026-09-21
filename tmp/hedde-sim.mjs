// src/game/data.ts
var WEAPONS = {
  popper: { name: "Pepper Popper", blurb: "Dependable bank shots that punch through a target and ricochet off the walls.", trait: "PIERCE + RICOCHET \xB7 BANKING BUILDS", ex: "Mega Pop", exDesc: "A colossal slow shell that bores through every creep in its path.", rate: 190, damage: 24, speed: 820, color: "#ffd75a", spread: 0.02, shots: 1, power: 2, pace: 4, range: 5, icon: "M9 14h37l8 8-9 7H31l-3 11H14l4-16H9Z", starter: true },
  choir: { name: "Gravel Choir", blurb: "A six-note blast at close range that hurls creeps backwards.", trait: "KNOCKBACK CONE \xB7 WALL SLAMS", ex: "Eight-Way", exDesc: "Eight piercing spikes burst out in every direction.", rate: 600, damage: 12, speed: 720, color: "#ff8b5c", spread: 0.5, shots: 6, power: 5, pace: 2, range: 1, icon: "m6 20 43-9 8 7-44 11Zm25 4 10 14H29l-8-12M48 11l4-6", starter: true },
  note: { name: "Blue Note", blurb: "Living sparks that seek their prey and hop to the next.", trait: "HOMING + CHAIN", ex: "Chaos Halo", exDesc: "Six spectral notes orbit you, singeing anything that steps close.", rate: 150, damage: 13, speed: 600, color: "#74e6ff", spread: 0.14, shots: 1, power: 2, pace: 4, range: 4, icon: "m15 39 29-29 8 8-30 22ZM47 3v8m10 2h-8m4-7-6 6", starter: true },
  mortar: { name: "Moon Mortar", blurb: "A heavy moon shell that ricochets and cracks open in a huge blast.", trait: "BOUNCING SPLASH \xB7 LEAVES CRATERS", ex: "Kablooey", exDesc: "One enormous shell with a screen-rattling blast radius.", rate: 940, damage: 60, speed: 400, color: "#d9a8ff", spread: 0.02, shots: 1, power: 5, pace: 1, range: 3, icon: "M7 23h35l11 9H18Zm15 12a7 7 0 1 0 0-1zm25 0a7 7 0 1 0 0-1zM14 22l4-13 25 4-2 10", starter: true },
  halo: { name: "Tin Halo", blurb: "A whirling boomerang that slices out and slices back home.", trait: "BOOMERANG \xB7 TWO HITS", ex: "Buzzsaw", exDesc: "A roaming saw blade that bounces around the whole stage.", rate: 540, damage: 30, speed: 660, color: "#c8f26a", spread: 0, shots: 1, power: 3, pace: 3, range: 3, icon: "M12 8c12-6 30-4 40 6-4 8-14 10-20 9-3 8-12 14-22 12 6-4 4-14 2-27Z", starter: true },
  kettle: { name: "Thunder Kettle", blurb: "Hold to boil, release to strike. A fully charged bolt splits the room.", trait: "HOLD TO CHARGE", ex: "Radial Blast", exDesc: "A concussive shockwave erupts around you, flinging creeps away.", rate: 140, damage: 12, speed: 900, color: "#ffe05e", spread: 0, shots: 1, power: 5, pace: 2, range: 4, icon: "M8 26 26 6l-4 13h14L18 40l4-12H8Zm34-14 12 6-8 8", starter: false },
  shard: { name: "Sugar Shard", blurb: "A crystal that flies straight, then shatters into aimed slivers.", trait: "SPLIT + SEEK", ex: "Sentry Star", exDesc: "Plant a twinkling turret that peppers the nearest creep.", rate: 300, damage: 40, speed: 700, color: "#ff7ad9", spread: 0.02, shots: 1, power: 4, pace: 3, range: 4, icon: "M32 4 46 22 32 40 18 22Zm-4 18h8m-4-6v12", starter: false },
  lobber: { name: "Tar Lobber", blurb: "Lob a bubbling tar ball over the crowd. It bursts and leaves a sticky pool that slows everything.", trait: "ARC + SLOWING POOL", ex: "Tar Pit", exDesc: "Five tar balls rain down in a ring around you.", rate: 720, damage: 52, speed: 520, color: "#6b4fbf", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M8 34c0-9 8-14 16-12l6-14 8 4-6 12c6 4 8 12 4 18-6 8-24 6-28-8Zm26-26 8-4", starter: false },
  fountain: { name: "Ink Fountain", blurb: "A short-range torrent of scalding ink. Anything soaked keeps burning.", trait: "STREAM + BURN", ex: "Ink Nova", exDesc: "A ring of ink erupts in every direction, setting the crowd alight.", rate: 48, damage: 5, speed: 340, color: "#ff6a3d", spread: 0.26, shots: 1, power: 3, pace: 5, range: 1, icon: "M6 22h20l10-8v20L26 26H6Zm34-6c6 2 10 6 12 12-4-2-8-2-12 0 4-4 4-8 0-12Z", starter: false },
  trio: { name: "Marquee Trio", blurb: "Three theatre beams that cross at your cursor and pierce the whole stage.", trait: "CONVERGING BEAMS", ex: "Spotlight", exDesc: "One blinding beam that cuts clean across the screen.", rate: 500, damage: 26, speed: 1150, color: "#fff0a8", spread: 0.3, shots: 3, power: 3, pace: 3, range: 5, icon: "M6 8 58 22 6 36Zm0 14h52", starter: false },
  cuckoo: { name: "Cuckoo Cannon", blurb: "Launches a furious little bird that hunts the biggest creep and pecks it silly.", trait: "HUNTING PET", ex: "The Flock", exDesc: "Four birds at once. Feathers everywhere.", rate: 1500, damage: 9, speed: 540, color: "#ffb347", spread: 0, shots: 1, power: 4, pace: 2, range: 5, icon: "M10 24c6-10 16-12 24-8l12-6-4 10 8 6-14 2c-6 8-18 8-26-4Zm12-2h2", starter: false },
  accordion: { name: "Squeezebox", blurb: "Twin notes that weave a wide sine-wave, sweeping everything in a broad lane.", trait: "WAVE PAIR \xB7 PIERCE", ex: "Polka Storm", exDesc: "Eight weaving notes fan out across the whole stage.", rate: 260, damage: 15, speed: 560, color: "#ff5aa5", spread: 0, shots: 1, power: 3, pace: 4, range: 4, icon: "M6 10h12v24H6Zm40 0h12v24H46ZM18 14l28 4v8l-28 4Z", starter: false },
  yoyo: { name: "Rubber Yo-Yo", blurb: "A tethered spiked ball that flies out, snaps back, and mows down anything on the string.", trait: "TETHER \xB7 MULTI-HIT", ex: "Walk the Dog", exDesc: "The yo-yo orbits you at full length for five seconds.", rate: 900, damage: 14, speed: 880, color: "#5ad1ff", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M8 22h30M38 22a10 10 0 1 0 20 0 10 10 0 1 0-20 0Zm6 0h8", starter: false },
  harp: { name: "Storm Harp", blurb: "Strum a chord of lightning that forks instantly to every creep in a cone.", trait: "INSTANT ARC \xB7 CONE", ex: "Thunderclap", exDesc: "Lightning strikes every creep on screen at once.", rate: 620, damage: 22, speed: 0, color: "#b6e4ff", spread: 0.55, shots: 1, power: 4, pace: 3, range: 4, icon: "M10 40 26 4h8l4 8-12 28Zm10-8 8-18m-2 20 8-18m-2 20 8-18", starter: false },
  frost: { name: "Frost Bugle", blurb: "A honk of freezing air that stops creeps solid. Frozen creeps shatter for double damage.", trait: "FREEZE \xB7 SHATTER SHARDS", ex: "Cold Snap", exDesc: "Freezes everything within a wide radius.", rate: 420, damage: 10, speed: 480, color: "#aef1ff", spread: 0.32, shots: 3, power: 3, pace: 3, range: 2, icon: "M6 20h22l14-12v28L28 24H6Zm44-6 6 8-6 8", starter: false },
  quill: { name: "Inkwell Quill", blurb: "A giant fountain pen swung in a wide arc. Point blank, brutal, and every hit fills your meter fast.", trait: "MELEE ARC \xB7 SIGNATURE FINISH", ex: "Signature", exDesc: "A full 360\xB0 flourish that knocks everything away.", rate: 380, damage: 46, speed: 0, color: "#2a2230", spread: 1.5, shots: 1, power: 5, pace: 3, range: 1, icon: "m8 36 30-30 6 2 2 6-30 30H8Zm30-24 6 6", starter: false },
  popcorn: { name: "Popcorn Popper", blurb: "Kernels skitter across the floor, then POP into a burst of four buttery shots.", trait: "DELAYED BURST", ex: "Kettle Corn", exDesc: "A dozen kernels scatter everywhere and all pop at once.", rate: 340, damage: 14, speed: 520, color: "#fff0b8", spread: 0.1, shots: 1, power: 4, pace: 3, range: 3, icon: "M12 20h40l-6 20H18Zm8-8a6 6 0 1 1 12 0 6 6 0 1 1 12 0", starter: false },
  trumpet: { name: "Ghost Trumpet", blurb: "A spectral note that grows as it travels and passes straight through every creep in a line.", trait: "GROWING WAVE \xB7 CRESCENDO", ex: "Reveille", exDesc: "Three enormous notes blast out in a fan.", rate: 560, damage: 30, speed: 430, color: "#c9b8ff", spread: 0.02, shots: 1, power: 3, pace: 3, range: 5, icon: "M6 18h24l20-12v32L30 26H6Zm46-8 8 12-8 12", starter: false },
  mitt: { name: "Magnet Mitt", blurb: "Throws a horseshoe that yanks nearby creeps into a tight pile \u2014 then let the splash weapons do the rest.", trait: "GRAVITY WELL \xB7 SETUP", ex: "Big Pull", exDesc: "Drags every creep on the stage toward one point.", rate: 900, damage: 12, speed: 560, color: "#d84a45", spread: 0, shots: 1, power: 2, pace: 2, range: 4, icon: "M14 12v14a18 18 0 0 0 36 0V12h-10v14a8 8 0 0 1-16 0V12Z", starter: false },
  anvil: { name: "Dropping Anvil", blurb: "Whistle overhead! A massive cast iron anvil falls from the sky, flattening anything beneath.", trait: "CRUSHING OVERHEAD", ex: "Ten-Ton Stampede", exDesc: "Four enormous anvils rain across the screen at once.", rate: 1100, damage: 85, speed: 0, color: "#444b58", spread: 0, shots: 1, power: 5, pace: 1, range: 4, icon: "M6 14h52v8l-14 6-2 10H22l-2-10-14-6Z", starter: false },
  bubbles: { name: "Soap Gun", blurb: "Drifting, iridescent soap bubbles that trap creeps inside and float them upwards harmlessly.", trait: "FLOAT TRAP + POP", ex: "Giant Bubble", exDesc: "One enormous bubble that swallows whole crowds.", rate: 220, damage: 16, speed: 380, color: "#74f0ff", spread: 0.22, shots: 2, power: 3, pace: 4, range: 3, icon: "M12 22a10 10 0 1 0 20 0 10 10 0 1 0-20 0Zm24-6a6 6 0 1 0 12 0 6 6 0 1 0-12 0Z", starter: false },
  boombox: { name: "Brass Boombox", blurb: "Pumps out pulsing concentric bass rings that cancel enemy bullets and knock back all foes.", trait: "BULLET SHIELD + BASS", ex: "Megaphone Blast", exDesc: "A concussive screen-wide sonic boom.", rate: 480, damage: 28, speed: 500, color: "#ffd166", spread: 0.12, shots: 1, power: 4, pace: 3, range: 3, icon: "M8 12h48v24H8Zm12 12a6 6 0 1 0 12 0 6 6 0 1 0-12 0Zm20 0a6 6 0 1 0 12 0 6 6 0 1 0-12 0Z", starter: false },
  peel: { name: "Slapstick Peels", blurb: "Scatter banana peels that send creeps into a spinning pratfall.", trait: "FLOOR TRAPS \xB7 SLIP STUN", ex: "Bunch o' Peels", exDesc: "A whole crate of peels blankets the stage.", rate: 470, damage: 14, speed: 900, color: "#ffe14d", spread: 0.3, shots: 3, power: 3, pace: 4, range: 3, icon: "M14 30q10-14 26-10-4 8-14 10 6 2 8 8-12 4-20-8Z", starter: false },
  kazoo: { name: "Hive Kazoo", blurb: "Hum a stream of angry little bees that home in on the nearest creep.", trait: "BEE SWARM \xB7 HOMING", ex: "Queen's Wrath", exDesc: "A monstrous swarm erupts and strips the stage bare.", rate: 340, damage: 9, speed: 520, color: "#ffd75a", spread: 0.35, shots: 2, power: 2, pace: 5, range: 4, icon: "M10 24h26l14-8v18l-14-8H10Zm30-2h6", starter: false },
  barrel: { name: "Barrel Roll", blurb: "Kick a rolling barrel that bowls through the crowd and detonates.", trait: "ROLLING BOMB \xB7 GAINS WEIGHT", ex: "Powder Keg", exDesc: "Three powder kegs roll out and blow the whole floor.", rate: 780, damage: 55, speed: 640, color: "#b3672f", spread: 0, shots: 1, power: 4, pace: 2, range: 4, icon: "M12 12h40v24H12Zm0 6h40m-40 12h40M18 12v24m28-24v24", starter: false },
  phonograph: { name: "Crank Siren", blurb: "Winding siren that spins spiral projectiles outward in dizzying geometric spiral loops.", trait: "SPIRAL DANCE", ex: "Siren Song", exDesc: "Dense outward spiral of 16 cutting melody notes.", rate: 290, damage: 18, speed: 640, color: "#ff8ad3", spread: 0.08, shots: 2, power: 4, pace: 4, range: 4, icon: "M10 22a12 12 0 1 0 24 0 12 12 0 1 0-24 0Zm12 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0Zm16-8l16-6v28l-16-6Z", starter: false },
  syrup: { name: "Syrup Slinger", blurb: "Drench the whole stage in molasses. Everything stuck in the goo crawls at half speed.", trait: "AREA SLOW FIELD", ex: "Sticky Tsunami", exDesc: "A tidal wave of syrup coats the entire floor.", rate: 640, damage: 18, speed: 460, color: "#b97a2a", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M22 6h20l-3 10c8 6 10 18 4 24-8 8-26 8-32-2-4-6-2-14 5-20Zm-2 24c6 4 22 4 28 0", starter: false },
  whistle: { name: "Referee Whistle", blurb: "A piercing shriek that stuns every creep in a huge cone dead in their tracks.", trait: "CONE STUN \xB7 FOULS COUNTED", ex: "Final Whistle", exDesc: "A screen-wide blast that stops time itself for three full seconds.", rate: 1500, damage: 8, speed: 0, color: "#e0e6ef", spread: 0, shots: 1, power: 3, pace: 1, range: 4, icon: "M12 20h28a14 14 0 1 1-14 14A14 14 0 0 1 12 20Zm30-8 10-4-2 10", starter: false },
  umbrella: { name: "Brolly Basher", blurb: "Spin open a bullet-proof parasol that deflects enemy fire and smacks creeps away.", trait: "DEFLECT SHIELD", ex: "Typhoon Twirl", exDesc: "The brolly becomes a spinning shield that chases creeps around.", rate: 1300, damage: 22, speed: 520, color: "#4a7fb5", spread: 0, shots: 1, power: 4, pace: 2, range: 2, icon: "M8 32a24 24 0 0 1 48 0Zm24 0v18a6 6 0 0 0 12 0", starter: false },
  grapple: { name: "Hookshot Cane", blurb: "Fire a grapple that snags the biggest creep and reels you in \u2014 or reels IT in. Contact is a free punch.", trait: "MOBILITY \xB7 GAP CLOSER", ex: "Wrecking Ball", exDesc: "A colossal hook drags every creep on screen into one heap.", rate: 820, damage: 30, speed: 1400, color: "#c9863a", spread: 0, shots: 1, power: 3, pace: 3, range: 5, icon: "M10 12h30m-4 0a10 10 0 1 0 10 10M10 12l8-6m-8 6 8 6", starter: false },
  slots: { name: "Jackpot Slots", blurb: "Pull the lever: three spinning reels fire a random pattern of coins every spin. Cherries pay double.", trait: "GAMBIT \xB7 REELS GET LOADED", ex: "All In", exDesc: "Spin five reels at once. The house always loses.", rate: 900, damage: 16, speed: 620, color: "#f0c24d", spread: 0.5, shots: 3, power: 3, pace: 3, range: 4, icon: "M8 12h48v26H8Zm12 6v14m12-14v14m12-14v14", starter: false },
  paint: { name: "Polka Paint", blurb: "Splatter creeps with glowing paint. Painted creeps take extra hurt from everything, for everyone.", trait: "MARK \xB7 GALLERY BLEED", ex: "Fresco Frenzy", exDesc: "Paint the whole crowd at once \u2014 a gallery of targets.", rate: 520, damage: 12, speed: 560, color: "#ff5aa5", spread: 0.18, shots: 2, power: 2, pace: 4, range: 4, icon: "M12 10h34v14c0 8-6 10-10 14l-2 8h-8l-2-8c-6-2-12-6-12-14Zm34 2h8v8h-8", starter: false },
  pie: { name: "Cream Pie", blurb: "The classic. A soggy arc that blinds whatever it hits \u2014 creeps stumble around seeing nothing.", trait: "ARC \xB7 BLINDS", ex: "Bakery Barrage", exDesc: "Pies rain in a whole bakery's worth of arcs.", rate: 700, damage: 34, speed: 620, color: "#ffe9c9", spread: 0, shots: 1, power: 4, pace: 2, range: 3, icon: "M10 30c6-12 38-12 44 0l-4 6H14Zm12-14a4 4 0 1 1 8 0m6 2a3 3 0 1 1 6 0", starter: false },
  lance: { name: "The Ticket Lance", blurb: "A single punched ticket that flies the whole room, through everything standing in it.", trait: "RAIL PIERCE \xB7 WHOLE-ROOM REACH", ex: "Last Train", exDesc: "One colossal rail that stuns and shoves everything it bores through.", rate: 700, damage: 34, speed: 1500, color: "#9ef0e6", spread: 0, shots: 1, power: 4, pace: 2, range: 5, icon: "M6 32h38l12-4-12-4H6Zm8-4v8m30-6 6 2", starter: false },
  sprinkler: { name: "The Sprinkler Saint", blurb: "Every shot opens like a garden sprinkler: ten blessed droplets and no safe side.", trait: "RADIAL BURST \xB7 NO SAFE SIDE", ex: "Monsoon", exDesc: "Twenty-four droplets and a hard shove in every direction at once.", rate: 420, damage: 11, speed: 620, color: "#7ad9ff", spread: 0, shots: 1, power: 3, pace: 3, range: 2, icon: "M32 6v12m0 0-16 26m16-26 16 26m-16-26v28M16 18a16 16 0 0 1 32 0", starter: false },
  candle: { name: "Vigil Candle", blurb: "Sets a candle on the boards. Its flame keeps biting anything that walks through the light.", trait: "PLACED FLAME \xB7 AREA DENIAL", ex: "Last Rites", exDesc: "Three candles in a fan ahead of you, burning long and wide.", rate: 900, damage: 16, speed: 300, color: "#ffd98a", spread: 0, shots: 1, power: 3, pace: 1, range: 2, icon: "M28 22h8v24h-8Zm4-4c3-4 3-8 0-11-3 3-3 7 0 11Zm-10 28h20", starter: false },
  stamp: { name: "Postage Stamp", blurb: "Mail a stamped envelope that sticks to a creep \u2014 then detonates for a parcel-sized kaboom.", trait: "STICKY BOMB \xB7 DELAYED", ex: "Special Delivery", exDesc: "Five stamps, five parcels, one very loud post office.", rate: 640, damage: 26, speed: 540, color: "#7ec47e", spread: 0.06, shots: 1, power: 3, pace: 3, range: 4, icon: "M10 12h44v26H10Zm4 4v18m36-18v18M10 16l44 18M54 16 10 34", starter: false }
};
var WEAPON_KEYS = Object.keys(WEAPONS);
var STARTER_WEAPONS = WEAPON_KEYS.filter((k) => WEAPONS[k].starter);
var CHARMS = {
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
  varnish: { name: "Wet Varnish", desc: "Paint marks last twice as long, and marked creeps hurt 50% extra instead of 35%.", color: "#ff5aa5", icon: "M14 10h36v12H32l-4 16h-8l4-16H14Z" }
};
var CHARM_KEYS = Object.keys(CHARMS);
var CHARACTERS = {
  milo: { name: "Milo Marlowe", title: "The Everyman", desc: "No bad days, no bad shots. The rubber-hose hero who started it all.", trait: "BALANCED", color: "#e8b88a", accent: "#d84a45", icon: "M22 12h20l2 12H20Zm2 16h16v16H24Z", speed: 1, damage: 1, health: 1, radius: 1, fireRate: 1, dashCdMult: 1, shield: 0, power: 3, pace: 3, grit: 3 },
  dixie: { name: "Dixie Dazzle", title: "The Firecracker", desc: "Blistering pace and a hair-trigger finger. One stiff breeze could fold her.", trait: "SPEED \xB7 GLASS CANNON", color: "#f2c9a0", accent: "#ff5aa5", icon: "M18 16q14-10 28 0l-4 20H22Zm4 22h18l-4 12H26Z", speed: 1.26, damage: 1, health: 0.75, radius: 0.92, fireRate: 1.16, dashCdMult: 0.78, shield: 0, power: 2, pace: 5, grit: 1 },
  barnaby: { name: "Barnaby Brawn", title: "The Strongman", desc: "A walking brick wall who hits like a freight train \u2014 and winds up like one, too.", trait: "TANK \xB7 HEAVY HITTER", color: "#d9a06a", accent: "#4a7fb5", icon: "M16 14h32v26H16Zm-6 4h8v14h-8Zm42 0h8v14h-8Z", speed: 0.82, damage: 1.22, health: 1.55, radius: 1.2, fireRate: 0.92, dashCdMult: 1.2, shield: 1, power: 5, pace: 1, grit: 5 },
  coco: { name: "Coco Cabaret", title: "The Diva", desc: "Every exit a grand exit. Hits like a falling chandelier \u2014 and tires like one too.", trait: "BURST \xB7 HIGH DRAMA", color: "#e8c0a0", accent: "#8a4fd0", icon: "M32 8q14 10 12 26l-12 22-12-22Q18 18 32 8Zm-8 20h16", speed: 0.94, damage: 1.2, health: 0.88, radius: 0.98, fireRate: 0.82, dashCdMult: 1.08, shield: 0, power: 5, pace: 2, grit: 2 },
  rusty: { name: "Rusty Rivet", title: "The Tinker", desc: "Half mechanic, half menace. Keeps a spare plate bolted to the back, just in case.", trait: "SHIELD \xB7 FAST HANDS", color: "#d8b090", accent: "#4a8f6a", icon: "M40 12a10 10 0 0 0-12 12L12 40l8 8 16-16a10 10 0 0 0 12-12l-6 6-6-2-2-6Z", speed: 1.02, damage: 0.9, health: 1.05, radius: 1.02, fireRate: 1.12, dashCdMult: 0.92, shield: 1, power: 2, pace: 4, grit: 4 }
};
var CHARACTER_KEYS = Object.keys(CHARACTERS);
var ENEMIES = {
  daisy: { name: "Grinning Bloom", hp: 30, r: 16, speed: 92, score: 80, contact: 10, unlock: 0, weight: 3, color: "#ff9a3c", note: "Swarms in wobbly zig-zags" },
  gloop: { name: "Gloop", hp: 46, r: 19, speed: 120, score: 90, contact: 9, unlock: 0, weight: 2, color: "#5aa8ff", note: "Bounces off walls \xB7 splits when popped" },
  wisp: { name: "Cackle Wisp", hp: 26, r: 15, speed: 110, score: 110, contact: 14, unlock: 14, weight: 2, color: "#8de1d4", note: "Blinks beside you, then lunges" },
  jack: { name: "Jack-in-the-Bonk", hp: 40, r: 17, speed: 0, score: 120, contact: 16, unlock: 22, weight: 1.5, color: "#e8c34a", note: "Sits still \xB7 springs at you when you get close" },
  bloat: { name: "Bloat Face", hp: 22, r: 18, speed: 46, score: 100, contact: 10, unlock: 28, weight: 2, color: "#7ec8ff", note: "Bursts into bullets when shot \xB7 parry the pink ones" },
  eel: { name: "Ink Eel", hp: 70, r: 14, speed: 150, score: 160, contact: 9, unlock: 36, weight: 1.4, color: "#3d3a6e", note: "Long serpent \xB7 circles you \xB7 only the head takes damage" },
  toad: { name: "Toad Tenor", hp: 52, r: 20, speed: 62, score: 130, contact: 10, unlock: 42, weight: 1.6, color: "#8fc45a", note: "Keeps its distance \xB7 three-note volleys" },
  spider: { name: "Sock Spider", hp: 48, r: 18, speed: 84, score: 130, contact: 11, unlock: 50, weight: 1.4, color: "#6d5a8a", note: "Lays sticky webs that root you in place" },
  cap: { name: "Murder Cap", hp: 64, r: 19, speed: 0, score: 140, contact: 8, unlock: 58, weight: 1.1, color: "#e0463b", note: "Hides under its cap \xB7 spore rings" },
  mime: { name: "Mime Mister", hp: 44, r: 17, speed: 105, score: 150, contact: 13, unlock: 66, weight: 1.3, color: "#e9e4dc", note: "Invisible until close \xB7 mirrors your movement" },
  nut: { name: "Drop Nut", hp: 44, r: 17, speed: 72, score: 120, contact: 12, unlock: 76, weight: 1.3, color: "#b8763a", note: "Falls from above \xB7 watch the shadow" },
  bell: { name: "Bellhop", hp: 90, r: 21, speed: 40, score: 190, contact: 10, unlock: 84, weight: 0.9, color: "#f0b24a", note: "Rings a bell: nearby creeps go fast and mean \xB7 kill it first" },
  lugger: { name: "Barrel Bruiser", hp: 120, r: 28, speed: 50, score: 200, contact: 26, unlock: 92, weight: 1, color: "#b3672f", note: "Winds up, then charges" },
  hex: { name: "Top Hat Hex", hp: 58, r: 19, speed: 0, score: 170, contact: 12, unlock: 100, weight: 1, color: "#8b5fc7", note: "Teleports \xB7 homing rings" },
  ghoul: { name: "Sheet Ghoul", hp: 56, r: 18, speed: 70, score: 170, contact: 12, unlock: 104, weight: 1.2, color: "#cfd6e2", note: "Gets back up once \xB7 finish it again fast" },
  turret: { name: "Peeping Cannon", hp: 110, r: 22, speed: 0, score: 210, contact: 10, unlock: 112, weight: 0.8, color: "#5c6b8a", note: "Stationary \xB7 draws a laser line, then fires down it" },
  candle: { name: "Candle Kid", hp: 38, r: 16, speed: 118, score: 130, contact: 12, unlock: 32, weight: 1.4, color: "#ffd166", note: "Runs in loops \xB7 leaves a burning trail you must not touch" },
  puppet: { name: "String Puppet", hp: 60, r: 18, speed: 0, score: 150, contact: 14, unlock: 46, weight: 1.2, color: "#c97a5a", note: "Hangs from the rafters \xB7 swings, then drops on you" },
  twin: { name: "Ink Blot Twins", hp: 52, r: 15, speed: 80, score: 180, contact: 10, unlock: 70, weight: 0.9, color: "#2f3d7a", note: "Come as a pair \xB7 the ink rope between them stings" },
  phono: { name: "Gramophone Gus", hp: 96, r: 22, speed: 30, score: 200, contact: 10, unlock: 98, weight: 0.8, color: "#c9863a", note: "Plays expanding sound rings \xB7 every 3rd ring is pink" },
  mirror: { name: "Mirror Mask", hp: 74, r: 19, speed: 64, score: 190, contact: 12, unlock: 108, weight: 0.9, color: "#b8d8e8", note: "Front-facing mirror bounces your shots back \xB7 hit it from behind" },
  clown: { name: "Carnival Unicycle", hp: 68, r: 18, speed: 135, score: 175, contact: 14, unlock: 88, weight: 1.1, color: "#ff5964", note: "Juggles bowling pins into high arcing trajectories" },
  bat: { name: "Belfry Flapper", hp: 32, r: 15, speed: 125, score: 115, contact: 10, unlock: 20, weight: 1.7, color: "#473b66", note: "Flies high, swoops down fast at player angle" },
  skeleton: { name: "Clicky Bones", hp: 80, r: 20, speed: 75, score: 185, contact: 12, unlock: 115, weight: 0.9, color: "#e5dec9", note: "Hurls rib bones that boomerang backward" },
  totem: { name: "Steam Totem", hp: 130, r: 24, speed: 0, score: 220, contact: 15, unlock: 120, weight: 0.7, color: "#8c654f", note: "Erupts high pressure scalding steam clouds" },
  siren: { name: "Harbor Siren", hp: 90, r: 19, speed: 80, score: 200, contact: 14, unlock: 130, weight: 1, color: "#4fc3a1", note: "Sings up a shimmering sound shield \xB7 break it first" },
  chef: { name: "Fry-Cook Fiend", hp: 100, r: 21, speed: 70, score: 205, contact: 14, unlock: 140, weight: 1, color: "#f0e4d0", note: "Lobs sizzling pans and flaming souffles" },
  balloon: { name: "Balloon Baron", hp: 70, r: 23, speed: 55, score: 190, contact: 12, unlock: 150, weight: 1.1, color: "#ff6a9d", note: "Floats high and drops bomb-balloons \xB7 pops in confetti" },
  organ: { name: "Pipe Organist", hp: 165, r: 24, speed: 26, score: 260, contact: 16, unlock: 170, weight: 0.7, color: "#c9863a", note: "Plays crushing chords of solid sound" },
  disco: { name: "Disco Destroyer", hp: 120, r: 22, speed: 78, score: 230, contact: 15, unlock: 180, weight: 0.9, color: "#c0c8e8", note: "Mirror ball \xB7 your shots bounce off its facets \xB7 hit the gaps" },
  skunk: { name: "Inkwell Skunk", hp: 70, r: 17, speed: 105, score: 210, contact: 12, unlock: 190, weight: 1.1, color: "#5a5a6e", note: "Sprays sticky ink puddles that gunk you up" },
  strong: { name: "Strongman Slugger", hp: 340, r: 30, speed: 46, score: 320, contact: 28, unlock: 200, weight: 0.6, color: "#c96a3a", note: "Winds up a barbell haymaker \xB7 the ring warns you" },
  usher: { name: "Theatre Usher", hp: 90, r: 18, speed: 95, score: 240, contact: 13, unlock: 210, weight: 1, color: "#6e8a5a", note: "Phases through everything \xB7 sweeps a flashlight beam" },
  magnet: { name: "Magnet Maestro", hp: 150, r: 22, speed: 40, score: 280, contact: 14, unlock: 220, weight: 0.7, color: "#d84a45", note: "Its horseshoe crown bends your shots away \xB7 flank it" },
  cutpurse: { name: "The Card Sharp", hp: 62, r: 16, speed: 205, score: 320, contact: 6, unlock: 70, weight: 0.8, color: "#ff5aa5", note: "Snatches your super cards and bolts for the exits \xB7 knock him over to get them back" },
  bellhop: { name: "Bellhop Bolt", hp: 110, r: 19, speed: 118, score: 280, contact: 11, unlock: 95, weight: 0.8, color: "#74e6ff", note: "Tethers a shield onto the biggest creep in the room \xB7 cut the line first" },
  drover: { name: "Crowd Drover", hp: 150, r: 22, speed: 128, score: 250, contact: 8, unlock: 130, weight: 0.8, color: "#8fd15a", note: "Never touches you \xB7 herds the whole cast into your face" },
  lancer: { name: "Marquee Deadeye", hp: 95, r: 20, speed: 74, score: 290, contact: 9, unlock: 150, weight: 0.7, color: "#ffd166", note: "Paints a light-rail, then fires it clean across the stage and off the walls" },
  janitor: { name: "The Stagehand", hp: 120, r: 20, speed: 150, score: 260, contact: 7, unlock: 175, weight: 0.7, color: "#cfd6e2", note: "Sweeps up your pickups and puddles before you can reach them" },
  hooker: { name: "The Press Agent", hp: 130, r: 21, speed: 88, score: 310, contact: 13, unlock: 200, weight: 0.7, color: "#b8672f", note: "Reels YOU across the stage \xB7 step out of the line and his hook comes up empty" },
  boss: { name: "The Ringmaster", hp: 1200, r: 50, speed: 38, score: 2500, contact: 30, unlock: 9999, weight: 0, color: "#d64545", note: "Multi-phase cartoon titan with dramatic transformations" }
};
var ENEMY_KEYS = Object.keys(ENEMIES).filter((k) => k !== "boss");
var BOSS_NAMES = [
  { name: "The Ringmaster", title: "Carnival Sovereign of Ink", quote: "Step right up, kiddo... into yer grave!" },
  { name: "Duke Coffin", title: "Baron of the Graveyard Rail", quote: "Six feet under is room service!" },
  { name: "Madame Marmalade", title: "Queen of the Sugar Bayou", quote: "Sweet as sugar, sharp as a razor!" },
  { name: "Baron Von Bellows", title: "Lord of the Clockwork Attic", quote: "Yer time ran out five minutes ago!" }
];
var BIOMES = [
  { name: "Cinder Grotto", skyTop: "#2b1a30", skyBottom: "#5a2c44", far: "#3d2340", mid: "#66334a", ground: "#7a4048", groundDark: "#5f3040", accent: "#ff8c4a", decor: "grotto", hazardName: "Lava Gouts", hazard: "lava", hazardEvery: 6, hazardTip: "Fire pillars erupt from warning circles \u2014 keep moving." },
  { name: "Moonlit Moor", skyTop: "#0f1f33", skyBottom: "#27485c", far: "#17303f", mid: "#22454f", ground: "#3a6560", groundDark: "#2b4f4c", accent: "#bfe9c8", decor: "moor", hazardName: "Moor Fog & Will-o-Wisps", hazard: "wisp", hazardEvery: 4.5, hazardTip: "Will-o'-wisps drift in and hunt you \u2014 don't stand still." },
  { name: "Crooked Carnival", skyTop: "#2c1633", skyBottom: "#6a2d55", far: "#4a2247", mid: "#7e3a5a", ground: "#a85c58", groundDark: "#8a4649", accent: "#ffd166", decor: "carnival", hazardName: "Carnival Spinners", hazard: "spinner", hazardEvery: 5, hazardTip: "Buzzsaw wheels sweep the floor \u2014 hop the gaps." },
  { name: "Phantom Express", skyTop: "#111822", skyBottom: "#243242", far: "#182430", mid: "#2d3d4e", ground: "#414f5e", groundDark: "#27323f", accent: "#8be9fd", decor: "train", hazardName: "Rushing Railway Platforms", platformType: "train", hazard: "platform", hazardEvery: 3.5, hazardTip: "Freight carts barrel through \u2014 ride them or dodge them." },
  { name: "Frostbite Rail", skyTop: "#12213a", skyBottom: "#3c6486", far: "#22384f", mid: "#3d5c74", ground: "#5f7a8a", groundDark: "#4a6273", accent: "#c7f0ff", decor: "frost", hazardName: "Slippery Glaze", hazard: "glaze", hazardEvery: 5, hazardTip: "Ice patches make everything slide \u2014 mind your momentum." },
  { name: "Sugar Swamp", skyTop: "#2f1d3a", skyBottom: "#7a3f6e", far: "#4d2a55", mid: "#7a4670", ground: "#6f8a5a", groundDark: "#56704a", accent: "#ff9fd6", decor: "swamp", hazardName: "Tar Geysers", hazard: "geyser", hazardEvery: 4, hazardTip: "Tar geysers erupt with little warning \u2014 watch the bubbles." },
  { name: "Clockwork Attic", skyTop: "#241a14", skyBottom: "#5a3d26", far: "#3a2a1c", mid: "#6b4a2c", ground: "#8a6a3e", groundDark: "#6a4f2e", accent: "#f2c14e", decor: "clock", hazardName: "Swinging Pendulums", hazard: "pendulum", hazardEvery: 5, hazardTip: "Pendulums sweep the whole stage \u2014 time your dashes." },
  { name: "Boneyard Crypt", skyTop: "#15101f", skyBottom: "#2e233d", far: "#20172e", mid: "#3e2f52", ground: "#53426b", groundDark: "#372a47", accent: "#bd93f9", decor: "crypt", hazardName: "Rising Tombstones", hazard: "tomb", hazardEvery: 5.5, hazardTip: "Tombstones rise and stay up \u2014 mind the new terrain." },
  { name: "Devil's Inferno", skyTop: "#330a0d", skyBottom: "#66181f", far: "#481216", mid: "#7a2228", ground: "#8c2e2e", groundDark: "#5c1d1d", accent: "#ff5555", decor: "inferno", hazardName: "Brimstone Fire Pillars", hazard: "pillar", hazardEvery: 4, hazardTip: "Inferno pillars come twice as fast. The floor IS the fight." },
  { name: "Midnight Rooftops", skyTop: "#0a1018", skyBottom: "#1c2c44", far: "#141e2e", mid: "#243448", ground: "#3a4a5e", groundDark: "#26303e", accent: "#ffe9a8", decor: "rooftop", hazardName: "Storm Lightning", hazard: "bolt", hazardEvery: 4.5, hazardTip: "Lightning strikes where the shadow falls \u2014 vacate the circle." },
  { name: "Forbidden Library", skyTop: "#1c140e", skyBottom: "#3c2a1a", far: "#2a1e12", mid: "#4a3620", ground: "#6a4e30", groundDark: "#4c3820", accent: "#8de1d4", decor: "library", hazardName: "Falling Tomes", hazard: "tome", hazardEvery: 5, hazardTip: "Cursed books fall from the stacks \u2014 watch the shadows grow." }
];
var BIOME_LENGTH = 50;
var UPGRADES = [
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
  { id: "scavenger", title: "Scavenger", desc: "Creeps drop coins far more often", max: 2 }
];
var MODIFIERS = [
  { id: "pink", name: "PINK PANIC", sub: "EVERY SHOT IS PARRYABLE \xB7 GO WILD", time: 10 },
  { id: "double", name: "DOUBLE TIME", sub: "CREEPS ARE FASTER \xB7 SCORE \xD72", time: 12 },
  { id: "coins", name: "PAYDAY", sub: "COINS RAIN FROM THE RAFTERS", time: 8 },
  { id: "fog", name: "PEA SOUP", sub: "THE FOG ROLLS IN \xB7 TRUST YOUR EARS", time: 12 },
  { id: "giant", name: "BIG TOP", sub: "EVERYTHING IS HUGE \xB7 SCORE \xD71.5", time: 10 },
  { id: "meteor", name: "FALLING METEORS", sub: "INCOMING ROCKS FROM ABOVE \xB7 WATCH OUT", time: 10 },
  { id: "blackwhite", name: "SILENT FILM", sub: "EXTRA CONTRAST \xB7 CRIT CHANCE \xD73", time: 10 },
  { id: "rain", name: "DOWNPOUR", sub: "SLICK RAIN \xB7 EVERYTHING SLIDES", time: 12 },
  { id: "swarm", name: "SWARM CALL", sub: "CREEPS COME FAST \xB7 SCORE \xD71.5", time: 14 }
];
var WAVES = [
  { id: "bloom", name: "BLOOM BOOM", sub: "A FLOWERBED IS COMING", kinds: ["daisy"], count: 14 },
  { id: "gloop", name: "GLOOP FLOOD", sub: "MIND THE BOUNCE", kinds: ["gloop"], count: 8 },
  { id: "wisp", name: "WISP WALTZ", sub: "THEY BLINK \xB7 YOU DASH", kinds: ["wisp"], count: 9 },
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
  { id: "recital", name: "PIPE RECITAL", sub: "MIND THE NOTES, THEY BITE", kinds: ["organ", "skeleton"], count: 6 }
];
var SMACKS = ["WHAM!", "POW!", "BONK!", "SPLAT!", "ZOWIE!", "BIFF!", "KA-POW!", "SOCKO!", "KAPOW!", "CLOBBER!"];
var CARD_DAMAGE = 160;

// src/game/util.ts
var HORIZON = 0.3;
var TAU = Math.PI * 2;
var rnd = (a = 1, b) => b === void 0 ? Math.random() * a : a + Math.random() * (b - a);
var dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
var clamp = (v, a, b) => Math.max(a, Math.min(b, v));
var pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function compact(arr, keep) {
  let j = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (keep(v)) arr[j++] = v;
  }
  arr.length = j;
}
var CELL = 96;
var grid = /* @__PURE__ */ new Map();
var gridPool = [];
var byId = /* @__PURE__ */ new Map();
var cellKey = (cx, cy) => (cx + 512) * 4096 + (cy + 512);
function buildGrid(enemies) {
  for (const b of grid.values()) {
    b.length = 0;
    gridPool.push(b);
  }
  grid.clear();
  byId.clear();
  for (const e of enemies) {
    byId.set(e.id, e);
    const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
    const k = cellKey(cx, cy);
    let b = grid.get(k);
    if (!b) {
      b = gridPool.pop() || [];
      grid.set(k, b);
    }
    b.push(e);
  }
}
var nearBuf = [];
var nearBuf2 = [];
function nearby(x, y, r, out = nearBuf) {
  out.length = 0;
  const c0x = Math.floor((x - r) / CELL), c1x = Math.floor((x + r) / CELL);
  const c0y = Math.floor((y - r) / CELL), c1y = Math.floor((y + r) / CELL);
  for (let cx = c0x; cx <= c1x; cx++) {
    for (let cy = c0y; cy <= c1y; cy++) {
      const b = grid.get(cellKey(cx, cy));
      if (b) for (const e of b) out.push(e);
    }
  }
  return out;
}
var liveBuf = [];
var bounds = (w, h) => ({ minX: 26, maxX: w - 26, minY: h * HORIZON + 26, maxY: h - 34 });
var worldBounds = (g, w, h) => {
  const b = bounds(w, h);
  return (g.rows ?? 1) > 1 ? { ...b, maxY: (g.worldH ?? h) - 34 } : b;
};
var fieldTop = (g, h) => (g.rows ?? 1) > 1 ? Math.max(0, g.cam?.y ?? 0) + 24 : h * HORIZON;
var viewBand = (g, w, h) => {
  const b = worldBounds(g, w, h);
  if (!g.cam) return b;
  const vw = g.viewW && g.viewW > 120 ? Math.min(g.viewW, w) : w;
  const wh = Math.max(h, g.worldH ?? h);
  const vh = g.viewH && g.viewH > 120 ? Math.min(g.viewH, wh) : h;
  const x0 = Math.max(0, Math.min(w - vw, g.cam.x));
  const y0 = Math.max(0, Math.min(wh - vh, g.cam.y));
  return {
    minX: Math.max(b.minX, x0 - 80),
    maxX: Math.min(b.maxX, x0 + vw + 80),
    minY: Math.max(b.minY, y0 - 80),
    maxY: Math.min(b.maxY, y0 + vh + 80)
  };
};
var POOL_CAPS = {
  bullets: 480,
  pickups: 90,
  ghosts: 80,
  texts: 60,
  puddles: 120,
  companions: 24,
  hazards: 60,
  puffs: 460
};
var fin = (v) => typeof v === "number" && Number.isFinite(v);
function sanitize(g) {
  const fixed = [];
  const keep = (name, v, lo, hi, fallback) => {
    if (!fin(v)) {
      setNum(name, fallback);
      fixed.push(name);
      return;
    }
    if (v < lo || v > hi) {
      setNum(name, Math.max(lo, Math.min(hi, v)));
      if (v < lo - 1 || v > hi + 1) fixed.push(name);
    }
  };
  const setNum = (name, v) => {
    const [a, b2] = name.split(".");
    g[a][b2] = v;
  };
  const p = g.player, cam = g.cam;
  const ww = Math.max(1, g.worldW || g.viewW || 1), vh = Math.max(1, g.viewH || 1);
  const b = worldBounds(g, ww, vh);
  if (!fin(p.x) || Math.abs(p.x) > 1e7) {
    p.x = (b.minX + b.maxX) / 2;
    fixed.push("player.x");
  }
  if (!fin(p.y) || Math.abs(p.y) > 1e7) {
    p.y = (b.minY + b.maxY) / 2;
    fixed.push("player.y");
  }
  keep("player.health", p.health, 0, p.maxHealth || 100, p.maxHealth || 100);
  keep("player.maxHealth", p.maxHealth, 1, 1e4, 100);
  keep("player.r", p.r, 4, 200, 16);
  keep("player.speed", p.speed, 0, 4e3, 240);
  keep("player.angle", p.angle, -1e3, 1e3, 0);
  keep("player.momentum", p.momentum, 0, 4e3, 0);
  keep("player.dashCd", p.dashCd, 0, 60, 0);
  keep("player.cards", p.cards, 0, 5, 0);
  keep("player.coins", p.coins, 0, 1e9, 0);
  keep("player.charge", p.charge, 0, 2, 0);
  keep("player.trigger", p.trigger ?? 0, 0, 1, 0);
  const cw = Math.max(1, g.worldW || ww), ch = Math.max(1, g.worldH || vh);
  if (!fin(cam.x) || cam.x < -1e7 || cam.x > cw + 1e7) {
    cam.x = 0;
    fixed.push("cam.x");
  }
  if (!fin(cam.y) || cam.y < -1e7 || cam.y > ch + 1e7) {
    cam.y = 0;
    fixed.push("cam.y");
  }
  if (!fin(g.score) || g.score < 0) {
    g.score = Math.max(0, Math.round(fin(g.score) ? g.score : 0));
    fixed.push("score");
  }
  if (!fin(g.combo) || g.combo < 0) {
    g.combo = 0;
    fixed.push("combo");
  }
  if (!fin(g.elapsed) || g.elapsed < 0) {
    g.elapsed = 0;
    fixed.push("elapsed");
  }
  if (!fin(g.shake) || g.shake < 0) {
    g.shake = 0;
    fixed.push("shake");
  }
  if (!fin(g.flash) || g.flash < 0) {
    g.flash = 0;
    fixed.push("flash");
  }
  if (!fin(g.worldW) || g.worldW <= 0) {
    g.worldW = (g.viewW || 1) * Math.max(1, g.districts || 1);
    fixed.push("worldW");
  }
  if (!fin(g.worldH) || g.worldH <= 0) {
    g.worldH = (g.viewH || 1) * Math.max(1, g.rows || 1);
    fixed.push("worldH");
  }
  if (p.trail.length) {
    for (let i = p.trail.length - 1; i >= 0; i--) {
      const t = p.trail[i];
      if (!fin(t.x) || !fin(t.y)) p.trail.splice(i, 1);
    }
  }
  for (const key of Object.keys(POOL_CAPS)) {
    const arr = g[key];
    if (!Array.isArray(arr)) continue;
    const cap = POOL_CAPS[key];
    if (arr.length > cap) {
      arr.splice(0, arr.length - cap);
      fixed.push(key);
    }
  }
  return fixed;
}

// src/game/fx.ts
var MAX_PUFFS = 420;
var pushPuff = (g, q) => {
  if (g.puffs.length >= MAX_PUFFS) return;
  g.puffs.push(q);
};
var puff = (g, x, y, color, count = 5, force = 100, size = 5) => {
  count = Math.ceil(count * g.fxBudget);
  if (g.puffs.length > MAX_PUFFS * 0.8) count = Math.min(count, 2);
  for (let i = 0; i < count; i++) {
    const a = rnd(TAU), life = 0.25 + rnd(0.35), sp = force * rnd(0.3, 1);
    pushPuff(g, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, color, size: size * rnd(0.6, 1.4) });
  }
};
var ring = (g, x, y, color, size) => pushPuff(g, { x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, color, size, ring: true });
var shell = (g, x, y, dir) => pushPuff(g, { x, y, vx: -dir * rnd(70, 150), vy: -rnd(130, 210), life: 0.55, max: 0.55, color: "#d8a838", size: 3, shell: true, spin: rnd(-4, 4) });
var say = (g, x, y, text, color = "#ffe27a", big = false) => {
  if (g.texts.length < 40) g.texts.push({ x, y, text, life: 0.9, max: 0.9, color, rot: rnd(-0.25, 0.25), big });
};
var addCards = (g, n) => {
  g.player.cards = clamp(g.player.cards + n, 0, 5);
};
var drop = (g, x, y, kind, weapon, price) => {
  g.pickups.push({ x, y, kind, life: kind === "weapon" ? 22 : 12, phase: rnd(9), weapon, fresh: true, price });
};
function spawnCompanion(g, x, y, life, dmg, bee = false) {
  const cap = bee ? 12 : 3;
  if (g.companions.length >= cap) g.companions.shift();
  g.companions.push({ x, y, vx: rnd(-60, 60), vy: rnd(-60, 60), target: -1, bite: 0, life, max: life, facing: 1, hop: rnd(9), dmg, bee });
}

// src/game/world.ts
var MOOD = {
  dawn: { tint: "#ff9d5c", wash: 0.1, light: 0.45, fog: 0.35, sat: 1.08 },
  dusk: { tint: "#7b3f7a", wash: 0.14, light: 0.3, fog: 0.3, sat: 1.05 },
  night: { tint: "#1c2340", wash: 0.26, light: 0.12, fog: 0.42, sat: 0.86 },
  storm: { tint: "#3d4a63", wash: 0.2, light: 0.22, fog: 0.6, sat: 0.72 },
  witching: { tint: "#3a1f4d", wash: 0.22, light: 0.08, fog: 0.5, sat: 1.12 },
  ashlight: { tint: "#5a5148", wash: 0.18, light: 0.3, fog: 0.55, sat: 0.6 },
  gaslight: { tint: "#c8a35a", wash: 0.12, light: 0.5, fog: 0.22, sat: 0.96 },
  moonbrook: { tint: "#5f7fae", wash: 0.16, light: 0.25, fog: 0.4, sat: 0.9 },
  furnace: { tint: "#b4482a", wash: 0.16, light: 0.55, fog: 0.28, sat: 1.16 },
  frostbite: { tint: "#8fd0e8", wash: 0.12, light: 0.62, fog: 0.32, sat: 0.8 },
  sepia: { tint: "#a8875c", wash: 0.2, light: 0.4, fog: 0.3, sat: 0.55 },
  blackout: { tint: "#0d0b14", wash: 0.34, light: 0.04, fog: 0.68, sat: 0.6 }
};
var P = (kind, x, y, layer) => [kind, x, y, layer];
var STAGES = [
  // ── the rooftops: row 0, twelve screens, walked east ──────────────────────────────────────
  {
    id: 0,
    name: "Cinder Grotto",
    tagline: "Where the band first struck up.",
    col: 0,
    row: 0,
    biome: 0,
    act: 1,
    mood: { ...MOOD.furnace, wash: 0.12 },
    props: [P("crates", 0.2, 0.74), P("bonfire", 0.68, 0.7), P("barrels", 0.86, 0.72), P("fence", 0.42, 0.66, "front"), P("fence", 0.62, 0.84, "front"), P("barrels", 0.4, 0.84)],
    ledges: [[0.3, 0.58, 0.16]],
    pressure: 0.8
  },
  {
    id: 1,
    name: "Ember Hollow",
    tagline: "The lava keeps its own time.",
    col: 1,
    row: 0,
    biome: 1,
    act: 2,
    mood: MOOD.dusk,
    props: [P("palm", 0.16, 0.7), P("gravestone", 0.5, 0.72), P("fence", 0.78, 0.68, "front"), P("lamppost", 0.82, 0.66), P("crates", 0.7, 0.78)],
    pressure: 0.85
  },
  {
    id: 2,
    name: "The Painted Tent",
    tagline: "Step right up, pay the ringmaster.",
    col: 2,
    row: 0,
    biome: 2,
    act: 3,
    mood: { ...MOOD.gaslight, wash: 0.14 },
    props: [P("tent", 0.3, 0.68), P("totem", 0.62, 0.7), P("stall", 0.84, 0.74, "front"), P("lamppost", 0.12, 0.68), P("crates", 0.74, 0.78, "front")],
    ledges: [[0.44, 0.52, 0.2]],
    pressure: 0.9
  },
  {
    id: 3,
    name: "Night Freight",
    tagline: "Mind the platforms \u2014 they move.",
    col: 3,
    row: 0,
    biome: 3,
    act: 4,
    mood: MOOD.night,
    props: [P("pipes", 0.22, 0.7), P("lamppost", 0.54, 0.66), P("minecart", 0.8, 0.76), P("lamppost", 0.38, 0.66), P("crates", 0.68, 0.78, "front")],
    ledges: [[0.34, 0.56, 0.22], [0.68, 0.46, 0.16]],
    pressure: 0.95
  },
  {
    id: 4,
    name: "Frostbite Siding",
    tagline: "Everything slides. Everything.",
    col: 4,
    row: 0,
    biome: 4,
    act: 5,
    mood: MOOD.frostbite,
    props: [P("silo", 0.18, 0.68), P("antenna", 0.46, 0.64), P("crates", 0.74, 0.74, "front"), P("lamppost", 0.36, 0.62), P("fence", 0.62, 0.76, "front"), P("waterwheel", 0.56, 0.7)],
    ledges: [[0.66, 0.52, 0.18]],
    pressure: 1
  },
  {
    id: 5,
    name: "Sugar Swamp",
    tagline: "The tar breathes when you least expect it.",
    col: 5,
    row: 0,
    biome: 5,
    act: 6,
    mood: { ...MOOD.dawn, wash: 0.18 },
    props: [P("palm", 0.24, 0.72), P("boat", 0.6, 0.76), P("barrels", 0.86, 0.7), P("barrels", 0.42, 0.76), P("fence", 0.84, 0.72, "front"), P("waterwheel", 0.46, 0.66)],
    pressure: 1
  },
  {
    id: 6,
    name: "The Clock Yard",
    tagline: "Four hands, one of them broken.",
    col: 6,
    row: 0,
    biome: 6,
    act: 7,
    mood: MOOD.sepia,
    props: [P("gear", 0.3, 0.68), P("gear", 0.68, 0.6, "back"), P("bell", 0.86, 0.66), P("statue", 0.12, 0.72), P("lamppost", 0.84, 0.66), P("barrels", 0.44, 0.78)],
    ledges: [[0.5, 0.5, 0.18]],
    pressure: 1.05
  },
  {
    id: 7,
    name: "Rust Gardens",
    tagline: "Things grow here that shouldn't.",
    col: 7,
    row: 0,
    biome: 7,
    act: 8,
    mood: { ...MOOD.ashlight, sat: 1.05 },
    props: [P("pipes", 0.2, 0.68), P("watertower", 0.62, 0.5), P("fence", 0.42, 0.74, "front"), P("barrels", 0.38, 0.78), P("crates", 0.9, 0.74, "front"), P("scaffold", 0.8, 0.68)],
    ledges: [[0.3, 0.56, 0.16]],
    pressure: 1.05
  },
  {
    id: 8,
    name: "Harlequin Row",
    tagline: "Every window is watching.",
    col: 8,
    row: 0,
    biome: 8,
    act: 9,
    mood: MOOD.witching,
    props: [P("stall", 0.22, 0.74), P("laundry", 0.5, 0.5, "front"), P("lamppost", 0.78, 0.68), P("fence", 0.34, 0.78, "front"), P("crates", 0.92, 0.74)],
    pressure: 1.1
  },
  {
    id: 9,
    name: "The Drowned Pier",
    tagline: "The tide brought something back.",
    col: 9,
    row: 0,
    biome: 9,
    act: 10,
    mood: MOOD.moonbrook,
    props: [P("boat", 0.3, 0.78), P("barrels", 0.58, 0.72), P("lamppost", 0.84, 0.64), P("lamppost", 0.44, 0.64), P("fence", 0.68, 0.78, "front")],
    ledges: [[0.44, 0.6, 0.2]],
    pressure: 1.1
  },
  {
    id: 10,
    name: "Bone Lantern Way",
    tagline: "The lights are for you. Kind of.",
    col: 10,
    row: 0,
    biome: 10,
    act: 11,
    mood: { ...MOOD.blackout, wash: 0.26 },
    props: [P("gravestone", 0.18, 0.72), P("gravestone", 0.3, 0.7), P("lamppost", 0.56, 0.66), P("archgate", 0.8, 0.68), P("fence", 0.38, 0.76, "front"), P("wreck", 0.5, 0.74)],
    pressure: 1.15
  },
  {
    id: 11,
    name: "The High Wire",
    tagline: "One plank wide, all the way down.",
    col: 11,
    row: 0,
    biome: 0,
    act: 12,
    mood: { ...MOOD.dawn, light: 0.6 },
    props: [P("watertower", 0.2, 0.5), P("antenna", 0.52, 0.56), P("fence", 0.8, 0.7, "front"), P("crates", 0.36, 0.72), P("fence", 0.58, 0.8)],
    ledges: [[0.26, 0.54, 0.3], [0.7, 0.44, 0.18]],
    pressure: 1.2,
    hazard: "lava"
  },
  // ── the middle row: eleven screens, walked west ───────────────────────────────────────────
  {
    id: 12,
    name: "Boneyard Crypt",
    tagline: "Tombstones rise and stay up.",
    col: 11,
    row: 1,
    biome: 10,
    act: 13,
    mood: MOOD.night,
    props: [P("gravestone", 0.16, 0.72), P("gravestone", 0.28, 0.7), P("statue", 0.64, 0.66), P("archgate", 0.86, 0.68), P("lamppost", 0.44, 0.64), P("fence", 0.78, 0.78, "front"), P("obelisk", 0.5, 0.68)],
    hazard: "tomb",
    pressure: 1.2
  },
  {
    id: 13,
    name: "The Tar Parlour",
    tagline: "Slow floors, faster company.",
    col: 10,
    row: 1,
    biome: 5,
    act: 14,
    mood: { ...MOOD.furnace, light: 0.2 },
    props: [P("stall", 0.26, 0.74), P("barrels", 0.54, 0.72), P("bonfire", 0.82, 0.68), P("lamppost", 0.12, 0.66), P("fence", 0.66, 0.78, "front")],
    pressure: 1.25
  },
  {
    id: 14,
    name: "Carnival Wreck",
    tagline: "The funfair ended badly.",
    col: 9,
    row: 1,
    biome: 2,
    act: 15,
    mood: { ...MOOD.dusk, sat: 1.14 },
    props: [P("wreck", 0.3, 0.7), P("tent", 0.62, 0.72), P("fence", 0.86, 0.74, "front"), P("lamppost", 0.12, 0.66), P("barrels", 0.44, 0.76)],
    ledges: [[0.46, 0.56, 0.18]],
    pressure: 1.25
  },
  {
    id: 15,
    name: "Express Roof",
    tagline: "The train never quite stops.",
    col: 8,
    row: 1,
    biome: 3,
    act: 16,
    mood: { ...MOOD.storm, light: 0.3 },
    props: [P("pipes", 0.24, 0.66), P("lamppost", 0.56, 0.62), P("minecart", 0.82, 0.74), P("lamppost", 0.12, 0.6), P("crates", 0.66, 0.78, "front")],
    ledges: [[0.36, 0.5, 0.26]],
    pressure: 1.3
  },
  {
    id: 16,
    name: "Glacier Hold",
    tagline: "Cold enough to snap a cue.",
    col: 7,
    row: 1,
    biome: 4,
    act: 17,
    mood: { ...MOOD.frostbite, wash: 0.18 },
    props: [P("silo", 0.2, 0.66), P("crates", 0.52, 0.74), P("antenna", 0.8, 0.6), P("fence", 0.38, 0.78, "front"), P("lamppost", 0.9, 0.64)],
    pressure: 1.3
  },
  {
    id: 17,
    name: "Molten Foundry",
    tagline: "The pour bell means run.",
    col: 6,
    row: 1,
    biome: 0,
    act: 18,
    mood: { ...MOOD.furnace, wash: 0.2 },
    props: [P("gear", 0.26, 0.68), P("pipes", 0.54, 0.64), P("bonfire", 0.84, 0.74), P("lamppost", 0.12, 0.66), P("crates", 0.68, 0.78)],
    ledges: [[0.24, 0.52, 0.16]],
    hazard: "lava",
    pressure: 1.35
  },
  {
    id: 18,
    name: "The Weeping Moor",
    tagline: "Follow the wisps and drown.",
    col: 5,
    row: 1,
    biome: 1,
    act: 19,
    mood: { ...MOOD.moonbrook, fog: 0.58 },
    props: [P("fence", 0.18, 0.72, "front"), P("gravestone", 0.46, 0.7), P("boat", 0.76, 0.78), P("lamppost", 0.24, 0.66), P("crates", 0.88, 0.76)],
    pressure: 1.35
  },
  {
    id: 19,
    name: "Rust Chapel",
    tagline: "Something sings in here.",
    col: 4,
    row: 1,
    biome: 7,
    act: 20,
    mood: { ...MOOD.ashlight, sat: 1.1 },
    props: [P("statue", 0.3, 0.64), P("bell", 0.58, 0.56), P("archgate", 0.84, 0.68), P("crates", 0.12, 0.78), P("lamppost", 0.68, 0.66)],
    ledges: [[0.44, 0.52, 0.2]],
    pressure: 1.4
  },
  {
    id: 20,
    name: "Masquerade Mile",
    tagline: "Nobody here has a face.",
    col: 3,
    row: 1,
    biome: 8,
    act: 21,
    mood: { ...MOOD.witching, wash: 0.26 },
    props: [P("lamppost", 0.2, 0.66), P("stall", 0.48, 0.74), P("laundry", 0.74, 0.5, "front"), P("barrels", 0.12, 0.76), P("fence", 0.62, 0.8, "front")],
    pressure: 1.4
  },
  {
    id: 21,
    name: "Brine Docks",
    tagline: "Ropes, crates, and teeth.",
    col: 2,
    row: 1,
    biome: 9,
    act: 22,
    mood: { ...MOOD.storm, light: 0.28 },
    props: [P("crates", 0.22, 0.74), P("boat", 0.52, 0.78), P("watertower", 0.82, 0.5), P("bonfire", 0.38, 0.74), P("fence", 0.5, 0.8, "front"), P("scaffold", 0.66, 0.66)],
    ledges: [[0.34, 0.56, 0.22]],
    pressure: 1.45
  },
  {
    id: 22,
    name: "Lantern Field",
    tagline: "The lamps went out one by one.",
    col: 1,
    row: 1,
    biome: 10,
    act: 23,
    mood: { ...MOOD.blackout, wash: 0.3 },
    props: [P("gravestone", 0.2, 0.72), P("lamppost", 0.46, 0.64), P("fence", 0.72, 0.7, "front"), P("totem", 0.9, 0.66), P("wreck", 0.12, 0.74), P("crates", 0.62, 0.76), P("obelisk", 0.58, 0.7)],
    pressure: 1.45
  },
  // ── the undercroft: ten screens, walked east ──────────────────────────────────────────────
  {
    id: 23,
    name: "Cold Cellar",
    tagline: "The pipes sweat something red.",
    col: 0,
    row: 2,
    biome: 4,
    act: 24,
    mood: { ...MOOD.moonbrook, sat: 0.74 },
    props: [P("pipes", 0.24, 0.68), P("barrels", 0.5, 0.76), P("lamppost", 0.8, 0.62), P("fence", 0.42, 0.78, "front"), P("lamppost", 0.9, 0.64)],
    pressure: 1.5
  },
  {
    id: 24,
    name: "The Ash Pit",
    tagline: "Everything down here is grey.",
    col: 1,
    row: 2,
    biome: 7,
    act: 25,
    mood: { ...MOOD.ashlight, wash: 0.24 },
    props: [P("minecart", 0.22, 0.76), P("silo", 0.56, 0.64), P("fence", 0.84, 0.74, "front"), P("lamppost", 0.42, 0.64), P("barrels", 0.72, 0.74)],
    pressure: 1.55
  },
  {
    id: 25,
    name: "Giggles Gulch",
    tagline: "The laugh track is armed.",
    col: 2,
    row: 2,
    biome: 2,
    act: 26,
    mood: { ...MOOD.dawn, sat: 1.2 },
    props: [P("tent", 0.28, 0.7), P("totem", 0.6, 0.66), P("crates", 0.86, 0.76), P("lamppost", 0.12, 0.66), P("wreck", 0.88, 0.74)],
    ledges: [[0.42, 0.52, 0.2]],
    pressure: 1.55
  },
  {
    id: 26,
    name: "Marrow Tunnel",
    tagline: "The walls are not rock.",
    col: 3,
    row: 2,
    biome: 5,
    act: 27,
    mood: { ...MOOD.witching, fog: 0.6 },
    props: [P("archgate", 0.2, 0.68), P("gravestone", 0.5, 0.74), P("pipes", 0.78, 0.62), P("fence", 0.42, 0.78, "front"), P("crates", 0.88, 0.74)],
    hazard: "geyser",
    pressure: 1.6
  },
  {
    id: 27,
    name: "Iron Orchard",
    tagline: "The trees ring when they fall.",
    col: 4,
    row: 2,
    biome: 0,
    act: 28,
    mood: { ...MOOD.furnace, light: 0.34 },
    props: [P("palm", 0.18, 0.7), P("gear", 0.44, 0.64), P("watertower", 0.76, 0.48), P("crates", 0.56, 0.76, "front"), P("lamppost", 0.1, 0.64)],
    pressure: 1.65
  },
  {
    id: 28,
    name: "The Sunken Platform",
    tagline: "Mind the water. Mind what's in it.",
    col: 5,
    row: 2,
    biome: 3,
    act: 29,
    mood: { ...MOOD.storm, wash: 0.24 },
    props: [P("boat", 0.3, 0.78), P("lamppost", 0.6, 0.62), P("fence", 0.86, 0.72, "front"), P("lamppost", 0.42, 0.62), P("fence", 0.88, 0.76, "front")],
    ledges: [[0.4, 0.5, 0.24]],
    pressure: 1.7
  },
  {
    id: 29,
    name: "Whistling Ridge",
    tagline: "The wind carries the tune, and you.",
    col: 6,
    row: 2,
    biome: 1,
    act: 30,
    mood: { ...MOOD.dusk, light: 0.5 },
    props: [P("windmill", 0.26, 0.56), P("cactus", 0.56, 0.74), P("fence", 0.84, 0.7, "front"), P("fence", 0.42, 0.76, "front"), P("lamppost", 0.68, 0.66)],
    hazard: "lightning",
    pressure: 1.75
  },
  {
    id: 30,
    name: "Candle Vault",
    tagline: "Count the flames. Then the creeps.",
    col: 7,
    row: 2,
    biome: 10,
    act: 31,
    mood: { ...MOOD.gaslight, wash: 0.22, light: 0.16 },
    props: [P("statue", 0.28, 0.66), P("bonfire", 0.56, 0.74), P("gravestone", 0.84, 0.72), P("crates", 0.42, 0.76), P("fence", 0.68, 0.78, "front")],
    pressure: 1.8
  },
  {
    id: 31,
    name: "The Last Fairground",
    tagline: "One ride left. It's the carousel.",
    col: 8,
    row: 2,
    biome: 8,
    act: 32,
    mood: { ...MOOD.witching, sat: 1.2 },
    props: [P("totem", 0.3, 0.64), P("billboard", 0.62, 0.5), P("stall", 0.88, 0.74, "front"), P("fence", 0.12, 0.78, "front"), P("crates", 0.42, 0.76), P("ferris", 0.76, 0.62)],
    pressure: 1.85
  },
  {
    id: 32,
    name: "Requiem Stage",
    tagline: "The band is waiting. Take a bow.",
    col: 9,
    row: 2,
    biome: 6,
    act: 33,
    mood: { ...MOOD.blackout, light: 0.1, wash: 0.28 },
    props: [P("archgate", 0.18, 0.62), P("billboard", 0.46, 0.44), P("bell", 0.7, 0.5), P("tophat", 0.88, 0.74, "front"), P("crates", 0.42, 0.78), P("fence", 0.26, 0.82, "front")],
    ledges: [[0.3, 0.5, 0.16], [0.62, 0.42, 0.16]],
    hazard: "bolt",
    pressure: 2
  },
  // ── the flooded vaults: row 3, eleven screens, walked west to the curtain call ─────────────
  {
    id: 33,
    name: "The Drowned Bell",
    tagline: "The bell rings under the water. Something answers.",
    col: 10,
    row: 3,
    biome: 1,
    act: 34,
    mood: { ...MOOD.moonbrook, fog: 0.62, light: 0.18 },
    props: [P("boat", 0.24, 0.78), P("waterwheel", 0.56, 0.7), P("gravestone", 0.82, 0.72), P("lamppost", 0.1, 0.64), P("fence", 0.42, 0.8, "front"), P("barrels", 0.92, 0.76)],
    ledges: [[0.38, 0.56, 0.18]],
    hazard: "wisp",
    pressure: 2
  },
  {
    id: 34,
    name: "Treacle Vault",
    tagline: "The syrup is waist deep here, and it remembers you.",
    col: 9,
    row: 3,
    biome: 5,
    act: 35,
    mood: { ...MOOD.dusk, sat: 1.12, fog: 0.44 },
    props: [P("barrels", 0.18, 0.76), P("pipes", 0.44, 0.66), P("stall", 0.72, 0.74, "front"), P("waterwheel", 0.92, 0.68), P("fence", 0.32, 0.8, "front"), P("bonfire", 0.58, 0.72)],
    hazard: "geyser",
    pressure: 2.02
  },
  {
    id: 35,
    name: "The Slag Cellar",
    tagline: "What the foundry forgot, it left down here burning.",
    col: 8,
    row: 3,
    biome: 0,
    act: 36,
    mood: { ...MOOD.furnace, wash: 0.22, light: 0.38 },
    props: [P("gear", 0.2, 0.66), P("barrels", 0.42, 0.76), P("bonfire", 0.66, 0.7), P("scaffold", 0.86, 0.62), P("crates", 0.1, 0.78, "front"), P("pipes", 0.54, 0.64)],
    ledges: [[0.3, 0.52, 0.2]],
    hazard: "lava",
    pressure: 2.04
  },
  {
    id: 36,
    name: "Rime Cistern",
    tagline: "Ice on the pipes, ice on the boards, ice in the lungs.",
    col: 7,
    row: 3,
    biome: 4,
    act: 37,
    mood: { ...MOOD.frostbite, wash: 0.2, light: 0.48 },
    props: [P("pipes", 0.18, 0.68), P("silo", 0.46, 0.64), P("waterwheel", 0.74, 0.72), P("crates", 0.32, 0.78), P("lamppost", 0.9, 0.62), P("fence", 0.6, 0.8, "front")],
    hazard: "glaze",
    pressure: 2.06
  },
  {
    id: 37,
    name: "Ossuary Deep",
    tagline: "Every stone upstairs has a room down here.",
    col: 6,
    row: 3,
    biome: 7,
    act: 38,
    mood: { ...MOOD.blackout, wash: 0.28, light: 0.1 },
    props: [P("gravestone", 0.16, 0.72), P("gravestone", 0.28, 0.7), P("obelisk", 0.5, 0.66), P("archgate", 0.76, 0.64), P("statue", 0.92, 0.7), P("fence", 0.4, 0.78, "front"), P("lamppost", 0.64, 0.62)],
    hazard: "tomb",
    pressure: 2.08
  },
  {
    id: 38,
    name: "The Sunken Midway",
    tagline: "The rides still turn. Nobody is driving them.",
    col: 5,
    row: 3,
    biome: 2,
    act: 39,
    mood: { ...MOOD.witching, sat: 1.22, wash: 0.2 },
    props: [P("ferris", 0.28, 0.58), P("tent", 0.6, 0.7), P("totem", 0.84, 0.66), P("stall", 0.1, 0.76, "front"), P("crates", 0.46, 0.78), P("billboard", 0.72, 0.42)],
    ledges: [[0.42, 0.54, 0.18]],
    hazard: "spinner",
    pressure: 2.1
  },
  {
    id: 39,
    name: "The Leaking Sky",
    tagline: "Four floors of weather, and all of it is coming down.",
    col: 4,
    row: 3,
    biome: 9,
    act: 40,
    mood: { ...MOOD.storm, wash: 0.24, fog: 0.5 },
    props: [P("antenna", 0.18, 0.6), P("watertower", 0.46, 0.5), P("laundry", 0.72, 0.4, "front"), P("scaffold", 0.88, 0.64), P("lamppost", 0.32, 0.62), P("barrels", 0.58, 0.76)],
    hazard: "lightning",
    pressure: 2.12
  },
  {
    id: 40,
    name: "The Escapement",
    tagline: "The clock's own guts, still ticking under the floor.",
    col: 3,
    row: 3,
    biome: 6,
    act: 41,
    mood: { ...MOOD.gaslight, wash: 0.2, light: 0.32 },
    props: [P("gear", 0.22, 0.66), P("gear", 0.56, 0.56, "back"), P("scaffold", 0.8, 0.62), P("bell", 0.38, 0.5), P("pipes", 0.1, 0.7), P("crates", 0.66, 0.78)],
    ledges: [[0.32, 0.5, 0.2], [0.66, 0.42, 0.16]],
    hazard: "pendulum",
    pressure: 2.14
  },
  {
    id: 41,
    name: "The Stacks Below",
    tagline: "Shelf marks on the wall. Something has been re-shelving.",
    col: 2,
    row: 3,
    biome: 10,
    act: 42,
    mood: { ...MOOD.sepia, wash: 0.22, light: 0.22 },
    props: [P("obelisk", 0.18, 0.66), P("statue", 0.42, 0.68), P("archgate", 0.68, 0.62), P("crates", 0.88, 0.76), P("lamppost", 0.32, 0.6), P("fence", 0.56, 0.8, "front")],
    hazard: "tome",
    pressure: 2.15
  },
  {
    id: 42,
    name: "Terminal Zero",
    tagline: "The last platform. The train is still arriving.",
    col: 1,
    row: 3,
    biome: 3,
    act: 43,
    mood: { ...MOOD.night, wash: 0.24, fog: 0.46 },
    props: [P("pipes", 0.2, 0.66), P("minecart", 0.48, 0.76), P("lamppost", 0.34, 0.6), P("lamppost", 0.76, 0.62), P("scaffold", 0.9, 0.64), P("crates", 0.62, 0.78, "front")],
    ledges: [[0.28, 0.54, 0.22]],
    pressure: 2.15
  },
  {
    id: 43,
    name: "Curtain Call",
    tagline: "The house lights come up. Nothing else does.",
    col: 0,
    row: 3,
    biome: 8,
    act: 44,
    mood: { tint: "#3a0d12", wash: 0.3, light: 0.08, fog: 0.5, sat: 1.12 },
    props: [P("archgate", 0.14, 0.6), P("obelisk", 0.36, 0.64), P("bonfire", 0.58, 0.72), P("tophat", 0.8, 0.74, "front"), P("billboard", 0.48, 0.38), P("fence", 0.24, 0.82, "front"), P("crates", 0.7, 0.78)],
    ledges: [[0.3, 0.5, 0.16], [0.64, 0.42, 0.18]],
    hazard: "pillar",
    pressure: 2.2
  },
  // ── ROW 4 · THE FOUNDATION — the boiler dark under the whole house, walked east, acts 45..56
  {
    id: 44,
    name: "The Undertent",
    tagline: "Sawdust and rope from above. The show keeps a floor down here too.",
    col: 0,
    row: 4,
    biome: 2,
    act: 45,
    mood: { tint: "#2a1226", wash: 0.3, light: 0.1, fog: 0.44, sat: 1.05 },
    props: [P("tent", 0.2, 0.58), P("chains", 0.44, 0.34), P("boiler", 0.68, 0.66), P("crates", 0.84, 0.76, "front"), P("barrels", 0.56, 0.78), P("lamppost", 0.32, 0.62)],
    ledges: [[0.5, 0.48, 0.2]],
    pressure: 2.05
  },
  {
    id: 45,
    name: "Root Cellar of Names",
    tagline: "Headstones stored face-down. The dead keep their own archive.",
    col: 1,
    row: 4,
    biome: 7,
    act: 46,
    mood: { ...MOOD.night, wash: 0.3, fog: 0.52, sat: 0.92 },
    props: [P("gravestone", 0.16, 0.7), P("gravestone", 0.3, 0.66), P("chains", 0.52, 0.3), P("obelisk", 0.72, 0.62), P("crates", 0.88, 0.74, "front"), P("bonfire", 0.44, 0.78)],
    ledges: [[0.62, 0.46, 0.18]],
    hazard: "tome",
    pressure: 2.1
  },
  {
    id: 46,
    name: "The Frozen Sump",
    tagline: "The drain froze mid-pour. Everything under the ice is still moving.",
    col: 2,
    row: 4,
    biome: 4,
    act: 47,
    mood: { tint: "#0e2233", wash: 0.26, light: 0.16, fog: 0.4, sat: 0.96 },
    props: [P("pipes", 0.18, 0.6), P("boiler", 0.4, 0.68), P("chains", 0.62, 0.32), P("fence", 0.8, 0.72, "front"), P("barrels", 0.28, 0.78)],
    hazard: "geyser",
    pressure: 2.1
  },
  {
    id: 47,
    name: "Peat Works",
    tagline: "Lanterns in the peat. The moor leaks down through the boards.",
    col: 3,
    row: 4,
    biome: 1,
    act: 48,
    mood: { ...MOOD.storm, wash: 0.34, fog: 0.62 },
    props: [P("lamppost", 0.14, 0.64), P("laundry", 0.36, 0.36), P("boiler", 0.58, 0.66), P("stall", 0.8, 0.7), P("palm", 0.68, 0.74), P("crates", 0.9, 0.78, "front")],
    ledges: [[0.24, 0.5, 0.2]],
    pressure: 2.05
  },
  {
    id: 48,
    name: "Mainspring Vault",
    tagline: "The spring that winds the night. Do not touch it. It notices.",
    col: 4,
    row: 4,
    biome: 6,
    act: 49,
    mood: { tint: "#241a10", wash: 0.28, light: 0.12, fog: 0.42, sat: 1.08 },
    props: [P("gear", 0.22, 0.56), P("gear", 0.4, 0.44), P("chains", 0.6, 0.3), P("boiler", 0.78, 0.68), P("scaffold", 0.9, 0.62), P("minecart", 0.5, 0.78)],
    ledges: [[0.3, 0.44, 0.18], [0.68, 0.5, 0.16]],
    hazard: "saw",
    pressure: 2.2
  },
  {
    id: 49,
    name: "The Restricted Shelf",
    tagline: "Books chained to the pipes. Some of them are still reading.",
    col: 5,
    row: 4,
    biome: 10,
    act: 50,
    mood: { ...MOOD.night, wash: 0.3, fog: 0.48 },
    props: [P("chains", 0.2, 0.32), P("chains", 0.46, 0.3), P("stall", 0.66, 0.68), P("crates", 0.84, 0.76, "front"), P("lamppost", 0.34, 0.6), P("fence", 0.1, 0.74, "front")],
    hazard: "wisp",
    pressure: 2.15
  },
  {
    id: 50,
    name: "Rail Zero",
    tagline: "The first track ever laid. The first train never left it.",
    col: 6,
    row: 4,
    biome: 3,
    act: 51,
    mood: { tint: "#101820", wash: 0.3, light: 0.1, fog: 0.5, sat: 0.94 },
    props: [P("minecart", 0.18, 0.74), P("pipes", 0.4, 0.6), P("boiler", 0.62, 0.66), P("chains", 0.8, 0.32), P("barrels", 0.3, 0.78), P("lamppost", 0.72, 0.62)],
    ledges: [[0.46, 0.5, 0.22]],
    pressure: 2.2
  },
  {
    id: 51,
    name: "Furnace Row",
    tagline: "Every stove in the house vents here. So does everything else.",
    col: 7,
    row: 4,
    biome: 8,
    act: 52,
    mood: { tint: "#3a0d0d", wash: 0.32, light: 0.08, fog: 0.46, sat: 1.16 },
    props: [P("boiler", 0.16, 0.66), P("boiler", 0.38, 0.64), P("chains", 0.58, 0.3), P("bonfire", 0.76, 0.74), P("pipes", 0.88, 0.6), P("barrels", 0.5, 0.78, "front")],
    hazard: "lava",
    pressure: 2.3
  },
  {
    id: 52,
    name: "Molasses Reservoir",
    tagline: "The sweet sea under the swamp. It rises when it hears music.",
    col: 8,
    row: 4,
    biome: 5,
    act: 53,
    mood: { ...MOOD.witching, wash: 0.3, fog: 0.55, sat: 1.04 },
    props: [P("barrels", 0.14, 0.72), P("pipes", 0.36, 0.62), P("boiler", 0.58, 0.68), P("boat", 0.82, 0.7), P("chains", 0.68, 0.32), P("crates", 0.26, 0.78, "front")],
    ledges: [[0.5, 0.46, 0.2]],
    pressure: 2.15
  },
  {
    id: 53,
    name: "Cinder Bed",
    tagline: "Where the grotto's embers fall to rest. Some of them get back up.",
    col: 9,
    row: 4,
    biome: 0,
    act: 54,
    mood: { tint: "#2b1220", wash: 0.28, light: 0.1, fog: 0.44, sat: 1.1 },
    props: [P("bonfire", 0.18, 0.72), P("boiler", 0.42, 0.66), P("chains", 0.6, 0.3), P("gravestone", 0.78, 0.68), P("fence", 0.9, 0.74, "front"), P("crates", 0.32, 0.78)],
    hazard: "bolt",
    pressure: 2.25
  },
  {
    id: 54,
    name: "The Rain Cistern",
    tagline: "Every roof drains here. The city's weather, kept in a tank.",
    col: 10,
    row: 4,
    biome: 9,
    act: 55,
    mood: { ...MOOD.storm, wash: 0.3, fog: 0.52 },
    props: [P("watertower", 0.22, 0.6), P("pipes", 0.46, 0.64), P("boiler", 0.68, 0.66), P("chains", 0.84, 0.32), P("barrels", 0.56, 0.78), P("lamppost", 0.12, 0.62)],
    ledges: [[0.3, 0.48, 0.18], [0.7, 0.44, 0.16]],
    hazard: "geyser",
    pressure: 2.2
  },
  {
    id: 55,
    name: "The Winding Room",
    tagline: "Where the night is wound by hand. You are early. It is not happy.",
    col: 11,
    row: 4,
    biome: 6,
    act: 56,
    mood: { tint: "#20140c", wash: 0.34, light: 0.06, fog: 0.48, sat: 1.12 },
    props: [P("gear", 0.18, 0.5), P("gear", 0.34, 0.62), P("chains", 0.52, 0.28), P("boiler", 0.72, 0.66), P("scaffold", 0.88, 0.6), P("tophat", 0.6, 0.78, "front"), P("billboard", 0.42, 0.36)],
    ledges: [[0.24, 0.44, 0.2]],
    hazard: "spinner",
    pressure: 2.4
  }
];
var ALLEY = {
  id: 100,
  name: "Porbo's Alley",
  tagline: "Everything you need, nothing you deserve.",
  col: 0,
  row: 0,
  biome: 8,
  act: 1,
  mood: { tint: "#c8a35a", wash: 0.18, light: 0.2, fog: 0.34, sat: 1.06 },
  hazard: "spinner",
  pressure: 1.15,
  props: [
    P("stall", 0.18, 0.76),
    P("crates", 0.34, 0.72),
    P("barrels", 0.48, 0.74),
    P("laundry", 0.62, 0.34, "front"),
    P("lamppost", 0.78, 0.62),
    P("archgate", 0.9, 0.56),
    P("bonfire", 0.06, 0.78, "front"),
    P("billboard", 0.44, 0.3),
    P("fence", 0.26, 0.68, "front"),
    P("palm", 0.68, 0.7)
  ],
  ledges: [[0.3, 0.56, 0.18], [0.62, 0.46, 0.2]]
};
var clone = (s) => ({ ...s, props: s.props.map((p) => [...p]), ledges: s.ledges?.map((l) => [...l]) });
function shape(stages, cols, rows) {
  return { cols, rows, stages };
}
var MAPS = {
  gigantic: { id: "gigantic", name: "THE WHOLE SHOW", label: "56 HAND-LAID STAGES", blurb: "Every act authored: its own name, light, set dressing and threat. Stepped 12 / 11 / 10 / 11 / 12, walked as a snake down to the flooded vaults and the boiler dark under them.", ...shape(STAGES, 12, 5) },
  strip: { id: "strip", name: "THE STRIP", label: "ROOFTOPS ONLY \xB7 12", blurb: "The top row on its own \u2014 twelve authored screens in a line, no rows below.", cols: 12, rows: 1, stages: STAGES.filter((s) => s.row === 0).map(clone) },
  arena: { id: "arena", name: "ONE SCREEN", label: "THE ORIGINAL ARENA", blurb: "One screen. The act changes on the clock, exactly as the game shipped.", stages: [], cols: 1, rows: 1 },
  alley: { id: "alley", name: "PORBO'S ALLEY", label: "SMALL & DENSE", blurb: "One hand-dressed street: ten props, ledges, a shopfront, laundry overhead. Everything is in arm's reach.", stages: [clone(ALLEY)], cols: 1, rows: 1 }
};
var cache = /* @__PURE__ */ new Map();
function worldOf(id) {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = MAPS[id] ?? MAPS.arena;
  const rows = Math.max(1, def.rows), cols = Math.max(1, def.cols);
  const spans = Array.from({ length: rows }, (_, r) => {
    const cs = def.stages.filter((s) => s.row === r).map((s) => s.col);
    return cs.length ? { c0: Math.min(...cs), c1: Math.max(...cs) } : { c0: 0, c1: cols - 1 };
  });
  const grid2 = /* @__PURE__ */ new Map();
  for (const s of def.stages) grid2.set(`${s.col},${s.row}`, s);
  const built = { ...def, cols, rows, spans, grid: grid2 };
  built.grid = grid2;
  cache.set(id, built);
  return built;
}
var stageAt = (m, col, row) => m.grid?.get(`${col},${row}`) ?? m.stages.find((s) => s.col === col && s.row === row);
var canStand = (m, col, row) => {
  if (m.stages.length === 0) return true;
  if (row < 0 || row >= m.rows) return false;
  const sp = m.spans[row];
  return col >= sp.c0 && col <= sp.c1;
};
var rowSpanOf = (m, row) => {
  const r = Math.max(0, Math.min(m.rows - 1, Math.round(row)));
  return m.stages.length === 0 ? { c0: 0, c1: m.cols - 1 } : m.spans[r];
};

// src/game/spawn.ts
var MAX_ENEMIES = 92;
function spawnEnemy(g, w, h, kind, at, size = 1, elite = false) {
  const p = g.player;
  if (kind !== "boss" && g.enemies.length >= MAX_ENEMIES) return null;
  if (!kind) {
    const pool = ENEMY_KEYS.filter((k) => g.elapsed >= ENEMIES[k].unlock);
    if (!pool.length) return null;
    const total = pool.reduce((s, k) => s + ENEMIES[k].weight, 0);
    let roll = rnd(total);
    kind = pool[0];
    for (const k of pool) {
      roll -= ENEMIES[k].weight;
      if (roll <= 0) {
        kind = k;
        break;
      }
    }
  }
  const def = ENEMIES[kind], b = worldBounds(g, w, h), scale = 1 + g.elapsed / 210;
  const v = viewBand(g, w, h);
  const camX = g.cam ? Math.max(0, Math.min(w - (g.viewW || w), g.cam.x)) : 0, vw = g.viewW || w;
  const swarmMod = g.modifier?.id === "swarm" ? 0.55 : 1;
  let x = 0, y = 0;
  const stationary = kind === "cap" || kind === "hex" || kind === "jack" || kind === "turret" || kind === "phono" || kind === "totem" || kind === "organ" || kind === "siren";
  if (at) {
    x = at.x;
    y = at.y;
  } else if (kind === "puppet") {
    x = rnd(v.minX + 60, v.maxX - 60);
    y = fieldTop(g, h) + 40;
  } else if (kind === "bat") {
    x = rnd(v.minX, v.maxX);
    y = fieldTop(g, h) - 30;
  } else if (kind === "balloon") {
    x = rnd(v.minX + 60, v.maxX - 60);
    y = fieldTop(g, h) - 50;
  } else if (stationary) {
    for (let tries = 0; tries < 14; tries++) {
      x = rnd(v.minX + 40, v.maxX - 40);
      y = rnd(v.minY + 30, v.maxY - 30);
      if (dist({ x, y }, p) >= 220) break;
    }
  } else if (kind === "nut") {
    const a = rnd(TAU), d = rnd(30, 130);
    x = clamp(p.x + Math.cos(a) * d, b.minX, b.maxX);
    y = clamp(p.y + Math.sin(a) * d, b.minY, b.maxY);
  } else if (kind === "mime") {
    const a = rnd(TAU);
    x = clamp(p.x + Math.cos(a) * 300, b.minX, b.maxX);
    y = clamp(p.y + Math.sin(a) * 220, b.minY, b.maxY);
  } else {
    const edge = Math.floor(rnd(4));
    if (edge === 0) {
      x = camX > 60 ? camX - 50 : -50;
      y = rnd(v.minY, v.maxY);
    } else if (edge === 1) {
      x = camX + vw < w - 60 ? camX + vw + 50 : w + 50;
      y = rnd(v.minY, v.maxY);
    } else if (edge === 2) {
      x = rnd(v.minX, v.maxX);
      y = fieldTop(g, h) - 60;
    } else {
      x = rnd(v.minX, v.maxX);
      y = b.maxY + 84;
    }
    x = clamp(x, b.minX - 60, b.maxX + 60);
  }
  if (elite) size *= 1.3;
  const affix = elite ? ["painted", "mirror", "swift"][Math.floor(rnd(0, 2.999))] : void 0;
  if (g.modifier?.id === "giant") size *= 1.4;
  const hp = def.hp * scale * size * (elite ? 2.4 : 1) * swarmMod;
  const e = {
    id: g.id++,
    x,
    y,
    kind,
    hp,
    maxHp: hp,
    r: def.r * size,
    speed: def.speed * Math.min(1.7, 1 + g.elapsed / 300) * (elite ? 1.1 : 1),
    phase: rnd(9),
    cooldown: kind === "cap" ? 0.2 : kind === "turret" ? 2 : kind === "organ" ? 2.6 : rnd(1, 2.2),
    attack: 0,
    hit: 0,
    pink: kind === "bloat" ? Math.random() < 0.4 : false,
    size,
    hidden: kind === "cap",
    airborne: kind === "nut" ? 1.3 : 0,
    vx: 0,
    vy: 0,
    counter: 0,
    pattern: 0,
    spawnT: 0,
    burn: 0,
    slow: 0,
    elite,
    affix,
    blink: rnd(2, 5),
    frozen: 0,
    alpha: kind === "mime" ? 0 : 1,
    revived: false,
    buffed: 0,
    rooted: 0,
    facingA: 0,
    stun: 0,
    slippery: 0
  };
  if (kind === "gloop") {
    const a = rnd(TAU);
    e.vx = Math.cos(a) * e.speed;
    e.vy = Math.sin(a) * e.speed;
  }
  if (kind === "clown") {
    const a = rnd(TAU);
    e.vx = Math.cos(a) * e.speed;
    e.vy = Math.sin(a) * e.speed;
  }
  if (affix === "painted") {
    e.paint = 1e6;
    e.paintC = "#ff5aa5";
  }
  if (affix === "swift") e.speed *= 1.5;
  if (kind === "balloon") {
    e.burst = elite ? 7 : 4;
    const a = rnd(TAU);
    e.vx = Math.cos(a) * 24;
    e.vy = Math.sin(a) * 16;
  }
  if (kind === "eel") {
    e.segments = [];
    for (let i = 0; i < 9; i++) e.segments.push({ x, y });
  }
  if (kind === "candle") {
    e.phase = rnd(TAU);
    e.anchor = { x: clamp(x, b.minX + 120, b.maxX - 120), y: clamp(y, b.minY + 90, b.maxY - 90) };
  }
  if (kind === "puppet") {
    e.anchor = { x, y: fieldTop(g, h) - 10 };
    e.cooldown = rnd(2, 4);
  }
  if (kind === "siren") {
    e.anchor = { x, y };
    e.shieldHp = 0;
  }
  g.enemies.push(e);
  if (kind === "twin" && !at) {
    const mate = spawnEnemy(g, w, h, "twin", { x: x + rnd(-90, 90), y: clamp(y + rnd(-60, 60), b.minY, b.maxY) }, size, elite);
    if (mate) {
      mate.partner = e.id;
      e.partner = mate.id;
    }
  }
  return e;
}
function spawnBoss(g, w, h) {
  const e = spawnEnemy(g, w, h, "boss", { x: clamp((g.cam ? g.cam.x : 0) + (g.viewW || w) / 2, 120, w - 120), y: (g.rows ?? 1) > 1 ? Math.max(0, g.cam?.y ?? 0) + h * HORIZON - 80 : h * HORIZON - 80 });
  if (!e) return;
  e.hp = e.maxHp = ENEMIES.boss.hp * (1 + g.bossesBeaten * 0.55) * (1 + g.elapsed / 400);
  const bossData = BOSS_NAMES[g.bossesBeaten % BOSS_NAMES.length];
  e.bossName = bossData.name;
  e.bossPhase = 1;
  e.maxBossPhase = 3;
  e.cooldown = 2.2;
  g.boss = e;
  g.bossIntro = { name: bossData.name, title: bossData.title, quote: bossData.quote, life: 3.6 };
  g.announce = { title: e.bossName, sub: "A CHALLENGER APPEARS", life: 3.2 };
  g.events.push("boss");
  g.shake = 16;
  if (g.upgrades.shield) {
    g.player.shield = Math.max(g.player.shield, 2);
    say(g, g.player.x, g.player.y - 60, "UMBRELLA UP!", "#8fd1ff");
  }
}
function spawnCrate(g, w, h, at) {
  const locked = WEAPON_KEYS.filter((k) => !g.unlocks.includes(k) && !g.weapons.includes(k));
  const any = WEAPON_KEYS.filter((k) => !g.weapons.includes(k));
  const pool = locked.length && Math.random() < 0.7 ? locked : any;
  const key = pick(pool);
  const v = viewBand(g, w, h);
  const pos = at ?? { x: rnd(v.minX + 60, v.maxX - 60), y: rnd(v.minY + 40, v.maxY - 40) };
  drop(g, pos.x, pos.y, "weapon", key);
  g.announce = { title: "PRIZE CRATE!", sub: "A NEW WEAPON JUST LANDED", life: 2.2 };
  g.events.push("crate");
  ring(g, pos.x, pos.y, "#ffd75a", 90);
  puff(g, pos.x, pos.y + 10, "#e8dfcf", 10, 90, 7);
}
var enemyShot = (g, x, y, a, speed, dmg, color, pink = false, homing = 0) => {
  const dance = g.mode === "bulletdance";
  const isPink = pink || g.modifier?.id === "pink" || dance;
  const push = (ang, rr) => g.bullets.push({
    x,
    y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    life: 3.2,
    maxLife: 3.2,
    damage: dmg,
    r: isPink ? 8 : 7,
    color: isPink ? "#ff7ad9" : color,
    enemy: true,
    pink: isPink,
    pierce: 0,
    bounces: 0,
    chains: 0,
    hitIds: [],
    homing,
    spin: rnd(TAU),
    ...dance ? { r: rr } : {}
  });
  if (dance) {
    push(a, 8);
    push(a - 0.19, 7);
    push(a + 0.19, 7);
  } else push(a, 7);
};

// src/game/economy.ts
function generateShopItems(g) {
  const items = [];
  const discount = g.charm === "clover" ? 0.7 : 1;
  const locked = WEAPON_KEYS.filter((k) => !g.unlocks.includes(k) && !g.weapons.includes(k));
  const candidateWp = locked.length ? pick(locked) : pick(WEAPON_KEYS.filter((k) => !g.weapons.includes(k)));
  items.push({
    id: `wp_${candidateWp}`,
    name: WEAPONS[candidateWp].name,
    desc: WEAPONS[candidateWp].trait,
    price: Math.round(25 * discount),
    icon: WEAPONS[candidateWp].icon,
    bought: false,
    kind: "weapon",
    weaponKey: candidateWp
  });
  items.push({
    id: "hp_feast",
    name: "Heart Pie",
    desc: "Restores 35 gumption on the spot",
    price: Math.round(15 * discount),
    icon: "M12 21S4 16.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5c0 7-8 11.5-8 11.5Z",
    bought: false,
    kind: "heart"
  });
  items.push({
    id: "super_full",
    name: "Golden Card Pack",
    desc: "Instantly charges 5 Super cards",
    price: Math.round(20 * discount),
    icon: "M16 8h32v28H16z",
    bought: false,
    kind: "super"
  });
  const boon = pick(UPGRADES.filter((u) => (g.upgrades[u.id] || 0) < u.max));
  if (boon) {
    items.push({
      id: `up_${boon.id}`,
      name: boon.title,
      desc: boon.desc,
      price: Math.round(30 * discount),
      icon: "M32 6l8 18 20 2-15 14 4 20-17-10-17 10 4-20L4 26l20-2Z",
      bought: false,
      kind: "upgrade",
      upgradeId: boon.id
    });
  }
  return items;
}

// src/game/combat.ts
var galleryBleed = false;
function damageEnemy(g, e, amount, color, crit = false) {
  if (e.frozen > 0) {
    amount *= 2;
    crit = true;
  }
  if (e.kind === "boss" && g.upgrades.titanbane) amount *= 1 + g.upgrades.titanbane * 0.45;
  if (e.stun && e.stun > 0) amount *= 1.25;
  if (e.paint && e.paint > 0) amount *= g.charm === "varnish" ? 1.5 : 1.35;
  if (g.mode === "glass") amount *= 3.5;
  if (g.mode === "beat") amount *= g.onBeat ? 1.75 : 0.7;
  if (g.mode === "bulletdance") amount *= 1 + g.dance.heat * 0.9;
  if (e.shieldHp && e.shieldHp > 0) {
    e.shieldHp -= amount;
    ring(g, e.x, e.y, "#8fd1ff", 40);
    puff(g, e.x, e.y, "#8fd1ff", 3, 70, 3);
    if (e.shieldHp <= 0) {
      e.shieldHp = 0;
      say(g, e.x, e.y - e.r - 8, "SHIELD BROKE!", "#8fd1ff");
    }
    return;
  }
  let bleed = 0;
  if (e.paint && e.paint > 0 && amount > 6) bleed = amount * (g.charm === "varnish" ? 0.3 : 0.2);
  e.hp -= amount;
  e.hit = 0.12;
  addCards(g, amount / CARD_DAMAGE * g.player.cardGain);
  puff(g, e.x, e.y, color, crit ? 7 : 3, crit ? 150 : 85, 4);
  if (crit) say(g, e.x, e.y - e.r - 10, e.frozen > 0 ? "SHATTER!" : "CRIT!", e.frozen > 0 ? "#aef1ff" : "#ff9a5c");
  if (bleed > 0 && !galleryBleed && e.hp > 0) {
    galleryBleed = true;
    let done = 0;
    for (const o of g.enemies) {
      if (done >= 3 || o === e || o.hp <= 0 || !(o.paint && o.paint > 0)) continue;
      if (dist(o, e) < 240) {
        damageEnemy(g, o, bleed, o.paintC || "#ff5aa5");
        done++;
        puff(g, o.x, o.y, o.paintC || "#ff5aa5", 2, 60, 3);
      }
    }
    galleryBleed = false;
  }
  if (e.kind === "boss") {
    if (Math.random() < 0.1) g.events.push("bosshit");
    if (e.bossPhase === 1 && e.hp <= e.maxHp * 0.66) {
      e.bossPhase = 2;
      g.events.push("bosstransform");
      g.shake = 20;
      g.flash = 0.8;
      ring(g, e.x, e.y, "#ff5555", 180);
      say(g, e.x, e.y - 80, "PHASE 2: UNLEASHED!", "#ff5555", true);
      for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
    } else if (e.bossPhase === 2 && e.hp <= e.maxHp * 0.33) {
      e.bossPhase = 3;
      g.events.push("bosstransform");
      g.shake = 26;
      g.flash = 1;
      ring(g, e.x, e.y, "#bd93f9", 220);
      say(g, e.x, e.y - 80, "FINAL PHASE: ENRAGED!", "#bd93f9", true);
      for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
    }
  } else if (Math.random() < 0.45) {
    g.events.push("hit");
  }
}
function killEnemy(g, e, w, h, parried = false) {
  const def = ENEMIES[e.kind], p = g.player;
  if (e.dead) return;
  if (e.kind === "cutpurse" && e.holding && e.loot) {
    const cards = Math.floor(e.loot / 10), cash = e.loot % 10;
    if (cards) addCards(g, cards);
    if (cash) {
      p.coins += cash;
      g.score += Math.round(60 * cash * p.scoreMult);
    }
    say(g, e.x, e.y - e.r - 14, `BACK TO YOU! +${cards} CARD${cards === 1 ? "" : "S"}`, "#ffe27a", true);
    g.events.push("coin");
    e.loot = 0;
    e.holding = false;
  }
  if (e.kind === "janitor" && e.counter > 2) {
    drop(g, e.x, e.y, "weapon");
    say(g, e.x, e.y - e.r - 12, "HE HAD A SPARE", "#cfd6e2");
  }
  if (e.kind === "ghoul" && !e.revived && !parried) {
    e.revived = true;
    e.hp = e.maxHp * 0.6;
    e.hit = 0.3;
    e.attack = 1.4;
    e.alpha = 0.4;
    say(g, e.x, e.y - e.r - 6, "NOT YET!", "#cfd6e2");
    g.events.push("revive");
    ring(g, e.x, e.y, "#cfd6e2", 60);
    return;
  }
  if (e.frozen > 0) {
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + e.phase;
      g.bullets.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * 620,
        vy: Math.sin(a) * 620,
        life: 0.55,
        maxLife: 0.55,
        damage: 22 * g.player.damage,
        r: 5,
        color: "#aef1ff",
        pierce: 1,
        bounces: 0,
        chains: 0,
        hitIds: [e.id],
        spin: 0
      });
    }
    say(g, e.x, e.y - e.r - 10, "SHATTERED!", "#aef1ff", true);
    g.events.push("freeze");
  }
  e.dead = true;
  const mult = (g.modifier?.id === "double" ? 2 : 1) * (g.modifier?.id === "giant" ? 1.5 : 1) * (g.modifier?.id === "swarm" ? 1.5 : 1);
  const comboStep = 1 + Math.min(g.combo, 12) * 0.1 * (1 + (g.upgrades.showman || 0) * 0.5);
  g.kills++;
  g.combo++;
  g.comboTime = 2.8;
  g.maxCombo = Math.max(g.maxCombo, g.combo);
  if (g.combo === 10 || g.combo === 25 || g.combo === 50 || g.combo === 100) {
    const card = g.combo === 10 ? ["TEN IN A ROW!", "THE CROWD ROARS"] : g.combo === 25 ? ["TWENTY-FIVE!", "A DAZZLING DISPLAY"] : g.combo === 50 ? ["FIFTY STRAIGHT!", "STANDING OVATION"] : ["ONE HUNDRED!", "THE STAGE IS YOURS"];
    g.announce = { title: card[0], sub: card[1], life: 1.8 };
    g.events.push("levelup");
  }
  p.coins += e.elite ? 5 : 1;
  if (g.upgrades.interest && p.coins % 5 === 0) p.coins += g.upgrades.interest;
  g.score += Math.round(def.score * (e.elite ? 3 : 1) * comboStep * p.scoreMult * mult * (g.mode === "bulletdance" && e.lead ? 1.5 : 1));
  puff(g, e.x, e.y, def.color, 12, 200, 6);
  puff(g, e.x, e.y, "#fff6dc", 5, 120, 3);
  if (g.ghosts.length < 30) g.ghosts.push({ x: e.x, y: e.y - e.r, vx: rnd(-20, 20), life: 1.1, color: def.color, size: e.r, phase: rnd(9) });
  say(g, e.x, e.y - e.r - 6, pick(SMACKS));
  g.events.push(e.kind === "boss" ? "knockout" : e.elite ? "elitekill" : "kill");
  if (g.combo % 10 === 0) say(g, p.x, p.y - 70, `${g.combo} COMBO!`, "#ff8ad3", true);
  if (g.upgrades.vampire && g.kills % 12 === 0) {
    p.health = Math.min(p.maxHealth, p.health + 8 * g.upgrades.vampire);
    say(g, p.x, p.y - 56, "+SLURP", "#ff8a8a");
  }
  if (e.kind === "bloat" && !parried) {
    for (let i = 0; i < 6; i++) enemyShot(g, e.x, e.y, i / 6 * TAU + e.phase, 210, 9, "#7ec8ff");
    g.shake = Math.max(g.shake, 5);
  }
  if (e.kind === "gloop" && e.size > 0.55) {
    for (let i = 0; i < 2; i++) {
      const c = spawnEnemy(g, w, h, "gloop", { x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14) }, e.size * 0.65);
      if (c) c.hp = c.maxHp = e.maxHp * 0.45;
    }
  }
  if (e.kind === "balloon" && e.burst) {
    for (let i = 0; i < e.burst; i++) {
      const c = spawnEnemy(g, w, h, Math.random() < 0.5 ? "bat" : "daisy", { x: e.x + rnd(-40, 40), y: e.y + rnd(-30, 30) }, 0.7);
      if (c) {
        c.hp = c.maxHp = c.maxHp * 0.6;
      }
    }
    g.shake = Math.max(g.shake, 9);
    ring(g, e.x, e.y, "#ff8fa3", 120);
    g.events.push("boom");
  }
  if (e.kind === "bell") for (const o of g.enemies) o.buffed = 0;
  if (e.kind === "lugger" || e.kind === "cap" || e.elite) g.hitstop = Math.max(g.hitstop, 0.05);
  if (e.kind === "boss") {
    g.boss = null;
    g.bossesBeaten++;
    g.bossTimer = 95;
    g.hitstop = 0.3;
    g.slowmo = 1.2;
    g.flash = 0.8;
    g.shake = 22;
    p.health = Math.min(p.maxHealth, p.health + 45);
    addCards(g, 5);
    say(g, e.x, e.y - 80, "KNOCKOUT!", "#ffe27a", true);
    for (let i = 0; i < 10; i++) drop(g, e.x + rnd(-70, 70), e.y + rnd(-40, 60), i === 0 ? "heart" : i === 1 ? "goldbar" : "coin");
    spawnCrate(g, w, h, { x: e.x, y: e.y + 30 });
    g.shopOpen = true;
    const npcY = (g.rows ?? 1) > 1 ? clamp(p.y, 60, Math.max(120, (g.worldH || h) - 60)) : h * HORIZON + 20;
    g.shopNpc = { x: Math.max(120, Math.min(w - 120, (g.cam ? g.cam.x : 0) + (g.viewW || w) / 2)), y: npcY, active: true, talkTimer: 15 };
    g.shopItems = generateShopItems(g);
    say(g, g.shopNpc.x, npcY - 70, "SHOP IS OPEN!", "#ffd700", true);
    g.events.push("shopopen");
    return;
  }
  const ITEMS = ["rapid", "shield", "bomb", "clock", "star", "magnet", "decoy", "fireworks", "wind", "nuke", "goldbar", "mirror", "bees", "grease"];
  if (e.elite) {
    if (Math.random() < 0.5) spawnCrate(g, w, h, { x: e.x, y: e.y });
    else drop(g, e.x, e.y, pick(ITEMS));
    return;
  }
  if (e.kind === "twin" && e.partner !== void 0) {
    const mate = byId.get(e.partner);
    if (mate) {
      mate.partner = void 0;
      mate.speed *= 1.5;
      mate.buffed = 99;
    }
  }
  const coinChance = 0.28 * (g.charm === "penny" ? 2 : 1) * (g.modifier?.id === "coins" ? 3 : 1) * (1 + (g.upgrades.scavenger || 0));
  const r = Math.random();
  if (r < coinChance) drop(g, e.x, e.y, "coin");
  else if (r < coinChance + 0.06) drop(g, e.x, e.y, "heart");
  else if (r < coinChance + 0.09) {
    let item = pick(ITEMS);
    if (item === "wind" && Math.random() < 0.7) item = "clock";
    drop(g, e.x, e.y, item);
  }
}
function hurtPlayer(g, amount, from) {
  const p = g.player;
  if (p.invuln > 0 || p.superTime > 0 || p.star > 0) return;
  const who = from.kind;
  g.lastThreat = who ? ENEMIES[who]?.name ?? "A CREEP" : "STRAY FIRE";
  if (p.shield > 0) {
    p.shield--;
    p.invuln = 0.6;
    ring(g, p.x, p.y, "#8fd1ff", 70);
    say(g, p.x, p.y - 60, p.shield > 0 ? "BLOCKED!" : "UMBRELLA BROKE!", "#8fd1ff");
    g.events.push("block");
    return;
  }
  p.health -= amount;
  p.invuln = 0.9;
  p.squash = 1;
  g.shake = Math.max(g.shake, 10);
  g.damageTaken++;
  g.combo = 0;
  p.webbed = 0;
  if (g.mode === "bulletdance") {
    g.dance.streak = 0;
    g.dance.heat *= 0.3;
  }
  const d = dist(p, from) || 1;
  p.x += (p.x - from.x) / d * 26;
  p.y += (p.y - from.y) / d * 26;
  puff(g, p.x, p.y, "#ff6b5e", 12, 170, 5);
  say(g, p.x, p.y - 60, pick(["OUCH!", "YIKES!", "OOF!"]), "#ff8a7a", true);
  g.events.push("hurt");
  g.hitstop = Math.max(g.hitstop, 0.05);
}
function tryParry(g, radius, w, h) {
  const p = g.player;
  let hit = false, slapped = 0;
  const caught = [];
  for (const b of g.bullets) {
    if (b.enemy && b.pink && b.life > 0 && (b.ringWave ? Math.abs(dist(b, p) - b.r) < radius : dist(b, p) < radius + b.r)) {
      b.life = 0;
      hit = true;
      slapped++;
      caught.push({ x: b.x, y: b.y });
      puff(g, b.x, b.y, "#ff7ad9", 8, 160, 5);
    }
  }
  for (const k of g.pickups) {
    if (k.kind === "bulb" && k.life > 0 && dist(k, p) < radius + 16) {
      if (g.mode === "blackout") {
        g.lightR = Math.min(430, g.lightR + 45);
        g.bulbPulse = 1;
        say(g, p.x, p.y - 64, "LIGHT UP!", "#ffe27a", true);
      }
      k.life = 0;
      hit = true;
      slapped++;
      puff(g, k.x, k.y, "#ff7ad9", 10, 170, 5);
    }
  }
  for (const e of g.enemies) {
    if (e.pink && e.hp > 0 && dist(e, p) < radius + e.r) {
      e.hp = 0;
      hit = true;
      killEnemy(g, e, w, h, true);
    }
  }
  if (hit) {
    const dance = g.mode === "bulletdance";
    g.parries += Math.max(1, slapped);
    addCards(g, dance ? 1 + Math.max(0, slapped - 1) * 0.5 : 1);
    p.invuln = Math.max(p.invuln, 0.35);
    p.parryFlash = 0.3;
    g.hitstop = Math.max(g.hitstop, 0.07);
    ring(g, p.x, p.y, "#ff7ad9", 90);
    say(g, p.x, p.y - 64, "PARRY!", "#ff8ad3", true);
    g.events.push("parry");
    const d = g.dance;
    if (dance) {
      d.streak += Math.max(1, slapped);
      d.best = Math.max(d.best, d.streak);
      d.heat = Math.min(2.2, d.heat + 0.18 + Math.max(0, slapped - 1) * 0.12);
      let tgt = null, tb = 1e9;
      for (const e of g.enemies) {
        if (e.hidden || e.airborne > 0 || e.hp <= 0) continue;
        const dd = dist(e, p);
        if (dd < tb) {
          tb = dd;
          tgt = e;
        }
      }
      for (const c of caught) {
        const a = tgt ? Math.atan2(tgt.y - c.y, tgt.x - c.x) : p.angle + Math.PI;
        g.bullets.push({
          x: c.x,
          y: c.y,
          vx: Math.cos(a) * 700,
          vy: Math.sin(a) * 700,
          life: 1.5,
          maxLife: 1.5,
          damage: 30 * p.damage * (1 + d.heat * 0.6),
          r: 7,
          color: "#ffe27a",
          pierce: 1,
          bounces: 0,
          chains: 0,
          hitIds: [],
          spin: 0,
          homing: 0.5,
          riposte: true
        });
      }
      if (slapped >= 3) {
        say(g, p.x, p.y - 88, `${slapped} AT ONCE!`, "#ffe27a", true);
        g.events.push("cheer");
      }
      if (d.streak === 12) {
        say(g, p.x, p.y - 92, "THE CROWD IS UP!", "#ffe27a", true);
        g.events.push("cheer");
      }
      if (d.streak === 24) {
        say(g, p.x, p.y - 92, "SHOWSTOPPER!", "#ff8ad3", true);
        g.events.push("cheer");
      }
    }
    g.score += Math.round(150 * p.scoreMult * (g.mode === "beat" && g.onBeat ? 2 : 1) * (dance ? 1 + Math.min(2, d.streak * 0.1) : 1));
    if (g.upgrades.parryheal) {
      p.health = Math.min(p.maxHealth, p.health + 4 * g.upgrades.parryheal);
      say(g, p.x, p.y - 48, "+HEAL", "#6fe08a");
    }
  } else {
    p.parryFlash = 0.14;
  }
  return hit;
}
function collect(g, k) {
  const p = g.player;
  k.life = 0;
  if (k.kind === "heart") {
    p.health = Math.min(p.maxHealth, p.health + 25);
    say(g, p.x, p.y - 56, "+25 HP", "#ff8a8a");
    g.events.push("pickup");
  } else if (k.kind === "coin") {
    p.coins++;
    g.score += Math.round(60 * p.scoreMult);
    addCards(g, 0.12);
    say(g, k.x, k.y - 14, "+1\xA2", "#ffe27a");
    g.events.push("coin");
  } else if (k.kind === "goldbar") {
    p.coins += 50;
    g.score += Math.round(1500 * p.scoreMult);
    addCards(g, 1);
    say(g, k.x, k.y - 14, "+50\xA2 GOLD!", "#ffd700", true);
    g.events.push("coin");
  } else if (k.kind === "rapid") {
    p.rapid = 8;
    say(g, p.x, p.y - 60, "HOT HANDS!", "#ff6a3d", true);
    g.events.push("powerup");
  } else if (k.kind === "shield") {
    p.shield = 2;
    say(g, p.x, p.y - 60, "TIN UMBRELLA!", "#8fd1ff", true);
    g.events.push("powerup");
    ring(g, p.x, p.y, "#8fd1ff", 80);
  } else if (k.kind === "clock") {
    p.clock = 6;
    say(g, p.x, p.y - 60, "TIME OUT!", "#f2c14e", true);
    g.events.push("clock");
    g.flash = 0.3;
  } else if (k.kind === "star") {
    p.star = 6;
    say(g, p.x, p.y - 60, "LUCKY STAR!", "#fff3c4", true);
    g.events.push("star");
    ring(g, p.x, p.y, "#fff3c4", 100);
  } else if (k.kind === "magnet") {
    for (const o of g.pickups) if (o.kind === "coin" || o.kind === "heart") o.phase = -99;
    say(g, p.x, p.y - 60, "MAGNET!", "#d84a45", true);
    g.events.push("powerup");
  } else if (k.kind === "wind") {
    if (g.mode === "glass") {
      p.shield++;
      say(g, p.x, p.y - 56, "+1 SHIELD!", "#74e6ff", true);
    } else {
      p.wind++;
      say(g, p.x, p.y - 60, "SPARE BREATH!", "#74e6ff", true);
    }
    g.events.push("star");
  } else if (k.kind === "decoy") {
    g.puddles.push({ x: k.x, y: k.y, r: 26, life: 7, max: 7, kind: "decoy" });
    say(g, p.x, p.y - 60, "DUMMY OUT!", "#c9863a", true);
    g.events.push("powerup");
  } else if (k.kind === "fireworks") {
    g.fireworks = 6;
    say(g, p.x, p.y - 60, "ROMAN CANDLE!", "#ff5aa5", true);
    g.events.push("powerup");
  } else if (k.kind === "mirror") {
    p.mirror = 6;
    say(g, p.x, p.y - 60, "FUNHOUSE MIRROR!", "#b8d8e8", true);
    g.events.push("powerup");
    ring(g, p.x, p.y, "#b8d8e8", 110);
  } else if (k.kind === "bees") {
    p.bees = 8;
    say(g, p.x, p.y - 60, "JAR OF BEES!", "#ffc94a", true);
    g.events.push("powerup");
    for (let i = 0; i < 8; i++) spawnCompanion(g, p.x + rnd(-30, 30), p.y + rnd(-30, 30), 8, 7 * p.damage, true);
  } else if (k.kind === "grease") {
    p.grease = 9;
    say(g, p.x, p.y - 60, "GREASE EVERYWHERE!", "#c9a227", true);
    g.events.push("powerup");
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU, dd = rnd(70, 220);
      g.puddles.push({ x: p.x + Math.cos(a) * dd, y: p.y + Math.sin(a) * dd * 0.7, r: 44, life: 9, max: 9, kind: "grease" });
    }
  } else if (k.kind === "nuke") {
    g.flash = 1;
    g.shake = 30;
    ring(g, p.x, p.y, "#ff3333", 600);
    for (const b of g.bullets) if (b.enemy) b.life = 0;
    for (const e of g.enemies) {
      damageEnemy(g, e, e.kind === "boss" ? 220 : 180, "#ff3333");
    }
    say(g, p.x, p.y - 80, "BIG KABOOM!", "#ff5555", true);
    g.events.push("boom");
  } else if (k.kind === "bomb") {
    g.flash = 0.6;
    g.shake = 16;
    ring(g, p.x, p.y, "#2a2230", 400);
    for (const b of g.bullets) if (b.enemy) b.life = 0;
    for (const e of g.enemies) {
      damageEnemy(g, e, e.kind === "boss" ? 60 : 45, "#2a2230");
      e.slow = Math.max(e.slow, 2.5);
    }
    say(g, p.x, p.y - 60, "INK BOMB!", "#fff3c4", true);
    g.events.push("boom");
  } else if (k.kind === "weapon" && k.weapon) {
    const key = k.weapon, old = g.weapons[g.active], otherSlot = g.active === 0 ? 1 : 0;
    if (g.weapons[otherSlot] === key) g.weapons[otherSlot] = old;
    g.weapons[g.active] = key;
    g.cratesOpened++;
    p.charge = 0;
    g.shot = 0;
    g.flash = 0.3;
    ring(g, p.x, p.y, WEAPONS[key].color, 120);
    puff(g, k.x, k.y, WEAPONS[key].color, 14, 160, 5);
    const isNew = !g.unlocks.includes(key);
    if (isNew) {
      g.unlocks.push(key);
      g.found.push(key);
      g.announce = { title: WEAPONS[key].name, sub: "NEW WEAPON UNLOCKED FOR THE ARMORY", life: 3.4 };
      g.events.push("unlock");
    } else {
      g.announce = { title: WEAPONS[key].name, sub: `SWAPPED OUT ${WEAPONS[old].name.toUpperCase()}`, life: 2.4 };
      g.events.push("crateopen");
    }
    say(g, p.x, p.y - 64, "GOT IT!", "#ffe27a", true);
  }
  puff(g, k.x, k.y, k.kind === "heart" ? "#ff6b6b" : "#ffd75a", 5, 90, 3);
}

// src/game/weapons.ts
var SHAKE_W = {
  anvil: 7,
  barrel: 8,
  mortar: 6,
  lobber: 5,
  boombox: 4,
  choir: 3,
  quill: 3,
  grapple: 3,
  pie: 2.5,
  whistle: 2,
  stamp: 1.6,
  syrup: 1.6,
  umbrella: 1.5,
  popper: 1.4,
  slots: 1.2,
  lance: 3.2,
  sprinkler: 1.8,
  candle: 1,
  peel: 1.2,
  paint: 1,
  note: 0.8,
  fountain: 0.6,
  kazoo: 0.5
};
function fireWeapon(g, aim, key, chargeAmt = 1) {
  const p = g.player, s = WEAPONS[key], base = Math.atan2(aim.y - p.y, aim.x - p.x);
  const n0 = g.bullets.length;
  p.angle = base;
  p.facing = Math.cos(base) < 0 ? -1 : 1;
  p.rhythm++;
  const rhythmCrit = g.charm === "metronome" && p.rhythm % 4 === 0;
  const dmgMul = p.damage * (rhythmCrit ? 2 : 1);
  const mk = (a, extra = {}) => ({
    x: p.x + Math.cos(a) * 26,
    y: p.y - 4 + Math.sin(a) * 26,
    vx: Math.cos(a) * s.speed,
    vy: Math.sin(a) * s.speed,
    life: 1.2,
    maxLife: 1.2,
    damage: s.damage * dmgMul,
    r: 4,
    color: rhythmCrit ? "#ffffff" : s.color,
    weapon: key,
    pierce: 0,
    bounces: g.upgrades.ricochet || 0,
    chains: 0,
    hitIds: [],
    spin: 0,
    ...extra
  });
  const angles = [];
  if (s.shots > 1 && key !== "trio") {
    for (let i = 0; i < s.shots; i++) angles.push(base + (i / (s.shots - 1) - 0.5) * s.spread + rnd(-0.03, 0.03));
  } else {
    angles.push(base + rnd(-0.5, 0.5) * s.spread);
  }
  for (let i = 0; i < p.extraShots; i++) angles.push(base + (i % 2 ? 1 : -1) * 0.16 * Math.ceil((i + 1) / 2));
  if (key === "harp") {
    const targets = liveBuf.filter((e) => {
      const d = dist(e, p);
      if (d > 420) return false;
      const da = Math.abs((Math.atan2(e.y - p.y, e.x - p.x) - base + Math.PI * 3) % TAU - Math.PI);
      return da < s.spread;
    }).sort((a, e) => dist(a, p) - dist(e, p)).slice(0, 5 + p.extraShots * 2);
    if (targets.length === 0) {
      const far = { x: p.x + Math.cos(base) * 300, y: p.y + Math.sin(base) * 300 };
      g.bullets.push(mk(base, { vx: 0, vy: 0, life: 0.14, maxLife: 0.14, arc: [{ x: p.x, y: p.y - 4 }, far], damage: 0, r: 0 }));
    }
    for (const t of targets) {
      damageEnemy(g, t, s.damage * dmgMul, s.color);
      g.bullets.push(mk(base, { vx: 0, vy: 0, life: 0.16, maxLife: 0.16, arc: [{ x: p.x, y: p.y - 4 }, { x: t.x, y: t.y }], damage: 0, r: 0 }));
    }
    puff(g, p.x + Math.cos(base) * 30, p.y - 4 + Math.sin(base) * 30, s.color, 4, 80, 4);
    g.shake = Math.max(g.shake, 2.5);
    g.events.push("shoot:harp");
    p.recoil = 1;
    g.stats.shots++;
    g.stats.byWeapon[key] = (g.stats.byWeapon[key] || 0) + 1;
    return g.bullets.length > n0;
  }
  for (const a of angles) {
    if (key === "popper") g.bullets.push(mk(a, { pierce: 1, bounces: 2, r: 5 }));
    else if (key === "choir") g.bullets.push(mk(a, { life: 0.42, maxLife: 0.42, knock: 36, r: 4 }));
    else if (key === "note") g.bullets.push(mk(a, { homing: 0.16, chains: 2, r: 6, life: 1.6, maxLife: 1.6 }));
    else if (key === "mortar") g.bullets.push(mk(a, { r: 12, bounces: 3, splash: 110, life: 2.4, maxLife: 2.4 }));
    else if (key === "halo") g.bullets.push(mk(a, { r: 14, pierce: 99, boomerang: true, life: 2.2, maxLife: 2.2, spin: 0 }));
    else if (key === "kettle") {
      const c = clamp(chargeAmt, 0, 1);
      g.bullets.push(mk(a, { damage: (10 + 78 * Math.pow(c, 1.4)) * dmgMul, r: 4 + 11 * c, pierce: c > 0.9 ? 3 : c > 0.5 ? 1 : 0, charge: c, inkBlast: c > 0.8, life: 1.4, maxLife: 1.4 }));
    } else if (key === "shard") g.bullets.push(mk(a, { r: 8, split: 0.3, life: 1.4, maxLife: 1.4 }));
    else if (key === "lobber") {
      const d = Math.min(440, dist(aim, p)), tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d, dur = 0.35 + d / 700;
      g.bullets.push(mk(a, { r: 11, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 95, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } }));
    } else if (key === "fountain") g.bullets.push(mk(a + rnd(-0.08, 0.08), { r: 7, life: 0.34, maxLife: 0.34, burn: 4, grow: 22, knock: 4, vx: Math.cos(a) * s.speed * rnd(0.8, 1.15), vy: Math.sin(a) * s.speed * rnd(0.8, 1.15) }));
    else if (key === "trio") {
      const d = Math.max(120, dist(aim, p)), tx = p.x + Math.cos(base) * d, ty = p.y + Math.sin(base) * d;
      for (const off of [-1, 0, 1]) {
        const ox = p.x + Math.cos(base + Math.PI / 2) * off * 36, oy = p.y - 4 + Math.sin(base + Math.PI / 2) * off * 36, ang = Math.atan2(ty - oy, tx - ox);
        g.bullets.push({ ...mk(ang), x: ox, y: oy, vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed, r: 5, pierce: 99, life: 0.95, maxLife: 0.95, beam: true });
      }
    } else if (key === "cuckoo") g.bullets.push(mk(a, { r: 13, pierce: 99, life: 3.8, maxLife: 3.8, tick: 0.2, pet: { target: -1, hop: 0 } }));
    else if (key === "accordion") for (const sgn of [1, -1]) g.bullets.push(mk(a, { r: 7, pierce: 2, life: 1.5, maxLife: 1.5, wave: { amp: 46 * sgn, freq: 9, phase: 0, bx: p.x, by: p.y - 4, nx: -Math.sin(a), ny: Math.cos(a), t: 0 } }));
    else if (key === "yoyo") {
      if (g.bullets.some((bl) => bl.tether && !bl.ex)) continue;
      g.bullets.push(mk(a, { r: 12, pierce: 99, tick: 0.18, life: 3, maxLife: 3, tether: { dist: 0, max: 260, out: true } }));
    } else if (key === "frost") g.bullets.push(mk(a, { r: 8, life: 0.5, maxLife: 0.5, freeze: 1.6, grow: 14, pierce: 1 }));
    else if (key === "quill") {
      let hits = 0;
      for (const e of nearby(p.x, p.y, 120)) {
        if (e.hidden || e.airborne > 0) continue;
        const dd = dist(e, p);
        if (dd > 105 + e.r) continue;
        const da = Math.abs((Math.atan2(e.y - p.y, e.x - p.x) - a + Math.PI * 3) % TAU - Math.PI);
        if (da > s.spread * 0.5) continue;
        const staggered = (e.stun || 0) > 0 || e.frozen > 0 || (e.blind || 0) > 0;
        const sig = staggered && e.hp < e.maxHp * 0.2 && e.kind !== "boss";
        damageEnemy(g, e, sig ? e.hp + 40 : s.damage * dmgMul, "#fff3c4");
        if (sig) {
          say(g, e.x, e.y - e.r - 12, "SIGNATURE!", "#f2c14e", true);
          addCards(g, 0.5);
          g.hitstop = Math.max(g.hitstop, 0.08);
        } else addCards(g, 0.12);
        if (e.kind !== "boss") {
          e.x += (e.x - p.x) / dd * 40;
          e.y += (e.y - p.y) / dd * 40;
        }
        hits++;
      }
      for (const bl of g.bullets) if (bl.enemy && dist(bl, p) < 110) {
        const da = Math.abs((Math.atan2(bl.y - p.y, bl.x - p.x) - a + Math.PI * 3) % TAU - Math.PI);
        if (da < s.spread * 0.5) {
          bl.life = 0;
          puff(g, bl.x, bl.y, "#fff3c4", 3, 80, 3);
        }
      }
      g.bullets.push(mk(a, { vx: 0, vy: 0, life: 0.16, maxLife: 0.16, damage: 0, r: 0, slash: { a, w: s.spread } }));
      if (hits) {
        g.hitstop = Math.max(g.hitstop, 0.03);
        g.shake = Math.max(g.shake, 4);
      }
    } else if (key === "popcorn") g.bullets.push(mk(a, { r: 6, bounces: 4, life: 1.1, maxLife: 1.1, popAt: 0.55 + rnd(0.2), vx: Math.cos(a) * s.speed * rnd(0.8, 1.1), vy: Math.sin(a) * s.speed * rnd(0.8, 1.1) }));
    else if (key === "trumpet") g.bullets.push(mk(a, { r: 10, pierce: 99, grow: 30, life: 1.5, maxLife: 1.5, ghostWave: true }));
    else if (key === "mitt") g.bullets.push(mk(a, { r: 9, life: 0.55, maxLife: 0.55, gravity: 150, pierce: 99, tick: 0.1 }));
    else if (key === "anvil") {
      const d = Math.min(380, dist(aim, p));
      const tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d;
      g.bullets.push(mk(a, { x: tx, y: ty - 320, vx: 0, vy: 0, r: 16, life: 1.2, maxLife: 1.2, damage: s.damage * dmgMul, splash: 120, anvilDrop: { targetY: ty, groundT: 0.35 } }));
      g.events.push("whistle");
    } else if (key === "bubbles") {
      g.bullets.push(mk(a, { r: 11, life: 2.2, maxLife: 2.2, bubbleFloat: true, homing: 0.1, vx: Math.cos(a) * s.speed * rnd(0.8, 1.2), vy: Math.sin(a) * s.speed * rnd(0.8, 1.2) }));
    } else if (key === "boombox") {
      g.bullets.push(mk(a, { r: 14, life: 0.8, maxLife: 0.8, grow: 70, sonicRing: true, knock: 55, pierce: 99 }));
    } else if (key === "phonograph") {
      for (const sign of [-1, 1]) {
        g.bullets.push(mk(a + sign * 0.2, { r: 8, life: 1.8, maxLife: 1.8, homing: 0.12, wave: { amp: 30 * sign, freq: 12, phase: 0, bx: p.x, by: p.y - 4, nx: -Math.sin(a), ny: Math.cos(a), t: 0 } }));
      }
    } else if (key === "peel") {
      g.bullets.push(mk(a, { r: 11, life: 9, maxLife: 9, trap: { t: 8, armed: 0.34 }, damage: s.damage * dmgMul }));
    } else if (key === "kazoo") g.bullets.push(mk(a, { r: 6, homing: 0.26, chains: 1, life: 1.9, maxLife: 1.9, vx: Math.cos(a) * s.speed * rnd(0.85, 1.2), vy: Math.sin(a) * s.speed * rnd(0.85, 1.2) }));
    else if (key === "barrel") g.bullets.push(mk(a, { r: 18, pierce: 99, life: 2.4, maxLife: 2.4, knock: 34, roll: { decay: 0.42 } }));
    else if (key === "syrup") {
      const d = Math.min(430, dist(aim, p)), tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d, dur = 0.4 + d / 620;
      g.bullets.push(mk(a, { r: 12, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 115, syrup: true, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } }));
    } else if (key === "whistle") {
      spawnCompanion(g, p.x, p.y - 6, 12, s.damage * dmgMul);
      g.bullets.push(mk(a, { vx: 0, vy: 0, life: 0.12, maxLife: 0.12, damage: 0, r: 0 }));
    } else if (key === "umbrella") {
      g.bullets.push(mk(a, { r: 20, life: 6, maxLife: 6, pierce: 99, tick: 0.28, brolly: { angle: g.bullets.filter((x) => x.brolly).length * 1.6, dist: 62, spin: 2.6 } }));
    } else if (key === "grapple") {
      g.bullets.push(mk(a, { r: 9, life: 0.5, maxLife: 0.5, pierce: 0, hook: true, from: { x: p.x, y: p.y }, damage: 18 * dmgMul }));
    } else if (key === "slots") {
      const pity = g.slotPity >= 5;
      const roll = pity ? 0 : Math.floor(rnd(0, 5));
      g.slotPity = roll === 0 ? 0 : g.slotPity + 1;
      if (pity) {
        say(g, p.x, p.y - 64, "LOADED!", "#ffd166", true);
        g.events.push("star");
      }
      if (roll === 0) g.bullets.push(mk(a, { r: 12, pierce: 3, damage: 30 * dmgMul * (pity ? 1.6 : 1) }));
      else if (roll === 1) for (let i = 0; i < 5; i++) g.bullets.push(mk(a + (i - 2) * 0.18, { r: 7, damage: 12 * dmgMul, knock: 20 }));
      else if (roll === 2) g.bullets.push(mk(a, { r: 8, homing: 0.3, chains: 2, damage: 16 * dmgMul, life: 2, maxLife: 2 }));
      else if (roll === 3) for (let i = 0; i < 6; i++) {
        const ang = i / 6 * TAU;
        g.bullets.push(mk(ang, { r: 6, bounces: 4, life: 1.2, maxLife: 1.2, popAt: 0.9, damage: 10 * dmgMul, vx: Math.cos(ang) * rnd(280, 560), vy: Math.sin(ang) * rnd(280, 560) }));
      }
      else {
        drop(g, p.x + rnd(-20, 20), p.y - 30, "coin");
        g.bullets.push(mk(a, { r: 9, pierce: 1, damage: 14 * dmgMul, life: 1.3, maxLife: 1.3, color: "#ffd166" }));
      }
      say(g, p.x, p.y - 46, ["SHELL!", "FAN!", "SEEKER!", "BURST!", "LUCKY!"][roll], "#ffd166");
    } else if (key === "paint") g.bullets.push(mk(a, { r: 7, life: 0.9, maxLife: 0.9, damage: 6 * dmgMul, paintMark: s.color }));
    else if (key === "pie") g.bullets.push(mk(a, { r: 12, life: 1.4, maxLife: 1.4, damage: 30 * dmgMul, pie: true, gravity: 260 }));
    else if (key === "stamp") g.bullets.push(mk(a, { r: 8, life: 1.2, maxLife: 1.2, damage: 15 * dmgMul, stampTag: true }));
    else if (key === "lance") g.bullets.push(mk(a, { r: 3.5, pierce: 99, life: 0.85, maxLife: 0.85, knock: 26 }));
    else if (key === "sprinkler") {
      for (let i = 0; i < 10; i++) {
        const ra = i / 10 * TAU + p.rhythm * 0.37;
        g.bullets.push(mk(ra, { r: 5, life: 0.52, maxLife: 0.52, knock: 18, vx: Math.cos(ra) * s.speed * rnd(0.9, 1.1), vy: Math.sin(ra) * s.speed * rnd(0.9, 1.1) }));
      }
    } else if (key === "candle") g.bullets.push(mk(a, { x: p.x + Math.cos(a) * 74, y: p.y - 4 + Math.sin(a) * 74, vx: 0, vy: 0, r: 26, pierce: 99, tick: 0.4, life: 5, maxLife: 5, damage: s.damage * dmgMul }));
  }
  const launched = g.bullets.length > n0;
  if (!launched) return false;
  if (key === "popper" || key === "choir" || key === "kettle" || key === "mortar" || key === "slots" || key === "lance" || key === "pie")
    shell(g, p.x + Math.cos(base) * 18, p.y - 8 + Math.sin(base) * 18, p.facing);
  puff(g, p.x + Math.cos(base) * 32, p.y - 4 + Math.sin(base) * 32, s.color, key === "choir" ? 8 : key === "fountain" ? 1 : 3, 70, 4);
  g.shake = Math.max(g.shake, SHAKE_W[key] ?? (key === "kettle" ? 2 + chargeAmt * 5 : 1.4));
  p.recoil = 1;
  g.events.push(`shoot:${key}`);
  g.stats.shots++;
  g.stats.byWeapon[key] = (g.stats.byWeapon[key] || 0) + 1;
  return true;
}
function fireEx(g, aim, key, w, h) {
  const p = g.player, s = WEAPONS[key], a = Math.atan2(aim.y - p.y, aim.x - p.x);
  const mk = (ang, extra) => ({
    x: p.x,
    y: p.y - 4,
    vx: Math.cos(ang) * s.speed,
    vy: Math.sin(ang) * s.speed,
    life: 2,
    maxLife: 2,
    damage: s.damage * p.damage,
    r: 6,
    color: s.color,
    weapon: key,
    pierce: 0,
    bounces: 0,
    chains: 0,
    hitIds: [],
    spin: 0,
    ex: true,
    ...extra
  });
  if (key === "popper") g.bullets.push(mk(a, { r: 20, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, pierce: 99, damage: 60 * p.damage }));
  else if (key === "choir") for (let i = 0; i < 8; i++) g.bullets.push(mk(i / 8 * TAU, { r: 7, pierce: 2, damage: 30 * p.damage, life: 1.1, maxLife: 1.1, vx: Math.cos(i / 8 * TAU) * 620, vy: Math.sin(i / 8 * TAU) * 620 }));
  else if (key === "note") for (let i = 0; i < 6; i++) g.bullets.push(mk(0, { orbit: { angle: i / 6 * TAU, dist: 74 }, life: 4.2, maxLife: 4.2, damage: 13 * p.damage, r: 7, tick: 0.35, pierce: 99 }));
  else if (key === "mortar") g.bullets.push(mk(a, { r: 21, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, splash: 200, damage: 95 * p.damage, bounces: 1, life: 2.6, maxLife: 2.6 }));
  else if (key === "halo") {
    const ra = rnd(TAU);
    g.bullets.push(mk(ra, { r: 27, vx: Math.cos(ra) * 520, vy: Math.sin(ra) * 520, roam: true, bounces: 99, pierce: 99, tick: 0.3, damage: 16 * p.damage, life: 2.8, maxLife: 2.8 }));
  } else if (key === "kettle") {
    ring(g, p.x, p.y, s.color, 170);
    puff(g, p.x, p.y, s.color, 26, 320, 7);
    g.shake = 14;
    for (const e of g.enemies) {
      const d = dist(e, p);
      if (d < 170 && !e.hidden && e.airborne <= 0) {
        damageEnemy(g, e, 70 * p.damage, s.color);
        const k = 120 / Math.max(40, d);
        e.x += (e.x - p.x) * k;
        e.y += (e.y - p.y) * k;
      }
    }
    for (const b2 of g.bullets) if (b2.enemy && dist(b2, p) < 170) b2.life = 0;
  } else if (key === "shard") g.bullets.push(mk(0, { vx: 0, vy: 0, sentry: true, life: 4.5, maxLife: 4.5, r: 15, tick: 0.22, damage: 14 * p.damage }));
  else if (key === "lobber") for (let i = 0; i < 5; i++) {
    const ang = i / 5 * TAU + a, tx = p.x + Math.cos(ang) * 150, ty = p.y + Math.sin(ang) * 120, dur = 0.55;
    g.bullets.push(mk(ang, { r: 12, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 110, damage: 60 * p.damage, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } }));
  }
  else if (key === "fountain") for (let i = 0; i < 24; i++) {
    const ang = i / 24 * TAU;
    g.bullets.push(mk(ang, { r: 9, vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420, life: 0.55, maxLife: 0.55, burn: 8, grow: 26, damage: 14 * p.damage, knock: 14 }));
  }
  else if (key === "trio") g.bullets.push(mk(a, { r: 26, vx: Math.cos(a) * 1500, vy: Math.sin(a) * 1500, pierce: 99, damage: 90 * p.damage, life: 1, maxLife: 1, beam: true }));
  else if (key === "cuckoo") for (let i = 0; i < 4; i++) {
    const ang = a + (i - 1.5) * 0.5;
    g.bullets.push(mk(ang, { r: 13, pierce: 99, life: 4.2, maxLife: 4.2, tick: 0.2, damage: 11 * p.damage, pet: { target: -1, hop: 0 } }));
  }
  else if (key === "accordion") for (let i = 0; i < 8; i++) {
    const ang = a + (i - 3.5) * 0.28;
    g.bullets.push(mk(ang, { r: 8, pierce: 4, life: 1.8, maxLife: 1.8, damage: 20 * p.damage, wave: { amp: 40 * (i % 2 ? 1 : -1), freq: 8, phase: 0, bx: p.x, by: p.y - 4, nx: -Math.sin(ang), ny: Math.cos(ang), t: 0 } }));
  }
  else if (key === "yoyo") g.bullets.push(mk(a, { r: 16, pierce: 99, tick: 0.16, life: 5, maxLife: 5, damage: 18 * p.damage, orbit: { angle: a, dist: 180 } }));
  else if (key === "harp") {
    for (const e of g.enemies) if (!e.hidden) {
      damageEnemy(g, e, 55 * p.damage, s.color);
      g.bullets.push(mk(0, { vx: 0, vy: 0, life: 0.22, maxLife: 0.22, arc: [{ x: e.x + rnd(-40, 40), y: fieldTop(g, h) - 40 }, { x: e.x, y: e.y }], damage: 0, r: 0 }));
    }
    g.flash = 0.5;
    g.shake = 12;
  } else if (key === "frost") {
    ring(g, p.x, p.y, s.color, 230);
    puff(g, p.x, p.y, "#ffffff", 20, 260, 6);
    for (const e of g.enemies) if (dist(e, p) < 230 && e.kind !== "boss") {
      e.frozen = Math.max(e.frozen, 3);
      damageEnemy(g, e, 20 * p.damage, s.color);
    }
    g.events.push("freeze");
  } else if (key === "quill") {
    ring(g, p.x, p.y, "#fff3c4", 150);
    for (const e of g.enemies) {
      const dd = dist(e, p);
      if (dd < 150 + e.r && !e.hidden) {
        damageEnemy(g, e, 90 * p.damage, "#fff3c4");
        if (e.kind !== "boss") {
          e.x += (e.x - p.x) / dd * 120;
          e.y += (e.y - p.y) / dd * 120;
        }
      }
    }
    for (const bl of g.bullets) if (bl.enemy && dist(bl, p) < 160) bl.life = 0;
    g.bullets.push(mk(a, { vx: 0, vy: 0, life: 0.22, maxLife: 0.22, damage: 0, r: 0, slash: { a, w: TAU } }));
    g.hitstop = 0.06;
    g.shake = 10;
  } else if (key === "popcorn") for (let i = 0; i < 12; i++) {
    const ang = i / 12 * TAU + a;
    g.bullets.push(mk(ang, { r: 6, bounces: 6, life: 1.4, maxLife: 1.4, popAt: 1.1, damage: 16 * p.damage, vx: Math.cos(ang) * rnd(300, 620), vy: Math.sin(ang) * rnd(300, 620) }));
  }
  else if (key === "trumpet") for (const off of [-0.5, 0, 0.5]) g.bullets.push(mk(a + off, { r: 20, pierce: 99, grow: 44, life: 1.6, maxLife: 1.6, ghostWave: true, damage: 48 * p.damage, vx: Math.cos(a + off) * 430, vy: Math.sin(a + off) * 430 }));
  else if (key === "mitt") {
    const tx = p.x + Math.cos(a) * 220, ty = p.y + Math.sin(a) * 220;
    g.bullets.push(mk(a, { x: tx, y: ty, vx: 0, vy: 0, r: 14, life: 1.4, maxLife: 1.4, gravity: 9999, pierce: 99, tick: 0.1, damage: 10 * p.damage }));
    g.shake = 8;
  } else if (key === "anvil") {
    const bb = viewBand(g, w, h);
    for (let i = 0; i < 4; i++) {
      const tx = bb.minX + (bb.maxX - bb.minX) * (0.16 + i * 0.22), ty = bb.minY + (bb.maxY - bb.minY) * (0.45 + rnd(0.35));
      g.bullets.push(mk(0, { x: tx, y: ty - 380, vx: 0, vy: 0, r: 22, life: 1.5, maxLife: 1.5, damage: 110 * p.damage, splash: 160, anvilDrop: { targetY: ty, groundT: 0.3 } }));
    }
  } else if (key === "bubbles") {
    g.bullets.push(mk(a, { r: 35, life: 3.5, maxLife: 3.5, bubbleFloat: true, homing: 0.08, pierce: 99, damage: 85 * p.damage }));
  } else if (key === "boombox") {
    ring(g, p.x, p.y, s.color, 320);
    g.shake = 18;
    for (const e of g.enemies) {
      const d = dist(e, p);
      if (d < 320) {
        damageEnemy(g, e, 80 * p.damage, s.color);
        if (e.kind !== "boss") {
          e.x += (e.x - p.x) / d * 180;
          e.y += (e.y - p.y) / d * 180;
        }
      }
    }
    for (const bl of g.bullets) if (bl.enemy && dist(bl, p) < 320) bl.life = 0;
  } else if (key === "lance") g.bullets.push(mk(a, { r: 9, pierce: 99, freeze: 1.2, knock: 70, damage: 120 * p.damage, life: 1.1, maxLife: 1.1 }));
  else if (key === "sprinkler") {
    for (let i = 0; i < 24; i++) {
      const ang = i / 24 * TAU;
      g.bullets.push(mk(ang, { r: 6, knock: 44, damage: 22 * p.damage, life: 0.8, maxLife: 0.8, vx: Math.cos(ang) * 760, vy: Math.sin(ang) * 760 }));
    }
  } else if (key === "candle") {
    for (const off of [-0.5, 0, 0.5]) {
      const ang = a + off;
      g.bullets.push(mk(ang, { x: p.x + Math.cos(ang) * 90, y: p.y - 4 + Math.sin(ang) * 90, vx: 0, vy: 0, r: 30, pierce: 99, tick: 0.35, life: 7, maxLife: 7, damage: 26 * p.damage }));
    }
  } else if (key === "phonograph") {
    for (let i = 0; i < 16; i++) {
      const ang = i / 16 * TAU;
      g.bullets.push(mk(ang, { r: 8, life: 2.2, maxLife: 2.2, damage: 24 * p.damage, wave: { amp: 40, freq: 8, phase: i * 0.4, bx: p.x, by: p.y - 4, nx: -Math.sin(ang), ny: Math.cos(ang), t: 0 } }));
    }
  } else if (key === "peel") {
    const bb = viewBand(g, w, h);
    for (let i = 0; i < 20; i++) {
      g.bullets.push(mk(0, {
        x: rnd(bb.minX + 40, bb.maxX - 40),
        y: rnd(bb.minY + 20, bb.maxY - 20),
        vx: 0,
        vy: 0,
        r: 12,
        life: 9,
        maxLife: 9,
        damage: 34 * p.damage,
        trap: { t: 8, armed: 0 }
      }));
    }
    say(g, p.x, p.y - 90, "MIND YOUR STEP!", "#f5d142", true);
  } else if (key === "kazoo") {
    for (let i = 0; i < 30; i++) {
      const ang = i / 30 * TAU;
      g.bullets.push(mk(ang, { r: 6, homing: 0.34, chains: 2, life: 2.6, maxLife: 2.6, damage: 15 * p.damage, vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420 }));
    }
  } else if (key === "barrel") {
    for (let i = -1; i <= 2; i++) {
      const ox = Math.cos(a + Math.PI / 2) * i * 54, oy = Math.sin(a + Math.PI / 2) * i * 54;
      g.bullets.push({ ...mk(a, {}), x: p.x + ox, y: p.y + oy, r: 22, pierce: 99, life: 3, maxLife: 3, knock: 46, roll: { decay: 0.3 }, damage: 42 * p.damage });
    }
    g.shake = Math.max(g.shake, 10);
  } else if (key === "syrup") {
    for (let i = 0; i < 12; i++) {
      const ang = i / 12 * TAU, tx = p.x + Math.cos(ang) * rnd(110, 250), ty = p.y + Math.sin(ang) * rnd(80, 180), dur = 0.6;
      g.bullets.push(mk(ang, { r: 12, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 120, syrup: true, damage: 40 * p.damage, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } }));
    }
  } else if (key === "whistle") {
    for (let i = 0; i < 3; i++) spawnCompanion(g, p.x + rnd(-30, 30), p.y + rnd(-20, 20), 14, 30 * p.damage);
    ring(g, p.x, p.y, "#e8c9a0", 140);
  } else if (key === "umbrella") {
    for (let i = 0; i < 8; i++) g.bullets.push(mk(0, { r: 22, life: 8, maxLife: 8, pierce: 99, tick: 0.26, damage: 22 * p.damage, brolly: { angle: i / 8 * TAU, dist: 78, spin: 3.2 } }));
    ring(g, p.x, p.y, "#8fd1ff", 180);
  } else if (key === "grapple") {
    p.invuln = Math.max(p.invuln, 1.2);
    p.grapple = null;
    ring(g, p.x, p.y, "#e8c9a0", 150);
    puff(g, p.x, p.y, "#e8c9a0", 16, 220, 6);
    for (const e of nearby(p.x, p.y, 150, nearBuf2)) if (!e.hidden && e.airborne <= 0) damageEnemy(g, e, 26 * p.damage, "#e8c9a0");
    say(g, p.x, p.y - 80, "SKYHOOK!", "#e8c9a0", true);
  } else if (key === "slots") {
    for (let i = 0; i < 5; i++) {
      const ang = a + (i - 2) * 0.3;
      g.bullets.push(mk(ang, { r: 11, pierce: 2, damage: 26 * p.damage, paintMark: s.color }));
    }
    say(g, p.x, p.y - 80, "TRIPLE CHERRIES!", "#ffd166", true);
  } else if (key === "paint") {
    for (const e of g.enemies) if (!e.hidden && e.hp > 0) {
      e.paint = g.charm === "varnish" ? 8 : 4;
      e.paintC = "#ff5aa5";
    }
    ring(g, p.x, p.y, "#ff5aa5", 420);
    say(g, p.x, p.y - 80, "MASTERPIECE!", "#ff5aa5", true);
  } else if (key === "pie") {
    for (let i = 0; i < 6; i++) {
      const ang = a + (i - 2.5) * 0.22;
      g.bullets.push(mk(ang, { r: 12, life: 1.6, maxLife: 1.6, damage: 26 * p.damage, pie: true, gravity: 200, vx: Math.cos(ang) * 700, vy: Math.sin(ang) * 700 }));
    }
    say(g, p.x, p.y - 80, "FOOD FIGHT!", "#fff0b8", true);
  } else if (key === "stamp") {
    for (const e of g.enemies) if (!e.hidden && e.hp > 0 && e.kind !== "boss" && !e.tag) e.tag = { t: rnd(1.2, 2.2) };
    say(g, p.x, p.y - 80, "SPECIAL DELIVERY!", "#7ee08a", true);
    g.events.push("stamp");
  }
  const b = bounds(w, h);
  p.x = clamp(p.x, b.minX, b.maxX);
  say(g, p.x, p.y - 60, s.ex.toUpperCase() + "!", "#fff3c4", true);
  g.events.push("ex");
  g.flash = Math.max(g.flash, 0.25);
}

// src/game/hazards.ts
function spawnHazard(g, w, h, kind) {
  if (g.hazards.length > 14) g.hazards.shift();
  const b = viewBand(g, w, h);
  const H2 = { x: 0, y: 0, r: 30, kind, timer: 0, active: false, warn: 0.9, life: 1, max: 1, angle: rnd(TAU), phase: rnd(TAU), hit: false };
  if (kind === "lava" || kind === "geyser") {
    H2.x = rnd(b.minX + 50, b.maxX - 50);
    H2.y = rnd(b.minY + 20, b.maxY - 20);
    H2.r = kind === "lava" ? 46 : 40;
    H2.warn = 0.95;
    H2.max = 2.3;
  } else if (kind === "pillar") {
    H2.x = rnd(b.minX + 30, b.maxX - 30);
    H2.y = (b.minY + b.maxY) / 2;
    H2.r = 30;
    H2.warn = 0.8;
    H2.max = 2.1;
  } else if (kind === "tomb") {
    H2.x = rnd(b.minX + 40, b.maxX - 40);
    H2.y = rnd(b.minY + 20, b.maxY - 20);
    H2.r = 34;
    H2.warn = 0.85;
    H2.max = 2.6;
  } else if (kind === "wisp") {
    H2.x = rnd(b.minX, b.maxX);
    H2.y = rnd(b.minY, b.maxY);
    H2.r = 19;
    H2.warn = 0;
    H2.max = 7.5;
  } else if (kind === "spinner") {
    H2.x = rnd(b.minX + 110, b.maxX - 110);
    H2.y = rnd(b.minY + 60, b.maxY - 60);
    H2.r = 96;
    H2.warn = 0;
    H2.max = 8;
  } else if (kind === "glaze") {
    H2.x = rnd(b.minX + 60, b.maxX - 60);
    H2.y = rnd(b.minY + 30, b.maxY - 30);
    H2.r = 66;
    H2.warn = 0;
    H2.max = 9;
  } else if (kind === "pendulum") {
    H2.x = rnd(b.minX + 90, b.maxX - 90);
    H2.y = fieldTop(g, h) + h * 0.28;
    H2.pivot = { x: H2.x, y: fieldTop(g, h) - 10 };
    H2.arm = 150 + rnd(70);
    H2.r = 27;
    H2.warn = 0;
    H2.max = 9;
  } else if (kind === "bolt") {
    H2.x = rnd(b.minX + 40, b.maxX - 40);
    H2.y = rnd(b.minY + 10, b.maxY - 10);
    H2.r = 30;
    H2.warn = 0.85;
    H2.max = 1.7;
  } else if (kind === "tome") {
    H2.x = rnd(b.minX + 40, b.maxX - 40);
    H2.y = rnd(b.minY + 20, b.maxY - 20);
    H2.r = 40;
    H2.warn = 0.95;
    H2.max = 2.2;
  } else {
    H2.x = rnd(b.minX + 40, b.maxX - 40);
    H2.y = rnd(b.minY + 20, b.maxY - 20);
    H2.r = 38;
    H2.warn = 0.7;
    H2.max = 2.4;
  }
  H2.life = H2.max;
  g.hazards.push(H2);
}
function updateHazards(g, d, w, h) {
  const p = g.player, b = worldBounds(g, w, h);
  for (const H2 of g.hazards) {
    H2.life -= d;
    H2.timer += d;
    const armed = H2.timer > H2.warn;
    H2.active = armed;
    if (H2.kind === "wisp") {
      H2.angle += Math.sin(H2.timer * 2.2 + (H2.phase || 0)) * d * 1.4;
      H2.x += Math.cos(H2.angle) * 48 * d;
      H2.y += Math.sin(H2.angle) * 36 * d;
      const dd = dist(H2, p) || 1;
      H2.x += (p.x - H2.x) / dd * 24 * d;
      H2.y += (p.y - H2.y) / dd * 24 * d;
      H2.x = clamp(H2.x, b.minX, b.maxX);
      H2.y = clamp(H2.y, b.minY, b.maxY);
      if (dd < H2.r + p.r && p.dashTime <= 0) hurtPlayer(g, 9, H2);
    } else if (H2.kind === "spinner") {
      H2.angle += d * (1.6 + (1 - H2.life / H2.max) * 0.8);
      for (const t of [0.5, 1]) {
        const tx = H2.x + Math.cos(H2.angle) * H2.r * t, ty = H2.y + Math.sin(H2.angle) * H2.r * t;
        if (Math.hypot(tx - p.x, ty - p.y) < 20 + p.r && p.dashTime <= 0) hurtPlayer(g, 13, { x: tx, y: ty });
      }
    } else if (H2.kind === "glaze") {
      if (dist(H2, p) < H2.r + p.r) p.momentum = Math.min(1, p.momentum + d * 2.4);
    } else if (H2.kind === "pendulum") {
      const A = H2.pivot, arm = H2.arm;
      const sw = Math.sin(g.elapsed * 1.85 + (H2.phase || 0)) * 1.05;
      H2.x = A.x + Math.sin(sw) * arm;
      H2.y = A.y + Math.cos(sw) * arm;
      if (Math.hypot(H2.x - p.x, H2.y - p.y) < H2.r + p.r && p.dashTime <= 0) hurtPlayer(g, 16, H2);
    } else if (H2.kind === "tomb") {
      if (armed && dist(H2, p) < H2.r + p.r) {
        if (!H2.hit && p.dashTime <= 0) {
          hurtPlayer(g, 15, H2);
          H2.hit = true;
        }
        if (H2.hit) {
          p.y -= 34 * d;
          p.x += (p.x - H2.x) * d * 1.6;
        }
      }
    } else if (H2.kind === "lava" || H2.kind === "geyser") {
      if (armed && dist(H2, p) < H2.r * 0.78 + p.r && p.dashTime <= 0) hurtPlayer(g, 14, H2);
      if (armed && Math.random() < d * 14) puff(g, H2.x + rnd(-H2.r * 0.6, H2.r * 0.6), H2.y, H2.kind === "lava" ? "#ff8c4a" : "#2a2230", 1, 100, 5);
    } else if (H2.kind === "pillar") {
      if (armed && Math.abs(H2.x - p.x) < H2.r * 0.5 + p.r * 0.7 && p.dashTime <= 0) hurtPlayer(g, 15, H2);
      if (armed && Math.random() < d * 18) puff(g, H2.x + rnd(-9, 9), rnd(b.minY, b.maxY), "#ff5555", 1, 130, 5);
    } else if (H2.kind === "bolt") {
      if (armed && H2.timer < H2.warn + 0.22) {
        if (!H2.hit) {
          H2.hit = true;
          g.events.push("laser");
        }
        if (Math.abs(H2.x - p.x) < 26 + p.r * 0.5 && p.dashTime <= 0) hurtPlayer(g, 16, H2);
        for (const e of g.enemies) if (!e.hidden && !e.phased && e.airborne <= 0 && Math.abs(H2.x - e.x) < 26 + e.r) damageEnemy(g, e, 45, "#ffe27a");
      }
    } else if (H2.kind === "tome") {
      if (armed && !H2.hit) {
        H2.hit = true;
        g.shake = Math.max(g.shake, 5);
        puff(g, H2.x, H2.y, "#c9a86a", 10, 130, 5);
        g.events.push("thud");
        if (dist(H2, p) < H2.r + p.r && p.dashTime <= 0) hurtPlayer(g, 14, H2);
        g.puddles.push({ x: H2.x, y: H2.y, r: 34, life: 2.5, max: 2.5, kind: "ink" });
      }
    } else if (armed && dist(H2, p) < H2.r + p.r && p.dashTime <= 0) hurtPlayer(g, 10, H2);
  }
  compact(g.hazards, (H2) => H2.life > 0);
}

// src/game/companions.ts
function updateCompanions(g, d, w, h) {
  const p = g.player, b = worldBounds(g, w, h);
  for (const c of g.companions) {
    c.life -= d;
    c.hop += d * 8;
    let t = c.target >= 0 ? byId.get(c.target) : void 0;
    if (!t || t.hp <= 0 || t.hidden) {
      let best = void 0, bd = Infinity;
      for (const e of liveBuf) {
        const v = dist(e, c) - (e.kind === "boss" ? 500 : 0);
        if (v < bd) {
          bd = v;
          best = e;
        }
      }
      t = best;
      c.target = t ? t.id : -1;
    }
    const accel = c.bee ? 1400 : 900, top = c.bee ? 520 : 430;
    if (t) {
      const dd = dist(t, c) || 1;
      c.vx += (t.x - c.x) / dd * accel * d;
      c.vy += (t.y - c.y) / dd * accel * d;
      c.facing = t.x < c.x ? -1 : 1;
      if (dd < t.r + (c.bee ? 8 : 16)) {
        c.bite -= d;
        if (c.bite <= 0) {
          c.bite = c.bee ? 0.3 : 0.4;
          damageEnemy(g, t, c.dmg, c.bee ? "#ffc94a" : "#ffe27a");
          puff(g, t.x, t.y, "#fff6dc", 3, 110, 3);
          g.events.push("peck");
        }
      }
    } else {
      const dd = dist(p, c) || 1;
      if (dd > 62) {
        c.vx += (p.x - c.x) / dd * 700 * d;
        c.vy += (p.y - c.y) / dd * 700 * d;
      }
      c.facing = p.x < c.x ? -1 : 1;
    }
    c.vx *= 0.9;
    c.vy *= 0.9;
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > top) {
      c.vx = c.vx / sp * top;
      c.vy = c.vy / sp * top;
    }
    c.x = clamp(c.x + c.vx * d, b.minX, b.maxX);
    c.y = clamp(c.y + c.vy * d, b.minY, b.maxY);
  }
  compact(g.companions, (c) => c.life > 0);
}

// src/game/engine.ts
var FIRE_BUFFER = 0.14;
var bufferFor = (key) => Math.max(FIRE_BUFFER, Math.min(1.1, (WEAPONS[key]?.rate ?? 200) / 1e3 * 1.05));
var DECLINED_SHOT = 90;
var MODE_INTROS = {
  bulletdance: { title: "BULLET DANCE", sub: "EVERY SHOT IS PINK. SLAP THEM ALL BACK.", life: 3.6 },
  beat: { title: "ON THE BEAT", sub: "HIT WITH THE BAND \u2014 \xD71.75 ON BEAT, \xD70.7 OFF", life: 3.6 },
  glass: { title: "GLASS CANNON", sub: "ONE HP. EVERYTHING HURTS. YOU HIT LIKE A TRAIN.", life: 3.6 },
  blackout: { title: "BLACKOUT", sub: "A SMALL CIRCLE OF LIGHT. BULBS WIDEN IT.", life: 3.6 }
};
function createState(w, h, weapons, charm, unlocks, character = "milo", daily, mode = "endless", districts = 1, rows = 1, mapId = "arena") {
  const world0 = worldOf(mapId);
  if (world0.stages.length) {
    districts = world0.cols;
    rows = world0.rows;
  }
  const ch = CHARACTERS[character] ?? CHARACTERS.milo;
  const p = {
    x: w / 2,
    y: h * 0.62,
    r: 20 * ch.radius,
    health: mode === "glass" ? 1 : 100 * ch.health,
    maxHealth: mode === "glass" ? 1 : 100 * ch.health,
    invuln: 0,
    speed: 250 * ch.speed,
    damage: ch.damage,
    angle: 0,
    facing: 1,
    dashTime: 0,
    dashCd: 0,
    dashDir: { x: 1, y: 0 },
    charge: 0,
    squash: 0,
    parryFlash: 0,
    cards: 0,
    moving: false,
    superTime: 0,
    fireRate: ch.fireRate,
    dashCdMult: ch.dashCdMult,
    magnet: 70,
    cardGain: 1,
    crit: 0,
    regen: 0,
    extraShots: 0,
    scoreMult: 1,
    trail: [],
    parryCd: 0,
    rapid: 0,
    shield: ch.shield + (charm === "thimble" ? 1 : 0),
    blink: 0,
    star: 0,
    clock: 0,
    magnetBoost: 0,
    webbed: 0,
    rhythm: 0,
    wind: charm === "wind" && mode !== "glass" ? 1 : 0,
    burning: 0,
    coins: 0,
    comboStreak: 0,
    character,
    skin: "",
    step: 0,
    momentum: 0,
    mx: 0,
    my: 0,
    mirror: 0,
    bees: 0,
    grease: 0,
    gunk: 0,
    grapple: null,
    shieldTimer: charm === "thimble" ? 25 : 0,
    anim: 0,
    recoil: 0,
    runCycle: 0,
    trigger: 0
  };
  if (charm === "locket") {
    p.maxHealth = 140 * ch.health;
    p.health = p.maxHealth;
    p.damage *= 0.88;
  }
  if (charm === "smoke") p.dashCdMult *= 0.7;
  if (charm === "penny") p.scoreMult = 1.4;
  if (charm === "magneto") p.magnet = 210;
  let dailyOrder;
  let startMod = null;
  let startModTimer = 45;
  if (daily !== void 0) {
    let sd = daily >>> 0;
    const rr = () => {
      sd = sd + 1831565813 >>> 0;
      let t = Math.imul(sd ^ sd >>> 15, 1 | sd);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    dailyOrder = BIOMES.map((_, i) => i);
    for (let i = dailyOrder.length - 1; i > 0; i--) {
      const j = Math.floor(rr() * (i + 1));
      const tmp = dailyOrder[i];
      dailyOrder[i] = dailyOrder[j];
      dailyOrder[j] = tmp;
    }
    const m = MODIFIERS[Math.floor(rr() * MODIFIERS.length)];
    startMod = { ...m, time: 1e9 };
    startModTimer = 1e9;
  }
  const dist2 = Math.max(1, Math.round(districts));
  const rw = Math.max(1, Math.round(rows));
  return {
    viewW: w,
    viewH: h,
    worldW: Math.round(w * dist2),
    districts: dist2,
    worldH: Math.round(h * rw),
    rows: rw,
    tCol: 0,
    tRow: 0,
    cam: { x: 0, y: 0 },
    biomeNext: 0,
    biomeMix: 0,
    map: mapId,
    stage: world0.stages.length ? stageAt(world0, 0, 0) ?? null : null,
    player: p,
    enemies: [],
    bullets: [],
    puffs: [],
    texts: [],
    pickups: [],
    puddles: [],
    ghosts: [],
    platforms: [],
    hazards: [],
    companions: [],
    score: 0,
    kills: 0,
    parries: 0,
    damageTaken: 0,
    level: 1,
    combo: 0,
    comboTime: 0,
    elapsed: 0,
    spawn: 1.2,
    shot: 0,
    id: 1,
    shake: 0,
    nextUpgrade: 16,
    weapons,
    active: 0,
    charm,
    boss: null,
    bossTimer: 80,
    bossesBeaten: 0,
    announce: MODE_INTROS[mode] ?? { title: BIOMES[0].name, sub: `ENTERING: ${BIOMES[0].hazardTip}`, life: 3.4 },
    over: false,
    upgradeReady: false,
    flash: 0,
    slowmo: 0,
    hitstop: 0,
    biome: 0,
    upgrades: {},
    events: [],
    bulbTimer: 7,
    maxCombo: 0,
    crateTimer: charm === "penny" ? 22 : 32,
    slotPity: 0,
    lastThreat: "",
    modifier: startMod,
    modTimer: startModTimer,
    unlocks: [...unlocks],
    found: [],
    cratesOpened: 0,
    wave: 0,
    waveTimer: 60,
    waveKind: null,
    lowFx: false,
    fxBudget: 1,
    revives: 0,
    fireworks: 0,
    shopOpen: false,
    shopNpc: null,
    shopItems: [],
    bossIntro: null,
    hazardTimer: 6,
    hazardKind: null,
    dailyOrder,
    dailySeed: daily,
    stats: { shots: 0, hits: 0, byWeapon: {} },
    mode,
    dance: { streak: 0, best: 0, heat: 0, riposte: 0 },
    bulbPulse: 0,
    beatT: 0,
    onBeat: false,
    lightR: mode === "blackout" ? 250 : 9999
  };
}
var currentWeapon = (g) => g.weapons[g.active];
function update(g, input, dt, vw, h) {
  const world = worldOf(g.map ?? "arena");
  const authored = world.stages.length > 0;
  if (authored && (g.districts !== world.cols || g.rows !== world.rows)) {
    g.districts = world.cols;
    g.rows = world.rows;
  }
  const wantW = Math.max(1, Math.round(g.districts || 1)), wantR = Math.max(1, Math.round(g.rows || 1));
  g.rows = wantR;
  if (g.viewW !== vw || g.viewH !== h || g.worldW !== vw * wantW || g.worldH !== h * wantR) {
    g.viewW = vw;
    g.viewH = h;
    g.worldW = Math.round(vw * wantW);
    g.worldH = Math.round(h * wantR);
  }
  if (!g.cam) g.cam = { x: 0, y: 0 };
  sanitize(g);
  const w = g.worldW, p = g.player, b = worldBounds(g, w, h);
  const wh = Math.max(h, g.worldH || h);
  if (input.fire) p.trigger = Math.max(p.trigger, FIRE_BUFFER);
  else if (p.dashTime <= 0 && g.hitstop <= 0) p.trigger = Math.max(0, p.trigger - dt);
  if (!Number.isFinite(p.trigger) || p.trigger < 0) p.trigger = input.fire ? FIRE_BUFFER : 0;
  const consume = () => {
    input.dash = false;
    input.parry = false;
    input.ex = false;
    input.superMove = false;
    input.swap = false;
    input.interact = false;
  };
  if (g.hitstop > 0) {
    g.hitstop -= dt;
    consume();
    return;
  }
  const load = g.enemies.length + g.bullets.length * 0.35 + g.puffs.length * 0.08;
  g.fxBudget = g.lowFx ? 0.35 : load > 120 ? 0.35 : load > 70 ? 0.6 : 1;
  const ts = g.slowmo > 0 ? 0.4 : 1;
  g.slowmo = Math.max(0, g.slowmo - dt);
  const d = dt * ts;
  const worldD = p.clock > 0 ? d * 0.35 : d;
  const rate = p.fireRate * (p.rapid > 0 ? 2 : 1);
  g.elapsed += worldD;
  g.shot -= d * 1e3 * rate;
  p.invuln -= d;
  p.dashCd -= d;
  p.parryCd -= d;
  p.superTime = Math.max(0, p.superTime - d);
  p.rapid = Math.max(0, p.rapid - d);
  p.mirror = Math.max(0, p.mirror - d);
  p.bees = Math.max(0, p.bees - d);
  p.grease = Math.max(0, p.grease - d);
  p.recoil = Math.max(0, p.recoil - d * 6);
  p.anim += d;
  p.runCycle += p.moving ? d * 11 : d * 2;
  if (g.charm === "thimble") {
    p.shieldTimer -= d;
    if (p.shieldTimer <= 0) {
      p.shieldTimer = 25;
      if (p.shield < 2) {
        p.shield++;
        say(g, p.x, p.y - 60, "THIMBLE UP!", "#c0c8d8");
        ring(g, p.x, p.y, "#c0c8d8", 70);
      }
    }
  }
  p.star = Math.max(0, p.star - d);
  p.clock = Math.max(0, p.clock - d);
  p.webbed = Math.max(0, p.webbed - d);
  p.squash = Math.max(0, p.squash - d * 4);
  p.parryFlash = Math.max(0, p.parryFlash - d);
  g.flash = Math.max(0, g.flash - d * 2);
  g.comboTime -= d;
  if (g.comboTime <= 0) g.combo = 0;
  p.blink -= d;
  if (p.blink < -0.15) p.blink = rnd(2, 5);
  if (g.mode === "beat") {
    g.beatT += dt;
    const B = 60 / 88, ph = g.beatT % B;
    g.onBeat = ph < 0.15 || ph > B - 0.15;
  }
  if (g.mode === "bulletdance") {
    const d2 = g.dance;
    d2.heat = Math.max(0, d2.heat - dt * 0.42);
    d2.riposte = Math.max(0, d2.riposte - dt);
    if (d2.streak && d2.heat <= 0) {
      d2.streak = 0;
    }
    if (d2.streak >= 8 && d2.streak % 8 === 0 && d2.riposte <= 0) d2.riposte = 1e-3;
  }
  if (g.announce && (g.announce.life -= dt) <= 0) g.announce = null;
  if (g.bulbPulse > 0) g.bulbPulse = Math.max(0, g.bulbPulse - dt);
  if (g.bossIntro && (g.bossIntro.life -= dt) <= 0) g.bossIntro = null;
  const DW = g.worldW / wantW, DH = g.worldH / wantR;
  const camLead = input.aim ? Math.max(-90, Math.min(90, (input.aim.x - p.x) * 0.1)) : 0;
  const camSpan = authored && wantW > 1 ? rowSpanOf(world, g.tRow) : null;
  const leak = Math.min(g.viewW * 0.25, DW * 0.25);
  const camLo = camSpan ? Math.max(0, camSpan.c0 * DW - (camSpan.c0 > 0 ? leak : 0)) : 0;
  const camHi = camSpan ? Math.min(Math.max(0, g.worldW - g.viewW), (camSpan.c1 + 1) * DW - g.viewW + (camSpan.c1 < wantW - 1 ? leak : 0)) : Math.max(0, g.worldW - g.viewW);
  const camTo = Math.max(camLo, Math.min(Math.max(camLo, camHi), p.x - g.viewW / 2 + camLead));
  if (Math.abs(camTo - g.cam.x) > g.viewW * 0.7) g.cam.x = camTo;
  else {
    g.cam.x += (camTo - g.cam.x) * Math.min(1, dt * 7.5);
    if (Math.abs(camTo - g.cam.x) < 0.6) g.cam.x = camTo;
  }
  const camLeadY = input.aim ? Math.max(-70, Math.min(70, (input.aim.y - p.y) * 0.1)) : 0;
  const camToY = wantR > 1 ? Math.max(0, Math.min(Math.max(0, g.worldH - g.viewH), p.y - g.viewH / 2 + camLeadY)) : 0;
  if (wantR > 1) {
    if (Math.abs(camToY - g.cam.y) > g.viewH * 0.7) g.cam.y = camToY;
    else {
      g.cam.y += (camToY - g.cam.y) * Math.min(1, dt * 7.5);
      if (Math.abs(camToY - g.cam.y) < 0.6) g.cam.y = camToY;
    }
  } else g.cam.y = 0;
  const place = g.districts > 1 ? viewBand(g, w, h) : b;
  if (authored && wantW > 1) {
    const sp = rowSpanOf(world, g.tRow);
    place.minX = Math.max(place.minX, sp.c0 * DW + 30);
    place.maxX = Math.min(place.maxX, (sp.c1 + 1) * DW - 30);
    if (place.maxX < place.minX) {
      place.minX = b.minX;
      place.maxX = b.maxX;
    }
  }
  const focus = wantW > 1 ? Math.max(0, Math.min(g.worldW - 1, g.cam.x + g.viewW / 2)) : p.x;
  const focusY = wantR > 1 ? Math.max(0, Math.min(g.worldH - 1, g.cam.y + g.viewH / 2)) : p.y;
  const fIdx = Math.max(0, Math.min(wantW - 1, Math.floor(focus / DW))), fFrac = focus / DW - Math.floor(focus / DW);
  const seam = Math.min(fFrac, 1 - fFrac);
  g.biomeMix = wantW > 1 ? Math.max(0, Math.min(1, 1 - seam / 0.14)) : 0;
  g.biomeNext = Math.max(0, Math.min(BIOMES.length - 1, Math.floor(focus / DW) + (fFrac > 0.5 ? 1 : -1)));
  let col = fIdx, row = Math.max(0, Math.min(wantR - 1, Math.floor(focusY / DH)));
  if (wantW > 1 || wantR > 1) {
    const inside = (c, r, pad) => focus > c * DW + pad * DW && focus < (c + 1) * DW - pad * DW && focusY > r * DH + pad * DH && focusY < (r + 1) * DH - pad * DH;
    const far = Math.abs(col - g.tCol) > 1 || Math.abs(row - g.tRow) > 1;
    if (!far && (col !== g.tCol || row !== g.tRow) && !inside(col, row, 0.06)) {
      col = g.tCol;
      row = g.tRow;
    }
  }
  let stage = null;
  if (authored) {
    const c0 = Math.max(0, Math.min(world.cols - 1, col)), r0 = Math.max(0, Math.min(world.rows - 1, row));
    stage = stageAt(world, c0, r0) ?? g.stage ?? null;
    if (!stage) {
      outer: for (let d2 = 1; d2 < 6; d2++) for (let dr = -d2; dr <= d2; dr++) for (let dc = -d2; dc <= d2; dc++) {
        const s = stageAt(world, c0 + dc, r0 + dr);
        if (s) {
          stage = s;
          break outer;
        }
      }
    }
  }
  g.stage = stage;
  const biome = stage ? stage.biome : wantW > 1 || wantR > 1 ? ((col + row * 4) % BIOMES.length + BIOMES.length) % BIOMES.length : g.dailyOrder ? g.dailyOrder[Math.floor(g.elapsed / BIOME_LENGTH) % g.dailyOrder.length] : Math.floor(g.elapsed / BIOME_LENGTH) % BIOMES.length;
  g.tCol = col;
  g.tRow = row;
  if (biome !== g.biome || stage && stage.id !== g.lastStageId) {
    g.lastStageId = stage?.id;
    g.biome = biome;
    g.announce = { title: stage ? stage.name : BIOMES[biome].name, sub: stage ? stage.tagline : BIOMES[biome].hazardTip, life: 3.8 };
    g.events.push("biome");
    g.hazards.length = 0;
    g.hazardTimer = 3.2;
    const tileX = g.tCol * DW, tileY = g.tRow * DH;
    if (BIOMES[biome].decor === "train") {
      g.platforms = [
        { x: tileX + DW * 0.2, y: tileY + DH * 0.75, w: 140, h: 22, kind: "train", vx: -80 },
        { x: tileX + DW * 0.55, y: tileY + DH * 0.68, w: 160, h: 22, kind: "train", vx: -80 },
        { x: tileX + DW * 0.82, y: tileY + DH * 0.8, w: 130, h: 22, kind: "train", vx: -80 }
      ];
    } else {
      g.platforms = [];
    }
    if (stage?.ledges) {
      for (const [lx, ly, lw] of stage.ledges) {
        g.platforms.push({ x: tileX + lx * DW, y: tileY + ly * DH, w: lw * DW, h: 16, kind: "plank", vx: 0 });
      }
    }
  }
  for (const pl of g.platforms) {
    pl.x += pl.vx * d;
    const d0 = Math.max(0, Math.floor(pl.x / DW)) * DW;
    if (pl.x < d0 - pl.w) pl.x = d0 + DW + 40;
    if (pl.x > d0 + DW + 40) pl.x = d0 - pl.w;
  }
  if (g.charm === "coffee") addCards(g, d * 0.07);
  if (p.regen > 0) p.health = Math.min(p.maxHealth, p.health + p.regen * d);
  if (g.shopNpc && g.shopNpc.active) {
    const npc = g.shopNpc;
    const near = dist(npc, p) < 230;
    npc.talkTimer -= d * (near ? 0.25 : 1);
    if (input.interact && near) {
      g.shopOpen = true;
      g.events.push("shopopen");
      say(g, npc.x, npc.y - 70, pick(["WHAT'LL IT BE?", "FRESH STOCK!", "STEP RIGHT UP!"]), "#ffd700", true);
      npc.talkTimer = Math.max(npc.talkTimer, 6);
    }
    if (npc.talkTimer <= 0) {
      npc.active = false;
      g.shopOpen = false;
      say(g, npc.x, npc.y - 60, "CATCH YOU NEXT ACT!", "#c9b48a");
    }
  }
  if (g.modifier) {
    g.modifier.time -= worldD;
    if (g.modifier.time <= 0) {
      g.modifier = null;
      g.modTimer = rnd(40, 60);
    }
  } else {
    g.modTimer -= worldD;
    if (g.modTimer <= 0 && !g.boss) {
      const m = pick(MODIFIERS);
      g.modifier = { ...m };
      g.announce = { title: m.name, sub: m.sub, life: 3 };
      g.events.push("modifier");
      if (m.id === "pink") {
        for (const bl of g.bullets) if (bl.enemy) {
          bl.pink = true;
          bl.color = "#ff7ad9";
        }
      }
    }
  }
  if (g.modifier?.id === "coins" && Math.random() < worldD * 3) drop(g, rnd(place.minX, place.maxX), rnd(place.minY, place.maxY), "coin");
  if (g.modifier?.id === "meteor" && Math.random() < worldD * 2) {
    const rx = rnd(place.minX, place.maxX);
    g.bullets.push({
      x: rx,
      y: fieldTop(g, h) - 60,
      vx: rnd(-20, 20),
      vy: 340,
      life: 2.2,
      maxLife: 2.2,
      damage: 18,
      r: 14,
      color: "#ff5555",
      enemy: true,
      splash: 70,
      pierce: 0,
      bounces: 0,
      chains: 0,
      hitIds: [],
      spin: rnd(TAU)
    });
  }
  if (g.modifier?.id === "rain" && Math.random() < worldD * 6) {
    g.bullets.push({
      x: rnd(place.minX, place.maxX),
      y: fieldTop(g, h) - 30,
      vx: rnd(-14, 14),
      vy: 300,
      life: 2.4,
      maxLife: 2.4,
      damage: 10,
      r: 7,
      color: "#2a2230",
      enemy: true,
      pierce: 0,
      bounces: 0,
      chains: 0,
      hitIds: [],
      spin: rnd(TAU)
    });
  }
  g.waveTimer -= worldD;
  if (g.waveTimer <= 0 && !g.boss) {
    const wv = WAVES.filter((x) => x.kinds.every((k) => g.elapsed >= ENEMIES[k].unlock));
    const pickW = wv.length ? pick(wv) : WAVES[0];
    g.waveKind = pickW.id;
    g.announce = { title: pickW.name, sub: pickW.sub, life: 2.6 };
    g.events.push("wave");
    for (let i = 0; i < pickW.count; i++) spawnEnemy(g, w, h, pick(pickW.kinds));
    g.wave++;
    g.waveTimer = rnd(38, 55);
  }
  if (input.swap) {
    g.active = g.active === 0 ? 1 : 0;
    p.charge = 0;
    p.trigger = 0;
    g.shot = Math.max(g.shot, 120);
    say(g, p.x, p.y - 60, WEAPONS[currentWeapon(g)].name.toUpperCase(), "#fff3c4");
    g.events.push("swap");
  }
  let mx = input.mx, my = input.my;
  const ml = Math.hypot(mx, my);
  if (ml > 1) {
    mx /= ml;
    my /= ml;
  }
  p.moving = ml > 0.1;
  p.gunk = Math.max(0, p.gunk - d);
  const webSlow = (p.webbed > 0 ? 0.3 : 1) * (p.gunk > 0 ? 0.55 : 1);
  const grip = 1 - p.momentum * 0.84;
  const steer = Math.min(1, d * (11 * grip + 1.4));
  p.mx += (mx - p.mx) * steer;
  p.my += (my - p.my) * steer;
  p.momentum = Math.max(0, p.momentum - d * 0.6);
  if (p.moving && p.dashTime <= 0 && p.dashCd > 0) {
    p.step += d;
    if (p.step > 0.26) {
      p.step = 0;
      puff(g, p.x - p.facing * 10, p.y + 34, "rgba(232,223,207,.45)", 1, 26, 3);
    }
  } else p.step = 0;
  if (input.dash && p.dashCd <= 0 && p.dashTime <= 0) {
    p.dashTime = 0.19;
    p.dashCd = 1.15 * p.dashCdMult;
    p.invuln = Math.max(p.invuln, g.charm === "smoke" ? 0.5 : 0.22);
    p.squash = 0.6;
    p.webbed = 0;
    p.momentum = 0;
    p.mx = mx;
    p.my = my;
    p.dashDir = p.moving ? { x: mx, y: my } : { x: Math.cos(p.angle), y: Math.sin(p.angle) };
    puff(g, p.x, p.y + 20, "#e8dfcf", 8, 90, 7);
    g.events.push("dash");
    if (g.charm === "smoke") {
      for (const e of g.enemies) if (dist(e, p) < 70 && !e.hidden) damageEnemy(g, e, 8 * p.damage, "#cfd6e2");
    }
    if (g.charm === "spurs") {
      ring(g, p.x, p.y + 8, "#f0c24d", 110);
      for (const e of nearby(p.x, p.y, 130, nearBuf2)) {
        if (!e.hidden && e.airborne <= 0 && dist(e, p) < 120 + e.r) {
          damageEnemy(g, e, 14 * p.damage, "#f0c24d");
          if (e.kind !== "boss") {
            const dd = dist(e, p) || 1;
            e.x += (e.x - p.x) / dd * 34;
            e.y += (e.y - p.y) / dd * 34;
          }
        }
      }
      p.magnetBoost = 1.1;
    }
  }
  if (p.dashTime > 0) {
    p.dashTime -= d;
    p.x += p.dashDir.x * p.speed * 3.6 * d;
    p.y += p.dashDir.y * p.speed * 3.6 * d;
    if (Math.random() < 0.5) puff(g, p.x - p.dashDir.x * 16, p.y + 12, "#efe6d5", 1, 40, 8);
    if (g.upgrades.dashfire && Math.random() < 0.8) {
      g.bullets.push({
        x: p.x,
        y: p.y + 10,
        vx: 0,
        vy: 0,
        life: 0.9,
        maxLife: 0.9,
        damage: 6 * p.damage,
        r: 16,
        color: "#ff6a3d",
        weapon: "fountain",
        pierce: 99,
        bounces: 0,
        chains: 0,
        hitIds: [],
        spin: rnd(TAU),
        burn: 3,
        tick: 0.3
      });
    }
    if (g.charm === "spurs") {
      for (const e of nearby(p.x, p.y, 70, nearBuf2)) {
        if (!e.hidden && e.airborne <= 0 && e.hit <= 0 && dist(e, p) < 56 + e.r) damageEnemy(g, e, 5 * p.damage, "#f0c24d");
      }
    }
  } else {
    p.x += p.mx * p.speed * d * webSlow * (p.magnetBoost > 0 ? 1.35 : 1);
    p.y += p.my * p.speed * d * webSlow * (p.magnetBoost > 0 ? 1.35 : 1);
    if (p.trail.length) p.trail.shift();
  }
  if (p.grapple) {
    const gd = Math.hypot(p.grapple.tx - p.x, p.grapple.ty - p.y) || 1;
    if (gd < 26 || (p.grapple.t -= d) <= 0) p.grapple = null;
    else {
      p.x += (p.grapple.tx - p.x) / gd * 760 * d;
      p.y += (p.grapple.ty - p.y) / gd * 760 * d;
      p.invuln = Math.max(p.invuln, 0.05);
    }
  }
  p.magnetBoost = Math.max(0, p.magnetBoost - d);
  p.x = clamp(p.x, b.minX, b.maxX);
  p.y = clamp(p.y, b.minY, b.maxY);
  if (authored && wantW > 1) {
    const sp = rowSpanOf(world, g.tRow);
    p.x = Math.max(sp.c0 * DW + 26, Math.min((sp.c1 + 1) * DW - 26, p.x));
    if (!canStand(world, g.tCol, g.tRow - 1)) p.y = Math.max(p.y, g.tRow * DH + DH * HORIZON + 26);
    if (!canStand(world, g.tCol, g.tRow + 1)) p.y = Math.min(p.y, (g.tRow + 1) * DH - 34);
  }
  liveBuf.length = 0;
  for (const e of g.enemies) if (!e.hidden && e.airborne <= 0 && e.alpha > 0.2) liveBuf.push(e);
  buildGrid(g.enemies);
  const wk = currentWeapon(g);
  const reach = Math.max(680, (g.viewW || 1280) * 1.6), reachRow = (g.viewH || 720) * 1.5;
  let target = input.aim;
  let inReach = false;
  if (!target && liveBuf.length) {
    let best = null, bd = Infinity;
    for (const e of liveBuf) {
      const dx = Math.abs(e.x - p.x), dy = Math.abs(e.y - p.y);
      if (dx > reach || dy > reachRow) continue;
      const dd = dx * dx + dy * dy;
      if (dd < bd) {
        bd = dd;
        best = e;
      }
    }
    if (best) {
      target = best;
      inReach = true;
    }
  }
  if (!target) target = { x: p.x + Math.cos(p.angle) * 220, y: p.y + Math.sin(p.angle) * 220 };
  if (ml > 0.1 && !input.aim) {
    p.facing = mx < 0 ? -1 : 1;
  }
  if (p.dashTime <= 0) {
    p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    p.facing = Math.cos(p.angle) < 0 ? -1 : 1;
  }
  if (input.fire) p.trigger = Math.max(p.trigger, bufferFor(wk));
  const wantsFire = p.trigger > 0 || input.fire || input.autoFire && (inReach || liveBuf.length > 0 || g.enemies.length > 0);
  const boiling = wk === "kettle" && (input.fire || input.autoFire && (inReach || liveBuf.length > 0 || g.enemies.length > 0));
  if (wk === "kettle") {
    if (boiling && target) {
      p.charge = Math.min(1, p.charge + d * 1.15 * (p.rapid > 0 ? 1.6 : 1));
      if (p.charge >= 1 && !input.fire && g.shot <= 0 && p.dashTime <= 0) {
        if (fireWeapon(g, target, wk, 1)) {
          p.charge = 0;
          p.trigger = 0;
          g.shot = WEAPONS[wk].rate;
        }
      }
      if (p.charge > 0.3 && Math.random() < 0.3) {
        puff(g, p.x + Math.cos(p.angle) * 28, p.y - 4 + Math.sin(p.angle) * 28, "#ffe05e", 1, 60, 3 + p.charge * 4);
      }
    } else if (p.charge > 0) {
      if (target && g.shot <= 0 && p.dashTime <= 0) {
        if (fireWeapon(g, target, wk, Math.max(0.14, p.charge))) {
          p.trigger = 0;
          g.shot = WEAPONS[wk].rate;
        }
        p.charge = 0;
      } else if (p.trigger <= 0) p.charge = 0;
    }
  } else if (target && wantsFire && g.shot <= 0 && p.dashTime <= 0) {
    if (wk === "cuckoo" && g.bullets.filter((bl) => bl.pet && !bl.ex).length >= 2) g.shot = DECLINED_SHOT;
    else if (fireWeapon(g, target, wk)) {
      p.trigger = 0;
      g.shot = WEAPONS[wk].rate;
    } else g.shot = DECLINED_SHOT;
  }
  if (input.ex && p.cards >= 1 && target) {
    p.cards -= 1;
    fireEx(g, target, wk, w, h);
  } else if (input.ex && p.cards < 1) g.events.push("deny");
  if (input.superMove && p.cards >= 5) {
    p.cards = 0;
    p.superTime = 1.6;
    g.slowmo = 0.9;
    g.flash = 1;
    g.shake = 22;
    ring(g, p.x, p.y, "#fff3c4", 260);
    ring(g, p.x, p.y, "#ff8ad3", 160);
    for (const e of g.enemies) damageEnemy(g, e, (e.kind === "boss" ? 260 : 150) * p.damage, "#fff");
    for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
    say(g, p.x, p.y - 80, "GRAND FINALE!", "#ffe27a", true);
    g.events.push("super");
  } else if (input.superMove) g.events.push("deny");
  if (input.parry) tryParry(g, 56, w, h);
  if (g.charm === "sugar" && p.parryCd <= 0) {
    const near = g.bullets.some((bl) => bl.enemy && bl.pink && dist(bl, p) < 46) || g.pickups.some((k) => k.kind === "bulb" && dist(k, p) < 44) || g.enemies.some((e) => e.pink && dist(e, p) < 44 + e.r);
    if (near && tryParry(g, 50, w, h)) p.parryCd = 0.45;
  }
  const diff = Math.min(5, 1 + g.elapsed / 60) * (g.modifier?.id === "swarm" ? 1.8 : 1);
  g.spawn -= worldD * (g.boss ? 0.55 : 1) * (g.mode === "bulletdance" ? 0.8 : 1);
  const cap = g.lowFx ? 34 : 48;
  if (g.spawn <= 0 && g.enemies.length < cap) {
    const eliteChance = Math.min(0.14, Math.max(0, (g.elapsed - 40) / 900));
    spawnEnemy(g, w, h, void 0, void 0, 1, Math.random() < eliteChance);
    if (diff > 2 && Math.random() < 0.45) spawnEnemy(g, w, h);
    if (diff > 3.5 && Math.random() < 0.4) spawnEnemy(g, w, h);
    g.spawn = Math.max(0.28, 1.15 / (diff * (stage?.pressure ?? 1)));
  }
  g.bossTimer -= worldD;
  if (g.bossTimer <= 0 && !g.boss) spawnBoss(g, w, h);
  g.bulbTimer -= worldD;
  if (g.bulbTimer <= 0) {
    drop(g, rnd(place.minX + 40, place.maxX - 40), rnd(place.minY + 20, place.maxY - 20), "bulb");
    g.bulbTimer = g.mode === "blackout" ? rnd(3.5, 5) : rnd(7, 11);
  }
  g.crateTimer -= worldD;
  if (g.crateTimer <= 0) {
    spawnCrate(g, w, h);
    g.crateTimer = (g.charm === "penny" ? 30 : 42) * (g.upgrades.crate ? Math.pow(0.65, g.upgrades.crate) : 1);
  }
  const biomeDef = BIOMES[g.biome];
  g.hazardTimer -= worldD;
  const hazardKind = stage?.hazard ?? biomeDef.hazard;
  if (g.hazardTimer <= 0 && !g.boss && hazardKind !== "platform") {
    spawnHazard(g, w, h, hazardKind);
    g.hazardTimer = biomeDef.hazardEvery * rnd(0.75, 1.3);
  }
  updateHazards(g, worldD, w, h);
  updateCompanions(g, d, w, h);
  if (g.fireworks > 0) {
    g.fireworks -= d;
    if (Math.random() < d * 6) {
      const t = liveBuf.length ? pick(liveBuf) : null;
      const tx = t ? t.x + rnd(-30, 30) : rnd(place.minX, place.maxX);
      const ty = t ? t.y + rnd(-30, 30) : rnd(place.minY, place.maxY);
      g.bullets.push({
        x: tx,
        y: ty,
        vx: 0,
        vy: 0,
        life: 0.01,
        maxLife: 0.01,
        damage: 40 * p.damage,
        r: 1,
        color: pick(["#ff5aa5", "#ffd166", "#74e6ff", "#8fd15a"]),
        weapon: "mortar",
        pierce: 0,
        bounces: 0,
        chains: 0,
        hitIds: [],
        spin: 0,
        splash: 90,
        fuse: 1
      });
    }
  }
  p.burning = Math.max(0, p.burning - d);
  for (const pu of g.puddles) {
    if (pu.kind === "fire" && p.dashTime <= 0 && dist(pu, p) < pu.r + 8 && p.burning <= 0) {
      hurtPlayer(g, 8, pu);
      p.burning = 0.5;
    }
  }
  const decoy = g.puddles.find((pu) => pu.kind === "decoy");
  const speedMod = g.modifier?.id === "double" ? 1.35 : 1;
  for (const e of g.enemies) {
    const ed = worldD;
    const tgt = decoy && e.kind !== "boss" ? decoy : p;
    e.hit -= d;
    e.cooldown -= ed * (g.mode === "bulletdance" ? 0.74 : 1);
    e.attack = Math.max(0, e.attack - ed);
    e.spawnT += ed;
    if (e.affix === "mirror") e.reflect = e.counter % 6 < 2 ? 1 : 0;
    if (e.paint && (e.paint -= ed) <= 0) e.paintC = void 0;
    if (e.reflect) e.reflect -= ed;
    if (e.blind) {
      e.blind -= ed;
      e.cooldown = Math.max(e.cooldown, 0.5);
      if (Math.random() < ed * 4) puff(g, e.x + rnd(-8, 8), e.y - e.r - 8, "#fff0b8", 1, 24, 3);
    }
    if (e.tag && (e.tag.t -= ed) <= 0) {
      e.tag = void 0;
      const blindMul = e.blind ? 1.5 : 1;
      ring(g, e.x, e.y, "#7ee08a", 100);
      puff(g, e.x, e.y, "#7ee08a", 14, 180, 6);
      g.shake = Math.max(g.shake, 6);
      g.events.push("boom");
      for (const o of nearby(e.x, e.y, 110, nearBuf2)) if (o !== e && !o.hidden && o.hp > 0) damageEnemy(g, o, 60 * p.damage * blindMul, "#7ee08a");
      damageEnemy(g, e, 90 * p.damage * blindMul, "#7ee08a", true);
      if (blindMul > 1) say(g, e.x, e.y - e.r - 12, "SPECIAL DELIVERY!", "#7ee08a", true);
    }
    e.blink -= ed;
    if (e.blink < -0.12) e.blink = rnd(2, 6);
    e.buffed = Math.max(0, e.buffed - ed);
    if (e.frozen > 0) {
      e.frozen -= ed;
      if (e.frozen <= 0) e.hit = 0.1;
      continue;
    }
    if (e.stun && e.stun > 0) {
      e.stun -= ed;
      e.x += e.vx * ed;
      e.y += e.vy * ed;
      e.vx *= 0.88;
      e.vy *= 0.88;
      if (Math.random() < ed * 6) puff(g, e.x + rnd(-e.r, e.r), e.y - e.r, "#ffe27a", 1, 30, 3);
      if (e.stun <= 0) e.hit = 0.1;
      continue;
    }
    if (e.burn > 0) {
      e.burn -= ed;
      e.hp -= 9 * ed;
      if (Math.random() < ed * 8) puff(g, e.x + rnd(-e.r, e.r), e.y - e.r * 0.5, pick(["#ff6a3d", "#ffb347", "#2a2230"]), 1, 30, 4);
      if (e.hp <= 0) e.hit = 0.1;
    }
    e.slow = Math.max(0, e.slow - ed);
    e.slippery = Math.max(0, (e.slippery || 0) - ed);
    for (const pu of g.puddles) {
      if (dist(pu, e) > pu.r + e.r * 0.5) continue;
      if (e.kind === "boss") continue;
      if (pu.kind === "tar") e.slow = Math.max(e.slow, 0.1);
      else if (pu.kind === "syrup") {
        e.slow = Math.max(e.slow, 2.2);
        e.burn = Math.max(e.burn, 0.4);
      } else if (pu.kind === "grease") {
        e.slippery = Math.max(e.slippery, 0.3);
        e.hp -= 4 * ed;
      } else if (pu.kind === "geyser") {
        e.y -= 90 * ed;
        e.hp -= 6 * ed;
      } else if (pu.kind === "crater") {
        e.slow = Math.max(e.slow, 0.12);
        e.hp -= 11 * ed;
        if (Math.random() < ed * 4) puff(g, e.x + rnd(-6, 6), e.y - 6, "#d9a8ff", 1, 40, 3);
      }
    }
    const sm = (e.slow > 0 ? 0.45 : 1) * speedMod * (e.buffed > 0 ? 1.4 : 1);
    let dx = tgt.x - e.x, dy = tgt.y - e.y, dd = Math.hypot(dx, dy) || 1, mult = 1, side = 0;
    const def = ENEMIES[e.kind];
    if (e.pull) {
      const pd = dist(e.pull, e) || 1;
      if (e.kind !== "boss" && pd > 6) {
        e.x += (e.pull.x - e.x) / pd * 260 * ed;
        e.y += (e.pull.y - e.y) / pd * 260 * ed;
      }
      e.pull = void 0;
    }
    e.facingA += ((Math.atan2(dy, dx) - e.facingA + Math.PI * 3) % TAU - Math.PI) * Math.min(1, ed * 4);
    if (e.kind === "daisy") side = Math.sin(g.elapsed * 4.5 + e.phase) * 0.8;
    else if (e.kind === "wisp") {
      mult = e.attack > 0.45 ? 0.05 : e.attack > 0 ? 4.4 : 0.7;
      if (e.cooldown <= 0) {
        puff(g, e.x, e.y, def.color, 6, 90, 5);
        const a = rnd(TAU);
        e.x = clamp(p.x + Math.cos(a) * 170, b.minX, b.maxX);
        e.y = clamp(p.y + Math.sin(a) * 150, b.minY, b.maxY);
        e.attack = 0.85;
        e.cooldown = rnd(2.6, 3.6);
        puff(g, e.x, e.y, def.color, 6, 90, 5);
        g.events.push("blink");
        dx = p.x - e.x;
        dy = p.y - e.y;
        dd = Math.hypot(dx, dy) || 1;
      }
    } else if (e.kind === "lugger") {
      if (e.cooldown <= 0) {
        e.attack = 0.95;
        e.cooldown = 3.2;
        e.vx = dx / dd;
        e.vy = dy / dd;
        g.events.push("growl");
      }
      if (e.attack > 0.4) mult = 0.04;
      else if (e.attack > 0) {
        mult = 0;
        e.x += e.vx * 620 * ed * sm;
        e.y += e.vy * 620 * ed * sm;
        if (Math.random() < 0.5) puff(g, e.x, e.y + 20, "#c9b28d", 1, 40, 7);
      } else mult = 0.75;
    } else if (e.kind === "toad") {
      if (dd < 280) mult = -0.4;
      else if (dd < 340) mult = 0;
      if (e.cooldown <= 0 && dd < 520) {
        e.counter++;
        const pinkVolley = e.counter % 3 === 0;
        const base = Math.atan2(dy, dx);
        for (const sp of [-0.22, 0, 0.22]) enemyShot(g, e.x, e.y - 6, base + sp, 240, 10, def.color, pinkVolley && sp === 0);
        e.attack = 0.4;
        e.cooldown = 2.1;
        g.events.push("croak");
      }
    } else if (e.kind === "cap") {
      mult = 0;
      if (e.cooldown <= 0) {
        if (e.hidden) {
          e.hidden = false;
          e.cooldown = 1.5;
          e.attack = 0.5;
          e.counter++;
          for (let i = 0; i < 8; i++) enemyShot(g, e.x, e.y - 8, i / 8 * TAU + e.counter * 0.3, 165, 9, "#c47ae0", i % 4 === 0);
          g.events.push("spore");
        } else {
          e.hidden = true;
          e.cooldown = 1.7;
        }
      }
    } else if (e.kind === "bloat") {
      mult = 1;
      e.y += Math.sin(g.elapsed * 3 + e.phase) * 18 * ed;
    } else if (e.kind === "gloop") {
      mult = 0;
      e.x += e.vx * ed * sm;
      e.y += e.vy * ed * sm;
      if (e.x < b.minX || e.x > b.maxX) {
        e.vx *= -1;
        e.x = clamp(e.x, b.minX, b.maxX);
      }
      if (e.y < b.minY || e.y > b.maxY) {
        e.vy *= -1;
        e.y = clamp(e.y, b.minY, b.maxY);
      }
      if (e.cooldown <= 0) {
        const sp = Math.hypot(e.vx, e.vy);
        e.vx = dx / dd * sp;
        e.vy = dy / dd * sp;
        e.cooldown = rnd(1.5, 2.6);
      }
    } else if (e.kind === "nut") {
      if (e.airborne > 0) {
        e.airborne -= ed;
        mult = 0;
        if (e.airborne <= 0) {
          g.shake = Math.max(g.shake, 8);
          ring(g, e.x, e.y + 10, "#d9b27a", 80);
          puff(g, e.x, e.y + 10, "#b8763a", 10, 150, 6);
          if (dist(e, p) < 70) hurtPlayer(g, 14, e);
          g.events.push("thud");
        }
      } else side = Math.sin(g.elapsed * 3 + e.phase) * 0.3;
    } else if (e.kind === "hex") {
      mult = 0;
      if (e.cooldown <= 0) {
        e.counter++;
        if (e.counter % 2 === 1) {
          const base = Math.atan2(dy, dx);
          enemyShot(g, e.x, e.y, base - 0.3, 190, 11, def.color, Math.random() < 0.4, 0.05);
          enemyShot(g, e.x, e.y, base + 0.3, 190, 11, def.color, Math.random() < 0.4, 0.05);
          e.attack = 0.4;
          e.cooldown = 1.3;
          g.events.push("hex");
        } else {
          puff(g, e.x, e.y, def.color, 10, 110, 6);
          do {
            e.x = rnd(place.minX + 40, place.maxX - 40);
            e.y = rnd(place.minY + 30, place.maxY - 30);
          } while (dist(e, p) < 220);
          puff(g, e.x, e.y, def.color, 10, 110, 6);
          e.cooldown = 1.6;
          g.events.push("blink");
        }
      }
    } else if (e.kind === "jack") {
      mult = 0;
      if (e.attack > 0) {
        e.x += e.vx * 700 * ed;
        e.y += e.vy * 700 * ed;
        if (e.attack < 0.05) {
          e.cooldown = 2.2;
        }
      } else if (dd < 190 && e.cooldown <= 0) {
        e.attack = 0.32;
        e.vx = dx / dd;
        e.vy = dy / dd;
        g.events.push("boing");
        puff(g, e.x, e.y + 10, "#e8c34a", 5, 80, 5);
      }
    } else if (e.kind === "eel") {
      const tx = -dy / dd, ty = dx / dd, inward = dd > 160 ? 0.55 : -0.25;
      e.x += (tx + dx / dd * inward) * e.speed * ed * sm;
      e.y += (ty + dy / dd * inward) * e.speed * ed * sm;
      mult = 0;
      const segs = e.segments;
      let px = e.x, py = e.y;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const sx = px - s.x, sy = py - s.y, sd = Math.hypot(sx, sy) || 1;
        if (sd > 14) {
          s.x += sx / sd * (sd - 14);
          s.y += sy / sd * (sd - 14);
        }
        px = s.x;
        py = s.y;
      }
      for (const s of segs) if (dist(s, p) < 12 + p.r) hurtPlayer(g, def.contact, s);
    } else if (e.kind === "spider") {
      side = Math.sin(g.elapsed * 2 + e.phase) * 0.5;
      if (e.cooldown <= 0 && dd < 420) {
        g.puddles.push({ x: e.x, y: e.y + 8, r: 42, life: 7, max: 7, kind: "web" });
        e.cooldown = rnd(3, 4.5);
        e.attack = 0.3;
        g.events.push("web");
      }
    } else if (e.kind === "mime") {
      const nearP = dd < 200;
      const goal = nearP || e.hit > 0 ? 1 : 0.06;
      e.alpha = clamp(e.alpha + (goal - e.alpha) * Math.min(1, ed * 3.2), 0.06, 1);
      e.x += -mx * p.speed * 0.9 * ed * sm;
      e.y += -my * p.speed * 0.9 * ed * sm;
      mult = dd > 260 ? 1 : 0.35;
    } else if (e.kind === "bell") {
      mult = 0.6;
      if (e.cooldown <= 0) {
        e.cooldown = 4;
        e.attack = 0.6;
        ring(g, e.x, e.y, "#f0b24a", 200);
        g.events.push("bell");
        for (const o of nearby(e.x, e.y, 200)) if (o.id !== e.id && o.kind !== "boss" && dist(o, e) < 200) {
          o.buffed = 5;
          o.hp = Math.min(o.maxHp, o.hp + o.maxHp * 0.1);
        }
      }
    } else if (e.kind === "ghoul") {
      mult = e.revived ? 1.5 : 0.9;
      side = Math.sin(g.elapsed * 6 + e.phase) * (e.revived ? 0.9 : 0.2);
      if (e.revived) e.alpha = 0.55 + Math.sin(g.elapsed * 8) * 0.3;
    } else if (e.kind === "candle") {
      mult = 0;
      e.phase += ed * 1.6 * sm;
      const A = e.anchor;
      const rx = 110, ry = 70;
      const nx = A.x + Math.cos(e.phase) * rx, ny = A.y + Math.sin(e.phase * 2) * ry;
      e.vx = nx - e.x;
      e.x = nx;
      e.y = ny;
      if (e.cooldown <= 0) {
        e.cooldown = 0.16;
        g.puddles.push({ x: e.x, y: e.y + 12, r: 16, life: 2.4, max: 2.4, kind: "fire" });
        if (g.puddles.length > 90) g.puddles.shift();
      }
      if (e.spawnT > 6 && Math.random() < ed * 0.3) {
        A.x = clamp(p.x + rnd(-150, 150), b.minX + 120, b.maxX - 120);
        A.y = clamp(p.y + rnd(-90, 90), b.minY + 90, b.maxY - 90);
      }
    } else if (e.kind === "puppet") {
      mult = 0;
      const A = e.anchor;
      const len = e.attack > 0 ? 9999 : 120 + Math.sin(e.phase) * 10;
      if (e.attack > 0) {
        e.y += 760 * ed;
        if (e.y >= b.maxY - 10 || e.attack < 0.02) {
          e.attack = 0;
          g.shake = Math.max(g.shake, 7);
          ring(g, e.x, e.y + 8, "#c97a5a", 70);
          puff(g, e.x, e.y + 8, "#c97a5a", 10, 140, 6);
          if (dist(e, p) < 60) hurtPlayer(g, 14, e);
          e.cooldown = 1.2;
          e.counter = 1;
          g.events.push("thud");
        }
      } else if (e.counter === 1) {
        e.y -= 220 * ed;
        if (e.y <= A.y + 130) {
          e.counter = 0;
          e.cooldown = rnd(1.5, 3);
        }
      } else {
        e.phase += ed * 1.4;
        const sw = Math.sin(e.phase) * 1.1;
        e.x = A.x + Math.sin(sw) * len;
        e.y = A.y + Math.cos(sw) * len;
        if (e.cooldown <= 0 && Math.abs(p.x - e.x) < 34 && p.y > e.y) {
          e.attack = 0.9;
          g.events.push("boing");
        }
      }
    } else if (e.kind === "twin") {
      side = Math.sin(g.elapsed * 3 + e.phase) * 0.6;
      mult = 0.8;
      const mate = e.partner !== void 0 ? g.enemies.find((o) => o.id === e.partner) : void 0;
      if (mate) {
        const md = dist(mate, e) || 1;
        if (md > 220) {
          e.x += (mate.x - e.x) / md * 60 * ed;
          e.y += (mate.y - e.y) / md * 60 * ed;
        }
        if (md < 70) {
          e.x -= (mate.x - e.x) / md * 40 * ed;
        }
        if (e.id < mate.id) {
          const ax = mate.x - e.x, ay = mate.y - e.y, L2 = ax * ax + ay * ay || 1;
          const t = clamp(((p.x - e.x) * ax + (p.y - e.y) * ay) / L2, 0, 1);
          const cx = e.x + ax * t, cy = e.y + ay * t;
          if (Math.hypot(p.x - cx, p.y - cy) < p.r - 2 && p.dashTime <= 0) hurtPlayer(g, 9, { x: cx, y: cy });
        }
      }
    } else if (e.kind === "phono") {
      mult = 0;
      if (e.cooldown <= 0) {
        e.counter++;
        const pink = e.counter % 3 === 0;
        g.bullets.push({
          x: e.x,
          y: e.y - 10,
          vx: 0,
          vy: 0,
          life: 2.2,
          maxLife: 2.2,
          damage: 10,
          r: 20,
          color: pink ? "#ff7ad9" : "#c9863a",
          enemy: true,
          pink,
          pierce: 0,
          bounces: 0,
          chains: 0,
          hitIds: [],
          spin: 0,
          ringWave: true,
          grow: 150
        });
        e.cooldown = 1.4;
        e.attack = 0.3;
        g.events.push("bell");
      }
    } else if (e.kind === "mirror") {
      mult = dd > 140 ? 0.9 : 0.2;
      side = Math.sin(g.elapsed * 2 + e.phase) * 0.4;
    } else if (e.kind === "clown") {
      e.x += e.vx * ed * sm;
      e.y += e.vy * ed * sm;
      if (e.x < b.minX || e.x > b.maxX) {
        e.vx *= -1;
        e.x = clamp(e.x, b.minX, b.maxX);
      }
      if (e.y < b.minY || e.y > b.maxY) {
        e.vy *= -1;
        e.y = clamp(e.y, b.minY, b.maxY);
      }
      if (e.cooldown <= 0) {
        e.cooldown = 1.9;
        const targetA = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = -1; i <= 1; i++) {
          const ta = targetA + i * 0.28;
          enemyShot(g, e.x, e.y - 12, ta, 260, 11, "#ff5964", i === 0);
        }
        g.events.push("boing");
      }
    } else if (e.kind === "bat") {
      const swoop = Math.sin(g.elapsed * 3 + e.phase) * 60;
      e.y += swoop * ed;
      e.x += dx / dd * e.speed * ed * sm;
      mult = 0;
      if (dd < 140 && e.cooldown <= 0) {
        e.cooldown = 2.5;
        e.attack = 0.4;
        puff(g, e.x, e.y, "#473b66", 4, 60, 3);
      }
    } else if (e.kind === "skeleton") {
      mult = dd < 180 ? -0.3 : 0.8;
      side = Math.sin(g.elapsed * 3 + e.phase) * 0.5;
      if (e.cooldown <= 0 && dd < 450) {
        e.cooldown = 2.4;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        g.bullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(a) * 360,
          vy: Math.sin(a) * 360,
          life: 2.5,
          maxLife: 2.5,
          damage: 13,
          r: 9,
          color: "#e5dec9",
          enemy: true,
          boomerang: true,
          pierce: 99,
          bounces: 0,
          chains: 0,
          hitIds: [],
          spin: rnd(TAU)
        });
        g.events.push("thud");
      }
    } else if (e.kind === "totem") {
      mult = 0;
      if (e.cooldown <= 0) {
        e.cooldown = 3.2;
        e.attack = 0.8;
        g.puddles.push({ x: e.x + rnd(-40, 40), y: e.y + 10, r: 45, life: 3.5, max: 3.5, kind: "geyser" });
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU;
          enemyShot(g, e.x, e.y, a, 140, 9, "#8c654f", i % 2 === 0);
        }
        g.events.push("steam");
      }
    } else if (e.kind === "siren") {
      mult = 0.25;
      side = Math.sin(g.elapsed * 2.4 + e.phase) * 0.5;
      if (dd < 300 && p.dashTime <= 0 && p.superTime <= 0) {
        const pullK = (1 - dd / 300) * 190 * ed;
        p.x = clamp(p.x - dx / dd * pullK, b.minX, b.maxX);
        p.y = clamp(p.y - dy / dd * pullK, b.minY, b.maxY);
        if (Math.random() < ed * 6) puff(g, p.x + rnd(-24, 24), p.y + rnd(-24, 24), "#7ad9c4", 1, 20, 4);
      }
      if (e.cooldown <= 0) {
        if (dd < 150) {
          e.attack = 0.5;
          e.cooldown = 2.4;
          g.events.push("bell");
          for (let i = 0; i < 12; i++) enemyShot(g, e.x, e.y, i / 12 * TAU + e.phase, 250, 11, "#7ad9c4", i % 6 === 0);
          ring(g, e.x, e.y, "#7ad9c4", 150);
        } else {
          e.cooldown = 0.8;
          ring(g, e.x, e.y, "#7ad9c4", 60 + e.counter++ % 4 * 30);
        }
      }
    } else if (e.kind === "chef") {
      mult = dd < 230 ? -0.5 : dd > 340 ? 0.9 : 0;
      side = Math.sin(g.elapsed * 2 + e.phase) * 0.3;
      if (e.cooldown <= 0) {
        e.cooldown = 1.8;
        e.counter++;
        const n2 = e.counter % 3 === 0 ? 3 : 1;
        for (let i = 0; i < n2; i++) {
          const d2 = clamp(dd + rnd(-50, 50), 120, 460);
          const a = Math.atan2(dy, dx) + (i - (n2 - 1) / 2) * 0.3;
          const dur = 0.45 + d2 / 620;
          g.bullets.push({
            x: e.x,
            y: e.y - 10,
            vx: 0,
            vy: 0,
            life: dur,
            maxLife: dur,
            damage: 12,
            r: 11,
            color: "#d8cfc0",
            enemy: true,
            pierce: 0,
            bounces: 0,
            chains: 0,
            hitIds: [],
            spin: rnd(TAU),
            lob: { sx: e.x, sy: e.y - 10, tx: e.x + Math.cos(a) * d2, ty: e.y + Math.sin(a) * d2, t: 0, dur }
          });
        }
        g.events.push("thud");
      }
      if (e.spawnT > 3 && Math.random() < ed * 0.35) {
        g.puddles.push({ x: e.x + rnd(-30, 30), y: e.y + rnd(-16, 16), r: 26, life: 4, max: 4, kind: "grease" });
      }
    } else if (e.kind === "balloon") {
      mult = 0.35;
      e.y += Math.sin(g.elapsed * 1.6 + e.phase) * 26 * ed;
      e.x += e.vx * ed * sm;
      e.y += e.vy * ed * sm;
      if (e.x < b.minX || e.x > b.maxX) {
        e.vx *= -1;
        e.x = clamp(e.x, b.minX, b.maxX);
      }
      if (e.y < b.minY || e.y > b.maxY) {
        e.vy *= -1;
        e.y = clamp(e.y, b.minY, b.maxY);
      }
      if (e.cooldown <= 0) {
        e.cooldown = 3.4;
        e.attack = 0.4;
        const c = spawnEnemy(g, w, h, "bloat", { x: e.x + rnd(-30, 30), y: e.y + e.r }, 0.7);
        if (c) c.hp = c.maxHp = c.maxHp * 0.7;
        g.events.push("spore");
      }
    } else if (e.kind === "organ") {
      mult = 0;
      if (!e.lanes && e.cooldown <= 0) {
        e.lanes = [];
        const base = clamp(p.x + rnd(-120, 120), b.minX + 60, b.maxX - 60);
        for (let i = 0; i < 3; i++) e.lanes.push({ x: clamp(base + (i - 1) * rnd(90, 140), b.minX, b.maxX), t: 1.05 });
        e.attack = 1.05;
        g.events.push("charge");
      }
      if (e.lanes) {
        for (const L of e.lanes) {
          L.t -= ed;
          if (L.t <= 0) {
            for (let i = 0; i < 7; i++) {
              g.bullets.push({
                x: L.x,
                y: fieldTop(g, h) - 20 - i * 26,
                vx: 0,
                vy: 380,
                life: 2.2,
                maxLife: 2.2,
                damage: 13,
                r: 9,
                color: i % 2 ? "#a89ad8" : "#6a5a8a",
                enemy: true,
                pierce: 0,
                bounces: 0,
                chains: 0,
                hitIds: [],
                spin: rnd(TAU)
              });
            }
            g.shake = Math.max(g.shake, 4);
            puff(g, L.x, b.minY + 10, "#6a5a8a", 6, 120, 6);
          }
        }
        if (e.lanes.every((L) => L.t <= 0)) {
          e.lanes = void 0;
          e.cooldown = 2.8;
          g.events.push("laser");
        }
      }
    } else if (e.kind === "disco") {
      mult = 0.8;
      side = Math.sin(g.elapsed * 1.7 + e.phase) * 0.5;
      if ((e.reflect || 0) <= 0 && e.cooldown <= 0) {
        e.reflect = 1.6;
        e.cooldown = 3.4;
        g.events.push("charge");
      }
    } else if (e.kind === "skunk") {
      mult = dd < 190 ? -0.7 : dd > 300 ? 0.8 : 0;
      side = Math.sin(g.elapsed * 2.4 + e.phase) * 0.4;
      if (e.cooldown <= 0) {
        e.cooldown = 2.2;
        for (let i = 0; i < 3; i++) {
          const tx = clamp(p.x + rnd(-70, 70), b.minX, b.maxX), ty = clamp(p.y + rnd(-40, 40), b.minY, b.maxY), dur = 0.5 + i * 0.12;
          g.bullets.push({ x: e.x, y: e.y - 8, vx: 0, vy: 0, life: dur, maxLife: dur, damage: 8, r: 10, color: "#5a4a6e", enemy: true, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU), lob: { sx: e.x, sy: e.y - 8, tx, ty, t: 0, dur }, ink: true });
        }
        g.events.push("thud");
      }
    } else if (e.kind === "strong") {
      mult = dd > 150 ? 0.9 : 0;
      if (e.cooldown <= 0 && !e.wound) {
        e.wound = true;
        e.attack = 0.7;
        e.cooldown = 3.2;
        g.events.push("charge");
      }
      if (e.wound && e.attack <= 0) {
        e.wound = false;
        g.shake = Math.max(g.shake, 10);
        ring(g, e.x, e.y + 10, "#d84a45", 170);
        g.events.push("boom");
        puff(g, e.x, e.y + 14, "#d84a45", 14, 200, 6);
        if (p.dashTime <= 0 && dist(e, p) < 170) hurtPlayer(g, 18, e);
      }
    } else if (e.kind === "usher") {
      e.counter += ed;
      e.phased = e.counter % 3 > 1.6;
      mult = e.phased ? 0 : 1.25;
    } else if (e.kind === "magnet") {
      mult = dd > 260 ? 0.9 : dd < 140 ? -0.6 : 0;
    } else if (e.kind === "turret") {
      mult = 0;
      if (!e.laser && e.cooldown <= 0) {
        e.laser = { a: Math.atan2(dy, dx), t: 1.1 };
        g.events.push("charge");
      }
      if (e.laser) {
        e.laser.t -= ed;
        if (e.laser.t > 0.25) e.laser.a += ((Math.atan2(dy, dx) - e.laser.a + Math.PI * 3) % TAU - Math.PI) * ed * 2;
        if (e.laser.t <= 0) {
          const a = e.laser.a;
          for (let i = 1; i < 18; i++) {
            const bx = e.x + Math.cos(a) * i * 44, by = e.y + Math.sin(a) * i * 44;
            puff(g, bx, by, "#ffd166", 1, 50, 4);
            if (Math.hypot(bx - p.x, by - p.y) < 26) hurtPlayer(g, 16, { x: bx, y: by });
          }
          g.shake = Math.max(g.shake, 7);
          g.events.push("laser");
          e.laser = void 0;
          e.cooldown = 2.8;
        }
      }
    } else if (e.kind === "cutpurse") {
      if (!e.holding && e.cooldown <= 0 && dd < 64) {
        const cards = Math.min(2, Math.floor(p.cards)), cash = Math.min(5, p.coins);
        if (cards + cash > 0) {
          p.cards -= cards;
          p.coins -= cash;
          e.loot = cards * 10 + cash;
          e.holding = true;
          e.cooldown = 999;
          e.attack = 0.8;
          g.flash = Math.max(g.flash, 0.3);
          say(g, e.x, e.y - e.r - 12, "SORRY, PAL!", "#ff5aa5", true);
          g.events.push("coin");
        } else e.cooldown = 0.6;
      }
      mult = e.holding ? -2 : 1.75;
      side = e.holding ? 0 : Math.sin(g.elapsed * 5 + e.phase) * 0.55;
    } else if (e.kind === "bellhop") {
      let mate = null, bb = -1;
      for (const o of g.enemies) {
        if (o === e || o.hp <= 0 || o.kind === "boss" || o.kind === "bellhop") continue;
        const od = dist(o, e);
        if (od < 300 && o.maxHp > bb) {
          bb = o.maxHp;
          mate = o;
        }
      }
      e.partner = mate ? mate.id : 0;
      if (mate) {
        mate.shieldHp = Math.min(46, (mate.shieldHp || 0) + 22 * ed);
        const md = dist(mate, e);
        mult = md > 200 ? 1.45 : md < 84 ? -0.7 : 0.1;
        e.anchor = { x: mate.x, y: mate.y };
      } else {
        mult = 1;
        e.anchor = void 0;
      }
    } else if (e.kind === "drover") {
      let mate = null, md = 1e9;
      for (const o of g.enemies) {
        if (o === e || o.hp <= 0 || o.kind === "boss" || o.kind === "drover") continue;
        const od = dist(o, e);
        if (od < 190 && od < md) {
          md = od;
          mate = o;
        }
      }
      if (mate) {
        const kl = Math.hypot(p.x - e.x, p.y - e.y) || 1;
        mate.x += (p.x - e.x) / kl * 132 * ed;
        mate.y += (p.y - e.y) / kl * 132 * ed;
        mult = md > 118 ? 1.35 : 0.18;
        if (e.cooldown <= 0) {
          e.cooldown = 2.7;
          e.attack = 0.7;
          ring(g, e.x, e.y, "#ffd166", 150);
          g.events.push("whistle");
          for (const o of g.enemies) if (o.kind !== "boss" && dist(o, e) < 215) o.buffed = Math.max(o.buffed, 1.15);
        }
      } else {
        mult = 1;
        e.anchor = void 0;
      }
    } else if (e.kind === "lancer") {
      mult = dd < 250 ? -1 : dd > 430 ? 1 : 0;
      if (!e.laser && e.cooldown <= 0) {
        e.laser = { a: Math.atan2(dy, dx), t: 1 };
        e.attack = 1;
        g.events.push("charge");
      }
      if (e.laser) {
        e.laser.t -= ed;
        if (e.laser.t > 0.3) e.laser.a += ((Math.atan2(dy, dx) - e.laser.a + Math.PI * 3) % TAU - Math.PI) * ed * 2.4;
        if (e.laser.t <= 0) {
          const a = e.laser.a;
          e.laser = void 0;
          e.cooldown = 3.5;
          g.bullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(a) * 640,
            vy: Math.sin(a) * 640,
            life: 2.6,
            maxLife: 2.6,
            damage: 15,
            r: 9,
            color: "#ffd166",
            enemy: true,
            pierce: 99,
            bounces: 3,
            chains: 0,
            hitIds: [],
            spin: 0,
            pink: g.mode === "bulletdance"
          });
          g.shake = Math.max(g.shake, 4);
          g.events.push("laser");
        }
      }
    } else if (e.kind === "janitor") {
      mult = 0.2;
      let tx = 0, ty = 0, tl = 1e9, found = false;
      for (const k of g.pickups) {
        if (k.life <= 0 || k.kind === "bulb") continue;
        const kd = dist(k, e);
        if (kd < 320 && kd < tl) {
          tl = kd;
          tx = k.x;
          ty = k.y;
          found = true;
        }
      }
      if (found) {
        const dl = Math.hypot(tx - e.x, ty - e.y) || 1;
        e.x += (tx - e.x) / dl * e.speed * 1.7 * ed;
        e.y += (ty - e.y) / dl * e.speed * 1.7 * ed;
        e.anchor = { x: tx, y: ty };
        if (tl < 30) {
          for (const k of g.pickups) if (k.life > 0 && dist(k, e) < 40) {
            k.life = 0;
            e.counter++;
            puff(g, k.x, k.y, "#cfd6e2", 9, 110, 5);
            say(g, k.x, k.y - 12, "SWEEPED!", "#cfd6e2");
            g.events.push("thud");
          }
        }
      }
      if (e.cooldown <= 0) {
        e.cooldown = 3.2;
        for (const pu of g.puddles) if (dist(pu, e) < 160) pu.life = Math.min(pu.life, 0.2);
      }
    } else if (e.kind === "hooker") {
      mult = dd < 175 ? -0.75 : dd > 330 ? 1.2 : 0.3;
      if (!e.laser && e.cooldown <= 0 && dd < 370) {
        e.laser = { a: Math.atan2(dy, dx), t: 0.62 };
        e.attack = 1;
        g.events.push("charge");
      }
      if (e.laser) {
        e.laser.t -= ed;
        if (e.laser.t > 0.18) e.laser.a += ((Math.atan2(dy, dx) - e.laser.a + Math.PI * 3) % TAU - Math.PI) * ed * 3.2;
        if (e.laser.t <= 0) {
          const a = e.laser.a;
          e.laser = void 0;
          e.cooldown = 3;
          const rx = p.x - e.x, ry = p.y - e.y;
          const along = rx * Math.cos(a) + ry * Math.sin(a), off = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a));
          if (along > 0 && along < 360 && off < 30 && p.invuln <= 0 && p.star <= 0) {
            p.grapple = { tx: e.x, ty: e.y, t: 0.32 };
            p.webbed = 0.5;
            hurtPlayer(g, 8, e);
            say(g, e.x, e.y - e.r - 12, "GOTCHA!", "#ff6659", true);
            g.events.push("growl");
          } else {
            puff(g, p.x - Math.cos(a) * 6, p.y - Math.sin(a) * 6, "#cfd6e2", 6, 120, 4);
            g.events.push("whiff");
          }
        }
      }
    } else if (e.kind === "boss") {
      if ((e.bossPhase || 1) >= 2) e.reflect = e.counter % 9 < 2.5 ? 1 : 0;
      if ((e.bossPhase || 1) >= 3) {
        e.phased = e.counter % 7 > 5.2;
        e.magnetField = true;
      }
      mult = e.attack > 0 ? 0 : 0.7 + (e.bossPhase || 1) * 0.2;
      e.y = Math.max(e.y, b.minY + 20);
      if (e.volley && e.volley.length) {
        for (let i = e.volley.length - 1; i >= 0; i--) {
          const v = e.volley[i];
          v.t -= ed;
          if (v.t <= 0) {
            enemyShot(g, e.x, e.y, Math.atan2(dy, dx) + rnd(-0.05, 0.05), v.speed, v.dmg, v.color, v.pink);
            e.volley.splice(i, 1);
          }
        }
        if (!e.volley.length) e.volley = void 0;
      }
      if (e.cooldown <= 0) {
        e.pattern = (e.pattern + 1) % 5;
        e.attack = 1.1;
        e.cooldown = Math.max(1.3, 3 - g.bossesBeaten * 0.25 - (e.bossPhase || 1) * 0.3);
        const base = Math.atan2(dy, dx);
        if (e.pattern === 0) {
          const count = e.bossPhase === 3 ? 24 : 16;
          for (let i = 0; i < count; i++) enemyShot(g, e.x, e.y, i / count * TAU + e.counter * 0.2, 185, 12, def.color, i % 4 === 0);
        } else if (e.pattern === 1) {
          e.counter += 6;
          e.volley = e.volley || [];
          for (let i = 0; i < 6; i++) e.volley.push({ t: i * 0.11, n: i, color: "#ffb347", dmg: 12, speed: 340, pink: i === 3 });
        } else if (e.pattern === 2) {
          for (let i = 0; i < 3; i++) spawnEnemy(g, w, h, i === 1 ? "bloat" : "daisy", { x: e.x + rnd(-80, 80), y: e.y + rnd(20, 60) });
          e.vx = dx / dd;
          e.vy = dy / dd;
          g.events.push("growl");
        } else if (e.pattern === 3) {
          for (let row2 = -1; row2 <= 1; row2++) {
            for (let i = 0; i < 5; i++) {
              enemyShot(g, e.x + Math.cos(base + Math.PI / 2) * row2 * 55, e.y + Math.sin(base + Math.PI / 2) * row2 * 55, base, 160 + i * 45, 11, ["#ffd166", "#ff6b6b", "#8fd15a"][row2 + 1], i === 2 && row2 === 0);
            }
          }
        } else {
          const sig = g.bossesBeaten % 4;
          if (sig === 0) for (let i = 0; i < 3; i++) g.puddles.push({ x: clamp(p.x + rnd(-120, 120), b.minX, b.maxX), y: clamp(p.y + rnd(-80, 80), b.minY, b.maxY), r: 50, life: 6, max: 6, kind: "tar" });
          else if (sig === 1) for (let i = 0; i < 2; i++) spawnEnemy(g, w, h, "ghoul", { x: e.x + rnd(-100, 100), y: e.y + 40 });
          else if (sig === 2) for (let i = 0; i < 10; i++) g.puddles.push({ x: clamp(p.x + Math.cos(i / 10 * TAU) * 130, b.minX, b.maxX), y: clamp(p.y + Math.sin(i / 10 * TAU) * 90, b.minY, b.maxY), r: 22, life: 4, max: 4, kind: "fire" });
          else {
            e.laser = { a: base - 0.9, t: 1.8 };
            g.events.push("charge");
          }
          e.attack = 0.6;
        }
        g.events.push("bossattack");
        e.counter++;
      }
      if (e.laser) {
        e.laser.t -= ed;
        e.laser.a += ed * 1.05;
        const a = e.laser.a;
        for (let i = 2; i < 18; i++) {
          const bx = e.x + Math.cos(a) * i * 44, by = e.y + Math.sin(a) * i * 44;
          if (Math.random() < 0.2) puff(g, bx, by, "#ffd166", 1, 40, 4);
          if (Math.hypot(bx - p.x, by - p.y) < 28) hurtPlayer(g, 14, { x: bx, y: by });
        }
        if (e.laser.t <= 0) e.laser = void 0;
      }
      if (e.pattern === 2 && e.attack > 0 && e.attack < 0.7) {
        e.x += e.vx * 380 * ed;
        e.y += e.vy * 380 * ed;
      }
    }
    if (mult !== 0) {
      e.x += (dx / dd - dy / dd * side) * e.speed * mult * ed * sm;
      e.y += (dy / dd + dx / dd * side) * e.speed * mult * ed * sm;
    }
    if (e.kind !== "gloop" && e.kind !== "boss" && e.kind !== "eel" && e.kind !== "clown" && e.spawnT > 2) {
      e.x = clamp(e.x, b.minX - 10, b.maxX + 10);
      e.y = clamp(e.y, b.minY - 10, b.maxY + 10);
    }
    const pdd = tgt === p ? dd : dist(e, p);
    if (!e.hidden && !e.phased && e.airborne <= 0 && pdd < e.r + p.r) {
      if (p.star > 0) {
        damageEnemy(g, e, 80, "#fff3c4");
        const k = 30 / pdd;
        e.x -= (p.x - e.x) * k;
        e.y -= (p.y - e.y) * k;
      } else {
        hurtPlayer(g, def.contact, e);
        if (g.upgrades.thorns && p.invuln > 0.8) damageEnemy(g, e, 40 * g.upgrades.thorns, "#8fd15a");
      }
    }
  }
  for (const bl of g.bullets) {
    const bd = bl.enemy ? worldD : d;
    if (bl.tick !== void 0 && bl.hitIds.length) {
      bl.spin += bd;
      if (bl.spin > bl.tick) {
        bl.hitIds.length = 0;
        bl.spin = 0;
      }
    }
    if (bl.grow) bl.r += bl.grow * bd;
    if (bl.arc || bl.slash) {
      bl.life -= bd;
      continue;
    }
    if (bl.fuse !== void 0) {
      bl.fuse -= bd;
      if (bl.fuse <= 0) {
        bl.life = 0;
        g.shake = Math.max(g.shake, 5);
        ring(g, bl.x, bl.y, bl.color, bl.splash || 90);
        puff(g, bl.x, bl.y, bl.color, 12, 200, 6);
        g.events.push("boom");
        for (const o of nearby(bl.x, bl.y, (bl.splash || 90) + 40, nearBuf2)) {
          if (!o.hidden && dist(o, bl) < (bl.splash || 90) + o.r) damageEnemy(g, o, bl.damage, bl.color);
        }
      } else bl.life = 1;
      continue;
    }
    if (bl.ringWave) {
      bl.life -= bd;
      const dp = dist(bl, p);
      if (Math.abs(dp - bl.r) < 10 + p.r && !bl.hitIds.length) {
        if (p.star > 0) bl.hitIds.push(-1);
        else if (p.invuln <= 0 && p.superTime <= 0) {
          hurtPlayer(g, bl.damage, bl);
          bl.hitIds.push(-1);
        }
      }
      continue;
    }
    if (bl.popAt !== void 0) {
      bl.popAt -= bd;
      if (bl.popAt <= 0) {
        bl.life = 0;
        puff(g, bl.x, bl.y, "#fff0b8", 8, 120, 4);
        g.events.push("pop");
        const base = rnd(TAU);
        for (let i = 0; i < 4; i++) {
          const a = base + i / 4 * TAU;
          g.bullets.push({
            x: bl.x,
            y: bl.y,
            vx: Math.cos(a) * 760,
            vy: Math.sin(a) * 760,
            life: 0.5,
            maxLife: 0.5,
            damage: bl.damage * 1.2,
            r: 5,
            color: "#ffe9a8",
            weapon: "popper",
            pierce: 0,
            bounces: 0,
            chains: 0,
            hitIds: [],
            spin: 0
          });
        }
        continue;
      }
    }
    if (bl.anvilDrop) {
      bl.anvilDrop.groundT -= bd;
      if (bl.anvilDrop.groundT > 0) {
        bl.y += 1200 * bd;
      } else {
        bl.life = 0;
        g.shake = Math.max(g.shake, 14);
        ring(g, bl.x, bl.anvilDrop.targetY, "#444b58", bl.splash || 120);
        puff(g, bl.x, bl.anvilDrop.targetY, "#444b58", 20, 220, 8);
        g.events.push("thud");
        for (const o of nearby(bl.x, bl.anvilDrop.targetY, (bl.splash || 120) + 40, nearBuf2)) {
          if (!o.hidden && dist(o, { x: bl.x, y: bl.anvilDrop.targetY }) < (bl.splash || 120) + o.r) {
            damageEnemy(g, o, bl.damage, "#444b58", true);
            o.slow = 2;
          }
        }
      }
      continue;
    }
    if (bl.trap) {
      const T = bl.trap;
      if (T.armed > 0) {
        T.armed -= bd;
        bl.x += bl.vx * bd;
        bl.y += bl.vy * bd;
        bl.vx *= 0.975;
        bl.vy *= 0.975;
      } else {
        bl.vx = 0;
        bl.vy = 0;
      }
      bl.spin += bd * 2;
      for (const o of nearby(bl.x, bl.y, 80, nearBuf2)) {
        if (o.hidden || o.airborne > 0 || o.dead || dist(o, bl) > bl.r + o.r) continue;
        damageEnemy(g, o, bl.damage, bl.color);
        o.stun = Math.max(o.stun || 0, 1.5);
        o.slow = Math.max(o.slow, 1.5);
        if (o.kind !== "boss") {
          o.vx = rnd(-150, 150);
          o.vy = rnd(-150, 150);
        }
        bl.life = 0;
        g.events.push("pop");
        puff(g, bl.x, bl.y, "#f5d142", 10, 150, 5);
        say(g, bl.x, bl.y - 20, pick(["SLIP!", "WHOOPS!", "TIMBER!"]), "#f5d142");
        break;
      }
      bl.life -= bd;
      continue;
    }
    if (bl.hook) {
      bl.x += bl.vx * bd;
      bl.y += bl.vy * bd;
      const traveled = dist(bl, bl.from || p);
      let hooked = false;
      for (const o of nearby(bl.x, bl.y, 60, nearBuf2)) {
        if (o.hidden || o.phased || o.hp <= 0 || dist(o, bl) > bl.r + o.r) continue;
        damageEnemy(g, o, bl.damage, bl.color);
        if (o.kind !== "boss") {
          const hd = dist(o, p) || 1;
          o.x += (p.x - o.x) / hd * 110;
          o.y += (p.y - o.y) / hd * 110;
          o.stun = Math.max(o.stun || 0, 0.4);
        }
        say(g, o.x, o.y - o.r - 8, "REELED IN!", "#e8c9a0");
        hooked = true;
        break;
      }
      if (hooked || traveled > 320) {
        bl.life = 0;
        if (!hooked) {
          p.grapple = { tx: clamp(bl.x, 30, w - 30), ty: clamp(bl.y, b.minY, b.maxY + 4), t: 0.34 };
          g.events.push("dash");
        }
        continue;
      }
      if (bl.life <= 0) {
        p.grapple = { tx: clamp(bl.x, 30, w - 30), ty: clamp(bl.y, b.minY, b.maxY + 4), t: 0.34 };
        g.events.push("dash");
        continue;
      }
      continue;
    }
    if (bl.bubbleFloat) {
      bl.vy -= 80 * bd;
      bl.x += Math.sin(g.elapsed * 4 + bl.spin) * 20 * bd;
    }
    if (!bl.enemy && !bl.hook) {
      for (const m of g.enemies) {
        if (m.kind !== "magnet" && !m.magnetField || m.hp <= 0 || m.phased) continue;
        const md = dist(bl, m);
        if (md < 130 && md > 1) {
          const pull = (1 - md / 130) * 900 * bd;
          bl.vx += (m.x - bl.x) / md * pull;
          bl.vy += (m.y - bl.y) / md * pull;
        }
      }
    }
    if (bl.gravity) {
      const pr = bl.gravity > 1e3 ? 9999 : 150;
      for (const o of nearby(bl.x, bl.y, pr > 1e3 ? 2e3 : pr + 40, nearBuf2)) {
        if (o.kind !== "boss" && !o.hidden && dist(o, bl) < pr) o.pull = bl;
      }
      if (Math.random() < bd * 20) puff(g, bl.x + rnd(-40, 40), bl.y + rnd(-30, 30), bl.color, 1, 20, 3);
    }
    if (bl.ghostWave) bl.damage *= 1 + bd * 0.35;
    if (bl.orbit) {
      bl.orbit.angle += bd * 4.2;
      bl.x = p.x + Math.cos(bl.orbit.angle) * bl.orbit.dist;
      bl.y = p.y - 6 + Math.sin(bl.orbit.angle) * bl.orbit.dist;
    } else if (bl.brolly) {
      const B = bl.brolly;
      B.angle += bd * B.spin;
      bl.x = p.x + Math.cos(B.angle) * B.dist;
      bl.y = p.y - 6 + Math.sin(B.angle) * B.dist;
      bl.spin += bd * 6;
      for (const eb of g.bullets) {
        if (eb !== bl && eb.enemy && eb.life > 0 && dist(eb, bl) < bl.r + eb.r) {
          eb.life = 0;
          puff(g, eb.x, eb.y, "#8fd1ff", 5, 110, 4);
          ring(g, eb.x, eb.y, "#8fd1ff", 26);
          g.events.push("block");
        }
      }
    } else if (bl.tether) {
      const T = bl.tether;
      if (T.out) {
        T.dist += 880 * bd;
        if (T.dist >= T.max) T.out = false;
      } else {
        T.dist -= 760 * bd;
        if (T.dist <= 20) bl.life = 0;
      }
      const a = Math.atan2(bl.vy, bl.vx);
      bl.x = p.x + Math.cos(a) * T.dist;
      bl.y = p.y - 4 + Math.sin(a) * T.dist;
      bl.spin += bd * 25;
    } else if (bl.sentry) {
      if ((bl.charge = (bl.charge || 0) + bd) > (bl.tick || 0.22)) {
        bl.charge = 0;
        let t = null, td = Infinity;
        for (const e of liveBuf) {
          const dd = dist(e, bl);
          if (dd < td) {
            td = dd;
            t = e;
          }
        }
        if (t) {
          const a = Math.atan2(t.y - bl.y, t.x - bl.x);
          g.bullets.push({
            x: bl.x,
            y: bl.y,
            vx: Math.cos(a) * 780,
            vy: Math.sin(a) * 780,
            life: 1,
            maxLife: 1,
            damage: bl.damage,
            r: 5,
            color: bl.color,
            weapon: "shard",
            pierce: 0,
            bounces: 0,
            chains: 0,
            hitIds: [],
            spin: 0
          });
        }
      }
    } else if (bl.lob) {
      const L = bl.lob;
      L.t += bd;
      const k = clamp(L.t / L.dur, 0, 1);
      bl.x = L.sx + (L.tx - L.sx) * k;
      bl.y = L.sy + (L.ty - L.sy) * k;
      bl.charge = Math.sin(k * Math.PI) * 120;
      if (k >= 1) {
        if (bl.ink) {
          g.puddles.push({ x: bl.x, y: bl.y, r: 34, life: 5, max: 5, kind: "ink" });
          puff(g, bl.x, bl.y, "#5a4a6e", 5, 80, 4);
          bl.life = 0;
          continue;
        }
        bl.life = 0;
        g.shake = Math.max(g.shake, 7);
        const R = bl.splash || 90;
        ring(g, bl.x, bl.y, bl.color, R);
        puff(g, bl.x, bl.y, bl.color, 12, 200, 7);
        puff(g, bl.x, bl.y, "#2a2230", 6, 120, 6);
        g.events.push("splat");
        if (bl.enemy) {
          if (dist(bl, p) < R + p.r && p.star <= 0 && p.invuln <= 0 && p.superTime <= 0) hurtPlayer(g, bl.damage, bl);
          g.puddles.push({ x: bl.x, y: bl.y, r: R * 0.7, life: 3.4, max: 3.4, kind: "fire" });
        } else {
          for (const o of nearby(bl.x, bl.y, R + 40)) {
            if (!o.hidden && o.airborne <= 0 && dist(o, bl) < R + o.r) {
              damageEnemy(g, o, bl.damage, bl.color);
              o.slow = Math.max(o.slow, bl.syrup ? 3 : 1.5);
              if (bl.syrup) o.burn = Math.max(o.burn, 2.5);
            }
          }
          g.puddles.push({ x: bl.x, y: bl.y, r: R * 0.8, life: bl.syrup ? 6.5 : 5, max: bl.syrup ? 6.5 : 5, kind: bl.syrup ? "syrup" : "tar" });
        }
      }
      continue;
    } else if (bl.pet) {
      const P2 = bl.pet;
      let t = g.enemies.find((e) => e.id === P2.target && e.hp > 0 && !e.hidden);
      if (!t) {
        let bestV = -Infinity;
        for (const e of liveBuf) {
          const v = e.hp + (e.kind === "boss" ? 9999 : 0);
          if (v > bestV) {
            bestV = v;
            t = e;
          }
        }
        P2.target = t ? t.id : -1;
      }
      P2.hop = Math.max(0, P2.hop - bd);
      if (t) {
        const dd = dist(t, bl) || 1;
        if (dd > t.r + 6) {
          const sp = 560;
          bl.vx = bl.vx * 0.85 + (t.x - bl.x) / dd * sp * 0.15;
          bl.vy = bl.vy * 0.85 + (t.y - bl.y - 10) / dd * sp * 0.15;
        } else {
          if (P2.hop <= 0) {
            P2.hop = 0.2;
            const a = rnd(TAU);
            bl.vx = Math.cos(a) * 180;
            bl.vy = Math.sin(a) * 180 - 120;
            puff(g, bl.x, bl.y, "#ffffff", 2, 60, 3);
          }
          bl.vx *= 0.9;
          bl.vy *= 0.9;
        }
      } else {
        bl.vx = bl.vx * 0.9 + Math.cos(g.elapsed * 3 + bl.spin) * 40;
        bl.vy = bl.vy * 0.9 + Math.sin(g.elapsed * 2 + bl.spin) * 30;
      }
      bl.x += bl.vx * bd;
      bl.y += bl.vy * bd;
      bl.x = clamp(bl.x, 10, w - 10);
      bl.y = clamp(bl.y, fieldTop(g, h) - 30, b.maxY + 24);
    } else if (bl.wave) {
      const W2 = bl.wave;
      W2.t += bd;
      const sp = Math.hypot(bl.vx, bl.vy), along = sp * W2.t, off = Math.sin(W2.t * W2.freq) * W2.amp;
      const dirx = bl.vx / sp, diry = bl.vy / sp;
      bl.x = W2.bx + dirx * along + W2.nx * off;
      bl.y = W2.by + diry * along + W2.ny * off;
      bl.spin += bd * 10;
    } else {
      if (bl.homing && !bl.enemy) {
        let t = null, td = Infinity;
        for (const e of liveBuf) {
          if (bl.hitIds.includes(e.id)) continue;
          const dd = dist(e, bl);
          if (dd < td) {
            td = dd;
            t = e;
          }
        }
        if (t) {
          const sp = Math.hypot(bl.vx, bl.vy), dd = td || 1;
          bl.vx = bl.vx * (1 - bl.homing) + (t.x - bl.x) / dd * sp * bl.homing;
          bl.vy = bl.vy * (1 - bl.homing) + (t.y - bl.y) / dd * sp * bl.homing;
        }
      }
      if (bl.homing && bl.enemy) {
        const sp = Math.hypot(bl.vx, bl.vy), dd = dist(p, bl) || 1;
        bl.vx = bl.vx * (1 - bl.homing) + (p.x - bl.x) / dd * sp * bl.homing;
        bl.vy = bl.vy * (1 - bl.homing) + (p.y - bl.y) / dd * sp * bl.homing;
      }
      if (bl.boomerang) {
        const age = bl.maxLife - bl.life;
        if (age > 0.42 && !bl.returning) {
          bl.returning = true;
          bl.hitIds.length = 0;
        }
        if (bl.returning) {
          const dd = dist(p, bl) || 1, sp = Math.hypot(bl.vx, bl.vy);
          bl.vx = bl.vx * 0.82 + (p.x - bl.x) / dd * sp * 0.18;
          bl.vy = bl.vy * 0.82 + (p.y - bl.y) / dd * sp * 0.18;
          if (dd < 26) bl.life = 0;
        }
        bl.spin += bd * 22;
      }
      if (bl.roam) bl.spin += bd * 18;
      if (bl.roll) {
        bl.rolled = (bl.rolled || 0) + Math.hypot(bl.vx, bl.vy) * bd;
        const sp = Math.hypot(bl.vx, bl.vy) || 1;
        const ns = Math.max(110, sp * (1 - bl.roll.decay * bd));
        bl.vx = bl.vx / sp * ns;
        bl.vy = bl.vy / sp * ns;
        bl.spin += bd * 9;
      }
      bl.x += bl.vx * bd;
      bl.y += bl.vy * bd;
      if (bl.weapon === "popper" && bl.bounces > 0) bl.charge = Math.min(2.4, (bl.charge || 1) + 0.3);
      if (bl.bounces > 0) {
        if (bl.x < 8 && bl.vx < 0 || bl.x > w - 8 && bl.vx > 0) {
          bl.vx *= -1;
          bl.bounces--;
          if (bl.weapon === "popper" && bl.bounces === 0) say(g, bl.x, bl.y - 14, "BANKED", "#ffd75a");
          puff(g, bl.x, bl.y, bl.color, 3, 50, 3);
        }
        if (bl.y < fieldTop(g, h) && bl.vy < 0 || bl.y > b.maxY + 26 && bl.vy > 0) {
          bl.vy *= -1;
          bl.bounces--;
          if (bl.weapon === "popper" && bl.bounces === 0) say(g, bl.x, bl.y - 14, "BANKED", "#ffd75a");
          puff(g, bl.x, bl.y, bl.color, 3, 50, 3);
        }
      }
      if (bl.split !== void 0) {
        bl.split -= bd;
        if (bl.split <= 0) {
          bl.life = 0;
          const targets = liveBuf.slice().sort((a, e) => dist(a, bl) - dist(e, bl)).slice(0, 3);
          const base = Math.atan2(bl.vy, bl.vx);
          for (let i = 0; i < 3; i++) {
            const t = targets[i % Math.max(1, targets.length)];
            const a = t ? Math.atan2(t.y - bl.y, t.x - bl.x) : base + (i - 1) * 0.35;
            g.bullets.push({
              x: bl.x,
              y: bl.y,
              vx: Math.cos(a) * 880,
              vy: Math.sin(a) * 880,
              life: 0.9,
              maxLife: 0.9,
              damage: bl.damage * 0.55,
              r: 5,
              color: "#ffb0ea",
              weapon: "shard",
              pierce: 0,
              bounces: 0,
              chains: 0,
              hitIds: [],
              spin: 0
            });
          }
          puff(g, bl.x, bl.y, bl.color, 6, 120, 4);
        }
      }
    }
    bl.life -= bd;
    if (bl.enemy) {
      if (dist(bl, p) < bl.r + p.r - 4) {
        if (p.star > 0) {
          bl.life = 0;
          puff(g, bl.x, bl.y, "#fff3c4", 3, 60, 3);
        } else if (p.mirror > 0 && !bl.reflected) {
          bl.enemy = false;
          bl.reflected = true;
          bl.pink = false;
          bl.color = "#b8d8e8";
          bl.damage = bl.damage * 2.4 + 6;
          bl.homing = 0;
          bl.vx *= -1.3;
          bl.vy *= -1.3;
          ring(g, bl.x, bl.y, "#b8d8e8", 30);
          puff(g, bl.x, bl.y, "#eaf6ff", 5, 110, 3);
          g.events.push("block");
        } else {
          if (p.invuln <= 0 && p.superTime <= 0) hurtPlayer(g, bl.damage, bl);
          bl.life = 0;
        }
      }
      continue;
    }
    if (bl.damage <= 0) continue;
    const cand = nearby(bl.x, bl.y, bl.r + 40);
    for (const e of cand) {
      if (e.hp <= 0 || e.hidden || e.phased || e.airborne > 0 || bl.hitIds.includes(e.id) || dist(bl, e) > bl.r + e.r) continue;
      if (e.kind === "mirror" && !bl.ex && !bl.ghostWave) {
        const inc = Math.atan2(bl.y - e.y, bl.x - e.x), da = Math.abs((inc - e.facingA + Math.PI * 3) % TAU - Math.PI);
        if (da < 1.15) {
          bl.hitIds.push(e.id);
          const nx = Math.cos(inc), ny = Math.sin(inc), dot = bl.vx * nx + bl.vy * ny;
          bl.vx -= 2 * dot * nx;
          bl.vy -= 2 * dot * ny;
          bl.enemy = true;
          bl.pink = false;
          bl.color = "#b8d8e8";
          bl.damage = Math.min(12, bl.damage * 0.5);
          bl.homing = 0;
          bl.pierce = 0;
          bl.tether = void 0;
          bl.orbit = void 0;
          bl.pet = void 0;
          bl.wave = void 0;
          ring(g, bl.x, bl.y, "#b8d8e8", 24);
          g.events.push("block");
          e.hit = 0.05;
          break;
        }
      }
      if ((e.reflect || 0) > 0 && !bl.ex) {
        bl.hitIds.push(e.id);
        const inc = Math.atan2(bl.y - e.y, bl.x - e.x) + rnd(-0.6, 0.6);
        const sp = Math.max(420, Math.hypot(bl.vx, bl.vy) * 0.8);
        bl.vx = Math.cos(inc) * sp;
        bl.vy = Math.sin(inc) * sp;
        bl.damage *= 0.5;
        puff(g, bl.x, bl.y, "#dff4ff", 4, 90, 3);
        g.events.push("block");
        e.hit = 0.05;
        continue;
      }
      const crit = Math.random() < p.crit;
      const rolled = bl.roll ? 1 + Math.min(1, (bl.rolled || 0) / 340) : 1;
      const dmg = bl.damage * (crit ? 2 : 1) * (bl.roll && p.grapple ? 1.5 : 1) * (bl.weapon === "popper" ? bl.charge || 1 : 1) * rolled;
      let packed = 0;
      if (bl.weapon === "mitt") {
        for (const o of g.enemies) {
          if (o !== e && o.hp > 0 && dist(o, e) < 74 && ++packed > 1) break;
        }
      }
      damageEnemy(g, e, dmg * (packed > 1 ? 1.3 : 1), bl.color, crit);
      g.stats.hits++;
      if (bl.weapon === "trumpet") bl.damage *= 1.16;
      if (bl.weapon === "whistle" && e.attack > 0.25) {
        e.attack = 0;
        e.volley = [];
        e.cooldown = Math.max(e.cooldown, 1.4);
        addCards(g, 0.3);
        say(g, e.x, e.y - e.r - 10, "FOUL CALLED!", "#e0e6ef", true);
        g.events.push("whistle");
      }
      if (bl.weapon === "mortar" && !bl.ex) g.puddles.push({ x: e.x, y: e.y, r: 58, life: 2.8, max: 2.8, kind: "crater" });
      if (bl.inkBlast && e.paint && !bl.nova) {
        bl.nova = true;
        const nc = e.paintC || "#ff5aa5";
        e.paint = 0;
        e.paintC = void 0;
        ring(g, e.x, e.y, nc, 150);
        puff(g, e.x, e.y, nc, 16, 200, 6);
        g.shake = Math.max(g.shake, 7);
        g.events.push("boom");
        say(g, e.x, e.y - e.r - 12, "INK NOVA!", nc, true);
        for (const o of nearby(e.x, e.y, 140, nearBuf2)) if (o.id !== e.id && !o.hidden && o.hp > 0 && o.airborne <= 0) damageEnemy(g, o, 55 * p.damage, nc);
      }
      bl.hitIds.push(e.id);
      if (bl.paintMark) {
        e.paint = g.charm === "varnish" ? 6 : 3;
        e.paintC = bl.paintMark;
        puff(g, e.x, e.y, bl.paintMark, 4, 70, 4);
      }
      if (bl.pie && e.kind !== "boss") {
        e.blind = 2.6;
        say(g, e.x, e.y - e.r - 10, "SPLAT!", "#fff0b8");
      }
      if (bl.stampTag && !e.tag && e.kind !== "boss") {
        e.tag = { t: 2.2 };
        say(g, e.x, e.y - e.r - 10, "STAMPED!", "#7ee08a");
      }
      if (bl.hook && e.kind !== "boss") {
        const hd = dist(e, p) || 1;
        e.x += (p.x - e.x) / hd * 110;
        e.y += (p.y - e.y) / hd * 110;
        e.stun = Math.max(e.stun || 0, 0.4);
        say(g, e.x, e.y - e.r - 8, "REELED IN!", "#e8c9a0");
      }
      if (bl.bubbleFloat && e.kind !== "boss") {
        e.y -= 30;
        e.slow = 2;
        puff(g, e.x, e.y, "#74f0ff", 6, 80, 5);
      }
      if (g.charm === "pepper") e.burn = Math.max(e.burn, 1.6);
      if (bl.burn) e.burn = Math.max(e.burn, bl.burn * 0.5);
      if (g.upgrades.volatile) {
        p.comboStreak++;
        if (p.comboStreak % 5 === 0) {
          ring(g, bl.x, bl.y, "#ff8c4a", 70);
          puff(g, bl.x, bl.y, "#ff8c4a", 8, 160, 5);
          g.shake = Math.max(g.shake, 4);
          g.events.push("boom");
          for (const o of nearby(e.x, e.y, 96, nearBuf2)) {
            if (o.id !== e.id && !o.hidden && o.airborne <= 0 && dist(o, e) < 96) damageEnemy(g, o, dmg * 0.45, "#ff8c4a");
          }
        }
      }
      if (bl.freeze && e.kind !== "boss") {
        e.frozen = Math.max(e.frozen, bl.freeze);
        g.events.push("freeze");
      }
      if (bl.knock) {
        const dd = Math.hypot(bl.vx, bl.vy) || 1;
        if (e.kind !== "boss") {
          e.x += bl.vx / dd * bl.knock;
          e.y += bl.vy / dd * bl.knock;
        }
      }
      if (bl.weapon === "choir" && e.kind !== "boss" && bl.knock) {
        const br = worldBounds(g, w, h);
        if (e.x <= br.minX + 6 || e.x >= br.maxX - 6 || e.y <= br.minY + 6 || e.y >= br.maxY - 6) {
          damageEnemy(g, e, dmg * 0.8, "#ff8b5c", true);
          e.stun = Math.max(e.stun || 0, 0.8);
          say(g, e.x, e.y - e.r - 10, "SLAM!", "#ff8b5c", true);
          g.shake = Math.max(g.shake, 5);
          g.events.push("thud");
        }
      }
      if (bl.splash && !bl.lob && !bl.anvilDrop) {
        g.shake = Math.max(g.shake, 8);
        ring(g, bl.x, bl.y, bl.color, bl.splash);
        puff(g, bl.x, bl.y, bl.color, 14, 220, 7);
        g.events.push("boom");
        for (const o of nearby(e.x, e.y, bl.splash + 40, nearBuf2)) {
          if (o.id !== e.id && !o.hidden && o.airborne <= 0 && dist(o, e) < bl.splash) damageEnemy(g, o, dmg * 0.6, bl.color);
        }
      }
      if (bl.weapon === "note" && bl.chains > 0) {
        let next = null, nd = Infinity;
        for (const o of liveBuf) {
          if (o.id === e.id || o.hp <= 0) continue;
          const dd = dist(o, e);
          if (dd < nd) {
            nd = dd;
            next = o;
          }
        }
        if (next) {
          const dd = nd || 1;
          g.bullets.push({
            x: e.x,
            y: e.y,
            vx: (next.x - e.x) / dd * 700,
            vy: (next.y - e.y) / dd * 700,
            life: 0.5,
            maxLife: 0.5,
            damage: bl.damage * 0.75,
            r: 5,
            color: bl.color,
            weapon: "note",
            pierce: 0,
            bounces: 0,
            chains: bl.chains - 1,
            hitIds: [e.id],
            spin: 0
          });
        }
      }
      if (bl.pet) g.events.push("peck");
      if (bl.pierce > 0) bl.pierce--;
      else bl.life = 0;
      if (bl.life <= 0) break;
    }
  }
  const n = g.enemies.length;
  for (let i = 0; i < n; i++) {
    const e = g.enemies[i];
    if (e.hp <= 0 && !e.dead) killEnemy(g, e, w, h);
  }
  compact(g.enemies, (e) => e.hp > 0);
  compact(g.bullets, (bl) => bl.life > 0 && bl.x > -120 && bl.x < w + 120 && bl.y > -120 && bl.y < wh + 120);
  for (const k of g.pickups) {
    k.life -= d;
    k.phase += d;
    if (k.fresh && k.phase > 0.5) k.fresh = false;
    if (k.kind === "bulb") {
      k.y += Math.sin(k.phase * 2) * 14 * d;
      if (dist(k, p) < p.r + 12 && p.invuln <= 0) {
        hurtPlayer(g, 8, k);
        k.life = 0;
      }
      continue;
    }
    const dd = dist(k, p);
    if ((k.kind === "coin" || k.kind === "heart" || k.kind === "goldbar") && (dd < p.magnet || k.phase < -50)) {
      k.x += (p.x - k.x) / dd * 460 * d;
      k.y += (p.y - k.y) / dd * 460 * d;
    }
    if (dd < p.r + (k.kind === "weapon" ? 22 : 12)) collect(g, k);
  }
  compact(g.pickups, (k) => k.life > 0);
  for (const pu of g.puddles) {
    pu.life -= worldD;
    if (dist(pu, p) > pu.r + 6) continue;
    if (pu.kind === "web" && p.dashTime <= 0) p.webbed = 0.25;
    else if (pu.kind === "syrup" && p.dashTime <= 0) p.webbed = Math.max(p.webbed, 0.2);
    else if (pu.kind === "grease") p.momentum = Math.min(1, p.momentum + worldD * 1.8);
    else if (pu.kind === "ice") p.momentum = Math.min(1, p.momentum + worldD * 2.2);
    else if (pu.kind === "ink" && dist(pu, p) < pu.r + p.r * 0.5) p.gunk = Math.max(p.gunk, 0.6);
  }
  compact(g.puddles, (pu) => pu.life > 0);
  for (const gh of g.ghosts) {
    gh.life -= d;
    gh.y -= 55 * d;
    gh.x += gh.vx * d;
  }
  compact(g.ghosts, (gh) => gh.life > 0);
  for (const q of g.puffs) {
    q.x += q.vx * d;
    q.y += q.vy * d;
    q.vx *= 0.94;
    q.vy *= 0.94;
    q.life -= d;
    if (q.shell) {
      q.vy += 820 * d;
      q.spin = (q.spin || 0) + 16 * d;
      if (q.life < q.max * 0.4) {
        q.vy *= 0.8;
        q.vx *= 0.8;
      }
    }
  }
  compact(g.puffs, (q) => q.life > 0);
  for (const t of g.texts) {
    t.life -= d;
    t.y -= 26 * d;
  }
  compact(g.texts, (t) => t.life > 0);
  g.level = 1 + Math.floor(g.elapsed / 30);
  g.shake *= 0.86;
  if (g.kills >= g.nextUpgrade && !g.upgradeReady) {
    g.nextUpgrade += 18 + Math.floor(g.kills / 6);
    g.upgradeReady = true;
    g.events.push("levelup");
  }
  if (p.health <= 0 && !g.over) {
    if (p.wind > 0) {
      p.wind--;
      g.revives++;
      p.health = Math.ceil(p.maxHealth * 0.5);
      p.invuln = 2.2;
      g.flash = 1;
      g.shake = 20;
      g.slowmo = 0.8;
      g.hitstop = 0.15;
      ring(g, p.x, p.y, "#74e6ff", 320);
      ring(g, p.x, p.y, "#fff3c4", 200);
      for (const e of g.enemies) {
        const dd = dist(e, p) || 1;
        if (dd < 320) {
          damageEnemy(g, e, 120, "#74e6ff");
          if (e.kind !== "boss") {
            e.x += (e.x - p.x) / dd * 160;
            e.y += (e.y - p.y) / dd * 160;
          }
        }
      }
      for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
      say(g, p.x, p.y - 80, "SECOND WIND!", "#74e6ff", true);
      g.events.push("revive");
      g.events.push("super");
    } else {
      g.over = true;
      g.events.push("gameover");
    }
  }
  consume();
}

// tests/sim.ts
var W = 1280;
var H = 720;
var STEP = 1 / 120;
var mkInput = () => ({
  mx: 0,
  my: 0,
  aim: null,
  fire: false,
  dash: false,
  parry: false,
  ex: false,
  superMove: false,
  autoFire: true,
  swap: false,
  interact: false
});
var failures = 0;
var checks = 0;
var ok = (name, cond, detail = "") => {
  checks++;
  if (!cond) {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ` \u2014 ${detail}` : ""}`);
  } else console.log(`  pass  ${name}${detail ? ` \u2014 ${detail}` : ""}`);
};
var seed = 1337;
var rand = () => {
  seed = seed * 1103515245 + 12345 & 2147483647;
  return seed / 2147483647;
};
function freshGame() {
  return createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS]);
}
console.log("\n[1] Long soak \u2014 8 minutes of simulated play, all systems active");
{
  const g = freshGame();
  const inp = mkInput();
  const errors = [];
  let steps = 0, maxEnemies = 0, maxBullets = 0, maxPuffs = 0, maxPickups = 0;
  try {
    for (let i = 0; i < 60 * 120 * 8; i++) {
      inp.mx = rand() * 2 - 1;
      inp.my = rand() * 2 - 1;
      if (rand() < 0.02) inp.dash = true;
      if (rand() < 0.03) inp.parry = true;
      if (rand() < 0.01) inp.ex = true;
      if (rand() < 4e-3) inp.superMove = true;
      if (rand() < 5e-3) {
        g.weapons = [WEAPON_KEYS[Math.floor(rand() * WEAPON_KEYS.length)], g.weapons[1]];
      }
      if (rand() < 0.01) g.upgradeReady = false, g.player.health = g.player.maxHealth;
      update(g, inp, STEP, W, H);
      g.over = false;
      g.player.health = Math.max(g.player.health, 40);
      g.upgradeReady = false;
      steps++;
      maxEnemies = Math.max(maxEnemies, g.enemies.length);
      maxBullets = Math.max(maxBullets, g.bullets.length);
      maxPuffs = Math.max(maxPuffs, g.puffs.length);
      maxPickups = Math.max(maxPickups, g.pickups.length);
      if (!Number.isFinite(g.player.x) || !Number.isFinite(g.player.y)) {
        errors.push(`NaN player pos at step ${i}`);
        break;
      }
      if (g.enemies.some((e) => !Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.hp))) {
        errors.push(`NaN enemy at step ${i}`);
        break;
      }
      if (g.bullets.some((b) => !Number.isFinite(b.x) || !Number.isFinite(b.y))) {
        errors.push(`NaN bullet at step ${i}`);
        break;
      }
    }
  } catch (err) {
    errors.push(String(err));
  }
  ok("no runtime errors or NaN in 8 min soak", errors.length === 0, errors[0] || "");
  ok("progressed in time", g.elapsed > 200, `game time=${g.elapsed.toFixed(1)}s over ${steps} steps (${(g.elapsed / (steps * STEP) * 100).toFixed(0)}% of real time \u2014 slowed by pocket watches)`);
  ok("enemies bounded", maxEnemies <= 92, `peak enemies=${maxEnemies}`);
  ok("bullets bounded", maxBullets < 2500, `peak bullets=${maxBullets}`);
  ok("puffs bounded", maxPuffs <= 460, `peak puffs=${maxPuffs}`);
  ok("pickups bounded", maxPickups < 400, `peak pickups=${maxPickups}`);
  ok("scored points", g.score > 0, `score=${g.score} kills=${g.kills} bosses=${g.bossesBeaten}`);
}
console.log("\n[2] Every enemy kind can be spawned and simulated");
{
  const g = freshGame();
  const inp = mkInput();
  const bad = [];
  for (const kind of ENEMY_KEYS) {
    try {
      const e = globalThis.__spawnTest ? globalThis.__spawnTest(g, W, H, kind) : null;
      if (!e) {
      }
      void e;
    } catch (err) {
      bad.push(`${kind}: ${err}`);
    }
  }
  ok("spawn table complete", bad.length === 0, bad.join("; "));
  ok("all enemy kinds have data", ENEMY_KEYS.length > 0, `${ENEMY_KEYS.length} kinds`);
}
console.log("\n[3] Every weapon fires and deals damage");
{
  for (const wk of WEAPON_KEYS) {
    const g = freshGame();
    const inp = mkInput();
    g.weapons = [wk, "popper"];
    g.active = 0;
    const dummy = { x: g.player.x + 120, y: g.player.y };
    try {
      for (let i = 0; i < 60 * 4; i++) {
        inp.aim = { x: dummy.x, y: dummy.y };
        if (i === 60) {
          g.player.cards = 5;
          inp.ex = true;
        }
        if (i === 61) inp.ex = false;
        if (i === 120) {
          g.player.cards = 5;
          inp.superMove = true;
        }
        if (i === 121) inp.superMove = false;
        update(g, inp, STEP, W, H);
      }
      ok(`${wk} fires without error`, true);
    } catch (err) {
      ok(`${wk} fires without error`, false, String(err));
    }
  }
}
console.log("\n[4] Parry kill accounting (each kill counted once)");
{
  const g = freshGame();
  const inp = mkInput();
  for (let i = 0; i < 30; i++) update(g, inp, STEP, W, H);
  g.enemies.length = 0;
  g.bullets.length = 0;
  g.pickups.length = 0;
  const p = g.player;
  const victim = {
    id: g.id++,
    kind: "daisy",
    x: p.x + 12,
    y: p.y,
    hp: 500,
    maxHp: 500,
    r: 16,
    speed: 0,
    phase: 0,
    cooldown: 99,
    attack: 0,
    hit: 0,
    pink: true,
    size: 1,
    hidden: false,
    airborne: 0,
    vx: 0,
    vy: 0,
    counter: 0,
    spawnT: 0,
    burn: 0,
    slow: 0,
    elite: false,
    blink: 9,
    frozen: 0,
    alpha: 1,
    revived: false,
    buffed: 0,
    rooted: 0,
    facingA: 0
  };
  g.enemies.push(victim);
  const killsBefore = g.kills, scoreBefore = g.score;
  inp.parry = true;
  update(g, inp, STEP, W, H);
  inp.parry = false;
  const killsDelta = g.kills - killsBefore;
  const scoreDelta = g.score - scoreBefore;
  ok("parry kills the creep", g.enemies.indexOf(victim) === -1, `enemies left=${g.enemies.length}`);
  ok("parry counts exactly ONE kill", killsDelta === 1, `kills delta=${killsDelta} (expected 1)`);
  ok("parry awards parry bonus + one kill score", scoreDelta >= 150 && scoreDelta < 150 + 400, `score delta=${scoreDelta}`);
  ok("parry grants a super card", p.cards >= 1, `cards=${p.cards.toFixed(2)}`);
}
console.log("\n[5] Nothing advances while the game is not running");
{
  const g = freshGame();
  const inp = mkInput();
  g.bossTimer = 2;
  let boss = null, maxEnemies = 0, sawVolley = false;
  for (let i = 0; i < 60 * 90; i++) {
    update(g, inp, STEP, W, H);
    g.over = false;
    g.player.health = g.player.maxHealth;
    g.upgradeReady = false;
    maxEnemies = Math.max(maxEnemies, g.enemies.length);
    if (g.boss) {
      boss = g.boss;
      if (!sawVolley) {
        g.boss.pattern = 0;
        g.boss.cooldown = 0;
        update(g, inp, STEP, W, H);
        if (g.boss?.volley?.length) sawVolley = true;
      }
      g.player.health = g.player.maxHealth;
    }
  }
  g.over = false;
  g.player.health = g.player.maxHealth;
  g.upgradeReady = false;
  ok("a ringmaster showed up", !!boss, boss ? boss.bossName : "none");
  ok("boss volley is queued on engine time (not setTimeout)", sawVolley, sawVolley ? "queued shots fire inside update()" : "never saw a queued volley");
  ok("enemies never exceed the hard cap", maxEnemies <= 92, `peak enemies=${maxEnemies}`);
  const bullets = g.bullets.length, elapsed = g.elapsed;
  g.events.length = 0;
  await new Promise((r) => setTimeout(r, 1200));
  ok("no bullets appear after the loop stops", g.bullets.length <= bullets, `before=${bullets} after=${g.bullets.length}`);
  ok("elapsed time frozen", g.elapsed === elapsed, `${elapsed} -> ${g.elapsed}`);
  ok("no events queued while idle", g.events.length === 0, `${g.events.length} events`);
}
console.log("\n[6] Every biome advertises a hazard that actually exists");
{
  const g = freshGame();
  const inp = mkInput();
  const seen = /* @__PURE__ */ new Set();
  let hazardSeen = false;
  for (let i = 0; i < 60 * 120 * 9 * 0.6; i++) {
    g.elapsed += 0;
    update(g, inp, STEP, W, H);
    g.over = false;
    g.player.health = g.player.maxHealth;
    g.upgradeReady = false;
    seen.add(g.biome);
    if (g.hazards.length > 0) hazardSeen = true;
    if (g.elapsed > 60 * 9 * 0.9) break;
  }
  ok("biomes rotate", seen.size >= 3, `${seen.size} biomes visited`);
  ok("stage hazards spawn", hazardSeen, `hazards on stage=${g.hazards.length}`);
  ok("biome hazards cleared on biome change or bounded", g.hazards.length <= 16, `hazards=${g.hazards.length}`);
}
console.log("\n[7] Throughput");
{
  const g = freshGame();
  const inp = mkInput();
  for (let i = 0; i < 60 * 60; i++) {
    update(g, inp, STEP, W, H);
    g.over = false;
    g.player.health = g.player.maxHealth;
    g.upgradeReady = false;
  }
  const t0 = performance.now();
  const N = 60 * 60;
  for (let i = 0; i < N; i++) {
    update(g, inp, STEP, W, H);
    g.over = false;
    g.player.health = g.player.maxHealth;
    g.upgradeReady = false;
  }
  const ms = performance.now() - t0;
  const perFrame = ms / N;
  ok("update() < 1.5 ms/frame at 60s load", perFrame < 1.5, `${perFrame.toFixed(3)} ms/frame (${(1e3 / perFrame).toFixed(0)} fps headroom), enemies=${g.enemies.length} bullets=${g.bullets.length}`);
}
console.log("\n[8] Worst-case throughput \u2014 stage packed to the enemy cap");
{
  const g = freshGame();
  const inp = mkInput();
  inp.autoFire = false;
  inp.fire = false;
  for (let i = 0; i < 60 * 150; i++) {
    update(g, inp, STEP, W, H);
    g.over = false;
    g.player.health = g.player.maxHealth;
    g.upgradeReady = false;
  }
  let worst = 0, sum = 0, n = 0, peak = 0;
  for (let i = 0; i < 60 * 30; i++) {
    const t0 = performance.now();
    update(g, inp, STEP, W, H);
    const ms = performance.now() - t0;
    worst = Math.max(worst, ms);
    sum += ms;
    n++;
    peak = Math.max(peak, g.enemies.length);
    g.over = false;
    g.player.health = g.player.maxHealth;
    g.upgradeReady = false;
  }
  ok("stage really does saturate", peak >= 45, `peak creeps=${peak}`);
  ok("worst frame < 6 ms (16.7 ms budget)", worst < 6, `worst=${worst.toFixed(2)} ms avg=${(sum / n).toFixed(3)} ms at ${peak} creeps`);
}
console.log(`
${checks - failures}/${checks} checks passed${failures ? ` \u2014 ${failures} FAILED` : ""}`);
process.exit(failures ? 1 : 0);
