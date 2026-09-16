# Rubber Requiem — enhancement pass

Built on `poadon087-droid/hedde`. Same game, same identity — more of it, and fewer things wrong with it.

## Unshipped — HUD trimming & a small-things pass

- **The in-game map widget is gone.** The floating stage-grid (mini map tile icons, player dot and
  act caption) that hovered over the fight is removed in every HUD mode — nothing obstructs the
  picture any more. The run-over letter and the pause panel still say which stage you are about,
  and the bezel chevron still points at the nearest off-screen creep; navigation is unchanged.
- **The letterboxed shell no longer crops modals.** `pause-panel`/`upgrade-panel` were sized by
  `100dvh` while living inside a 16:9 shell shorter than the viewport — on wide screens the bottom
  of every big letter (including the run-over letter's buttons) was cut off by `overflow: hidden`.
  Panels are now sized to the overlay, and the run-over letter pins "ONE MORE RIFF" to the bottom
  of its scroll so the next run is always one visible tap away.
- **The wayfinder caption stays on the screen.** The chevron rides the bezel, and its
  "2.3 SCREENS" label used to hang half off the right edge; it is clamped inside the frame now.
- **MAP rows no longer overflow.** "THE WHOLE SHOW · 56 HAND-LAID STAGES" (typo "HAND-Laid" fixed
  too) wrapped past its button in OPTIONS and read as an ellipsis; the buttons wrap to two lines.
- **The manual stops stuttering.** "SHIFT · SHIFT · brief invincibility" came from slicing the
  binding list before deduplicating pretty names — dash now reads "SHIFT · L" like it should.
- **Every gun has a voice again.** The three newest weapons (Ticket Lance, Sprinkler Saint, Vigil
  Candle) and three feedback events (crowd `cheer`, parry `whiff`, anvil `stamp`) fell back to the
  generic blip; each has a hand-built patch now, so all 37 weapons sound like themselves.
- **Smaller stains cleaned:** "Heart Pie" no longer promises a "full recover" it never gave;
  "LV. 1 ·" no longer dangles its dot when no biome is attached; the shop HUD button hides when
  the till is somehow empty; the pause panel's row labels are legible on the cream paper instead
  of cream-on-cream; the title tabs leave a corner clear for the sound dial; README/meta stats
  match reality (37 weapons, 40 creeps, 56 stages, 5 stars).

## Verification

```
npm test    # 358 checks across 3 harnesses
npm run build
```

| harness | file | checks | what it proves |
| --- | --- | --- | --- |
| engine soak | `tests/sim.ts` | 62 | 8-minute simulated run, every weapon/enemy/parry path, frame budget at the enemy cap |
| features | `tests/features.test.ts` | 260 | every new weapon, creep, hazard, pickup, charm, boon, character, the shop, the 56-stage map, the input/robustness layer |
| render | `tests/render.test.ts` | 36 | real `render()` driven headlessly over thousands of frames, every biome, hazard, weapon and art style; asserts `save === restore` |

`npm run perf` prints ms/frame and canvas ops/frame at light / medium / heavy load.

## Encore modes — fully different play loops

Added four modes that change the player's objective or verb set rather than only changing enemy numbers:

- **ON THE BEAT** — an 88 BPM pulse rewards attacks and parries on-beat, while off-beat actions deal reduced damage.
- **PROJECTOR NIGHT** — defend a physical projector objective. Creeps path toward the reel, contact drains film, and a destroyed reel ends the run.
- **BLACKOUT** — the arena is hidden outside a small personal light radius. Parrying bulbs permanently widens the light.
- **DON'T LOOK BACK** — regular pressure is reduced, then an unkillable teleporting wisp arrives. Survival and movement are the goal.

The modes reuse the existing cast, weapons, enemies, and art language, but create rhythm, defense, visibility, and pursuit loops. Feature coverage is now **109 checks**; the full suite is **177 checks** across 3 harnesses.

## Variety pass — job-based modes

Added three more modes based on objective and stealth research:

- **LAST CALL DELIVERY** — escort a vulnerable package through four moving checkpoints while enemies converge on it.
- **TAKE THE FLOOR** — capture and hold three physical zones; enemy presence contests ownership and reverses progress.
- **GHOST SHOW** — shooting is disabled. Movement, dashing, firing attempts, and enemy proximity raise suspicion; staying still lowers it. Survive 75 seconds without filling the alert meter.

There are now **17 total modes**. The mode set covers survival, boss rush, timing, targeting, shrinking arenas, risk, sound, defense, visibility, pursuit, escort, territory control, and stealth instead of one repeated arena-shooter loop.

## Bugs fixed

1. **Parry paid out twice.** A parried kill was credited both by the parry handler and the normal death path — `score delta=394` for one kill. Now exactly one kill, one reward.
2. **`MAX_PUFFS` was not enforced** on the hot path; a busy stage peaked at 679 particles against a 420 budget.
3. **The boss's volley ran on `setTimeout`** — wall-clock time, so it kept firing while paused and ignored pocket-watch slowdown. Moved onto engine time.
4. **Mime alpha precedence** made the mime solid when it should have been fading.
5. **`loadQuality()` validated `look` and then threw the result away.** `{ shaders: true, lowFx: false, look, ...raw }` spread the raw parsed JSON last, so anything in `localStorage` went straight into the post-processing pass. Every field is now validated individually.
6. **Biome hazards never spawned.** All nine biomes advertised a `hazard`/`hazardName` and nothing in the engine produced one. Now wired, plus `drawHazards()` and a telegraph frame before every strike.
7. **`dprCap` ratcheted down and never came back.** One bad frame dropped internal resolution to half and it stayed there for the rest of the session, even on a machine that could afford more. Now recovers to 2 after six consecutive windows above 58 fps.
10. **Blank live preview: dev-server modules blocked by CORS in the sandboxed embed.**
    The live preview loads the dev server inside a sandboxed iframe with an opaque
    (`null`) origin. Every `<script type="module">` fetch from origin `null` is
    cross-origin, and Vite sent no CORS headers — the browser dropped `@vite/client`,
    `@react-refresh` and `main.tsx`, so React never mounted and the page sat blank.
    `server.cors: true` now serves modules to any origin including `null`. Verified by
    loading the dev server inside a real `sandbox="allow-scripts"` iframe: menu and
    gameplay run with zero console errors.
9. **White screen in sandboxed / storage-less contexts.** `localStorage` throws `SecurityError`
   in sandboxed iframes (the in-app file preview runs `index.html` with `sandbox="allow-scripts"`
   and no `allow-same-origin`) and in locked-down/private browsers. Four call sites were
   unguarded — including `persistUnlocks`, which runs mid-run the moment you find a weapon —
   so the uncaught exception killed React and left a blank page exactly when you pressed play.
   All storage access now goes through a guarded `store.get/store.set` pair; the game simply
   plays session-only when storage is unavailable.
8. **Two render hotspots.** `ctx.filter = "brightness(2.2)"` forced a filtered offscreen composite *per damaged creep* — replaced with a plain tint. `new Path2D(d)` was constructed on every `iconPath()` call — now cached by path string.

## Performance

- **Viewport culling** on creeps, bullets, ghosts, puffs, puddles, pickups, companions and hazards. Entities that spawn off the edge and walk in were being drawn in full.
  Heavy load: 5698 → 4698 canvas ops/frame (−18%).
- **Adaptive resolution now recovers** (bug 7) instead of permanently halving it.
- Engine holds **0.37 ms/frame average at the enemy cap** (59 creeps, 16.7 ms budget).

## Content

| | base | now |
| --- | --- | --- |
| weapons | 23 | **29** |
| creeps | 25 | **29** + Ringmaster |
| charms | 9 | **12** |
| power-ups | 11 | **14** |
| boons | 17 | **22** |
| modifiers | 7 | **9** |
| waves | 11 | **14** |
| biomes | 9 | 9 — **each now with a working hazard** |
| playable cast | 1 | **3** |

**New weapons** — Slapstick Peels (floor traps, slip-stun), Hive Kazoo (seeking swarm), Barrel Roll (piercing line), Molasses Pot (slow slick + burn), Dog Whistle (a hound that fights for you), Brolly Guard (orbiting parasols that eat incoming fire).

**New creeps** — Siren Sister (drags you toward her), Fry Cook Fritz (lobbed pans, burning grease), Blimp Balloon (bursts into a swarm when shot down), Pipe Organist (telegraphs three lanes, then hammers them).

**New hazards** — every biome now throws its own: lava, wisps, carnival spinners, train carriages, glaze, geysers, pendulums, tombs, fire pillars. Each telegraphs before it can hurt you.

**Playable cast** — Milo Thimble (all-rounder), Dixie Kazoo (fast, frail, quick trigger), Barnaby Bones (slow, tough, hits hard, starts shielded). Persisted in `localStorage` under `rubberRequiemCharacter`, selectable from the new **CAST** tab.

**Porbo's shop** — now offers a boon as a fourth item (previously the `upgrade`/`charm` kinds existed in the type and were never generated or purchasable), and you can talk to him with **T** to keep the stall open instead of losing it to a 15-second timer.

## Showstopper modes — five modes that change the rules, not the numbers

The first mode pass tweaked parameters of one loop. Research into how the genre designs challenge modes (Crypt of the NecroDancer's timing axis, Into the Breach's defend-objectives, Curse of the Dead Gods' light/dark risk, Enter the Gungeon's verb-restriction challenges) says real variety comes from inverting ONE axis of play per mode. So the menu now has a MAIN BILL (the five classics) and **SHOWSTOPPERS · OWN RULES**:

- **CENTER STAGE** (spatial axis) — a spotlight drifts across the stage; damage lands ×2.4 inside it and ×0.35 outside, and kills inside pay ×2. Kiting stops working; you fight where the light is. Rendered as a drifting dashed gold ring with a warm pool of light.
- **WANTED** (targeting axis) — one gold-marked bounty at a time: +60% HP, +25% speed, worth +2500¢; the surrounding crowd pays only a quarter. Six marks per set, sets escalate. The mark wears a drawn crosshair + WANTED tag.
- **THE SQUEEZE** (arena axis) — ink walls physically close in for two minutes (player clamp shrinks, hazards roam the ink); survive the shrinking stage. Rendered as black ink bars with a pulsing danger edge.
- **GLASS CANNON** (risk axis) — 1 HP, ×3.5 damage, no second wind; Spare Breath drops become shield charges instead.
- **HUSH** (verb axis) — every shot converts into spawn pressure (10% chance ink pops beside you); parry score ×2. Shooting becomes a cost, parrying the income.
- Per-mode opening announcements, live HUD badges (the spotlight badge flips between IN/OUT OF THE LIGHT as you move), per-mode game-over kickers.
- Verified: tsc clean · 166 checks (59 sim / 98 features incl. 11 new [10] checks / 9 render) · Chromium probe: all five showstoppers played live, zero page/console errors · screenshots confirmed the spotlight ring and ink walls render in-style.

## Bug-fix pass — full audit after the modes/SFX drop

Audited every cue name, WebAudio ramp, mode branch and UI flow; fixed what the audit found:

- **Gauntlet pacing (major).** `killEnemy` hard-set `bossTimer = 95` after every knockout, so THE GAUNTLET waited ~43 s between bosses. Now the rematch timer is 4 s in that mode only (endless still 95 — regression-tested).
- **Daily rules leak.** Clicking DAILY REEL while a mode was selected started a *daily gauntlet/sprint* — polluting the daily best with other modes' scores. The daily button now forces endless.
- **Music fade race.** `stopMusic()`'s fade-out interval could outlive its track and silence whatever `playMusic()` started right after (e.g. a fast ENCORE! after game over). Both fades now carry a generation token and die when a newer play/stop supersedes them.
- **Gauntlet music.** Boss music no longer flip-flops to the regular track during the seconds between challengers — the whole mode scores like a boss fight.
- Verified clean along the way: all 45 event cues + all 34 `shoot:*` weapon patches exist in the synth table (no silent beep fallbacks); no exponential ramps to zero (the classic WebAudio crash); hunt quota can never stall (enemies only leave via `killEnemy`); sprint clock runs on raw real time and pauses with the pause menu; survival has no second-wind back door (charm, pickup and revive path all gated).
- New regression tests: 155 checks (59 sim / 90 features / 9 render) + Chromium probe playing **every mode** for 3.5 s each with zero page/console errors, and the daily-forces-endless assertion.

## Synth SFX + run modes + replay (this pass)

- **Sound redesign, zero placeholders.** `src/game/audio.ts` no longer fetches samples from any CDN — ~75 hand-sculpted synth patches (per-weapon voices, layered boom with noise + filter sweep, bell partials, sad-trombone game-over) scheduled with WebAudio oscillators, noise buffers, envelopes, frequency/cutoff glides and LFO vibrato. Before, an unreachable sample CDN meant the game silently fell back to crude beeps — the "radio" sound. Now there is no network dependency to fail: every cue is designed. Music (Eric Matyas — soundimage.org, credited in-game) and its synth-band fallback are untouched.
- **Four new run modes** — same cast, same creeps, different goals (`Mode` in `types.ts`, branching in `engine.ts`/`combat.ts`, selector row in the menu):
  - **THE GAUNTLET** — bosses only, back to back; regular spawn and waves are muted.
  - **THREE-MIN SHOW** — 180 s real-time countdown to the biggest score; the pocket-watch pickup cannot buy stage time.
  - **ONE BREATH** — no second wind at all (charm disarmed, wind pickups heal +20 HP instead), spawn pressure ×1.45.
  - **BIG GAME HUNT** — clear escalating kill quotas (12, then 10 + 4·wave); difficulty keys off the hunt wave; each clear heals +15 HP and drops a crate.
- **Replay buttons.** Pause → **↻ RESTART RUN** (same mode, fresh run); game-over **ONE MORE RIFF ↻** now replays the same mode and daily seed.
- Per-mode HUD badge (countdown clock / hunt quota / gauntlet tally), per-mode game-over kickers and a `TIME!` headline for the sprint.
- Verified: tsc clean · 152 checks (59 sim / 84 features / 9 render) · build 494,409 B · browser probe 9/9 · extra Chromium probe: mode picker relabels PLAY, gauntlet badge renders, RESTART RUN keeps the mode, zero uncaught errors.

## Browser-verified release gate

Everything so far was verified by headless harnesses; this pass proves the **shipped artifact** works in a real browser, in both delivery conditions:

- **Top-level over http** (live preview): boots (`__rr_booted`), canvas sized and rendering, frames advancing, *PLAY ENDLESS* starts a run, zero uncaught errors.
- **Inside `<iframe sandbox="allow-scripts">`** (file viewer): boots with `localStorage` fully blocked — the `store` guards hold — renders, advances, starts a run, zero uncaught errors.

The probe ships in the repo: `npm run test:browser` (headless Chromium, `playwright-core` as a devDependency; needs `npm run preview` running). First iteration of the probe reported a sandbox failure that turned out to be the probe's own `data:`-URL wrapper — Chromium blocks that navigation — not the game; re-tested with a same-host wrapper: green.

Also added `.github/workflows/ci.yml` running `npm run check` (typecheck + 145 checks + build) on every push.

## Module split — the monoliths are gone

The last open item from the suggestion list, done as a **pure move-refactor**: no logic changed, only file boundaries. Verified by running the full 145-check suite before and after (all green both times) plus `tsc` and the perf probe.

| module | holds | depends on |
| --- | --- | --- |
| `util.ts` | math, world bounds, enemy spatial index | types |
| `fx.ts` | particles, floating text, cards, drops, companions spawn | util |
| `spawn.ts` | creep/boss/crate spawning, enemy shots | fx |
| `combat.ts` | damage, kills, parries, pickup collection | spawn, economy |
| `weapons.ts` | all 34 weapons + EX supers | combat |
| `hazards.ts` · `companions.ts` | biome hazards · hounds/bees | combat |
| `economy.ts` | shop generation, purchases, boons | fx |
| `achievements.ts` | run-end evaluation | types |
| `scenery.ts` | cached biome backdrops + animated decor | data |
| `engine.ts` | run state + `update()` orchestration | all of the above |

`engine.ts` went 2,177 → 1,334 lines, `render.ts` 1,253 → 1,032. Dependencies point one way only (no cycles); `engine` re-exports the public API so `App.tsx` and every test import stayed untouched. The per-frame numbers are unchanged within noise.

## Production pass — the whole remaining wishlist

**Elite affixes.** Elites now roll one of three affixes, each with a tinted crown: **painted** (permanently marked — everything hurts it +35%), **mirror** (deflect windows every few seconds — watch for the glints), **swift** (×1.5 speed).

**Boss phases borrow the new creeps.** Phase 2 raises a disco-style **mirror shell** on a pulse; phase 3 adds usher-style **phasing** (shots pass through — time your damage) and the magnet's **shot-bending crown**.

**Daily Reel.** A seeded once-a-day run: deterministic biome order + one modifier active from t=0, its own "best today" score, restart keeps the mode. Menu shows today's seed.

**Achievements & unlocks.** Four achievements evaluated per finished run (*Ringmaster Down, Sugar Rush, Showstopper, Penny Pincher*), persisted in localStorage. Barnaby unlocks by beating any boss; the Wet Varnish charm by parrying 50 shots in a run. Locked pickers show the requirement.

**Key remapping.** Every action (move, fire, dash, parry, EX, super, swap, interact, pause) rebinds from the pause menu — click, press a key, done. Persisted; one key per action to avoid conflicts.

**Calm FX.** New accessibility toggle (auto-on when the OS asks for `prefers-reduced-motion`): caps screen shake and flashes.

**Game feel & decor.** Per-weapon shake weights (anvils thud, kazoos whisper); 1930s title cards at 10/25/50/100 combo; rooftop laundry flapping in the wind; candle flicker in the Forbidden Library; run stats (accuracy + favorite weapon) on the curtain-call screen.

**Checks.** `tsc` clean · sim 59/59 · features **77/77** (nine new checks: boss phases, daily determinism, combo cards, stats, achievements) · render 9/9 · perf 0.18 / 0.40 / 0.63 ms per frame.

> The one list item deliberately *not* done: splitting `engine.ts`/`render.ts` into modules. Shipping features and a 3,000-line move-refactor in the same pass multiplies regression risk for zero player-facing gain — it stays on the list for a quiet, test-guarded pass of its own.

## Quality pass — audio gaps, alt-tab pause, weapon synergies

**Eleven weapons were firing silently.** `audio.ts` had 23 `shoot:*` cues but 34 weapons; peel, kazoo, barrel, syrup, whistle, umbrella, grapple, slots, paint, pie and stamp now each get a cue built from the existing sample pool at distinct pitches (no new network assets). Lightning strikes play the laser cue.

**Alt-tab protection.** Hiding the tab mid-run now auto-pauses instead of resuming into an enemy lunge.

**Three weapon synergies** (each covered by a feature test):
- *Cream Pie + Postage Stamp* — the parcel detonates ×1.5 against pie-blinded creeps ("SPECIAL DELIVERY!").
- *Charged Thunder Kettle + Polka Paint* — a full-charge bolt detonates the paint in a 140px INK NOVA that splashes neighbours.
- *Hookshot Cane + Barrel Roll* — kegs land ×1.5 harder while the hook is reeling a creep in.

**Housekeeping.** Meta description corrected to 34/34/11; `README.md` added (controls, scripts, layout, credits); `npm run check` = tsc + test + build; `SUGGESTIONS.md` tracks the remaining wishlist (and corrects an earlier claim — touch controls were already built: joystick + FIRE/DASH/PARRY/EX/AUTO/SUPER behind a coarse-pointer check).

**Checks.** `tsc` clean · sim 59/59 · features 68/68 · render 9/9.

## Content drop — five weapons, five creeps, two stages, a new film look

**New weapons (34 total).** *Hookshot Cane* (grapple: snags the biggest creep, reels you or it in), *Jackpot Slots* (three random-pattern reels per spin), *Polka Paint* (marks creeps — everything hits them +35%), *Cream Pie* (arc shot that blinds), *Postage Stamp* (sticky delayed bomb). Each has an EX super, its own held sprite and projectile art.

**New creeps (34 + boss).** *Disco Destroyer* (mirror ball — facets deflect shots, glint tells you when), *Inkwell Skunk* (noodle-tail ink sprays leave gunk puddles), *Strongman Slugger* (winds up a barbell haymaker — the dashed ring is your warning), *Theatre Usher* (phases translucent and sweeps a flashlight cone), *Magnet Maestro* (horseshoe crown bends your shots — flank it). All draw with bespoke art; status overlays show paint, pie-blind, stamped fuses and wound rings.

**New stages (11 total).** *Midnight Rooftops* — skyline, moon and storm lightning that telegraphs with a dashed strike line. *Forbidden Library* — shelves, rolling ladder, drifting dust and falling tomes whose shadows grow before impact. Both hazards (`bolt`, `tome`) are new `HazardKind`s with warn/active art.

**Bone animation.** Player limbs now use a two-bone IK solver (`bone2`) — real knees and elbows in the run cycle, on the gun arm and during dashes.

**Shaders.** Fourth post look **INK NOIR** (silver-gelatin contrast, projector flicker, vertical scratches, heavy vignette), plus a CPU-pulsed **danger vignette** that throbs red below 30% gumption. New `danger` uniform.

**New charm.** *Wet Varnish* (13th): paint marks last twice as long and marked creeps take +50% instead of +35%.

**Cleanup.** Removed the dead `Player.platformId` field; biome hazard kinds now typed as `HazardKind | "platform"`.

**Checks.** `tsc` clean · sim 59/59 · features 65/65 · render 9/9 (canvas save/restore balanced across 2,700 drawn frames) · perf 0.21 / 0.42 / 0.67 ms per frame at light / medium / heavy load.

> Note: `src/game/data.ts` was briefly lost to a botched scripted edit mid-batch and rebuilt from the git base plus this batch's additions — the counts above are enforced by the feature harness, so any drift fails the tests.

## Tooling

- `npm run build` now typechecks (`tsc --noEmit && vite build`) — it did not before, so type errors shipped.
- `npm test` and `npm run perf` added.
- `index.html` meta description updated from "23 weapons, 9 biomes".
- `vite.config.ts` binds `0.0.0.0` and accepts any origin so the preview works.
- The **live preview now serves the built single-file app** (`vite preview` on :5173)
  instead of the dev server. The sandboxed preview iframe has an opaque origin, and the
  proxy in front did not forward CORS headers, so dev-server module fetches were dropped
  and the page sat on the boot screen. A single inlined HTML has no cross-origin fetches
  at all — it runs in any sandbox, behind any proxy.
- **The root `index.html` is now the distributable game itself.** The in-app file viewer
  has no network access, so a source entry that fetches `/src/main.tsx` can never run
  there — it showed a white page, then the boot card forever. The dev entry moved to
  `dev.html` (`build.rollupOptions.input`), and `npm run build` copies the inlined
  single-file output to both `dist/index.html` and the root `index.html`. File preview,
  live preview and download are now the same self-contained build. Develop via `/dev.html`.

## Hardening pass — production polish

Found by reading the modules and then fuzzing the built page (random keys, mouse, touch,
gamepad, resize storms, visibility flips and option churn for 45 s while asserting state
invariants every tick). Each item below has a check in `tests/features.test.ts` [14] or a
browser assertion in `verify5/6/7.mjs`.

| issue | fix |
| --- | --- |
| gamepad left stick was overwritten by the keyboard line — the pad could not walk | all movement sources are folded into `inp.mx/my` once, before the sim |
| held keys survived `window.blur` — the runner kept walking and firing | `releaseAll()` on blur, hide, pause, death and restart |
| `B` opened the shop panel over the title card and the death letter | the shop peek only exists while playing; it is also cleared on restart |
| `Tab` was swallowed even in menus, trapping keyboard focus | only swallowed mid-run and when no control is focused |
| a lost WebGL context meant a black canvas until reload | `webglcontextrestored` rebuilds shaders; otherwise a letter explains and reloads |
| a throw in the loop froze the game silently | the loop halts, prints the reason, offers CONTINUE THE SHOW |
| music kept playing in a hidden tab | `holdAudio()` suspends the context and pauses the track |
| `ac.resume()` rejection on every load (autoplay policy) | swallowed centrally in `resumeCtx()` |
| effect pools had no ceiling (only puffs did) | `POOL_CAPS` trims bullets/pickups/ghosts/texts/puddles/hazards/companions |
| one NaN poisoned the camera and hid the world | `sanitize()` at the head of `update()`, clamping without fighting gameplay clamps |
| remapping a key to one already in use silently reverted | the rebound action wins; the loser is handed a free key; `RESET KEYS TO DEFAULT` added |
| a corrupt `localStorage` key map could strand a control | `mergeKeyMap()` validates codes, collisions and empties |
| 🪙 / ☂ / ◷ emoji in the HUD (tofu without an emoji font) | inline SVG pictograms, stroked like the rest of the art |
| HUD level line clipped to `Cinder Gro…` | the `LV.` prefix drops out under 560 px; the stage name never truncates |
| mobile swap chip sat under the DASH button | docked above the thumb clusters, inside the safe area |
| pull-to-refresh / text selection / long-press callout over the game | `overscroll-behavior: none`, `-webkit-touch-callout`, safe-area insets |
| `user-scalable=no` blocked pinch zoom | removed; the canvas uses `touch-action` instead |
| FPS readout always on screen | only when the frame rate is actually bad (or under `#debug`) |
| the render loop was rebuilt whenever a best score changed | `best` is mirrored in a ref; the loop mounts once |
| shop peek survived a run | `shopView` resets on start and on death |
| `dist/index.html` produced by an `cp` in an npm script | a `closeBundle` plugin emits it (and the root artifact) |
| no `.gitignore`, `dist/` and a scratch script in the tree | added `.gitignore`, removed `.tmp_variety.py` |
| loadout / charm / mode / mute / auto-fire reset on reload | one validated `rubberRequiemPrefs` entry, saved on change |
| HOW TO PLAY hard-coded the shipped keys | every line reads the live key map, so rebinding cannot make the manual lie |
| overlays never took focus | pause, boon, game-over, crash and lost-context letters are labelled dialogs that receive it |
| `prefers-reduced-motion` left the looping effects running | grain, scratches, chip pulses and the low-health alarm stop; the game itself keeps moving |
| `🔒` / `★` emoji in the menu | inline SVG lock and star, like the rest of the HUD |

## The authored world, five art styles, and the firing fix

### The map, rebuilt from scratch
The 33-stage grid is gone and `src/game/world.ts` replaces it: **33 hand-authored stages** (name, act,
art set, mood, props, ledges, hazard override, pressure) laid out in a **stepped 12 / 11 / 10
silhouette**, walked as a snake. Nothing about it is derived from a formula any more:

- `canStand` / `rowSpanOf` are the single source of truth for where the map exists. The player is
  clamped to the row he is standing on, so the ends of the undercroft are **walls**, and a row with
  no ground at that column cannot be entered from above or below.
- The camera leaks up to a quarter of a viewport past a row's end on purpose: the torn ink margin
  (`drawVoid`) and the plank signage naming the stage behind the doorway are authored art, and
  they are the payoff of a shaped map. Painting is gated by the same table, so a void cell paints
  ink and nothing else — no backdrop, no props, no spawn.
- Spawn placement intersects `viewBand` with the row span, so a creep, crate, bulb or geyser can
  never be born in a void.
- Stage entry announces the **stage** (`BONEYARD CRYPT / Tombstones rise and stay up`) instead of
  the biome, and the HUD map widget draws the silhouette — 36 cells, three of them void.
- `PORBO'S ALLEY` is the small one: one screen, ten hand-placed props, two ledges that become real
  platforms, a shopfront, laundry overhead, its own hazard. Enabled or disabled from Options → MAP.
- `pressure` multiplies the clock's difficulty per screen (0.8 at the start, 2.0 at the Requiem
  Stage), so the authored route also *paces* the run.

