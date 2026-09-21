/** Creep, boss and prize-crate spawning plus the shared enemy-shot helper. */
import { BOSS_NAMES, ENEMIES, ENEMY_KEYS, WEAPON_KEYS } from "./data";
import type { Enemy, EnemyKind, GameState, Point } from "./types";
import { clamp, dist, fieldTop, HORIZON, pick, rnd, TAU, viewBand, worldBounds } from "./util";
import { drop, encounterPulse, puff, ring, say } from "./fx";

/** Hard ceiling on live creeps. Waves, boss summons and balloon bursts can each spawn
 *  a whole group at once, so the per-tick spawn gate alone let the stage balloon past 120. */
const MAX_ENEMIES = 92;

export function spawnEnemy(g: GameState, w: number, h: number, kind?: EnemyKind, at?: Point, size = 1, elite = false) {
  const p = g.player;
  if (kind !== "boss" && g.enemies.length >= MAX_ENEMIES) return null;
  if (!kind) {
    const pool = ENEMY_KEYS.filter((k) => g.elapsed >= ENEMIES[k].unlock);
    if (!pool.length) return null;
    const total = pool.reduce((s, k) => s + ENEMIES[k].weight, 0);
    let roll = rnd(total); kind = pool[0];
    for (const k of pool) { roll -= ENEMIES[k].weight; if (roll <= 0) { kind = k; break; } }
  }
  const def = ENEMIES[kind], b = worldBounds(g, w, h), scale = 1 + g.elapsed / 210;
  // Place new creeps around the *camera*, not around the far ends of a huge world.
  const v = viewBand(g, w, h);
  const camX = g.cam ? Math.max(0, Math.min(w - (g.viewW || w), g.cam.x)) : 0, vw = g.viewW || w;
  const swarmMod = g.modifier?.id === "swarm" ? .55 : 1;
  let x = 0, y = 0;
  const stationary = kind === "cap" || kind === "hex" || kind === "jack" || kind === "turret" || kind === "phono" || kind === "totem"
    || kind === "organ" || kind === "siren";
  if (at) { x = at.x; y = at.y; }
  else if (kind === "puppet") { x = rnd(v.minX + 60, v.maxX - 60); y = fieldTop(g, h) + 40; }
  else if (kind === "bat") { x = rnd(v.minX, v.maxX); y = fieldTop(g, h) - 30; }
  else if (kind === "balloon") { x = rnd(v.minX + 60, v.maxX - 60); y = fieldTop(g, h) - 50; }
  // bounded retry: an unbounded do/while could spin forever on a cramped stage
  else if (stationary) {
    for (let tries = 0; tries < 14; tries++) {
      x = rnd(v.minX + 40, v.maxX - 40); y = rnd(v.minY + 30, v.maxY - 30);
      if (dist({ x, y }, p) >= 220) break;
    }
  }
  else if (kind === "nut") { const a = rnd(TAU), d = rnd(30, 130); x = clamp(p.x + Math.cos(a) * d, b.minX, b.maxX); y = clamp(p.y + Math.sin(a) * d, b.minY, b.maxY); }
  else if (kind === "mime") { const a = rnd(TAU); x = clamp(p.x + Math.cos(a) * 300, b.minX, b.maxX); y = clamp(p.y + Math.sin(a) * 220, b.minY, b.maxY); }
  else {
    const edge = Math.floor(rnd(4));
    // Walk in from just outside the visible window, unless the world itself ends there.
    if (edge === 0) { x = camX > 60 ? camX - 50 : -50; y = rnd(v.minY, v.maxY); }
    else if (edge === 1) { x = camX + vw < w - 60 ? camX + vw + 50 : w + 50; y = rnd(v.minY, v.maxY); }
    else if (edge === 2) { x = rnd(v.minX, v.maxX); y = fieldTop(g, h) - 60; }
    else { x = rnd(v.minX, v.maxX); y = b.maxY + 84; }
    x = clamp(x, b.minX - 60, b.maxX + 60);
  }
  if (elite) size *= 1.3;
  const affix: Enemy["affix"] = elite ? (["painted", "mirror", "swift"] as const)[Math.floor(rnd(0, 2.999))] : undefined;
  if (g.modifier?.id === "giant") size *= 1.4;
  const hp = def.hp * scale * size * (elite ? 2.4 : 1) * swarmMod;
  const e: Enemy = {
    id: g.id++, x, y, kind, hp, maxHp: hp, r: def.r * size, speed: def.speed * Math.min(1.7, 1 + g.elapsed / 300) * (elite ? 1.1 : 1),
    phase: rnd(9), cooldown: kind === "cap" ? .2 : kind === "turret" ? 2 : kind === "organ" ? 2.6 : rnd(1, 2.2), attack: 0, hit: 0,
    pink: kind === "bloat" ? Math.random() < .4 : false, size, hidden: kind === "cap", airborne: kind === "nut" ? 1.3 : 0,
    vx: 0, vy: 0, counter: 0, pattern: 0, spawnT: 0, burn: 0, slow: 0, elite, affix, blink: rnd(2, 5), frozen: 0, alpha: kind === "mime" ? 0 : 1,
    revived: false, buffed: 0, rooted: 0, facingA: 0, stun: 0, slippery: 0,
  };
  if (kind === "gloop") { const a = rnd(TAU); e.vx = Math.cos(a) * e.speed; e.vy = Math.sin(a) * e.speed; }
  if (kind === "clown") { const a = rnd(TAU); e.vx = Math.cos(a) * e.speed; e.vy = Math.sin(a) * e.speed; }
  if (affix === "painted") { e.paint = 1e6; e.paintC = "#ff5aa5"; } // permanently marked — everything hurts it +35%
  if (affix === "swift") e.speed *= 1.5;
  if (kind === "balloon") { e.burst = elite ? 7 : 4; const a = rnd(TAU); e.vx = Math.cos(a) * 24; e.vy = Math.sin(a) * 16; }
  if (kind === "eel") { e.segments = []; for (let i = 0; i < 9; i++) e.segments.push({ x, y }); }
  if (kind === "candle") { e.phase = rnd(TAU); e.anchor = { x: clamp(x, b.minX + 120, b.maxX - 120), y: clamp(y, b.minY + 90, b.maxY - 90) }; }
  if (kind === "puppet") { e.anchor = { x, y: fieldTop(g, h) - 10 }; e.cooldown = rnd(2, 4); }
  if (kind === "siren") { e.anchor = { x, y }; e.shieldHp = 0; }
  g.enemies.push(e);
  if (kind === "twin" && !at) {
    const mate = spawnEnemy(g, w, h, "twin", { x: x + rnd(-90, 90), y: clamp(y + rnd(-60, 60), b.minY, b.maxY) }, size, elite);
    if (mate) { mate.partner = e.id; e.partner = mate.id; }
  }
  return e;
}

