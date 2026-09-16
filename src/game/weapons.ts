/** Weapon firing (all 37) and EX supers. */
import { WEAPONS } from "./data";
import type { Bullet, GameState, Point, WeaponKey } from "./types";
import { bounds, clamp, dist, fieldTop, liveBuf, nearBuf2, nearby, rnd, TAU, viewBand } from "./util";
import { addCards, drop, puff, ring, say, shell, spawnCompanion } from "./fx";
import { damageEnemy } from "./combat";

/** Per-weapon screen-shake weight — mortars thud, kazoos barely whisper. */
const SHAKE_W: Partial<Record<WeaponKey, number>> = {
  anvil: 7, barrel: 8, mortar: 6, lobber: 5, boombox: 4, choir: 3, quill: 3, grapple: 3,
  pie: 2.5, whistle: 2, stamp: 1.6, syrup: 1.6, umbrella: 1.5, popper: 1.4, slots: 1.2,
  lance: 3.2, sprinkler: 1.8, candle: 1,
  peel: 1.2, paint: 1, note: .8, fountain: .6, kazoo: .5,
};

export function fireWeapon(g: GameState, aim: Point, key: WeaponKey, chargeAmt = 1): boolean {
  const p = g.player, s = WEAPONS[key], base = Math.atan2(aim.y - p.y, aim.x - p.x);
  // Some guns can decline a shot (the yo-yo is still out on its string). The caller has to know,
  // so it does not charge the reload for a bullet that never left the barrel.
  const n0 = g.bullets.length;
  p.angle = base; p.facing = Math.cos(base) < 0 ? -1 : 1;
  p.rhythm++;
  const rhythmCrit = g.charm === "metronome" && p.rhythm % 4 === 0;
  const dmgMul = p.damage * (rhythmCrit ? 2 : 1);
  const mk = (a: number, extra: Partial<Bullet> = {}): Bullet => ({
    x: p.x + Math.cos(a) * 26, y: p.y - 4 + Math.sin(a) * 26, vx: Math.cos(a) * s.speed, vy: Math.sin(a) * s.speed,
    life: 1.2, maxLife: 1.2, damage: s.damage * dmgMul, r: 4, color: rhythmCrit ? "#ffffff" : s.color,
    weapon: key, pierce: 0, bounces: g.upgrades.ricochet || 0, chains: 0, hitIds: [], spin: 0, ...extra
  });

  const angles: number[] = [];
  if (s.shots > 1 && key !== "trio") {
    for (let i = 0; i < s.shots; i++) angles.push(base + (i / (s.shots - 1) - .5) * s.spread + rnd(-.03, .03));
  } else {
    angles.push(base + rnd(-.5, .5) * s.spread);
  }
  for (let i = 0; i < p.extraShots; i++) angles.push(base + (i % 2 ? 1 : -1) * .16 * Math.ceil((i + 1) / 2));

  if (key === "harp") {
    const targets = liveBuf.filter((e) => {
      const d = dist(e, p); if (d > 420) return false;
      const da = Math.abs(((Math.atan2(e.y - p.y, e.x - p.x) - base + Math.PI * 3) % TAU) - Math.PI);
      return da < s.spread;
    }).sort((a, e) => dist(a, p) - dist(e, p)).slice(0, 5 + p.extraShots * 2);

    if (targets.length === 0) {
      const far = { x: p.x + Math.cos(base) * 300, y: p.y + Math.sin(base) * 300 };
      g.bullets.push(mk(base, { vx: 0, vy: 0, life: .14, maxLife: .14, arc: [{ x: p.x, y: p.y - 4 }, far], damage: 0, r: 0 }));
    }
    for (const t of targets) {
      damageEnemy(g, t, s.damage * dmgMul, s.color);
      g.bullets.push(mk(base, { vx: 0, vy: 0, life: .16, maxLife: .16, arc: [{ x: p.x, y: p.y - 4 }, { x: t.x, y: t.y }], damage: 0, r: 0 }));
    }
    puff(g, p.x + Math.cos(base) * 30, p.y - 4 + Math.sin(base) * 30, s.color, 4, 80, 4);
    g.shake = Math.max(g.shake, 2.5); g.events.push("shoot:harp");
    p.recoil = 1; g.stats.shots++; g.stats.byWeapon[key] = (g.stats.byWeapon[key] || 0) + 1;
    return g.bullets.length > n0;
  }

  for (const a of angles) {
    if (key === "popper") g.bullets.push(mk(a, { pierce: 1, bounces: 2, r: 5 }));
    else if (key === "choir") g.bullets.push(mk(a, { life: .42, maxLife: .42, knock: 36, r: 4 }));
    else if (key === "note") g.bullets.push(mk(a, { homing: .16, chains: 2, r: 6, life: 1.6, maxLife: 1.6 }));
    else if (key === "mortar") g.bullets.push(mk(a, { r: 12, bounces: 3, splash: 110, life: 2.4, maxLife: 2.4 }));
    else if (key === "halo") g.bullets.push(mk(a, { r: 14, pierce: 99, boomerang: true, life: 2.2, maxLife: 2.2, spin: 0 }));
    else if (key === "kettle") { const c = clamp(chargeAmt, 0, 1); g.bullets.push(mk(a, { damage: (10 + 78 * Math.pow(c, 1.4)) * dmgMul, r: 4 + 11 * c, pierce: c > .9 ? 3 : c > .5 ? 1 : 0, charge: c, inkBlast: c > .8, life: 1.4, maxLife: 1.4 })); }
    else if (key === "shard") g.bullets.push(mk(a, { r: 8, split: .3, life: 1.4, maxLife: 1.4 }));
    else if (key === "lobber") { const d = Math.min(440, dist(aim, p)), tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d, dur = .35 + d / 700; g.bullets.push(mk(a, { r: 11, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 95, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } })); }
    else if (key === "fountain") g.bullets.push(mk(a + rnd(-.08, .08), { r: 7, life: .34, maxLife: .34, burn: 4, grow: 22, knock: 4, vx: Math.cos(a) * s.speed * rnd(.8, 1.15), vy: Math.sin(a) * s.speed * rnd(.8, 1.15) }));
    else if (key === "trio") { const d = Math.max(120, dist(aim, p)), tx = p.x + Math.cos(base) * d, ty = p.y + Math.sin(base) * d; for (const off of [-1, 0, 1]) { const ox = p.x + Math.cos(base + Math.PI / 2) * off * 36, oy = p.y - 4 + Math.sin(base + Math.PI / 2) * off * 36, ang = Math.atan2(ty - oy, tx - ox); g.bullets.push({ ...mk(ang), x: ox, y: oy, vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed, r: 5, pierce: 99, life: .95, maxLife: .95, beam: true }); } }
    else if (key === "cuckoo") g.bullets.push(mk(a, { r: 13, pierce: 99, life: 3.8, maxLife: 3.8, tick: .2, pet: { target: -1, hop: 0 } }));
    else if (key === "accordion") for (const sgn of [1, -1]) g.bullets.push(mk(a, { r: 7, pierce: 2, life: 1.5, maxLife: 1.5, wave: { amp: 46 * sgn, freq: 9, phase: 0, bx: p.x, by: p.y - 4, nx: -Math.sin(a), ny: Math.cos(a), t: 0 } }));
    else if (key === "yoyo") { if (g.bullets.some((bl) => bl.tether && !bl.ex)) continue; g.bullets.push(mk(a, { r: 12, pierce: 99, tick: .18, life: 3, maxLife: 3, tether: { dist: 0, max: 260, out: true } })); }
    else if (key === "frost") g.bullets.push(mk(a, { r: 8, life: .5, maxLife: .5, freeze: 1.6, grow: 14, pierce: 1 }));
    else if (key === "quill") {
      let hits = 0;
      for (const e of nearby(p.x, p.y, 120)) {
        if (e.hidden || e.airborne > 0) continue;
        const dd = dist(e, p); if (dd > 105 + e.r) continue;
        const da = Math.abs(((Math.atan2(e.y - p.y, e.x - p.x) - a + Math.PI * 3) % TAU) - Math.PI);
        if (da > s.spread * .5) continue;
        // SIGNATURE: a point-blank quill cut finishes anything already staggered.
        const staggered = (e.stun || 0) > 0 || e.frozen > 0 || (e.blind || 0) > 0;
        const sig = staggered && e.hp < e.maxHp * .2 && e.kind !== "boss";
        damageEnemy(g, e, sig ? e.hp + 40 : s.damage * dmgMul, "#fff3c4");
        if (sig) { say(g, e.x, e.y - e.r - 12, "SIGNATURE!", "#f2c14e", true); addCards(g, .5); g.hitstop = Math.max(g.hitstop, .08); }
        else addCards(g, .12);
        if (e.kind !== "boss") { e.x += (e.x - p.x) / dd * 40; e.y += (e.y - p.y) / dd * 40; }
        hits++;
      }
      for (const bl of g.bullets) if (bl.enemy && dist(bl, p) < 110) {
        const da = Math.abs(((Math.atan2(bl.y - p.y, bl.x - p.x) - a + Math.PI * 3) % TAU) - Math.PI);
        if (da < s.spread * .5) { bl.life = 0; puff(g, bl.x, bl.y, "#fff3c4", 3, 80, 3); }
      }
      g.bullets.push(mk(a, { vx: 0, vy: 0, life: .16, maxLife: .16, damage: 0, r: 0, slash: { a, w: s.spread } }));
      if (hits) { g.hitstop = Math.max(g.hitstop, .03); g.shake = Math.max(g.shake, 4); }
    }
    else if (key === "popcorn") g.bullets.push(mk(a, { r: 6, bounces: 4, life: 1.1, maxLife: 1.1, popAt: .55 + rnd(.2), vx: Math.cos(a) * s.speed * rnd(.8, 1.1), vy: Math.sin(a) * s.speed * rnd(.8, 1.1) }));
    else if (key === "trumpet") g.bullets.push(mk(a, { r: 10, pierce: 99, grow: 30, life: 1.5, maxLife: 1.5, ghostWave: true }));
    else if (key === "mitt") g.bullets.push(mk(a, { r: 9, life: .55, maxLife: .55, gravity: 150, pierce: 99, tick: .1 }));
    else if (key === "anvil") {
      const d = Math.min(380, dist(aim, p));
      const tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d;
      g.bullets.push(mk(a, { x: tx, y: ty - 320, vx: 0, vy: 0, r: 16, life: 1.2, maxLife: 1.2, damage: s.damage * dmgMul, splash: 120, anvilDrop: { targetY: ty, groundT: 0.35 } }));
      g.events.push("whistle");
    }
    else if (key === "bubbles") {
      g.bullets.push(mk(a, { r: 11, life: 2.2, maxLife: 2.2, bubbleFloat: true, homing: 0.1, vx: Math.cos(a) * s.speed * rnd(0.8, 1.2), vy: Math.sin(a) * s.speed * rnd(0.8, 1.2) }));
    }
    else if (key === "boombox") {
      g.bullets.push(mk(a, { r: 14, life: 0.8, maxLife: 0.8, grow: 70, sonicRing: true, knock: 55, pierce: 99 }));
    }
    else if (key === "phonograph") {
      for (const sign of [-1, 1]) {
        g.bullets.push(mk(a + sign * 0.2, { r: 8, life: 1.8, maxLife: 1.8, homing: 0.12, wave: { amp: 30 * sign, freq: 12, phase: 0, bx: p.x, by: p.y - 4, nx: -Math.sin(a), ny: Math.cos(a), t: 0 } }));
      }
    }
    else if (key === "peel") {
      // flies a short way, then sticks to the boards and waits for a creep to step on it
      g.bullets.push(mk(a, { r: 11, life: 9, maxLife: 9, trap: { t: 8, armed: .34 }, damage: s.damage * dmgMul }));
    }
    else if (key === "kazoo") g.bullets.push(mk(a, { r: 6, homing: .26, chains: 1, life: 1.9, maxLife: 1.9, vx: Math.cos(a) * s.speed * rnd(.85, 1.2), vy: Math.sin(a) * s.speed * rnd(.85, 1.2) }));
    else if (key === "barrel") g.bullets.push(mk(a, { r: 18, pierce: 99, life: 2.4, maxLife: 2.4, knock: 34, roll: { decay: .42 } }));
    else if (key === "syrup") {
      const d = Math.min(430, dist(aim, p)), tx = p.x + Math.cos(a) * d, ty = p.y + Math.sin(a) * d, dur = .4 + d / 620;
      g.bullets.push(mk(a, { r: 12, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 115, syrup: true, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } }));
    }
    else if (key === "whistle") {
      spawnCompanion(g, p.x, p.y - 6, 12, s.damage * dmgMul);
      g.bullets.push(mk(a, { vx: 0, vy: 0, life: .12, maxLife: .12, damage: 0, r: 0 }));
    }
    else if (key === "umbrella") {
      g.bullets.push(mk(a, { r: 20, life: 6, maxLife: 6, pierce: 99, tick: .28, brolly: { angle: g.bullets.filter((x) => x.brolly).length * 1.6, dist: 62, spin: 2.6 } }));
    }
    else if (key === "grapple") {
      g.bullets.push(mk(a, { r: 9, life: .5, maxLife: .5, pierce: 0, hook: true, from: { x: p.x, y: p.y }, damage: 18 * dmgMul }));
    }
    else if (key === "slots") {
      // HOUSE PITY: six dry spins and the reels are loaded — nobody rides a cold machine all night.
      const pity = g.slotPity >= 5;
      const roll = pity ? 0 : Math.floor(rnd(0, 5));
      g.slotPity = roll === 0 ? 0 : g.slotPity + 1;
      if (pity) { say(g, p.x, p.y - 64, "LOADED!", "#ffd166", true); g.events.push("star"); }
      if (roll === 0) g.bullets.push(mk(a, { r: 12, pierce: 3, damage: 30 * dmgMul * (pity ? 1.6 : 1) }));
      else if (roll === 1) for (let i = 0; i < 5; i++) g.bullets.push(mk(a + (i - 2) * .18, { r: 7, damage: 12 * dmgMul, knock: 20 }));
      else if (roll === 2) g.bullets.push(mk(a, { r: 8, homing: .3, chains: 2, damage: 16 * dmgMul, life: 2, maxLife: 2 }));
      else if (roll === 3) for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU; g.bullets.push(mk(ang, { r: 6, bounces: 4, life: 1.2, maxLife: 1.2, popAt: .9, damage: 10 * dmgMul, vx: Math.cos(ang) * rnd(280, 560), vy: Math.sin(ang) * rnd(280, 560) })); }
      else {
        // LUCKY used to be the one dry face on the reel: a coin and no shot at all, which read as
        // the gun jamming. Now it pays the coin *and* fires a gilded shell.
        drop(g, p.x + rnd(-20, 20), p.y - 30, "coin");
        g.bullets.push(mk(a, { r: 9, pierce: 1, damage: 14 * dmgMul, life: 1.3, maxLife: 1.3, color: "#ffd166" }));
      }
      say(g, p.x, p.y - 46, ["SHELL!", "FAN!", "SEEKER!", "BURST!", "LUCKY!"][roll], "#ffd166");
    }
    else if (key === "paint") g.bullets.push(mk(a, { r: 7, life: .9, maxLife: .9, damage: 6 * dmgMul, paintMark: s.color }));
    else if (key === "pie") g.bullets.push(mk(a, { r: 12, life: 1.4, maxLife: 1.4, damage: 30 * dmgMul, pie: true, gravity: 260 }));
    else if (key === "stamp") g.bullets.push(mk(a, { r: 8, life: 1.2, maxLife: 1.2, damage: 15 * dmgMul, stampTag: true }));
    else if (key === "lance") g.bullets.push(mk(a, { r: 3.5, pierce: 99, life: .85, maxLife: .85, knock: 26 }));
    else if (key === "sprinkler") { for (let i = 0; i < 10; i++) { const ra = i / 10 * TAU + p.rhythm * .37; g.bullets.push(mk(ra, { r: 5, life: .52, maxLife: .52, knock: 18, vx: Math.cos(ra) * s.speed * rnd(.9, 1.1), vy: Math.sin(ra) * s.speed * rnd(.9, 1.1) })); } }
    else if (key === "candle") g.bullets.push(mk(a, { x: p.x + Math.cos(a) * 74, y: p.y - 4 + Math.sin(a) * 74, vx: 0, vy: 0, r: 26, pierce: 99, tick: .4, life: 5, maxLife: 5, damage: s.damage * dmgMul }));
  }
  // A declined pull is silent: no muzzle puff, no shake, no shot on the tally.
  const launched = g.bullets.length > n0;
  if (!launched) return false;
  // the receipt: guns with a breach throw a casing; kazoos, harps and candles do not
  if (key === "popper" || key === "choir" || key === "kettle" || key === "mortar" || key === "slots" || key === "lance" || key === "pie")
    shell(g, p.x + Math.cos(base) * 18, p.y - 8 + Math.sin(base) * 18, p.facing);
  puff(g, p.x + Math.cos(base) * 32, p.y - 4 + Math.sin(base) * 32, s.color, key === "choir" ? 8 : key === "fountain" ? 1 : 3, 70, 4);
  g.shake = Math.max(g.shake, SHAKE_W[key] ?? (key === "kettle" ? 2 + chargeAmt * 5 : 1.4));
  p.recoil = 1;
  g.events.push(`shoot:${key}`);
  g.stats.shots++; g.stats.byWeapon[key] = (g.stats.byWeapon[key] || 0) + 1;
  return true;
}

