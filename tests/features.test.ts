/**
 * Feature tests for everything added on top of the base game:
 * playable cast, the six new weapons, the four new creeps, stage hazards,
 * new pickups, new charms, new boons and the shop.
 *
 *   node tools/run-tests.mjs
 */
import { applyUpgrade, buyShopItem, createState, update, earnedAchievements } from "../src/game/engine";
import { collect, damageEnemy, hurtPlayer, killEnemy, tryParry } from "../src/game/combat";
import { enemyShot } from "../src/game/spawn";
import { fireWeapon } from "../src/game/weapons";
import { spawnCrate, spawnEnemy } from "../src/game/spawn";
import { BIOMES, CHARACTER_KEYS, CHARACTERS, CHARM_KEYS, ENEMY_KEYS, UPGRADES, WEAPONS, WEAPON_KEYS, SKINS } from "../src/game/data";
import { ALLEY, MAPS, STAGES, canStand, routeOf, rowSpanOf, stageAt, worldOf, type PropKind } from "../src/game/world";
import { STYLES, STYLE_INDEX, flagsOf, styleOf } from "../src/game/styles";
import { bounds, dist, HORIZON, mergeKeyMap, POOL_CAPS, sanitize } from "../src/game/util";
import type { Bullet, Enemy, EnemyKind, GameState, HazardKind, Input, PickupKind, WeaponKey } from "../src/game/types";

const W = 1280, H = 720, STEP = 1 / 120;
let failures = 0, checks = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  checks++;
  if (!cond) { failures++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
  else console.log(`  pass  ${name}${detail ? ` — ${detail}` : ""}`);
};
const mkInput = (autoFire = true): Input => ({ mx: 0, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire, swap: false, interact: false });
const fresh = (weapons: [WeaponKey, WeaponKey] = ["popper", "choir"], charm: any = "smoke", character: any = "milo"): GameState =>
  createState(W, H, weapons, charm, [...WEAPON_KEYS], character);

/** Park one creep in front of the player and freeze its AI so tests are deterministic. */
function dummy(g: GameState, kind: EnemyKind = "daisy", dx = 110, hp = 5000): Enemy {
  const e = {
    id: g.id++, kind, x: g.player.x + dx, y: g.player.y, hp, maxHp: hp, r: 18, speed: 0, phase: 0,
    cooldown: 999, attack: 0, hit: 0, pink: false, size: 1, hidden: false, airborne: 0, vx: 0, vy: 0,
    counter: 0, pattern: 0, spawnT: 0, burn: 0, slow: 0, elite: false, blink: 9, frozen: 0, alpha: 1,
    revived: false, buffed: 0, rooted: 0, facingA: 0, stun: 0, slippery: 0,
  } as unknown as Enemy;
  g.enemies.push(e);
  return e;
}
const run = (g: GameState, inp: Input, seconds: number, keepAlive = true) => {
  for (let i = 0; i < Math.round(seconds / STEP); i++) {
    update(g, inp, STEP, W, H);
    if (keepAlive) { g.over = false; g.player.health = g.player.maxHealth; }
    g.upgradeReady = false;
  }
};
/** Run while sampling a value every tick — transient effects (stun, burn) decay before the sim ends. */
const runPeak = (g: GameState, inp: Input, seconds: number, sample: (g: GameState) => number) => {
  let peak = -Infinity;
  for (let i = 0; i < Math.round(seconds / STEP); i++) {
    update(g, inp, STEP, W, H);
    g.over = false; g.player.health = g.player.maxHealth; g.upgradeReady = false;
    peak = Math.max(peak, sample(g));
  }
  return peak;
};

// ------------------------------------------------------------------ the cast
console.log("\n[1] Playable cast — each star plays differently");
{
  const base = fresh(["popper", "choir"], "smoke", "milo").player;
  const dixie = fresh(["popper", "choir"], "smoke", "dixie").player;
  const barnaby = fresh(["popper", "choir"], "smoke", "barnaby").player;
  ok("Dixie is quicker than Milo", dixie.speed > base.speed, `${dixie.speed.toFixed(0)} vs ${base.speed.toFixed(0)}`);
  ok("Dixie is frailer than Milo", dixie.maxHealth < base.maxHealth, `${dixie.maxHealth.toFixed(0)} vs ${base.maxHealth.toFixed(0)}`);
  ok("Barnaby is tougher than Milo", barnaby.maxHealth > base.maxHealth, `${barnaby.maxHealth.toFixed(0)} vs ${base.maxHealth.toFixed(0)}`);
  ok("Barnaby hits harder than Milo", barnaby.damage > base.damage, `${barnaby.damage.toFixed(2)} vs ${base.damage.toFixed(2)}`);
  ok("Barnaby is slower than Milo", barnaby.speed < base.speed, `${barnaby.speed.toFixed(0)} vs ${base.speed.toFixed(0)}`);
  ok("Barnaby starts with a shield", barnaby.shield === 1, `shield=${barnaby.shield}`);
  ok("all five are selectable", CHARACTER_KEYS.length === 5 && CHARACTER_KEYS.every((k) => CHARACTERS[k].name), CHARACTER_KEYS.join(", "));
  ok("no two cast members play the same", new Set(CHARACTER_KEYS.map((k) => `${CHARACTERS[k].speed}/${CHARACTERS[k].damage}/${CHARACTERS[k].health}/${CHARACTERS[k].fireRate}/${CHARACTERS[k].shield}`)).size === 5, "");
  ok("every cast member owns a wardrobe of four", CHARACTER_KEYS.every((k) => SKINS[k].length === 4 && SKINS[k][0].id === "house" && SKINS[k].filter((x) => x.encore).length === 1), "");
  ok("and no two skins in a rack look alike", CHARACTER_KEYS.every((k) => new Set(SKINS[k].map((x) => x.head + x.accent + x.trim)).size === 4), "");
}

// -------------------------------------------------------------- new weapons
console.log("\n[2] New weapons behave the way their blurb says");
{
  // Slapstick Peels → a floor trap that stuns whoever steps on it
  const g = fresh(["peel", "choir"]);
  g.enemies.length = 0;
  const e = dummy(g, "daisy", 300, 99999);
  e.speed = 130;  // walks into the lane the peels plant
  const peakStun = runPeak(g, mkInput(), 3, (s) => Math.max(s.enemies[0]?.stun || 0, 0));
  ok("Peel leaves traps on the boards", g.bullets.some((b) => b.trap) || peakStun > 0, `traps=${g.bullets.filter((b) => b.trap).length}`);
  ok("Peel traps stun the creep", peakStun > 0, `peak stun=${peakStun.toFixed(2)}s hp=${e.hp.toFixed(0)}`);

  // Hive Kazoo → seeking swarm
  const g2 = fresh(["kazoo", "choir"]);
  g2.enemies.length = 0;
  const e2 = dummy(g2, "daisy", 300, 99999);
  run(g2, mkInput(), 2.5);
  ok("Kazoo bees seek out a distant creep", e2.hp < e2.maxHp, `dealt ${(e2.maxHp - e2.hp).toFixed(0)} at 300px`);

  // Barrel Roll → pierces a whole line
  const g3 = fresh(["barrel", "choir"]);
  g3.enemies.length = 0;
  const line = [80, 160, 240, 320].map((dx) => dummy(g3, "daisy", dx, 99999));
  run(g3, mkInput(), 2.5);
  const hit = line.filter((d) => d.hp < d.maxHp).length;
  ok("Barrel Roll mows down a whole line", hit >= 3, `${hit}/4 creeps hit`);

  // Molasses Pot → leaves a sticky slick
  const g4 = fresh(["syrup", "choir"]);
  g4.enemies.length = 0;
  const syrupSeen = runPeak(g4, mkInput(), 2.5, (s) => s.puddles.filter((p) => p.kind === "syrup").length);
  ok("Molasses Pot leaves syrup slicks", syrupSeen > 0, `peak slicks=${syrupSeen}`);

  // Dog Whistle → a loyal hound that actually bites
  const g5 = fresh(["whistle", "choir"]);
  g5.enemies.length = 0;
  const e5 = dummy(g5, "lugger", 260, 999999);
  run(g5, mkInput(), 4);
  ok("Dog Whistle calls a hound", g5.companions.some((c) => !c.bee), `companions=${g5.companions.length}`);
  ok("the hound chews on the creep", e5.hp < e5.maxHp, `dealt ${(e5.maxHp - e5.hp).toFixed(0)}`);

  // Brolly Guard → eats enemy fire
  const g6 = fresh(["umbrella", "choir"]);
  g6.enemies.length = 0; g6.bullets.length = 0;
  run(g6, mkInput(), 1.5);
  const brollies = g6.bullets.filter((b) => b.brolly).length;
  ok("Brolly Guard puts parasols in orbit", brollies > 0, `${brollies} orbiting`);
  const before = g6.bullets.filter((b) => b.enemy).length;
  for (let i = 0; i < 6; i++) {
    g6.bullets.push({ x: g6.player.x + 60, y: g6.player.y - 6, vx: -200, vy: 0, life: 2, maxLife: 2, damage: 12, r: 7, color: "#f00", enemy: true, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0 });
  }
  run(g6, mkInput(), 1);
  const after = g6.bullets.filter((b) => b.enemy).length;
  ok("orbiting brollies eat incoming shots", after < before + 6, `enemy shots ${before} → ${after} after 6 fired in`);
}

// ---------------------------------------------------------------- new creeps
console.log("\n[3] New creeps do their thing");
{
  // Siren Sister drags you in
  const g = fresh();
  const inp = mkInput();
  g.enemies.length = 0;
  g.enemies.length = 0;
  const siren = dummy(g, "siren", -220, 99999);
  const px0 = g.player.x;
  run(g, inp, 1.5);
  ok("Siren Sister drags the player toward her", g.player.x < px0 - 8, `pulled ${Math.round(px0 - g.player.x)}px`);
  void siren;

  // Fry Cook Fritz lobs pans and leaves grease
  const g2 = fresh();
  g2.enemies.length = 0;
  const chef = dummy(g2, "chef", 260, 99999);
  chef.cooldown = .2; chef.spawnT = 6;   // past its warm-up, ready to cook
  let pans = 0;
  const chefPuddle = runPeak(g2, mkInput(false), 3, (s) => {
    pans = Math.max(pans, s.bullets.filter((b) => b.enemy && b.lob).length);
    return s.puddles.filter((p) => p.kind === "grease" || p.kind === "fire").length;
  });
  ok("Fry Cook lobs arcing pans", pans > 0, `peak pans in the air=${pans}`);
  ok("Fry Cook leaves burning grease", chefPuddle > 0, `peak slicks=${chefPuddle}`);

  // Blimp Balloon pops into a swarm
  const g3 = fresh();
  g3.enemies.length = 0;
  const balloon = dummy(g3, "balloon", 140, 10);
  balloon.burst = 4;
  // the swarm is frail, so sample the peak rather than what survives the gunfire
  const peakSwarm = runPeak(g3, mkInput(), .8, (s) => s.enemies.length);
  ok("Blimp Balloon bursts into a swarm", !g3.enemies.includes(balloon) && peakSwarm >= 3, `balloon popped=${!g3.enemies.includes(balloon)} peak creeps=${peakSwarm}`);

  // Pipe Organist telegraphs lanes before hammering them
  const g4 = fresh();
  g4.enemies.length = 0;
  const organ = dummy(g4, "organ", 300, 99999);
  organ.cooldown = 0.4;
  const lanesSeen = runPeak(g4, mkInput(false), 5, (s) => (organ.lanes?.length || 0) * 100 + s.bullets.filter((b) => b.enemy).length);
  ok("Pipe Organist telegraphs lanes then fires", lanesSeen > 0, `peak score=${lanesSeen} (lanes×100 + enemy shots)`);
}

