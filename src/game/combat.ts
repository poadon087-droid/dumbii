/** Damage, kills & drops, player hurt, parries and pickup collection. */
import { CARD_DAMAGE, ENEMIES, SMACKS, WEAPONS } from "./data";
import type { Enemy, GameState, Pickup, PickupKind, Point } from "./types";
import { byId, clamp, dist, HORIZON, pick, rnd, TAU } from "./util";
import { addCards, drop, puff, ring, say, spawnCompanion } from "./fx";
import { enemyShot, spawnCrate, spawnEnemy } from "./spawn";
import { generateShopItems } from "./economy";

let galleryBleed = false;
export function damageEnemy(g: GameState, e: Enemy, amount: number, color: string, crit = false) {
  if (e.frozen > 0) { amount *= 2; crit = true; }
  if (e.kind === "boss" && g.upgrades.titanbane) amount *= 1 + g.upgrades.titanbane * .45;
  if (e.stun && e.stun > 0) amount *= 1.25;
  if (e.paint && e.paint > 0) amount *= g.charm === "varnish" ? 1.5 : 1.35;
  if (g.mode === "glass") amount *= 3.5; // GLASS CANNON: hits like a freight train
  if (g.mode === "beat") amount *= g.onBeat ? 1.75 : .7; // ON THE BEAT: the band keeps time
  if (g.mode === "bulletdance") amount *= 1 + g.dance.heat * .9; // BULLET DANCE: the dance is the damage
  if (e.shieldHp && e.shieldHp > 0) {
    e.shieldHp -= amount;
    ring(g, e.x, e.y, "#8fd1ff", 40);
    puff(g, e.x, e.y, "#8fd1ff", 3, 70, 3);
    if (e.shieldHp <= 0) { e.shieldHp = 0; say(g, e.x, e.y - e.r - 8, "SHIELD BROKE!", "#8fd1ff"); }
    return;
  }
  let bleed = 0;
  if (e.paint && e.paint > 0 && amount > 6) bleed = amount * (g.charm === "varnish" ? .3 : .2); // GALLERY: painted creeps share the hurt
  e.hp -= amount; e.hit = .12;
  addCards(g, amount / CARD_DAMAGE * g.player.cardGain);
  puff(g, e.x, e.y, color, crit ? 7 : 3, crit ? 150 : 85, 4);
  if (crit) say(g, e.x, e.y - e.r - 10, e.frozen > 0 ? "SHATTER!" : "CRIT!", e.frozen > 0 ? "#aef1ff" : "#ff9a5c");
  if (bleed > 0 && !galleryBleed && e.hp > 0) {
    galleryBleed = true;
    let done = 0;
    for (const o of g.enemies) {
      if (done >= 3 || o === e || o.hp <= 0 || !(o.paint && o.paint > 0)) continue;
      if (dist(o, e) < 240) { damageEnemy(g, o, bleed, o.paintC || "#ff5aa5"); done++; puff(g, o.x, o.y, o.paintC || "#ff5aa5", 2, 60, 3); }
    }
    galleryBleed = false;
  }
  if (e.kind === "boss") {
    if (Math.random() < .1) g.events.push("bosshit");
    // Multi-phase boss transition checks
    if (e.bossPhase === 1 && e.hp <= e.maxHp * 0.66) {
      e.bossPhase = 2;
      g.events.push("bosstransform");
      g.shake = 20; g.flash = 0.8;
      ring(g, e.x, e.y, "#ff5555", 180);
      say(g, e.x, e.y - 80, "PHASE 2: UNLEASHED!", "#ff5555", true);
      for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
    } else if (e.bossPhase === 2 && e.hp <= e.maxHp * 0.33) {
      e.bossPhase = 3;
      g.events.push("bosstransform");
      g.shake = 26; g.flash = 1.0;
      ring(g, e.x, e.y, "#bd93f9", 220);
      say(g, e.x, e.y - 80, "FINAL PHASE: ENRAGED!", "#bd93f9", true);
      for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
    }
  } else if (Math.random() < .45) {
    g.events.push("hit");
  }
}

