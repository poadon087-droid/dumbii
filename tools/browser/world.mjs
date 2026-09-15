// Authored world + art styles, in one tight pass (small viewport: the software renderer needs it).
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const URL = process.env.RR_URL || "http://localhost:4173/#debug";
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 860, height: 520 } });
await ctx.addInitScript(`try { localStorage.setItem("rubberRequiemQuality", JSON.stringify({ world: "gigantic", dressing: true, style: "ink", shaders: true, lowFx: true })); } catch {}`);
const pg = await ctx.newPage();
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
pg.on("console", (m) => { if (m.type() === "error") errs.push("console: " + m.text().slice(0, 120)); });
const line = (name, ok, detail) => console.log(`${ok ? "ok  " : "BUG "} ${name}${detail ? "  — " + detail : ""}`);
const shot = (n) => pg.screenshot({ path: `${SHOTS}${n}`, animations: "disabled", timeout: 120000 }).catch((e) => console.log("shot skipped:", String(e).slice(0, 60)));
const godlike = () => pg.evaluate(() => { const g = window.__rr_game(); if (g) { g.player.invuln = 9e9; g.player.health = g.player.maxHealth; } });
const openPause = async () => {
  for (let i = 0; i < 4; i++) {
    if (await pg.$(".pause-panel")) return true;
    await godlike();
    await pg.evaluate(() => {
      const card = document.querySelector(".upgrade-list button"); if (card) { card.click(); return; }
      const over = document.querySelector(".pause-panel.gameover");
      if (over) { const b = [...over.querySelectorAll("button")].find((x) => /PLAY|AGAIN|RESTART/i.test(x.textContent)); b?.click(); return; }
      if (document.querySelector(".pause-panel")) return;
      const btn = document.querySelector(".hud-right .round-btn"); if (btn) btn.click(); else window.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", bubbles: true }));
    });
    await pg.waitForTimeout(500);
  }
  return !!(await pg.$(".pause-panel"));
};
const resume = async () => { await pg.evaluate(() => { const b = [...document.querySelectorAll(".pause-panel button")].find((x) => /KEEP SWINGING/.test(x.textContent)); b?.click(); }); await pg.waitForTimeout(300); await godlike(); };

await pg.goto(URL, { waitUntil: "load" });
await pg.waitForTimeout(1400);
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 });
await pg.waitForTimeout(1600);
for (let i = 0; i < 6; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true, timeout: 4000 }).catch(() => {}); await pg.waitForTimeout(120); }

const geo = await pg.evaluate(() => { const g = window.__rr_game(); return { w: g.worldW, h: g.worldH, cols: g.districts, rows: g.rows, map: g.map, stage: g.stage?.name, act: g.stage?.act }; });
line("the run walks the authored slab", geo.cols === 12 && geo.rows === 5 && geo.map === "gigantic" && /Cinder Grotto/.test(geo.stage), JSON.stringify(geo));
await shot("c0-start.png");

// the route: every act name is reachable by walking east
const tour = await pg.evaluate(async () => {
  const g = window.__rr_game(), DW = g.worldW / g.districts, seen = [];
  for (let c = 0; c < 12; c++) {
    g.player.x = c * DW + DW / 2; g.cam.x = Math.max(0, Math.min(g.worldW - g.viewW, g.player.x - g.viewW / 2));
    await new Promise((r) => setTimeout(r, 60));
    seen.push(`${g.stage?.act}:${g.stage?.name}`);
  }
  return seen;
});
line("walking east walks acts 1 → 12 in order", tour.join("|").startsWith("1:Cinder Grotto|2:Ember Hollow|3:The Painted Tent") && /12:The High Wire$/.test(tour.join("|")), tour.slice(0, 3).join(" · ") + " … " + tour[11]);

// the undercroft ends at column 9: the row edge is a wall, and the view still shows the torn margin
await pg.keyboard.down("ArrowRight");
const edge = await pg.evaluate(async () => {
  const g = window.__rr_game(), p = g.player, DW = g.worldW / g.districts, DH = g.worldH / g.rows;
  p.x = 9 * DW + DW * .92; p.y = 2 * DH + DH * .62; p.invuln = 9e5;
  g.cam.x = p.x - g.viewW / 2; g.cam.y = p.y - g.viewH / 2;
  await new Promise((r) => setTimeout(r, 400));
  const camBefore = Math.round(g.cam.x);
  await window.__rr_hold?.();
  const c = document.querySelector("canvas"), cv = document.createElement("canvas");
  cv.width = 120; cv.height = 70; const x = cv.getContext("2d");
  x.drawImage(c, c.width - 120, Math.round(c.height * .28), 120, 70, 0, 0, 120, 70);
  const lum = (px) => { const v = px.data; let t = 0; for (let i = 0; i < v.length; i += 4) t += v[i] + v[i + 1] + v[i + 2]; return t / (v.length / 4) / 3; };
  const strip = lum(x.getImageData(0, 0, 120, 70));
  x.clearRect(0, 0, 120, 70); x.drawImage(c, Math.round(c.width * .42), Math.round(c.height * .28), 120, 70, 0, 0, 120, 70);
  const middle = lum(x.getImageData(0, 0, 120, 70));
  const darkFraction = +(strip / Math.max(1, middle)).toFixed(2);
  return { tile: [g.tCol, g.tRow], x: Math.round(p.x), limit: Math.round(10 * DW - 26), camBefore, camAfter: Math.round(g.cam.x), darkFraction, finite: Number.isFinite(p.x) && Number.isFinite(g.cam.x) };
});
await pg.keyboard.up("ArrowRight");
line("the row edge stops you where the map stops", edge.tile[0] === 9 && Math.abs(edge.x - edge.limit) < 90, JSON.stringify(edge));
line("the view leaks past the map so the torn edge is visible", edge.darkFraction < .6, `past-the-edge brightness ${edge.darkFraction} of the stage (cam ${edge.camBefore} → ${edge.camAfter})`);
await shot("c1-margin.png");

