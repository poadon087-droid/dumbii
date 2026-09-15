# Rubber Requiem — suggestion list (with status)

Written 2026-09-12 after a full pass over the codebase. Status updated the same day as items were completed.

**Correction:** item #10 originally claimed "no touch input at all" — that was wrong. Verified in `App.tsx`: a virtual joystick (`joy` ref merged into `inp.mx/my`) plus FIRE / DASH / PARRY / EX / AUTO / SUPER buttons already exist behind a `pointer: coarse` check. Nothing to build there.

## Done ✅

1. **Meta description** — `dev.html` now says 34 weapons / 34 creeps / 11 biomes (was 29/29/9); rebuilt into `index.html`.
2. **Weapon audio** — 11 missing `shoot:*` cues added (peel, kazoo, barrel, syrup, whistle, umbrella, grapple, slots, paint, pie, stamp), reusing the existing sample pool with distinct pitches, so no new network assets.
3. **Auto-pause on tab-away** — `visibilitychange` listener pauses a live run when the tab hides.
4. **New-creep/hazard SFX** — bolt strikes now fire the `laser` cue (skunk/strong/usher/magnet already emitted `thud`/`charge`/`boom` events; verified).
5. **Weapon synergies** — three combos, each with a feature test:
   - *Cream Pie + Postage Stamp* — parcels detonate ×1.5 on pie-blinded creeps ("SPECIAL DELIVERY!").
   - *Charged Thunder Kettle + Polka Paint* — a full-charge bolt detonates the paint in a 140px INK NOVA.
   - *Hookshot Cane + Barrel Roll* — kegs land ×1.5 harder while the hook is reeling.
13. **README** — added: what it is, how to play/build/test, controls, layout, credits.
15. **Offline audio** — verified already handled: every cue has a synthesized fallback and the music has a built-in big-band synth when the network track fails. Nothing to do.
16. **`npm run check`** — one command for `tsc && test && build`.

## Still open

6. **Elite affixes** ✅ DONE — painted / mirror / swift, tinted crowns — the `e.elite` flag exists but is shallow; rolling modifiers (painted-aura, mirror-shell, speed-burst) with a visible crown and +score.
7. **Boss phases reuse new creeps** ✅ DONE — phase 2 mirror shell, phase 3 phasing + magnet crown — Ringmaster phase 2/3 could borrow disco deflection, usher phasing, magnet shot-bending.
8. **Daily seeded run** ✅ DONE — DAILY REEL button, per-day best, fixed modifier — fixed modifier + biome order via the 9 existing MODIFIERS; best score in localStorage.
9. **Charm/character unlock conditions** ✅ DONE — 4 achievements; Barnaby + Wet Varnish gated — gate a few behind achievements ("parry 50 shots", "beat a boss with Barnaby").
11. **`prefers-reduced-motion`** ✅ DONE — Calm FX toggle, auto-on with the OS flag — honor the OS flag for shake/flicker/curvature; `q.shaders`/`q.lowFx` are the hooks.
12. **Key remapping** ✅ DONE — pause-menu remap grid, persisted — small table persisted in localStorage.
14. **Split the monoliths** ✅ DONE — pure move-refactor into 10 focused modules (util, fx, spawn, combat, weapons, hazards, companions, economy, achievements, scenery); engine.ts 2,177 → ~1,080 lines, render.ts 1,253 → ~1,030; all 145 checks green before and after — `engine.ts` (~2,150 lines) and `render.ts` (~1,240) into focused modules; pure move-refactor guarded by the 136 checks.
17. **Shake "weight classes"** ✅ DONE — per-weapon shake table
18. **Combo title cards** ✅ DONE — 10/25/50/100 callouts
19. **More animated decor** ✅ DONE — rooftop laundry, library candles
20. **Per-run stats** ✅ DONE — accuracy + favorite weapon on the curtain-call screen

**The full list is now built.** Every item — including the module split — is done, test-guarded (145 checks) and shipped in the single-file build.
