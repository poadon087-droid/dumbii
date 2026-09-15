// Fuzz + invariant harness for Rubber Requiem. Hammers the running game with random
// keyboard/mouse/touch/gamepad input, hostile resizes, visibility flips and option churn,
// and asserts engine invariants every tick. Any pageerror/console error fails the run.
import { chromium } from "playwright-core";

const URL = process.env.RR_URL || "http://localhost:4173/#debug";
const SECONDS = +(process.env.RR_SECONDS || 25);
const errs = [], warns = [];
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 960, height: 600 } });

// a fake standard gamepad so the pad code path is exercised (axes + edges)
await ctx.addInitScript(() => {
  let ax = 0;
  const pad = {
    connected: true, mapping: "standard", id: "fuzzpad", index: 0, timestamp: 0,
    axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    vibrationActuator: { playEffect: () => Promise.resolve() },
  };
  window.__fuzzpad = { pad, setAxis(v) { ax = v; pad.axes[0] = v; pad.timestamp = performance.now(); },
    press(i) { pad.buttons[i] = { pressed: true, value: 1 }; pad.timestamp = performance.now(); },
    release(i) { pad.buttons[i] = { pressed: false, value: 0 }; pad.timestamp = performance.now(); } };
  navigator.getGamepads = () => [pad];
  const gp = {};
  window.addEventListener("gamepadconnected", () => {});
  void gp;
});

const pg = await ctx.newPage();
pg.on("pageerror", (e) => errs.push("pageerror: " + String(e).slice(0, 200)));
pg.on("console", (m) => {
  const t = m.type();
  if (t === "error") errs.push("console.error: " + m.text().slice(0, 200));
  else if (t === "warning") warns.push("console.warn: " + m.text().slice(0, 160));
});
await pg.goto(URL, { waitUntil: "load" });
await pg.waitForTimeout(1500);
await pg.getByRole("button", { name: /^PLAY / }).first().click();
await pg.waitForTimeout(1500);

const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS", "Space", "ShiftLeft", "KeyJ", "KeyK", "KeyL", "Tab", "KeyE", "KeyB", "Escape", "Enter", "KeyR", "Digit1", "Minus", "Equal"];
const rnd = (n) => Math.floor(Math.random() * n);
const stats = { maxPuffs: 0, maxParts: 0, maxBullets: 0, maxComics: 0, maxPickups: 0, maxEnemies: 0, maxTexts: 0, maxGhosts: 0, restarts: 0, badStates: [] };

const invariant = `(function () {
  const g = window.__rr_game(); if (!g) return "no game handle";
  const bad = [];
  const fin = (v) => typeof v === "number" && Number.isFinite(v);
  const p = g.player;
  for (const k of ["x","y","r","health","maxHealth","angle","speed","dashCd","cards","coins","charge","momentum","invuln"]) if (!fin(p[k])) bad.push("player." + k + "=" + p[k]);
  if (p.health > p.maxHealth + .001) bad.push("health>max " + p.health);
  if (p.health < -0.001) bad.push("health<0 " + p.health);
  for (const k of ["x","y"]) if (!fin(g.cam[k])) bad.push("cam." + k);
  for (const k of ["score","worldW","worldH","combo","elapsed","shake","flash","biome"]) if (!fin(g[k])) bad.push("g." + k + "=" + g[k]);
  if (g.score < 0) bad.push("score<0");
  if (g.combo < 0) bad.push("combo<0");
  for (const a of ["enemies","bullets","puffs","texts","pickups","puddles","ghosts","platforms","hazards","companions"]) {
    const arr = g[a]; if (!Array.isArray(arr)) { bad.push(a + " missing"); continue; }
    if (arr.length > 700) bad.push(a + " grew to " + arr.length);
    for (let i = 0; i < arr.length; i += 29) { const o = arr[i]; if (o && (fin(o.x) === false || fin(o.y) === false)) { bad.push(a + "[" + i + "] pos=" + o.x + "," + o.y); break; } }
  }
  const maxCamX = Math.max(0, g.worldW - (g.viewW || g.worldW)), maxCamY = Math.max(0, g.worldH - (g.viewH || g.worldH));
  if (g.cam.x < -5 || g.cam.x > maxCamX + 5) bad.push("cam.x " + Math.round(g.cam.x) + " outside 0.." + Math.round(maxCamX));
  if (g.cam.y < -5 || g.cam.y > maxCamY + 5) bad.push("cam.y " + Math.round(g.cam.y) + " outside 0.." + Math.round(maxCamY));
  if (p.x < 0 || p.x > g.worldW || p.y < 0 || p.y > g.worldH) bad.push("player off-world " + Math.round(p.x) + "," + Math.round(p.y));
  return bad.length ? bad.join("; ") : "";
})()`;

