/**
 * Headless render smoke test.
 * The renderer is pure Canvas2D, so we stub the 2D context with a Proxy that accepts
 * every call and then drive the REAL render() across every enemy kind, hazard kind,
 * weapon, pickup, charm and character. This catches undefined access / typos in the
 * draw paths that TypeScript cannot see (canvas APIs are all `any`-ish at runtime).
 *
 *   npx esbuild tests/render.test.ts --bundle --platform=node --format=esm --outfile=/tmp/rt.mjs && node /tmp/rt.mjs
 */
import { createState, update } from "../src/game/engine";
import { BIOMES, CHARACTER_KEYS, CHARACTERS, CHARM_KEYS, ENEMY_KEYS, WEAPON_KEYS } from "../src/game/data";
import { render, setFxOpts, setPostEnabled } from "../src/game/render";
import type { Enemy, EnemyKind, GameState, HazardKind, Input, PickupKind, WeaponKey } from "../src/game/types";

// ---------------------------------------------------------------- canvas stub
const calls = new Map<string, number>();
const bump = (n: string) => calls.set(n, (calls.get(n) || 0) + 1);

function makeCtx(canvas: any) {
  const store: Record<string | symbol, any> = { canvas };
  const gradients = { addColorStop() {} };
  const target: any = {};
  return new Proxy(target, {
    get(_t, prop: string) {
      if (prop === "canvas") return canvas;
      if (prop === "createLinearGradient" || prop === "createRadialGradient" || prop === "createPattern") return () => { bump(String(prop)); return gradients; };
      if (prop === "measureText") return () => ({ width: 42 });
      if (prop === "getImageData") return () => ({ data: new Uint8ClampedArray(4) });
      if (prop in store) return store[prop];
      // everything else is a draw call
      return (..._args: unknown[]) => { bump(String(prop)); };
    },
    set(_t, prop: string, value) { store[prop] = value; return true; },
  });
}

function makeCanvas(): any {
  const c: any = { width: 1280, height: 720, style: {} };
  c.getContext = () => makeCtx(c);
  c.addEventListener = () => {};
  return c;
}

(globalThis as any).document = { createElement: () => makeCanvas() };
(globalThis as any).Path2D = class { constructor(_d?: string) { bump("Path2D"); } };
(globalThis as any).window = { devicePixelRatio: 1 };

// ------------------------------------------------------------------- harness
let failures = 0, checks = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  checks++;
  if (!cond) { failures++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
  else console.log(`  pass  ${name}${detail ? ` — ${detail}` : ""}`);
};

const W = 1280, H = 720, STEP = 1 / 120;
const mkInput = (): Input => ({ mx: 0, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire: true, swap: false, interact: false });

const fresh = (weapon: WeaponKey = "popper", charm = CHARACTERS.milo ? "smoke" as const : "smoke" as const, character = "milo" as const): GameState =>
  createState(W, H, [weapon, "choir"], charm, [...WEAPON_KEYS], character);

function mkEnemy(g: GameState, kind: EnemyKind, x: number, y: number): Enemy {
  const e = {
    id: g.id++, kind, x, y, hp: 999, maxHp: 999, r: 20, speed: 40, phase: Math.random() * 9, cooldown: 1,
    attack: 0.5, hit: 0.08, pink: kind === "bloat", size: 1, hidden: false, airborne: kind === "nut" ? 0.6 : 0,
    vx: 12, vy: 8, counter: 2, pattern: 1, spawnT: 3, burn: 1, slow: 1, elite: false, blink: -0.05, frozen: 0,
    alpha: 1, revived: false, buffed: 3, rooted: 0, facingA: 0.4, stun: 1, slippery: 1,
  } as unknown as Enemy;
  if (kind === "eel") e.segments = Array.from({ length: 9 }, (_, i) => ({ x: x - i * 12, y }));
  if (kind === "candle" || kind === "puppet" || kind === "siren") e.anchor = { x, y: y - 40 };
  if (kind === "organ") e.lanes = [{ x: x - 120, t: 0.5 }, { x, t: 0.2 }, { x: x + 120, t: 0.9 }];
  if (kind === "boss") { e.bossName = "The Ringmaster"; e.bossPhase = 2; e.maxBossPhase = 3; e.r = 50; e.volley = [{ t: 0.1, n: 0, color: "#ffb347", dmg: 12, speed: 340, pink: true }]; }
  return e;
}

setPostEnabled(true);
const scene = makeCanvas();
const ctx = scene.getContext();