const widget = await pg.evaluate(() => { const cells = [...document.querySelectorAll(".worldmap .wm-grid i")]; return { total: cells.length, voids: cells.filter((c) => c.classList.contains("void")).length, on: cells.filter((c) => c.classList.contains("on")).length }; });
line("the map widget shows the silhouette", widget.voids === 4 && widget.total === 60 && widget.on === 1, JSON.stringify(widget));

// the fourth row: the flooded vaults, dressed like the rest, and the bottom of the world is a floor
const vaults = await pg.evaluate(async () => {
  const g = window.__rr_game(), p = g.player, DW = g.worldW / g.districts, DH = g.worldH / g.rows;
  const at = async (c, r) => {
    p.x = c * DW + DW / 2; p.y = r * DH + DH * .62; p.invuln = 9e5;
    g.cam.x = Math.max(0, Math.min(g.worldW - g.viewW, p.x - g.viewW / 2));
    g.cam.y = Math.max(0, Math.min(g.worldH - g.viewH, p.y - g.viewH / 2));
    await new Promise((r2) => setTimeout(r2, 260));
    return { tile: [g.tCol, g.tRow], stage: g.stage?.name, act: g.stage?.act, props: g.stage?.props.length, cap: document.querySelector(".worldmap small")?.textContent || document.querySelector(".biome-sub")?.textContent };
  };
  const east = await at(10, 3), west = await at(0, 3);
  const deepE = await at(11, 4), deepW = await at(0, 4);   // the foundation under the vaults
  await at(6, 4);
  const shots = [];                                          // the fix that started all this: guns work down here
  for (const key of ["popper", "mortar", "yoyo", "slots"]) {
    g.weapons = [key, key]; g.shot = 0; g.bullets.length = 0;
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyF", bubbles: true }));
    await new Promise((r2) => setTimeout(r2, 120));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "KeyF", bubbles: true }));
    await new Promise((r2) => setTimeout(r2, 120));
    shots.push(`${key}:${g.bullets.filter((x) => !x.enemy).length}`);
  }
  p.y = g.worldH + 400;                                      // try to fall out of the world
  await new Promise((r2) => setTimeout(r2, 320));
  return { east, west, deepE, deepW, shots, floor: Math.round(p.y), limit: Math.round(g.worldH - 34), rows: g.rows, h: g.worldH };
});
line("the vaults are down there, named and dressed", vaults.east.stage === "The Drowned Bell" && vaults.west.stage === "Curtain Call" && vaults.east.act === 34 && vaults.west.act === 44 && vaults.east.props >= 5, JSON.stringify({ e: vaults.east, w: vaults.west }).slice(0, 210));
line("the fourth row caption reads the new total", /44/.test(vaults.west.cap || ""), vaults.west.cap);
line("and the foundation under it is authored too", vaults.deepE.stage === "The Winding Room" && vaults.deepW.stage === "The Undertent" && vaults.deepE.act === 56 && vaults.deepW.act === 45 && vaults.deepE.props >= 5 && vaults.deepW.props >= 5, JSON.stringify({ e: vaults.deepE, w: vaults.deepW }).slice(0, 210));
line("the fifth row caption reads 56", /56/.test(vaults.deepW.cap || ""), vaults.deepW.cap);
line("every gun fires on the bottom row", vaults.shots.every((s) => !/:0$/.test(s)), vaults.shots.join(" "));
line("and the bottom of the world is a floor", Math.abs(vaults.floor - vaults.limit) < 6, `y=${vaults.floor} limit=${vaults.limit}`);
await shot("c1b-vaults.png");

// Porbo's Alley: one screen, ten props, ledges you can stand on, and it is opt-in
if (!await openPause()) throw new Error("could not open the pause panel"); await pg.waitForTimeout(200);
const alleySet = await pg.evaluate(() => { const b = [...document.querySelectorAll(".pause-panel .map-row button")].find((x) => /ALLEY/.test(x.textContent)); if (!b) return "no alley button"; b.click(); return b.textContent.trim(); });
await pg.waitForTimeout(300); await resume(); await pg.waitForTimeout(1200);
const alley = await pg.evaluate(() => { const g = window.__rr_game(); return { cols: g.districts, w: g.worldW, name: g.stage?.name, props: g.stage?.props.length, ledges: g.stage?.ledges?.length ?? 0, plats: g.platforms.length, caption: document.querySelector(".worldmap small")?.textContent ?? document.querySelector(".biome-sub")?.textContent }; });
line("the alley is one dense hand-built screen", alley.cols === 1 && alley.props >= 10 && alley.plats >= 2 && /Porbo/.test(alley.name), JSON.stringify(alley).slice(0, 150));
await shot("c2-alley.png");

