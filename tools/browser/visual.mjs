// Visual QA for the production pass: HUD pictograms, the pause panel's controls block, mobile.
import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const URL = process.env.RR_URL || "http://localhost:4173/#debug";
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];

// 1. desktop HUD with every buff lit at once
const pg = await b.newPage({ viewport: { width: 1000, height: 620 } });
pg.on("pageerror", (e) => errs.push("desktop: " + String(e).slice(0, 140)));
await pg.goto(URL, { waitUntil: "load" }); await pg.waitForTimeout(1600);
await pg.getByRole("button", { name: /^PLAY / }).first().click(); await pg.waitForTimeout(2000);
for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ timeout: 700 }).catch(() => {}); await pg.waitForTimeout(120); }
await pg.evaluate(() => { const g = window.__rr_game(); const p = g.player;
  p.shield = 3; p.rapid = 6; p.star = 7; p.clock = 8; p.wind = 2; p.coins = 137; g.combo = 0; p.invuln = 999; });
await pg.waitForTimeout(500);
const hud = await pg.evaluate(() => ({
  buffs: [...document.querySelectorAll(".buff")].map((e) => e.textContent.trim()),
  icons: [...document.querySelectorAll(".hud .icon")].map((e) => e.getAttribute("class")),
  coin: document.querySelector(".coin-badge")?.textContent.trim(),
  coinBox: (() => { const e = document.querySelector(".coin-badge"); if (!e) return null; const r = e.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; })(),
  swap: document.querySelector(".weapon-switch small")?.textContent.trim(),
}));
console.log("hud:", JSON.stringify(hud));
await pg.screenshot({ path: `${SHOTS}97-hud-icons.png`, clip: { x: 60, y: 0, width: 1320, height: 300 } });
await pg.screenshot({ path: `${SHOTS}98-hud-full.png` });

// 2. the pause panel: controls block, reset button, two-column options
await pg.keyboard.press("Escape"); await pg.waitForTimeout(400);
const pause = await pg.evaluate(() => ({
  heads: [...document.querySelectorAll(".opts-head b, .keys-head b")].map((e) => e.textContent.trim()),
  reset: [...document.querySelectorAll(".pause-panel .text-btn")].map((e) => e.textContent.trim()),
  keys: [...document.querySelectorAll(".keybtn")].map((e) => e.textContent.trim()).slice(0, 4),
  bindBtns: document.querySelectorAll(".keybtn").length,
}));
console.log("pause:", JSON.stringify(pause));
await pg.screenshot({ path: `${SHOTS}99-pause-controls.png`, clip: { x: 60, y: 0, width: 1320, height: 810 } });
// remap: click a key then press J, and make sure nothing is left unbound
await pg.evaluate(() => document.querySelectorAll(".keybtn")[6].click()); await pg.waitForTimeout(200);
await pg.keyboard.press("KeyW"); await pg.waitForTimeout(300);
const after = await pg.evaluate(() => ({ keys: [...document.querySelectorAll(".keybtn")].map((e) => e.textContent.trim()), dupe: (() => { const ks = [...document.querySelectorAll(".keybtn")].map((e) => e.querySelector("b").textContent.split(" / ")[0]); return ks.length - new Set(ks).size; })() }));
console.log("after remap:", JSON.stringify(after));
await pg.evaluate(() => { const b = [...document.querySelectorAll(".pause-panel .text-btn")].find((x) => /RESET KEYS/.test(x.textContent)); b?.click(); }); await pg.waitForTimeout(250);
const reset = await pg.evaluate(() => [...document.querySelectorAll(".keybtn")].map((e) => e.querySelector("b").textContent.trim()).slice(0, 3));
console.log("keys after reset:", JSON.stringify(reset));

// 2b. the paused letter is a labelled dialog and it takes focus
const dlg = await pg.evaluate(() => { const e = document.querySelector("[data-modal]"); const a = document.activeElement;
  return e ? { role: e.getAttribute("role"), label: e.getAttribute("aria-label"), focused: a === e, cls: e.className } : "no dialog"; });
console.log("pause dialog:", JSON.stringify(dlg));

// 3. the shop peek must not appear outside play
await pg.keyboard.press("KeyB"); await pg.waitForTimeout(200);
console.log("shop panel while paused after B:", await pg.evaluate(() => document.querySelectorAll(".shop-panel").length));

