# HADE — Ten New Modes

*Ten "encore bill" modes, one per mechanic axis. None of them reuse a system your existing 14 modes already own.*

Design constraints honored: no escort, no timer pressure, no kill quota, no capture-and-hold, no "+X% difficulty" scaling, no inverted controls. Every mode is legal in one sentence.

---

## The axis map (proof of uniqueness)

| # | Mode | The mechanic it introduces | Nearest existing mode & why it's different |
|---|---|---|---|
| 1 | **CASH OR BURN** | Unbanked score you choose to lock in | HUSH pays double on parries — passive payout. This makes *quitting* the skill. |
| 2 | **GUMPTION & CO.** | One resource pool: health = ammo = money | GLASS CANNON fixes HP at 1. This makes HP a *budget you spend on shooting*. |
| 3 | **SECOND TAKE** | Your own replayed past as friendly units | INK TORNADO / BLACKOUT never touch time. You are the only "enemy" here. |
| 4 | **PROP DEPARTMENT** | You place hazards, not the stage | HAZARDS are currently always hostile & pre-placed. This hands them to the player. |
| 5 | **CASTING CALL** | Hidden enemy data revealed *permanently* by play | WANTED marks a target visibly. Here the info is hidden until you earn it, and it persists. |
| 6 | **CANNONBALL** | Damage is your velocity, guns are recoil | GHOST SHOW removes weapons for stealth. This removes gun *damage* and keeps physics. |
| 7 | **THE CHEAP SEATS** | An NPC audience with opinions about your play | Nothing in the roster punishes *turtling*. This is the only "boredom" pressure. |
| 8 | **ONE MAN BAND** | Whole roster fires at once, chaining EX loads | No mode currently rewards *weapon count*; the card system only ever swaps you toward one. |
| 9 | **THE UNDERSTUDY** | Possession — you play an enemy's moveset | Companions (hounds/bees) are pets. This is you, wearing a creep. |
| 10 | **THE CROSSROADS** | Subtractive upgrades + one boon unlocked for real | REAP & RENEW and SPEED DEMON *give* stats. This takes them away and lets you keep one. |

---

## 1. CASH OR BURN

**EVERY POINT IS UNSAFE UNTIL YOU BANK IT. STAND STILL AND GET GREEDY.**

**Core mechanic.** All score during a run accrues into a live "take" rather than `g.score`, with a cash-out multiplier that climbs +0.06/s from ×1.00 toward a ×3.00 cap. Any time, hold **G** for a 2.5-second channel *while standing still* to bank the take — that banked total is permanent, the take resets to zero, and the multiplier starts climbing again. Taking any damage while unbanked burns the entire take. A run ends with whatever you banked.

**Why it's fun.** The single most addictive emotion in gambling is not winning, it's *quitting while ahead* — and this mode is the only one in the game that punishes you for one more kill. The channel requires stillness in a bullet-hell, so banking becomes its own dodge-puzzle: you're reading a gap in the fire and deciding whether the gap is worth the take.

**Weapon synergies.** *Jackpot Slots* is the patron saint here — its random bursts and coin payouts already feel like a casino, and coins are the only thing that survive a burn, so it hedges your bets. *Brolly Basher* and *Soap Gun* are the bankers' tools: deflect and float-trap buy you the 2.5 seconds of safety a channel needs. *Hookshot Cane* is the panic button (get out, re-enter, channel). *Ink Fountain* is a trap — 5 damage at 48 ms feels great until it flatters you into staying one second longer.

**Boon/charm hooks.** Gold Tooth (+1 coin per 5 banked) and Lucky Penny (+40% score) become premier picks because they scale on the *banked* column, not the raw one. Parry Sugar (auto-parry nearby) is the "one more kill" insurance policy.

**Difficulty: ★★★☆☆** — forgiving to learn (you can bank constantly at ×1.00), and skill is expressed purely in how much you're willing to lose.

---