### Five art styles that are not tints
`src/game/styles.ts` drives flat fills, outline weight, halftone dots, contact shadows, grain,
**render scale** and a new `styleMode` branch in the post shader: INK & WASH, FLAT CEL, SILVER NOIR,
RISOGRAPH, 8-BIT REEL. The 8-bit look renders the scene buffer at 0.42× and upsamples with
nearest-neighbour (about 3× faster in software); noir bleaches to monochrome and keeps only a
*saturated* red — the first version kept the whole frame red, because "the red channel is the biggest
channel" is true of almost every palette in this game; riso samples the texture twice, a pixel and a
half apart, and dot-screens it. `Set dressing` toggles the props and signage off entirely.

### The firing bug
- Auto-fire was gated on `liveBuf.length > 0` — one *visible* creep anywhere in a 12-screen world —
  so between waves, past a stage edge, or while the only threat was mid-jump, the gun looked dead.
  Holding fire now always fires; auto-fire aims at what you can actually hit (1.6 screens across,
  1.5 rows deep) and sweeps in front of you when nothing is in reach.
- The mouse aim converted screen-x to world but **not screen-y**, which was harmless while `cam.y`
  was always 0 and wrong the moment the map had rows: shots aimed at the wrong height on rows two and
  three. Both axes are converted now.