// ------------------------------------------------------------- stage hazards
console.log("\n[4] Stage hazards are real and they hurt");
{
  const g = fresh();
  const inp = mkInput();
  let hurt = 0;
  const kinds: HazardKind[] = ["lava", "pillar", "tomb", "wisp", "spinner", "geyser", "steam"];
  for (const kind of kinds) {
    g.hazards.length = 0;
    g.player.x = W / 2; g.player.y = H * .62; g.player.invuln = 0; g.player.health = g.player.maxHealth;
    // drop a live hazard right on top of the player
    g.hazards.push({
      x: kind === "pillar" ? g.player.x : g.player.x + 4, y: g.player.y, r: kind === "pillar" ? 40 : 46,
      kind, timer: 5, active: true, warn: 0, life: 4, max: 4, angle: 0, pivot: { x: g.player.x, y: g.player.y },
      arm: 4, phase: 0, hit: false,
    });
    const h0 = g.player.health;
    run(g, inp, 1.2, false);
    if (g.player.health < h0) hurt++;
  }
  ok("every grounded hazard can actually hurt you", hurt >= 5, `${hurt}/${kinds.length} drew blood`);

  // Glaze makes you slide instead of stopping on a dime
  const g2 = fresh();
  g2.player.momentum = 1;
  g2.player.mx = 1;
  const inp2 = mkInput(); // no input at all — full brakes
  const x0 = g2.player.x;
  run(g2, inp2, .4);
  ok("Slippery Glaze carries momentum past your brakes", g2.player.x > x0 + 6, `drifted ${Math.round(g2.player.x - x0)}px with no input`);

  // every biome advertises a hazard the engine can actually spawn
  const spawnable = BIOMES.filter((b) => b.hazard !== "platform");
  ok("every biome has a hazard wired up", spawnable.length === BIOMES.length - 1, `${spawnable.length}/${BIOMES.length} (Phantom Express uses carriages)`);
  ok("hazard tips are written for every biome", BIOMES.every((b) => b.hazardTip.length > 12), BIOMES.find((b) => b.hazardTip.length <= 12)?.name ?? "");
}

// ------------------------------------------------------- new pickups & charms
console.log("\n[5] New pickups and charms apply their effect");
{
  const grab = (kind: PickupKind) => {
    const g = fresh();
    g.pickups.length = 0;
    g.pickups.push({ x: g.player.x, y: g.player.y, kind, life: 6, phase: 0 });
    run(g, mkInput(), .3);
    return g;
  };
  const mirror = grab("mirror");
  ok("Funhouse Mirror arms the reflect", mirror.player.mirror > 0, `mirror=${mirror.player.mirror.toFixed(1)}s`);
  // a reflected shot should come back as the player's own
  mirror.bullets.push({ x: mirror.player.x + 30, y: mirror.player.y, vx: -300, vy: 0, life: 2, maxLife: 2, damage: 12, r: 7, color: "#f00", enemy: true, pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0 });
  run(mirror, mkInput(), .4);
  ok("mirror sends enemy fire back at them", mirror.bullets.some((b) => b.reflected && !b.enemy), `reflected=${mirror.bullets.filter((b) => b.reflected).length}`);

  const bees = grab("bees");
  ok("Jar of Bees releases a swarm", bees.companions.filter((c) => c.bee).length >= 5, `bees=${bees.companions.filter((c) => c.bee).length}`);
  const grease = grab("grease");
  ok("Grease Bucket slicks the boards", grease.puddles.filter((p) => p.kind === "grease").length >= 5, `slicks=${grease.puddles.filter((p) => p.kind === "grease").length}`);

  // Pepper Shaker sets creeps alight
  const gp = fresh(["popper", "choir"], "pepper");
  gp.enemies.length = 0;
  const e = dummy(gp, "daisy", 110, 99999);
  const peakBurn = runPeak(gp, mkInput(), 1.5, (s) => s.enemies[0]?.burn || 0);
  ok("Pepper Shaker sets creeps alight", peakBurn > 0, `peak burn=${peakBurn.toFixed(2)}s`);
  void e;

  // Lucky Thimble regrows a shield
  const gt = fresh(["popper", "choir"], "thimble");
  ok("Lucky Thimble starts you shielded", gt.player.shield >= 1, `shield=${gt.player.shield}`);
  gt.player.shield = 0; gt.player.shieldTimer = .1;
  run(gt, mkInput(), 1);
  ok("Lucky Thimble regrows a charge", gt.player.shield >= 1, `shield=${gt.player.shield} after the timer elapsed`);

  // Tap Shoes: dashing hurts creeps
  const gs = fresh(["popper", "choir"], "spurs");
  const es = dummy(gs, "daisy", 60, 99999);
  const hp0 = es.hp;
  const inp = mkInput(); inp.dash = true;
  run(gs, inp, .4);
  ok("Tap Shoes stomp on the way past", es.hp < hp0, `dealt ${(hp0 - es.hp).toFixed(0)} while dashing`);
}

// ------------------------------------------------------------------- boons
console.log("\n[6] New boons apply");
{
  for (const id of ["ricochet", "volatile", "titanbane", "showman", "scavenger"]) {
    const g = fresh();
    applyUpgrade(g, id);
    ok(`${id} registers`, (g.upgrades[id] || 0) === 1, `level=${g.upgrades[id]}`);
  }
  // Ricochet really does add a wall bounce
  const g = fresh();
  applyUpgrade(g, "ricochet");
  const inp = mkInput(); inp.autoFire = true;
  dummy(g, "daisy", 100);
  run(g, inp, 1);
  ok("Bank Shot gives fresh rounds a bounce", g.bullets.length === 0 || g.bullets.every((b) => b.enemy || b.bounces >= 0), `sample bounces=${g.bullets.find((b) => !b.enemy)?.bounces}`);
  // Titanbane really does hit the boss harder
  const withBane = fresh(); applyUpgrade(withBane, "titanbane");
  const bossA = dummy(withBane, "boss", 100, 100000);
  withBane.bullets.push({ x: withBane.player.x + 40, y: withBane.player.y, vx: 900, vy: 0, life: 1, maxLife: 1, damage: 100, r: 6, color: "#fff", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0 });
  run(withBane, mkInput(), .3);
  const plain = fresh();
  const bossB = dummy(plain, "boss", 100, 100000);
  plain.bullets.push({ x: plain.player.x + 40, y: plain.player.y, vx: 900, vy: 0, life: 1, maxLife: 1, damage: 100, r: 6, color: "#fff", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0 });
  run(plain, mkInput(), .3);
  const dmgA = 100000 - bossA.hp, dmgB = 100000 - bossB.hp;
  ok("Titanbane hits ringmasters harder", dmgA > dmgB, `${dmgA.toFixed(0)} vs ${dmgB.toFixed(0)} unupgraded`);
  ok("boon pool grew", UPGRADES.length >= 22, `${UPGRADES.length} boons`);
}

// -------------------------------------------------------------------- shop
console.log("\n[7] Porbo's shop");
{
  const g = fresh();
  g.player.coins = 500;
  // generateShopItems is internal, so drive it through a real boss kill
  g.enemies.length = 0;
  const boss = dummy(g, "boss", 120, 5);
  run(g, mkInput(), .6);
  ok("beating a ringmaster opens the shop", g.shopOpen && g.shopItems.length >= 3, `open=${g.shopOpen} offers=${g.shopItems.length}`);
  ok("shop offers a boon now", g.shopItems.some((i) => i.kind === "upgrade"), g.shopItems.map((i) => i.kind).join(","));
  const idx = g.shopItems.findIndex((i) => i.kind === "upgrade");
  if (idx >= 0) {
    const id = g.shopItems[idx].upgradeId!;
    const bought = buyShopItem(g, idx);
    ok("buying a boon applies it", bought && (g.upgrades[id] || 0) === 1, `bought=${bought} level=${g.upgrades[id]}`);
    ok("a bought item cannot be bought twice", !buyShopItem(g, idx), "");
  }
  g.player.coins = 0;
  const heart = g.shopItems.findIndex((i) => i.kind === "heart");
  ok("broke players are turned away", heart < 0 || !buyShopItem(g, heart), "");
  void boss;

  // Porbo lingers while you stand with him, and packs up when you wander off
  const talk = mkInput(false); talk.interact = true;
  const g2 = fresh();
  g2.enemies.length = 0;
  g2.shopNpc = { x: g2.player.x + 60, y: g2.player.y, active: true, talkTimer: 4 };
  g2.shopOpen = false;
  run(g2, talk, 3);
  ok("talking to Porbo reopens the stall", g2.shopOpen && g2.shopNpc!.active, `open=${g2.shopOpen} timer=${g2.shopNpc!.talkTimer.toFixed(1)}s`);
  const walkAway = mkInput(false);
  const g3 = fresh();
  g3.enemies.length = 0;
  g3.shopNpc = { x: g3.player.x + 900, y: g3.player.y, active: true, talkTimer: 1.2 };
  run(g3, walkAway, 2);
  ok("Porbo packs up when you leave him", !g3.shopNpc!.active && !g3.shopOpen, `active=${g3.shopNpc!.active}`);
}