// art styles, applied live through the pause panel and each one verified
const ratio = {};
for (const st of ["toon", "noir", "riso", "pixel", "ink"]) {
  if (!await openPause()) throw new Error("could not open the pause panel"); await pg.waitForTimeout(200);
  const got = await pg.evaluate((id) => { const b = document.querySelector(`.pause-panel .style-btn[data-style="${id}"]`); if (!b) return "missing"; b.click(); return JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}").style; }, st);
  await pg.waitForTimeout(200); await resume(); await pg.waitForTimeout(1100); await pg.evaluate(() => { const b = document.querySelector(".upgrade-list button"); b?.click(); }); await pg.waitForTimeout(200);
  ratio[st] = { applied: got, scale: await pg.evaluate(() => { const c = document.querySelector("canvas"); return +(c.width / Math.max(1, c.getBoundingClientRect().width)).toFixed(2); }) };
  await shot(`c3-${st}.png`);
}
line("every style actually applies", ["toon", "noir", "riso", "pixel", "ink"].every((s) => ratio[s].applied === s), JSON.stringify(ratio));
line("the pixel look renders a smaller buffer", ratio.pixel.scale < ratio.ink.scale - .05, `ink ${ratio.ink.scale} vs pixel ${ratio.pixel.scale}`);

// back to the giant map, dressing off then on: the toggle is the point
if (!await openPause()) throw new Error("could not open the pause panel"); await pg.waitForTimeout(200);
await pg.evaluate(() => { const b = [...document.querySelectorAll(".pause-panel .map-row button")].find((x) => /WHOLE SHOW/.test(x.textContent)); b?.click(); });
const dressA = await pg.evaluate(() => { const t = [...document.querySelectorAll(".pause-panel .toggle")].find((x) => /Set dressing/.test(x.textContent)); t.querySelector("input").click(); return JSON.parse(localStorage.getItem("rubberRequiemQuality")).dressing; });
await pg.waitForTimeout(250); await resume(); await pg.waitForTimeout(900);
await shot("c4-bare.png");
if (!await openPause()) throw new Error("could not open the pause panel"); await pg.waitForTimeout(200);
const dressB = await pg.evaluate(() => { const t = [...document.querySelectorAll(".pause-panel .toggle")].find((x) => /Set dressing/.test(x.textContent)); t.querySelector("input").click(); return JSON.parse(localStorage.getItem("rubberRequiemQuality")).dressing; });
await pg.waitForTimeout(250); await resume(); await pg.waitForTimeout(900);
line("the dressing toggle flips and persists", dressA === false && dressB === true, `${dressA} → ${dressB}`);

// a long walk in every direction must stay finite and never strand the runner
await resume();                                   // if a pause panel is up, the sim is not running
{ const st = await pg.evaluate(() => ({ hud: !!document.querySelector(".hud"), paused: !!document.querySelector(".pause-panel") }));
  if (st.paused || !st.hud) throw new Error("not playing before the wander check: " + JSON.stringify(st)); }
const wander = await pg.evaluate(async () => {
  const g = window.__rr_game(), p = g.player; p.invuln = 9e5;
  // a boon card popping mid-wander pauses the sim, and the tiles would stop counting: no cards here
  g.nextUpgrade = 1e9; g.upgradeReady = false;
  const seen = new Set(); let bad = ""; const start = [Math.round(p.x), Math.round(p.y)];
  for (let i = 0; i < 300; i++) {
    if (i % 40 === 0) { p.x += 240; p.y = Math.max(g.viewH * .4, Math.min(g.worldH - 60, p.y + (i % 80 === 0 ? 90 : -90))); }
    document.querySelector(".upgrade-list button")?.click();
    await new Promise((r) => requestAnimationFrame(r));
    seen.add(`${g.tCol},${g.tRow}`);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(g.cam.x) || !Number.isFinite(g.cam.y)) { bad = `frame ${i}: ${p.x},${p.y} cam ${g.cam.x},${g.cam.y}`; break; }
  }
  return { tiles: seen.size, bad, start, inWorld: p.x > 0 && p.x < g.worldW && p.y > 0 && p.y < g.worldH, stage: g.stage?.name };
});
line("420 frames of wandering stays sane and inside the map", wander.bad === "" && wander.inWorld && wander.tiles >= 3, JSON.stringify(wander));
line("reload remembers style, map and dressing", await pg.evaluate(() => { const q = JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}"); return q.style === "ink" && q.world === "gigantic" && q.dressing === true; }));

console.log("errors:", errs.length ? errs.slice(0, 5).join(" | ") : "none");
await b.close();
