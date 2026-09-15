/**
 * Visual + interaction probe for the new options screen, weapon quirks and gamepad wiring.
 * Not part of npm test. Needs `npm run build && npm run preview` on :4173.
 */
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
import { writeFileSync } from "fs";

const browser = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1000, height: 620 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/soundimage|jsdelivr|net::ERR|Failed to load resource|AudioContext/i.test(m.text())) errors.push("console: " + m.text()); });

const shot = async (name) => { await page.screenshot({ path: `${SHOTS}${name}.png` }); };
const out = [];
const check = (name, pass, info = "") => { out.push(`${pass ? "PASS" : "FAIL"}  ${name}${info ? "  — " + info : ""}`); };

await page.goto("http://localhost:4173/#debug/", { waitUntil: "load" });
await page.waitForTimeout(2500);
check("booted", await page.evaluate(() => window.__rr_booted === true));

// ---- menu: options live in the HOW TO PLAY tab ----
await page.getByRole("button", { name: "HOW TO PLAY" }).click();
await page.waitForTimeout(400);
const opts = await page.evaluate(() => ({
  sliders: document.querySelectorAll(".slider-row input[type=range]").length,
  toggles: document.querySelectorAll(".toggle input[type=checkbox]").length,
  padRow: !!document.querySelector(".pad-row"),
  graded: [...document.querySelectorAll(".look-row")].length,
}));
check("options screen wired", opts.sliders === 4 && opts.toggles >= 6 && opts.padRow, JSON.stringify(opts));
await shot("01-menu-options");

// toggle contrast + drop shake to 0 and make sure the choice persists to storage
await page.locator(".toggle", { hasText: "High-contrast" }).click();
await page.waitForTimeout(200);
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}"));
check("quality persisted", stored.contrast === true, JSON.stringify(stored));

// ---- start a run, drive it, look for NaN / crash ----
const dismissUpgrades = async () => {
  for (let i = 0; i < 6; i++) {
    const b = await page.$(".upgrade-list button");
    if (!b) return;
    await b.click();
    await page.waitForTimeout(250);
  }
};
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /^PLAY / }).first().click();   // not the HOW TO PLAY tab
await page.waitForTimeout(2200);
await dismissUpgrades();
await page.keyboard.down("KeyD");
await page.waitForTimeout(900);
await page.keyboard.press("Space");
await page.keyboard.down("KeyF");
await page.waitForTimeout(5200);
await page.keyboard.up("KeyD");
await page.keyboard.press("ShiftLeft");
await dismissUpgrades();
await page.waitForTimeout(1500);
await shot("02-gameplay");
const live = await page.evaluate(() => {
  const g = window.__rr_game?.();
  if (!g) return null;
  const bad = [...g.enemies, g.player].some((e) => !Number.isFinite(e.x) || !Number.isFinite(e.y));
  return { over: g.over, score: g.score, kills: g.kills, enemies: g.enemies.length, bullets: g.bullets.length, cards: g.player.cards, bad, puddles: g.puddles.length };
});
check("run is alive and finite", !!live && !live.bad && live.kills > 0, JSON.stringify(live));

// ---- pause panel: build summary + options ----
const pre = await page.evaluate(() => ({ up: !!document.querySelector(".upgrade-list"), over: /TAKEN OUT BY|GAME OVER|RUN OVER/.test(document.body.innerText), txt: document.body.innerText.replace(/\s+/g, " ").slice(0, 90) }));
console.log("BEFORE ESC", JSON.stringify(pre));
if (pre.up) { for (let i = 0; i < 6; i++) { const el = await page.$(".upgrade-list button"); if (!el) break; await el.click(); await page.waitForTimeout(120); } }
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
const paused = await page.evaluate(() => ({
  build: document.querySelector(".build-row b")?.textContent || "",
  boons: document.querySelector(".build-row span")?.textContent || "",
  sliders: document.querySelectorAll(".slider-row").length,
  pad: document.querySelector(".pad-row b")?.textContent?.slice(0, 12) || "",
}));
check("pause shows your act + options", /Popper|Choir|Quill|Cannon|Notes|Pie|Kettle|Fountain/i.test(paused.build) && paused.sliders === 4 && /NOT DETECTED|CONNECTED/.test(paused.pad), JSON.stringify(paused));
await shot("03-pause-options");
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

// ---- swap / EX / super must survive the new hit rules ----
for (const k of ["Tab", "KeyE", "KeyQ", "KeyR"]) { await page.keyboard.press(k); await page.waitForTimeout(450); await dismissUpgrades(); }
await page.waitForTimeout(2000);
const after = await page.evaluate(() => {
  const g = window.__rr_game?.();
  return g ? { score: g.score, weapons: g.weapons, upgrades: Object.keys(g.upgrades).length, pit: g.slotPity } : null;
});
check("still running after stunts", !!after && after.weapons.length === 2, JSON.stringify(after));

// ---- stand in a creep until the run ends, then read the death letter ----
for (let i = 0; i < 60; i++) {
  const dead = await page.evaluate(() => {
    const g = window.__rr_game?.(); if (!g) return true;
    g.player.health = 1; g.player.invuln = 0; g.player.dashCd = 0; g.player.star = 0; g.player.superTime = 0;
    const e = g.enemies.find((x) => x.hp > 0);
    if (e) { g.player.x = e.x; g.player.y = e.y; }
    return !!g.over;
  });
  if (dead) break;
  await page.waitForTimeout(250);
}
await page.waitForTimeout(900);
await dismissUpgrades();
await page.waitForTimeout(500);
const over = await page.evaluate(() => ({
  gameover: !!document.querySelector(".pause-panel.gameover"),
  taken: document.querySelector(".taken b")?.textContent || "",
  best: document.querySelector(".final-score span")?.textContent || "",
}));
check("death letter names the culprit", over.gameover && over.taken.length > 1, JSON.stringify(over));
check("mode best is on the letter", /BEST .*BEST/.test(over.best), over.best);
await shot("04-gameover");

check("no page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
console.log(out.join("\n"));
await browser.close();
const failed = out.filter((l) => l.startsWith("FAIL")).length;
console.log(failed ? `${failed} PROBE CHECKS FAILED` : "ALL PROBE CHECKS PASSED");
process.exit(failed ? 1 : 0);