## 2. GUMPTION & CO.

**HEALTH, AMMO AND MONEY ARE THE SAME NUMBER. EVERY SHOT COSTS A DROP.**

**Core mechanic.** One pool, the **purse**, starting at 100. Firing costs 1¢ per projectile (so *Marquee Trio* costs 3, *Gravel Choir*'s six-pellet cone costs 6), a melee swing costs 3¢, an EX costs 12¢, a Super costs 5 cards *or* 40¢. Creeps pay back 2–6¢ per kill; a successful parry refunds 8¢ and grants cards free. Take damage and you lose 25¢. Purse at zero is the curtain.

**Why it's fun.** Every shot becomes a risk/reward calculation in real time, and the reward loop is *aggression* — the only way to afford to keep shooting is to keep killing. Standing still and plinking is a slow suicide; a good player's purse grows for the first twenty seconds and they feel it. It also makes the shop genuinely agonizing, because every boon you buy is max gumption you just spent.

**Weapon synergies.** This mode is a love letter to high-alpha weapons: *Dropping Anvil* (85 damage, 1100 ms) costs one cent and buys the whole screen; *Moon Mortar*, *Sugar Shard* and *Storm Harp* all pay off per-shot. It's a death sentence for stream weapons — *Ink Fountain* and *Brass Boombox* will bankrupt you in four seconds, which is exactly the kind of reversal that makes a mode talkable. *Cream Pie* and *Slapstick Peels* are the budget control options: no damage-per-second, but you never pay for a wasted bullet into a gap.

**Boon/charm hooks.** Sweet Swat (parries heal) becomes parries *pay*; Card Shark is the best defensive stat in the game; Steel Thimble's shield pip is worth more than any damage boon. Tin Umbrella is a pure buyback of one mistake.

**Difficulty: ★★★★☆** — but it self-balances: a struggling player who shoots less literally dies less.

---

## 3. SECOND TAKE

**TEN SECONDS AGO YOU WERE GREAT. KEEP PLAYING, PAST-YOU.**

**Core mechanic.** The engine already records `p.trail`; extend it into a 10-second ring buffer of position + aim + fire events. Every 10 seconds a **stunt double** spawns and replays exactly what you did during that window — same path, same aim, same weapon, same shot timing. Up to three doubles can be alive, so by mid-run you are fighting in a four-person phalanx of your own recent history. Doubles are invulnerable and cannot be targeted.

**Why it's fun.** You stop thinking about your next shot and start *choreographing* your last one — dashing left now means a better crossfire in ten seconds, which is the closest a solo shooter gets to being an action director. The "IN SYNCH" bonus (×1.5 damage when your live fire overlaps a double's lane) makes spatial rhyming a real skill: good players deliberately walk in shapes.

**Weapon synergies.** *Marquee Trio* is the headline — three beams that converge at *the cursor*, so four converging points from four ghosts turns the arena into a laser lattice you set up by walking. *Pepper Popper*'s ricochets stack beautifully (a wall you fired at ten seconds ago is still bouncing), and *Ghost Trumpet*'s growing piercing wave plus *Squeezebox*'s sine weave fill the space your ghosts leave behind. *Rubber Yo-Yo*'s tether mows down whatever your doubles knock loose. Skip *Dropping Anvil* and *Moon Mortar* friendly fire on your own ghosts — or make doubles immune, which is the cheap fix.

**Boon/charm hooks.** Quick Fingers and Double Trouble multiply across every ghost for free, so this mode makes the rate-based build feel earned rather than greedy. Metronome crits land harder because four ghosts fire on the same rhythm you set.

**Difficulty: ★★★☆☆** — power-positive, but the mental load of planning ahead is where the ceiling lives.

---

## 4. THE PROP DEPARTMENT

**DON'T PICK IT UP — PLANT IT. THE STAGE IS YOURS TO RIG.**

