import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
/** screenshots are a diagnostic, never a build artifact */
const SHOTS = path.join(path.dirname(fileURLToPath(import.meta.url)), "shots") + "/";
fs.mkdirSync(SHOTS, { recursive: true });
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const errs = [];
const pg = await b.newPage({ viewport: { width: 420, height: 860 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
pg.on("pageerror", e => errs.push(String(e).slice(0, 140)));
await pg.goto("http://localhost:4173/#debug/", { waitUntil: "load" }); await pg.waitForTimeout(1700);
await pg.getByRole("button", { name: /^PLAY / }).first().click(); await pg.waitForTimeout(2200);
for (let i = 0; i < 8; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click(); await pg.waitForTimeout(120); }
const boxes = await pg.evaluate(() => {
  const r = (s) => { const e = document.querySelector(s); if (!e) return null; const k = e.getBoundingClientRect(); return { s, x: Math.round(k.x), y: Math.round(k.y), w: Math.round(k.width), h: Math.round(k.height) }; };
  return [r(".aim-stick"), r(".act.dash"), r(".act.parry"), r(".act.ex"), r(".act.auto-toggle"), r(".joystick")].filter(Boolean);
});
const over = (a, c) => a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
const stick = boxes[0], clashes = boxes.slice(1).filter((c) => over(stick, c)).map(c => c.s);
console.log("boxes:", JSON.stringify(boxes));
console.log("aim-stick overlaps:", clashes.length ? clashes.join(",") : "nothing ✓");
// drag the stick right and up: angle should swing and shots should fire while held
const shots = () => window.__rr_game().stats.shots;
const before = await pg.evaluate(() => ({ a: +window.__rr_game().player.angle.toFixed(2), f: window.__rr_game().stats.shots, x: Math.round(window.__rr_game().player.x) }));
const cx = stick.x + stick.w / 2, cy = stick.y + stick.h / 2;
await pg.touchscreen.tap(cx, cy); // ensure the element is hittable at its centre
const cdp = await pg.context().newCDPSession(pg);
const touch = async (type, x, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });
await touch("touchStart", cx, cy);
for (let i = 1; i <= 6; i++) { await touch("touchMove", cx + i * 7, cy - i * 3); await pg.waitForTimeout(40); }
const mid = await pg.evaluate(() => ({ a: +window.__rr_game().player.angle.toFixed(2), f: window.__rr_game().stats.shots, x: Math.round(window.__rr_game().player.x) }));
await pg.waitForTimeout(600);
await touch("touchEnd", 0, 0);
const after = await pg.evaluate(() => ({ a: +window.__rr_game().player.angle.toFixed(2), f: window.__rr_game().stats.shots }));
console.log("aim drag:", JSON.stringify({ before, mid, after, angleChanged: Math.abs(after.a - before.a) > .1, firedWhileHeld: after.f > before.f }));
// keyboard-free movement check on touch: the left stick should walk the runner
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await pg.screenshot({ path: `${SHOTS}95-mobile-fixed.png`, clip: { x: 0, y: 0, width: 420, height: 860 } });
await b.close();