### Firing / input regressions caught by tests
- `[15]` in features: 33 stages unique, no two touching screens share a biome, one connected piece,
  contiguous rows, props inside 0..1, hazards real, the void in the right places, `worldOf` memoised,
  the wall holds at the row edge, the camera leak stays bounded, and the alley's ledges become
  platforms.
- `[8]` in render: every art style draws the whole show (plus the margin) across 260 frames with the
  canvas state balanced, so the new `save/restore` in props, mood, signage and voids cannot leak.
- `tools/browser/world.mjs` asserts the route walks acts 1→12, the margin reads darker than the
  stage (0.55× luminance), the widget shows 36 cells with 3 voids, every style applies and sticks,
  the pixel buffer really is 0.42×, and the dressing toggle flips and persists.

### Housekeeping
`tools/browser/` now holds the Chromium checks that used to litter the working directory
(`smoke / world / world-geometry / walkway / hud / touch / robustness / visual / clean / fuzz`, see
`tools/browser/README.md`, plus `npm run check:browser`); screenshots go to a gitignored `shots/`;
the scratch files are gone.

## The map grew a floor, and the screen learned to shut up

### 44 stages, four rows
The slab is no longer three rows of 12 / 11 / 10: a fourth row was dug under the undercroft, so the
authored world is now **44 stages in a 12 / 11 / 10 / 11 snake** — act 44, `CURTAIN CALL`, closes
the route at the west end of the new floor. The new row is a *vault* row (drowned bells, flooded
dressing rooms, the machine under the stage) and brought four new prop painters with it —
waterwheel, scaffold, obelisk, ferris — taking the set to **32 painters / 246 hand-placed props**.
Nothing about the authored-world contract moved: the new row goes through the same `canStand` /
`rowSpanOf` table, so its ends are walls; spawns intersect `viewBand` with the row span; the camera
leak paints the torn margin *below* the last floor; and the HUD widget now shows **48 cells with 4
voids**. `tools/browser/world.mjs` teleports to both ends of the new floor, reads the plank captions
(`ACT 34/44`, `ACT 44/44`), fires all four loadout guns down there, and drops the runner off the
bottom of the world to prove he lands on a floor, not in a hole.

