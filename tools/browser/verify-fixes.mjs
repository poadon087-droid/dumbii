import { chromium } from "playwright-core";
import fs from "fs";
const SHOTS = "tools/browser/shots/fixes/";
fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });

// 1. menu: tabs + typo bar
const pg = await b.newPage({ viewport: { width: 1000, height: 600 } });
await pg.goto("http://localhost:4173/#debug/", { waitUntil: "load" });
await pg.waitForTimeout(1600);
const typo = await pg.evaluate(() => document.querySelector(".best")?.textContent || "");
await pg.screenshot({ path: SHOTS + "1-menu.png" });

// 2. how-to: dash row
await pg.evaluate(() => { [...document.querySelectorAll(".tabs button")].find(x => /HOW/.test(x.textContent))?.click(); });
await pg.waitForTimeout(400);
const dash = await pg.evaluate(() => [...document.querySelectorAll(".how > div")].map(d => d.textContent).find(t => /invincibility/.test(t)) || "");
await pg.screenshot({ path: SHOTS + "2-howto.png" });

// 3. pause options: map buttons
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 });
await pg.waitForTimeout(1500);
for (let i = 0; i < 6; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true }).catch(() => {}); await pg.waitForTimeout(120); }
await pg.keyboard.press("Escape"); await pg.waitForTimeout(600);
await pg.evaluate(() => { document.querySelector(".pause-panel").scrollTop = 260; });
await pg.waitForTimeout(200);
await pg.screenshot({ path: SHOTS + "3-pause-map.png", clip: { x: 240, y: 40, width: 620, height: 560 } });
const mapBtn = await pg.evaluate(() => { const el = [...document.querySelectorAll(".pause-panel .map-row button")].find(x => x.classList.contains("on")); return el ? { t: el.textContent, clip: el.scrollWidth - el.clientWidth } : null; });
await pg.keyboard.press("Escape"); await pg.waitForTimeout(400);

// 4. wayfinder: park a creep far right & down, small screen
await pg.evaluate(() => { const g = window.__rr_game(); g.enemies.length = 0; g.enemies.push({ id: 999, kind: "gloop", x: g.player.x + 3000, y: g.player.y + 500, hp: 400, maxHp: 400, r: 22, speed: 0, vx: 0, vy: 0, cooldown: 99, stun: 0, hidden: false, hitIds: [], phase: 0, t: 0, dead: false, angle: 0, facing: 1, state: "idle", stateT: 0, elite: false, shield: 0, hpRegen: 0, anchor: null, blast: 0, tele: 0, laser: 0, buffed: 0, charge: 0, target: null, size: 1, damage: 8, score: 30, spin: 0, arm: 0, life: 0, max: 0, hit: false, note: 0, beatIdx: 0, seed: 1, wob: 0, hop: 0, blink: 0, flash: 0, held: 0, stolen: [], sweeps: 0, bucket: 0, pushT: 0, line: 0, reel: 0, pet: false, petOf: -1, owner: -1, boss: false, bossPhase: 0, bossName: "", quote: "", special: 0, tint: 0, stunT: 0, angry: 0, carry: null, stage: 0, walk: 0, die: 0, ghost: 0, t2: 0, t3: 0, t4: 0, n1: 0, n2: 0, slow: 0, blind: 0, stuck: 0 }); g.player.invuln = 9e9; });
await pg.waitForTimeout(600);
await pg.screenshot({ path: SHOTS + "4-wayfinder.png", clip: { x: 560, y: 300, width: 440, height: 300 } });

// 5. gameover letter: button pinned?
await pg.evaluate(() => { const g = window.__rr_game(); g.player.invuln = 0; g.player.health = -1; g.enemies.forEach(e => { e.hp = e.maxHp; }); });
await pg.waitForTimeout(1100);
const btn = await pg.evaluate(() => {
  const p = document.querySelector(".pause-panel.gameover");
  const b = p?.querySelector(".play-btn");
  if (!b) return null;
  p.scrollTop = 0; // top of the letter
  const r = b.getBoundingClientRect(), pr = p.getBoundingClientRect();
  return { btnVisible: r.bottom <= pr.bottom + 2 && r.top >= pr.top - 2, y: Math.round(r.y), shellBottom: Math.round(pr.bottom) };
});
await pg.screenshot({ path: SHOTS + "5-gameover.png" });
console.log(JSON.stringify({ typo, dash: dash.slice(0, 60), mapBtn, btn }, null, 1));
await b.close();