**Core mechanic.** Power-ups never auto-collect. They land as **props**, you pick one up and hold it, and **E** plants it (0.8 s to arm, then it waits for contact). *Pocket Watch* slows everything in 220 px for 5 s; *Grease Bucket* becomes a 190 px slip-rink that sends creeps sliding; *Roman Candle* fires rockets at anything that enters; *Funhouse Mirror* auto-parries every bullet crossing it, making it a wall you can build. Dashing *past* an armed prop kick-starts it early for a ×1.5 trigger bonus.

**Why it's fun.** It flips the arena from something that happens to you into something you do to them, and it turns every wave into a little heist-planning problem: where will they funnel, what will I leave there? Props also make an excellent pacing toy — you can hold one for a full wave and save it for a boss, which is a genuinely new decision in this game.

**Weapon synergies.** *Magnet Mitt* exists purely to set up props: yank the crowd into a pile, let the Roman Candle do the arithmetic. *Tar Lobber*, *Syrup Slinger* and *Referee Whistle* all *slow or stop* creeps, which is the difference between a trap that grazes one gloop and a trap that eats a wave. *Soap Gun* is the comedic crown jewel — float a creep over your grease rink and drop it into the anvil-sized *Fat TNT* you buried there. *Slapstick Peels* is the only "weapon" that duplicates the mechanic, so it becomes the cheap crowd-control lane filler.

**Boon/charm hooks.** Prize Hound (crates more often) and Lucky Penny (crates sooner) become trap-density stats. Scavenger turns every kill into more prop stock.

**Difficulty: ★★★☆☆**

---

## 5. CASTING CALL

**EVERY CREEP HAS A TYPE THAT BREAKS IT. YOU LEARN IT BY TRYING — THEN YOU NEVER FORGET.**

**Core mechanic.** Each creep secretly carries one of five damage types: **BLUNT** (anvil, kettle, choir), **SHARP** (popper, quill, shard), **COLD** (frost), **HOT** (fountain, pepper burns), **SOUND** (boombox, harp, kazoo, trumpet). The wrong type deals 40% damage with no feedback at all; the right type deals ×2.5 and throws a title card — and from then on *every creep of that species in the run shows its type above its head*. Knowledge is the progression. Elites and bosses stay hidden until you parry one of their shots, which reveals them.

**Why it's fun.** It converts 34 weapons from a ranking into a toolbox, and it makes the *Tab* key (weapon swap, currently the most underused input in the game) a core verb. Because reveals persist for the run, the mode has a real emotional arc: the first minute is a guessing game, minute five you're a director who knows the whole cast, and you finish feeling like an expert rather than a survivor.

**Weapon synergies.** *Storm Harp* is the ideal probe — instant arc, no travel time, and it hits a cone, so one strum tests three creeps. *Polka Paint* is the mode's best friend: its +35% mark multiplies with a revealed weakness rather than replacing it, and *Wet Varnish* (50%, double duration) is the strongest charm per dollar here. *Cream Pie* blinds — a blind creep stumbles and, with a small tell I'd add, exposes its type. *Frost Bugle*'s freeze-then-shatter already doubles damage, so COLD is the "obvious" type and should be weighted rarer.

**Difficulty: ★★★☆☆** — deceptively approachable, because a new player still kills everything at 40%, they just score worse. Nothing about being bad here feels unfair; being *good* is what's loud.

---

## 6. CANNONBALL

**GUNS DEAL NOTHING. YOUR BODY IS THE ORDNANCE — SPEED IS DAMAGE.**

**Core mechanic.** Bullets deal 0 damage; they deal **recoil**. Every shot shoves you backwards in proportion to its own power stat, and damage to creeps is computed from your velocity at the moment of contact (roughly `0.5 · v² · 1e-4`, tuned so a max dash-through kills a gloop). Bounce off a wall and your next collision lands at ×2 with a "BANK!" card. Being flung by knockback, a tar explosion, or a hazard jet counts exactly like a dash — the whole game becomes pinball where you're the ball.