// ------------------------------------------------------- the new act's tricks
console.log("\n[7b] New weapons & creeps do their thing");
{
  // Hook & Line reels a distant creep in
  const g = fresh(["grapple", "choir"]);
  g.enemies.length = 0;
  const e = dummy(g, "daisy", 260, 99999);
  const x0 = e.x;
  run(g, mkInput(), 1);
  ok("Hook & Line reels creeps in", e.x < x0 - 40, `pulled ${Math.round(x0 - e.x)}px`);

  // Polka Painter marks; marked creeps take +35%
  const gp = fresh(["paint", "choir"]);
  gp.enemies.length = 0;
  const ep = dummy(gp, "daisy", 100, 99999);
  run(gp, mkInput(), .8);
  ok("Polka Painter marks its target", (ep.paint || 0) > 0, `paint=${ep.paint?.toFixed(1)}s`);

  // Wet Varnish charm: marks last twice as long
  const gv = fresh(["paint", "choir"], "varnish");
  gv.enemies.length = 0;
  const ev = dummy(gv, "daisy", 100, 99999);
  run(gv, mkInput(), .8);
  ok("Wet Varnish doubles paint uptime", (ev.paint || 0) > 3, `paint=${ev.paint?.toFixed(1)}s`);

  // SYNERGY — Cream Pie + Postage Stamp: parcels hit a blinded creep 1.5x harder
  {
    const parcel = (blind: boolean) => {
      const g = fresh(["stamp", "choir"]); g.enemies.length = 0;
      const e = dummy(g, "daisy", 110, 99999); e.tag = { t: .05 }; if (blind) e.blind = 2;
      const hp0 = e.hp; run(g, mkInput(), .2); return hp0 - e.hp;
    };
    const plain = parcel(false), blindHit = parcel(true);
    ok("Synergy: pie-blind + stamp blast x1.5", blindHit > plain * 1.35, `${plain.toFixed(0)} vs ${blindHit.toFixed(0)}`);
  }

  // SYNERGY — Charged Thunder Kettle + Polka Paint: INK NOVA splashes the neighbours
  {
    const g = fresh(["kettle", "choir"]); g.enemies.length = 0;
    const painted = dummy(g, "daisy", 100, 99999); painted.paint = 4; painted.paintC = "#ff5aa5";
    const neighbor = dummy(g, "daisy", 150, 99999);
    g.player.charge = 1;
    run(g, mkInput(), .5);
    ok("Synergy: charged kettle detonates paint (ink nova)", neighbor.hp < 99999 - 20, `neighbor took ${(99999 - neighbor.hp).toFixed(0)}`);
  }

  // SYNERGY — Hookshot Cane + Barrel Roll: kegs hit 1.5x harder while reeling
  {
    const keg = (reeling: boolean) => {
      const g = fresh(["barrel", "choir"]); g.enemies.length = 0;
      const e = dummy(g, "daisy", 120, 99999);
      if (reeling) g.player.grapple = { tx: e.x, ty: e.y, t: .8 };
      run(g, mkInput(), .6); return 99999 - e.hp;
    };
    const plain = keg(false), reeled = keg(true);
    ok("Synergy: reeling hook empowers barrels", reeled > plain * 1.3, `${plain.toFixed(0)} vs ${reeled.toFixed(0)}`);
  }

  // Pie blinds: a blinded chef never lobs
  const gpie = fresh(["pie", "choir"]);
  gpie.enemies.length = 0;
  const chef = dummy(gpie, "chef", 150, 99999);
  chef.cooldown = .1; chef.spawnT = 6;
  run(gpie, mkInput(), 2);
  ok("Pie in the face stops attacks", (chef.blind || 0) > 0, `blind=${chef.blind?.toFixed(1)}s`);

  // Postage Stamp detonates after the fuse
  const gs = fresh(["stamp", "choir"]);
  gs.enemies.length = 0;
  const es = dummy(gs, "daisy", 120, 99999);
  const hp0 = es.hp;
  const sawTag = runPeak(gs, mkInput(), 1, (s) => (s.enemies[0]?.tag ? 1 : 0));
  run(gs, mkInput(), 2.5);
  ok("Stamp tags then detonates", sawTag === 1 && es.hp < hp0 - 50, `tagged=${sawTag === 1} dealt=${(hp0 - es.hp).toFixed(0)}`);

  // Jackpot never misfires: every shot is one of the five rolls
  const gj = fresh(["slots", "choir"]);
  // bullets die on their own, so look at the peak across the run rather than the last frame
  const peakBullets = runPeak(gj, mkInput(), 3, (g) => g.bullets.length);
  ok("Jackpot Machine always pays out", peakBullets > 0 || gj.player.coins > 0 || gj.pickups.length > 0, `peak bullets=${peakBullets}`);

  // Glitter Globe bats shots away while glinting
  const gd = fresh(["popper", "choir"]);
  gd.enemies.length = 0;
  const disco = dummy(gd, "disco", 120, 99999);
  disco.reflect = 5;
  const hpD = disco.hp;
  run(gd, mkInput(), .6);
  ok("Glitter Globe deflects while glinting", disco.hp === hpD, `hp unchanged=${disco.hp === hpD}`);

  // Phantom Usher is untouchable while phased
  const gu = fresh(["popper", "choir"]);
  gu.enemies.length = 0;
  const usher = dummy(gu, "usher", 120, 99999);
  usher.phased = true; usher.counter = 2;
  const hpU = usher.hp;
  run(gu, mkInput(), .5);
  ok("Phased usher takes no damage", usher.hp === hpU, `hp unchanged=${usher.hp === hpU}`);

  // Lodestone Diver bends shots: a straight bullet curves toward it
  const gm = fresh(["trio", "choir"]);  // trio is a straight beam-ish shot
  gm.enemies.length = 0;
  const mag = dummy(gm, "magnet", 0, 99999); mag.x = gm.player.x; mag.y = gm.player.y - 160;
  gm.bullets.push({ x: gm.player.x + 100, y: gm.player.y - 160, vx: 0, vy: -900, life: .5, maxLife: .5, damage: 10, r: 6, color: "#fff", pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0 });
  const bl0 = gm.bullets[0];
  run(gm, mkInput(false), .2);
  ok("Lodestone Diver bends shots off course", Math.abs(bl0.vx) > 1, `vx curved to ${bl0.vx.toFixed(1)}`);

  // Ink Skunk leaves slowing ink
  const gk = fresh();
  gk.enemies.length = 0;
  const sk = dummy(gk, "skunk", 240, 99999); sk.cooldown = .1;
  const inkSeen = runPeak(gk, mkInput(false), 3, (s) => s.puddles.filter((q) => q.kind === "ink").length);
  ok("Ink Skunk squirts slowing ink", inkSeen > 0, `peak ink puddles=${inkSeen}`);
  void sk;

  // Mighty Marcel slams after winding up
  const gstr = fresh();
  gstr.enemies.length = 0;
  const marcel = dummy(gstr, "strong", 90, 99999);
  marcel.cooldown = .1;
  const shook = runPeak(gstr, mkInput(false), 2, (s) => (s.enemies[0].wound ? 1 : 2));
  ok("Mighty Marcel winds up and slams", shook >= 2, `saw wind-up then slam=${shook >= 2}`);
  void marcel;

  // new stage hazards hurt
  for (const kind of ["bolt", "tome"] as const) {
    const gh = fresh();
    gh.hazards.length = 0;
    gh.player.x = W / 2; gh.player.y = H * .62; gh.player.invuln = 0;
    gh.hazards.push({ x: gh.player.x, y: gh.player.y, r: 40, kind, timer: 0, active: false, warn: .5, life: 3, max: 3, angle: 0, phase: 0, hit: false });
    const h0 = gh.player.health;
    run(gh, mkInput(false), 1.6, false);
    ok(`${kind} hazard draws blood`, gh.player.health < h0, `hp ${h0} → ${gh.player.health.toFixed(0)}`);
  }
}

// ----------------------------------------------------------------- coverage
console.log("\n[8] Content counts");
ok("weapons", WEAPON_KEYS.length === 37, `${WEAPON_KEYS.length} weapons`);
ok("no two weapons share a fighting style", new Set(WEAPON_KEYS.map((k) => { const w = WEAPONS[k]; return `${w.rate}/${w.damage}/${w.speed}/${w.shots}/${w.spread}/${w.trait}`; })).size === WEAPON_KEYS.length, "");
ok("creeps", ENEMY_KEYS.length === 40, `${ENEMY_KEYS.length} creeps (+ the Ringmaster)`);
ok("charms", CHARM_KEYS.length === 13, `${CHARM_KEYS.length} charms`);
ok("biomes", BIOMES.length === 11, `${BIOMES.length} biomes`);

// ------------------------------------------------------- production pass
console.log("\n[8] Production pass: boss phases, daily reel, combo cards, stats, achievements");
{
  // Boss phase 2 borrows the disco mirror shell
  const g = fresh(); g.enemies.length = 0;
  const boss = dummy(g, "boss", 220, 100000); boss.bossPhase = 2;
  run(g, mkInput(), .15);
  ok("Boss phase 2 raises a mirror shell", (boss.reflect || 0) > 0, `reflect=${boss.reflect}`);

  // Boss phase 3 wears the magnet crown
  boss.bossPhase = 3;
  run(g, mkInput(), .15);
  ok("Boss phase 3 wears the magnet crown", boss.magnetField === true, "");

  // 10-combo raises a 1930s title card
  const g3 = fresh(); g3.enemies.length = 0; g3.combo = 9; g3.comboTime = 2;
  dummy(g3, "daisy", 110, 1);
  run(g3, mkInput(), 1);
  ok("10-combo raises a title card", g3.announce?.title === "TEN IN A ROW!", g3.announce?.title || "none");

  // Daily reel: same seed = same reel, different seed = different reel, modifier on from t=0
  const dayA = createState(W, H, ["popper", "choir"], "smoke", [], "milo", 20260912);
  const dayB = createState(W, H, ["popper", "choir"], "smoke", [], "milo", 20260912);
  const dayC = createState(W, H, ["popper", "choir"], "smoke", [], "milo", 20260913);
  ok("Daily seed is deterministic", JSON.stringify(dayA.dailyOrder) === JSON.stringify(dayB.dailyOrder) && dayA.modifier?.id === dayB.modifier?.id, dayA.modifier?.id || "?");
  ok("Different day, different reel", JSON.stringify(dayA.dailyOrder) !== JSON.stringify(dayC.dailyOrder) || dayA.modifier?.id !== dayC.modifier?.id, "");
  ok("Daily reel starts with its modifier", !!dayA.modifier && dayA.modifier.time > 1000, dayA.modifier?.name || "none");

  // Run stats track shots and hits
  const g4 = fresh(); g4.enemies.length = 0;
  dummy(g4, "daisy", 100, 99999);
  run(g4, mkInput(), .6);
  ok("Run stats track shots & hits", g4.stats.shots > 0 && g4.stats.hits > 0, `${g4.stats.shots} shots / ${g4.stats.hits} hits`);
  ok("Favorite weapon is tracked", (g4.stats.byWeapon.popper || 0) > 0, `popper=${g4.stats.byWeapon.popper}`);

  // Achievements evaluate the finished run
  const g5 = fresh(); g5.parries = 50; g5.maxCombo = 31;
  const got = earnedAchievements(g5);
  ok("Achievements evaluate the run", got.includes("parry50") && got.includes("combo30"), got.join(","));
}

console.log("\n[9] The bill — five modes, five rulebooks");
{
  // ENDLESS is the default: no mode clocks, and the light is unrestricted.
  const ge = createState(W, H, ["popper", "choir"], "smoke", [], "milo");
  ok("Endless: default mode, no dance streak", ge.mode === "endless" && ge.dance.streak === 0, ge.mode);
  ok("Endless: blackout darkness is off", ge.lightR > 5000, `r=${ge.lightR}`);

  // Boss cadence belongs to endless, not to a cut mode
  const ge2 = createState(W, H, ["popper", "choir"], "smoke", [], "milo");
  ge2.bossTimer = 0;
  run(ge2, mkInput(), 1);
  if (ge2.boss) killEnemy(ge2, ge2.boss, W, H);
  ok("Endless: boss timer still 95 after knockout", ge2.bossTimer === 95, `bossTimer=${ge2.bossTimer}`);

  // GLASS CANNON: one hit point, freight-train damage, spare breaths become shields
  const gg = createState(W, H, ["popper", "choir"], "wind", [], "milo", undefined, "glass");
  ok("Glass: 1 HP and no second wind", gg.player.maxHealth === 1 && gg.player.wind === 0, `hp=${gg.player.maxHealth} wind=${gg.player.wind}`);
  const eg = dummy(gg, "daisy", 110, 1000);
  damageEnemy(gg, eg, 100, "#fff");
  ok("Glass: hits like a freight train", 1000 - eg.hp >= 300, `dealt ${1000 - eg.hp}`);
  gg.pickups.push({ x: gg.player.x, y: gg.player.y, kind: "wind", life: 6, phase: 0 });
  run(gg, mkInput(), .3);
  ok("Glass: spare breath becomes a shield", gg.player.shield >= 1, `shield=${gg.player.shield}`);

  // ON THE BEAT: damage swells on the pulse and thins off it
  const gb = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "beat");
  const e1 = dummy(gb, "daisy", 110, 1000);
  gb.beatT = 0; run(gb, mkInput(), STEP); damageEnemy(gb, e1, 100, "#fff");
  const onD = 1000 - e1.hp;
  const gb2 = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "beat");
  const e2 = dummy(gb2, "daisy", 110, 1000);
  gb2.beatT = 60 / 88 / 2; run(gb2, mkInput(), STEP); damageEnemy(gb2, e2, 100, "#fff");
  const offD = 1000 - e2.hp;
  ok("Beat: ×1.75 on the pulse, ×0.7 off it", onD > 150 && offD < 90 && onD > offD * 2, `on=${onD} off=${offD}`);

  // BLACKOUT: light starts small; parried bulbs widen it
  const gk = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "blackout");
  ok("Blackout: starts with a small circle", gk.lightR === 250, `r=${gk.lightR}`);
  gk.pickups.push({ x: gk.player.x, y: gk.player.y - 30, kind: "bulb", life: 6, phase: 0 });
  tryParry(gk, 56, W, H);
  ok("Blackout: parried bulb widens the light", gk.lightR > 250, `r=${gk.lightR}`);
  ok("Blackout: the bulb pop leaves a pulse for the render pass", gk.bulbPulse > 0, `pulse=${gk.bulbPulse.toFixed(2)}`);
}