// ------------------------------------------------ every enemy, elite + status
console.log("\n[1] Every creep renders (normal, elite, frozen, burning, stunned)");
{
  const g = fresh();
  const errors: string[] = [];
  try {
    let i = 0;
    for (const kind of [...ENEMY_KEYS, "boss" as EnemyKind]) {
      g.enemies.length = 0;
      g.enemies.push(mkEnemy(g, kind, 400 + (i % 3) * 200, 320 + Math.floor(i / 3) * 90));
      const el = mkEnemy(g, kind, 900, 500); el.elite = true; el.frozen = 2; el.burn = 2; el.slow = 2; el.buffed = 3;
      g.enemies.push(el);
      for (let f = 0; f < 4; f++) render(ctx, g, W, H, f * 83 + i * 11);
      i++;
    }
  } catch (err) { errors.push(String(err)); }
  ok(`all ${ENEMY_KEYS.length + 1} creep types draw`, errors.length === 0, errors[0] || "");
}

// ------------------------------------------------------- every stage hazard
console.log("\n[2] Every stage hazard renders, telegraphed and live");
{
  const g = fresh();
  const kinds: HazardKind[] = ["lava", "steam", "saw", "lightning", "wisp", "spinner", "glaze", "geyser", "pendulum", "tomb", "pillar"];
  const errors: string[] = [];
  try {
    for (const kind of kinds) {
      g.hazards.length = 0;
      g.hazards.push({ x: 300, y: 420, r: 44, kind, timer: 0.1, active: false, warn: 0.9, life: 2, max: 2, angle: 0.7, pivot: { x: 300, y: 200 }, arm: 170, phase: 1.2, hit: false });
      g.hazards.push({ x: 800, y: 480, r: 34, kind, timer: 1.6, active: true, warn: 0.9, life: 0.6, max: 2, angle: 2.1, pivot: { x: 800, y: 200 }, arm: 170, phase: 2.4, hit: true });
      for (let f = 0; f < 3; f++) render(ctx, g, W, H, f * 83);
    }
  } catch (err) { errors.push(String(err)); }
  ok(`all ${kinds.length} hazard types draw`, errors.length === 0, errors[0] || "");
}

// -------------------------------------------------- every weapon in hand+air
console.log("\n[3] Every weapon renders in hand and in flight");
{
  const errors: string[] = [];
  for (const wk of WEAPON_KEYS) {
    try {
      const g = fresh(wk);
      const inp = mkInput();
      for (let i = 0; i < 400; i++) {
        inp.aim = { x: g.player.x + 200, y: g.player.y - 40 };
        if (i === 200) { g.player.cards = 5; inp.ex = true; } else inp.ex = false;
        if (i === 300) { g.player.cards = 5; inp.superMove = true; } else inp.superMove = false;
        update(g, inp, STEP, W, H);
        g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false;
        render(ctx, g, W, H, i * 16);
      }
    } catch (err) { errors.push(`${wk}: ${err}`); }
  }
  ok(`all ${WEAPON_KEYS.length} weapons draw`, errors.length === 0, errors.join(" | "));
}

// --------------------------------------------------------- every pickup kind
console.log("\n[4] Every pickup renders");
{
  const g = fresh();
  const kinds: PickupKind[] = ["heart", "coin", "bulb", "weapon", "rapid", "shield", "bomb", "clock", "star", "magnet", "wind", "decoy", "fireworks", "nuke", "goldbar", "mirror", "bees", "grease"];
  const errors: string[] = [];
  try {
    g.pickups.length = 0;
    kinds.forEach((kind, i) => g.pickups.push({ x: 120 + (i % 6) * 190, y: 300 + Math.floor(i / 6) * 110, kind, life: 8, phase: 1.4, weapon: "popper" }));
    for (let f = 0; f < 4; f++) render(ctx, g, W, H, f * 83);
  } catch (err) { errors.push(String(err)); }
  ok(`all ${kinds.length} pickup types draw`, errors.length === 0, errors[0] || "");
}

// ----------------------------------------------- every biome, charm, character
console.log("\n[5] Every biome, charm and character renders");
{
  const errors: string[] = [];
  for (let b = 0; b < BIOMES.length; b++) {
    for (const ch of CHARACTER_KEYS) {
      for (const charm of CHARM_KEYS) {
        try {
          const g = createState(W, H, ["popper", "choir"], charm, [...WEAPON_KEYS], ch);
          g.biome = b;
          g.companions.push({ x: 400, y: 420, vx: 0, vy: 0, target: -1, bite: 0, life: 5, max: 5, facing: 1, hop: 1, dmg: 10 });
          g.companions.push({ x: 500, y: 460, vx: 0, vy: 0, target: -1, bite: 0, life: 5, max: 5, facing: -1, hop: 2, dmg: 5, bee: true });
          g.puddles.push({ x: 700, y: 500, r: 40, life: 3, max: 3, kind: "syrup" });
          g.puddles.push({ x: 900, y: 520, r: 40, life: 3, max: 3, kind: "grease" });
          const inp = mkInput();
          for (let f = 0; f < 20; f++) { update(g, inp, STEP, W, H); render(ctx, g, W, H, f * 83); g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false; }
        } catch (err) { errors.push(`${BIOMES[b].name}/${ch}/${charm}: ${err}`); }
      }
    }
  }
  ok(`${BIOMES.length} biomes × ${CHARACTER_KEYS.length} cast × ${CHARM_KEYS.length} charms`, errors.length === 0, errors.slice(0, 3).join(" | "));
}

