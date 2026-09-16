# Rubber Requiem

An endless 1930s rubber-hose run-and-gun, rendered in hand-inked Canvas2D with a WebGL post pass.
Built on [`poadon087-droid/hedde`](https://github.com/poadon087-droid/hedde) and extended: more weapons, creeps, stages, shaders, characters — same identity.

**37 weapons · 40 creeps + boss · 56 hand-authored stages in one continuous map · 5 art styles · 5 playable stars · 13 charms · 22 boons**

## Play it

The root **`index.html` is the whole game** — one self-contained file, no server or network needed for the game itself. Open it in a browser, or serve it:

```bash
npm install
npm run build     # typecheck + bundle + refresh index.html
npm run preview   # vite preview on :4173
```

## Develop

```bash
npm run dev       # vite dev server — open /dev.html
npm test          # 3 headless harnesses: sim, features, render (322 checks)
npm run perf      # frame-budget probe at light/medium/heavy load
npm run check:browser  # the Chromium tools (needs `npm run preview` on :4173) — see tools/browser/README.md
npm run check     # tsc + test + build in one go
```

## Controls

| Action | Keys |
| --- | --- |
| Move | WASD / arrows (+ left thumb-stick on touch, left stick on gamepad) |
| Aim / fire | Mouse / hold F (touch: the AIM · FIRE stick — drag to aim, it fires while held; AUTO toggle for auto-fire) |
| Dash | Shift / L |
| Parry | Space / K (right-click) |
| EX move (spends 1 card) | E / J |
| Super (spends 5 cards) | Q / I |
| Swap weapon | Tab / R |
| Talk to shopkeeper | T / G (B peeks at the ledger mid-run, no walking required) |
| Pause | Esc / P (auto-pauses when the tab hides, and every held key is released) |
| Rebind | any of the above, in OPTIONS → CONTROLS — with a RESET KEYS TO DEFAULT escape hatch |
| Gamepad | left stick move · right stick aim · A dash · X parry · Y EX · B super · LB swap · RB/RT fire · Back shop · Start pause (hot-plug, detected mid-run) |

Rebinding is validated: one key can only belong to one action, an action can never end up with no
key (it is handed a free one), and a hand-edited `localStorage` entry cannot strand a control.

Every visual knob lives in **HOW TO PLAY → OPTIONS**: map size, master / music / SFX mix, screen-shake amount, four colour grades, speed lines, a colourblind-safe danger cue (pink becomes cyan), fullscreen, and per-action key rebinding. Best scores are stored per mode as well as overall.

## The stage

The map is **authored, not tiled**. `src/game/world.ts` holds 56 stages, and each one was placed by
hand: its name, its act number, which art set it borrows, what the light and weather feel like
(`mood`), what stands on the boards (`props` — 318 hand-positioned pieces: water towers, billboards,
laundry lines, minecarts, bonfires, top hats, fountains, arches, waterwheels, scaffolds, obelisks,
a ferris wheel, boilers with twitching gauges, curtains of chains), what you can jump on (`ledges`,
which become real platforms), how hard it pushes (`pressure`), and — for eleven of them — a hazard
that is *not* the art set's usual one.

The shape is deliberate too. The slab is stepped **12 / 11 / 10 / 11 / 12 screens** across five rows —
a vault floor of drowned bells, and under it the boiler dark of the foundation — so the
world has an outline: rows are offset so no two screens that touch share an act, every screen is
reachable by walking, and the ends of the undercroft are dead ends you can see — the camera leaks a
quarter of a screen past a row so the torn ink margin and the plank signage are on screen. Doorways
name the stage on the other side. Walking into the margin is a wall, not a fall.

Difficulty still runs on the clock, not on where you stand: wander off and come back, the act waits.
Everything that spawns — creeps, hazards, crates, bulbs, weather — is placed inside the camera's
window and never in a void cell, and the chevron on the screen edge points at the nearest creep with
its distance, so a map this size never hides anything from you.

**Options → THE MAP** switches live, mid-run included:

| map | what it is |
| --- | --- |
| `THE WHOLE SHOW · 56 HAND-Laid STAGES` | the authored slab, default: five rows walked as a snake down to the vaults and the boiler dark |
| `THE STRIP · ROOFTOPS ONLY · 12` | the top row on its own, walked east |
| `PORBO'S ALLEY · SMALL & DENSE` | one screen, ten props, two ledges, a shopfront — the map you can turn on when you want everything in arm's reach |
| `ONE SCREEN` | the original arena: one screen, acts rotate on the clock |

**Options → ART STYLE** changes how the game is *drawn*, not just how it is coloured (see below);
**Set dressing** toggles the props and signage if you want the boards bare.

## Art styles

Five looks, each with its own levers — flat fills, outline weight, halftone dots, contact shadows,
grain, render scale, and a different job for the post pass. `npm run test` proves the structural
part (only one style shrinks the buffer, only the flat ones are flat, every style keeps the canvas
state balanced across thousands of frames), and the browser tool measures the buffer:

| style | how it is built |
| --- | --- |
| `INK & WASH` | the house look: gradient skies, soft contact shadows, warm stock |
| `FLAT CEL` | two hard tones, posterised in the shader, no gradient anywhere, halftone shadow dots, thicker outlines |
| `SILVER NOIR` | the frame is bleached to monochrome with rain and heavy grain — only a *saturated* red survives, so a warm palette still goes grey |
| `RISOGRAPH` | two inks sampled a pixel-and-a-half out of register, printed on paper, dot-screened and posterised |
| `8-BIT REEL` | the whole scene renders at 0.42× and is blown back up with nearest-neighbour, quantised to three levels with an ordered dither — and it is roughly 3× faster |

The HUD is DOM, so it stays crisp and legible in every style. `FILM` (clean / CRT / vintage / noir
grade) is a separate knob from `ART STYLE`, so the projector treatment and the drawing are not tangled
together.

## The armory

**37 weapons**, and a house rule enforced by a test: no two of them share a fighting style — the
rate, damage, speed, shot count, spread *and* trait line are unique per gun, and each one is drawn
as itself (a ticket on a rail, a teardrop, a candle, a yo-yo on a string — never a recoloured
bullet). The newest three fill roles nobody else holds: **THE TICKET LANCE** pierces the entire
room in one straight rail; **THE SPRINKLER SAINT** opens radially, ten droplets, no safe side;
**VIGIL CANDLE** is placed on the boards and burns anything that walks through its light. Every
non-starter gun is unlocked for good by walking over its prize crate mid-run, and Porbo sells
whatever is in the crate out back.

## The cast and the wardrobe

Five heads on the bill — **Milo Marlowe** the everyman, **Dixie Dazzle** the glass cannon, **Barnaby
Brawn** the wall, **Coco Cabaret** the diva (burst damage, glass knees), **Rusty Rivet** the tinker
(fast hands, a spare shield plate) — and no two of them share a stat line or a silhouette: each has
its own hat, rig and walk in the painter and its own portrait in the menu.

Every cast member owns **four skins**. `HOUSE` is the look the show shipped with; the other three
recolour head, clothes, hat and hat-detail (in the run *and* in the portrait); the gold `ENCORE`
skin is a trophy for beating any Ringmaster. The WARDROBE rack lives under the CAST list, the
choice is remembered on the device, and picking an outfit mid-session re-dresses the runner live.

## Clean screen

Some players want the fight to read as pure picture. Options → **CLEAN SCREEN** has two dials,
because the writing comes from two places: **WORDS** controls what the painter writes *into* the
scene (floating damage pops, boss intro cards, the plank door signs, the wayfinder's distance, the
dance multiplier), and **HUD** controls the DOM overlay on top of it (labels, digits, badges — or
the whole overlay, minus the pause button). Both apply instantly, mid-run included, and both are
remembered. The simulation keeps counting every word it hides, so nothing about scoring or damage
changes underneath; only the painting is switched off. `WORDS = NO TEXT` with `HUD = BARS ONLY`
leaves a screen with no writing on it at all — meters, pips and rings stay, because
they are shapes, not words.

## Layout

```
index.html             the distributable single-file build (generated — don't hand-edit)
dev.html               dev entry for vite
src/App.tsx            React shell: HUD, menus, input (keyboard/mouse/touch), RAF loop
src/game/engine.ts     run state + the master update() loop (fixed 1/120s steps)
src/game/util.ts       math, world bounds, enemy spatial index          (leaf)
src/game/fx.ts         particles, floating text, cards, drops           (util)
src/game/spawn.ts      creep / boss / crate spawning, enemy shots       (fx)
src/game/combat.ts     damage, kills, parries, pickup collection        (spawn, economy)
src/game/weapons.ts    all 37 weapons + EX supers                       (combat)
src/game/hazards.ts    per-biome stage hazards                          (combat)
src/game/companions.ts hounds & bees                                    (combat)
src/game/economy.ts    Porbo's shop + boons                             (fx)
src/game/achievements.ts run-end achievement evaluation                 (leaf)
src/game/scenery.ts    cached biome backdrops + animated decor          (leaf)
src/game/render.ts     creeps, player (two-bone IK), bullets, hazards art
src/game/post.ts       WebGL looks: crystal / CRT / film / noir + danger vignette
src/game/data.ts       every weapon, creep, biome, charm, boon, wave, modifier
src/game/audio.ts      sample cues (CDN) with synthesized fallbacks + music
src/game/types.ts      shared types
tests/                 sim.ts · features.test.ts · render.test.ts · perf.ts (headless)
```

Dependency rule: arrows point *down* only — `util → fx → spawn → combat → {weapons, hazards, companions}`, `economy` beside `combat`, `engine` orchestrates and re-exports the public API.

Conventions worth knowing: gameplay logic is pure (`update(g, inp, dt, w, h)`) so the test harnesses run it in Node; render never mutates state; `npm run build` must be re-run after any source change because the root `index.html` is the shipped artifact.

## Credits

- Music: Eric Matyas, [soundimage.org](https://soundimage.org) (attribution required — credited in-game)
- Sound effects: Phaser examples asset library via jsDelivr
- Everything else drawn in code — no image files in this repo.

## Made to be shipped

Small things that turn an arcade toy into a product, all of them tested:

- **Nothing gets stuck.** Losing the window releases every held key, the mouse button and both
  thumb-sticks, so a click on another window can't leave the runner walking into a lunge forever.
  Pausing, dying and restarting do the same.
- **The game survives a bad frame.** `sanitize()` runs at the head of every update: a NaN position,
  a gumption bar reading 4000, or a runaway particle pool is clamped or trimmed, never propagated.
  Effect pools (bullets, puffs, pickups, ghosts, puddles …) all have ceilings, so a five-minute
  firefight cannot grow the heap forever.
- **The projector un-jams.** A lost WebGL context (phone backgrounding, driver reset) pauses the
  run, says so in a letter, and rebuilds the shaders on `webglcontextrestored`. If it never comes
  back, the page tells you to reload instead of showing black forever.
- **The show stops politely.** Any unexpected throw inside the sim or the painter halts the frame
  loop and prints the reason with a CONTINUE THE SHOW button, rather than freezing the canvas.
- **The band waits too.** A hidden tab suspends the audio context and pauses the music track.
- **Reads the same everywhere.** HUD pictograms (coin, umbrella, star, clock, heart, cart) are
  inline SVG, so no machine ever shows a tofu box. Overlays scroll instead of clipping, the touch
  controls sit inside the safe area, and pull-to-refresh is off over the play field.
- **Mobile layout is measured, not guessed.** The aim stick, action buttons and swap chip are
  asserted not to overlap by `verify5.mjs`, and the aim stick is checked to both aim and fire.
- **Pinch zoom stays available** (WCAG 1.4.4); the canvas opts out of double-tap zoom with
  `touch-action` instead of the whole page being locked.
- **Probing does not ship.** `window.__rr_game` exists only when the URL carries `#debug`, so the
  browser harnesses can read live state while a normal visitor gets no debug surface at all.
- The build writes `dist/index.html` and the root `index.html` itself — no `cp` step to forget.
- **The reload gives you back your session**: loadout, charm, mode, mute and auto-fire are stored
 (validated against the shipped data, so a hand-edited value can't put a locked weapon in your hands).
- **The manual cannot go stale**: HOW TO PLAY prints the keys from the live key map, so after a
  rebinding it shows the key you chose — not the one we shipped.
- **Letters take the a11y cursor**: pause, boon pick, the run-over card and the crash note are dialogs
  that receive focus on open, so a screen reader lands on the letter instead of the canvas behind it.
- **Reduced motion means the decorations stop**: grain, scratches, the shop chip pulse, the low-health
  alarm — while the game itself keeps moving, because that is the content.