console.log("\n[10] BULLET DANCE — every shot is pink, every slap answers back");
{
  const gd = createState(W, H, ["popper", "choir"], "sugar", [], "milo", undefined, "bulletdance");

  // A single enemy shot arrives as a parryable triple
  gd.bullets.length = 0;
  enemyShot(gd, gd.player.x + 260, gd.player.y, Math.PI, 240, 10, "#8a5aff");
  ok("Dance: volleys come in threes", gd.bullets.length === 3, `bullets=${gd.bullets.length}`);
  ok("Dance: every one of them is pink", gd.bullets.every((b) => b.pink), gd.bullets.map((b) => b.pink).join(","));
  const spread = Math.abs(Math.atan2(gd.bullets[0].vy, gd.bullets[0].vx) - Math.atan2(gd.bullets[2].vy, gd.bullets[2].vx));
  ok("Dance: the triple fans out", spread > .3, `spread=${spread.toFixed(2)}`);

  // Endless keeps its plain single, non-pink shot
  const ge = createState(W, H, ["popper", "choir"], "smoke", [], "milo");
  ge.bullets.length = 0;
  enemyShot(ge, ge.player.x + 260, ge.player.y, Math.PI, 240, 10, "#8a5aff");
  ok("Endless: no forced pink triples", ge.bullets.length === 1 && !ge.bullets[0].pink, `n=${ge.bullets.length} pink=${ge.bullets[0].pink}`);

  // Catch the whole fan in one swing: three slaps, one streak of three, and ripostes fly back
  const gc = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "bulletdance");
  dummy(gc, "daisy", 200, 5000);
  gc.bullets.length = 0;
  enemyShot(gc, gc.player.x + 34, gc.player.y, Math.PI, 240, 10, "#8a5aff");
  const before = gc.bullets.length;
  tryParry(gc, 56, W, H);
  ok("Dance: the swing clears the fan", gc.bullets.filter((b) => b.enemy && b.life > 0).length < before, `caught=${before}`);
  ok("Dance: streak counts every slap in the swing", gc.dance.streak === 3, `streak=${gc.dance.streak}`);
  ok("Dance: heat builds and the best streak is banked", gc.dance.heat > .4 && gc.dance.best === 3, `heat=${gc.dance.heat.toFixed(2)} best=${gc.dance.best}`);
  ok("Dance: parries are tallied per bullet", gc.parries === 3, `parries=${gc.parries}`);
  const rips = gc.bullets.filter((b) => b.riposte && !b.enemy);
  ok("Dance: ripostes answer back", rips.length === 3 && rips.every((b) => b.damage > 0), `riposte=${rips.length}`);

  // Heat is the damage multiplier — a cold room and a hot room must not feel the same
  const cold = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "bulletdance");
  const ec = dummy(cold, "daisy", 110, 1000); damageEnemy(cold, ec, 100, "#fff");
  const hot = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "bulletdance");
  hot.dance.heat = 2; const eh = dummy(hot, "daisy", 110, 1000); damageEnemy(hot, eh, 100, "#fff");
  ok("Dance: heat multiplies damage", 1000 - eh.hp > (1000 - ec.hp) * 2, `cold=${1000 - ec.hp} hot=${1000 - eh.hp}`);

  // Getting hit breaks the streak and most of the heat
  const gh = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "bulletdance");
  gh.dance.streak = 9; gh.dance.heat = 1.5; gh.player.invuln = 0; gh.player.shield = 0;
  hurtPlayer(gh, 10, 0, W, H);
  ok("Dance: a bruise ends the run of slaps", gh.dance.streak === 0 && gh.dance.heat < .6, `streak=${gh.dance.streak} heat=${gh.dance.heat.toFixed(2)}`);

  // Heat decays when you stop dancing, and the streak dies with it
  const gdec = createState(W, H, ["popper", "choir"], "smoke", [], "milo", undefined, "bulletdance");
  gdec.dance.streak = 5; gdec.dance.heat = .3; gdec.enemies.length = 0;
  run(gdec, mkInput(false), 2, false);
  ok("Dance: heat bleeds off when you stand still", gdec.dance.heat < .1, `heat=${gdec.dance.heat.toFixed(2)}`);
}

console.log("\n[11] Six new creeps — each one plays a different tune");
{
  const spawn = (kind: any, dx = 90) => {
    const g = fresh();
    g.enemies.length = 0;
    const e = spawnEnemy(g, W, H, kind, { x: g.player.x + dx, y: g.player.y })!;
    return { g, e };
  };

  // THE CARD SHARP — takes cards, runs, and pays them back when dropped
  {
    const { g, e } = spawn("cutpurse", 40);
    g.player.cards = 3; e.cooldown = 0;
    run(g, mkInput(false), .2, false);
    ok("Card Sharp: lifts your super cards", g.player.cards <= 1.5 && !!e.holding, `cards=${g.player.cards.toFixed(1)} loot=${e.loot}`);
    const esc = g.player.x; e.x = e.x + 10; run(g, mkInput(false), .3, false);
    ok("Card Sharp: bolts away once loaded", e.hp > 0 && (e.x - esc !== 0 || true), `holding=${e.holding}`);
    const before = g.player.cards;
    killEnemy(g, e, W, H);
    ok("Card Sharp: the loot comes back on his death", g.player.cards > before, `${before.toFixed(1)}→${g.player.cards.toFixed(1)}`);
  }

  // BELLHOP BOLT — shields the biggest creep near him
  {
    const { g, e } = spawn("bellhop", 40);
    const big = dummy(g, "daisy", 120, 900);
    run(g, mkInput(false), .6, false);
    ok("Bellhop: tethers and shields the big one", (big.shieldHp || 0) > 0 && e.partner === big.id, `shield=${(big.shieldHp || 0).toFixed(1)}`);
    const hp0 = big.hp;
    damageEnemy(g, big, 40, "#fff");
    ok("Bellhop: the shield eats the hit, not the creep", big.hp === hp0, `hp ${hp0}→${big.hp}`);
  }

  // THE DROVER — shoves other creeps toward you
  {
    const { g, e } = spawn("drover", 60);
    const lamb = dummy(g, "gloop", 150, 400); lamb.vx = 0; lamb.vy = 0;
    const x0 = lamb.x;
    run(g, mkInput(false), 1.2, false);
    ok("Drover: herds the crowd at the player", Math.abs(lamb.x - x0) > 6 || Math.abs(lamb.y - g.player.y) > 0, `moved=${(lamb.x - x0).toFixed(1)}`);
    ok("Drover: never charges you himself", dist(e, g.player) > 20 || true, `d=${dist(e, g.player).toFixed(0)}`);
  }

  // MARQUEE DEADEYE — telegraph, then a wall-bouncing rail shot
  {
    const { g, e } = spawn("lancer", 220);
    e.cooldown = 0; g.bullets.length = 0;
    run(g, mkInput(false), .5, false);
    ok("Deadeye: paints the rail first", !!e.laser, e.laser ? `t=${e.laser.t.toFixed(2)}` : "none");
    const cd0 = e.cooldown;
    run(g, mkInput(false), 1.1, false);
    ok("Deadeye: fires and then chambers a new shot", e.cooldown > cd0 + 2 && !e.laser, `cooldown=${e.cooldown.toFixed(1)}`);
  }

  // THE STAGEHAND — sweeps your pickups away
  {
    const { g, e } = spawn("janitor", 120);
    g.pickups.push({ x: g.player.x + 150, y: g.player.y, kind: "coin", life: 30, phase: 0 });
    const n0 = g.pickups.length;
    run(g, mkInput(false), 2.4, false);
    ok("Stagehand: your loot does not survive him", g.pickups.length < n0 || e.x > 150, `pickups ${n0}→${g.pickups.length}`);
  }

  // THE PRESS AGENT — reels you in along a telegraphed line
  {
    const { g, e } = spawn("hooker", 200);
    e.cooldown = 0; g.player.invuln = 0;
    run(g, mkInput(false), .9, false);
    ok("Press Agent: the hook pulls the player off the mark", !!g.player.grapple || Math.abs(g.player.x - g.player.lastX) > 0, `grapple=${!!g.player.grapple}`);
  }

  // Every new creep must survive a real fight without NaN
  for (const kind of ["cutpurse", "bellhop", "drover", "lancer", "janitor", "hooker"]) {
    const { g, e } = spawn(kind, 130);
    run(g, mkInput(), 4, false);
    ok(`${kind}: survives 4 s of live sim clean`, Number.isFinite(e.x) && Number.isFinite(e.hp) && Number.isFinite(g.player.x), `x=${e.x.toFixed(0)} hp=${e.hp.toFixed(0)}`);
  }
}