**Why it's fun.** It inverts the deepest instinct in the game: you stop aiming at creeps and start aiming at *walls*, floors, and other people's explosions. Every entry into a crowd is a stunt with a whoosh attached, and the highlight clips write themselves ("I recoil-jumped off my own shotgun blast into a boss").

**Weapon synergies.** *Gravel Choir* becomes a shotgun-started rocket jump — a six-pellet knockback cone fired at a floor is a launchpad. *Hookshot Cane* is the mandatory mobility piece (its "reels you in" *is* the damage dealer here). *Brolly Basher* is the control weapon: deflecting a bullet mid-flight gives you a free ricochet and your ×2 setup. *Brass Boombox*'s bass rings and *Thunder Kettle*'s Radial Blast EX are self-cannons — point them at the ground. *Magnet Mitt* is the finisher, because pulling every creep into one point means any sloppy bounce still connects. *Dropping Anvil*'s shockwave is the best launcher in the game and the reason to keep heavy weapons.

**Boon/charm hooks.** Tap Shoes (dashing hurts in a wide arc) is a free build. Lucky Star — *invincible for 6 seconds, bump creeps to pop them* — is already this mode's rule compressed into a power-up, so promote it to a burst button. Greased Heels and Winged Soles scale damage directly.

**Difficulty: ★★★★★** — offer it with a "REHEARSAL" toggle that doubles bounce windows for the first two biomes. High ceiling, genuinely hard floor, so put it last on the bill.

---

## 7. THE CHEAP SEATS

**THE CROWD IS ALIVE, IT HAS OPINIONS, AND IT IS THROWING THINGS.**

**Core mechanic.** A **hype meter** (0–100) is the real health bar of the mode. Parries +8, multi-kills +5 per creep, EX +12, freeze-then-shatter +6, hitting a creep with a hazard +7. Turtling: standing still −10/s, hiding behind scenery −4/s, not firing for a full second −6/s. Above 80 the crowd throws coins (score ×1.5, free power-up every 15 s); below 25 they throw **tomatoes** — slow homing *pink* projectiles, which means the way out of a bad review is a parry, which pays +20 and starts the loop again.

**Why it's fun.** It's the only mode in the game that says *style is the objective*, and the only one that punishes playing scared — a pressure no other mechanic in the roster applies. The tomato loop is the genius bit: a drowning player's rescue is the game's most skill-expressive verb (parry), so the bottom of the curve *teaches* instead of punishing, and a comeback from a booing room is the most theatrical feeling available.