export function killEnemy(g: GameState, e: Enemy, w: number, h: number, parried = false) {
  const def = ENEMIES[e.kind], p = g.player;
  // A parried creep is killed immediately AND swept by the death pass at the end of
  // update(); without this guard the kill was scored twice (kills, combo and drops).
  if (e.dead) return;
  if (e.kind === "cutpurse" && e.holding && e.loot) {
    // Everything he pinched comes back, plus the crowd gets a look at the thief.
    const cards = Math.floor(e.loot / 10), cash = e.loot % 10;
    if (cards) addCards(g, cards);
    if (cash) { p.coins += cash; g.score += Math.round(60 * cash * p.scoreMult); }
    say(g, e.x, e.y - e.r - 14, `BACK TO YOU! +${cards} CARD${cards === 1 ? "" : "S"}`, "#ffe27a", true);
    g.events.push("coin"); e.loot = 0; e.holding = false;
  }
  if (e.kind === "janitor" && e.counter > 2) { drop(g, e.x, e.y, "weapon"); say(g, e.x, e.y - e.r - 12, "HE HAD A SPARE", "#cfd6e2"); }
  if (e.kind === "ghoul" && !e.revived && !parried) {
    e.revived = true; e.hp = e.maxHp * .6; e.hit = .3; e.attack = 1.4; e.alpha = .4;
    say(g, e.x, e.y - e.r - 6, "NOT YET!", "#cfd6e2"); g.events.push("revive"); ring(g, e.x, e.y, "#cfd6e2", 60); return;
  }
  if (e.frozen > 0) { // SHATTER SHARDS: anything that dies frozen throws glass
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + e.phase;
      g.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, life: .55, maxLife: .55,
        damage: 22 * g.player.damage, r: 5, color: "#aef1ff", pierce: 1, bounces: 0, chains: 0, hitIds: [e.id], spin: 0 });
    }
    say(g, e.x, e.y - e.r - 10, "SHATTERED!", "#aef1ff", true); g.events.push("freeze");
  }
  e.dead = true;
  const mult = (g.modifier?.id === "double" ? 2 : 1) * (g.modifier?.id === "giant" ? 1.5 : 1) * (g.modifier?.id === "swarm" ? 1.5 : 1);
  const comboStep = 1 + Math.min(g.combo, 12) * .1 * (1 + (g.upgrades.showman || 0) * .5);
  g.kills++; g.combo++; g.comboTime = 2.8; g.maxCombo = Math.max(g.maxCombo, g.combo);
  if (g.combo === 10 || g.combo === 25 || g.combo === 50 || g.combo === 100) {
    const card = g.combo === 10 ? ["TEN IN A ROW!", "THE CROWD ROARS"] : g.combo === 25 ? ["TWENTY-FIVE!", "A DAZZLING DISPLAY"] : g.combo === 50 ? ["FIFTY STRAIGHT!", "STANDING OVATION"] : ["ONE HUNDRED!", "THE STAGE IS YOURS"];
    g.announce = { title: card[0], sub: card[1], life: 1.8 }; g.events.push("levelup");
  }
  p.coins += e.elite ? 5 : 1;
  if (g.upgrades.interest && p.coins % 5 === 0) p.coins += g.upgrades.interest;

  g.score += Math.round(def.score * (e.elite ? 3 : 1) * comboStep * p.scoreMult * mult
    * (g.mode === "bulletdance" && e.lead ? 1.5 : 1));
  puff(g, e.x, e.y, def.color, 12, 200, 6); puff(g, e.x, e.y, "#fff6dc", 5, 120, 3);
  if (g.ghosts.length < 30) g.ghosts.push({ x: e.x, y: e.y - e.r, vx: rnd(-20, 20), life: 1.1, color: def.color, size: e.r, phase: rnd(9) });
  say(g, e.x, e.y - e.r - 6, pick(SMACKS));
  g.events.push(e.kind === "boss" ? "knockout" : e.elite ? "elitekill" : "kill");
  if (g.combo % 10 === 0) say(g, p.x, p.y - 70, `${g.combo} COMBO!`, "#ff8ad3", true);
  if (g.upgrades.vampire && g.kills % 12 === 0) { p.health = Math.min(p.maxHealth, p.health + 8 * g.upgrades.vampire); say(g, p.x, p.y - 56, "+SLURP", "#ff8a8a"); }
  if (e.kind === "bloat" && !parried) { for (let i = 0; i < 6; i++) enemyShot(g, e.x, e.y, i / 6 * TAU + e.phase, 210, 9, "#7ec8ff"); g.shake = Math.max(g.shake, 5); }
  if (e.kind === "gloop" && e.size > .55) { for (let i = 0; i < 2; i++) { const c = spawnEnemy(g, w, h, "gloop", { x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14) }, e.size * .65); if (c) c.hp = c.maxHp = e.maxHp * .45; } }
  if (e.kind === "balloon" && e.burst) {
    for (let i = 0; i < e.burst; i++) {
      const c = spawnEnemy(g, w, h, Math.random() < .5 ? "bat" : "daisy", { x: e.x + rnd(-40, 40), y: e.y + rnd(-30, 30) }, .7);
      if (c) { c.hp = c.maxHp = c.maxHp * .6; }
    }
    g.shake = Math.max(g.shake, 9); ring(g, e.x, e.y, "#ff8fa3", 120); g.events.push("boom");
  }
  if (e.kind === "bell") for (const o of g.enemies) o.buffed = 0;
  if (e.kind === "lugger" || e.kind === "cap" || e.elite) g.hitstop = Math.max(g.hitstop, .05);

  if (e.kind === "boss") {
    g.boss = null; g.bossesBeaten++; g.bossTimer = 95; g.hitstop = .3; g.slowmo = 1.2; g.flash = .8; g.shake = 22;
    p.health = Math.min(p.maxHealth, p.health + 45); addCards(g, 5);
    say(g, e.x, e.y - 80, "KNOCKOUT!", "#ffe27a", true);
    for (let i = 0; i < 10; i++) drop(g, e.x + rnd(-70, 70), e.y + rnd(-40, 60), i === 0 ? "heart" : i === 1 ? "goldbar" : "coin");
    spawnCrate(g, w, h, { x: e.x, y: e.y + 30 });
    // After boss defeat, Porkrind shop opens up!
    g.shopOpen = true;
    // On a stacked map the horizon he used to stand on belongs to the top row: with the boss
    // beaten three rows down, Porbo opened shop 1800px above the player and could never be
    // reached (the earshot check is 230px). He sets up where you are instead.
    const npcY = (g.rows ?? 1) > 1 ? clamp(p.y, 60, Math.max(120, (g.worldH || h) - 60)) : h * HORIZON + 20;
    g.shopNpc = { x: Math.max(120, Math.min(w - 120, (g.cam ? g.cam.x : 0) + (g.viewW || w) / 2)), y: npcY, active: true, talkTimer: 15 };
    g.shopItems = generateShopItems(g);
    say(g, g.shopNpc.x, npcY - 70, "SHOP IS OPEN!", "#ffd700", true);
    g.events.push("shopopen");
    return;
  }

  const ITEMS: PickupKind[] = ["rapid", "shield", "bomb", "clock", "star", "magnet", "decoy", "fireworks", "wind", "nuke", "goldbar", "mirror", "bees", "grease"];
  if (e.elite) {
    if (Math.random() < .5) spawnCrate(g, w, h, { x: e.x, y: e.y });
    else drop(g, e.x, e.y, pick(ITEMS));
    return;
  }
  if (e.kind === "twin" && e.partner !== undefined) {
    const mate = byId.get(e.partner);
    if (mate) { mate.partner = undefined; mate.speed *= 1.5; mate.buffed = 99; }
  }
  const coinChance = .28 * (g.charm === "penny" ? 2 : 1) * (g.modifier?.id === "coins" ? 3 : 1) * (1 + (g.upgrades.scavenger || 0));
  const r = Math.random();
  if (r < coinChance) drop(g, e.x, e.y, "coin");
  else if (r < coinChance + .06) drop(g, e.x, e.y, "heart");
  else if (r < coinChance + .09) {
    let item = pick(ITEMS);
    if (item === "wind" && Math.random() < .7) item = "clock";
    drop(g, e.x, e.y, item);
  }
}