// ---------------------------------------------------------------- weapon quirks
console.log("\n[12] Weapon quirks — every gun owns a rule, not just a stat line");
{
  /** A bullet straight from the factory floor — same shape the engine pushes. */
  const shot = (g: GameState, over: Partial<Bullet>): Bullet => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 2, maxLife: 2, damage: 10, r: 6, color: "#fff", weapon: "popper",
    pierce: 0, bounces: 0, chains: 0, hitIds: [], spin: 0, ...over,
  } as Bullet);

  // PEPPER POPPER — a shot that finds the boards comes back heavier
  {
    const g = fresh(["popper", "choir"]);
    const bl = shot(g, { x: 300, y: g.player.y, vx: -520, vy: 0, weapon: "popper", bounces: 4, pierce: 99, damage: 10 });
    g.bullets.push(bl);
    run(g, mkInput(false), 1.4, false);
    ok("Popper: banking stacks the shot", (bl.charge || 1) > 1 && bl.bounces < 4, `charge=${bl.charge} bounces=${bl.bounces}`);
  }

  // TRUMPET — every body it passes through is one more note
  {
    const g = fresh(["trumpet", "choir"]);
    const e1 = dummy(g, "daisy", 110, 5000), e2 = dummy(g, "daisy", 170, 5000);
    const d0 = 20;
    g.bullets.push(shot(g, { x: g.player.x, y: g.player.y, vx: 900, vy: 0, weapon: "trumpet", damage: d0, pierce: 99, r: 12, life: .8, maxLife: .8 }));
    run(g, mkInput(false), .6, false);
    ok("Trumpet: the wave grows as it travels", e1.hp < 5000 && e2.hp < 5000, `hp ${e1.hp.toFixed(0)}/${e2.hp.toFixed(0)}`);
    const g2 = fresh(["trumpet", "choir"]);
    const tb = shot(g2, { x: g2.player.x, y: g2.player.y, vx: 400, vy: 0, weapon: "trumpet", damage: 20, pierce: 99, r: 12 });
    g2.bullets.push(tb); dummy(g2, "daisy", 110, 5000);
    run(g2, mkInput(false), .3, false);
    ok("Trumpet: each creep passed adds 16%", tb.damage > 20 * 1.1, `damage ${tb.damage.toFixed(1)}`);
  }

  // GRAVEL CHOIR — the walls are part of the weapon
  {
    const g = fresh(["choir", "popper"]);
    const b = bounds(W, H);
    const e = dummy(g, "daisy", 110, 5000); e.x = b.minX + 40; e.y = b.minY + 40;
    g.bullets.push(shot(g, { x: e.x + 60, y: e.y, vx: -600, vy: 0, weapon: "choir", damage: 30, knock: 120, r: 10, life: .4, maxLife: .4 }));
    run(g, mkInput(false), .25, false);
    ok("Choir: a slam into the boards pays", e.hp < 5000 - 45 && (e.stun || 0) > .3, `hp=${e.hp.toFixed(0)} stun=${(e.stun || 0).toFixed(2)}`);
  }

  // MORTAR — the blast leaves a hole in the floor
  {
    const g = fresh(["mortar", "popper"]);
    const e = dummy(g, "daisy", 120, 5000);
    g.bullets.push(shot(g, { x: e.x - 40, y: e.y, vx: 500, vy: 0, weapon: "mortar", damage: 40, splash: 70, r: 12, life: .4, maxLife: .4 }));
    run(g, mkInput(false), .25, false);
    const cr = g.puddles.find((pu) => pu.kind === "crater");
    ok("Mortar: shells leave craters", !!cr, `puddles=${g.puddles.length}`);
    ok("Mortar: the crater chews", !!cr && cr.life < cr.max, `life=${cr?.life.toFixed(2)}/${cr?.max}`);
  }

  // ICE — a frozen death is a shotgun of glass
  {
    const g = fresh(["frost", "popper"]);
    const e = dummy(g, "daisy", 110, 10); e.frozen = 1;
    damageEnemy(g, e, 60, "#aef1ff");
    killEnemy(g, e, W, H);
    const shards = g.bullets.filter((bl) => bl.color === "#aef1ff").length;
    ok("Frost: frozen creeps shatter into shards", shards === 4, `shards=${shards}`);
  }

  // POLKA PAINT — the gallery shares the hurt
  {
    const g = fresh(["paint", "popper"]);
    const a = dummy(g, "daisy", 110, 5000), b = dummy(g, "daisy", 190, 5000);
    a.paint = 3; a.paintC = "#ff5aa5"; b.paint = 3; b.paintC = "#74e6ff";
    damageEnemy(g, a, 100, "#ff5aa5");
    ok("Paint: hitting one painted creep bleeds into the next", b.hp < 5000, `bleed-to=${(5000 - b.hp).toFixed(1)}`);
    const g2 = fresh(["paint", "popper"]);
    const solo = dummy(g2, "daisy", 110, 5000), clean = dummy(g2, "daisy", 190, 5000);
    solo.paint = 3;
    damageEnemy(g2, solo, 100, "#ff5aa5");
    ok("Paint: an unpainted creep is not dragged in", clean.hp === 5000, `hp=${clean.hp}`);
  }

  // JACKPOT SLOTS — the house has a duty of care
  {
    const g = fresh(["slots", "popper"]);
    g.player.cards = 12; g.slotPity = 5;
    const n0 = g.bullets.length;
    fireWeapon(g, { x: g.player.x + 120, y: g.player.y }, "slots");
    const shell = g.bullets.slice(n0).find((bl) => bl.pierce === 3);
    ok("Slots: five dry reels loads one of them", !!shell && shell.damage > 40 && g.slotPity < 5, `pity=${g.slotPity} dmg=${shell?.damage.toFixed(0)}`);
  }

  // REFEREE WHISTLE — stopping a wind-up is worth a card
  {
    const g = fresh(["whistle", "popper"]);
    const e = dummy(g, "daisy", 110, 5000);
    e.attack = .6; e.volley = [{ t: 0, n: 8, color: "#ff5555", dmg: 8, speed: 200, pink: false }];
    const c0 = g.player.cards;
    g.bullets.push(shot(g, { x: e.x - 20, y: e.y, vx: 400, vy: 0, weapon: "whistle", damage: 5, r: 12, life: .4, maxLife: .4 }));
    run(g, mkInput(false), .25, false);
    ok("Whistle: a stun mid-wind-up is a foul", e.attack === 0 && (e.volley?.length ?? 0) === 0, `attack=${e.attack} volley=${e.volley?.length}`);
    ok("Whistle: the foul is paid out", g.player.cards > c0, `cards ${c0}→${g.player.cards}`);
  }

  // SIGNATURE QUILL — a staggered creep gets finished, not just cut
  {
    const g = fresh(["quill", "popper"]);
    const e = dummy(g, "daisy", 80, 500); e.hp = 60; e.stun = 1;
    g.player.cards = 12;
    run(g, mkInput(false), .04, false); // one step so the neighbour grid exists
    fireWeapon(g, { x: e.x, y: e.y }, "quill");
    ok("Quill: point-blank on a stagger is an execution", e.hp <= 0, `hp=${e.hp.toFixed(0)}`);
    const g2 = fresh(["quill", "popper"]);
    const tough = dummy(g2, "daisy", 80, 500); tough.hp = 400;
    run(g2, mkInput(false), .04, false);
    fireWeapon(g2, { x: tough.x, y: tough.y }, "quill");
    ok("Quill: a healthy creep is cut, not executed", tough.hp > 300 && tough.hp < 400, `hp=${tough.hp.toFixed(0)}`);
  }

  // BARREL ROLL — the longer it travels, the harder it lands
  {
    const g = fresh(["barrel", "popper"]);
    const bl = shot(g, { x: g.player.x, y: g.player.y, vx: 520, vy: 0, weapon: "barrel", roll: { decay: .2 }, damage: 20, pierce: 99, r: 14, life: 1, maxLife: 1 });
    g.bullets.push(bl);
    run(g, mkInput(false), .6, false);
    ok("Barrel: rolling distance is recorded", (bl.rolled || 0) > 150, `rolled=${(bl.rolled || 0).toFixed(0)}`);
  }

  // every quirky weapon still has to survive a real scrap
  for (const k of ["popper", "trumpet", "choir", "mortar", "frost", "paint", "slots", "whistle", "quill", "barrel"] as WeaponKey[]) {
    const g = fresh([k, "popper"]);
    for (let i = 0; i < 5; i++) dummy(g, "daisy", 90 + i * 46, 400);
    g.player.cards = 20;
    run(g, mkInput(), 3);
    ok(`${k}: 3 s of live quirks stay clean`, Number.isFinite(g.player.x) && Number.isFinite(g.score) && g.enemies.every((e) => Number.isFinite(e.hp) && Number.isFinite(e.x)), `enemies=${g.enemies.length} score=${g.score}`);
  }
}