// ------------------------------------------------------------ real gameplay
console.log("\n[6] Full simulated run renders every frame");
{
  const g = fresh();
  const inp = mkInput();
  const errors: string[] = [];
  let frames = 0;
  try {
    for (let i = 0; i < 60 * 90; i++) {
      inp.mx = Math.sin(i / 40); inp.my = Math.cos(i / 55);
      if (i % 90 === 0) inp.dash = true;
      if (i % 137 === 0) inp.parry = true;
      update(g, inp, STEP, W, H);
      g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false;
      if (i % 2 === 0) { render(ctx, g, W, H, i * 16); frames++; }
    }
  } catch (err) { errors.push(String(err)); }
  ok(`90 s run · ${frames} frames drawn`, errors.length === 0, errors[0] || "");
  ok("canvas state balanced (save === restore)", (calls.get("save") || 0) === (calls.get("restore") || 0), `save=${calls.get("save")} restore=${calls.get("restore")}`);
  ok("actually issued draw calls", (calls.get("fill") || 0) > 10000, `fill=${calls.get("fill")} stroke=${calls.get("stroke")} drawImage=${calls.get("drawImage")}`);
  ok("beginPath paired with a shape", (calls.get("beginPath") || 0) > 5000, `beginPath=${calls.get("beginPath")}`);
}

// ------------------------------------------------ one giant map: seams, gates, dissolve
console.log("\n[7] Walking the whole strip renders every seam");
{
  const errors: string[] = [];
  const g = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", BIOMES.length);
  const inp = mkInput();
  const s0 = calls.get("save") || 0, r0 = calls.get("restore") || 0;
  try {
    for (let i = 0; i < 60 * 40; i++) {
      inp.mx = 1;                                     // actually walk it, don't teleport the save balance out of sync
      update(g, inp, STEP, W, H);
      g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false;
      if (i % 2 === 0) render(ctx, g, W, H, i * 16);
    }
  } catch (err) { errors.push(String(err)); }
  const ds = (calls.get("save") || 0) - s0, dr = (calls.get("restore") || 0) - r0;
  ok("40 s walking every district seam draws clean", errors.length === 0, errors[0] || "");
  ok("district walk is canvas-balanced", ds === dr, `save=${ds} restore=${dr}`);
  ok("and the walk really crossed into later stages", g.biome > 1 && g.cam.x > 100, `biome=${g.biome} cam=${g.cam.x.toFixed(0)} x=${g.player.x.toFixed(0)}`);
}

// ------------------------------------------------ the authored world, dressed, in every art style
console.log("\n[8] The authored map paints, and every art style keeps the canvas balanced");
{
  const styles = ["ink", "toon", "noir", "riso", "pixel"];
  for (const st of styles) {
    setFxOpts({ style: st as never, dressing: true, speedlines: true, contrast: false });
    const g = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", undefined, undefined, "gigantic");
    const inp = mkInput();
    const s0 = calls.get("save") || 0, r0 = calls.get("restore") || 0;
    const errs: string[] = [];
    try {
      for (let i = 0; i < 260; i++) {
        inp.mx = i % 7 < 5 ? 1 : -1; inp.my = i % 3 === 0 ? 1 : 0;
        update(g, inp, STEP, W, H);
        g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false;
        if (i % 2 === 0) render(ctx, g, W, H, i * 16);
      }
      // and the undercroft, where the map runs out and the torn margin has to be painted
      g.player.x = 9.7 * (g.worldW / g.districts); g.player.y = 2.6 * (g.worldH / g.rows);
      update(g, inp, STEP, W, H); render(ctx, g, W, H, 9999);
    } catch (err) { errs.push(String(err)); }
    const ds = (calls.get("save") || 0) - s0, dr = (calls.get("restore") || 0) - r0;
    ok(`style "${st}" draws the whole show without throwing`, errs.length === 0, errs[0] || "");
    ok(`style "${st}" is canvas-balanced`, ds === dr, `save=${ds} restore=${dr}`);
    ok(`style "${st}" actually painted the set dressing`, (calls.get("fill") || 0) > 200, `fill=${calls.get("fill")}`);
  }
  // dressing off must not stop the painter, and it must draw fewer things
  setFxOpts({ style: "ink" as never, dressing: false });
  const g = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", undefined, undefined, "alley");
  const inp = mkInput();
  for (let i = 0; i < 60; i++) { update(g, inp, STEP, W, H); render(ctx, g, W, H, i * 16); }
  const withDressing = (calls.get("arc") || 0) > 0;
  ok("the alley renders with dressing off", withDressing, "no arcs at all?");
  setFxOpts({ style: "ink" as never, dressing: true });
}

