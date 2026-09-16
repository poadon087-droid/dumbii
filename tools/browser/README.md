# browser tools

These are the checks that a headless node test cannot do: they drive the built page in Chromium and
look at real pixels, real focus, real touch. They are not part of `npm test` (CI has no browser) —
run them against a preview server:

```bash
npm run build && npm run preview      # serves the single-file build on :4173
node tools/browser/smoke.mjs          # boot → options → play → stunt → death letter
node tools/browser/world.mjs          # the authored map: route, edges, margin, art styles
node tools/browser/world-geometry.mjs # walking rows and columns, live map switching
node tools/browser/walkway.mjs        # the gangway and the doorway dissolve
node tools/browser/hud.mjs            # sections, danger state, pause letter, mobile controls
node tools/browser/touch.mjs          # thumb-stick geometry: nothing may overlap, aiming must fire
node tools/browser/robustness.mjs     # focus loss, gamepad, context loss, no emoji, no clipped text
node tools/browser/visual.mjs         # dialog focus, session prefs, key-map truthfulness, mobile
node tools/browser/clean.mjs          # CLEAN SCREEN: WORDS + HUD dials, pixels gone, sim untouched
node tools/browser/fuzz.mjs           # 45 s of random keys/mouse/touch/pad/resize with state invariants
```

Every tool opens the page at `http://localhost:4173/#debug` — the debug handle only exists with
`#debug`, which keeps it out of the shipped game. Override with `RR_URL=...`. Screenshots land in
`shots/` (gitignored). A tool prints `ok`/`BUG` lines and `errors: none`; exit code 0 means clean.