// 5. the session remembers the run you were setting up — and the manual tells the truth about keys
await pg.evaluate(() => { const b = [...document.querySelectorAll(".pause-panel .text-btn")].find((x) => /RETURN TO TITLE/.test(x.textContent)); b?.click(); });
await pg.waitForTimeout(500);
const before = await pg.evaluate(() => JSON.parse(localStorage.getItem("rubberRequiemPrefs") || "{}"));
await pg.evaluate(() => {
  const modes = [...document.querySelectorAll(".mode-btn")];
  (modes.find((m) => !/ENDLESS/.test(m.textContent)) || modes[1] || modes[0]).click();
  // a hand-written partial key map: mergeKeyMap must fill every other action from the defaults
  localStorage.setItem("rubberRequiemKeys", JSON.stringify({ dash: ["KeyH"] }));
});
await pg.waitForTimeout(250);
const pickedMode = await pg.evaluate(() => document.querySelector(".mode-btn.on b")?.textContent.trim());
await pg.reload({ waitUntil: "load" }); await pg.waitForTimeout(1600);
const afterReload = await pg.evaluate(() => ({
  stored: JSON.parse(localStorage.getItem("rubberRequiemPrefs") || "{}"),
  modeOn: document.querySelector(".mode-btn.on b")?.textContent.trim(),
  arms: [...document.querySelectorAll(".loadout-summary b, .best + * b")].map((e) => e.textContent.trim()).slice(0, 3),
  auto: document.querySelector(".play-btn")?.textContent.trim(),
  playLabel: document.querySelector(".play-btn")?.textContent.trim(),
}));
// open HOW TO PLAY and read the DASH line: it must show the rebound key, not "Shift"
await pg.evaluate(() => { const b = [...document.querySelectorAll(".menu-panel .tab, .tabs button, .panel-head button")].find((x) => /HOW/i.test(x.textContent)); b?.click(); });
await pg.waitForTimeout(300);
const how = await pg.evaluate(() => { const rows = [...document.querySelectorAll(".how > div")]; const get = (n) => { const r = rows.find((x) => x.querySelector("b")?.textContent.trim().toUpperCase() === n); return r ? r.textContent.replace(r.querySelector("b").textContent, "").trim().slice(0, 30) : "missing"; };
  return { dash: get("DASH"), parry: get("PARRY"), talk: get("TALK"), move: get("MOVE") }; });
console.log("mode picked before reload:", pickedMode, "· restored:", afterReload.modeOn, "· keys:", JSON.stringify(how), "· prefs:", JSON.stringify(afterReload.stored));
console.log("prefs before:", JSON.stringify(before));
console.log("prefs after reload:", JSON.stringify(afterReload));
await pg.close();

// 4. mobile: safe-area padding + the swap chip clear of the sticks
const mb = await b.newContext({ viewport: { width: 420, height: 880 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await mb.addInitScript(() => { try { localStorage.setItem("rubberRequiemQuality", JSON.stringify({ world: "show", shaders: true, lowFx: true })); } catch {} });
const mp = await mb.newPage();
mp.on("pageerror", (e) => errs.push("mobile: " + String(e).slice(0, 140)));
await mp.goto(URL, { waitUntil: "load" }); await mp.waitForTimeout(1600);
await mp.getByRole("button", { name: /^PLAY / }).first().click(); await mp.waitForTimeout(2200);
for (let i = 0; i < 8; i++) { const el = await mp.$(".upgrade-list button"); if (!el) break; await el.click({ timeout: 700 }).catch(() => {}); await mp.waitForTimeout(120); }
await mp.evaluate(() => { const p = window.__rr_game().player; p.shield = 3; p.star = 6; p.coins = 42; });
await mp.waitForTimeout(400);
const mob = await mp.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const k = e.getBoundingClientRect(); return [Math.round(k.x), Math.round(k.y), Math.round(k.width), Math.round(k.height)]; };
  const over = (a, c) => a && c && a[0] < c[0] + c[2] && c[0] < a[0] + a[2] && a[1] < c[1] + c[3] && c[1] < a[1] + a[3];
  const chips = document.querySelector(".biome-sub")?.getBoundingClientRect();
  return { biome: chips ? `${Math.round(chips.width)}x${Math.round(chips.height)} "${document.querySelector(".biome-sub").textContent.trim()}" lvSpan: ${!!document.querySelector(".biome-sub .lv")}` : null,
    swapTop: r(".weapon-switch"), dashTop: r(".act.dash"), overlapsSwap: over(r(".weapon-switch"), r(".act.dash")), coinIcon: !!document.querySelector(".coin-badge .icon") };
});
console.log("mobile:", JSON.stringify(mob));
await mp.screenshot({ path: `${SHOTS}a0-mobile.png`, clip: { x: 0, y: 0, width: 420, height: 880 } });
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
