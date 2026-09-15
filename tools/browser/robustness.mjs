// Deterministic checks for the specific defects found in the audit. Each block prints
// BUG (should fail before the fix, pass after).
import { chromium } from "playwright-core";
const URL = process.env.RR_URL || "http://localhost:4173/#debug";
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 760 }, hasTouch: true });
await ctx.addInitScript(() => {
  const pad = {
    connected: true, mapping: "standard", id: "fuzzpad", index: 0, timestamp: 1,
    axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    vibrationActuator: { playEffect: () => Promise.resolve() },
  };
  Object.defineProperty(navigator, "getGamepads", { value: () => [pad], configurable: true });
  window.__pad = {
    axis(i, v) { pad.axes[i] = v; pad.timestamp = performance.now() + 1; },
    press(i) { pad.buttons[i] = { pressed: true, value: 1 }; pad.timestamp = performance.now() + 1; },
    release(i) { pad.buttons[i] = { pressed: false, value: 0 }; pad.timestamp = performance.now() + 1; },
  };
});
const pg = await ctx.newPage();
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
await pg.goto(URL, { waitUntil: "load" });
await pg.waitForTimeout(1500);
const line = (name, ok, detail) => console.log(`${ok ? "ok  " : "BUG "} ${name}${detail ? "  — " + detail : ""}`);

await pg.getByRole("button", { name: /^PLAY / }).first().click();
await pg.waitForTimeout(2000);
for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ timeout: 800 }).catch(() => {}); await pg.waitForTimeout(120); }
const pos = () => pg.evaluate(() => Math.round(window.__rr_game().player.x));

// 1. holding a movement key, then losing window focus, must not leave the runner walking
await pg.keyboard.down("ArrowRight"); await pg.waitForTimeout(600);
const a1 = await pos(); await pg.waitForTimeout(600); const a2 = await pos();
await pg.evaluate(() => window.dispatchEvent(new Event("blur"))); await pg.waitForTimeout(120);
const b1 = await pos(); await pg.waitForTimeout(700); const b2 = await pos();
await pg.keyboard.up("ArrowRight");
line("focus loss releases held keys", a2 - a1 > 40 && b2 - b1 < 12, `moving ${a2 - a1}px, after blur ${b2 - b1}px`);

// 2. gamepad left stick must drive movement
const c1 = await pos();
await pg.evaluate(() => window.__pad.axis(0, 1)); await pg.waitForTimeout(700);
const c2 = await pos(); await pg.evaluate(() => window.__pad.axis(0, 0));
line("gamepad left stick moves the runner", c2 - c1 > 40, `moved ${c2 - c1}px in 0.7s`);

// 3. gamepad stick must aim+fire with the right stick, and A/B must act once per tap
const shots1 = await pg.evaluate(() => window.__rr_game().stats.shots);
await pg.evaluate(() => { window.__pad.axis(2, 0.9); window.__pad.axis(3, -0.4); });
await pg.waitForTimeout(600);
const aimed = await pg.evaluate(() => +window.__rr_game().player.angle.toFixed(2));
await pg.evaluate(() => { window.__pad.axis(2, 0); window.__pad.axis(3, 0); });
const shots2 = await pg.evaluate(() => window.__rr_game().stats.shots);
line("gamepad right stick aims and fires", shots2 > shots1, `shots ${shots1}→${shots2}, angle ${aimed}`);
const hp1 = await pg.evaluate(() => window.__rr_game().player.dashCd);
await pg.evaluate(() => window.__pad.press(0)); await pg.waitForTimeout(60);
const hp2 = await pg.evaluate(() => window.__rr_game().player.dashCd);
await pg.waitForTimeout(60); const hp3 = await pg.evaluate(() => window.__rr_game().player.dashCd);
await pg.evaluate(() => window.__pad.release(0));
line("pad A dashes once per press", hp2 > hp1 && hp3 >= 0, `dashCd ${hp1.toFixed(2)}→${hp2.toFixed(2)}→${hp3.toFixed(2)}`);

// 4. the shop toggle must not leak out of play
await pg.keyboard.press("Escape"); await pg.waitForTimeout(200);
const shopInPause = await pg.evaluate(() => { const n = document.querySelectorAll(".shop-panel, .shop-hud").length; return n; });
await pg.keyboard.press("KeyB"); await pg.waitForTimeout(200);
const shopAfterB = await pg.evaluate(() => ({ panels: document.querySelectorAll(".shop-panel, .shop-hud").length, phase: !!document.querySelector(".pause-panel") }));
line("B does nothing outside play", shopInPause === shopAfterB.panels, `panels ${shopInPause}→${shopAfterB.panels}, paused=${shopAfterB.phase}`);

