/**
 * Real-browser boot probe — the deepest verification tier (NOT part of `npm test`).
 * Loads the built index.html in headless Chromium twice:
 *   1. top-level over http  (live-preview condition)
 *   2. inside <iframe sandbox="allow-scripts"> (file-viewer condition: opaque origin, localStorage blocked)
 * Asserts: __rr_booted, canvas rendering, frames advancing, run starts, zero uncaught errors.
 *
 * Run:  npm run build && (cd /tmp && npm i playwright-core && npx playwright-core install chromium)
 *       then: node tests/browser/boot.mjs   (from a dir where playwright-core resolves;
 *       needs the preview server running: npm run preview)
 */
import { chromium } from "playwright-core";

const browser = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const results = [];
const ok = (name, pass, info = "") => { results.push({ name, pass, info }); };

// ---------- 1. top-level load (live-preview condition) ----------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error" && !/soundimage|jsdelivr|net::ERR|Failed to load resource|AudioContext/i.test(m.text())) errors.push("console: " + m.text()); });
  await page.goto("http://localhost:4173/", { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const booted = await page.evaluate(() => window.__rr_booted === true);
  ok("top-level: __rr_booted", booted);
  const canvasInfo = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return null;
    const d1 = c.toDataURL().length;
    return { w: c.width, h: c.height, d1 };
  });
  ok("top-level: canvas present & sized", !!canvasInfo && canvasInfo.w > 0, JSON.stringify(canvasInfo));
  // frames actually advancing: sample canvas hash twice
  const f1 = await page.evaluate(() => { const c = document.querySelector("canvas"); return c ? c.toDataURL().slice(-3000) : ""; });
  await page.waitForTimeout(600);
  const f2 = await page.evaluate(() => { const c = document.querySelector("canvas"); return c ? c.toDataURL().slice(-3000) : ""; });
  ok("top-level: frames advancing", f1.length > 1000 && f1 !== f2);
  // start a run: click the PLAY ENDLESS button
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("PLAY ENDLESS"));
    if (b) { b.click(); return true; } return false;
  });
  ok("top-level: PLAY ENDLESS clicked", clicked);
  await page.waitForTimeout(2500);
  const playing = await page.evaluate(() => !document.querySelector(".menu-overlay"));
  ok("top-level: menu gone after start (run playing)", playing);
  ok("top-level: zero uncaught errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

// ---------- 2. sandboxed iframe (file-viewer condition: opaque origin) ----------
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://localhost:4173/__probe_wrapper.html");
  await page.waitForTimeout(3500);
  const frame = page.frames().find((f) => f !== page.mainFrame());
  let booted = false, origin = "?";
  if (frame) {
    booted = await frame.evaluate(() => window.__rr_booted === true).catch(() => false);
    origin = await frame.evaluate(() => { try { return localStorage.getItem("x"), "accessible"; } catch { return "opaque (blocked)"; } }).catch(() => "?");
  }
  ok("sandboxed iframe: frame found", !!frame);
  ok("sandboxed iframe: __rr_booted with opaque origin", booted, "localStorage: " + origin);
  ok("sandboxed iframe: zero uncaught errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await page.close();
}

await browser.close();
let fail = 0;
for (const r of results) { console.log(`${r.pass ? "pass" : "FAIL"}  ${r.name}${r.info ? "  — " + r.info : ""}`); if (!r.pass) fail++; }
console.log(`${results.length - fail}/${results.length} browser checks passed`);
process.exit(fail ? 1 : 0);
