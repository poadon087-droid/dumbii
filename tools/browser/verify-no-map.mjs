// One-off verification: the game boots, a run starts, and no map widget appears over gameplay.
import { chromium } from "playwright-core";
const b = await chromium.launch({ args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"] });
const pg = await b.newPage({ viewport: { width: 1000, height: 620 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
await pg.goto("http://localhost:4173/", { waitUntil: "load" });
await pg.waitForTimeout(1500);
await pg.getByRole("button", { name: /^PLAY / }).first().click({ force: true, timeout: 20000 });
await pg.waitForTimeout(2000);
for (let i = 0; i < 6; i++) { const el = await pg.$(".upgrade-list button"); if (!el) break; await el.click({ force: true }).catch(() => {}); await pg.waitForTimeout(120); }
await pg.waitForTimeout(2500); // let the run settle into THE WHOLE SHOW (multi-screen map)
const out = await pg.evaluate(() => {
  const g = window.__rr_game;
  return {
    worldmapNodes: document.querySelectorAll(".worldmap, .wm-grid").length,
    worldCells: document.querySelectorAll(".worldmap i").length,
    hud: !!document.querySelector(".hud"),
    healthBar: !!document.querySelector(".health-bar"),
    multi: g ? g.districts > 1 || (g.rows || 1) > 1 : null,
    stage: g?.stage?.name ?? null,
  };
});
await pg.screenshot({ path: "tools/browser/shots/verify-no-map.png" });
console.log(JSON.stringify(out));
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await b.close();
if (out.worldmapNodes !== 0 || !out.hud) { process.exit(1); }