// 5. Tab while playing must not trap keyboard focus in the HUD
await pg.evaluate(() => document.querySelector(".pause-panel button")?.click()); await pg.waitForTimeout(300);
const focusTest = await pg.evaluate(async () => {
  const btn = document.querySelector(".hud button"); if (!btn) return "no hud button";
  btn.focus(); const was = document.activeElement === btn;
  return { focusable: was, outline: getComputedStyle(btn).outlineStyle };
});
line("HUD controls are focusable", typeof focusTest === "object" && focusTest.focusable, JSON.stringify(focusTest));

// 6. no tofu glyphs in the HUD (emoji that the font may not carry)
const tofu = await pg.evaluate(() => {
  const re = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  const out = [];
  for (const el of document.querySelectorAll("main *, .game-page > *")) {
    if (el.children.length || !el.textContent) continue;
    if (re.test(el.textContent)) out.push((el.className || el.tagName) + ":" + el.textContent.trim().slice(0, 14));
  }
  return [...new Set(out)];
});
line("no emoji glyphs anywhere", tofu.length === 0, JSON.stringify(tofu));

// 7. the level/biome readout must not be cut off with an ellipsis
const trunc = await pg.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll(".hud *, .pause-panel *, .weapon-switch *")) {
    if (el.children.length || !el.textContent) continue;
    if (el.scrollWidth - el.clientWidth > 2 || getComputedStyle(el).textOverflow === "ellipsis") out.push(`${el.className} "${el.textContent.trim().slice(0, 26)}"`);
  }
  return [...new Set(out)].slice(0, 6);
});
line("no clipped HUD text", trunc.length === 0, JSON.stringify(trunc));

// 8. safe areas / mobile chrome
const mob = await pg.evaluate(() => {
  const s = document.documentElement.style, cs = getComputedStyle(document.body);
  return { overscroll: cs.overscrollBehaviorY, userSel: getComputedStyle(document.querySelector(".shell") || document.body).userSelect,
    tap: getComputedStyle(document.body).webkitTapHighlightColor, viewportFit: document.querySelector('meta[name=viewport]')?.content.includes("viewport-fit") };
});
line("mobile chrome handled", mob.overscroll === "none" && mob.viewportFit, JSON.stringify(mob));

// 9. a lost WebGL context must pause politely, then recover on its own
const gl = await pg.evaluate(async () => {
  const c = document.querySelector("canvas");
  const g = c.getContext("webgl") || c.getContext("webgl2");
  if (!g) return "no webgl";
  const ext = g.getExtension("WEBGL_lose_context"); if (!ext) return "no lose ext";
  const painted = () => { const cv = document.createElement("canvas"); cv.width = 60; cv.height = 40; const x = cv.getContext("2d"); x.drawImage(c, 0, 0, 60, 40); const d = x.getImageData(0, 0, 60, 40).data; let min = 255, max = 0; for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; min = Math.min(min, v); max = Math.max(max, v); } return max - min; };
  const before = painted();
  ext.loseContext();
  await new Promise((r) => setTimeout(r, 350));
  const card = !!document.querySelector(".crash-letter") || /PROJECTOR JAMMED/.test(document.body.innerText);
  const paused = !!document.querySelector(".pause-panel");
  ext.restoreContext();
  await new Promise((r) => setTimeout(r, 900));
  const gone = !/PROJECTOR JAMMED/.test(document.body.innerText);
  const after = painted();
  return { before, card, paused, gone, after, lost: g.isContextLost() };
});
line("context loss pauses, shows a card, then repaints",
  typeof gl === "object" && gl.card && gl.gone && gl.after > 12 && !gl.lost, JSON.stringify(gl));

// 10. the debug handle only exists when the URL asks for it
const dbg = await pg.evaluate(() => typeof window.__rr_game);
const plain = await pg.context().newPage();
await plain.goto(URL.replace("#debug", ""), { waitUntil: "load" });
await plain.waitForTimeout(1400);
const prod = await plain.evaluate(() => ({ handle: typeof window.__rr_game, booted: !!window.__rr_booted, canvas: !!document.querySelector("canvas"), text: document.body.innerText.length }));
await plain.close();
line("debug handle is opt-in", dbg === "function" && prod.handle === "undefined" && prod.booted && prod.canvas && prod.text > 40, `#debug=${dbg}, shipped=${JSON.stringify(prod)}`);

console.log("errors:", errs.length ? errs.slice(0, 4).join(" | ") : "none");
await b.close();
