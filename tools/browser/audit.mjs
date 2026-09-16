// Visual audit: capture special states and UI overlaps for human review.
import { chromium } from "playwright-core";
import fs from "fs";
const SHOTS = "tools/browser/shots/audit/";
fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const pg = await b.newPage({ viewport: { width: 1100, height: 660 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 200)));
pg.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 160)); });
await pg.goto("http://localhost:4173/#debug/", { waitUntil: "load" });
await pg.waitForTimeout(1600);

// 1. menu cast/armory tabs
await pg.evaluate(() => { const t = [...document.querySelectorAll(".slot-tabs button")].find(x => /CAST/.test(x.textContent)); t?.click(); });
await pg.waitForTimeout(400);
await pg.screenshot({ path: SHOTS + "m1-cast.png" });
await pg.evaluate(() => { const t = [...document.querySelectorAll(".slot-tabs button")].find(x => /ARMORY/.test(x.textContent)); t?.click(); });
await pg.waitForTimeout(400);
await pg.screenshot({ path: SHOTS + "m2-armory.png" });
await pg.evaluate(() => { const t = [...document.querySelectorAll(".slot-tabs button")].find(x => /CHARMS/.test(x.textContent)); t?.click(); });
await pg.waitForTimeout(400);
await pg.screenshot({ path: SHOTS + "m3-charms.png" });
await pg.evaluate(() => { const t = [...document.querySelectorAll(".slot-tabs button")].find(x => /BESTIARY/.test(x.textContent)); t?.click(); });
await pg.waitForTimeout(400);
await pg.screenshot({ path: SHOTS + "m4-bestiary.png" });

// start a run
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 });
await pg.waitForTimeout(1500);
const clear = async () => { for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true }).catch(() => {}); await pg.waitForTimeout(130); } };
await clear();

// 2. boon card picker
await pg.evaluate(() => { const g = window.__rr_game(); g.upgradeReady = true; g.nextUpgrade = 1e9; });
await pg.waitForTimeout(600);
await pg.screenshot({ path: SHOTS + "s1-boons.png" });
await clear();

// 3. shop
await pg.evaluate(() => { const g = window.__rr_game(); g.player.coins = 500; g.shopOpen = true; });
await pg.waitForTimeout(400);
await pg.evaluate(() => { const btn = document.querySelector(".shop-hud-btn"); btn?.click(); });
await pg.waitForTimeout(600);
await pg.screenshot({ path: SHOTS + "s2-shop.png" });
await pg.evaluate(() => { const b2 = [...document.querySelectorAll(".shop-panel button")].find(x => /BACK/.test(x.textContent)); b2?.click(); });
await pg.waitForTimeout(300);

// 4. boss fight
await pg.evaluate(() => { const g = window.__rr_game(); g.bossTimer = .05; g.player.invuln = 9e9; });
await pg.waitForTimeout(1300);
await pg.screenshot({ path: SHOTS + "s3-boss-intro.png" });
await pg.waitForTimeout(2600);
await pg.screenshot({ path: SHOTS + "s4-boss.png" });

// 5. super finale
await pg.evaluate(() => { const g = window.__rr_game(); g.player.cards = 5; });
await pg.keyboard.press("KeyQ");
await pg.waitForTimeout(900);
await pg.screenshot({ path: SHOTS + "s5-super.png" });
await pg.waitForTimeout(2500);

// 6. game over letter
await pg.evaluate(() => { const g = window.__rr_game(); g.player.invuln = 0; g.player.health = -1; });
await pg.waitForTimeout(1100);
await pg.screenshot({ path: SHOTS + "s6-gameover.png" });

// 7. restart with each art style quickly
await pg.evaluate(() => { const b3 = [...document.querySelectorAll(".pause-panel button")].find(x => /AGAIN|RETRY/i.test(x.textContent)); b3?.click(); });
await pg.waitForTimeout(1500);
await clear();
for (const st of ["toon", "noir", "riso", "pixel"]) {
  await pg.evaluate((id) => { const q = JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}"); q.style = id; localStorage.setItem("rubberRequiemQuality", JSON.stringify(q)); document.querySelector(".hud-right .round-btn")?.click(); }, st);
  await pg.waitForTimeout(300);
  await pg.evaluate((id) => { document.querySelector(`.pause-panel .style-btn[data-style="${id}"]`)?.click(); }, st);
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { const bb = [...document.querySelectorAll(".pause-panel button")].find(x => /KEEP SWINGING/.test(x.textContent)); bb?.click(); });
  await pg.waitForTimeout(1500); await clear();
  await pg.screenshot({ path: SHOTS + `s7-style-${st}.png` });
}
console.log("errors:", errs.length ? errs.slice(0, 8).join(" | ") : "none");
await b.close();