**Weapon synergies.** Loud, visual weapons are literally the damage build: *Popcorn Popper*'s delayed burst, *Crank Siren*'s spiral dance, *Hive Kazoo*'s bee swarm and *Jackpot Slots*' spinning reels all read as "bits" and should be given hidden hype bonuses (I'd add `hype: n` to WeaponDef). *Marquee Trio*'s spotlight beams and *Ghost Trumpet*'s swelling wave score on spectacle. *Syrup Slinger* and *Frost Bugle* are risky — slow is boring to a crowd — but *Storm Harp*'s screen-wide EX is an instant ovation, so control weapons want to be *payoff*, not the plan.

**Boon/charm hooks.** Showman's Flair (combo score bonuses +50%) is the marquee boon; the existing combo milestones at 10/25/50/100 already shout "STANDING OVATION", so reuse that voice for hype breaks.

**Difficulty: ★★☆☆☆** — the friendliest mode here, deliberately: it's the one a player falls in love with first.

---

## 8. ONE MAN BAND

**PLAY EVERY INSTRUMENT AT ONCE. EACH ONE LOADS THE NEXT.**

**Core mechanic.** Your entire acquired roster fires simultaneously at 45% individual rate. Every shot fired with weapon *n* adds a **load** to weapon *n+1* (in acquisition order, wrapping); a loaded weapon's next hit detonates its EX **for free**, no cards spent. A four-weapon build is a four-beat arrangement: popper loads mortar, mortar loads harp, harp loads frost, frost loads popper, forever.

**Why it's fun.** The card system currently pushes you toward one weapon and treats the rest as waste; this mode inverts that so *collecting more* is the win condition, and it turns build planning into composition — the joy is realizing your junk weapon is the metronome that feeds a screen-clearing *Thunderclap* every 3 seconds. It also makes run-to-run variety enormous from one small rule, because your picks matter more than your luck.

**Weapon synergies.** Fast, weak fillers get promoted: *Ink Fountain* (rate 48 ms) is a load-generator of absurd efficiency, *Hive Kazoo* and *Blue Note* same. Heavy EXs become the payoff — *Moon Mortar*'s Kablooey, *Dropping Anvil*'s Ten-Ton Stampede, *Referee Whistle*'s "stops time itself for three full seconds" Final Whistle are the headliners you keep feeding. *Squeezebox* and *Marquee Trio* give the whole stage crossfire while you cycle. *Thunder Kettle*'s hold-to-charge fights the auto-fire rule, so auto-charge it to 60% in this mode only.

**Boon/charm hooks.** Double Trouble and Quick Fingers now apply across *every* weapon, so this is the mode where rate builds finally feel as strong as alpha builds. Card Shark matters less here, which is a healthy inversion — EX no longer wants your meter.

**Difficulty: ★★☆☆☆** — power fantasy on purpose. Its ceiling is build theory, not fingers.

---

## 9. THE UNDERSTUDY

**PARRY ONTO A CREEP AND WEAR IT. THE CREEP IS YOUR GUN NOW.**

**Core mechanic.** A parry performed within 60 px of a non-elite creep hurls your soul into it. In a host you keep your aim and your fire button, gain that species' HP, radius and speed, and its signature attack becomes your EX; the rest of the crowd ignores you completely for the duration. You cannot dash, shield, or open the shop while worn. When the host dies you eject — 1 card lost, 2 seconds of vulnerability at the spot you entered — and your real body is exposed the whole time, so possession is *never* free safety.

**Why it's fun.** It's the only mode that lets you use the enemy's joke against them: play the *Siren* and make the crowd dance, ride a *Gloop* through its own bounce pattern, use a *Totem*'s summon order to flood the room with things that think you're on their side. And because being a creep teaches you its tell from the *inside*, the mode makes you measurably better at the base game — which is why players requeue it.

**Weapon synergies.** Your guns are idle while hosting, so the build question becomes *what do I want to find*: *Magnet Mitt* drags a shooter next to you so you can hijack it, *Soap Gun* floats a creep in place long enough to land a close parry, *Slapstick Peels* and *Referee Whistle* stun a target so the 60 px parry window is honest. *Inkwell Quill*'s point-blank meter gain is the fastest route to a parry you can aim. *Postage Stamp* is the eject button: stick a bomb on the body you're about to vacate.

**Difficulty: ★★★★☆** — the rule that keeps it fair: **elites and bosses are immune**, so the mode never gives you their best toys, and you never lose a run inside a host's body.

---

## 10. THE CROSSROADS

**EVERY GIFT TAKES SOMETHING AWAY. ONE OF THEM FOLLOWS YOU HOME.**

**Core mechanic.** At each level-up you get the normal card choice **or** the Devil's offer: ×1.6 all damage, permanently, in exchange for something concrete and random from your kit — a weapon, dash, parry, a charm slot, 30% of max gumption, or access to Porbo's shop for the rest of the run. Take up to five. If you took three or more and survived to stage five, then at the curtain you pick **one** of your taken offers to unlock for every future Crossroads run (write it to the existing `UNLOCK_KEY` localStorage record, scoped to the mode).

**Why it's fun.** Subtractive choice is the most replayable structure a roguelite has, because it converts power into identity — "I beat it without dash" is a sentence players want to say out loud. The permanent unlock gives the grinding something to aim at, and scoping it to the mode means it never pollutes your normal build.

**Weapon synergies.** Losing your best weapon is the point, so this mode rewards *adaptable* picks: *Pepper Popper* (starter, pierce + ricochet, works everywhere) and *Gravel Choir* (self-sufficient at close range) are safe anchors when everything else is being pruned away. Losing parry makes *Brolly Basher* and *Tin Umbrella* the compensation; losing dash makes *Hookshot Cane* and *Second Wind* non-negotiable. Losing the shop is the scariest offer, which is why the "House Special" should also grant +40% coin drops — a trade, not a tax.

**Boon/charm hooks.** This is the one mode where the charm slot can vanish, so I'd make the Devil's offers *never* remove a charm you picked pre-run — only the ones acquired mid-run.

**Difficulty: ★★★★☆** — variable by design; the player sets it by how many deals they take. That's the cleanest skill-expression lever in the whole document.

---

## Implementation appendix

Everything above is a small diff against the plumbing I read. Per mode:

1. `src/game/types.ts:21` — extend the `Mode` union with the id (`"cashout"`, `"purse"`, `"takes"`, `"props"`, `"casting"`, `"cannonball"`, `"seats"`, `"band"`, `"understudy"`, `"crossroads"`), and add 3–6 mode-state fields to `GameState` beside `lightR`/`stalkerId`.
2. `src/game/engine.ts:24–36` — one line in the intro table (`title`, `sub`, `life`) for the title card.
3. `src/App.tsx:61` — one entry in `MODES` with `group: "show"` (the Encore bill).
4. Behaviour: 1–4 guarded branches on `g.mode ===` in `engine.ts` (update), `combat.ts` (damage gate — the `CENTER STAGE` line in `combat.ts:15` is the exact one-line pattern to copy), and `render.ts:1101` (visual pass). There are only 18 such branches today, so this stays readable.
5. Tests: add a `[n]` block to `tests/features.test.ts` (5–8 assertions, `sim.ts` drives it headless) and one "all draws" case in `render.test.ts`.
6. `npm run build` after every change — the root `index.html` is the shipped artifact, so a source edit without a rebuild ships nothing.

Cheapest three to build first: **CASH OR BURN** (no new renderer work), **CASTING CALL** (one field on the enemy + a title card), **THE CHEAP SEATS** (one meter, one new pickup reuse). Most expensive: **CANNONBALL** (recoil on every weapon path) and **THE UNDERSTUDY** (a player controller per species).

## Two notes on your current build

- The shipped repo already contains **LAST CALL DELIVERY** (`delivery`) and **TAKE THE FLOOR** (`territory`) — an escort mission and a zone-capture mode. Both are on your "avoid" list. I designed around them, but you may want to cut them; `.tmp_variety.py`, still in the repo root, is the leftover patch script that added them.
- **BULLET DANCE**, **REAP & RENEW**, **SPEED DEMON** and **INK TORNADO** are on your keep-list but are *not* `Mode` entries in this build — the nearest thing is the `pink` **PINK PANIC** *modifier* in `data.ts`. I avoided all four axes regardless, on the assumption you have a newer build; if those four are still unimplemented, tell me and I'll design replacements for the freed-up axes.
- The `protect` mode is **"PROJECTOR NIGHT"** (defend a projector) in code, not **"REAP & RENEW"** as your list calls it. Worth reconciling before I write any code.

## A note on the map (this is not a mode)

Modes live in `MODES`; the *shape* of the world does not. The run walks one of four
authored maps — `THE WHOLE SHOW` (33 hand-placed stages), `THE STRIP` (the top row),
`PORBO'S ALLEY` (one dense screen) or `ONE SCREEN` (the original arena) — chosen in
**Options → THE MAP**, which can be changed mid-run. Difficulty still runs on the clock, so a mode's
goal (survive, clear the wave, dance, blackout) is unaffected by which map you picked.
