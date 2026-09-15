import { createState, update } from "../src/game/engine";
import { WEAPON_KEYS } from "../src/game/data";
import { render, setPostEnabled } from "../src/game/render";
import type { Input } from "../src/game/types";

const calls = new Map<string, number>();
const bump = (n: string) => calls.set(n, (calls.get(n) || 0) + 1);
function makeCtx(canvas: any) {
  const store: any = { canvas }; const gr = { addColorStop() {} };
  return new Proxy({}, {
    get(_t, p: string) {
      if (p === "canvas") return canvas;
      if (p.startsWith("create")) return () => { bump(p); return gr; };
      if (p === "measureText") return () => ({ width: 42 });
      if (p in store) return store[p];
      return (..._a: unknown[]) => { bump(p); };
    },
    set(_t, p: string, v) { store[p] = v; return true; },
  });
}
const mkCanvas = () => { const c: any = { width: 1280, height: 720, style: {} }; c.getContext = () => makeCtx(c); c.addEventListener = () => {}; return c; };
(globalThis as any).document = { createElement: () => mkCanvas() };
(globalThis as any).Path2D = class { constructor(_d?: string) { bump("Path2D"); } };
setPostEnabled(true);
const scene = mkCanvas(), ctx = scene.getContext();
const W = 1280, H = 720, STEP = 1 / 120;
const inp: Input = { mx: 0, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire: false, swap: false, interact: false };

function probe(label: string, seconds: number, lowFx: boolean) {
  const g = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo");
  g.lowFx = lowFx;
  for (let i = 0; i < 60 * seconds; i++) { update(g, inp, STEP, W, H); g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false; }
  calls.clear();
  const N = 300; const t0 = performance.now();
  for (let i = 0; i < N; i++) render(ctx, g, W, H, i * 16);
  const ms = (performance.now() - t0) / N;
  const total = [...calls.values()].reduce((a, b) => a + b, 0);
  const top = [...calls.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k}:${Math.round(v / N)}`).join(" ");
  console.log(`${label.padEnd(34)} ${ms.toFixed(2)} ms/frame  ${Math.round(total / N)} canvas ops/frame  creeps=${g.enemies.length} puffs=${g.puffs.length} bullets=${g.bullets.length} hazards=${g.hazards.length}`);
  console.log(`   top ops → ${top}`);
}
probe("light load (10 s)", 10, false);
probe("medium load (60 s)", 60, false);
probe("heavy load (150 s, no firing)", 150, false);
probe("heavy load + LOW FX", 150, true);
