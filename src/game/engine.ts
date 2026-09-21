/**
 * Core simulation: run state and the master update() loop.
 * Mechanics live in focused modules — util (math + spatial index), fx (particles/text),
 * spawn (creeps/boss/crates), combat (damage/parry/pickups), weapons (fire + EX),
 * hazards, companions, economy (shop/boons), achievements. The public API below is
 * unchanged, so App and the test harnesses import everything from here as before.
 */
import { BIOMES, BIOME_LENGTH, CHARACTERS, ENEMIES, MODIFIERS, WAVES, WEAPONS } from "./data";
import type { CharmKey, CharacterKey, Enemy, EnemyKind, GameState, Input, Mode, Player, Point, WeaponKey } from "./types";
import { buildGrid, clamp, compact, dist, fieldTop, HORIZON, liveBuf, nearBuf2, nearby, pick, rnd, sanitize, TAU, viewBand, worldBounds } from "./util";
import { addCards, drop, encounterPulse, puff, ring, say } from "./fx";
import { canStand, rowSpanOf, stageAt, worldOf, type MapId, type StageDef } from "./world";
import { enemyShot, spawnBoss, spawnCrate, spawnEnemy } from "./spawn";
import { collect, damageEnemy, hurtPlayer, killEnemy, tryParry } from "./combat";
import { fireEx, fireWeapon } from "./weapons";
import { spawnHazard, updateHazards } from "./hazards";
import { updateCompanions } from "./companions";

export { HORIZON } from "./util";
export { ACHIEVEMENTS, earnedAchievements } from "./achievements";

/** How long a trigger press is remembered while the gun is busy (seconds). Long enough to cover
 *  hit-stop (.08) and a dash (.19) on its own. */
export const FIRE_BUFFER = 0.14;
/** A press is remembered for at least FIRE_BUFFER, and for as long as the gun in hand takes to
 *  reload, so a pull made *during* the reload still produces its shot when the reload ends instead
 *  of being thrown away. Capped so a tap can never sit queued for more than about a second. */
export const bufferFor = (key: WeaponKey) => Math.max(FIRE_BUFFER, Math.min(1.1, (WEAPONS[key]?.rate ?? 200) / 1000 * 1.05));
/** When a weapon declines the shot (the yo-yo is still out, the flock is already airborne) the
 *  reload is set to this instead of the weapon's rate, so the throw lands the instant it can. */
const DECLINED_SHOT = 90;
export type { AchievementDef } from "./achievements";
export { applyUpgrade, buyShopItem, pickUpgrades } from "./economy";

const MODE_INTROS: Partial<Record<Mode, { title: string; sub: string; life: number }>> = {
  bulletdance: { title: "BULLET DANCE", sub: "EVERY SHOT IS PINK. SLAP THEM ALL BACK.", life: 3.6 },
  beat: { title: "ON THE BEAT", sub: "HIT WITH THE BAND — ×1.75 ON BEAT, ×0.7 OFF", life: 3.6 },
  glass: { title: "GLASS CANNON", sub: "ONE HP. EVERYTHING HURTS. YOU HIT LIKE A TRAIN.", life: 3.6 },
  blackout: { title: "BLACKOUT", sub: "A SMALL CIRCLE OF LIGHT. BULBS WIDEN IT.", life: 3.6 },
};