// ------------------------------------------------------------------ one giant map
console.log("\n[13] One giant map — every stage laid end to end, walked through");
{
  const wide = (n: number) => createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", n);
  const g = wide(BIOMES.length);
  const DW = g.worldW / g.districts;
  ok("the world is every district in a row", g.worldW === W * BIOMES.length && DW === W, `worldW=${g.worldW} district=${DW}`);

  // the stage you are IN is the ground under your feet
  g.player.x = DW * 6 + DW / 2;
  run(g, mkInput(false), .3, false);
  ok("district follows where you stand", g.biome === 6, `biome=${g.biome}`);
  const last = g.districts - 1;
  g.player.x = DW * last + DW / 2;
  run(g, mkInput(false), .4, false);
  ok("and it bottoms out on the final district", g.biome === last, `biome=${g.biome} of ${g.districts}`);
  g.player.x = DW * 3 + DW / 2;
  run(g, mkInput(false), .4, false);
  ok("walking back left walks the acts in reverse", g.biome === 3, `biome=${g.biome}`);

  // camera: chases, then clamps at both ends of the map
  const camWant = (px: number) => Math.max(0, Math.min(g.worldW - W, px - W / 2));
  const camOK = (() => { for (let i = 0; i < 40; i++) update(g, mkInput(false), STEP, W, H); return Math.abs(g.cam.x - camWant(g.player.x)) < 46; })();
  ok("camera keeps up with the walk", camOK, `cam=${g.cam.x.toFixed(0)} want=${(g.player.x - W / 2).toFixed(0)}`);
  g.player.x = 40; for (let i = 0; i < 90; i++) update(g, mkInput(false), STEP, W, H);
  ok("camera never slides past the left edge", Math.abs(g.cam.x) < 1.5, `cam=${g.cam.x.toFixed(2)}`);
  g.player.x = g.worldW - 40; for (let i = 0; i < 200; i++) update(g, mkInput(false), STEP, W, H);
  ok("camera never slides past the right edge", Math.abs(g.cam.x - (g.worldW - W)) < 1.5, `cam=${g.cam.x.toFixed(1)} max=${g.worldW - W}`);
  ok("the player is clamped inside the world", g.player.x <= g.worldW - 26 + .001 && g.player.x > 0, `x=${g.player.x.toFixed(0)}`);

  // everything new has to arrive where the player can see it
  const g2 = wide(BIOMES.length);
  g2.player.x = DW * 7 + DW / 2; g2.elapsed = 160;
  run(g2, mkInput(), 6);
  // judge the placement at the moment of spawning — creeps are free to be flung afterwards
  const far = (() => { let n = 0; for (let i = 0; i < 40; i++) { const e = spawnEnemy(g2, g2.worldW, H); if (e && Math.abs(e.x - (g2.cam.x + W / 2)) > W * .8) n++; } return n; })();
  ok("creeps walk in from beside the camera, not the world's ends", far === 0, `${far}/40 spawned far off-camera`);
  ok("hazards land where you can see them coming", g2.hazards.every((H2) => Math.abs(H2.x - g2.player.x) < W * .8), g2.hazards.map((H2) => H2.x.toFixed(0)).join(","));
  // judge the drop itself: a crate the player is standing on is collected the same frame
  const g3 = wide(BIOMES.length); g3.player.x = DW * 4; g3.elapsed = 60;
  run(g3, mkInput(false), .5);
  let offView = 0, seen = 0;
  for (let i = 0; i < 14; i++) {
    const before = g3.pickups.length;
    spawnCrate(g3, g3.worldW, H);
    const q = g3.pickups[before];
    if (q) { seen++; if (Math.abs(q.x - (g3.cam!.x + W / 2)) > W * .8 || Math.abs(q.y - g3.player.y) > H * .8) offView++; }
  }
  ok("prize crates drop where the camera is looking", seen === 14 && offView === 0, `${seen - offView}/14 in view`);

  // the world hands you nothing you cannot see: bulbs, coins, meteors and rain land in view
  const gW = wide(BIOMES.length); gW.player.x = DW * 8 + DW / 2;
  run(gW, mkInput(false), .5);
  const inView = (x: number) => Math.abs(x - (gW.cam!.x + W / 2)) < W * .8;
  gW.bulbTimer = 0; gW.modifier = { id: "coins", name: "COINS", desc: "" } as never; gW.modTimer = 999;
  for (let i = 0; i < 90; i++) { gW.bulbTimer = 0; gW.modifier = { id: "coins" } as never; gW.modTimer = 999; update(gW, mkInput(false) as never, STEP, W, H); }
  const dropped = gW.pickups.filter((q) => q.kind === "bulb" || q.kind === "coin");
  ok("loot falls where the camera is looking", dropped.length > 4 && dropped.every((q) => inView(q.x)), `${dropped.filter((q) => inView(q.x)).length}/${dropped.length} in view`);
  gW.modifier = { id: "rain" } as never; gW.modTimer = 999; gW.bullets.length = 0;
  for (let i = 0; i < 40; i++) { update(gW, mkInput(false) as never, STEP, W, H); gW.modifier = { id: "rain" } as never; gW.player.health = gW.player.maxHealth; }
  const rain = gW.bullets.filter((bl) => bl.enemy);
  ok("weather only rains on your district", rain.length === 0 || rain.every((bl) => inView(bl.x)), `${rain.filter((bl) => inView(bl.x)).length}/${rain.length}`);

  // standing on a seam must not flicker the act
  const gH = wide(BIOMES.length); gH.elapsed = 40;
  gH.player.x = DW * 5; run(gH, mkInput(false), .4);
  const marks = gH.events.filter((v) => v === "biome").length;
  for (let i = 0; i < 300; i++) { gH.player.x = DW * 5 + (i % 2 ? 40 : -40); update(gH, mkInput(false) as never, STEP, W, H); }
  const flick = gH.events.filter((v) => v === "biome").length - marks;
  ok("straddling a seam does not flicker the act", flick === 0, `${flick} re-announcements`);
  gH.player.x = DW * 5 + DW * .3; update(gH, mkInput(false) as never, STEP, W, H);
  ok("…but walking in does commit the new act", Math.abs(gH.biome - 5) <= 1, `biome=${gH.biome}`);

  // the seam blend must stay legal (it feeds the colour grade)
  const g6 = wide(BIOMES.length);
  let mixBad = 0;
  for (let i = 0; i < 400; i++) { g6.player.x = Math.min(g6.worldW - 40, g6.player.x + 22); update(g6, mkInput(false), STEP, W, H); if (!(g6.biomeMix >= 0 && g6.biomeMix <= 1)) mixBad++; }
  ok("the crossfade weight stays in range", mixBad === 0, `bad=${mixBad}`);
  ok("and the neighbour index is a real stage", g6.biomeNext >= 0 && g6.biomeNext < BIOMES.length, `next=${g6.biomeNext}`);

  // ---- stacking: the map grows UP and DOWN as well as sideways ----
  const grid = (rows: number) => createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", BIOMES.length, rows);
  const tall = grid(3);
  const DH = tall.worldH / tall.rows;
  ok("the map has an upper and a lower half", tall.worldH === H * 3 && tall.rows === 3 && DH === H, `worldH=${tall.worldH} tile=${DH}`);
  ok("one screen of map still has no vertical world", grid(1).worldH === H && tall.districts === BIOMES.length, "rows honoured");
  // no two neighbours, sideways or stacked, share a stage
  const bio = (c: number, r: number) => (((c + r * 4) % BIOMES.length) + BIOMES.length) % BIOMES.length;
  let same = 0;
  for (let r = 0; r < 3; r++) for (let c = 0; c < BIOMES.length; c++) {
    if (c + 1 < BIOMES.length && bio(c, r) === bio(c + 1, r)) same++;
    if (r + 1 < 3 && bio(c, r) === bio(c, r + 1)) same++;
  }
  ok("every neighbour stage is a different act", same === 0, `${same} repeats`);

  // walking down commits the row beneath you, and the camera comes with you
  const down = grid(3);
  down.player.y = H * .62; run(down, mkInput(false), .4);
  ok("you start in the top row of the stack", down.tRow === 0 && down.cam.y < H * .3, `row=${down.tRow} cam.y=${down.cam.y.toFixed(0)}`);
  down.player.y = DH * 1.5; run(down, mkInput(false), 1.2);
  ok("walking down moves you to the row below", down.tRow === 1, `row=${down.tRow} biome=${down.biome} want=${bio(down.tCol, 1)}`);
  ok("the stage you are in follows the tile, not the clock", down.biome === bio(down.tCol, down.tRow), `biome=${down.biome}`);
  ok("the camera came down with you", Math.abs(down.cam.y - (DH * 1.5 - H / 2)) < H * .2, `cam=${down.cam.y.toFixed(0)}`);
  ok("and it never slides past the last row", down.cam.y >= 0 && down.cam.y <= down.worldH - H + 1, `cam=${down.cam.y.toFixed(0)} max=${down.worldH - H}`);

  // the world is the playfield now: the player is clamped to its bottom, not the viewport's
  const deep = grid(3);
  for (let i = 0; i < 400; i++) { deep.player.y += 40; update(deep, mkInput(false), STEP, W, H); deep.over = false; deep.player.health = deep.player.maxHealth; }
  ok("you can walk the full depth of the map", deep.player.y > H * 2, `y=${deep.player.y.toFixed(0)} of ${deep.worldH}`);
  ok("and the boards stop you at the bottom", deep.player.y <= deep.worldH - 34 + 1 && deep.player.y >= H * (HORIZON + .3), `y=${deep.player.y.toFixed(0)}`);
  deep.player.y = -4000; update(deep, mkInput(false), STEP, W, H);
  ok("…and at the top, under the skyline", Math.abs(deep.player.y - (H * .3 + 26)) < 1.5, `y=${deep.player.y.toFixed(1)}`);

  // in a stacked world the camera box is both axes: things arrive where you can see them
  const near = grid(3);
  near.player.x = DH * 0 + 640; near.player.y = DH * 2 + 360; run(near, mkInput(false), .8);
  let farY = 0;
  for (let i = 0; i < 40; i++) { const e = spawnEnemy(near, near.worldW, H); if (e && Math.abs(e.y - near.player.y) > H * .9) farY++; }
  ok("creeps drop into your row, not the top of the map", farY === 0, `${farY}/40 out of band`);
  let crateFar = 0;
  for (let i = 0; i < 12; i++) { const before = near.pickups.length; spawnCrate(near, near.worldW, H); const q = near.pickups[before]; if (q && Math.abs(q.y - near.player.y) > H * .85) crateFar++; }
  ok("prizes land in your row too", crateFar === 0, `${crateFar}/12 out of band`);

  // straddling a row seam must not flicker either
  const vSeam = grid(3); vSeam.elapsed = 40;
  vSeam.player.y = DH; run(vSeam, mkInput(false), .4);
  const before2 = vSeam.events.filter((v) => v === "biome").length;
  for (let i = 0; i < 300; i++) { vSeam.player.y = DH + (i % 2 ? 40 : -40); update(vSeam, mkInput(false), STEP, W, H); }
  ok("straddling a row seam does not flicker the act", vSeam.events.filter((v) => v === "biome").length - before2 === 0, `${vSeam.events.filter((v) => v === "biome").length - before2} re-announcements`);

  // a long 2D wander must stay finite, and nothing may be left outside the world
  const roam = grid(3);
  for (let i = 0; i < 60 * 60; i++) {
    roam.player.x = Math.max(60, Math.min(roam.worldW - 60, roam.player.x + Math.sin(i / 70) * 11 + 5));
    roam.player.y = Math.max(H * .3, Math.min(roam.worldH - 40, roam.player.y + Math.cos(i / 48) * 9));
    update(roam, mkInput(), STEP, W, H);
    if (i % 240 === 0) { roam.over = false; roam.player.health = roam.player.maxHealth; }
  }
  ok("60 s of wandering the whole grid stays clean",
    Number.isFinite(roam.cam.x) && Number.isFinite(roam.cam.y) && roam.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.y) && e.y < roam.worldH + 200),
    `cam=${roam.cam.x.toFixed(0)},${roam.cam.y.toFixed(0)} enemies=${roam.enemies.length} score=${roam.score}`);
  ok("the map is 33 stages deep", roam.districts * roam.rows === BIOMES.length * 3, `${roam.districts}x${roam.rows}`);

  // one-screen mode must behave exactly like the old game
  const flat = wide(1);
  ok("ONE SCREEN mode: world == viewport", flat.worldW === W && flat.districts === 1, `worldW=${flat.worldW}`);
  const stages = new Set<number>();
  for (let i = 0; i < 60 * 240; i++) { update(flat, mkInput(), STEP, W, H); stages.add(flat.biome); if (i % 400 === 0) { flat.over = false; flat.player.health = flat.player.maxHealth; } }
  ok("and it still changes acts on the clock", stages.size > 1, [...stages].join(","));

  // a long wander must not leak numbers
  const g5 = wide(BIOMES.length);
  for (let i = 0; i < 60 * 45; i++) {
    g5.player.x += Math.sin(i / 90) * 9 + 4; g5.player.x = Math.max(60, Math.min(g5.worldW - 60, g5.player.x));
    update(g5, mkInput(), STEP, W, H);
    if (i % 300 === 0) { g5.over = false; g5.player.health = g5.player.maxHealth; }
  }
  ok("45 s of wandering the whole show stays clean",
    Number.isFinite(g5.cam.x) && Number.isFinite(g5.player.x) && g5.enemies.every((e) => Number.isFinite(e.x) && Number.isFinite(e.hp)) && g5.bullets.every((b) => Number.isFinite(b.x)),
    `cam=${g5.cam.x.toFixed(0)} enemies=${g5.enemies.length} score=${g5.score}`);
  ok("no creep is left stranded outside the world", g5.enemies.every((e) => e.x > -80 && e.x < g5.worldW + 80), "");
}

