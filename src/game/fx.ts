/** Particles, floating text, super-card meter, pickup drops and companions. Depends on util only. */
import type { GameState, PickupKind, WeaponKey } from "./types";
import { clamp, rnd, TAU } from "./util";

const MAX_PUFFS = 420;
/** Hard ceiling — `puff`/`ring` used to push straight past MAX_PUFFS under heavy fire. */
const pushPuff = (g: GameState, q: { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number; ring?: boolean; shell?: boolean; spin?: number }) => {
  if (g.puffs.length >= MAX_PUFFS) return;
  g.puffs.push(q);
};

export const puff = (g: GameState, x: number, y: number, color: string, count = 5, force = 100, size = 5) => {
  count = Math.ceil(count * g.fxBudget);
  if (g.puffs.length > MAX_PUFFS * .8) count = Math.min(count, 2);
  for (let i = 0; i < count; i++) {
    const a = rnd(TAU), life = .25 + rnd(.35), sp = force * rnd(.3, 1);
    pushPuff(g, { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, color, size: size * rnd(.6, 1.4) });
  }
};
export const ring = (g: GameState, x: number, y: number, color: string, size: number) => pushPuff(g, { x, y, vx: 0, vy: 0, life: .35, max: .35, color, size, ring: true });
/** a spent casing out of the breach: up, back, tumbling */
export const shell = (g: GameState, x: number, y: number, dir: number) =>
  pushPuff(g, { x, y, vx: -dir * rnd(70, 150), vy: -rnd(130, 210), life: .55, max: .55, color: "#d8a838", size: 3, shell: true, spin: rnd(-4, 4) });
export const say = (g: GameState, x: number, y: number, text: string, color = "#ffe27a", big = false) => {
  if (g.texts.length < 40) g.texts.push({ x, y, text, life: .9, max: .9, color, rot: rnd(-.25, .25), big });
};
/** Small animated threat pulses for room pressure, boss reveals and stage pushes. */
export const encounterPulse = (g: GameState, x: number, y: number, color = "#f6d565", radius = 150) => {
  for (let i = 0; i < 6; i++) {
    const t = .18 + i * .16;
    pushPuff(g, { x, y, vx: 0, vy: 0, life: t, max: t, color, size: radius * (0.12 + i * 0.14), ring: true });
  }
  for (let i = 0; i < 12; i++) {
    const a = rnd(TAU), speed = rnd(20, 80);
    pushPuff(g, { x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .45 + rnd(.22), max: .5, color, size: rnd(3, 6) });
  }
};
export const addCards = (g: GameState, n: number) => { g.player.cards = clamp(g.player.cards + n, 0, 5); };
export const drop = (g: GameState, x: number, y: number, kind: PickupKind, weapon?: WeaponKey, price?: number) => {
  g.pickups.push({ x, y, kind, life: kind === "weapon" ? 22 : 12, phase: rnd(9), weapon, fresh: true, price });
};

/** Calls a rubber-hose hound (Dog Whistle) or a bee from the Jar of Bees. */
export function spawnCompanion(g: GameState, x: number, y: number, life: number, dmg: number, bee = false) {
  const cap = bee ? 12 : 3;
  if (g.companions.length >= cap) g.companions.shift();
  g.companions.push({ x, y, vx: rnd(-60, 60), vy: rnd(-60, 60), target: -1, bite: 0, life, max: life, facing: 1, hop: rnd(9), dmg, bee });
}