// ---------------------------------------------------------------------------
console.log("\n[9] Clean screen — the show can be told to stop talking");
{
  const total = () => { let n = 0; for (const v of calls.values()) n += v; return n; };
  /** a frame with every kind of writing on it: pops, a boss card, door signs, a nameplate, a
   *  wayfinder count and the dance multiplier */
  const noisy = (): GameState => {
    const g = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "bulletdance", undefined, undefined, "gigantic");
    const inp = mkInput();
    for (let i = 0; i < 20; i++) update(g, inp, STEP, W, H);
    g.player.x = 1.02 * (g.worldW / g.districts);                    // astride a doorway, so the signs are in shot
    g.cam.x = Math.max(0, Math.min(g.worldW - W, g.player.x - W / 2));
    g.texts.length = 0;
    const words = ["SIGNATURE!", "+120", "LUCKY!", "KNOCKOUT!", "HOT!", "BACK TO YOU!"];
    words.forEach((text, i) => g.texts.push({ x: g.player.x - 200 + i * 80, y: g.player.y - 60 - i * 12, text, life: .8, max: .9, color: "#ffd75a", rot: .1, big: i === 0 }));
    g.bossIntro = { name: "THE RINGMASTER", title: "ACT THREE", quote: "Dance, little clown.", life: 3 };
    g.pickups.push({ x: g.player.x + 120, y: g.player.y, kind: "weapon", life: 12, phase: 1, weapon: "mortar", fresh: false });
    g.enemies.push(mkEnemy(g, "daisy", g.player.x + 3000, g.player.y));   // off screen: the wayfinder chevron talks
    g.dance.streak = 20; g.dance.heat = 1.4;
    return g;
  };
  const g = noisy();
  const measure = (mode: "all" | "quiet" | "none") => {
    setFxOpts({ style: "ink" as never, dressing: true, speedlines: true, contrast: false, text: mode as never });
    render(ctx, g, W, H, 1000);                                  // warm the label cache for this mode
    const s0 = calls.get("save") || 0, r0 = calls.get("restore") || 0, f0 = calls.get("fillText") || 0, i0 = calls.get("drawImage") || 0, t0 = total();
    render(ctx, g, W, H, 1000);
    return {
      ops: total() - t0, text: (calls.get("fillText") || 0) - f0, blits: (calls.get("drawImage") || 0) - i0,
      balanced: (calls.get("save") || 0) - s0 === (calls.get("restore") || 0) - r0,
    };
  };
  const all = measure("all"), quiet = measure("quiet"), none = measure("none");
  ok("the busy frame really is busy", all.ops > 400 && all.text >= 3, `${all.ops} ops, ${all.text} fillText`);
  // the floating words are rasterised once and blitted, so QUIET shows up as fewer blits
  ok("QUIET drops the floating words and paints less", quiet.ops < all.ops && quiet.blits < all.blits, `${quiet.ops} ops / ${quiet.blits} blits vs ${all.ops} / ${all.blits}`);
  ok("and it drops exactly the six pops that were in the air", all.blits - quiet.blits >= 6, `${all.blits - quiet.blits} fewer blits`);
  ok("NO TEXT drops every word on the stage", none.text < quiet.text && none.ops < quiet.ops, `${none.ops}/${none.text} vs ${quiet.ops}/${quiet.text}`);
  ok("…and it still paints the show", none.ops > 200, `${none.ops} ops`);
  ok("all three text modes stay canvas-balanced", all.balanced && quiet.balanced && none.balanced, `${all.balanced}/${quiet.balanced}/${none.balanced}`);
  ok("hiding the words never touches the sim", g.texts.length === 6 && g.bossIntro !== null && g.pickups.length > 0, `${g.texts.length} texts`);
  setFxOpts({ text: "all" as never });
  // and the painter accepts the switch mid-run, which is how the options panel uses it
  const live = noisy();
  let threw = "";
  try {
    for (let i = 0; i < 90; i++) {
      update(live, mkInput(), STEP, W, H);
      live.over = false; live.player.health = live.player.maxHealth;
      setFxOpts({ text: (["all", "quiet", "none"] as const)[i % 3] as never });
      render(ctx, live, W, H, i * 16);
    }
  } catch (err) { threw = String(err); }
  ok("flipping WORDS mid-run never throws", threw === "", threw);
  setFxOpts({ text: "all" as never });
}

console.log(`\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ""}`);
process.exit(failures ? 1 : 0);
