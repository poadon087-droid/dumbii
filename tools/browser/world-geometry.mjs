import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
// swiftshader chokes on big DPR-2 viewports (clicks never become actionable): keep it modest
const pg = await b.newPage({ viewport: { width: 1100, height: 680 } });
const errs = []; pg.on("pageerror", e => errs.push(String(e).slice(0, 160)));
await pg.goto("http://localhost:4173/#debug/", { waitUntil: "load" }); await pg.waitForTimeout(1700);
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 }); await pg.waitForTimeout(2200);
const clear = async () => { for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true, timeout: 4000 }).catch(() => {}); await pg.waitForTimeout(130); } };
await clear();
const geo = await pg.evaluate(() => { const g = window.__rr_game(); return { w: g.worldW, h: g.worldH, cols: g.districts, rows: g.rows, tile: [g.tCol, g.tRow] }; });
console.log("map:", JSON.stringify(geo));

// park the view on a ROW seam (between the top and middle rows) and shoot the walkway
await pg.evaluate(() => {
  const g = window.__rr_game(); const DH = g.worldH / g.rows;
  g.player.x = Math.round(g.worldW / g.districts * 3 + 500); g.player.y = Math.round(DH);
  g.cam.y = Math.max(0, Math.min(g.worldH - g.viewH, g.player.y - g.viewH / 2));
  g.enemies = []; g.hazards = []; g.puffs = []; g.texts = []; g.bullets = []; g.pickups = []; g.puddles = [];
});
await pg.waitForTimeout(420); await clear();
const box = await pg.locator("canvas").first().boundingBox();
await pg.screenshot({ path: `${SHOTS}80-rowseam.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height }, timeout: 120000 });

// walk down a row with the keyboard and see the act commit
const before = await pg.evaluate(() => { const g = window.__rr_game(); return { r: g.tRow, y: Math.round(g.player.y), biome: g.biome }; });
await pg.keyboard.down("KeyS"); await pg.waitForTimeout(2600); await pg.keyboard.up("KeyS");
const after = await pg.evaluate(() => { const g = window.__rr_game(); return { r: g.tRow, y: Math.round(g.player.y), biome: g.biome, cam: Math.round(g.cam.y), finite: [g.player.x, g.player.y, g.cam.x, g.cam.y].every(Number.isFinite) }; });
console.log("walked down:", JSON.stringify({ before, after }));

// threat chevron: one creep parked well off-screen should draw the bezel pointer without error
await pg.evaluate(() => { const g = window.__rr_game(); g.enemies.length = 0; g.enemies.push({ ...g.enemies[0] } && { id: 999, kind: "gloop", x: g.player.x + 2600, y: g.player.y + 300, hp: 400, maxHp: 400, r: 22, speed: 0, vx: 0, vy: 0, cooldown: 99, stun: 0, hidden: false, hitIds: [], phase: 0, t: 0, dead: false, angle: 0, facing: 1, state: "idle", stateT: 0, elite: false, affix: undefined, shield: 0, hpRegen: 0, anchor: null, blast: 0, tele: 0, laser: 0, buffed: 0, charge: 0, target: null, size: 1, damage: 8, score: 30, spin: 0, arm: 0, life: 0, max: 0, hit: false, note: 0, beatIdx: 0, seed: 1, wob: 0, hop: 0, blink: 0, flash: 0, held: 0, stolen: [], sweeps: 0, bucket: 0, pushT: 0, line: 0, reel: 0, pet: false, petOf: -1, owner: -1, boss: false, bossPhase: 0, bossName: "", quote: "", special: 0, tint: 0, stunT: 0, angry: 0, carry: null, stage: 0, walk: 0, die: 0, ghost: 0, t2: 0, t3: 0, t4: 0, n1: 0, n2: 0 } ); });
await pg.waitForTimeout(500);
await pg.screenshot({ path: `${SHOTS}81-chevron.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height }, timeout: 120000 });
const hud = await pg.evaluate(() => ({ cells: document.querySelectorAll(".worldmap .wm-grid i").length, on: document.querySelectorAll(".worldmap .wm-grid i.on").length, cap: document.querySelector(".worldmap small")?.textContent || "" }));
console.log("hud map:", JSON.stringify(hud));
// the map size switch, live
await pg.keyboard.press("Escape"); await pg.waitForTimeout(350);
await pg.getByRole("button", { name: /ONE SCREEN/i }).first().click({ force: true, timeout: 20000 }); await pg.waitForTimeout(400);
await pg.keyboard.press("Escape"); await pg.waitForTimeout(700);
const flat = await pg.evaluate(() => { const g = window.__rr_game(); return { w: g.worldW, h: g.worldH, rows: g.rows, cells: document.querySelectorAll(".worldmap .wm-grid i").length }; });
console.log("after ONE SCREEN:", JSON.stringify(flat));
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
