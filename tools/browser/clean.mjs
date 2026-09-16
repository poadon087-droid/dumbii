// CLEAN SCREEN: the two dials that take the writing off the show (WORDS + HUD), in the browser.
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const URL = process.env.RR_URL || "http://localhost:4173/#debug";
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 900, height: 540 } });
// seed once, then get out of the way: a reload has to find what the APP wrote, or the
// "does the choice survive a reload" check would only be testing this line
await ctx.addInitScript(`try { if (!localStorage.getItem("rubberRequiemQuality")) localStorage.setItem("rubberRequiemQuality", JSON.stringify({ world: "gigantic", dressing: true, style: "ink", shaders: true, lowFx: true })); } catch {}`);
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
      const btn = document.querySelector(".hud-right .round-btn"); if (btn) btn.click();
    });
    await pg.waitForTimeout(450);
  }
  return !!(await pg.$(".pause-panel"));
};
const resume = async () => { await pg.evaluate(() => { const b = [...document.querySelectorAll(".pause-panel button")].find((x) => /KEEP SWINGING/.test(x.textContent)); b?.click(); }); await pg.waitForTimeout(300); await godlike(); };
/** what the overlay looks like from the outside */
const vis = () => pg.evaluate(() => {
  // "hidden" has to see through an ancestor's display:none too — .hud-off hides whole branches,
  // and a child of a display:none parent still reports its own computed display. Zero layout boxes
  // is the honest answer: nothing is painted, wherever in the tree the hiding happens.
  const st = (sel) => { const el = document.querySelector(sel); if (!el) return "missing"; const cs = getComputedStyle(el);
    return cs.display === "none" || cs.visibility === "hidden" || cs.fontSize === "0px" || el.getClientRects().length === 0 ? "hidden" : "shown"; };
  return {
    shell: document.querySelector(".game-shell")?.className || "",
    label: st(".health-label"), score: st(".score-num"), buffs: st(".buffs"),
    bar: st(".health-bar"), pips: st(".cards i"), pause: st(".hud-right .round-btn"), map: st(".worldmap"),
    weapon: st(".weapon-switch"), hudLeft: st(".hud-left"), announce: st(".announce"), combo: st(".combo"),
    badge: st(".mode-badge"), coin: st(".coin-badge"), portrait: st(".portrait"),
  };
});
/** bright-pixel count in a box around the runner: floating words are bright on a dark stage */
const brightBox = () => pg.evaluate(() => {
  const g = window.__rr_game(), c = document.querySelector("canvas");
  const sx = (g.player.x - g.cam.x) / g.viewW * c.width, sy = (g.player.y - g.cam.y) / g.viewH * c.height;
  const bw = Math.round(c.width * .34), bh = Math.round(c.height * .2);
  const x0 = Math.max(0, Math.round(sx - bw / 2)), y0 = Math.max(0, Math.round(sy - bh - c.height * .06));
  const cv = document.createElement("canvas"); cv.width = bw; cv.height = bh;
  const x = cv.getContext("2d"); x.drawImage(c, x0, y0, bw, bh, 0, 0, bw, bh);
  const d = x.getImageData(0, 0, bw, bh).data;
  let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 215 && d[i + 1] > 215 && d[i + 2] > 200) n++;
  return n;
});
/** park a long-lived word in the air and strip the scene of everything else that glows */
const plant = () => pg.evaluate(() => {
  const g = window.__rr_game();
  g.enemies.length = 0; g.bullets.length = 0; g.puffs.length = 0; g.pickups.length = 0; g.hazards.length = 0; g.puddles.length = 0; g.ghosts.length = 0;
  g.texts.length = 0;
  g.texts.push({ x: g.player.x + 10, y: g.player.y - 96, text: "SIGNATURE!", life: 30, max: 30, color: "#ffffff", rot: 0, big: true });
  g.player.invuln = 9e9;
});

await pg.goto(URL, { waitUntil: "load" });
await pg.waitForTimeout(1400);
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 });
await pg.waitForTimeout(1700);
for (let i = 0; i < 6; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true, timeout: 4000 }).catch(() => {}); await pg.waitForTimeout(120); }
await godlike();

const dflt = await vis();
line("the show opens with every word on it", /txt-all/.test(dflt.shell) && /hud-full/.test(dflt.shell), dflt.shell);
line("and the overlay is all there", dflt.label === "shown" && dflt.score === "shown" && dflt.bar === "shown" && dflt.pause === "shown", JSON.stringify(dflt).slice(0, 150));

// the two rows of buttons live in the pause panel, next to the art styles
if (!await openPause()) throw new Error("could not open the pause panel");
const panel = await pg.evaluate(() => ({
  sects: [...document.querySelectorAll(".pause-panel .opt-sect")].map((e) => e.textContent),
  words: [...document.querySelectorAll(".pause-panel [data-text]")].map((e) => `${e.dataset.text}:${e.textContent}`),
  huds: [...document.querySelectorAll(".pause-panel [data-hud]")].map((e) => `${e.dataset.hud}:${e.textContent}`),
  hint: document.querySelector(".pause-panel .opt-hint")?.textContent?.slice(0, 40) || "",
}));
line("OPTIONS carries a CLEAN SCREEN section", panel.sects.some((s) => /CLEAN SCREEN/.test(s)), panel.sects.join(" · "));
line("with three WORDS dials and three HUD dials", panel.words.length === 3 && panel.huds.length === 3, panel.words.join(" ") + " | " + panel.huds.join(" "));
await shot("d0-options-clean.png");