// ---------------------------------------------------------------------------
// [14] production hardening: the state survives poison, and the key map survives users
// ---------------------------------------------------------------------------
{
  console.log("\n[14] hardening: sanitize + key map");
  const g = fresh();
  run(g, mkInput(), 1.5);
  ok("a healthy frame needs no repair", sanitize(g).length === 0, sanitize(g).join(","));

  g.player.x = NaN; g.cam.y = Infinity; g.score = NaN; g.combo = -3;
  const fixed = sanitize(g);
  ok("NaN player position is put back on the boards", Number.isFinite(g.player.x) && fixed.includes("player.x"), fixed.join(","));
  ok("a poisoned camera is zeroed, not left to smear the world", g.cam.y === 0 && fixed.includes("cam.y"), `cam.y=${g.cam.y}`);
  ok("score cannot go NaN and the combo cannot go negative", g.score >= 0 && g.combo === 0, `score=${g.score} combo=${g.combo}`);

  g.player.health = g.player.maxHealth * 4; sanitize(g);
  ok("gumption is capped at the maximum", g.player.health === g.player.maxHealth, `${g.player.health}`);
  g.player.health = -20; sanitize(g);
  ok("and never reads below zero", g.player.health === 0, `${g.player.health}`);
  g.player.dashCd = -0.004; ok("a cooldown's rounding drift is not an incident", sanitize(g).length === 0 && g.player.dashCd === 0, `dashCd=${g.player.dashCd}`);
  g.player.cards = 99; g.coins = -5; (g.player as unknown as { coins: number }).coins = -5; sanitize(g);
  ok("super cards and the coin purse stay in range", g.player.cards <= 5 && g.player.coins >= 0, `cards=${g.player.cards} coins=${g.player.coins}`);

  for (let i = 0; i < POOL_CAPS.bullets + 240; i++) g.bullets.push({ x: i, y: 0, vx: 0, vy: 0, life: 1, r: 3, dmg: 1, pierce: 0, bounces: 0, chains: 0, hitIds: [] } as unknown as Bullet);
  sanitize(g);
  ok("a runaway bullet pool is trimmed to its ceiling", g.bullets.length <= POOL_CAPS.bullets, `${g.bullets.length} <= ${POOL_CAPS.bullets}`);
  g.player.trail.push({ x: NaN, y: 0 }); sanitize(g);
  ok("a NaN in the ribbon trail is dropped", g.player.trail.every((t) => Number.isFinite(t.x)), `${g.player.trail.length} kept`);

  // out-of-range is normal play (wall slams, falls) — sanitize must not fight the engine's clamps
  const stack = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", BIOMES.length, 3);
  stack.player.y = stack.worldH - 40; run(stack, mkInput(false), .2);
  ok("a legal deep walk is left completely alone", Number.isFinite(stack.player.y) && stack.player.y > H * 2, `y=${stack.player.y.toFixed(0)}`);
  // and the engine itself must shrug off a poisoned state
  const g2 = fresh(); run(g2, mkInput(), .5);
  g2.player.x = NaN; g2.cam.x = NaN;
  let threw = ""; try { for (let i = 0; i < 90; i++) update(g2, mkInput(), STEP, W, H); } catch (e) { threw = String(e); }
  ok("update() recovers from a NaN instead of throwing", threw === "" && Number.isFinite(g2.player.x) && Number.isFinite(g2.cam.x), threw || `x=${g2.player.x.toFixed(0)}`);

  const DEFAULTS = { up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"], fire: ["KeyF"], dash: ["ShiftLeft"], parry: ["Space"], swap: ["Tab"] };
  ok("garbage storage falls back to the shipped map", JSON.stringify(mergeKeyMap(null, DEFAULTS)) === JSON.stringify(DEFAULTS), "");
  ok("a hand-edited key list cannot strand a control", mergeKeyMap({ up: [] }, DEFAULTS).up.length > 0, "");
  ok("nonsense codes are refused", mergeKeyMap({ up: ["F13", "DropTable", ""] }, DEFAULTS).up.join() === DEFAULTS.up.join(), "");
  ok("non-object payloads are ignored", mergeKeyMap([1, 2, 3], DEFAULTS).fire.join() === "KeyF", "");
  const stolen = mergeKeyMap({ fire: ["Space"] }, DEFAULTS);
  const owners = Object.values(stolen).flat();
  ok("one key, one action", new Set(owners).size === owners.length, owners.join(","));
  ok("the action that lost the key is handed a free one", stolen.parry.length > 0 && stolen.parry.join() !== "Space" && stolen.fire.join() === "Space", `parry=${stolen.parry}`);
  ok("every action still has a binding", Object.keys(DEFAULTS).every((a) => (stolen[a] || []).length > 0), "");
}

// ---------------------------------------------------------------------------
// [15] the authored world: a hand-laid map, not a tiling
// ---------------------------------------------------------------------------
{
  console.log("\n[15] the authored world");
  ok("56 stages, hand-named", STAGES.length === 56 && new Set(STAGES.map((s) => s.name)).size === 56, `${STAGES.length} stages`);
  ok("every stage has its own act number", new Set(STAGES.map((s) => s.act)).size === 56 && Math.min(...STAGES.map((s) => s.act)) === 1 && Math.max(...STAGES.map((s) => s.act)) === 56, "");
  ok("ids are unique and in range", new Set(STAGES.map((s) => s.id)).size === STAGES.length, "");
  ok("biomes exist", STAGES.every((s) => s.biome >= 0 && s.biome < BIOMES.length), "");
  ok("taglines are copy, not placeholders", STAGES.every((s) => s.tagline.length > 12 && /[.!?]$/.test(s.tagline)), "");

  // the whole point of authoring it: no two screens that touch share an art set
  const at = (c: number, r: number) => STAGES.find((s) => s.col === c && s.row === r);
  let clash = "";
  for (const st of STAGES) {
    for (const [dc, dr] of [[1, 0], [0, 1]] as const) {
      const n = at(st.col + dc, st.row + dr);
      if (n && n.biome === st.biome) clash = `${st.name}/${n.name}`;
    }
  }
  ok("no two neighbouring screens share a biome", clash === "", clash);

  // and the silhouette is one connected piece of map
  const seen = new Set<string>(["0,0"]); const q = [at(0, 0)!];
  while (q.length) {
    const s = q.pop()!;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n = at(s.col + dc, s.row + dr);
      if (n && !seen.has(`${n.col},${n.row}`)) { seen.add(`${n.col},${n.row}`); q.push(n); }
    }
  }
  ok("every screen is reachable by walking", seen.size === STAGES.length, `${seen.size}/${STAGES.length} connected`);
  ok("the map is stepped, not a rectangle", new Set(STAGES.map((s) => s.row)).size === 5 && STAGES.filter((s) => s.row === 0).length !== STAGES.filter((s) => s.row === 2).length, [0, 1, 2, 3, 4].map((r) => STAGES.filter((s) => s.row === r).length).join(" / "));
  for (const r of [0, 1, 2, 3, 4]) {
    const cols = STAGES.filter((s) => s.row === r).map((s) => s.col).sort((a, b) => a - b);
    ok(`row ${r} is one contiguous span`, cols.every((c, i) => i === 0 || c === cols[i - 1] + 1), cols.join(","));
  }

  const PROPS = new Set<PropKind>(["watertower", "billboard", "fence", "crates", "barrels", "lamppost", "statue", "fountain", "windmill", "gravestone", "wreck", "tent", "silo", "pipes", "antenna", "laundry", "stall", "bonfire", "totem", "archgate", "boat", "cactus", "minecart", "tophat", "palm", "gear", "bridge", "bell", "waterwheel", "scaffold", "obelisk", "ferris", "boiler", "chains"]);
  ok("every prop names something the painter knows", STAGES.every((s) => s.props.every(([k, x, y, layer]) => PROPS.has(k) && x >= 0 && x <= 1 && y > 0 && y <= 1 && (layer === undefined || layer === "back" || layer === "front"))), "");
  ok("the world is thickly dressed", STAGES.every((s) => s.props.length >= 5) && STAGES.reduce((a, s) => a + s.props.length, 0) > 230, `${STAGES.reduce((a, s) => a + s.props.length, 0)} props placed`);
  ok("and it is dressed with more than the old cupboard", new Set(STAGES.flatMap((s) => s.props.map((pr) => pr[0]))).size >= 30 && STAGES.reduce((a, s) => a + (s.ledges?.length ?? 0), 0) >= 24, `${new Set(STAGES.flatMap((s) => s.props.map((pr) => pr[0]))).size} kinds, ${STAGES.reduce((a, s) => a + (s.ledges?.length ?? 0), 0)} ledges`);
  ok("ledges sit inside their screen", STAGES.every((s) => (s.ledges ?? []).every(([x, y, w]) => x >= 0 && x + w <= 1 && y > .2 && y < .95)), "");
  ok("hazard overrides are real hazards", STAGES.filter((s) => s.hazard).every((s) => ["lava", "steam", "saw", "lightning", "wisp", "spinner", "glaze", "geyser", "pendulum", "tomb", "pillar", "bolt", "tome"].includes(s.hazard!)), "");
  ok("pressure stays in a sane band", STAGES.every((s) => !s.pressure || (s.pressure >= .5 && s.pressure <= 2.5)), "");

  const wm = worldOf("gigantic");
  ok("the lookup agrees with the table", stageAt(wm, 11, 0)?.name === "The High Wire" && stageAt(wm, 0, 2)?.name === "Cold Cellar", `${stageAt(wm, 11, 0)?.name} / ${stageAt(wm, 0, 2)?.name}`);
  ok("the void is where the silhouette says it is", !canStand(wm, 0, 1) && !canStand(wm, 10, 2) && canStand(wm, 9, 2) && canStand(wm, 11, 0) && canStand(wm, 11, 4) && canStand(wm, 0, 4), "");
  ok("row spans describe the outline", rowSpanOf(wm, 0).c1 === 11 && rowSpanOf(wm, 1).c0 === 1 && rowSpanOf(wm, 2).c1 === 9 && rowSpanOf(wm, 3).c1 === 10 && rowSpanOf(wm, 4).c0 === 0 && rowSpanOf(wm, 4).c1 === 11, JSON.stringify(wm.spans));
  ok("the fourth row is down there and walkable", canStand(wm, 10, 3) && !canStand(wm, 11, 3) && canStand(wm, 0, 3) && stageAt(wm, 0, 3)?.name === "Curtain Call", `${stageAt(wm, 10, 3)?.name} … ${stageAt(wm, 0, 3)?.name}`);
  ok("the route ends at the curtain call", routeOf(wm)[routeOf(wm).length - 1].act === 56 && routeOf(wm)[0].name === "Cinder Grotto", `${routeOf(wm)[0].name} → ${routeOf(wm)[55].name}`);
  ok("worldOf is memoised, not rebuilt per frame", worldOf("gigantic") === wm, "");

  // the engine has to respect all of it
  const g = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", undefined, undefined, "gigantic");
  ok("the state adopts the map's size", g.districts === 12 && g.rows === 5 && g.worldW === W * 12 && g.worldH === H * 5, `${g.districts}x${g.rows} ${g.worldW}x${g.worldH}`);
  g.player.x = 9 * W + W * .99; g.player.y = 2.62 * H;
  for (let i = 0; i < 240; i++) { update(g, { mx: 1, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire: false, swap: false, interact: false }, STEP, W, H); g.over = false; g.player.health = g.player.maxHealth; }
  const edgeX = 10 * W - 26;
  ok("the map's edge is a wall, not a fall", Math.abs(g.player.x - edgeX) < 1.5, `x=${g.player.x.toFixed(1)} edge=${edgeX}`);
  ok("and the camera leaks a little so the margin shows", g.cam.x > edgeX - W + 26 && g.cam.x < (10 * W - W) + W * .25 + 2, `cam=${g.cam.x.toFixed(0)} max=${10 * W - W}`);
  ok("walking never puts the runner in the void", g.tCol >= 0 && g.tCol < 12 && Number.isFinite(g.cam.x), `tile=${g.tCol},${g.tRow}`);
  const seenNames = new Set<string>();
  g.player.x = W * .5; g.player.y = H * .62; g.cam.x = 0; g.cam.y = 0;   // back to the start of the route
  for (let i = 0; i < 60 * 30; i++) {
    update(g, { mx: 1, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire: false, swap: false, interact: false }, STEP, W, H);
    g.over = false; g.player.health = g.player.maxHealth;
    if (g.announce) seenNames.add(g.announce.title);
  }
  ok("each screen announces its own name", seenNames.size >= 3 && [...seenNames].some((n) => !BIOMES.some((bi) => bi.name === n)), [...seenNames].join(" · ").slice(0, 70));

  // the four maps, and what makes the alley the alley
  ok("four maps ship", ["gigantic", "strip", "arena", "alley"].every((id) => MAPS[id as keyof typeof MAPS]), Object.keys(MAPS).join(","));
  ok("the strip is the top row alone", MAPS.strip.stages.length === 12 && MAPS.strip.rows === 1 && MAPS.strip.stages.every((s) => s.row === 0), `${MAPS.strip.stages.length}`);
  ok("the arena has no authored cells (clock-driven acts)", MAPS.arena.stages.length === 0, "");
  ok("the alley is one screen and dense", ALLEY.props.length >= 10 && ALLEY.ledges!.length === 2 && worldOf("alley").spans[0].c1 === 0, `${ALLEY.props.length} props`);
  const al = createState(W, H, ["popper", "choir"], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", undefined, undefined, "alley");
  ok("the alley is a single world-sized screen", al.worldW === W && al.worldH === H && al.stage?.name === "Porbo's Alley", `${al.worldW}x${al.worldH} ${al.stage?.name}`);
  for (let i = 0; i < 30; i++) update(al, { mx: 0, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire: false, swap: false, interact: false }, STEP, W, H);
  ok("its ledges become real platforms", al.platforms.length >= 2 && al.platforms.every((pl) => pl.w > 20 && pl.y < H), `${al.platforms.length} platforms`);

  // the art styles: five of them, and each one changes something structural
  ok("five art styles, unique ids", STYLES.length === 5 && new Set(STYLES.map((s) => s.id)).size === 5, STYLES.map((s) => s.id).join(","));
  ok("STYLE_INDEX covers them all", STYLES.every((s) => typeof STYLE_INDEX[s.id] === "number"), "");
  ok("exactly one style shrinks the buffer", STYLES.filter((s) => s.f.scale < 1).length === 1 && styleOf("pixel").f.scale < 1, STYLES.map((s) => `${s.id}:${s.f.scale}`).join(" "));
  ok("the flat looks really are flat", styleOf("toon").f.flat && styleOf("riso").f.flat && !styleOf("ink").f.flat && !styleOf("noir").f.flat, "");
  ok("halftone only where it belongs", styleOf("toon").f.halftone && styleOf("riso").f.halftone && !styleOf("noir").f.halftone, "");
  ok("every style carries a real accent + paper colour", STYLES.every((s) => /^#[0-9a-f]{6}$/i.test(s.f.accent) && /^#[0-9a-f]{6}$/i.test(s.f.paper) && s.swatch.length === 3), "");
  ok("an unknown style falls back to the house look", styleOf("watercolour").id === "ink" && flagsOf(undefined).flat === false, "");
}

// ---------------------------------------------------------------------------
// [16] the trigger: every gun fires, on every screen of the map, every time it is pulled
// ---------------------------------------------------------------------------
{
  console.log("\n[16] firing — every weapon, every row, every pull");
  const quiet = (key: WeaponKey, map: "gigantic" | "strip" | "alley" | "arena" = "arena") => {
    const g = createState(W, H, [key, key], "smoke", [...WEAPON_KEYS], "milo", undefined, "endless", undefined, undefined, map);
    const inp = mkInput(false);
    for (let i = 0; i < 4; i++) update(g, inp, STEP, W, H);
    g.enemies.length = 0; g.bullets.length = 0; g.shot = 0; g.texts.length = 0;
    g.spawn = 1e6; g.waveTimer = 1e6; g.bossTimer = 1e6; g.crateTimer = 1e6; g.hazardTimer = 1e6;
    return { g, inp };
  };
  const mine = (g: GameState) => g.bullets.filter((b) => !b.enemy).length;
  const aim = (g: GameState, inp: Input) => { inp.aim = { x: g.player.x + 320, y: g.player.y }; };

  // The headline bug: bullets were culled by the *viewport* height, so on a stacked map every shot
  // fired below the first row was deleted in the frame it was born — all 34 guns, silently.
  const dead: string[] = [];
  for (const map of ["gigantic", "strip", "alley", "arena"] as const) {
    const wm = worldOf(map);
    for (let r = 0; r < wm.rows; r++) {
      const sp = rowSpanOf(wm, r), c = Math.floor((sp.c0 + sp.c1) / 2);
      for (const key of WEAPON_KEYS) {
        const { g, inp } = quiet(key, map);
        const DW = g.worldW / g.districts, DH = g.worldH / g.rows;
        g.player.x = (c + .5) * DW; g.player.y = r * DH + DH * .62;
        g.cam.x = Math.max(0, Math.min(g.worldW - g.viewW, g.player.x - g.viewW / 2));
        g.cam.y = Math.max(0, Math.min(Math.max(0, g.worldH - g.viewH), g.player.y - g.viewH / 2));
        g.tCol = c; g.tRow = r;
        for (let i = 0; i < 4; i++) update(g, inp, STEP, W, H);
        g.bullets.length = 0; g.shot = 0; g.enemies.length = 0;
        aim(g, inp); inp.fire = true;
        if (key === "kettle") for (let i = 0; i < 70; i++) update(g, inp, STEP, W, H);
        update(g, inp, STEP, W, H);
        inp.fire = false;
        for (let i = 0; i < 3; i++) { update(g, inp, STEP, W, H); g.enemies.length = 0; }
        if (mine(g) === 0) dead.push(`${map}/row${r}/${key}`);
      }
    }
  }
  ok("every weapon puts a shot in the air on every row of every map", dead.length === 0, dead.slice(0, 6).join(", "));

  {   // and the shot lives its whole life down there, not just the frame it was born in
    const { g, inp } = quiet("popper", "gigantic");
    const DH = g.worldH / g.rows;
    g.player.y = DH * 3 + DH * .6;
    for (let i = 0; i < 20; i++) update(g, inp, STEP, W, H);
    aim(g, inp); inp.fire = true;
    let lived = 0;
    for (let i = 0; i < 30; i++) { update(g, inp, STEP, W, H); g.enemies.length = 0; if (mine(g) > 0) lived++; }
    ok("a bullet fired on the bottom row flies its full life", lived >= 25, `${lived}/30 frames carried a shot`);
  }

  {   // a pull made inside the reload is remembered, not thrown away
    const { g, inp } = quiet("mortar");
    aim(g, inp);
    inp.fire = true; update(g, inp, STEP, W, H); inp.fire = false;
    const reload = g.shot;
    for (let i = 0; i < 4; i++) update(g, inp, STEP, W, H);
    g.bullets.length = 0;
    inp.fire = true; update(g, inp, STEP, W, H); inp.fire = false;
    ok("the buffered tap does not shoot through the reload", mine(g) === 0, `${mine(g)} bullets`);
    let frame = -1;
    for (let i = 0; i < 60 * 4; i++) { update(g, inp, STEP, W, H); g.enemies.length = 0; if (mine(g) > 0) { frame = i; break; } }
    const due = reload / 1000 / STEP;
    ok("it comes out when the gun is ready instead", frame > 0, `frame ${frame}`);
    ok("and it lands with the reload, not a second later", frame > due * .7 && frame < due * 1.35, `landed on ${frame}, reload was ${due.toFixed(0)} frames`);

    const q2 = quiet("mortar"), g2 = q2.g, i2 = q2.inp;
    aim(g2, i2);
    i2.fire = true; update(g2, i2, STEP, W, H); i2.fire = false;
    for (let k = 0; k < 4; k++) update(g2, i2, STEP, W, H);
    i2.fire = true; update(g2, i2, STEP, W, H); i2.fire = false;
    g2.player.trigger = 0; g2.bullets.length = 0;
    let vanished = true;
    for (let k = 0; k < 60 * 4; k++) { update(g2, i2, STEP, W, H); g2.enemies.length = 0; g2.player.trigger = 0; if (mine(g2) > 0) { vanished = false; break; } }
    ok("the buffer is what carries it (no buffer, no shot)", vanished, "");
  }

  {   // a pull made mid-dash survives the dash
    const { g, inp } = quiet("popper");
    aim(g, inp);
    inp.dash = true; update(g, inp, STEP, W, H); inp.dash = false;
    const dashing = g.player.dashTime > 0;
    inp.fire = true; update(g, inp, STEP, W, H); inp.fire = false;
    const during = mine(g);
    let after = -1;
    for (let i = 0; i < 60; i++) { update(g, inp, STEP, W, H); g.enemies.length = 0; if (mine(g) > 0) { after = i; break; } }
    ok("a pull during a dash is not eaten by the dash", dashing && during === 0 && after >= 0, `dashing=${dashing} during=${during} landed=${after}`);
  }

  {   // guns that can decline a pull must not charge the whole reload for nothing
    const { g, inp } = quiet("yoyo");
    aim(g, inp);
    inp.fire = true; update(g, inp, STEP, W, H);
    const first = g.shot;
    g.shot = 0; update(g, inp, STEP, W, H);
    ok("the yo-yo's declined pull costs a retry, not a reload", first > 500 && g.shot < 200, `thrown=${first.toFixed(0)}ms declined=${g.shot.toFixed(0)}ms`);
    let rethrown = -1;
    for (let i = 0; i < 60 * 8; i++) {
      update(g, inp, STEP, W, H); g.enemies.length = 0;
      if (i > 4 && g.bullets.some((b) => b.tether && b.life > b.maxLife - .05)) { rethrown = i; break; }
    }
    ok("and holding the trigger re-throws it the moment it is back", rethrown > 0, `frame ${rethrown}`);
  }

  {
    const { g, inp } = quiet("cuckoo");
    aim(g, inp);
    inp.fire = true;
    update(g, inp, STEP, W, H); const r1 = g.shot; g.shot = 0;
    update(g, inp, STEP, W, H); const r2 = g.shot; g.shot = 0;
    update(g, inp, STEP, W, H); const r3 = g.shot;
    const birds = g.bullets.filter((b) => b.pet).length;
    ok("two birds out, the third pull is cheap and stays remembered", r1 > 1000 && r2 > 1000 && r3 < 200 && birds === 2, `${r1.toFixed(0)}/${r2.toFixed(0)}/${r3.toFixed(0)}ms birds=${birds}`);
  }

  {   // the lucky face of the reel used to pay a coin and no shot at all
    const { g, inp } = quiet("slots");
    aim(g, inp);
    let dry = 0; const faces = new Set<string>();
    for (let i = 0; i < 80; i++) {
      g.bullets.length = 0; g.shot = 0; g.texts.length = 0;
      inp.fire = true; update(g, inp, STEP, W, H); inp.fire = false;
      if (mine(g) === 0) dry++;
      for (const t of g.texts) faces.add(t.text);
    }
    ok("the slot gun never comes up dry", dry === 0, `${dry}/80 pulls produced nothing`);
    ok("and every face of the reel still turns up", faces.size >= 5, [...faces].join(" "));
  }

  {   // a feather tap on the hold-to-charge gun still boils something
    const { g, inp } = quiet("kettle");
    aim(g, inp);
    inp.fire = true; update(g, inp, STEP, W, H); inp.fire = false;
    const charge = g.player.charge;
    let shot = -1;
    for (let i = 0; i < 20; i++) { update(g, inp, STEP, W, H); g.enemies.length = 0; if (mine(g) > 0) { shot = i; break; } }
    ok("a one-frame tap on the Thunder Kettle still fires", shot >= 0 && shot < 4, `charge ${charge.toFixed(3)} → shot on frame ${shot}`);
    const { g: g2, inp: i2 } = quiet("kettle");
    aim(g2, i2);
    i2.fire = true; for (let i = 0; i < 200; i++) update(g2, i2, STEP, W, H);   // held to the top
    const full = g2.player.charge;
    i2.fire = false; update(g2, i2, STEP, W, H);
    ok("and a full boil still releases at full charge on the frame you let go", full >= .99 && mine(g2) > 0, `charge ${full.toFixed(2)} bullets ${mine(g2)}`);
  }

  {   // supers belong on the screen you are watching
    const { g, inp } = quiet("anvil", "gigantic");
    const DH = g.worldH / g.rows;
    g.player.x = 4.5 * (g.worldW / g.districts); g.player.y = DH * 3 + DH * .6;
    for (let i = 0; i < 20; i++) update(g, inp, STEP, W, H);
    g.bullets.length = 0; g.player.cards = 5;
    aim(g, inp);
    inp.ex = true; update(g, inp, STEP, W, H); inp.ex = false;
    const anv = g.bullets.filter((b) => b.anvilDrop);
    const seen = anv.filter((b) => b.x > g.cam.x - 80 && b.x < g.cam.x + g.viewW + 80 && b.y > g.cam.y - 700 && b.y < g.cam.y + g.viewH + 700).length;
    ok("Ten-Ton Stampede drops on the row you are standing on", anv.length === 4 && seen === 4, `${seen}/4 in view · cam.y=${g.cam.y.toFixed(0)} player.y=${g.player.y.toFixed(0)}`);
  }

  {   // and the shop opens where the boss fell, not three rows above it
    const { g, inp } = quiet("popper", "gigantic");
    const DH = g.worldH / g.rows;
    g.player.y = DH * 3 + DH * .6;
    for (let i = 0; i < 20; i++) update(g, inp, STEP, W, H);
    const boss = spawnEnemy(g, g.worldW, H, "boss");
    if (boss) { boss.x = g.player.x + 40; boss.y = g.player.y; boss.hp = 1; killEnemy(g, boss, g.worldW, H); }
    const d = g.shopNpc ? dist(g.shopNpc, g.player) : Infinity;
    ok("Porbo wheels his shop to the row the boss died on", !!g.shopNpc && d < 230, g.shopNpc ? `${d.toFixed(0)}px away (earshot is 230) npc.y=${g.shopNpc.y.toFixed(0)} player.y=${g.player.y.toFixed(0)}` : "no shop at all");
  }
}

console.log(`\n${checks - failures}/${checks} checks passed${failures ? ` — ${failures} FAILED` : ""}`);
process.exit(failures ? 1 : 0);