export function createState(w: number, h: number, weapons: [WeaponKey, WeaponKey], charm: CharmKey, unlocks: WeaponKey[], character: CharacterKey = "milo", daily?: number, mode: Mode = "endless", districts = 1, rows = 1, mapId: MapId = "arena"): GameState {
  // An authored map decides its own size; the numbers passed in are only for the legacy grid.
  const world0 = worldOf(mapId);
  if (world0.stages.length) { districts = world0.cols; rows = world0.rows; }
  const ch = CHARACTERS[character] ?? CHARACTERS.milo;
  const p: Player = {
    x: w / 2, y: h * .62, r: 20 * ch.radius, health: mode === "glass" ? 1 : 100 * ch.health, maxHealth: mode === "glass" ? 1 : 100 * ch.health, invuln: 0,
    speed: 250 * ch.speed, damage: ch.damage, angle: 0, facing: 1,
    dashTime: 0, dashCd: 0, dashDir: { x: 1, y: 0 }, charge: 0, squash: 0, parryFlash: 0, cards: 0, moving: false, superTime: 0,
    fireRate: ch.fireRate, dashCdMult: ch.dashCdMult, magnet: 70, cardGain: 1, crit: 0, regen: 0, extraShots: 0, scoreMult: 1,
    trail: [], parryCd: 0, rapid: 0, shield: ch.shield + (charm === "thimble" ? 1 : 0), blink: 0,
    star: 0, clock: 0, magnetBoost: 0, webbed: 0, rhythm: 0, wind: charm === "wind" && mode !== "glass" ? 1 : 0, burning: 0,
    coins: 0, comboStreak: 0,
    character, skin: "", step: 0, momentum: 0, mx: 0, my: 0, mirror: 0, bees: 0, grease: 0, gunk: 0, grapple: null, shieldTimer: charm === "thimble" ? 25 : 0,
    anim: 0, recoil: 0, runCycle: 0, trigger: 0,
  };
  if (charm === "locket") { p.maxHealth = 140 * ch.health; p.health = p.maxHealth; p.damage *= .88; }
  if (charm === "smoke") p.dashCdMult *= .7;
  if (charm === "penny") p.scoreMult = 1.4;
  if (charm === "magneto") p.magnet = 210;

  // Daily reel: one deterministic shuffle + one modifier that lasts the whole run
  let dailyOrder: number[] | undefined; let startMod: GameState["modifier"] = null; let startModTimer = 45;
  if (daily !== undefined) {
    let sd = daily >>> 0;
    const rr = () => { sd = (sd + 0x6d2b79f5) >>> 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    dailyOrder = BIOMES.map((_, i) => i);
    for (let i = dailyOrder.length - 1; i > 0; i--) { const j = Math.floor(rr() * (i + 1)); const tmp = dailyOrder[i]; dailyOrder[i] = dailyOrder[j]; dailyOrder[j] = tmp; }
    const m = MODIFIERS[Math.floor(rr() * MODIFIERS.length)];
    startMod = { ...m, time: 1e9 }; startModTimer = 1e9;
  }

  const dist = Math.max(1, Math.round(districts));
  const rw = Math.max(1, Math.round(rows));
  return {
    viewW: w, viewH: h, worldW: Math.round(w * dist), districts: dist, worldH: Math.round(h * rw), rows: rw, tCol: 0, tRow: 0, cam: { x: 0, y: 0 }, biomeNext: 0, biomeMix: 0,
    map: mapId, stage: world0.stages.length ? stageAt(world0, 0, 0) ?? null : null,
    player: p, enemies: [], bullets: [], puffs: [], texts: [], pickups: [], puddles: [], ghosts: [],
    platforms: [], hazards: [], companions: [],
    score: 0, kills: 0, parries: 0, damageTaken: 0, level: 1,
    combo: 0, comboTime: 0, elapsed: 0, spawn: 1.2, shot: 0, id: 1, shake: 0, nextUpgrade: 16, weapons, active: 0, charm, boss: null,
    bossTimer: 80, bossesBeaten: 0, announce: MODE_INTROS[mode] ?? { title: BIOMES[0].name, sub: `ENTERING: ${BIOMES[0].hazardTip}`, life: 3.4 }, over: false, upgradeReady: false,
    flash: 0, slowmo: 0, hitstop: 0, biome: 0, upgrades: {}, events: [], bulbTimer: 7, maxCombo: 0,
    crateTimer: charm === "penny" ? 22 : 32, slotPity: 0, lastThreat: "", modifier: startMod, modTimer: startModTimer, unlocks: [...unlocks], found: [], cratesOpened: 0,
    wave: 0, waveTimer: 60, waveKind: null, lowFx: false, fxBudget: 1, revives: 0, fireworks: 0,
    shopOpen: false, shopNpc: null, shopItems: [], bossIntro: null,
    hazardTimer: 6, hazardKind: null,
    dailyOrder, dailySeed: daily, stats: { shots: 0, hits: 0, byWeapon: {} },
    mode, dance: { streak: 0, best: 0, heat: 0, riposte: 0 },
    bulbPulse: 0,
    beatT: 0, onBeat: false,
    lightR: mode === "blackout" ? 250 : 9999,
  };
}

export const currentWeapon = (g: GameState) => g.weapons[g.active];
export const characterOf = (g: GameState) => CHARACTERS[g.player.character] ?? CHARACTERS.milo;

export function update(g: GameState, input: Input, dt: number, vw: number, h: number) {
  // The map is a grid of one-screen districts: `districts` across, `rows` down, one biome each.
  // Resync on resize (or when the player changes the map size in Options) and keep the world sized.
  const world = worldOf(g.map ?? "arena");
  const authored = world.stages.length > 0;
  if (authored && (g.districts !== world.cols || g.rows !== world.rows)) { g.districts = world.cols; g.rows = world.rows; }
  const wantW = Math.max(1, Math.round(g.districts || 1)), wantR = Math.max(1, Math.round(g.rows || 1));
  g.rows = wantR;
  if (g.viewW !== vw || g.viewH !== h || g.worldW !== vw * wantW || g.worldH !== h * wantR) {
    g.viewW = vw; g.viewH = h; g.worldW = Math.round(vw * wantW); g.worldH = Math.round(h * wantR);
  }
  if (!g.cam) g.cam = { x: 0, y: 0 };
  // One unrecoverable number (a NaN from a zero-size viewport, a tampered save) would otherwise
  // put the whole run off screen and keep "playing". Repair it and bound the effect pools.
  sanitize(g);
  const w = g.worldW, p = g.player, b = worldBounds(g, w, h);
  // Once rows of stages are stacked the world is taller than the screen. Everything that lives in
  // world space — bullet culling, drops, the shopkeeper — has to be measured against this number,
  // not against the viewport. Culling bullets by the viewport height deleted every shot fired on
  // the second and third row of the big map before it was ever drawn.
  const wh = Math.max(h, g.worldH || h);
  // Trigger buffer: a press is remembered for a beat, so hit-stop, a dash, or the tail of a
  // weapon's cooldown can never swallow a shot the player actually asked for. It does not decay
  // while dashing or frozen, which is exactly when taps used to vanish.
  if (input.fire) p.trigger = Math.max(p.trigger, FIRE_BUFFER);
  else if (p.dashTime <= 0 && g.hitstop <= 0) p.trigger = Math.max(0, p.trigger - dt);
  if (!Number.isFinite(p.trigger) || p.trigger < 0) p.trigger = input.fire ? FIRE_BUFFER : 0;
  const consume = () => {
    input.dash = false; input.parry = false; input.ex = false; input.superMove = false; input.swap = false; input.interact = false;
  };
  if (g.hitstop > 0) { g.hitstop -= dt; consume(); return; }

  const load = g.enemies.length + g.bullets.length * .35 + g.puffs.length * .08;
  g.fxBudget = g.lowFx ? .35 : load > 120 ? .35 : load > 70 ? .6 : 1;
  const ts = g.slowmo > 0 ? .4 : 1; g.slowmo = Math.max(0, g.slowmo - dt); const d = dt * ts;
  const worldD = p.clock > 0 ? d * .35 : d;
  const rate = p.fireRate * (p.rapid > 0 ? 2 : 1);

  g.elapsed += worldD; g.shot -= d * 1000 * rate; p.invuln -= d; p.dashCd -= d; p.parryCd -= d;
  p.superTime = Math.max(0, p.superTime - d); p.rapid = Math.max(0, p.rapid - d);
  p.mirror = Math.max(0, p.mirror - d); p.bees = Math.max(0, p.bees - d); p.grease = Math.max(0, p.grease - d);
  p.recoil = Math.max(0, p.recoil - d * 6); p.anim += d;
  p.runCycle += p.moving ? d * 11 : d * 2;
  // Lucky Thimble slowly regrows a shield charge
  if (g.charm === "thimble") { p.shieldTimer -= d; if (p.shieldTimer <= 0) { p.shieldTimer = 25; if (p.shield < 2) { p.shield++; say(g, p.x, p.y - 60, "THIMBLE UP!", "#c0c8d8"); ring(g, p.x, p.y, "#c0c8d8", 70); } } }
  p.star = Math.max(0, p.star - d); p.clock = Math.max(0, p.clock - d); p.webbed = Math.max(0, p.webbed - d);
  p.squash = Math.max(0, p.squash - d * 4); p.parryFlash = Math.max(0, p.parryFlash - d); g.flash = Math.max(0, g.flash - d * 2);
  g.comboTime -= d; if (g.comboTime <= 0) g.combo = 0;
  p.blink -= d; if (p.blink < -.15) p.blink = rnd(2, 5);
  // ON THE BEAT: the band sets the clock — actions inside the pulse land hard
  if (g.mode === "beat") { g.beatT += dt; const B = 60 / 88, ph = g.beatT % B; g.onBeat = ph < .15 || ph > B - .15; }
  // BULLET DANCE: dance heat bores a hole in the floor — it decays unless you keep slapping bullets.
  if (g.mode === "bulletdance") {
    const d = g.dance;
    d.heat = Math.max(0, d.heat - dt * .42);
    d.riposte = Math.max(0, d.riposte - dt);
    if (d.streak && d.heat <= 0) { d.streak = 0; }
    if (d.streak >= 8 && d.streak % 8 === 0 && d.riposte <= 0) d.riposte = .001;
  }
  if (g.announce && (g.announce.life -= dt) <= 0) g.announce = null;
  if (g.bulbPulse > 0) g.bulbPulse = Math.max(0, g.bulbPulse - dt);
  if (g.bossIntro && (g.bossIntro.life -= dt) <= 0) g.bossIntro = null;

  const DW = g.worldW / wantW, DH = g.worldH / wantR;
  // The camera chases the player with a little look-ahead at the aim, then clamps to the world.
  const camLead = input.aim ? Math.max(-90, Math.min(90, (input.aim.x - p.x) * .1)) : 0;
  // Where a row is shorter than the slab, let the view leak a little past its end: the torn ink
  // margin and the doorway signage are authored art, and they are the payoff of a shaped map. A
  // full screen of nothing would be worse, so the leak is capped at a quarter of a viewport.
  const camSpan = authored && wantW > 1 ? rowSpanOf(world, g.tRow) : null;
  const leak = Math.min(g.viewW * .25, DW * .25);
  const camLo = camSpan ? Math.max(0, camSpan.c0 * DW - (camSpan.c0 > 0 ? leak : 0)) : 0;
  const camHi = camSpan
    ? Math.min(Math.max(0, g.worldW - g.viewW), (camSpan.c1 + 1) * DW - g.viewW + (camSpan.c1 < wantW - 1 ? leak : 0))
    : Math.max(0, g.worldW - g.viewW);
  const camTo = Math.max(camLo, Math.min(Math.max(camLo, camHi), p.x - g.viewW / 2 + camLead));
  // chase smoothly, but snap if the gap is more than most of a screen — otherwise a blink, a
  // hook pull or a window resize would spend a second panning, and spawns follow the camera.
  if (Math.abs(camTo - g.cam.x) > g.viewW * .7) g.cam.x = camTo;
  else { g.cam.x += (camTo - g.cam.x) * Math.min(1, dt * 7.5); if (Math.abs(camTo - g.cam.x) < .6) g.cam.x = camTo; }
  // the same chase on the vertical axis, which is how the upper and lower halves of the map are reached
  const camLeadY = input.aim ? Math.max(-70, Math.min(70, (input.aim.y - p.y) * .1)) : 0;
  const camToY = wantR > 1 ? Math.max(0, Math.min(Math.max(0, g.worldH - g.viewH), p.y - g.viewH / 2 + camLeadY)) : 0;
  if (wantR > 1) {
    if (Math.abs(camToY - g.cam.y) > g.viewH * .7) g.cam.y = camToY;
    else { g.cam.y += (camToY - g.cam.y) * Math.min(1, dt * 7.5); if (Math.abs(camToY - g.cam.y) < .6) g.cam.y = camToY; }
  } else g.cam.y = 0;
  // Anything the world hands you — loot, weather, a conjurer's trick — has to arrive in the
  // district you can actually see, or a ten-screen map would quietly empty itself around you.
  const place = g.districts > 1 ? viewBand(g, w, h) : b;
  if (authored && wantW > 1) {                       // viewBand hands out a fresh box: safe to trim
    const sp = rowSpanOf(world, g.tRow);
    place.minX = Math.max(place.minX, sp.c0 * DW + 30);
    place.maxX = Math.min(place.maxX, (sp.c1 + 1) * DW - 30);
    if (place.maxX < place.minX) { place.minX = b.minX; place.maxX = b.maxX; }
  }
  // Which stage you are standing in is a place now, not a clock — walk across the boards and the show changes.
  const focus = wantW > 1 ? Math.max(0, Math.min(g.worldW - 1, g.cam.x + g.viewW / 2)) : p.x;
  const focusY = wantR > 1 ? Math.max(0, Math.min(g.worldH - 1, g.cam.y + g.viewH / 2)) : p.y;
  const fIdx = Math.max(0, Math.min(wantW - 1, Math.floor(focus / DW))), fFrac = focus / DW - Math.floor(focus / DW);
  const seam = Math.min(fFrac, 1 - fFrac);
  g.biomeMix = wantW > 1 ? Math.max(0, Math.min(1, 1 - seam / .14)) : 0;
  g.biomeNext = Math.max(0, Math.min(BIOMES.length - 1, Math.floor(focus / DW) + (fFrac > .5 ? 1 : -1)));
  let col = fIdx, row = Math.max(0, Math.min(wantR - 1, Math.floor(focusY / DH)));
  if (wantW > 1 || wantR > 1) {
    // Hysteresis: straddling a seam — or sliding on Frostbite ice — must not flicker the stage, or
    // every pixel of drift would re-announce the act and wipe the hazards. Commit once you are
    // clearly inside the new tile; a long fling (more than a tile away) always commits.
    const inside = (c: number, r: number, pad: number) =>
      focus > c * DW + pad * DW && focus < (c + 1) * DW - pad * DW &&
      focusY > r * DH + pad * DH && focusY < (r + 1) * DH - pad * DH;
    const far = Math.abs(col - g.tCol) > 1 || Math.abs(row - g.tRow) > 1;
    if (!far && (col !== g.tCol || row !== g.tRow) && !inside(col, row, .06)) { col = g.tCol; row = g.tRow; }
  }
  // An authored map names the screen you are standing on; the legacy grid still derives the act
  // from the tile (rows offset by four so no two neighbours share an act).
  let stage: StageDef | null = null;
  if (authored) {
    const c0 = Math.max(0, Math.min(world.cols - 1, col)), r0 = Math.max(0, Math.min(world.rows - 1, row));
    stage = stageAt(world, c0, r0) ?? g.stage ?? null;
    if (!stage) {                                     // the silhouette's voids: nearest screen over
      outer: for (let d = 1; d < 6; d++) for (let dr = -d; dr <= d; dr++) for (let dc = -d; dc <= d; dc++) { const s = stageAt(world, c0 + dc, r0 + dr); if (s) { stage = s; break outer; } }
    }
  }
  g.stage = stage;
  const biome = stage ? stage.biome : (wantW > 1 || wantR > 1
    ? (((col + row * 4) % BIOMES.length) + BIOMES.length) % BIOMES.length
    : (g.dailyOrder ? g.dailyOrder[Math.floor(g.elapsed / BIOME_LENGTH) % g.dailyOrder.length] : Math.floor(g.elapsed / BIOME_LENGTH) % BIOMES.length));
  g.tCol = col; g.tRow = row;
  if (biome !== g.biome || (stage && stage.id !== (g as unknown as { lastStageId?: number }).lastStageId)) {
    (g as unknown as { lastStageId?: number }).lastStageId = stage?.id;
    g.biome = biome;
    g.announce = { title: stage ? stage.name : BIOMES[biome].name, sub: stage ? stage.tagline : BIOMES[biome].hazardTip, life: 3.8 };
    g.events.push("biome");
    encounterPulse(g, p.x, p.y, BIOMES[biome]?.accent ?? "#f7d267", 140);
    // clear the outgoing biome's hazards so threats never bleed across stages
    g.hazards.length = 0;
    g.hazardTimer = 3.2;
    // Update platform layout for the stage you just walked into
    const tileX = g.tCol * DW, tileY = g.tRow * DH;
    if (BIOMES[biome].decor === "train") {
      g.platforms = [
        { x: tileX + DW * 0.2, y: tileY + DH * 0.75, w: 140, h: 22, kind: "train", vx: -80 },
        { x: tileX + DW * 0.55, y: tileY + DH * 0.68, w: 160, h: 22, kind: "train", vx: -80 },
        { x: tileX + DW * 0.82, y: tileY + DH * 0.8, w: 130, h: 22, kind: "train", vx: -80 },
      ];
    } else {
      g.platforms = [];
    }
    // …plus whatever this particular screen has bolted to the boards: crates to hop, a loading
    // lip, a fallen beam. Authored per stage, so the geography of a screen is not random.
    if (stage?.ledges) {
      for (const [lx, ly, lw] of stage.ledges) {
        g.platforms.push({ x: tileX + lx * DW, y: tileY + ly * DH, w: lw * DW, h: 16, kind: "plank", vx: 0 });
      }
    }
  }

  // Update dynamic platforms
  for (const pl of g.platforms) {
    pl.x += pl.vx * d;
    const d0 = Math.max(0, Math.floor(pl.x / DW)) * DW;   // wrap inside the district it lives in
    if (pl.x < d0 - pl.w) pl.x = d0 + DW + 40;
    if (pl.x > d0 + DW + 40) pl.x = d0 - pl.w;
  }

  if (g.charm === "coffee") addCards(g, d * .07);
  if (p.regen > 0) p.health = Math.min(p.maxHealth, p.health + p.regen * d);

  if (g.shopNpc && g.shopNpc.active) {
    const npc = g.shopNpc;
    // Porbo waits for you while you are in earshot — walking away is what closes him.
    const near = dist(npc, p) < 230;
    npc.talkTimer -= d * (near ? .25 : 1);
    if (input.interact && near) {
      g.shopOpen = true;
      g.events.push("shopopen");
      say(g, npc.x, npc.y - 70, pick(["WHAT'LL IT BE?", "FRESH STOCK!", "STEP RIGHT UP!"]), "#ffd700", true);
      npc.talkTimer = Math.max(npc.talkTimer, 6);
    }
    if (npc.talkTimer <= 0) {
      npc.active = false;
      g.shopOpen = false;
      say(g, npc.x, npc.y - 60, "CATCH YOU NEXT ACT!", "#c9b48a");
    }
  }

  // Stage modifiers & waves
  if (g.modifier) {
    g.modifier.time -= worldD;
    if (g.modifier.time <= 0) { g.modifier = null; g.modTimer = rnd(40, 60); }
  } else {
    g.modTimer -= worldD;
    if (g.modTimer <= 0 && !g.boss) {
      const m = pick(MODIFIERS);
      g.modifier = { ...m };
      g.announce = { title: m.name, sub: m.sub, life: 3 };
      g.events.push("modifier");
      if (m.id === "pink") {
        for (const bl of g.bullets) if (bl.enemy) { bl.pink = true; bl.color = "#ff7ad9"; }
      }
    }
  }
  if (g.modifier?.id === "coins" && Math.random() < worldD * 3) drop(g, rnd(place.minX, place.maxX), rnd(place.minY, place.maxY), "coin");
  if (g.modifier?.id === "meteor" && Math.random() < worldD * 2) {
    const rx = rnd(place.minX, place.maxX);
    g.bullets.push({
      x: rx, y: fieldTop(g, h) - 60, vx: rnd(-20, 20), vy: 340, life: 2.2, maxLife: 2.2, damage: 18,
      r: 14, color: "#ff5555", enemy: true, splash: 70, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU)
    });
  }
  if (g.modifier?.id === "rain" && Math.random() < worldD * 6) {
    g.bullets.push({
      x: rnd(place.minX, place.maxX), y: fieldTop(g, h) - 30, vx: rnd(-14, 14), vy: 300, life: 2.4, maxLife: 2.4, damage: 10,
      r: 7, color: "#2a2230", enemy: true, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU)
    });
  }

  g.waveTimer -= worldD;
  if (g.waveTimer <= 0 && !g.boss) {
    const wv = WAVES.filter((x) => x.kinds.every((k) => g.elapsed >= ENEMIES[k as EnemyKind].unlock));
    const pickW = wv.length ? pick(wv) : WAVES[0];
    g.waveKind = pickW.id;
    g.announce = { title: pickW.name, sub: pickW.sub, life: 2.6 };
    g.events.push("wave");
    encounterPulse(g, p.x, p.y, "#ffc857", 170);
    for (let i = 0; i < pickW.count; i++) spawnEnemy(g, w, h, pick(pickW.kinds) as EnemyKind);
    g.wave++; g.waveTimer = rnd(38, 55);
  }

  if (input.swap) {
    g.active = g.active === 0 ? 1 : 0;
    p.charge = 0;
    p.trigger = 0;                       // a press buffered for the old gun is not the new gun's business
    g.shot = Math.max(g.shot, 120);
    say(g, p.x, p.y - 60, WEAPONS[currentWeapon(g)].name.toUpperCase(), "#fff3c4");
    g.events.push("swap");
  }

  // Movement & dash
  let mx = input.mx, my = input.my; const ml = Math.hypot(mx, my);
  if (ml > 1) { mx /= ml; my /= ml; }
  p.moving = ml > .1;
  p.gunk = Math.max(0, p.gunk - d);
  const webSlow = (p.webbed > 0 ? .3 : 1) * (p.gunk > 0 ? .55 : 1);
  // Slippery Glaze (Frostbite Rail): the longer you stand on ice the less the brakes bite
  const grip = 1 - p.momentum * .84;
  const steer = Math.min(1, d * (11 * grip + 1.4));
  p.mx += (mx - p.mx) * steer; p.my += (my - p.my) * steer;
  p.momentum = Math.max(0, p.momentum - d * .6);
  if (p.moving && p.dashTime <= 0 && p.dashCd > 0) { p.step += d; if (p.step > .26) { p.step = 0; puff(g, p.x - p.facing * 10, p.y + 34, "rgba(232,223,207,.45)", 1, 26, 3); } } else p.step = 0;
  if (input.dash && p.dashCd <= 0 && p.dashTime <= 0) {
    p.dashTime = .19; p.dashCd = 1.15 * p.dashCdMult; p.invuln = Math.max(p.invuln, g.charm === "smoke" ? .5 : .22);
    p.squash = .6; p.webbed = 0; p.momentum = 0; p.mx = mx; p.my = my;
    p.dashDir = p.moving ? { x: mx, y: my } : { x: Math.cos(p.angle), y: Math.sin(p.angle) };
    puff(g, p.x, p.y + 20, "#e8dfcf", 8, 90, 7);
    g.events.push("dash");
    if (g.charm === "smoke") {
      for (const e of g.enemies) if (dist(e, p) < 70 && !e.hidden) damageEnemy(g, e, 8 * p.damage, "#cfd6e2");
    }
    if (g.charm === "spurs") {
      // Tap Shoes: a wide stomping arc, and a burst of light-footed speed
      ring(g, p.x, p.y + 8, "#f0c24d", 110);
      for (const e of nearby(p.x, p.y, 130, nearBuf2)) {
        if (!e.hidden && e.airborne <= 0 && dist(e, p) < 120 + e.r) {
          damageEnemy(g, e, 14 * p.damage, "#f0c24d");
          if (e.kind !== "boss") { const dd = dist(e, p) || 1; e.x += (e.x - p.x) / dd * 34; e.y += (e.y - p.y) / dd * 34; }
        }
      }
      p.magnetBoost = 1.1;
    }
  }
  if (p.dashTime > 0) {
    p.dashTime -= d;
    p.x += p.dashDir.x * p.speed * 3.6 * d;
    p.y += p.dashDir.y * p.speed * 3.6 * d;
    if (Math.random() < .5) puff(g, p.x - p.dashDir.x * 16, p.y + 12, "#efe6d5", 1, 40, 8);
    if (g.upgrades.dashfire && Math.random() < .8) {
      g.bullets.push({
        x: p.x, y: p.y + 10, vx: 0, vy: 0, life: .9, maxLife: .9, damage: 6 * p.damage, r: 16,
        color: "#ff6a3d", weapon: "fountain", pierce: 99, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU), burn: 3, tick: .3
      });
    }
    if (g.charm === "spurs") {
      // e.hit doubles as a per-creep cooldown so one dash cannot tick dozens of times
      for (const e of nearby(p.x, p.y, 70, nearBuf2)) {
        if (!e.hidden && e.airborne <= 0 && e.hit <= 0 && dist(e, p) < 56 + e.r) damageEnemy(g, e, 5 * p.damage, "#f0c24d");
      }
    }
  } else {
    p.x += p.mx * p.speed * d * webSlow * (p.magnetBoost > 0 ? 1.35 : 1);
    p.y += p.my * p.speed * d * webSlow * (p.magnetBoost > 0 ? 1.35 : 1);
    if (p.trail.length) p.trail.shift();
  }
  if (p.grapple) {
    const gd = Math.hypot(p.grapple.tx - p.x, p.grapple.ty - p.y) || 1;
    if (gd < 26 || (p.grapple.t -= d) <= 0) p.grapple = null;
    else { p.x += (p.grapple.tx - p.x) / gd * 760 * d; p.y += (p.grapple.ty - p.y) / gd * 760 * d; p.invuln = Math.max(p.invuln, .05); }
  }
  p.magnetBoost = Math.max(0, p.magnetBoost - d);
  p.x = clamp(p.x, b.minX, b.maxX); p.y = clamp(p.y, b.minY, b.maxY);
  // The map is a stepped slab, not a box: the row under your feet says how far you may walk, and a
  // row with no ground at this column is a wall — the world ends, and it is dressed to look that way.
  if (authored && wantW > 1) {
    const sp = rowSpanOf(world, g.tRow);
    p.x = Math.max(sp.c0 * DW + 26, Math.min((sp.c1 + 1) * DW - 26, p.x));
    if (!canStand(world, g.tCol, g.tRow - 1)) p.y = Math.max(p.y, g.tRow * DH + DH * HORIZON + 26);
    if (!canStand(world, g.tCol, g.tRow + 1)) p.y = Math.min(p.y, (g.tRow + 1) * DH - 34);
  }

  liveBuf.length = 0;
  for (const e of g.enemies) if (!e.hidden && e.airborne <= 0 && e.alpha > .2) liveBuf.push(e);
  buildGrid(g.enemies);

  // Aiming & firing.
  // The trigger used to be gated on "a creep is alive somewhere in the world" and the auto-aim
  // locked on to the nearest one across all 56 stages — so between waves, or past a stage's edge,
  // or while the only threat was mid-jump, the gun looked dead. Now: fire when asked, aim at what
  // you can actually hit, and sweep in front of you otherwise.
  const wk = currentWeapon(g);
  const reach = Math.max(680, (g.viewW || 1280) * 1.6), reachRow = (g.viewH || 720) * 1.5;
  let target: Point | null = input.aim;
  let inReach = false;
  if (!target && liveBuf.length) {
    let best: Enemy | null = null, bd = Infinity;
    for (const e of liveBuf) {
      const dx = Math.abs(e.x - p.x), dy = Math.abs(e.y - p.y);
      if (dx > reach || dy > reachRow) continue;          // another stage is not a target
      const dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = e; }
    }
    if (best) { target = best; inReach = true; }
  }
  if (!target) target = { x: p.x + Math.cos(p.angle) * 220, y: p.y + Math.sin(p.angle) * 220 };
  if (ml > 0.1 && !input.aim) {
    p.facing = mx < 0 ? -1 : 1;
  }

  if (p.dashTime <= 0) {
    p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    p.facing = Math.cos(p.angle) < 0 ? -1 : 1;
  }

  // holding fire always fires; a buffered press counts as holding; auto-fire only needs a target
  // in reach, or a live creep to sweep at
  if (input.fire) p.trigger = Math.max(p.trigger, bufferFor(wk));   // remembered until this gun is ready again
  const wantsFire = p.trigger > 0 || input.fire || (input.autoFire && (inReach || liveBuf.length > 0 || g.enemies.length > 0));
  // The kettle is the one gun that boils while held: its charge follows the actual button (or
  // auto-fire holding it), never the buffer, so letting go still lets go on the same frame.
  const boiling = wk === "kettle" && (input.fire || (input.autoFire && (inReach || liveBuf.length > 0 || g.enemies.length > 0)));
  if (wk === "kettle") {
    if (boiling && target) {
      p.charge = Math.min(1, p.charge + d * 1.15 * (p.rapid > 0 ? 1.6 : 1));
      if (p.charge >= 1 && !input.fire && g.shot <= 0 && p.dashTime <= 0) {
        if (fireWeapon(g, target, wk, 1)) { p.charge = 0; p.trigger = 0; g.shot = WEAPONS[wk].rate; }
      }
      if (p.charge > .3 && Math.random() < .3) {
        puff(g, p.x + Math.cos(p.angle) * 28, p.y - 4 + Math.sin(p.angle) * 28, "#ffe05e", 1, 60, 3 + p.charge * 4);
      }
    } else if (p.charge > 0) {
      // Any release fires. The gate used to be `charge > .08`, so a quick tap was boiled up and
      // then poured away — the kettle was the one gun you could pull and get nothing from.
      if (target && g.shot <= 0 && p.dashTime <= 0) {
        if (fireWeapon(g, target, wk, Math.max(.14, p.charge))) { p.trigger = 0; g.shot = WEAPONS[wk].rate; }
        p.charge = 0;
      } else if (p.trigger <= 0) p.charge = 0;   // gun still busy and the press has faded: let the boil die
    }
  } else if (target && wantsFire && g.shot <= 0 && p.dashTime <= 0) {
    if (wk === "cuckoo" && g.bullets.filter((bl) => bl.pet && !bl.ex).length >= 2) g.shot = DECLINED_SHOT;   // the flock is out — check again soon, keep the press
    else if (fireWeapon(g, target, wk)) { p.trigger = 0; g.shot = WEAPONS[wk].rate; }
    else g.shot = DECLINED_SHOT;   // the gun declined (the yo-yo is still on its string): no reload penalty, the press stays buffered
  }

  // EX & Super
  if (input.ex && p.cards >= 1 && target) { p.cards -= 1; fireEx(g, target, wk, w, h); }
  else if (input.ex && p.cards < 1) g.events.push("deny");

  if (input.superMove && p.cards >= 5) {
    p.cards = 0; p.superTime = 1.6; g.slowmo = .9; g.flash = 1; g.shake = 22;
    ring(g, p.x, p.y, "#fff3c4", 260); ring(g, p.x, p.y, "#ff8ad3", 160);
    for (const e of g.enemies) damageEnemy(g, e, (e.kind === "boss" ? 260 : 150) * p.damage, "#fff");
    for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
    say(g, p.x, p.y - 80, "GRAND FINALE!", "#ffe27a", true);
    g.events.push("super");
  } else if (input.superMove) g.events.push("deny");

  // Parry
  if (input.parry) tryParry(g, 56, w, h);
  if (g.charm === "sugar" && p.parryCd <= 0) {
    const near = g.bullets.some((bl) => bl.enemy && bl.pink && dist(bl, p) < 46) ||
      g.pickups.some((k) => k.kind === "bulb" && dist(k, p) < 44) ||
      g.enemies.some((e) => e.pink && dist(e, p) < 44 + e.r);
    if (near && tryParry(g, 50, w, h)) p.parryCd = .45;
  }

  // Spawning
  const diff = Math.min(5, 1 + g.elapsed / 60) * (g.modifier?.id === "swarm" ? 1.8 : 1);
  // BULLET DANCE runs hotter: three bullets per volley, so fewer bodies on stage keeps it readable.
  g.spawn -= worldD * (g.boss ? .55 : 1) * (g.mode === "bulletdance" ? .8 : 1);
  const cap = g.lowFx ? 34 : 48;
  if (g.spawn <= 0 && g.enemies.length < cap) {
    const eliteChance = Math.min(.14, Math.max(0, (g.elapsed - 40) / 900));
    spawnEnemy(g, w, h, undefined, undefined, 1, Math.random() < eliteChance);
    if (diff > 2 && Math.random() < .45) spawnEnemy(g, w, h);
    if (diff > 3.5 && Math.random() < .4) spawnEnemy(g, w, h);
    g.spawn = Math.max(.28, 1.15 / (diff * (stage?.pressure ?? 1)));
  }
  g.bossTimer -= worldD;
  if (g.bossTimer <= 0 && !g.boss) spawnBoss(g, w, h);
  g.bulbTimer -= worldD;
  if (g.bulbTimer <= 0) { drop(g, rnd(place.minX + 40, place.maxX - 40), rnd(place.minY + 20, place.maxY - 20), "bulb"); g.bulbTimer = g.mode === "blackout" ? rnd(3.5, 5) : rnd(7, 11); }
  g.crateTimer -= worldD;
  if (g.crateTimer <= 0) { spawnCrate(g, w, h); g.crateTimer = (g.charm === "penny" ? 30 : 42) * (g.upgrades.crate ? Math.pow(.65, g.upgrades.crate) : 1); }

  // Stage hazards — every biome throws its own signature threat (the Phantom Express uses carriages instead)
  const biomeDef = BIOMES[g.biome];
  g.hazardTimer -= worldD;
  const hazardKind = stage?.hazard ?? biomeDef.hazard;
  if (g.hazardTimer <= 0 && !g.boss && hazardKind !== "platform") {
    spawnHazard(g, w, h, hazardKind);
    g.hazardTimer = biomeDef.hazardEvery * rnd(.75, 1.3);
  }
  updateHazards(g, worldD, w, h);
  updateCompanions(g, d, w, h);

  // Fireworks & fire
  if (g.fireworks > 0) {
    g.fireworks -= d;
    if (Math.random() < d * 6) {
      const t = liveBuf.length ? pick(liveBuf) : null;
      const tx = t ? t.x + rnd(-30, 30) : rnd(place.minX, place.maxX);
      const ty = t ? t.y + rnd(-30, 30) : rnd(place.minY, place.maxY);
      g.bullets.push({
        x: tx, y: ty, vx: 0, vy: 0, life: .01, maxLife: .01, damage: 40 * p.damage, r: 1,
        color: pick(["#ff5aa5", "#ffd166", "#74e6ff", "#8fd15a"]), weapon: "mortar", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0, splash: 90, fuse: 1
      });
    }
  }

  p.burning = Math.max(0, p.burning - d);
  for (const pu of g.puddles) {
    if (pu.kind === "fire" && p.dashTime <= 0 && dist(pu, p) < pu.r + 8 && p.burning <= 0) {
      hurtPlayer(g, 8, pu); p.burning = .5;
    }
  }

  const decoy = g.puddles.find((pu) => pu.kind === "decoy");
  const speedMod = g.modifier?.id === "double" ? 1.35 : 1;

  for (const e of g.enemies) {
    const ed = worldD;
    const tgt = decoy && e.kind !== "boss" ? decoy : p;
    e.hit -= d; e.cooldown -= ed * (g.mode === "bulletdance" ? .74 : 1); e.attack = Math.max(0, e.attack - ed); e.spawnT += ed;
    if (e.affix === "mirror") e.reflect = e.counter % 6 < 2 ? 1 : 0; // mirror-shell elites: deflect windows
    if (e.paint && (e.paint -= ed) <= 0) e.paintC = undefined;
    if (e.reflect) e.reflect -= ed;
    if (e.blind) { e.blind -= ed; e.cooldown = Math.max(e.cooldown, .5); if (Math.random() < ed * 4) puff(g, e.x + rnd(-8, 8), e.y - e.r - 8, "#fff0b8", 1, 24, 3); }
    if (e.tag && (e.tag.t -= ed) <= 0) {
      e.tag = undefined;
      // SYNERGY Cream Pie + Postage Stamp: a blinded creep cannot dodge the parcel — x1.5 blast
      const blindMul = e.blind ? 1.5 : 1;
      ring(g, e.x, e.y, "#7ee08a", 100); puff(g, e.x, e.y, "#7ee08a", 14, 180, 6);
      g.shake = Math.max(g.shake, 6); g.events.push("boom");
      for (const o of nearby(e.x, e.y, 110, nearBuf2)) if (o !== e && !o.hidden && o.hp > 0) damageEnemy(g, o, 60 * p.damage * blindMul, "#7ee08a");
      damageEnemy(g, e, 90 * p.damage * blindMul, "#7ee08a", true);
      if (blindMul > 1) say(g, e.x, e.y - e.r - 12, "SPECIAL DELIVERY!", "#7ee08a", true);
    }
    e.blink -= ed; if (e.blink < -.12) e.blink = rnd(2, 6); e.buffed = Math.max(0, e.buffed - ed);
    if (e.frozen > 0) { e.frozen -= ed; if (e.frozen <= 0) e.hit = .1; continue; }
    if (e.stun && e.stun > 0) {
      // Slapstick Peel slip: flat on their back, stars circling
      e.stun -= ed; e.x += e.vx * ed; e.y += e.vy * ed; e.vx *= .88; e.vy *= .88;
      if (Math.random() < ed * 6) puff(g, e.x + rnd(-e.r, e.r), e.y - e.r, "#ffe27a", 1, 30, 3);
      if (e.stun <= 0) e.hit = .1;
      continue;
    }
    if (e.burn > 0) {
      e.burn -= ed; e.hp -= 9 * ed;
      if (Math.random() < ed * 8) puff(g, e.x + rnd(-e.r, e.r), e.y - e.r * .5, pick(["#ff6a3d", "#ffb347", "#2a2230"]), 1, 30, 4);
      if (e.hp <= 0) e.hit = .1;
    }
    e.slow = Math.max(0, e.slow - ed);
    e.slippery = Math.max(0, (e.slippery || 0) - ed);
    for (const pu of g.puddles) {
      if (dist(pu, e) > pu.r + e.r * .5) continue;
      if (e.kind === "boss") continue;
      if (pu.kind === "tar") e.slow = Math.max(e.slow, .1);
      else if (pu.kind === "syrup") { e.slow = Math.max(e.slow, 2.2); e.burn = Math.max(e.burn, .4); }
      else if (pu.kind === "grease") { e.slippery = Math.max(e.slippery, .3); e.hp -= 4 * ed; }
      else if (pu.kind === "geyser") { e.y -= 90 * ed; e.hp -= 6 * ed; }
      else if (pu.kind === "crater") { e.slow = Math.max(e.slow, .12); e.hp -= 11 * ed; if (Math.random() < ed * 4) puff(g, e.x + rnd(-6, 6), e.y - 6, "#d9a8ff", 1, 40, 3); }
    }
    const sm = (e.slow > 0 ? .45 : 1) * speedMod * (e.buffed > 0 ? 1.4 : 1);
    let dx = tgt.x - e.x, dy = tgt.y - e.y, dd = Math.hypot(dx, dy) || 1, mult = 1, side = 0;
    const def = ENEMIES[e.kind];

    if (e.pull) {
      const pd = dist(e.pull, e) || 1;
      if (e.kind !== "boss" && pd > 6) { e.x += (e.pull.x - e.x) / pd * 260 * ed; e.y += (e.pull.y - e.y) / pd * 260 * ed; }
      e.pull = undefined;
    }
    e.facingA += ((Math.atan2(dy, dx) - e.facingA + Math.PI * 3) % TAU - Math.PI) * Math.min(1, ed * 4);

    if (e.kind === "daisy") side = Math.sin(g.elapsed * 4.5 + e.phase) * .8;
    else if (e.kind === "wisp") {
      mult = e.attack > .45 ? .05 : e.attack > 0 ? 4.4 : .7;
      if (e.cooldown <= 0) {
        puff(g, e.x, e.y, def.color, 6, 90, 5);
        const a = rnd(TAU);
        e.x = clamp(p.x + Math.cos(a) * 170, b.minX, b.maxX);
        e.y = clamp(p.y + Math.sin(a) * 150, b.minY, b.maxY);
        e.attack = .85; e.cooldown = rnd(2.6, 3.6);
        puff(g, e.x, e.y, def.color, 6, 90, 5);
        g.events.push("blink");
        dx = p.x - e.x; dy = p.y - e.y; dd = Math.hypot(dx, dy) || 1;
      }
    } else if (e.kind === "lugger") {
      if (e.cooldown <= 0) { e.attack = .95; e.cooldown = 3.2; e.vx = dx / dd; e.vy = dy / dd; g.events.push("growl"); }
      if (e.attack > .4) mult = .04;
      else if (e.attack > 0) {
        mult = 0; e.x += e.vx * 620 * ed * sm; e.y += e.vy * 620 * ed * sm;
        if (Math.random() < .5) puff(g, e.x, e.y + 20, "#c9b28d", 1, 40, 7);
      } else mult = .75;
    } else if (e.kind === "toad") {
      if (dd < 280) mult = -.4; else if (dd < 340) mult = 0;
      if (e.cooldown <= 0 && dd < 520) {
        e.counter++; const pinkVolley = e.counter % 3 === 0; const base = Math.atan2(dy, dx);
        for (const sp of [-.22, 0, .22]) enemyShot(g, e.x, e.y - 6, base + sp, 240, 10, def.color, pinkVolley && sp === 0);
        e.attack = .4; e.cooldown = 2.1; g.events.push("croak");
      }
    } else if (e.kind === "cap") {
      mult = 0;
      if (e.cooldown <= 0) {
        if (e.hidden) {
          e.hidden = false; e.cooldown = 1.5; e.attack = .5; e.counter++;
          for (let i = 0; i < 8; i++) enemyShot(g, e.x, e.y - 8, i / 8 * TAU + e.counter * .3, 165, 9, "#c47ae0", i % 4 === 0);
          g.events.push("spore");
        } else {
          e.hidden = true; e.cooldown = 1.7;
        }
      }
    } else if (e.kind === "bloat") {
      mult = 1; e.y += Math.sin(g.elapsed * 3 + e.phase) * 18 * ed;
    } else if (e.kind === "gloop") {
      mult = 0; e.x += e.vx * ed * sm; e.y += e.vy * ed * sm;
      if (e.x < b.minX || e.x > b.maxX) { e.vx *= -1; e.x = clamp(e.x, b.minX, b.maxX); }
      if (e.y < b.minY || e.y > b.maxY) { e.vy *= -1; e.y = clamp(e.y, b.minY, b.maxY); }
      if (e.cooldown <= 0) { const sp = Math.hypot(e.vx, e.vy); e.vx = dx / dd * sp; e.vy = dy / dd * sp; e.cooldown = rnd(1.5, 2.6); }
    } else if (e.kind === "nut") {
      if (e.airborne > 0) {
        e.airborne -= ed; mult = 0;
        if (e.airborne <= 0) {
          g.shake = Math.max(g.shake, 8); ring(g, e.x, e.y + 10, "#d9b27a", 80);
          puff(g, e.x, e.y + 10, "#b8763a", 10, 150, 6);
          if (dist(e, p) < 70) hurtPlayer(g, 14, e); g.events.push("thud");
        }
      } else side = Math.sin(g.elapsed * 3 + e.phase) * .3;
    } else if (e.kind === "hex") {
      mult = 0;
      if (e.cooldown <= 0) {
        e.counter++;
        if (e.counter % 2 === 1) {
          const base = Math.atan2(dy, dx);
          enemyShot(g, e.x, e.y, base - .3, 190, 11, def.color, Math.random() < .4, .05);
          enemyShot(g, e.x, e.y, base + .3, 190, 11, def.color, Math.random() < .4, .05);
          e.attack = .4; e.cooldown = 1.3; g.events.push("hex");
        } else {
          puff(g, e.x, e.y, def.color, 10, 110, 6);
          do { e.x = rnd(place.minX + 40, place.maxX - 40); e.y = rnd(place.minY + 30, place.maxY - 30); } while (dist(e, p) < 220);
          puff(g, e.x, e.y, def.color, 10, 110, 6); e.cooldown = 1.6; g.events.push("blink");
        }
      }
    } else if (e.kind === "jack") {
      mult = 0;
      if (e.attack > 0) {
        e.x += e.vx * 700 * ed; e.y += e.vy * 700 * ed;
        if (e.attack < .05) { e.cooldown = 2.2; }
      } else if (dd < 190 && e.cooldown <= 0) {
        e.attack = .32; e.vx = dx / dd; e.vy = dy / dd; g.events.push("boing"); puff(g, e.x, e.y + 10, "#e8c34a", 5, 80, 5);
      }
    } else if (e.kind === "eel") {
      const tx = -dy / dd, ty = dx / dd, inward = dd > 160 ? .55 : -.25;
      e.x += (tx + dx / dd * inward) * e.speed * ed * sm; e.y += (ty + dy / dd * inward) * e.speed * ed * sm;
      mult = 0; const segs = e.segments!; let px = e.x, py = e.y;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]; const sx = px - s.x, sy = py - s.y, sd = Math.hypot(sx, sy) || 1;
        if (sd > 14) { s.x += sx / sd * (sd - 14); s.y += sy / sd * (sd - 14); } px = s.x; py = s.y;
      }
      for (const s of segs) if (dist(s, p) < 12 + p.r) hurtPlayer(g, def.contact, s);
    } else if (e.kind === "spider") {
      side = Math.sin(g.elapsed * 2 + e.phase) * .5;
      if (e.cooldown <= 0 && dd < 420) {
        g.puddles.push({ x: e.x, y: e.y + 8, r: 42, life: 7, max: 7, kind: "web" });
        e.cooldown = rnd(3, 4.5); e.attack = .3; g.events.push("web");
      }
    } else if (e.kind === "mime") {
      const nearP = dd < 200;
      // Operator precedence bug: `(a - b) > 0` was evaluated first, so alpha crept by a
      // constant step every frame instead of easing toward its target.
      const goal = (nearP || e.hit > 0) ? 1 : .06;
      e.alpha = clamp(e.alpha + (goal - e.alpha) * Math.min(1, ed * 3.2), .06, 1);
      e.x += -mx * p.speed * .9 * ed * sm; e.y += -my * p.speed * .9 * ed * sm;
      mult = dd > 260 ? 1 : .35;
    } else if (e.kind === "bell") {
      mult = .6;
      if (e.cooldown <= 0) {
        e.cooldown = 4; e.attack = .6; ring(g, e.x, e.y, "#f0b24a", 200); g.events.push("bell");
        for (const o of nearby(e.x, e.y, 200)) if (o.id !== e.id && o.kind !== "boss" && dist(o, e) < 200) {
          o.buffed = 5; o.hp = Math.min(o.maxHp, o.hp + o.maxHp * .1);
        }
      }
    } else if (e.kind === "ghoul") {
      mult = e.revived ? 1.5 : .9;
      side = Math.sin(g.elapsed * 6 + e.phase) * (e.revived ? .9 : .2);
      if (e.revived) e.alpha = .55 + Math.sin(g.elapsed * 8) * .3;
    } else if (e.kind === "candle") {
      mult = 0; e.phase += ed * 1.6 * sm; const A = e.anchor!; const rx = 110, ry = 70;
      const nx = A.x + Math.cos(e.phase) * rx, ny = A.y + Math.sin(e.phase * 2) * ry; e.vx = nx - e.x; e.x = nx; e.y = ny;
      if (e.cooldown <= 0) {
        e.cooldown = .16; g.puddles.push({ x: e.x, y: e.y + 12, r: 16, life: 2.4, max: 2.4, kind: "fire" });
        if (g.puddles.length > 90) g.puddles.shift();
      }
      if (e.spawnT > 6 && Math.random() < ed * .3) {
        A.x = clamp(p.x + rnd(-150, 150), b.minX + 120, b.maxX - 120);
        A.y = clamp(p.y + rnd(-90, 90), b.minY + 90, b.maxY - 90);
      }
    } else if (e.kind === "puppet") {
      mult = 0; const A = e.anchor!; const len = e.attack > 0 ? 9999 : 120 + Math.sin(e.phase) * 10;
      if (e.attack > 0) {
        e.y += 760 * ed;
        if (e.y >= b.maxY - 10 || e.attack < .02) {
          e.attack = 0; g.shake = Math.max(g.shake, 7); ring(g, e.x, e.y + 8, "#c97a5a", 70);
          puff(g, e.x, e.y + 8, "#c97a5a", 10, 140, 6);
          if (dist(e, p) < 60) hurtPlayer(g, 14, e); e.cooldown = 1.2; e.counter = 1; g.events.push("thud");
        }
      } else if (e.counter === 1) {
        e.y -= 220 * ed; if (e.y <= A.y + 130) { e.counter = 0; e.cooldown = rnd(1.5, 3); }
      } else {
        e.phase += ed * 1.4; const sw = Math.sin(e.phase) * 1.1; e.x = A.x + Math.sin(sw) * len; e.y = A.y + Math.cos(sw) * len;
        if (e.cooldown <= 0 && Math.abs(p.x - e.x) < 34 && p.y > e.y) { e.attack = .9; g.events.push("boing"); }
      }
    } else if (e.kind === "twin") {
      side = Math.sin(g.elapsed * 3 + e.phase) * .6; mult = .8;
      const mate = e.partner !== undefined ? g.enemies.find((o) => o.id === e.partner) : undefined;
      if (mate) {
        const md = dist(mate, e) || 1;
        if (md > 220) { e.x += (mate.x - e.x) / md * 60 * ed; e.y += (mate.y - e.y) / md * 60 * ed; }
        if (md < 70) { e.x -= (mate.x - e.x) / md * 40 * ed; }
        if (e.id < mate.id) {
          const ax = mate.x - e.x, ay = mate.y - e.y, L2 = ax * ax + ay * ay || 1;
          const t = clamp(((p.x - e.x) * ax + (p.y - e.y) * ay) / L2, 0, 1);
          const cx = e.x + ax * t, cy = e.y + ay * t;
          if (Math.hypot(p.x - cx, p.y - cy) < p.r - 2 && p.dashTime <= 0) hurtPlayer(g, 9, { x: cx, y: cy });
        }
      }
    } else if (e.kind === "phono") {
      mult = 0;
      if (e.cooldown <= 0) {
        e.counter++; const pink = e.counter % 3 === 0;
        g.bullets.push({
          x: e.x, y: e.y - 10, vx: 0, vy: 0, life: 2.2, maxLife: 2.2, damage: 10, r: 20,
          color: pink ? "#ff7ad9" : "#c9863a", enemy: true, pink, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0, ringWave: true, grow: 150
        });
        e.cooldown = 1.4; e.attack = .3; g.events.push("bell");
      }
    } else if (e.kind === "mirror") {
      mult = dd > 140 ? .9 : .2; side = Math.sin(g.elapsed * 2 + e.phase) * .4;
    } else if (e.kind === "clown") {
      e.x += e.vx * ed * sm; e.y += e.vy * ed * sm;
      if (e.x < b.minX || e.x > b.maxX) { e.vx *= -1; e.x = clamp(e.x, b.minX, b.maxX); }
      if (e.y < b.minY || e.y > b.maxY) { e.vy *= -1; e.y = clamp(e.y, b.minY, b.maxY); }
      if (e.cooldown <= 0) {
        e.cooldown = 1.9;
        const targetA = Math.atan2(p.y - e.y, p.x - e.x);
        for (let i = -1; i <= 1; i++) {
          const ta = targetA + i * 0.28;
          enemyShot(g, e.x, e.y - 12, ta, 260, 11, "#ff5964", i === 0);
        }
        g.events.push("boing");
      }
    } else if (e.kind === "bat") {
      const swoop = Math.sin(g.elapsed * 3 + e.phase) * 60;
      e.y += swoop * ed;
      e.x += (dx / dd) * e.speed * ed * sm;
      mult = 0;
      if (dd < 140 && e.cooldown <= 0) {
        e.cooldown = 2.5; e.attack = 0.4;
        puff(g, e.x, e.y, "#473b66", 4, 60, 3);
      }
    } else if (e.kind === "skeleton") {
      mult = dd < 180 ? -0.3 : 0.8;
      side = Math.sin(g.elapsed * 3 + e.phase) * 0.5;
      if (e.cooldown <= 0 && dd < 450) {
        e.cooldown = 2.4;
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        g.bullets.push({
          x: e.x, y: e.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, life: 2.5, maxLife: 2.5, damage: 13,
          r: 9, color: "#e5dec9", enemy: true, boomerang: true, pierce: 99, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU)
        });
        g.events.push("thud");
      }
    } else if (e.kind === "totem") {
      mult = 0;
      if (e.cooldown <= 0) {
        e.cooldown = 3.2; e.attack = 0.8;
        g.puddles.push({ x: e.x + rnd(-40, 40), y: e.y + 10, r: 45, life: 3.5, max: 3.5, kind: "geyser" });
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU;
          enemyShot(g, e.x, e.y, a, 140, 9, "#8c654f", i % 2 === 0);
        }
        g.events.push("steam");
      }
    } else if (e.kind === "siren") {
      // Siren Sister — drags the player in with her song; dashing breaks the pull.
      mult = .25; side = Math.sin(g.elapsed * 2.4 + e.phase) * .5;
      if (dd < 300 && p.dashTime <= 0 && p.superTime <= 0) {
        const pullK = (1 - dd / 300) * 190 * ed;
        p.x = clamp(p.x - (dx / dd) * pullK, b.minX, b.maxX);
        p.y = clamp(p.y - (dy / dd) * pullK, b.minY, b.maxY);
        if (Math.random() < ed * 6) puff(g, p.x + rnd(-24, 24), p.y + rnd(-24, 24), "#7ad9c4", 1, 20, 4);
      }
      if (e.cooldown <= 0) {
        if (dd < 150) {
          e.attack = .5; e.cooldown = 2.4; g.events.push("bell");
          for (let i = 0; i < 12; i++) enemyShot(g, e.x, e.y, i / 12 * TAU + e.phase, 250, 11, "#7ad9c4", i % 6 === 0);
          ring(g, e.x, e.y, "#7ad9c4", 150);
        } else {
          e.cooldown = .8;
          ring(g, e.x, e.y, "#7ad9c4", 60 + (e.counter++ % 4) * 30);
        }
      }
    } else if (e.kind === "chef") {
      // Fry Cook Fritz — lobs arcing pans and leaves burning grease.
      mult = dd < 230 ? -.5 : dd > 340 ? .9 : 0;
      side = Math.sin(g.elapsed * 2 + e.phase) * .3;
      if (e.cooldown <= 0) {
        e.cooldown = 1.8; e.counter++;
        const n = e.counter % 3 === 0 ? 3 : 1;
        for (let i = 0; i < n; i++) {
          const d = clamp(dd + rnd(-50, 50), 120, 460);
          const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * .3;
          const dur = .45 + d / 620;
          g.bullets.push({
            x: e.x, y: e.y - 10, vx: 0, vy: 0, life: dur, maxLife: dur, damage: 12, r: 11,
            color: "#d8cfc0", enemy: true, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU),
            lob: { sx: e.x, sy: e.y - 10, tx: e.x + Math.cos(a) * d, ty: e.y + Math.sin(a) * d, t: 0, dur },
          });
        }
        g.events.push("thud");
      }
      if (e.spawnT > 3 && Math.random() < ed * .35) {
        g.puddles.push({ x: e.x + rnd(-30, 30), y: e.y + rnd(-16, 16), r: 26, life: 4, max: 4, kind: "grease" });
      }
    } else if (e.kind === "balloon") {
      // Blimp Balloon — huge, slow, bobs on the breeze, pops into a swarm.
      mult = .35;
      e.y += Math.sin(g.elapsed * 1.6 + e.phase) * 26 * ed;
      e.x += e.vx * ed * sm; e.y += e.vy * ed * sm;
      if (e.x < b.minX || e.x > b.maxX) { e.vx *= -1; e.x = clamp(e.x, b.minX, b.maxX); }
      if (e.y < b.minY || e.y > b.maxY) { e.vy *= -1; e.y = clamp(e.y, b.minY, b.maxY); }
      if (e.cooldown <= 0) {
        e.cooldown = 3.4; e.attack = .4;
        const c = spawnEnemy(g, w, h, "bloat", { x: e.x + rnd(-30, 30), y: e.y + e.r }, .7);
        if (c) c.hp = c.maxHp = c.maxHp * .7;
        g.events.push("spore");
      }
    } else if (e.kind === "organ") {
      // Pipe Organist — marks three lanes, waits, then hammers them with notes.
      mult = 0;
      if (!e.lanes && e.cooldown <= 0) {
        e.lanes = [];
        const base = clamp(p.x + rnd(-120, 120), b.minX + 60, b.maxX - 60);
        for (let i = 0; i < 3; i++) e.lanes.push({ x: clamp(base + (i - 1) * rnd(90, 140), b.minX, b.maxX), t: 1.05 });
        e.attack = 1.05; g.events.push("charge");
      }
      if (e.lanes) {
        for (const L of e.lanes) {
          L.t -= ed;
          if (L.t <= 0) {
            for (let i = 0; i < 7; i++) {
              g.bullets.push({
                x: L.x, y: fieldTop(g, h) - 20 - i * 26, vx: 0, vy: 380, life: 2.2, maxLife: 2.2, damage: 13,
                r: 9, color: i % 2 ? "#a89ad8" : "#6a5a8a", enemy: true, pierce: 0, bounces: 0, chains: 0,
                hitIds: [], spin: rnd(TAU),
              });
            }
            g.shake = Math.max(g.shake, 4); puff(g, L.x, b.minY + 10, "#6a5a8a", 6, 120, 6);
          }
        }
        if (e.lanes.every((L) => L.t <= 0)) { e.lanes = undefined; e.cooldown = 2.8; g.events.push("laser"); }
      }
    } else if (e.kind === "disco") {
      // Glitter Globe — waltzes in; while glinting, its mirror shell bats shots away
      mult = .8; side = Math.sin(g.elapsed * 1.7 + e.phase) * .5;
      if ((e.reflect || 0) <= 0 && e.cooldown <= 0) { e.reflect = 1.6; e.cooldown = 3.4; g.events.push("charge"); }
    } else if (e.kind === "skunk") {
      // Ink Skunk — keeps its distance and squirts slowing ink where you stand
      mult = dd < 190 ? -.7 : dd > 300 ? .8 : 0;
      side = Math.sin(g.elapsed * 2.4 + e.phase) * .4;
      if (e.cooldown <= 0) {
        e.cooldown = 2.2;
        for (let i = 0; i < 3; i++) {
          const tx = clamp(p.x + rnd(-70, 70), b.minX, b.maxX), ty = clamp(p.y + rnd(-40, 40), b.minY, b.maxY), dur = .5 + i * .12;
          g.bullets.push({ x: e.x, y: e.y - 8, vx: 0, vy: 0, life: dur, maxLife: dur, damage: 8, r: 10, color: "#5a4a6e", enemy: true, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: rnd(TAU), lob: { sx: e.x, sy: e.y - 8, tx, ty, t: 0, dur }, ink: true });
        }
        g.events.push("thud");
      }
    } else if (e.kind === "strong") {
      // Mighty Marcel — plods in, winds up, slams a shockwave through the boards
      mult = dd > 150 ? .9 : 0;
      if (e.cooldown <= 0 && !e.wound) { e.wound = true; e.attack = .7; e.cooldown = 3.2; g.events.push("charge"); }
      if (e.wound && e.attack <= 0) {
        e.wound = false;
        g.shake = Math.max(g.shake, 10); ring(g, e.x, e.y + 10, "#d84a45", 170); g.events.push("boom");
        puff(g, e.x, e.y + 14, "#d84a45", 14, 200, 6);
        if (p.dashTime <= 0 && dist(e, p) < 170) hurtPlayer(g, 18, e);
      }
    } else if (e.kind === "usher") {
      // Phantom Usher — ghosted most of the cycle; only lit flesh can be hit
      e.counter += ed;
      e.phased = e.counter % 3 > 1.6;
      mult = e.phased ? 0 : 1.25;
    } else if (e.kind === "magnet") {
      // Lodestone Diver — holds mid-range and bends your shots into curves
      mult = dd > 260 ? .9 : dd < 140 ? -.6 : 0;
    } else if (e.kind === "turret") {
      mult = 0;
      if (!e.laser && e.cooldown <= 0) { e.laser = { a: Math.atan2(dy, dx), t: 1.1 }; g.events.push("charge"); }
      if (e.laser) {
        e.laser.t -= ed;
        if (e.laser.t > 0.25) e.laser.a += ((Math.atan2(dy, dx) - e.laser.a + Math.PI * 3) % TAU - Math.PI) * ed * 2.0;
        if (e.laser.t <= 0) {
          const a = e.laser.a;
          for (let i = 1; i < 18; i++) {
            const bx = e.x + Math.cos(a) * i * 44, by = e.y + Math.sin(a) * i * 44;
            puff(g, bx, by, "#ffd166", 1, 50, 4);
            if (Math.hypot(bx - p.x, by - p.y) < 26) hurtPlayer(g, 16, { x: bx, y: by });
          }
          g.shake = Math.max(g.shake, 7); g.events.push("laser");
          e.laser = undefined; e.cooldown = 2.8;
        }
      }
    } else if (e.kind === "cutpurse") {
      // THE CARD SHARP — theft, not damage. He wants your meter, then the nearest exit.
      if (!e.holding && e.cooldown <= 0 && dd < 64) {
        const cards = Math.min(2, Math.floor(p.cards)), cash = Math.min(5, p.coins);
        if (cards + cash > 0) {
          p.cards -= cards; p.coins -= cash; e.loot = cards * 10 + cash; e.holding = true;
          e.cooldown = 999; e.attack = .8; g.flash = Math.max(g.flash, .3);
          say(g, e.x, e.y - e.r - 12, "SORRY, PAL!", "#ff5aa5", true); g.events.push("coin");
        } else e.cooldown = .6;
      }
      mult = e.holding ? -2 : 1.75;                        // loaded, he runs; empty, he closes
      side = e.holding ? 0 : Math.sin(g.elapsed * 5 + e.phase) * .55;
    } else if (e.kind === "bellhop") {
      // THE BELLHOP — he never fights you, he makes someone else unkillable until you find him.
      let mate: Enemy | null = null, bb = -1;
      for (const o of g.enemies) { if (o === e || o.hp <= 0 || o.kind === "boss" || o.kind === "bellhop") continue; const od = dist(o, e); if (od < 300 && o.maxHp > bb) { bb = o.maxHp; mate = o; } }
      e.partner = mate ? mate.id : 0;
      if (mate) {
        mate.shieldHp = Math.min(46, (mate.shieldHp || 0) + 22 * ed);
        const md = dist(mate, e);
        mult = md > 200 ? 1.45 : md < 84 ? -.7 : .1;
        e.anchor = { x: mate.x, y: mate.y };
      } else { mult = 1; e.anchor = undefined; }   // no charge to draw a tether to
    } else if (e.kind === "drover") {
      // THE DROVER — enemy-vs-enemy physics: he shoves the crowd at you and speeds it up.
      let mate: Enemy | null = null, md = 1e9;
      for (const o of g.enemies) { if (o === e || o.hp <= 0 || o.kind === "boss" || o.kind === "drover") continue; const od = dist(o, e); if (od < 190 && od < md) { md = od; mate = o; } }
      if (mate) {
        const kl = Math.hypot(p.x - e.x, p.y - e.y) || 1;
        mate.x += ((p.x - e.x) / kl) * 132 * ed; mate.y += ((p.y - e.y) / kl) * 132 * ed;
        mult = md > 118 ? 1.35 : .18;
        if (e.cooldown <= 0) {
          e.cooldown = 2.7; e.attack = .7; ring(g, e.x, e.y, "#ffd166", 150); g.events.push("whistle");
          for (const o of g.enemies) if (o.kind !== "boss" && dist(o, e) < 215) o.buffed = Math.max(o.buffed, 1.15);
        }
      } else { mult = 1; e.anchor = undefined; }   // nothing left to herd
    } else if (e.kind === "lancer") {
      // THE MARQUEE DEADEYE — a rail of light, then a shot that never stops until the walls do.
      mult = dd < 250 ? -1 : dd > 430 ? 1 : 0;
      if (!e.laser && e.cooldown <= 0) { e.laser = { a: Math.atan2(dy, dx), t: 1 }; e.attack = 1; g.events.push("charge"); }
      if (e.laser) {
        e.laser.t -= ed;
        if (e.laser.t > .3) e.laser.a += ((Math.atan2(dy, dx) - e.laser.a + Math.PI * 3) % TAU - Math.PI) * ed * 2.4;
        if (e.laser.t <= 0) {
          const a = e.laser.a; e.laser = undefined; e.cooldown = 3.5;
          g.bullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, life: 2.6, maxLife: 2.6,
            damage: 15, r: 9, color: "#ffd166", enemy: true, pierce: 99, bounces: 3, chains: 0, hitIds: [], spin: 0, pink: g.mode === "bulletdance" });
          g.shake = Math.max(g.shake, 4); g.events.push("laser");
        }
      }
    } else if (e.kind === "janitor") {
      // THE STAGEHAND — he comes for your loot, not for you. Nothing he sweeps is yours again.
      mult = .2;
      let tx = 0, ty = 0, tl = 1e9, found = false;
      for (const k of g.pickups) {
        if (k.life <= 0 || k.kind === "bulb") continue;
        const kd = dist(k, e); if (kd < 320 && kd < tl) { tl = kd; tx = k.x; ty = k.y; found = true; }
      }
      if (found) {
        const dl = Math.hypot(tx - e.x, ty - e.y) || 1;
        e.x += ((tx - e.x) / dl) * e.speed * 1.7 * ed; e.y += ((ty - e.y) / dl) * e.speed * 1.7 * ed;
        e.anchor = { x: tx, y: ty };
        if (tl < 30) {
          for (const k of g.pickups) if (k.life > 0 && dist(k, e) < 40) {
            k.life = 0; e.counter++; puff(g, k.x, k.y, "#cfd6e2", 9, 110, 5); say(g, k.x, k.y - 12, "SWEEPED!", "#cfd6e2"); g.events.push("thud");
          }
        }
      }
      if (e.cooldown <= 0) { e.cooldown = 3.2; for (const pu of g.puddles) if (dist(pu, e) < 160) pu.life = Math.min(pu.life, .2); }
    } else if (e.kind === "hooker") {
      // THE PRESS AGENT — the only creep that moves *you*. Get off the line or take the ride.
      mult = dd < 175 ? -.75 : dd > 330 ? 1.2 : .3;
      if (!e.laser && e.cooldown <= 0 && dd < 370) { e.laser = { a: Math.atan2(dy, dx), t: .62 }; e.attack = 1; g.events.push("charge"); }
      if (e.laser) {
        e.laser.t -= ed;
        if (e.laser.t > .18) e.laser.a += ((Math.atan2(dy, dx) - e.laser.a + Math.PI * 3) % TAU - Math.PI) * ed * 3.2;
        if (e.laser.t <= 0) {
          const a = e.laser.a; e.laser = undefined; e.cooldown = 3;
          const rx = p.x - e.x, ry = p.y - e.y;
          const along = rx * Math.cos(a) + ry * Math.sin(a), off = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a));
          if (along > 0 && along < 360 && off < 30 && p.invuln <= 0 && p.star <= 0) {
            p.grapple = { tx: e.x, ty: e.y, t: .32 }; p.webbed = .5; hurtPlayer(g, 8, e);
            say(g, e.x, e.y - e.r - 12, "GOTCHA!", "#ff6659", true); g.events.push("growl");
          } else { puff(g, p.x - Math.cos(a) * 6, p.y - Math.sin(a) * 6, "#cfd6e2", 6, 120, 4); g.events.push("whiff"); }
        }
      }
    } else if (e.kind === "boss") {
      // Phases borrow the new creeps: disco mirror shell (2), then usher phasing + magnet crown (3)
      if ((e.bossPhase || 1) >= 2) e.reflect = e.counter % 9 < 2.5 ? 1 : 0;
      if ((e.bossPhase || 1) >= 3) { e.phased = e.counter % 7 > 5.2; e.magnetField = true; }
      mult = e.attack > 0 ? 0 : (0.7 + (e.bossPhase || 1) * 0.2);
      e.y = Math.max(e.y, b.minY + 20);
      // fire any queued volley shots on engine time (pause-safe)
      if (e.volley && e.volley.length) {
        for (let i = e.volley.length - 1; i >= 0; i--) {
          const v = e.volley[i]; v.t -= ed;
          if (v.t <= 0) {
            enemyShot(g, e.x, e.y, Math.atan2(dy, dx) + rnd(-.05, .05), v.speed, v.dmg, v.color, v.pink);
            e.volley.splice(i, 1);
          }
        }
        if (!e.volley.length) e.volley = undefined;
      }
      if (e.cooldown <= 0) {
        e.pattern = (e.pattern + 1) % 5;
        e.attack = 1.1;
        e.cooldown = Math.max(1.3, (3 - g.bossesBeaten * .25) - (e.bossPhase || 1) * 0.3);
        const base = Math.atan2(dy, dx);

        if (e.pattern === 0) {
          const count = (e.bossPhase === 3) ? 24 : 16;
          for (let i = 0; i < count; i++) enemyShot(g, e.x, e.y, i / count * TAU + e.counter * .2, 185, 12, def.color, i % 4 === 0);
        } else if (e.pattern === 1) {
          e.counter += 6;
          // Engine-time volley queue. This used to be a setTimeout, which kept firing
          // (and spawning bullets) while the game was paused or after the run had ended.
          e.volley = e.volley || [];
          for (let i = 0; i < 6; i++) e.volley.push({ t: i * .11, n: i, color: "#ffb347", dmg: 12, speed: 340, pink: i === 3 });
        } else if (e.pattern === 2) {
          for (let i = 0; i < 3; i++) spawnEnemy(g, w, h, i === 1 ? "bloat" : "daisy", { x: e.x + rnd(-80, 80), y: e.y + rnd(20, 60) });
          e.vx = dx / dd; e.vy = dy / dd; g.events.push("growl");
        } else if (e.pattern === 3) {
          for (let row = -1; row <= 1; row++) {
            for (let i = 0; i < 5; i++) {
              enemyShot(g, e.x + Math.cos(base + Math.PI / 2) * row * 55, e.y + Math.sin(base + Math.PI / 2) * row * 55, base, 160 + i * 45, 11, ["#ffd166", "#ff6b6b", "#8fd15a"][row + 1], i === 2 && row === 0);
            }
          }
        } else {
          const sig = g.bossesBeaten % 4;
          if (sig === 0) for (let i = 0; i < 3; i++) g.puddles.push({ x: clamp(p.x + rnd(-120, 120), b.minX, b.maxX), y: clamp(p.y + rnd(-80, 80), b.minY, b.maxY), r: 50, life: 6, max: 6, kind: "tar" });
          else if (sig === 1) for (let i = 0; i < 2; i++) spawnEnemy(g, w, h, "ghoul", { x: e.x + rnd(-100, 100), y: e.y + 40 });
          else if (sig === 2) for (let i = 0; i < 10; i++) g.puddles.push({ x: clamp(p.x + Math.cos(i / 10 * TAU) * 130, b.minX, b.maxX), y: clamp(p.y + Math.sin(i / 10 * TAU) * 90, b.minY, b.maxY), r: 22, life: 4, max: 4, kind: "fire" });
          else { e.laser = { a: base - .9, t: 1.8 }; g.events.push("charge"); }
          e.attack = .6;
        }
        g.events.push("bossattack"); e.counter++;
      }
      if (e.laser) {
        e.laser.t -= ed; e.laser.a += ed * 1.05;
        const a = e.laser.a;
        for (let i = 2; i < 18; i++) {
          const bx = e.x + Math.cos(a) * i * 44, by = e.y + Math.sin(a) * i * 44;
          if (Math.random() < .2) puff(g, bx, by, "#ffd166", 1, 40, 4);
          if (Math.hypot(bx - p.x, by - p.y) < 28) hurtPlayer(g, 14, { x: bx, y: by });
        }
        if (e.laser.t <= 0) e.laser = undefined;
      }
      if (e.pattern === 2 && e.attack > 0 && e.attack < .7) { e.x += e.vx * 380 * ed; e.y += e.vy * 380 * ed; }
    }

    if (mult !== 0) {
      e.x += (dx / dd - dy / dd * side) * e.speed * mult * ed * sm;
      e.y += (dy / dd + dx / dd * side) * e.speed * mult * ed * sm;
    }
    if (e.kind !== "gloop" && e.kind !== "boss" && e.kind !== "eel" && e.kind !== "clown" && e.spawnT > 2) {
      e.x = clamp(e.x, b.minX - 10, b.maxX + 10); e.y = clamp(e.y, b.minY - 10, b.maxY + 10);
    }
    const pdd = tgt === p ? dd : dist(e, p);
    if (!e.hidden && !e.phased && e.airborne <= 0 && pdd < e.r + p.r) {
      if (p.star > 0) {
        damageEnemy(g, e, 80, "#fff3c4");
        const k = 30 / pdd;
        e.x -= (p.x - e.x) * k; e.y -= (p.y - e.y) * k;
      } else {
        hurtPlayer(g, def.contact, e);
        if (g.upgrades.thorns && p.invuln > .8) damageEnemy(g, e, 40 * g.upgrades.thorns, "#8fd15a");
      }
    }
  }

  // Bullets update
  for (const bl of g.bullets) {
    const bd = bl.enemy ? worldD : d;
    if (bl.tick !== undefined && bl.hitIds.length) {
      bl.spin += bd;
      if (bl.spin > bl.tick) { bl.hitIds.length = 0; bl.spin = 0; }
    }
    if (bl.grow) bl.r += bl.grow * bd;
    if (bl.arc || bl.slash) { bl.life -= bd; continue; }
    if (bl.fuse !== undefined) {
      bl.fuse -= bd;
      if (bl.fuse <= 0) {
        bl.life = 0; g.shake = Math.max(g.shake, 5);
        ring(g, bl.x, bl.y, bl.color, bl.splash || 90);
        puff(g, bl.x, bl.y, bl.color, 12, 200, 6);
        g.events.push("boom");
        for (const o of nearby(bl.x, bl.y, (bl.splash || 90) + 40, nearBuf2)) {
          if (!o.hidden && dist(o, bl) < (bl.splash || 90) + o.r) damageEnemy(g, o, bl.damage, bl.color);
        }
      } else bl.life = 1;
      continue;
    }
    if (bl.ringWave) {
      bl.life -= bd;
      const dp = dist(bl, p);
      if (Math.abs(dp - bl.r) < 10 + p.r && !bl.hitIds.length) {
        if (p.star > 0) bl.hitIds.push(-1);
        else if (p.invuln <= 0 && p.superTime <= 0) { hurtPlayer(g, bl.damage, bl); bl.hitIds.push(-1); }
      }
      continue;
    }
    if (bl.popAt !== undefined) {
      bl.popAt -= bd;
      if (bl.popAt <= 0) {
        bl.life = 0; puff(g, bl.x, bl.y, "#fff0b8", 8, 120, 4); g.events.push("pop");
        const base = rnd(TAU);
        for (let i = 0; i < 4; i++) {
          const a = base + i / 4 * TAU;
          g.bullets.push({
            x: bl.x, y: bl.y, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, life: .5, maxLife: .5,
            damage: bl.damage * 1.2, r: 5, color: "#ffe9a8", weapon: "popper", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0
          });
        }
        continue;
      }
    }
    if (bl.anvilDrop) {
      bl.anvilDrop.groundT -= bd;
      if (bl.anvilDrop.groundT > 0) {
        bl.y += 1200 * bd;
      } else {
        bl.life = 0;
        g.shake = Math.max(g.shake, 14);
        ring(g, bl.x, bl.anvilDrop.targetY, "#444b58", bl.splash || 120);
        puff(g, bl.x, bl.anvilDrop.targetY, "#444b58", 20, 220, 8);
        g.events.push("thud");
        for (const o of nearby(bl.x, bl.anvilDrop.targetY, (bl.splash || 120) + 40, nearBuf2)) {
          if (!o.hidden && dist(o, { x: bl.x, y: bl.anvilDrop.targetY }) < (bl.splash || 120) + o.r) {
            damageEnemy(g, o, bl.damage, "#444b58", true);
            o.slow = 2.0;
          }
        }
      }
      continue;
    }
    if (bl.trap) {
      // Slapstick Peels: skid a beat, stick to the boards, then wait for a victim.
      const T = bl.trap;
      // Skid out to a trap lane ~150px ahead, then plant. Too much drag and they
      // stop at your own feet, which makes the weapon useless at any range.
      if (T.armed > 0) { T.armed -= bd; bl.x += bl.vx * bd; bl.y += bl.vy * bd; bl.vx *= .975; bl.vy *= .975; }
      else { bl.vx = 0; bl.vy = 0; }
      bl.spin += bd * 2;
      for (const o of nearby(bl.x, bl.y, 80, nearBuf2)) {
        if (o.hidden || o.airborne > 0 || o.dead || dist(o, bl) > bl.r + o.r) continue;
        damageEnemy(g, o, bl.damage, bl.color);
        o.stun = Math.max(o.stun || 0, 1.5);
        o.slow = Math.max(o.slow, 1.5);
        if (o.kind !== "boss") { o.vx = rnd(-150, 150); o.vy = rnd(-150, 150); }
        bl.life = 0; g.events.push("pop");
        puff(g, bl.x, bl.y, "#f5d142", 10, 150, 5);
        say(g, bl.x, bl.y - 20, pick(["SLIP!", "WHOOPS!", "TIMBER!"]), "#f5d142");
        break;
      }
      bl.life -= bd;
      continue;
    }
    if (bl.hook) {
      // Hook & Line: reel a creep in, or yank yourself across the stage
      bl.x += bl.vx * bd; bl.y += bl.vy * bd;
      const traveled = dist(bl, bl.from || p);
      let hooked = false;
      for (const o of nearby(bl.x, bl.y, 60, nearBuf2)) {
        if (o.hidden || o.phased || o.hp <= 0 || dist(o, bl) > bl.r + o.r) continue;
        damageEnemy(g, o, bl.damage, bl.color);
        if (o.kind !== "boss") { const hd = dist(o, p) || 1; o.x += (p.x - o.x) / hd * 110; o.y += (p.y - o.y) / hd * 110; o.stun = Math.max(o.stun || 0, .4); }
        say(g, o.x, o.y - o.r - 8, "REELED IN!", "#e8c9a0");
        hooked = true; break;
      }
      if (hooked || traveled > 320) { bl.life = 0; if (!hooked) { p.grapple = { tx: clamp(bl.x, 30, w - 30), ty: clamp(bl.y, b.minY, b.maxY + 4), t: .34 }; g.events.push("dash"); } continue; }
      if (bl.life <= 0) { p.grapple = { tx: clamp(bl.x, 30, w - 30), ty: clamp(bl.y, b.minY, b.maxY + 4), t: .34 }; g.events.push("dash"); continue; }
      continue;
    }
    if (bl.bubbleFloat) {
      bl.vy -= 80 * bd;
      bl.x += Math.sin(g.elapsed * 4 + bl.spin) * 20 * bd;
    }
    if (!bl.enemy && !bl.hook) {
      for (const m of g.enemies) {
        if ((m.kind !== "magnet" && !m.magnetField) || m.hp <= 0 || m.phased) continue;
        const md = dist(bl, m);
        if (md < 130 && md > 1) { const pull = (1 - md / 130) * 900 * bd; bl.vx += (m.x - bl.x) / md * pull; bl.vy += (m.y - bl.y) / md * pull; }
      }
    }
    if (bl.gravity) {
      const pr = bl.gravity > 1000 ? 9999 : 150;
      for (const o of nearby(bl.x, bl.y, pr > 1000 ? 2000 : pr + 40, nearBuf2)) {
        if (o.kind !== "boss" && !o.hidden && dist(o, bl) < pr) o.pull = bl;
      }
      if (Math.random() < bd * 20) puff(g, bl.x + rnd(-40, 40), bl.y + rnd(-30, 30), bl.color, 1, 20, 3);
    }
    if (bl.ghostWave) bl.damage *= 1 + bd * .35;

    if (bl.orbit) {
      bl.orbit.angle += bd * 4.2;
      bl.x = p.x + Math.cos(bl.orbit.angle) * bl.orbit.dist;
      bl.y = p.y - 6 + Math.sin(bl.orbit.angle) * bl.orbit.dist;
    } else if (bl.brolly) {
      // Brolly Guard: parasols circle the player and chew up incoming fire.
      const B = bl.brolly; B.angle += bd * B.spin;
      bl.x = p.x + Math.cos(B.angle) * B.dist;
      bl.y = p.y - 6 + Math.sin(B.angle) * B.dist;
      bl.spin += bd * 6;
      for (const eb of g.bullets) {
        if (eb !== bl && eb.enemy && eb.life > 0 && dist(eb, bl) < bl.r + eb.r) {
          eb.life = 0; puff(g, eb.x, eb.y, "#8fd1ff", 5, 110, 4); ring(g, eb.x, eb.y, "#8fd1ff", 26);
          g.events.push("block");
        }
      }
    } else if (bl.tether) {
      const T = bl.tether;
      if (T.out) { T.dist += 880 * bd; if (T.dist >= T.max) T.out = false; }
      else { T.dist -= 760 * bd; if (T.dist <= 20) bl.life = 0; }
      const a = Math.atan2(bl.vy, bl.vx);
      bl.x = p.x + Math.cos(a) * T.dist; bl.y = p.y - 4 + Math.sin(a) * T.dist;
      bl.spin += bd * 25;
    } else if (bl.sentry) {
      if ((bl.charge = (bl.charge || 0) + bd) > (bl.tick || .22)) {
        bl.charge = 0;
        let t: Enemy | null = null, td = Infinity;
        for (const e of liveBuf) {
          const dd = dist(e, bl); if (dd < td) { td = dd; t = e; }
        }
        if (t) {
          const a = Math.atan2(t.y - bl.y, t.x - bl.x);
          g.bullets.push({
            x: bl.x, y: bl.y, vx: Math.cos(a) * 780, vy: Math.sin(a) * 780, life: 1, maxLife: 1,
            damage: bl.damage, r: 5, color: bl.color, weapon: "shard", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0
          });
        }
      }
    } else if (bl.lob) {
      const L = bl.lob; L.t += bd; const k = clamp(L.t / L.dur, 0, 1);
      bl.x = L.sx + (L.tx - L.sx) * k; bl.y = L.sy + (L.ty - L.sy) * k;
      bl.charge = Math.sin(k * Math.PI) * 120;
      if (k >= 1) {
        if (bl.ink) { g.puddles.push({ x: bl.x, y: bl.y, r: 34, life: 5, max: 5, kind: "ink" }); puff(g, bl.x, bl.y, "#5a4a6e", 5, 80, 4); bl.life = 0; continue; }
        bl.life = 0; g.shake = Math.max(g.shake, 7);
        const R = bl.splash || 90;
        ring(g, bl.x, bl.y, bl.color, R);
        puff(g, bl.x, bl.y, bl.color, 12, 200, 7);
        puff(g, bl.x, bl.y, "#2a2230", 6, 120, 6);
        g.events.push("splat");
        if (bl.enemy) {
          // enemy lob (Fry Cook Fritz's pans): splashes the player, not the creeps
          if (dist(bl, p) < R + p.r && p.star <= 0 && p.invuln <= 0 && p.superTime <= 0) hurtPlayer(g, bl.damage, bl);
          g.puddles.push({ x: bl.x, y: bl.y, r: R * .7, life: 3.4, max: 3.4, kind: "fire" });
        } else {
          for (const o of nearby(bl.x, bl.y, R + 40)) {
            if (!o.hidden && o.airborne <= 0 && dist(o, bl) < R + o.r) {
              damageEnemy(g, o, bl.damage, bl.color);
              o.slow = Math.max(o.slow, bl.syrup ? 3 : 1.5);
              if (bl.syrup) o.burn = Math.max(o.burn, 2.5);
            }
          }
          g.puddles.push({ x: bl.x, y: bl.y, r: R * .8, life: bl.syrup ? 6.5 : 5, max: bl.syrup ? 6.5 : 5, kind: bl.syrup ? "syrup" : "tar" });
        }
      }
      continue;
    } else if (bl.pet) {
      const P = bl.pet;
      let t: Enemy | undefined = g.enemies.find((e) => e.id === P.target && e.hp > 0 && !e.hidden);
      if (!t) {
        let bestV = -Infinity;
        for (const e of liveBuf) {
          const v = e.hp + (e.kind === "boss" ? 9999 : 0);
          if (v > bestV) { bestV = v; t = e; }
        }
        P.target = t ? t.id : -1;
      }
      P.hop = Math.max(0, P.hop - bd);
      if (t) {
        const dd = dist(t, bl) || 1;
        if (dd > t.r + 6) {
          const sp = 560;
          bl.vx = bl.vx * .85 + (t.x - bl.x) / dd * sp * .15;
          bl.vy = bl.vy * .85 + (t.y - bl.y - 10) / dd * sp * .15;
        } else {
          if (P.hop <= 0) {
            P.hop = .2; const a = rnd(TAU);
            bl.vx = Math.cos(a) * 180; bl.vy = Math.sin(a) * 180 - 120;
            puff(g, bl.x, bl.y, "#ffffff", 2, 60, 3);
          }
          bl.vx *= .9; bl.vy *= .9;
        }
      } else {
        bl.vx = bl.vx * .9 + Math.cos(g.elapsed * 3 + bl.spin) * 40;
        bl.vy = bl.vy * .9 + Math.sin(g.elapsed * 2 + bl.spin) * 30;
      }
      bl.x += bl.vx * bd; bl.y += bl.vy * bd;
      bl.x = clamp(bl.x, 10, w - 10); bl.y = clamp(bl.y, fieldTop(g, h) - 30, b.maxY + 24);
    } else if (bl.wave) {
      const W = bl.wave; W.t += bd;
      const sp = Math.hypot(bl.vx, bl.vy), along = sp * W.t, off = Math.sin(W.t * W.freq) * W.amp;
      const dirx = bl.vx / sp, diry = bl.vy / sp;
      bl.x = W.bx + dirx * along + W.nx * off; bl.y = W.by + diry * along + W.ny * off;
      bl.spin += bd * 10;
    } else {
      if (bl.homing && !bl.enemy) {
        let t: Enemy | null = null, td = Infinity;
        for (const e of liveBuf) {
          if (bl.hitIds.includes(e.id)) continue;
          const dd = dist(e, bl); if (dd < td) { td = dd; t = e; }
        }
        if (t) {
          const sp = Math.hypot(bl.vx, bl.vy), dd = td || 1;
          bl.vx = bl.vx * (1 - bl.homing) + (t.x - bl.x) / dd * sp * bl.homing;
          bl.vy = bl.vy * (1 - bl.homing) + (t.y - bl.y) / dd * sp * bl.homing;
        }
      }
      if (bl.homing && bl.enemy) {
        const sp = Math.hypot(bl.vx, bl.vy), dd = dist(p, bl) || 1;
        bl.vx = bl.vx * (1 - bl.homing) + (p.x - bl.x) / dd * sp * bl.homing;
        bl.vy = bl.vy * (1 - bl.homing) + (p.y - bl.y) / dd * sp * bl.homing;
      }
      if (bl.boomerang) {
        const age = bl.maxLife - bl.life;
        if (age > .42 && !bl.returning) { bl.returning = true; bl.hitIds.length = 0; }
        if (bl.returning) {
          const dd = dist(p, bl) || 1, sp = Math.hypot(bl.vx, bl.vy);
          bl.vx = bl.vx * .82 + (p.x - bl.x) / dd * sp * .18;
          bl.vy = bl.vy * .82 + (p.y - bl.y) / dd * sp * .18;
          if (dd < 26) bl.life = 0;
        }
        bl.spin += bd * 22;
      }
      if (bl.roam) bl.spin += bd * 18;
      if (bl.roll) { bl.rolled = (bl.rolled || 0) + Math.hypot(bl.vx, bl.vy) * bd;
        // Barrel Roll: heavy, so it bleeds speed as it rumbles on
        const sp = Math.hypot(bl.vx, bl.vy) || 1;
        const ns = Math.max(110, sp * (1 - bl.roll.decay * bd));
        bl.vx = bl.vx / sp * ns; bl.vy = bl.vy / sp * ns;
        bl.spin += bd * 9;
      }
      bl.x += bl.vx * bd; bl.y += bl.vy * bd;

      if (bl.weapon === "popper" && bl.bounces > 0) bl.charge = Math.min(2.4, (bl.charge || 1) + .3); // BANKER'S COUNT
      if (bl.bounces > 0) {
        if ((bl.x < 8 && bl.vx < 0) || (bl.x > w - 8 && bl.vx > 0)) {
          bl.vx *= -1; bl.bounces--; if (bl.weapon === "popper" && bl.bounces === 0) say(g, bl.x, bl.y - 14, "BANKED", "#ffd75a"); puff(g, bl.x, bl.y, bl.color, 3, 50, 3);
        }
        if ((bl.y < fieldTop(g, h) && bl.vy < 0) || (bl.y > b.maxY + 26 && bl.vy > 0)) {
          bl.vy *= -1; bl.bounces--; if (bl.weapon === "popper" && bl.bounces === 0) say(g, bl.x, bl.y - 14, "BANKED", "#ffd75a"); puff(g, bl.x, bl.y, bl.color, 3, 50, 3);
        }
      }
      if (bl.split !== undefined) {
        bl.split -= bd;
        if (bl.split <= 0) {
          bl.life = 0;
          const targets = liveBuf.slice().sort((a, e) => dist(a, bl) - dist(e, bl)).slice(0, 3);
          const base = Math.atan2(bl.vy, bl.vx);
          for (let i = 0; i < 3; i++) {
            const t = targets[i % Math.max(1, targets.length)];
            const a = t ? Math.atan2(t.y - bl.y, t.x - bl.x) : base + (i - 1) * .35;
            g.bullets.push({
              x: bl.x, y: bl.y, vx: Math.cos(a) * 880, vy: Math.sin(a) * 880, life: .9, maxLife: .9,
              damage: bl.damage * .55, r: 5, color: "#ffb0ea", weapon: "shard", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0
            });
          }
          puff(g, bl.x, bl.y, bl.color, 6, 120, 4);
        }
      }
    }
    bl.life -= bd;
    if (bl.enemy) {
      if (dist(bl, p) < bl.r + p.r - 4) {
        if (p.star > 0) { bl.life = 0; puff(g, bl.x, bl.y, "#fff3c4", 3, 60, 3); }
        else if (p.mirror > 0 && !bl.reflected) {
          // Funhouse Mirror: send it straight back, angrier than it arrived
          bl.enemy = false; bl.reflected = true; bl.pink = false; bl.color = "#b8d8e8";
          bl.damage = bl.damage * 2.4 + 6; bl.homing = 0;
          bl.vx *= -1.3; bl.vy *= -1.3;
          ring(g, bl.x, bl.y, "#b8d8e8", 30); puff(g, bl.x, bl.y, "#eaf6ff", 5, 110, 3);
          g.events.push("block");
        }
        else {
          if (p.invuln <= 0 && p.superTime <= 0) hurtPlayer(g, bl.damage, bl);
          bl.life = 0;
        }
      }
      continue;
    }
    if (bl.damage <= 0) continue;
    const cand = nearby(bl.x, bl.y, bl.r + 40);
    for (const e of cand) {
      if (e.hp <= 0 || e.hidden || e.phased || e.airborne > 0 || bl.hitIds.includes(e.id) || dist(bl, e) > bl.r + e.r) continue;
      if (e.kind === "mirror" && !bl.ex && !bl.ghostWave) {
        const inc = Math.atan2(bl.y - e.y, bl.x - e.x), da = Math.abs(((inc - e.facingA + Math.PI * 3) % TAU) - Math.PI);
        if (da < 1.15) {
          bl.hitIds.push(e.id);
          const nx = Math.cos(inc), ny = Math.sin(inc), dot = bl.vx * nx + bl.vy * ny;
          bl.vx -= 2 * dot * nx; bl.vy -= 2 * dot * ny;
          bl.enemy = true; bl.pink = false; bl.color = "#b8d8e8";
          bl.damage = Math.min(12, bl.damage * .5);
          bl.homing = 0; bl.pierce = 0; bl.tether = undefined; bl.orbit = undefined; bl.pet = undefined; bl.wave = undefined;
          ring(g, bl.x, bl.y, "#b8d8e8", 24); g.events.push("block"); e.hit = .05; break;
        }
      }
      if ((e.reflect || 0) > 0 && !bl.ex) {
        // Glitter Globe: the shot skates off the spinning mirror shell
        bl.hitIds.push(e.id);
        const inc = Math.atan2(bl.y - e.y, bl.x - e.x) + rnd(-.6, .6);
        const sp = Math.max(420, Math.hypot(bl.vx, bl.vy) * .8);
        bl.vx = Math.cos(inc) * sp; bl.vy = Math.sin(inc) * sp;
        bl.damage *= .5;
        puff(g, bl.x, bl.y, "#dff4ff", 4, 90, 3); g.events.push("block"); e.hit = .05;
        continue;
      }
      const crit = Math.random() < p.crit;
      // SYNERGY Hook & Line + Barrel Roll: kegs land 50% harder while the hook is reeling
      const rolled = bl.roll ? 1 + Math.min(1, (bl.rolled || 0) / 340) : 1;          // ROLLING THUNDER
      const dmg = bl.damage * (crit ? 2 : 1) * (bl.roll && p.grapple ? 1.5 : 1) * (bl.weapon === "popper" ? (bl.charge || 1) : 1) * rolled;
      let packed = 0;
      if (bl.weapon === "mitt") { for (const o of g.enemies) { if (o !== e && o.hp > 0 && dist(o, e) < 74 && ++packed > 1) break; } }
      damageEnemy(g, e, dmg * (packed > 1 ? 1.3 : 1), bl.color, crit);
      g.stats.hits++;
      // CRESCENDO: every creep the wave passes through makes it louder for the next.
      if (bl.weapon === "trumpet") bl.damage *= 1.16;
      // FOULS COUNTED: a whistle stun that interrupts a wind-up cancels the attack and pays a card.
      if (bl.weapon === "whistle" && e.attack > .25) {
        e.attack = 0; e.volley = []; e.cooldown = Math.max(e.cooldown, 1.4);
        addCards(g, .3); say(g, e.x, e.y - e.r - 10, "FOUL CALLED!", "#e0e6ef", true); g.events.push("whistle");
      }
      // CRATER: mortar shells leave a shell-hole that chews on anything standing in it.
      if (bl.weapon === "mortar" && !bl.ex) g.puddles.push({ x: e.x, y: e.y, r: 58, life: 2.8, max: 2.8, kind: "crater" });
      // SYNERGY Thunder Kettle + Polka Paint: a full-charge bolt detonates the paint in an ink nova
      if (bl.inkBlast && e.paint && !bl.nova) {
        bl.nova = true;
        const nc = e.paintC || "#ff5aa5"; e.paint = 0; e.paintC = undefined;
        ring(g, e.x, e.y, nc, 150); puff(g, e.x, e.y, nc, 16, 200, 6);
        g.shake = Math.max(g.shake, 7); g.events.push("boom");
        say(g, e.x, e.y - e.r - 12, "INK NOVA!", nc, true);
        for (const o of nearby(e.x, e.y, 140, nearBuf2)) if (o.id !== e.id && !o.hidden && o.hp > 0 && o.airborne <= 0) damageEnemy(g, o, 55 * p.damage, nc);
      }
      bl.hitIds.push(e.id);
      if (bl.paintMark) { e.paint = g.charm === "varnish" ? 6 : 3; e.paintC = bl.paintMark; puff(g, e.x, e.y, bl.paintMark, 4, 70, 4); }
      if (bl.pie && e.kind !== "boss") { e.blind = 2.6; say(g, e.x, e.y - e.r - 10, "SPLAT!", "#fff0b8"); }
      if (bl.stampTag && !e.tag && e.kind !== "boss") { e.tag = { t: 2.2 }; say(g, e.x, e.y - e.r - 10, "STAMPED!", "#7ee08a"); }
      if (bl.hook && e.kind !== "boss") { const hd = dist(e, p) || 1; e.x += (p.x - e.x) / hd * 110; e.y += (p.y - e.y) / hd * 110; e.stun = Math.max(e.stun || 0, .4); say(g, e.x, e.y - e.r - 8, "REELED IN!", "#e8c9a0"); }
      if (bl.bubbleFloat && e.kind !== "boss") {
        e.y -= 30; e.slow = 2.0; puff(g, e.x, e.y, "#74f0ff", 6, 80, 5);
      }
      if (g.charm === "pepper") e.burn = Math.max(e.burn, 1.6);
      if (bl.burn) e.burn = Math.max(e.burn, bl.burn * .5);
      // Volatile Rounds: every 5th shot that connects pops a small blast
      if (g.upgrades.volatile) {
        p.comboStreak++;
        if (p.comboStreak % 5 === 0) {
          ring(g, bl.x, bl.y, "#ff8c4a", 70); puff(g, bl.x, bl.y, "#ff8c4a", 8, 160, 5);
          g.shake = Math.max(g.shake, 4); g.events.push("boom");
          for (const o of nearby(e.x, e.y, 96, nearBuf2)) {
            if (o.id !== e.id && !o.hidden && o.airborne <= 0 && dist(o, e) < 96) damageEnemy(g, o, dmg * .45, "#ff8c4a");
          }
        }
      }
      if (bl.freeze && e.kind !== "boss") { e.frozen = Math.max(e.frozen, bl.freeze); g.events.push("freeze"); }
      if (bl.knock) {
        const dd = Math.hypot(bl.vx, bl.vy) || 1;
        if (e.kind !== "boss") { e.x += bl.vx / dd * bl.knock; e.y += bl.vy / dd * bl.knock; }
      }
      // WALL SLAM: choir knockback into the boards is free damage and a free stagger.
      if (bl.weapon === "choir" && e.kind !== "boss" && bl.knock) {
        const br = worldBounds(g, w, h);
        if (e.x <= br.minX + 6 || e.x >= br.maxX - 6 || e.y <= br.minY + 6 || e.y >= br.maxY - 6) {
          damageEnemy(g, e, dmg * .8, "#ff8b5c", true); e.stun = Math.max(e.stun || 0, .8);
          say(g, e.x, e.y - e.r - 10, "SLAM!", "#ff8b5c", true); g.shake = Math.max(g.shake, 5); g.events.push("thud");
        }
      }
      if (bl.splash && !bl.lob && !bl.anvilDrop) {
        g.shake = Math.max(g.shake, 8); ring(g, bl.x, bl.y, bl.color, bl.splash); puff(g, bl.x, bl.y, bl.color, 14, 220, 7); g.events.push("boom");
        for (const o of nearby(e.x, e.y, bl.splash + 40, nearBuf2)) {
          if (o.id !== e.id && !o.hidden && o.airborne <= 0 && dist(o, e) < bl.splash) damageEnemy(g, o, dmg * .6, bl.color);
        }
      }
      if (bl.weapon === "note" && bl.chains > 0) {
        let next: Enemy | null = null, nd = Infinity;
        for (const o of liveBuf) {
          if (o.id === e.id || o.hp <= 0) continue;
          const dd = dist(o, e); if (dd < nd) { nd = dd; next = o; }
        }
        if (next) {
          const dd = nd || 1;
          g.bullets.push({
            x: e.x, y: e.y, vx: (next.x - e.x) / dd * 700, vy: (next.y - e.y) / dd * 700, life: .5, maxLife: .5,
            damage: bl.damage * .75, r: 5, color: bl.color, weapon: "note", pierce: 0, bounces: 0, chains: bl.chains - 1, hitIds: [e.id], spin: 0
          });
        }
      }
      if (bl.pet) g.events.push("peck");
      if (bl.pierce > 0) bl.pierce--; else bl.life = 0;
      if (bl.life <= 0) break;
    }
  }

  // Deaths & cleanups
  const n = g.enemies.length;
  for (let i = 0; i < n; i++) { const e = g.enemies[i]; if (e.hp <= 0 && !e.dead) killEnemy(g, e, w, h); }
  compact(g.enemies, (e) => e.hp > 0);
  // `wh`, not `h`: on a stacked map a shot fired on row two or three lives at y ≈ 1200–2100 and
  // the viewport is only 720 tall, so culling by the viewport deleted it in the frame it was born.
  compact(g.bullets, (bl) => bl.life > 0 && bl.x > -120 && bl.x < w + 120 && bl.y > -120 && bl.y < wh + 120);

  // Pickups
  for (const k of g.pickups) {
    k.life -= d; k.phase += d;
    if (k.fresh && k.phase > .5) k.fresh = false;
    if (k.kind === "bulb") {
      k.y += Math.sin(k.phase * 2) * 14 * d;
      if (dist(k, p) < p.r + 12 && p.invuln <= 0) { hurtPlayer(g, 8, k); k.life = 0; }
      continue;
    }
    const dd = dist(k, p);
    if ((k.kind === "coin" || k.kind === "heart" || k.kind === "goldbar") && (dd < p.magnet || k.phase < -50)) {
      k.x += (p.x - k.x) / dd * 460 * d; k.y += (p.y - k.y) / dd * 460 * d;
    }
    if (dd < p.r + (k.kind === "weapon" ? 22 : 12)) collect(g, k);
  }
  compact(g.pickups, (k) => k.life > 0);

  for (const pu of g.puddles) {
    pu.life -= worldD;
    if (dist(pu, p) > pu.r + 6) continue;
    if (pu.kind === "web" && p.dashTime <= 0) p.webbed = .25;
    else if (pu.kind === "syrup" && p.dashTime <= 0) p.webbed = Math.max(p.webbed, .2);
    else if (pu.kind === "grease") p.momentum = Math.min(1, p.momentum + worldD * 1.8);
    else if (pu.kind === "ice") p.momentum = Math.min(1, p.momentum + worldD * 2.2);
    else if (pu.kind === "ink" && dist(pu, p) < pu.r + p.r * .5) p.gunk = Math.max(p.gunk, .6);
  }
  compact(g.puddles, (pu) => pu.life > 0);

  for (const gh of g.ghosts) { gh.life -= d; gh.y -= 55 * d; gh.x += gh.vx * d; }
  compact(g.ghosts, (gh) => gh.life > 0);

  for (const q of g.puffs) { q.x += q.vx * d; q.y += q.vy * d; q.vx *= .94; q.vy *= .94; q.life -= d;
    if (q.shell) { q.vy += 820 * d; q.spin = (q.spin || 0) + 16 * d; if (q.life < q.max * .4) { q.vy *= .8; q.vx *= .8; } } }
  compact(g.puffs, (q) => q.life > 0);

  for (const t of g.texts) { t.life -= d; t.y -= 26 * d; }
  compact(g.texts, (t) => t.life > 0);

  g.level = 1 + Math.floor(g.elapsed / 30);
  g.shake *= .86;

  if (g.kills >= g.nextUpgrade && !g.upgradeReady) {
    g.nextUpgrade += 18 + Math.floor(g.kills / 6);
    g.upgradeReady = true;
    g.events.push("levelup");
  }

  if (p.health <= 0 && !g.over) {
    if (p.wind > 0) {
      p.wind--; g.revives++;
      p.health = Math.ceil(p.maxHealth * .5);
      p.invuln = 2.2; g.flash = 1; g.shake = 20; g.slowmo = .8; g.hitstop = .15;
      ring(g, p.x, p.y, "#74e6ff", 320); ring(g, p.x, p.y, "#fff3c4", 200);
      for (const e of g.enemies) {
        const dd = dist(e, p) || 1;
        if (dd < 320) {
          damageEnemy(g, e, 120, "#74e6ff");
          if (e.kind !== "boss") { e.x += (e.x - p.x) / dd * 160; e.y += (e.y - p.y) / dd * 160; }
        }
      }
      for (const bl of g.bullets) if (bl.enemy) bl.life = 0;
      say(g, p.x, p.y - 80, "SECOND WIND!", "#74e6ff", true);
      g.events.push("revive"); g.events.push("super");
    } else {
      g.over = true;
      g.events.push("gameover");
    }
  }
  consume();
}