const t0 = Date.now();
let n = 0;
while ((Date.now() - t0) / 1000 < SECONDS) {
  n++;
  const act = rnd(14);
  try {
    if (act === 0) { const k = keys[rnd(keys.length)]; await pg.keyboard.down(k); await pg.waitForTimeout(30 + rnd(120)); await pg.keyboard.up(k); }
    else if (act === 1) { await pg.mouse.move(rnd(1200), rnd(700)); await pg.mouse.down(); await pg.waitForTimeout(20 + rnd(80)); await pg.mouse.up(); }
    else if (act === 2) { await pg.locator("body").tap(60 + rnd(1100), 120 + rnd(560)); }
    else if (act === 3) { await pg.evaluate(([v]) => window.__fuzzpad.setAxis(v), [Math.random() * 2 - 1]); await pg.evaluate((i) => window.__fuzzpad.press(i), rnd(10)); await pg.waitForTimeout(50); await pg.evaluate((i) => window.__fuzzpad.release(i), rnd(10)); }
    else if (act === 4) { await pg.setViewportSize({ width: 360 + rnd(900), height: 380 + rnd(500) }); }
    else if (act === 5) { await pg.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); }); await pg.waitForTimeout(120); await pg.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")); }); }
    else if (act === 6) { await pg.evaluate(() => window.dispatchEvent(new Event("blur"))); await pg.waitForTimeout(60); }
    else if (act === 7) { const el = await pg.$(".hud-right button"); if (el) await el.click({ timeout: 600 }).catch(() => {}); }
    else if (act === 8) { await pg.keyboard.press("Escape"); await pg.waitForTimeout(80); const r = await pg.$(".pause-panel button"); if (r) await r.click({ timeout: 600 }).catch(() => {}); }
    else if (act === 9) { const u = await pg.$(".upgrade-list button"); if (u) await u.click({ timeout: 600 }).catch(() => {}); }
    else if (act === 10) { const el = await pg.$(".shop-panel button, .letter button"); if (el) await el.click({ timeout: 600 }).catch(() => {}); }
    else if (act === 11) { await pg.evaluate(() => { const g = window.__rr_game(); if (g && g.player.health > 4) g.player.health = 3; }); }
    else if (act === 12) { await pg.evaluate(() => { const g = window.__rr_game(); if (g) { g.player.x = 26; g.player.y = 200; } }); }
    else if (act === 13) { const el = await pg.$(".hud-right .round-btn"); if (el) await el.click({ timeout: 600 }).catch(() => {}); }
  } catch (e) { warns.push("input err: " + String(e).slice(0, 90)); }
  if (n % 3 === 0) {
    const s = await pg.evaluate(() => { const g = window.__rr_game(); if (!g) return null;
      return { puffs: g.puffs.length, parts: 0, bullets: g.bullets.length, comics: 0, pickups: g.pickups.length, enemies: g.enemies.length, texts: g.texts.length, ghosts: g.ghosts.length }; });
    if (s) { stats.maxPuffs = Math.max(stats.maxPuffs, s.puffs); stats.maxParts = Math.max(stats.maxParts, s.parts); stats.maxBullets = Math.max(stats.maxBullets, s.bullets); stats.maxComics = Math.max(stats.maxComics, s.comics); stats.maxPickups = Math.max(stats.maxPickups, s.pickups); stats.maxEnemies = Math.max(stats.maxEnemies, s.enemies); stats.maxTexts = Math.max(stats.maxTexts, s.texts); stats.maxGhosts = Math.max(stats.maxGhosts, s.ghosts); }
  }
  const bad = await pg.evaluate(invariant);
  if (bad) stats.badStates.push(`@${n}: ${bad}`);
}

// gamepad movement must actually move the runner (the frame loop overwrites inp.mx from keys)
const pb = await pg.$(".pause-panel .play-btn, .pause-panel button"); // resume if the fuzz paused us
if (pb) await pb.evaluate((el) => { const r = [...document.querySelectorAll(".pause-panel button")].find((x) => /KEEP SWINGING|RESUME/i.test(x.textContent)); (r || el).click(); });
await pg.waitForTimeout(200);
const phaseNow = await pg.evaluate(() => !!document.querySelector(".pause-panel"));
const padTest = await pg.evaluate(async () => {
  const g = window.__rr_game(); if (!g) return "no game";
  const before = Math.round(g.player.x);
  window.__fuzzpad.setAxis(1);
  await new Promise((r) => setTimeout(r, 450));
  window.__fuzzpad.setAxis(0);
  return { before, after: Math.round(g.player.x), moved: Math.round(g.player.x) - before };
});
console.log("iterations:", n, "viewport now:", JSON.stringify(pg.viewportSize()));
console.log("pool maxima:", JSON.stringify({ puffs: stats.maxPuffs, parts: stats.maxParts, bullets: stats.maxBullets, comics: stats.maxComics, pickups: stats.maxPickups, enemies: stats.maxEnemies, texts: stats.maxTexts, ghosts: stats.maxGhosts }));
console.log("invariant breaches:", stats.badStates.length ? stats.badStates.slice(0, 8).join("\n  ") : "none");
console.log("playing before pad test:", !phaseNow); console.log("gamepad stick moved runner:", JSON.stringify(padTest));
console.log("errors:", errs.length ? errs.slice(0, 6).join("\n  ") : "none");
console.log("console noise:", warns.length ? [...new Set(warns)].slice(0, 10).join("\n  ") : "none");
await b.close();
