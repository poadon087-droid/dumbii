/** Loyal hounds and jar-of-bees swarms. */
import type { Enemy, GameState } from "./types";
import { worldBounds, byId, clamp, compact, dist, liveBuf } from "./util";
import { puff } from "./fx";
import { damageEnemy } from "./combat";

/** Loyal hounds and bees chase the biggest creep they can find and chew on it. */
export function updateCompanions(g: GameState, d: number, w: number, h: number) {
  const p = g.player, b = worldBounds(g, w, h);
  for (const c of g.companions) {
    c.life -= d; c.hop += d * 8;
    let t = c.target >= 0 ? byId.get(c.target) : undefined;
    if (!t || t.hp <= 0 || t.hidden) {
      let best: Enemy | undefined = undefined, bd = Infinity;
      for (const e of liveBuf) { const v = dist(e, c) - (e.kind === "boss" ? 500 : 0); if (v < bd) { bd = v; best = e; } }
      t = best; c.target = t ? t.id : -1;
    }
    const accel = c.bee ? 1400 : 900, top = c.bee ? 520 : 430;
    if (t) {
      const dd = dist(t, c) || 1;
      c.vx += (t.x - c.x) / dd * accel * d; c.vy += (t.y - c.y) / dd * accel * d;
      c.facing = t.x < c.x ? -1 : 1;
      if (dd < t.r + (c.bee ? 8 : 16)) {
        c.bite -= d;
        if (c.bite <= 0) {
          c.bite = c.bee ? .3 : .4;
          damageEnemy(g, t, c.dmg, c.bee ? "#ffc94a" : "#ffe27a");
          puff(g, t.x, t.y, "#fff6dc", 3, 110, 3);
          g.events.push("peck");
        }
      }
    } else {
      const dd = dist(p, c) || 1;
      if (dd > 62) { c.vx += (p.x - c.x) / dd * 700 * d; c.vy += (p.y - c.y) / dd * 700 * d; }
      c.facing = p.x < c.x ? -1 : 1;
    }
    c.vx *= .9; c.vy *= .9;
    const sp = Math.hypot(c.vx, c.vy);
    if (sp > top) { c.vx = c.vx / sp * top; c.vy = c.vy / sp * top; }
    c.x = clamp(c.x + c.vx * d, b.minX, b.maxX); c.y = clamp(c.y + c.vy * d, b.minY, b.maxY);
  }
  compact(g.companions, (c) => c.life > 0);
}