### CLEAN SCREEN — two dials that take the writing off the show
The words on the play field come from two places, so Options → CLEAN SCREEN ships two dials instead
of one big switch:

- **WORDS** (`EVERYTHING / QUIET / NO TEXT`) gates what the *painter* writes into the scene. QUIET
  drops the floating combat pops and the DOM call-outs; NO TEXT additionally drops the boss intro
  card, the plank door signs, the shop sign, the wayfinder's distance label, the dance multiplier
  and the crate nameplate. Arrows, icons, coin glyphs and the art stay — only writing goes.
- **HUD** (`FULL / BARS ONLY / HIDDEN`) gates the DOM overlay. BARS ONLY keeps bars, pips, rings,
  icons and the map widget but strips every word and digit (the coin badge and the dash ring shrink
  to `font-size: 0`, so the shape survives without its number); HIDDEN hides the whole overlay
  except the pause button, so a run can never trap you without a way out.

Both apply mid-run, both are remembered across reloads, and the sim keeps producing the words either
way — only the painting is switched off, so nothing about damage numbers or combo scoring changes
underneath. `WORDS = NO TEXT` + `HUD = BARS ONLY` is the recommended pairing for a screen with no
writing on it at all; HOW TO PLAY explains both dials in a CLEAN SCREEN row.