export function fireEx(g: GameState, aim: Point, key: WeaponKey, w: number, h: number) {
  const p = g.player, s = WEAPONS[key], a = Math.atan2(aim.y - p.y, aim.x - p.x);
  const mk = (ang: number, extra: Partial<Bullet>): Bullet => ({
    x: p.x, y: p.y - 4, vx: Math.cos(ang) * s.speed, vy: Math.sin(ang) * s.speed, life: 2, maxLife: 2, damage: s.damage * p.damage,
    r: 6, color: s.color, weapon: key, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0, ex: true, ...extra
  });

  if (key === "popper") g.bullets.push(mk(a, { r: 20, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, pierce: 99, damage: 60 * p.damage }));
  else if (key === "choir") for (let i = 0; i < 8; i++) g.bullets.push(mk(i / 8 * TAU, { r: 7, pierce: 2, damage: 30 * p.damage, life: 1.1, maxLife: 1.1, vx: Math.cos(i / 8 * TAU) * 620, vy: Math.sin(i / 8 * TAU) * 620 }));
  else if (key === "note") for (let i = 0; i < 6; i++) g.bullets.push(mk(0, { orbit: { angle: i / 6 * TAU, dist: 74 }, life: 4.2, maxLife: 4.2, damage: 13 * p.damage, r: 7, tick: .35, pierce: 99 }));
  else if (key === "mortar") g.bullets.push(mk(a, { r: 21, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, splash: 200, damage: 95 * p.damage, bounces: 1, life: 2.6, maxLife: 2.6 }));
  else if (key === "halo") { const ra = rnd(TAU); g.bullets.push(mk(ra, { r: 27, vx: Math.cos(ra) * 520, vy: Math.sin(ra) * 520, roam: true, bounces: 99, pierce: 99, tick: .3, damage: 16 * p.damage, life: 2.8, maxLife: 2.8 })); }
  else if (key === "kettle") { ring(g, p.x, p.y, s.color, 170); puff(g, p.x, p.y, s.color, 26, 320, 7); g.shake = 14; for (const e of g.enemies) { const d = dist(e, p); if (d < 170 && !e.hidden && e.airborne <= 0) { damageEnemy(g, e, 70 * p.damage, s.color); const k = 120 / Math.max(40, d); e.x += (e.x - p.x) * k; e.y += (e.y - p.y) * k; } } for (const b of g.bullets) if (b.enemy && dist(b, p) < 170) b.life = 0; }
  else if (key === "shard") g.bullets.push(mk(0, { vx: 0, vy: 0, sentry: true, life: 4.5, maxLife: 4.5, r: 15, tick: .22, damage: 14 * p.damage }));
  else if (key === "lobber") for (let i = 0; i < 5; i++) { const ang = i / 5 * TAU + a, tx = p.x + Math.cos(ang) * 150, ty = p.y + Math.sin(ang) * 120, dur = .55; g.bullets.push(mk(ang, { r: 12, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 110, damage: 60 * p.damage, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } })); }
  else if (key === "fountain") for (let i = 0; i < 24; i++) { const ang = i / 24 * TAU; g.bullets.push(mk(ang, { r: 9, vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420, life: .55, maxLife: .55, burn: 8, grow: 26, damage: 14 * p.damage, knock: 14 })); }
  else if (key === "trio") g.bullets.push(mk(a, { r: 26, vx: Math.cos(a) * 1500, vy: Math.sin(a) * 1500, pierce: 99, damage: 90 * p.damage, life: 1, maxLife: 1, beam: true }));
  else if (key === "cuckoo") for (let i = 0; i < 4; i++) { const ang = a + (i - 1.5) * .5; g.bullets.push(mk(ang, { r: 13, pierce: 99, life: 4.2, maxLife: 4.2, tick: .2, damage: 11 * p.damage, pet: { target: -1, hop: 0 } })); }
  else if (key === "accordion") for (let i = 0; i < 8; i++) { const ang = a + (i - 3.5) * .28; g.bullets.push(mk(ang, { r: 8, pierce: 4, life: 1.8, maxLife: 1.8, damage: 20 * p.damage, wave: { amp: 40 * (i % 2 ? 1 : -1), freq: 8, phase: 0, bx: p.x, by: p.y - 4, nx: -Math.sin(ang), ny: Math.cos(ang), t: 0 } })); }
  else if (key === "yoyo") g.bullets.push(mk(a, { r: 16, pierce: 99, tick: .16, life: 5, maxLife: 5, damage: 18 * p.damage, orbit: { angle: a, dist: 180 } }));
  else if (key === "harp") { for (const e of g.enemies) if (!e.hidden) { damageEnemy(g, e, 55 * p.damage, s.color); g.bullets.push(mk(0, { vx: 0, vy: 0, life: .22, maxLife: .22, arc: [{ x: e.x + rnd(-40, 40), y: fieldTop(g, h) - 40 }, { x: e.x, y: e.y }], damage: 0, r: 0 })); } g.flash = .5; g.shake = 12; }
  else if (key === "frost") { ring(g, p.x, p.y, s.color, 230); puff(g, p.x, p.y, "#ffffff", 20, 260, 6); for (const e of g.enemies) if (dist(e, p) < 230 && e.kind !== "boss") { e.frozen = Math.max(e.frozen, 3); damageEnemy(g, e, 20 * p.damage, s.color); } g.events.push("freeze"); }
  else if (key === "quill") { ring(g, p.x, p.y, "#fff3c4", 150); for (const e of g.enemies) { const dd = dist(e, p); if (dd < 150 + e.r && !e.hidden) { damageEnemy(g, e, 90 * p.damage, "#fff3c4"); if (e.kind !== "boss") { e.x += (e.x - p.x) / dd * 120; e.y += (e.y - p.y) / dd * 120; } } } for (const bl of g.bullets) if (bl.enemy && dist(bl, p) < 160) bl.life = 0; g.bullets.push(mk(a, { vx: 0, vy: 0, life: .22, maxLife: .22, damage: 0, r: 0, slash: { a, w: TAU } })); g.hitstop = .06; g.shake = 10; }
  else if (key === "popcorn") for (let i = 0; i < 12; i++) { const ang = i / 12 * TAU + a; g.bullets.push(mk(ang, { r: 6, bounces: 6, life: 1.4, maxLife: 1.4, popAt: 1.1, damage: 16 * p.damage, vx: Math.cos(ang) * rnd(300, 620), vy: Math.sin(ang) * rnd(300, 620) })); }
  else if (key === "trumpet") for (const off of [-.5, 0, .5]) g.bullets.push(mk(a + off, { r: 20, pierce: 99, grow: 44, life: 1.6, maxLife: 1.6, ghostWave: true, damage: 48 * p.damage, vx: Math.cos(a + off) * 430, vy: Math.sin(a + off) * 430 }));
  else if (key === "mitt") { const tx = p.x + Math.cos(a) * 220, ty = p.y + Math.sin(a) * 220; g.bullets.push(mk(a, { x: tx, y: ty, vx: 0, vy: 0, r: 14, life: 1.4, maxLife: 1.4, gravity: 9999, pierce: 99, tick: .1, damage: 10 * p.damage })); g.shake = 8; }
  else if (key === "anvil") {
    // Ten-Ton Stampede rains across *the screen you are looking at*: `w` here is the whole world
    // and `h` is only the viewport, so the old maths dropped four anvils into other stages and
    // above the roof whenever the map was wider or taller than one screen.
    const bb = viewBand(g, w, h);
    for (let i = 0; i < 4; i++) {
      const tx = bb.minX + (bb.maxX - bb.minX) * (0.16 + i * 0.22), ty = bb.minY + (bb.maxY - bb.minY) * (0.45 + rnd(0.35));
      g.bullets.push(mk(0, { x: tx, y: ty - 380, vx: 0, vy: 0, r: 22, life: 1.5, maxLife: 1.5, damage: 110 * p.damage, splash: 160, anvilDrop: { targetY: ty, groundT: 0.3 } }));
    }
  }
  else if (key === "bubbles") { g.bullets.push(mk(a, { r: 35, life: 3.5, maxLife: 3.5, bubbleFloat: true, homing: 0.08, pierce: 99, damage: 85 * p.damage })); }
  else if (key === "boombox") { ring(g, p.x, p.y, s.color, 320); g.shake = 18; for (const e of g.enemies) { const d = dist(e, p); if (d < 320) { damageEnemy(g, e, 80 * p.damage, s.color); if (e.kind !== "boss") { e.x += (e.x - p.x) / d * 180; e.y += (e.y - p.y) / d * 180; } } } for (const bl of g.bullets) if (bl.enemy && dist(bl, p) < 320) bl.life = 0; }
  else if (key === "lance") g.bullets.push(mk(a, { r: 9, pierce: 99, freeze: 1.2, knock: 70, damage: 120 * p.damage, life: 1.1, maxLife: 1.1 }));
  else if (key === "sprinkler") { for (let i = 0; i < 24; i++) { const ang = i / 24 * TAU; g.bullets.push(mk(ang, { r: 6, knock: 44, damage: 22 * p.damage, life: .8, maxLife: .8, vx: Math.cos(ang) * 760, vy: Math.sin(ang) * 760 })); } }
  else if (key === "candle") { for (const off of [-.5, 0, .5]) { const ang = a + off; g.bullets.push(mk(ang, { x: p.x + Math.cos(ang) * 90, y: p.y - 4 + Math.sin(ang) * 90, vx: 0, vy: 0, r: 30, pierce: 99, tick: .35, life: 7, maxLife: 7, damage: 26 * p.damage })); } }
  else if (key === "phonograph") { for (let i = 0; i < 16; i++) { const ang = i / 16 * TAU; g.bullets.push(mk(ang, { r: 8, life: 2.2, maxLife: 2.2, damage: 24 * p.damage, wave: { amp: 40, freq: 8, phase: i * 0.4, bx: p.x, by: p.y - 4, nx: -Math.sin(ang), ny: Math.cos(ang), t: 0 } })); } }
  else if (key === "peel") {
    const bb = viewBand(g, w, h);
    for (let i = 0; i < 20; i++) {
      g.bullets.push(mk(0, {
        x: rnd(bb.minX + 40, bb.maxX - 40), y: rnd(bb.minY + 20, bb.maxY - 20), vx: 0, vy: 0,
        r: 12, life: 9, maxLife: 9, damage: 34 * p.damage, trap: { t: 8, armed: 0 },
      }));
    }
    say(g, p.x, p.y - 90, "MIND YOUR STEP!", "#f5d142", true);
  }
  else if (key === "kazoo") {
    for (let i = 0; i < 30; i++) { const ang = i / 30 * TAU; g.bullets.push(mk(ang, { r: 6, homing: .34, chains: 2, life: 2.6, maxLife: 2.6, damage: 15 * p.damage, vx: Math.cos(ang) * 420, vy: Math.sin(ang) * 420 })); }
  }
  else if (key === "barrel") {
    for (let i = -1; i <= 2; i++) {
      const ox = Math.cos(a + Math.PI / 2) * i * 54, oy = Math.sin(a + Math.PI / 2) * i * 54;
      g.bullets.push({ ...mk(a, {}), x: p.x + ox, y: p.y + oy, r: 22, pierce: 99, life: 3, maxLife: 3, knock: 46, roll: { decay: .3 }, damage: 42 * p.damage });
    }
    g.shake = Math.max(g.shake, 10);
  }
  else if (key === "syrup") {
    for (let i = 0; i < 12; i++) {
      const ang = i / 12 * TAU, tx = p.x + Math.cos(ang) * rnd(110, 250), ty = p.y + Math.sin(ang) * rnd(80, 180), dur = .6;
      g.bullets.push(mk(ang, { r: 12, vx: 0, vy: 0, life: dur, maxLife: dur, splash: 120, syrup: true, damage: 40 * p.damage, lob: { sx: p.x, sy: p.y - 4, tx, ty, t: 0, dur } }));
    }
  }
  else if (key === "whistle") {
    for (let i = 0; i < 3; i++) spawnCompanion(g, p.x + rnd(-30, 30), p.y + rnd(-20, 20), 14, 30 * p.damage);
    ring(g, p.x, p.y, "#e8c9a0", 140);
  }
  else if (key === "umbrella") {
    for (let i = 0; i < 8; i++) g.bullets.push(mk(0, { r: 22, life: 8, maxLife: 8, pierce: 99, tick: .26, damage: 22 * p.damage, brolly: { angle: i / 8 * TAU, dist: 78, spin: 3.2 } }));
    ring(g, p.x, p.y, "#8fd1ff", 180);
  }
  else if (key === "grapple") {
    p.invuln = Math.max(p.invuln, 1.2); p.grapple = null;
    ring(g, p.x, p.y, "#e8c9a0", 150); puff(g, p.x, p.y, "#e8c9a0", 16, 220, 6);
    for (const e of nearby(p.x, p.y, 150, nearBuf2)) if (!e.hidden && e.airborne <= 0) damageEnemy(g, e, 26 * p.damage, "#e8c9a0");
    say(g, p.x, p.y - 80, "SKYHOOK!", "#e8c9a0", true);
  }
  else if (key === "slots") {
    for (let i = 0; i < 5; i++) { const ang = a + (i - 2) * .3; g.bullets.push(mk(ang, { r: 11, pierce: 2, damage: 26 * p.damage, paintMark: s.color })); }
    say(g, p.x, p.y - 80, "TRIPLE CHERRIES!", "#ffd166", true);
  }
  else if (key === "paint") {
    for (const e of g.enemies) if (!e.hidden && e.hp > 0) { e.paint = g.charm === "varnish" ? 8 : 4; e.paintC = "#ff5aa5"; }
    ring(g, p.x, p.y, "#ff5aa5", 420); say(g, p.x, p.y - 80, "MASTERPIECE!", "#ff5aa5", true);
  }
  else if (key === "pie") {
    for (let i = 0; i < 6; i++) { const ang = a + (i - 2.5) * .22; g.bullets.push(mk(ang, { r: 12, life: 1.6, maxLife: 1.6, damage: 26 * p.damage, pie: true, gravity: 200, vx: Math.cos(ang) * 700, vy: Math.sin(ang) * 700 })); }
    say(g, p.x, p.y - 80, "FOOD FIGHT!", "#fff0b8", true);
  }
  else if (key === "stamp") {
    for (const e of g.enemies) if (!e.hidden && e.hp > 0 && e.kind !== "boss" && !e.tag) e.tag = { t: rnd(1.2, 2.2) };
    say(g, p.x, p.y - 80, "SPECIAL DELIVERY!", "#7ee08a", true); g.events.push("stamp");
  }

  const b = bounds(w, h); p.x = clamp(p.x, b.minX, b.maxX);
  say(g, p.x, p.y - 60, s.ex.toUpperCase() + "!", "#fff3c4", true); g.events.push("ex"); g.flash = Math.max(g.flash, .25);
}