export function spawnBoss(g: GameState, w: number, h: number) {
  const e = spawnEnemy(g, w, h, "boss", { x: clamp((g.cam ? g.cam.x : 0) + (g.viewW || w) / 2, 120, w - 120), y: (g.rows ?? 1) > 1 ? Math.max(0, g.cam?.y ?? 0) + h * HORIZON - 80 : h * HORIZON - 80 });
  if (!e) return;
  e.hp = e.maxHp = ENEMIES.boss.hp * (1 + g.bossesBeaten * .55) * (1 + g.elapsed / 400);
  const bossData = BOSS_NAMES[g.bossesBeaten % BOSS_NAMES.length];
  e.bossName = bossData.name;
  e.bossPhase = 1;
  e.maxBossPhase = 3;
  e.cooldown = 2.2;
  g.boss = e;
  g.bossIntro = { name: bossData.name, title: bossData.title, quote: bossData.quote, life: 3.6 };
  g.announce = { title: e.bossName, sub: "A CHALLENGER APPEARS", life: 3.2 };
  g.events.push("boss");
  encounterPulse(g, e.x, e.y, "#f7cd58", 210);
  g.shake = 16;
  if (g.upgrades.shield) {
    g.player.shield = Math.max(g.player.shield, 2);
    say(g, g.player.x, g.player.y - 60, "UMBRELLA UP!", "#8fd1ff");
  }
}

export function spawnCrate(g: GameState, w: number, h: number, at?: Point) {
  const locked = WEAPON_KEYS.filter((k) => !g.unlocks.includes(k) && !g.weapons.includes(k));
  const any = WEAPON_KEYS.filter((k) => !g.weapons.includes(k));
  const pool = locked.length && Math.random() < .7 ? locked : any;
  const key = pick(pool);
  const v = viewBand(g, w, h);
  const pos = at ?? { x: rnd(v.minX + 60, v.maxX - 60), y: rnd(v.minY + 40, v.maxY - 40) };
  drop(g, pos.x, pos.y, "weapon", key);
  g.announce = { title: "PRIZE CRATE!", sub: "A NEW WEAPON JUST LANDED", life: 2.2 };
  g.events.push("crate");
  encounterPulse(g, pos.x, pos.y, "#f9d45b", 120);
  ring(g, pos.x, pos.y, "#ffd75a", 90);
  puff(g, pos.x, pos.y + 10, "#e8dfcf", 10, 90, 7);
}

export const enemyShot = (g: GameState, x: number, y: number, a: number, speed: number, dmg: number, color: string, pink = false, homing = 0) => {
  const dance = g.mode === "bulletdance";
  const isPink = pink || (g.modifier?.id === "pink") || dance; // BULLET DANCE: the whole room is parryable
  const push = (ang: number, rr: number) => g.bullets.push({
    x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 3.2, maxLife: 3.2, damage: dmg,
    r: isPink ? 8 : 7, color: isPink ? "#ff7ad9" : color, enemy: true, pink: isPink, pierce: 0,
    bounces: 0, chains: 0, hitIds: [], homing, spin: rnd(TAU), ...(dance ? { r: rr } : {})
  });
  if (dance) { push(a, 8); push(a - .19, 7); push(a + .19, 7); } // the waltz: three, always three
  else push(a, 7);
};