Regression locks: `render.test.ts [9]` renders one busy frame (floats, boss intro, door signs,
nameplate, wayfinder, dance multiplier) in all three WORDS modes and asserts the canvas ops *and*
the cached-label blits drop, the canvas state stays balanced, and the sim is untouched; flipping the
dials mid-run cannot throw. `tools/browser/clean.mjs` proves it in Chromium: the bright-pixel box
around the runner goes to zero under NO TEXT while `g.texts` still carries the word, the overlay
strips down stage by stage, the pause button survives HUD = HIDDEN and still opens the panel, and a
reload remembers the choice.

### Harness fixes found on the way
- `world.mjs`'s wander now refuses boon cards mid-walk: a card popping pauses the sim, and the tile
  counter used to read that as the runner being stuck against a wall.
- `clean.mjs` seeds localStorage only when it is empty (a reload has to find what the *app* wrote,
  or the persistence check only tests the seed), and counts an element as hidden when it has no
  layout box — a child of a `display: none` parent still reports its own computed display.
- `world-geometry.mjs` moved off the 1280×720 @ DPR-2 viewport: swiftshader never makes clicks
  actionable there, so the PLAY button timed out.

## The foundation row, the wardrobe, and the marquee dials

### 56 stages: the boiler dark under the vaults
A fifth row was dug under the foundation: **12 more hand-authored screens (acts 45..56)**, walked
east from `THE UNDERTENT` to `THE WINDING ROOM`, so the slab is now stepped **12 / 11 / 10 / 11 / 12**
and the HUD widget reads **60 cells, 4 voids**. The row brought its own dressing with it — two new
prop painters, `boiler` (riveted shell, twitching pressure gauge, breathing firebox glow, a steam
puff on its own clock) and `chains` (a swaying curtain of hooks off the joists) — taking the set to
**34 painters / 318 hand-placed props**. Biomes were picked so no two touching screens (including
vertically) share an art set, and the row's hazards override upward (`saw`, `wisp`, `lava`,
`spinner`) with pressure up to 2.4. `world.mjs` now teleports to both ends of the foundation, reads
the `ACT 56/56` caption, and fires every loadout gun down there.