export function hurtPlayer(g: GameState, amount: number, from: Point) {
  const p = g.player; if (p.invuln > 0 || p.superTime > 0 || p.star > 0) return;
  const who = (from as Enemy).kind;
  g.lastThreat = who ? ENEMIES[who]?.name ?? "A CREEP" : "STRAY FIRE";
  if (p.shield > 0) {
    p.shield--; p.invuln = .6;
    ring(g, p.x, p.y, "#8fd1ff", 70);
    say(g, p.x, p.y - 60, p.shield > 0 ? "BLOCKED!" : "UMBRELLA BROKE!", "#8fd1ff");
    g.events.push("block"); return;
  }
  p.health -= amount; p.invuln = .9; p.squash = 1; g.shake = Math.max(g.shake, 10); g.damageTaken++; g.combo = 0; p.webbed = 0;
  if (g.mode === "bulletdance") { g.dance.streak = 0; g.dance.heat *= .3; } // BULLET DANCE: one bruise and the music stops
  const d = dist(p, from) || 1; p.x += (p.x - from.x) / d * 26; p.y += (p.y - from.y) / d * 26;
  puff(g, p.x, p.y, "#ff6b5e", 12, 170, 5); say(g, p.x, p.y - 60, pick(["OUCH!", "YIKES!", "OOF!"]), "#ff8a7a", true);
  g.events.push("hurt"); g.hitstop = Math.max(g.hitstop, .05);
}

