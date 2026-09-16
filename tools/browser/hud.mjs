import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
const pg = await b.newPage({ viewport: { width: 1000, height: 620 }, deviceScaleFactor: 1 });
pg.on("pageerror", e => errs.push(String(e).slice(0, 160)));
await pg.goto("http://localhost:4173/#debug/", { waitUntil: "load" }); await pg.waitForTimeout(1700);
const menu = await pg.evaluate(() => document.querySelector(".best")?.textContent?.replace(/\s+/g, " ") ?? "");
await pg.screenshot({ path: `${SHOTS}90-menu.png`, clip: { x: 0, y: 0, width: 1000, height: 620 } });
await pg.getByRole("button", { name: /^PLAY / }).first().click(); await pg.waitForTimeout(2200);
const clear = async () => { for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click(); await pg.waitForTimeout(130); } };
await clear();
// low gumption: the HUD should warn
await pg.evaluate(() => { const g = window.__rr_game(); g.player.health = 12; });
await pg.waitForTimeout(400);
const danger = await pg.evaluate(() => ({ cls: document.querySelector(".hud")?.className || "", bar: !!document.querySelector(".hud.danger .health-bar") }));
await pg.screenshot({ path: `${SHOTS}91-danger.png`, clip: { x: 0, y: 0, width: 1000, height: 300 } });
// pause: options sections + the stage readout
await pg.keyboard.press("Escape"); await pg.waitForTimeout(600);
const paused = await pg.evaluate(() => ({ sects: [...document.querySelectorAll(".opt-sect")].map(e => e.textContent), place: document.querySelector(".act-place")?.textContent || "", mapBtns: document.querySelectorAll(".pause-panel .map-row button").length, sizeBtns: [...document.querySelectorAll(".look-row button")].filter(x => /WHOLE SHOW|STRIP|ONE SCREEN|ALLEY/.test(x.textContent)).map(x => x.textContent.split("·")[0].trim()) }));
await pg.screenshot({ path: `${SHOTS}92-pause.png`, clip: { x: 0, y: 0, width: 1000, height: 620 } });
// switch the map live to THE STRIP and back
await pg.getByRole("button", { name: /THE STRIP/i }).first().click(); await pg.waitForTimeout(500);
const strip = await pg.evaluate(() => { const g = window.__rr_game(); return { cols: g.districts, rows: g.rows, w: g.worldW, h: g.worldH, widget: document.querySelectorAll(".worldmap, .wm-grid").length }; });
await pg.getByRole("button", { name: /THE WHOLE SHOW/i }).first().click(); await pg.waitForTimeout(400);
const show = await pg.evaluate(() => { const g = window.__rr_game(); return { cols: g.districts, rows: g.rows, h: g.worldH }; });
await pg.keyboard.press("Escape"); await pg.waitForTimeout(700); await clear();
// death letter
await pg.evaluate(() => { const g = window.__rr_game(); g.player.health = 0; g.player.invuln = 0; g.enemies.forEach(e => { e.hp = e.maxHp; }); g.player.health = -1; });
await pg.waitForTimeout(900);
const over = await pg.evaluate(() => ({ fell: document.querySelector(".pause-panel .fell")?.textContent || "", taken: document.querySelector(".taken")?.textContent || "", over: !!document.querySelector(".pause-panel.gameover") }));
await pg.screenshot({ path: `${SHOTS}93-letter.png`, clip: { x: 0, y: 0, width: 1000, height: 620 } });
// touch layout: aim stick + dash cooldown bar
const mp = await b.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
mp.on("pageerror", e => errs.push("mobile: " + String(e).slice(0, 140)));
await mp.goto("http://localhost:4173/#debug/", { waitUntil: "load" }); await mp.waitForTimeout(1600);
await mp.getByRole("button", { name: /^PLAY / }).first().click(); await mp.waitForTimeout(2000);
for (let i = 0; i < 8; i++) { const el = await mp.$(".upgrade-list button"); if (!el) break; await el.click(); await mp.waitForTimeout(120); }
const stick = await mp.locator(".aim-stick").boundingBox();
await mp.touchscreen.tap(stick.x + stick.width / 2, stick.y + 6);
await mp.waitForTimeout(300);
const dash = await mp.evaluate(() => { const g = window.__rr_game(); g.player.dashCd = .6; return { act: document.querySelectorAll(".mobile-controls .act").length, aim: !!document.querySelector(".aim-stick"), widget: document.querySelectorAll(".worldmap, .wm-grid").length }; });
await mp.screenshot({ path: `${SHOTS}94-mobile.png`, clip: { x: 0, y: 0, width: 420, height: 860 } });
console.log("menu:", menu);
console.log("danger:", JSON.stringify(danger));
console.log("paused:", JSON.stringify(paused));
console.log("strip->show:", JSON.stringify({ strip, show }));
console.log("letter:", JSON.stringify(over));
console.log("mobile:", JSON.stringify(dash), "errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