### Two more cast members, and a wardrobe for all five
**COCO CABARET** (the Diva — burst damage, glass knees, a broad brim and a plume) and **RUSTY RIVET**
(the Tinker — fast hands, a spare shield plate, a riveted helm with goggles) join the bill with
their own rigs, stats and portraits; no two cast members share a stat line. Every cast member now
owns **four skins** (`HOUSE` plus three outfits, the gold `ENCORE` look locked behind beating any
Ringmaster): a skin recolours head, clothes, hat and hat-detail in the painter *and* the menu
portrait, is picked from a WARDROBE rack under the CAST list, persists in the prefs blob, and
re-dresses the runner live if he is already on the boards.

### UX: the marquee dials and the sections that stay
- Four **one-tap dials** (WORDS · HUD · ART · SOUND) sit on the title block *and* the pause panel,
  so the CLEAN SCREEN settings are one tap away instead of a scroll through OPTIONS. They cycle.
- Menu tabs carry **count badges** (CAST 5 · ARMORY 34 · CHARMS 8 · BESTIARY n), and every section
  stays: CAST, ARMORY, CHARMS, BESTIARY, HOW TO PLAY — plus **PORBO'S STALL**, his standing menu
  with tonight's prices, now readable from the ARMORY tab instead of only in-run.
