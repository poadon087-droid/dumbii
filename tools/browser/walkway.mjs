import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const pg = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
const errs = []; pg.on("pageerror", e => errs.push(String(e).slice(0, 160)));
await pg.goto("http://localhost:4173/#debug/", { waitUntil: "load" }); await pg.waitForTimeout(1800);
await pg.getByRole("button", { name: /^PLAY / }).first().click(); await pg.waitForTimeout(2000);
const clear = async () => { for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) return; await el.click(); await pg.waitForTimeout(140); } };
await clear();
const box = await pg.locator("canvas").first().boundingBox();

// 1) park the view exactly on a district seam so the gate + dissolve land mid-screen
await pg.evaluate(() => {
  const g = window.__rr_game(); const DW = g.worldW / g.districts;
  g.player.x = Math.round(DW * 4); g.player.y = Math.round(g.viewH * .62);
  g.cam.x = Math.max(0, Math.min(g.worldW - g.viewW, g.player.x - g.viewW / 2));
  g.enemies = []; g.hazards = []; g.puffs = []; g.texts = []; g.bullets = []; g.pickups = []; g.puddles = []; g.ghosts = [];
});
await pg.waitForTimeout(500); await clear();
await pg.screenshot({ path: `${SHOTS}50-seam.png`, clip: { x: box.x, y: box.y, width: box.width, height: box.height } });

// 2) stride frames: idle, running x3, jumping, dashing — feet must stay on the ground line
const shoot = async (name) => {
  const p = await pg.evaluate(() => { const g = window.__rr_game(); return { x: g.player.x, y: g.player.y, cam: g.cam.x, phase: +(g.player.runPhase ?? 0).toFixed(2) }; });
  await pg.screenshot({ path: `${SHOTS}${name}.png`, clip: { x: box.x + p.x - p.cam - 160, y: box.y + p.y - 165, width: 320, height: 240 } });
  return p;
};
await pg.evaluate(() => { const g = window.__rr_game(); g.districts = 1; g.worldW = g.viewW; g.cam.x = 0; g.player.x = 640; g.enemies = []; });
await pg.waitForTimeout(400); await clear();
const frames = [];
frames.push(["60-idle", await shoot("60-idle")]);
await pg.keyboard.down("KeyD");
for (const n of ["61-run", "62-run", "63-run"]) { await pg.waitForTimeout(120); frames.push([n, await shoot(n)]); }
await pg.keyboard.up("KeyD");
await pg.keyboard.press("Space"); await pg.waitForTimeout(120); frames.push(["64-jump", await shoot("64-jump")]);
await pg.keyboard.down("KeyD"); await pg.keyboard.press("ShiftLeft"); await pg.waitForTimeout(90);
frames.push(["65-dash", await shoot("65-dash")]);
await pg.keyboard.up("KeyD");
// 3) one honest playthrough frame in the middle of the world with creeps on screen
await pg.evaluate(() => { const g = window.__rr_game(); g.districts = g.__d || g.districts; });
await pg.reload({ waitUntil: "load" }); await pg.waitForTimeout(1500);
await pg.getByRole("button", { name: /^PLAY / }).first().click(); await pg.waitForTimeout(2500); await clear();
await pg.evaluate(() => { const g = window.__rr_game(); const DW = g.worldW / g.districts; g.player.x = Math.round(DW * 6 + DW * .5); });
await pg.waitForTimeout(2600); await clear();
await pg.keyboard.down("KeyD"); await pg.waitForTimeout(700); await pg.keyboard.up("KeyD");
const cb = await pg.locator("canvas").first().boundingBox();
await pg.screenshot({ path: `${SHOTS}66-play.png`, clip: { x: cb.x, y: cb.y, width: cb.width, height: cb.height } });
const st = await pg.evaluate(() => { const g = window.__rr_game(); return { biome: g.biome, cam: +g.cam.x.toFixed(1), world: g.worldW, enemies: g.enemies.length, ok: [g.player.x, g.player.y, g.cam.x].every(Number.isFinite) }; });
console.log("stride frames:", JSON.stringify(frames.map(([n, p]) => `${n}@y${p.y.toFixed(0)}/ph${p.phase}`)));
console.log("state:", JSON.stringify(st), "errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