export function tryParry(g: GameState, radius: number, w: number, h: number) {
  const p = g.player; let hit = false, slapped = 0;
  const caught: { x: number; y: number }[] = [];
  for (const b of g.bullets) {
    if (b.enemy && b.pink && b.life > 0 && (b.ringWave ? Math.abs(dist(b, p) - b.r) < radius : dist(b, p) < radius + b.r)) {
      b.life = 0; hit = true; slapped++; caught.push({ x: b.x, y: b.y }); puff(g, b.x, b.y, "#ff7ad9", 8, 160, 5);
    }
  }
  for (const k of g.pickups) {
    if (k.kind === "bulb" && k.life > 0 && dist(k, p) < radius + 16) {
      if (g.mode === "blackout") { g.lightR = Math.min(430, g.lightR + 45); g.bulbPulse = 1; say(g, p.x, p.y - 64, "LIGHT UP!", "#ffe27a", true); }
      k.life = 0; hit = true; slapped++; puff(g, k.x, k.y, "#ff7ad9", 10, 170, 5);
    }
  }
  for (const e of g.enemies) {
    if (e.pink && e.hp > 0 && dist(e, p) < radius + e.r) {
      e.hp = 0; hit = true; killEnemy(g, e, w, h, true);
    }
  }
  if (hit) {
    const dance = g.mode === "bulletdance";
    g.parries += Math.max(1, slapped);
    addCards(g, dance ? 1 + Math.max(0, slapped - 1) * .5 : 1);
    p.invuln = Math.max(p.invuln, .35); p.parryFlash = .3;
    g.hitstop = Math.max(g.hitstop, .07); ring(g, p.x, p.y, "#ff7ad9", 90);
    say(g, p.x, p.y - 64, "PARRY!", "#ff8ad3", true); g.events.push("parry");
    const d = g.dance;
    if (dance) {
      // Every bullet caught in one swing feeds the streak; heat is what the room is worth.
      d.streak += Math.max(1, slapped); d.best = Math.max(d.best, d.streak);
      d.heat = Math.min(2.2, d.heat + .18 + Math.max(0, slapped - 1) * .12);
      // Slap them back: each caught shot becomes a homing riposte at the nearest creep.
      let tgt: Enemy | null = null, tb = 1e9;
      for (const e of g.enemies) { if (e.hidden || e.airborne > 0 || e.hp <= 0) continue; const dd = dist(e, p); if (dd < tb) { tb = dd; tgt = e; } }
      for (const c of caught) {
        const a = tgt ? Math.atan2(tgt.y - c.y, tgt.x - c.x) : p.angle + Math.PI;
        g.bullets.push({
          x: c.x, y: c.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, life: 1.5, maxLife: 1.5,
          damage: 30 * p.damage * (1 + d.heat * .6), r: 7, color: "#ffe27a", pierce: 1, bounces: 0,
          chains: 0, hitIds: [], spin: 0, homing: .5, riposte: true,
        });
      }
      if (slapped >= 3) { say(g, p.x, p.y - 88, `${slapped} AT ONCE!`, "#ffe27a", true); g.events.push("cheer"); }
      if (d.streak === 12) { say(g, p.x, p.y - 92, "THE CROWD IS UP!", "#ffe27a", true); g.events.push("cheer"); }
      if (d.streak === 24) { say(g, p.x, p.y - 92, "SHOWSTOPPER!", "#ff8ad3", true); g.events.push("cheer"); }
    }
    g.score += Math.round(150 * p.scoreMult
      * (g.mode === "beat" && g.onBeat ? 2 : 1)
      * (dance ? 1 + Math.min(2, d.streak * .1) : 1));
    if (g.upgrades.parryheal) {
      p.health = Math.min(p.maxHealth, p.health + 4 * g.upgrades.parryheal);
      say(g, p.x, p.y - 48, "+HEAL", "#6fe08a");
    }
  } else {
    p.parryFlash = .14;
  }
  return hit;
}
export function collect(g: GameState, k: Pickup) {
  const p = g.player; k.life = 0;
  if (k.kind === "heart") { p.health = Math.min(p.maxHealth, p.health + 25); say(g, p.x, p.y - 56, "+25 HP", "#ff8a8a"); g.events.push("pickup"); }
  else if (k.kind === "coin") { p.coins++; g.score += Math.round(60 * p.scoreMult); addCards(g, .12); say(g, k.x, k.y - 14, "+1¢", "#ffe27a"); g.events.push("coin"); }
  else if (k.kind === "goldbar") { p.coins += 50; g.score += Math.round(1500 * p.scoreMult); addCards(g, 1.0); say(g, k.x, k.y - 14, "+50¢ GOLD!", "#ffd700", true); g.events.push("coin"); }
  else if (k.kind === "rapid") { p.rapid = 8; say(g, p.x, p.y - 60, "HOT HANDS!", "#ff6a3d", true); g.events.push("powerup"); }
  else if (k.kind === "shield") { p.shield = 2; say(g, p.x, p.y - 60, "TIN UMBRELLA!", "#8fd1ff", true); g.events.push("powerup"); ring(g, p.x, p.y, "#8fd1ff", 80); }
  else if (k.kind === "clock") { p.clock = 6; say(g, p.x, p.y - 60, "TIME OUT!", "#f2c14e", true); g.events.push("clock"); g.flash = .3; }
  else if (k.kind === "star") { p.star = 6; say(g, p.x, p.y - 60, "LUCKY STAR!", "#fff3c4", true); g.events.push("star"); ring(g, p.x, p.y, "#fff3c4", 100); }
  else if (k.kind === "magnet") { for (const o of g.pickups) if (o.kind === "coin" || o.kind === "heart") o.phase = -99; say(g, p.x, p.y - 60, "MAGNET!", "#d84a45", true); g.events.push("powerup"); }
  else if (k.kind === "wind") {
    if (g.mode === "glass") { p.shield++; say(g, p.x, p.y - 56, "+1 SHIELD!", "#74e6ff", true); }
    else { p.wind++; say(g, p.x, p.y - 60, "SPARE BREATH!", "#74e6ff", true); }
    g.events.push("star");
  }
  else if (k.kind === "decoy") { g.puddles.push({ x: k.x, y: k.y, r: 26, life: 7, max: 7, kind: "decoy" }); say(g, p.x, p.y - 60, "DUMMY OUT!", "#c9863a", true); g.events.push("powerup"); }
  else if (k.kind === "fireworks") { g.fireworks = 6; say(g, p.x, p.y - 60, "ROMAN CANDLE!", "#ff5aa5", true); g.events.push("powerup"); }
  else if (k.kind === "mirror") { p.mirror = 6; say(g, p.x, p.y - 60, "FUNHOUSE MIRROR!", "#b8d8e8", true); g.events.push("powerup"); ring(g, p.x, p.y, "#b8d8e8", 110); }
  else if (k.kind === "bees") {
    p.bees = 8; say(g, p.x, p.y - 60, "JAR OF BEES!", "#ffc94a", true); g.events.push("powerup");
    for (let i = 0; i < 8; i++) spawnCompanion(g, p.x + rnd(-30, 30), p.y + rnd(-30, 30), 8, 7 * p.damage, true);
  }
  else if (k.kind === "grease") {
    p.grease = 9; say(g, p.x, p.y - 60, "GREASE EVERYWHERE!", "#c9a227", true); g.events.push("powerup");
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU, dd = rnd(70, 220);
      g.puddles.push({ x: p.x + Math.cos(a) * dd, y: p.y + Math.sin(a) * dd * .7, r: 44, life: 9, max: 9, kind: "grease" });
    }
  }
  else if (k.kind === "nuke") {
    g.flash = 1.0; g.shake = 30; ring(g, p.x, p.y, "#ff3333", 600);
    for (const b of g.bullets) if (b.enemy) b.life = 0;
    for (const e of g.enemies) { damageEnemy(g, e, e.kind === "boss" ? 220 : 180, "#ff3333"); }
    say(g, p.x, p.y - 80, "BIG KABOOM!", "#ff5555", true);
    g.events.push("boom");
  }
  else if (k.kind === "bomb") {
    g.flash = .6; g.shake = 16; ring(g, p.x, p.y, "#2a2230", 400);
    for (const b of g.bullets) if (b.enemy) b.life = 0;
    for (const e of g.enemies) { damageEnemy(g, e, e.kind === "boss" ? 60 : 45, "#2a2230"); e.slow = Math.max(e.slow, 2.5); }
    say(g, p.x, p.y - 60, "INK BOMB!", "#fff3c4", true); g.events.push("boom");
  }
  else if (k.kind === "weapon" && k.weapon) {
    const key = k.weapon, old = g.weapons[g.active], otherSlot = g.active === 0 ? 1 : 0;
    if (g.weapons[otherSlot] === key) g.weapons[otherSlot] = old;
    g.weapons[g.active] = key; g.cratesOpened++;
    p.charge = 0; g.shot = 0; g.flash = .3; ring(g, p.x, p.y, WEAPONS[key].color, 120); puff(g, k.x, k.y, WEAPONS[key].color, 14, 160, 5);
    const isNew = !g.unlocks.includes(key);
    if (isNew) {
      g.unlocks.push(key); g.found.push(key);
      g.announce = { title: WEAPONS[key].name, sub: "NEW WEAPON UNLOCKED FOR THE ARMORY", life: 3.4 };
      g.events.push("unlock");
    } else {
      g.announce = { title: WEAPONS[key].name, sub: `SWAPPED OUT ${WEAPONS[old].name.toUpperCase()}`, life: 2.4 };
      g.events.push("crateopen");
    }
    say(g, p.x, p.y - 64, "GOT IT!", "#ffe27a", true);
  }
  puff(g, k.x, k.y, k.kind === "heart" ? "#ff6b6b" : "#ffd75a", 5, 90, 3);
}

