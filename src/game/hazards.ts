/** Per-biome stage hazards: spawn tables and simulation. */
import type { GameState, HazardKind } from "./types";
import { clamp, compact, dist, fieldTop, rnd, TAU, viewBand, worldBounds } from "./util";
import { puff } from "./fx";
import { damageEnemy, hurtPlayer } from "./combat";

/** Stage hazards — the per-biome threat the title card advertises. */
export function spawnHazard(g: GameState, w: number, h: number, kind: HazardKind) {
  if (g.hazards.length > 14) g.hazards.shift();
  // telegraphed threats only matter if they land where you can see them coming
  const b = viewBand(g, w, h);
  const H: GameState["hazards"][number] = { x: 0, y: 0, r: 30, kind, timer: 0, active: false, warn: .9, life: 1, max: 1, angle: rnd(TAU), phase: rnd(TAU), hit: false };
  if (kind === "lava" || kind === "geyser") { H.x = rnd(b.minX + 50, b.maxX - 50); H.y = rnd(b.minY + 20, b.maxY - 20); H.r = kind === "lava" ? 46 : 40; H.warn = .95; H.max = 2.3; }
  else if (kind === "pillar") { H.x = rnd(b.minX + 30, b.maxX - 30); H.y = (b.minY + b.maxY) / 2; H.r = 30; H.warn = .8; H.max = 2.1; }
  else if (kind === "tomb") { H.x = rnd(b.minX + 40, b.maxX - 40); H.y = rnd(b.minY + 20, b.maxY - 20); H.r = 34; H.warn = .85; H.max = 2.6; }
  else if (kind === "wisp") { H.x = rnd(b.minX, b.maxX); H.y = rnd(b.minY, b.maxY); H.r = 19; H.warn = 0; H.max = 7.5; }
  else if (kind === "spinner") { H.x = rnd(b.minX + 110, b.maxX - 110); H.y = rnd(b.minY + 60, b.maxY - 60); H.r = 96; H.warn = 0; H.max = 8; }
  else if (kind === "glaze") { H.x = rnd(b.minX + 60, b.maxX - 60); H.y = rnd(b.minY + 30, b.maxY - 30); H.r = 66; H.warn = 0; H.max = 9; }
  else if (kind === "pendulum") { H.x = rnd(b.minX + 90, b.maxX - 90); H.y = fieldTop(g, h) + h * .28; H.pivot = { x: H.x, y: fieldTop(g, h) - 10 }; H.arm = 150 + rnd(70); H.r = 27; H.warn = 0; H.max = 9; }
  else if (kind === "bolt") { H.x = rnd(b.minX + 40, b.maxX - 40); H.y = rnd(b.minY + 10, b.maxY - 10); H.r = 30; H.warn = .85; H.max = 1.7; }
  else if (kind === "tome") { H.x = rnd(b.minX + 40, b.maxX - 40); H.y = rnd(b.minY + 20, b.maxY - 20); H.r = 40; H.warn = .95; H.max = 2.2; }
  else { H.x = rnd(b.minX + 40, b.maxX - 40); H.y = rnd(b.minY + 20, b.maxY - 20); H.r = 38; H.warn = .7; H.max = 2.4; }
  H.life = H.max;
  g.hazards.push(H);
}

export function updateHazards(g: GameState, d: number, w: number, h: number) {
  const p = g.player, b = worldBounds(g, w, h);
  for (const H of g.hazards) {
    H.life -= d; H.timer += d;
    const armed = H.timer > H.warn;
    H.active = armed;
    if (H.kind === "wisp") {
      H.angle += Math.sin(H.timer * 2.2 + (H.phase || 0)) * d * 1.4;
      H.x += Math.cos(H.angle) * 48 * d; H.y += Math.sin(H.angle) * 36 * d;
      const dd = dist(H, p) || 1;
      H.x += (p.x - H.x) / dd * 24 * d; H.y += (p.y - H.y) / dd * 24 * d;
      H.x = clamp(H.x, b.minX, b.maxX); H.y = clamp(H.y, b.minY, b.maxY);
      if (dd < H.r + p.r && p.dashTime <= 0) hurtPlayer(g, 9, H);
    } else if (H.kind === "spinner") {
      H.angle += d * (1.6 + (1 - H.life / H.max) * .8);
      for (const t of [.5, 1]) {
        const tx = H.x + Math.cos(H.angle) * H.r * t, ty = H.y + Math.sin(H.angle) * H.r * t;
        if (Math.hypot(tx - p.x, ty - p.y) < 20 + p.r && p.dashTime <= 0) hurtPlayer(g, 13, { x: tx, y: ty });
      }
    } else if (H.kind === "glaze") {
      if (dist(H, p) < H.r + p.r) p.momentum = Math.min(1, p.momentum + d * 2.4);
    } else if (H.kind === "pendulum") {
      const A = H.pivot!, arm = H.arm!;
      const sw = Math.sin(g.elapsed * 1.85 + (H.phase || 0)) * 1.05;
      H.x = A.x + Math.sin(sw) * arm; H.y = A.y + Math.cos(sw) * arm;
      if (Math.hypot(H.x - p.x, H.y - p.y) < H.r + p.r && p.dashTime <= 0) hurtPlayer(g, 16, H);
    } else if (H.kind === "tomb") {
      if (armed && dist(H, p) < H.r + p.r) {
        if (!H.hit && p.dashTime <= 0) { hurtPlayer(g, 15, H); H.hit = true; }
        if (H.hit) { p.y -= 34 * d; p.x += (p.x - H.x) * d * 1.6; }
      }
    } else if (H.kind === "lava" || H.kind === "geyser") {
      if (armed && dist(H, p) < H.r * .78 + p.r && p.dashTime <= 0) hurtPlayer(g, 14, H);
      if (armed && Math.random() < d * 14) puff(g, H.x + rnd(-H.r * .6, H.r * .6), H.y, H.kind === "lava" ? "#ff8c4a" : "#2a2230", 1, 100, 5);
    } else if (H.kind === "pillar") {
      if (armed && Math.abs(H.x - p.x) < H.r * .5 + p.r * .7 && p.dashTime <= 0) hurtPlayer(g, 15, H);
      if (armed && Math.random() < d * 18) puff(g, H.x + rnd(-9, 9), rnd(b.minY, b.maxY), "#ff5555", 1, 130, 5);
    } else if (H.kind === "bolt") {
      // the flash IS the warning; the bolt hurts creeps too
      if (armed && H.timer < H.warn + .22) {
        if (!H.hit) { H.hit = true; g.events.push("laser"); }
        if (Math.abs(H.x - p.x) < 26 + p.r * .5 && p.dashTime <= 0) hurtPlayer(g, 16, H);
        for (const e of g.enemies) if (!e.hidden && !e.phased && e.airborne <= 0 && Math.abs(H.x - e.x) < 26 + e.r) damageEnemy(g, e, 45, "#ffe27a");
      }
    } else if (H.kind === "tome") {
      if (armed && !H.hit) {
        H.hit = true; g.shake = Math.max(g.shake, 5);
        puff(g, H.x, H.y, "#c9a86a", 10, 130, 5); g.events.push("thud");
        if (dist(H, p) < H.r + p.r && p.dashTime <= 0) hurtPlayer(g, 14, H);
        g.puddles.push({ x: H.x, y: H.y, r: 34, life: 2.5, max: 2.5, kind: "ink" });
      }
    } else if (armed && dist(H, p) < H.r + p.r && p.dashTime <= 0) hurtPlayer(g, 10, H);
  }
  compact(g.hazards, (H) => H.life > 0);
}