- Small themed polish: tabs answer hover, the kicker bulb chases, dials and skin chips lift under
  the pointer, paper-and-ink styling on every new block so nothing looks bolted on.

### Small details, big impact
The micro-pass: guns with a breach **throw a brass casing** that tumbles and falls (kazoos, harps
and candles politely do not); every shot carries a **muzzle flash shaped by its family** — an
eight-point star for rifles, three opening cones for blast guns, twin arcs for the sound weapons —
gone in a blink; the runner kicks **footstep dust** every fourth stride; and coins on the boards
**glint** on their own clock so a pile of them reads as treasure, not buttons. All of it is pooled
(the casing is a puff with a `shell` flag), so nothing grows the heap.

### Three more guns, none of them alike
The armory goes to **37 weapons** with three that own mechanics nobody else has: **THE TICKET
LANCE** (a single rail that pierces the whole room, drawn as a punched ticket on a light-rail),
**THE SPRINKLER SAINT** (every pull opens radially into ten droplets — there is no safe side, and
the droplets are teardrops, not pellets) and **VIGIL CANDLE** (places a burning candle whose light
ring keeps biting anything standing in it — area denial, not a projectile). Each has its own EX
(Last Train / Monsoon / Last Rites), its own shake weight and its own painter branch, and a new
feature check asserts that **no two weapons in the game share a rate/damage/speed/shots/spread/trait
line** — the armory is not three guns in trench coats.

Verification: **358 checks** (62 sim / 260 features / 36 render), build 625.41 kB gzip 190.06, and
all ten Chromium harnesses clean — including the new foundation, wardrobe and gun assertions.