// ── WORDS → NO TEXT: the same frame, with the writing lifted out of it
await resume(); await pg.waitForTimeout(500);
await plant(); await pg.waitForTimeout(420);
const brightAll = await brightBox();
await shot("d1-words-all.png");
if (!await openPause()) throw new Error("could not open the pause panel");
const setWords = await pg.evaluate((id) => { const b = document.querySelector(`.pause-panel [data-text="${id}"]`); if (!b) return "missing"; b.click(); return JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}").text; }, "none");
await pg.waitForTimeout(200); await resume(); await pg.waitForTimeout(500);
await plant(); await pg.waitForTimeout(420);
const brightNone = await brightBox();
const textsKept = await pg.evaluate(() => { const g = window.__rr_game(); return { texts: g.texts.length, text: g.texts[0]?.text }; });
await shot("d2-words-none.png");
line("WORDS → NO TEXT applies and persists", setWords === "none", `stored "${setWords}"`);
line("the floating word is really gone from the picture", brightNone < brightAll * .5, `bright px ${brightAll} → ${brightNone}`);
line("…but the sim still says it (only the painting is switched off)", textsKept.texts === 1 && textsKept.text === "SIGNATURE!", JSON.stringify(textsKept));

// ── HUD → BARS ONLY: meters and icons, no words
if (!await openPause()) throw new Error("could not open the pause panel");
const setHud = await pg.evaluate((id) => { const b = document.querySelector(`.pause-panel [data-hud="${id}"]`); if (!b) return "missing"; b.click(); return JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}").hud; }, "minimal");
await pg.waitForTimeout(200); await resume(); await pg.waitForTimeout(500);
const min = await vis();
await shot("d3-hud-minimal.png");
line("HUD → BARS ONLY applies and persists", setHud === "minimal" && /hud-minimal/.test(min.shell), `stored "${setHud}" · ${min.shell}`);
line("the words come off the overlay", min.label === "hidden" && min.score === "hidden" && min.buffs === "hidden", JSON.stringify(min).slice(0, 190));
line("the meters stay, and the map widget stays gone", min.bar === "shown" && min.pips === "shown" && min.pause === "shown" && min.map === "missing", JSON.stringify(min).slice(0, 190));

// ── HUD → HIDDEN: nothing but the pause button, and the run keeps playing
if (!await openPause()) throw new Error("could not open the pause panel");
await pg.evaluate(() => document.querySelector('.pause-panel [data-hud="off"]')?.click());
await pg.waitForTimeout(200); await resume(); await pg.waitForTimeout(600);
const off = await vis();
const stillRunning = await pg.evaluate(async () => { const g = window.__rr_game(); const a = g.elapsed; await new Promise((r) => setTimeout(r, 500)); return { moved: g.elapsed > a, over: g.over }; });
await shot("d4-hud-off.png");
line("HUD → HIDDEN strips the overlay", off.hudLeft === "hidden" && off.weapon === "hidden" && off.map !== "shown" && off.portrait === "hidden", JSON.stringify(off).slice(0, 190));
line("and leaves the pause button, so a run can never trap you", off.pause === "shown", JSON.stringify(off).slice(0, 120));
line("the game keeps running underneath", stillRunning.moved && !stillRunning.over, JSON.stringify(stillRunning));
const reopened = await openPause();
line("the pause button still opens the panel", reopened, "");

// ── back to everything, and a reload has to remember the choice
await pg.evaluate(() => { document.querySelector('.pause-panel [data-hud="full"]')?.click(); document.querySelector('.pause-panel [data-text="quiet"]')?.click(); });
await pg.waitForTimeout(200);
const stored = await pg.evaluate(() => JSON.parse(localStorage.getItem("rubberRequiemQuality") || "{}"));
await pg.reload({ waitUntil: "load" }); await pg.waitForTimeout(1500);
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 });
await pg.waitForTimeout(1500);
for (let i = 0; i < 6; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true, timeout: 4000 }).catch(() => {}); await pg.waitForTimeout(110); }
const after = await vis();
await shot("d5-quiet-after-reload.png");
line("the choice survives a reload", stored.text === "quiet" && stored.hud === "full" && /txt-quiet/.test(after.shell) && /hud-full/.test(after.shell), `${stored.text}/${stored.hud} · ${after.shell}`);
line("QUIET still shows the meters and the labels", after.label === "shown" && after.bar === "shown", JSON.stringify(after).slice(0, 150));

console.log("errors:", errs.length ? errs.slice(0, 5).join(" | ") : "none");
await b.close();
