/** Leaf module: shared math, world bounds and the enemy spatial index. Imports only types. */
import type { Enemy, GameState, Point } from "./types";

export const HORIZON = 0.3;
export const TAU = Math.PI * 2;
export const rnd = (a = 1, b?: number) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function compact<T>(arr: T[], keep: (v: T) => boolean) {
  let j = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (keep(v)) arr[j++] = v;
  }
  arr.length = j;
}

const CELL = 96;
const grid = new Map<number, Enemy[]>();
const gridPool: Enemy[][] = [];
/** O(1) enemy lookup — partner/pet/summon resolution used to walk the whole array every frame. */
export const byId = new Map<number, Enemy>();
const cellKey = (cx: number, cy: number) => (cx + 512) * 4096 + (cy + 512);

export function buildGrid(enemies: Enemy[]) {
  for (const b of grid.values()) { b.length = 0; gridPool.push(b); }
  grid.clear(); byId.clear();
  for (const e of enemies) {
    byId.set(e.id, e);
    const cx = Math.floor(e.x / CELL), cy = Math.floor(e.y / CELL);
    const k = cellKey(cx, cy);
    let b = grid.get(k);
    if (!b) { b = gridPool.pop() || []; grid.set(k, b); }
    b.push(e);
  }
}

export const nearBuf: Enemy[] = [], nearBuf2: Enemy[] = [];
export function nearby(x: number, y: number, r: number, out: Enemy[] = nearBuf) {
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
export const liveBuf: Enemy[] = [];


export const bounds = (w: number, h: number) => ({ minX: 26, maxX: w - 26, minY: h * HORIZON + 26, maxY: h - 34 });
type CamState = { cam?: Point; viewW?: number; viewH?: number; rows?: number; worldH?: number };
/** The boards of the top row down to the floor of the lowest one. With a single row this is
 *  exactly bounds(), so the original one-screen arena is untouched. */
export const worldBounds = (g: CamState, w: number, h: number) => {
  const b = bounds(w, h);
  return (g.rows ?? 1) > 1 ? { ...b, maxY: (g.worldH ?? h) - 34 } : b;
};
/** The top of the field as the camera sees it: the horizon line on one screen, the top of the
 *  view when rows of stages are stacked — so things fall in from just out of sight, never from orbit. */
export const fieldTop = (g: CamState, h: number) =>
  (g.rows ?? 1) > 1 ? Math.max(0, g.cam?.y ?? 0) + 24 : h * HORIZON;
/** Where new creeps, hazards and prizes may appear: the visible window plus a margin, clamped into
 *  the world. On a one-screen stage this is the whole arena, exactly as before. */
export const viewBand = (g: CamState, w: number, h: number) => {
  const b = worldBounds(g, w, h);
  if (!g.cam) return b;
  const vw = g.viewW && g.viewW > 120 ? Math.min(g.viewW, w) : w;
  const wh = Math.max(h, g.worldH ?? h);
  const vh = g.viewH && g.viewH > 120 ? Math.min(g.viewH, wh) : h;
  const x0 = Math.max(0, Math.min(w - vw, g.cam.x));
  const y0 = Math.max(0, Math.min(wh - vh, g.cam.y));
  return {
    minX: Math.max(b.minX, x0 - 80), maxX: Math.min(b.maxX, x0 + vw + 80),
    minY: Math.max(b.minY, y0 - 80), maxY: Math.min(b.maxY, y0 + vh + 80),
  };
};

/** Effect pools that grow under heavy fire. A runaway pool is how a browser tab dies, so the
 *  engine trims the oldest entries the moment a ceiling is crossed. */
export const POOL_CAPS: Record<string, number> = {
  bullets: 480, pickups: 90, ghosts: 80, texts: 60, puddles: 120, companions: 24, hazards: 60, puffs: 460,
};
const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * One bad frame (a division by a viewport that measured 0, a stale pointer delta, a corrupted
 * save) used to poison the run silently: cam went NaN and everything vanished off screen while
 * the game kept "playing". This repairs the numbers the camera, the field and the HUD read from,
 * bounds every effect pool, and returns a list of what it had to fix so a probe can assert it.
 */
export function sanitize(g: GameState): string[] {
  const fixed: string[] = [];
  // clamp, never replace: a cooldown that has decayed a hair below zero is normal play, while a
  // gumption bar reading 4000 or NaN is a broken run. Only meaningful damage is reported.
  const keep = (name: string, v: number, lo: number, hi: number, fallback: number) => {
    if (!fin(v)) { setNum(name, fallback); fixed.push(name); return; }
    if (v < lo || v > hi) {
      setNum(name, Math.max(lo, Math.min(hi, v)));
      if (v < lo - 1 || v > hi + 1) fixed.push(name);
    }
  };
  const setNum = (name: string, v: number) => {
    const [a, b] = name.split(".");
    (g as unknown as Record<string, Record<string, number>>)[a][b] = v;
  };
  const p = g.player, cam = g.cam;
  // NOTE the bounds are only used to put a poisoned runner back on the boards — the engine's own
  // clamps stay in charge of normal out-of-range play (a dash into a wall, a fall off the map).
  const ww = Math.max(1, g.worldW || g.viewW || 1), vh = Math.max(1, g.viewH || 1);
  const b = worldBounds(g, ww, vh);
  // never move a healthy runner: only a value that cannot be real gets rewritten, so the feel
  // (dash lunges, wall slams, screen crossings) is untouched
  if (!fin(p.x) || Math.abs(p.x) > 1e7) { p.x = (b.minX + b.maxX) / 2; fixed.push("player.x"); }
  if (!fin(p.y) || Math.abs(p.y) > 1e7) { p.y = (b.minY + b.maxY) / 2; fixed.push("player.y"); }
  keep("player.health", p.health, 0, p.maxHealth || 100, p.maxHealth || 100);
  keep("player.maxHealth", p.maxHealth, 1, 1e4, 100);
  keep("player.r", p.r, 4, 200, 16);
  keep("player.speed", p.speed, 0, 4000, 240);
  keep("player.angle", p.angle, -1e3, 1e3, 0);
  keep("player.momentum", p.momentum, 0, 4000, 0);
  keep("player.dashCd", p.dashCd, 0, 60, 0);
  keep("player.cards", p.cards, 0, 5, 0);
  keep("player.coins", p.coins, 0, 1e9, 0);
  keep("player.charge", p.charge, 0, 2, 0);
  keep("player.trigger", p.trigger ?? 0, 0, 1, 0);
  const cw = Math.max(1, g.worldW || ww), ch = Math.max(1, g.worldH || vh);
  if (!fin(cam.x) || cam.x < -1e7 || cam.x > cw + 1e7) { cam.x = 0; fixed.push("cam.x"); }
  if (!fin(cam.y) || cam.y < -1e7 || cam.y > ch + 1e7) { cam.y = 0; fixed.push("cam.y"); }
  if (!fin(g.score) || g.score < 0) { g.score = Math.max(0, Math.round(fin(g.score) ? g.score : 0)); fixed.push("score"); }
  if (!fin(g.combo) || g.combo < 0) { g.combo = 0; fixed.push("combo"); }
  if (!fin(g.elapsed) || g.elapsed < 0) { g.elapsed = 0; fixed.push("elapsed"); }
  if (!fin(g.shake) || g.shake < 0) { g.shake = 0; fixed.push("shake"); }
  if (!fin(g.flash) || g.flash < 0) { g.flash = 0; fixed.push("flash"); }
  if (!fin(g.worldW) || g.worldW <= 0) { g.worldW = (g.viewW || 1) * Math.max(1, g.districts || 1); fixed.push("worldW"); }
  if (!fin(g.worldH) || g.worldH <= 0) { g.worldH = (g.viewH || 1) * Math.max(1, g.rows || 1); fixed.push("worldH"); }
  if (p.trail.length) { for (let i = p.trail.length - 1; i >= 0; i--) { const t = p.trail[i]; if (!fin(t.x) || !fin(t.y)) p.trail.splice(i, 1); } }
  for (const key of Object.keys(POOL_CAPS)) {
    const arr = (g as unknown as Record<string, unknown[]>)[key];
    if (!Array.isArray(arr)) continue;
    const cap = POOL_CAPS[key];
    if (arr.length > cap) { arr.splice(0, arr.length - cap); fixed.push(key); }
  }
  return fixed;
}

/** Key maps come from localStorage, and a hand-edited one must never strand a control. */
const SPARE_KEYS = ["KeyK", "KeyJ", "KeyI", "KeyO", "KeyP", "KeyU", "KeyY", "KeyH", "Digit1", "Digit2", "Digit3", "Digit4", "Numpad1", "Numpad2"];

export function mergeKeyMap<T extends Record<string, string[]>>(saved: unknown, defaults: T): T {
  const out: Record<string, string[]> = {};
  const fixed: string[] = [];
  for (const a of Object.keys(defaults)) out[a] = [...defaults[a]];
  const KEY_RE = /^(Key[A-Z]|Digit\d|Arrow(Up|Down|Left|Right)|F([1-9]|1[0-2])|Numpad\d|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Tab|Enter|Backquote|Minus|Equal)$/;
  const src = (saved && typeof saved === "object" && !Array.isArray(saved)) ? saved as Record<string, unknown> : {};
  for (const a of Object.keys(src)) {
    const codes = src[a];
    if (!(a in defaults) || !Array.isArray(codes)) continue;
    const clean = [...new Set(codes.filter((c): c is string => typeof c === "string" && KEY_RE.test(c)))];
    if (clean.length) out[a] = clean;
  }
  // one key, one action — the later action keeps it and the earlier one falls back to its default
  for (const a of Object.keys(defaults)) {
    // this action wins its keys; anything else holding them yields (and is re-armed below)
    for (const c of out[a]) {
      for (const o of Object.keys(defaults)) if (o !== a) out[o] = out[o].filter((k) => k !== c);
    }
    if (!out[a].length) {
      // nothing left in its own list — hand it the first key nobody else is holding, so a
      // remap can never mute a control outright
      const taken = new Set(Object.keys(defaults).flatMap((o) => out[o]));
      const spare = [...defaults[a], ...SPARE_KEYS].find((c) => !taken.has(c));
      out[a] = spare ? [spare] : [...defaults[a]];
      if (spare) fixed.push(a);
    }
  }
  return out as T;
}
