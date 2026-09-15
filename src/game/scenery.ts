/** Biome scenery: cached backdrops, foreground silhouettes and the animated decor layer.
 *  Backdrops/foregrounds render once into cached canvases per biome+size; animatedDecor
 *  draws straight onto the passed context every frame. */
import type { Biome } from "./data";
import type { StyleId } from "./styles";
import { HORIZON } from "./util";
import { flagsOf } from "./styles";

const TAU = Math.PI * 2;
const INK = "#1a1418";

const cache = new Map<string, HTMLCanvasElement>();
const seeded = (n: number, salt: number) => { const s = Math.sin(n * 12.9898 + salt) * 43758.5453; return s - Math.floor(s); };
/** which art style the scenery is being painted in (set once per frame by the App) */
let styleId: StyleId = "ink";
export function setSceneryStyle(id: StyleId) { styleId = id; }

export function paintBackdrop(b: Biome, w: number, h: number) {
  const key = `${b.name}:${Math.round(w)}x${Math.round(h)}`;
  const hit = cache.get(key); if (hit) return hit;
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d")!; const hz = h * HORIZON; const salt = b.name.length;
  const st = flagsOf(styleId);
  if (st.flat) {
    // two hard bands instead of a gradient — the cel and riso looks have no soft anything
    x.fillStyle = b.skyTop; x.fillRect(0, 0, w, hz * .62 + 2);
    x.fillStyle = b.skyBottom; x.fillRect(0, hz * .62, w, hz * .38 + 2);
    x.fillStyle = st.paper; x.globalAlpha = .1; x.fillRect(0, hz * .62 - 3, w, 3); x.globalAlpha = 1;
  } else {
    const sky = x.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, b.skyTop); sky.addColorStop(1, b.skyBottom); x.fillStyle = sky; x.fillRect(0, 0, w, hz + 2);
  }
  for (let i = 0; i < 26; i++) { x.globalAlpha = .07; x.fillStyle = i % 2 ? b.accent : "#ffffff"; x.beginPath(); x.ellipse(seeded(i, salt) * w, seeded(i + 1, salt) * hz, 60 + seeded(i + 2, salt) * 120, 14 + seeded(i + 3, salt) * 26, 0, 0, TAU); x.fill(); }
  x.globalAlpha = 1;
  x.fillStyle = b.far;
  if (b.decor === "grotto") { x.beginPath(); x.moveTo(0, hz); for (let i = 0; i <= w + 60; i += 60) { x.lineTo(i, hz - 40 - seeded(i, salt) * hz * .75); x.lineTo(i + 30, hz - 20 - seeded(i + 7, salt) * hz * .35); } x.lineTo(w, hz); x.fill(); x.fillStyle = b.mid; x.globalAlpha = .5; x.beginPath(); x.moveTo(0, hz); for (let i = 0; i <= w + 40; i += 40) { x.lineTo(i, hz - 10 - seeded(i + 3, salt) * hz * .3); } x.lineTo(w, hz); x.fill(); x.globalAlpha = 1; }
  else if (b.decor === "moor") { x.fillStyle = "#f3ecd2"; x.beginPath(); x.arc(w * .76, hz * .42, Math.min(w, h) * .075, 0, TAU); x.fill(); x.fillStyle = b.skyBottom; x.beginPath(); x.arc(w * .76 + 18, hz * .42 - 10, Math.min(w, h) * .06, 0, TAU); x.fill(); x.fillStyle = b.far; for (let i = 30; i < w; i += 120) { const th = hz * (.5 + seeded(i, salt) * .45); x.fillRect(i - 6, hz - th, 12, th); for (let k = 0; k < 4; k++) { x.save(); x.translate(i, hz - th * (.4 + k * .17)); x.rotate((seeded(i + k, salt) - .5) * 2.2); x.fillRect(0, -3, 30 + seeded(i * k + 1, salt) * 40, 6); x.restore(); } } }
  else if (b.decor === "carnival") { for (let i = -40; i < w; i += 210) { const tw = 190, th = hz * .55; x.fillStyle = b.far; x.beginPath(); x.moveTo(i, hz); x.lineTo(i, hz - th * .55); x.lineTo(i + tw / 2, hz - th); x.lineTo(i + tw, hz - th * .55); x.lineTo(i + tw, hz); x.fill(); x.fillStyle = b.mid; for (let s = 0; s < tw; s += 38) { x.beginPath(); x.moveTo(i + s, hz); x.lineTo(i + s + 12, hz - th * .5); x.lineTo(i + s + 24, hz); x.fill(); } x.fillStyle = b.accent; x.beginPath(); x.moveTo(i + tw / 2, hz - th); x.lineTo(i + tw / 2 + 22, hz - th - 8); x.lineTo(i + tw / 2, hz - th - 16); x.fill(); } }
  else if (b.decor === "frost") { x.beginPath(); x.moveTo(0, hz); for (let i = 0; i <= w + 100; i += 100) { x.lineTo(i + 30, hz - 30 - seeded(i, salt) * hz * .8); x.lineTo(i + 70, hz - 20 - seeded(i + 3, salt) * hz * .4); } x.lineTo(w, hz); x.fill(); x.fillStyle = "#e9f6ff"; x.globalAlpha = .55; x.beginPath(); x.moveTo(0, hz); for (let i = 0; i <= w + 100; i += 100) { const pk = hz - 30 - seeded(i, salt) * hz * .8; x.lineTo(i + 30, pk); x.lineTo(i + 45, pk + 18); x.lineTo(i + 15, pk + 22); x.lineTo(i + 30, pk); } x.globalAlpha = 1; }
  else if (b.decor === "swamp") { for (let i = 20; i < w; i += 110) { const th = hz * (.45 + seeded(i, salt) * .4); x.fillStyle = b.far; x.fillRect(i - 5, hz - th, 10, th); x.fillStyle = i % 220 ? b.accent : "#9be36f"; x.globalAlpha = .55; x.beginPath(); x.arc(i, hz - th, 22 + seeded(i + 1, salt) * 14, 0, TAU); x.fill(); x.globalAlpha = 1; } }
  else if (b.decor === "clock") { // clockwork attic: rafters, gears, hanging bulbs
    x.fillStyle = b.far; for (let i = -20; i < w; i += 140) { x.beginPath(); x.moveTo(i, hz); x.lineTo(i + 70, 0); x.lineTo(i + 90, 0); x.lineTo(i + 20, hz); x.fill(); }
    for (let i = 0; i < 5; i++) { const gx = seeded(i + 5, salt) * w, gy = hz * (.2 + seeded(i + 15, salt) * .55), gr = 30 + seeded(i + 25, salt) * 50; x.fillStyle = "#4a3320"; x.beginPath(); for (let t = 0; t < 24; t++) { const a = t / 24 * TAU, rr = t % 2 ? gr : gr * 1.18; x.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } x.closePath(); x.fill(); x.fillStyle = b.skyBottom; x.beginPath(); x.arc(gx, gy, gr * .35, 0, TAU); x.fill(); }
    for (let i = 0; i < 6; i++) { const lx = 80 + seeded(i + 35, salt) * (w - 160); x.strokeStyle = "#2a1c12"; x.lineWidth = 2; x.beginPath(); x.moveTo(lx, 0); x.lineTo(lx, hz * .4); x.stroke(); x.fillStyle = "#ffe08a"; x.beginPath(); x.arc(lx, hz * .4 + 8, 8, 0, TAU); x.fill(); x.globalAlpha = .18; x.beginPath(); x.arc(lx, hz * .4 + 8, 40, 0, TAU); x.fill(); x.globalAlpha = 1; }
  }
  else if (b.decor === "train") { // Phantom Express railway
    x.fillStyle = b.far;
    for (let i = -30; i < w; i += 90) { x.fillRect(i, hz * 0.45, 14, hz * 0.55); x.fillRect(i - 16, hz * 0.55, 46, 6); }
    x.fillStyle = "#1e2c3a"; x.beginPath(); x.moveTo(0, hz); for (let i = 0; i <= w + 80; i += 80) { x.lineTo(i, hz - 25 - seeded(i, salt) * 35); } x.lineTo(w, hz); x.fill();
  }
  else if (b.decor === "crypt") { // Boneyard Crypt
    x.fillStyle = b.far;
    for (let i = 10; i < w; i += 100) {
      x.beginPath(); x.moveTo(i, hz); x.lineTo(i + 20, hz * 0.2); x.lineTo(i + 40, hz); x.fill();
      x.fillRect(i + 17, hz * 0.12, 6, hz * 0.1);
    }
  }
  else if (b.decor === "rooftop") { // Midnight Rooftops: skyline, fat moon, laundry lines
    x.fillStyle = "#f3ecd2"; x.beginPath(); x.arc(w * .2, hz * .3, Math.min(w, h) * .09, 0, TAU); x.fill();
    x.fillStyle = b.skyBottom; x.beginPath(); x.arc(w * .2 + 14, hz * .3 - 8, Math.min(w, h) * .075, 0, TAU); x.fill();
    for (let i = -20; i < w; i += 130) {
      const th = hz * (.35 + seeded(i, salt) * .5), bw = 90 + seeded(i + 3, salt) * 60;
      x.fillStyle = b.far; x.fillRect(i, hz - th, bw, th);
      x.fillStyle = "#ffe27a";
      for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 3; wx++) if (seeded(i + wx * 7 + wy * 13, salt) > .55) x.fillRect(i + 12 + wx * 26, hz - th + 12 + wy * 26, 8, 10);
      x.fillStyle = b.mid; x.fillRect(i + 10, hz - th - 14, 12, 14); x.fillRect(i + bw - 26, hz - th - 22, 10, 22);
    }
  } else if (b.decor === "library") { // Forbidden Library: towering shelves, rolling ladder
    for (let i = -10; i < w; i += 150) {
      const sh = hz * (.6 + seeded(i, salt) * .35);
      x.fillStyle = b.far; x.fillRect(i, hz - sh, 120, sh);
      for (let ry = 0; ry < 5; ry++) {
        x.fillStyle = "#2a1c12"; x.fillRect(i + 6, hz - sh + 14 + ry * (sh / 5.4), 108, 4);
        for (let bk = 0; bk < 9; bk++) { x.fillStyle = ["#6a4a2c", "#4d3a24", "#7a5a34", "#5a4020"][Math.floor(seeded(i + bk * 3 + ry * 11, salt) * 4)]; x.fillRect(i + 8 + bk * 12, hz - sh + ry * (sh / 5.4) + (sh / 5.4) - 16, 9, 14); }
      }
    }
    x.strokeStyle = "#3a2a1c"; x.lineWidth = 5; x.beginPath(); x.moveTo(w * .68, 0); x.lineTo(w * .74, hz); x.moveTo(w * .72, 0); x.lineTo(w * .78, hz); x.stroke();
    x.lineWidth = 3; for (let r = 0; r < 6; r++) { x.beginPath(); x.moveTo(w * .685 + r * 3, r * hz / 6); x.lineTo(w * .745 + r * 3, r * hz / 6); x.stroke(); }
  } else { // Devil's inferno
    x.fillStyle = b.far;
    x.beginPath(); x.moveTo(0, hz);
    for (let i = 0; i <= w + 50; i += 50) {
      x.lineTo(i, hz - 35 - seeded(i, salt) * 55);
      x.lineTo(i + 25, hz - 15 - seeded(i + 2, salt) * 30);
    }
    x.lineTo(w, hz); x.fill();
  }
  if (st.flat) {
    x.fillStyle = b.ground; x.fillRect(0, hz, w, h - hz);
    x.fillStyle = b.groundDark; x.fillRect(0, hz, w, (h - hz) * .16);
    if (st.halftone) {                              // the shadow is a dot screen, not a falloff
      x.fillStyle = "#120e16";
      for (let ry = 0; ry < 7; ry++) {
        const step = 9 + ry * 2.2, yy = hz + 12 + ry * ((h - hz) / 7.4);
        for (let rx = -step; rx < w + step; rx += step) {
          const r = 2.6 - ry * .22; if (r <= .2) break;
          x.globalAlpha = .3 - ry * .03; x.beginPath(); x.arc(rx + (ry % 2 ? step / 2 : 0), yy, r, 0, Math.PI * 2); x.fill();
        }
      }
      x.globalAlpha = 1;
    }
  } else {
    const gr = x.createLinearGradient(0, hz, 0, h); gr.addColorStop(0, b.groundDark); gr.addColorStop(.25, b.ground); gr.addColorStop(1, b.groundDark); x.fillStyle = gr; x.fillRect(0, hz, w, h - hz);
  }
  for (let i = 0; i < 70; i++) { x.globalAlpha = .08 + seeded(i, salt) * .08; x.fillStyle = i % 3 === 0 ? b.accent : i % 3 === 1 ? "#000" : "#fff"; x.beginPath(); x.ellipse(seeded(i + 9, salt) * w, hz + seeded(i + 19, salt) * (h - hz), 40 + seeded(i + 29, salt) * 110, 8 + seeded(i + 39, salt) * 18, 0, 0, TAU); x.fill(); }
  x.globalAlpha = 1; x.strokeStyle = INK; x.lineWidth = 6; x.globalAlpha = .55; x.beginPath(); x.moveTo(0, hz + 2); x.lineTo(w, hz + 2); x.stroke(); x.globalAlpha = 1;
  x.strokeStyle = INK; x.lineWidth = 3;
  if (b.decor === "moor") for (let i = 0; i < 7; i++) { const px = seeded(i + 40, salt) * w, py = hz + 20 + seeded(i + 50, salt) * (h - hz) * .9; x.fillStyle = "#6f8c86"; x.beginPath(); x.roundRect(px - 12, py - 30, 24, 34, [12, 12, 2, 2]); x.fill(); x.stroke(); x.fillStyle = INK; x.fillRect(px - 6, py - 20, 12, 3); x.fillRect(px - 1.5, py - 25, 3, 12); }
  if (b.decor === "frost") { x.strokeStyle = "#2b3d4f"; x.lineWidth = 5; for (const off of [-1, 1]) { x.beginPath(); x.moveTo(w / 2 + off * 30, hz); x.lineTo(w / 2 + off * w * .42, h); x.stroke(); } x.lineWidth = 4; for (let i = 0; i < 12; i++) { const t = i / 12, y = hz + (h - hz) * t * t; x.beginPath(); x.moveTo(w / 2 - (30 + (w * .42 - 30) * t * t) - 10, y); x.lineTo(w / 2 + (30 + (w * .42 - 30) * t * t) + 10, y); x.stroke(); } }
  if (b.decor === "grotto") for (let i = 0; i < 9; i++) { const px = seeded(i + 60, salt) * w, py = hz + 10 + seeded(i + 70, salt) * (h - hz) * .95; x.fillStyle = "#4a2a3a"; x.beginPath(); x.moveTo(px - 16, py); x.lineTo(px - 4, py - 22 - seeded(i, salt) * 20); x.lineTo(px + 6, py - 8); x.lineTo(px + 16, py); x.closePath(); x.fill(); x.stroke(); }
  if (b.decor === "carnival") for (let i = 0; i < 40; i++) { x.fillStyle = ["#ffd166", "#ff6b6b", "#8fd15a", "#74e6ff"][i % 4]; x.globalAlpha = .6; x.fillRect(seeded(i + 80, salt) * w, hz + seeded(i + 90, salt) * (h - hz), 6, 3); } x.globalAlpha = 1;
  if (b.decor === "swamp") for (let i = 0; i < 8; i++) { const px = seeded(i + 100, salt) * w, py = hz + 20 + seeded(i + 110, salt) * (h - hz) * .9; x.fillStyle = "#3f5f6e"; x.globalAlpha = .7; x.beginPath(); x.ellipse(px, py, 40 + seeded(i, salt) * 40, 10, 0, 0, TAU); x.fill(); x.fillStyle = "#9be36f"; x.beginPath(); x.ellipse(px - 10, py - 4, 14, 6, 0, 0, TAU); x.fill(); } x.globalAlpha = 1;
  if (b.decor === "rooftop") { for (let i = 0; i < 6; i++) { const px = seeded(i + 140, salt) * w, py = hz + 30 + seeded(i + 150, salt) * (h - hz) * .8; x.fillStyle = "#2b3552"; x.beginPath(); x.roundRect(px - 14, py - 26, 28, 30, [6, 6, 0, 0]); x.fill(); x.stroke(); x.fillStyle = "#ffe27a"; x.globalAlpha = .8; x.fillRect(px - 6, py - 18, 12, 8); x.globalAlpha = 1; } x.strokeStyle = "#141d3a"; x.lineWidth = 2; for (let i = 0; i < 4; i++) { const lx = seeded(i + 160, salt) * w; x.beginPath(); x.moveTo(lx, hz + 20); x.lineTo(lx, hz - 26); x.stroke(); } x.strokeStyle = "#dfe6f2"; x.globalAlpha = .5; for (let i = 0; i < 3; i++) { const y0 = hz + 40 + i * 50; x.beginPath(); x.moveTo(0, y0); x.quadraticCurveTo(w / 2, y0 + 26, w, y0); x.stroke(); } x.globalAlpha = 1; }
  if (b.decor === "library") { for (let i = 0; i < 7; i++) { const px = seeded(i + 140, salt) * w, py = hz + 26 + seeded(i + 150, salt) * (h - hz) * .85; x.fillStyle = "#4d3a24"; for (let bk = 0; bk < 3; bk++) { x.fillRect(px - 16 + bk * 4, py - 8 - bk * 7, 32 - bk * 6, 7); x.strokeRect(px - 16 + bk * 4, py - 8 - bk * 7, 32 - bk * 6, 7); } } x.fillStyle = "#c9a86a"; x.globalAlpha = .12; for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(seeded(i + 170, salt) * w, hz * .5 + seeded(i + 180, salt) * hz * .4, 30, 60, 0, 0, TAU); x.fill(); } x.globalAlpha = 1; }
  if (b.decor === "clock") { x.strokeStyle = "#5a4020"; x.lineWidth = 3; x.globalAlpha = .5; for (let yy = hz + 40; yy < h; yy += 70) { x.beginPath(); x.moveTo(0, yy); x.lineTo(w, yy + 6); x.stroke(); } for (let i = 0; i < 6; i++) { const px = seeded(i + 120, salt) * w, py = hz + 30 + seeded(i + 130, salt) * (h - hz) * .85; x.globalAlpha = .8; x.fillStyle = "#3a2a1c"; x.fillRect(px - 20, py - 26, 40, 30); x.fillStyle = "#c9a75a"; x.fillRect(px - 16, py - 22, 32, 6); } x.globalAlpha = 1; }
  cache.set(key, c); return c;
}
export function paintForeground(b: Biome, w: number, h: number, edgeless = false) {
  const key = `fg:${b.name}:${Math.round(w)}x${Math.round(h)}${edgeless ? ":open" : ""}`;
  const hit = cache.get(key); if (hit) return hit;
  const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d")!; const salt = b.name.length + 7;
  x.fillStyle = "#0e0a10";
  if (b.decor === "grotto" || b.decor === "frost") { if (!edgeless) for (const side of [0, 1]) { const bx = side ? w : 0, dir = side ? -1 : 1; x.beginPath(); x.moveTo(bx, h); for (let i = 0; i < 5; i++) { x.lineTo(bx + dir * (20 + i * 38 + seeded(i, salt) * 20), h - 90 - seeded(i + 5, salt) * 120 + i * 14); x.lineTo(bx + dir * (44 + i * 38), h - 40 - seeded(i + 9, salt) * 60); } x.lineTo(bx + dir * 220, h); x.fill(); } for (let i = 0; i < 6; i++) { const px = 150 + seeded(i + 20, salt) * (w - 300); x.beginPath(); x.moveTo(px - 24, h); x.lineTo(px - 6, h - 30 - seeded(i, salt) * 40); x.lineTo(px + 8, h - 12); x.lineTo(px + 26, h); x.fill(); } }
  else if (b.decor === "moor" || b.decor === "swamp") { if (!edgeless) for (const side of [0, 1]) { const bx = side ? w + 20 : -20, dir = side ? -1 : 1; x.lineCap = "round"; x.strokeStyle = "#0e0a10"; x.lineWidth = 26; x.beginPath(); x.moveTo(bx, h + 20); x.quadraticCurveTo(bx + dir * 60, h * .6, bx + dir * 40, h * .25); x.stroke(); x.lineWidth = 12; for (let i = 0; i < 4; i++) { const t = .35 + i * .15, sy = h + 20 - (h * .75 + 20) * t, sx = bx + dir * (60 * 2 * t * (1 - t) * 2 + 40 * t); x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + dir * 60, sy - 30 - i * 10, sx + dir * (110 + seeded(i, salt) * 50), sy - 10 + seeded(i + 3, salt) * 50); x.stroke(); } } for (let i = 0; i < 24; i++) { const px = seeded(i + 40, salt) * w; x.lineWidth = 3; x.beginPath(); x.moveTo(px, h + 4); x.quadraticCurveTo(px + (seeded(i, salt) - .5) * 20, h - 20, px + (seeded(i + 1, salt) - .5) * 30, h - 30 - seeded(i + 2, salt) * 30); x.stroke(); } }
  else if (b.decor === "carnival") { x.fillRect(0, h - 26, w, 30); for (let i = 0; i < w / 90; i++) { x.beginPath(); x.moveTo(i * 90, h - 26); x.lineTo(i * 90 + 45, h - 60); x.lineTo(i * 90 + 90, h - 26); x.fill(); } x.fillStyle = "#ffd166"; for (let i = 0; i < w / 45; i++) { x.beginPath(); x.arc(i * 45 + 22, h - 22, 3, 0, TAU); x.fill(); } }
  else if (b.decor === "rooftop") { if (!edgeless) for (const side of [0, 1]) { x.fillRect(side ? w - 46 : 0, h - 170, 46, 170); x.beginPath(); x.moveTo(side ? w - 46 : 0, h - 170); x.lineTo(side ? w - 23 : 23, h - 210); x.lineTo(side ? w : 46, h - 170); x.fill(); } x.strokeStyle = "#0e0a10"; x.lineWidth = 4; x.beginPath(); x.moveTo(w * .1, h - 140); x.lineTo(w * .1, h - 230); x.moveTo(w * .06, h - 210); x.lineTo(w * .14, h - 210); x.stroke(); }
  else if (b.decor === "library") { if (!edgeless) for (const side of [0, 1]) { x.fillRect(side ? w - 70 : 0, h - 230, 70, 230); for (let ry = 0; ry < 4; ry++) { x.fillStyle = "#241a10"; x.fillRect(side ? w - 62 : 8, h - 210 + ry * 56, 54, 5); x.fillStyle = "#0e0a10"; for (let bk = 0; bk < 4; bk++) x.fillRect(side ? w - 58 + bk * 13 : 12 + bk * 13, h - 206 + ry * 56 - 12, 10, 12); } } }
  else { if (!edgeless) for (const side of [0, 1]) { const bx = side ? w : 0, dir = side ? -1 : 1; x.fillRect(side ? w - 60 : 0, h - 200, 60, 200); for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(bx, h - 60 - i * 60); x.lineTo(bx + dir * 140, h - 60 - i * 60); x.lineTo(bx + dir * 140, h - 48 - i * 60); x.lineTo(bx, h - 48 - i * 60); x.fill(); x.beginPath(); x.arc(bx + dir * (100 + i * 20), h - 40 - i * 60, 16 + i * 4, 0, TAU); x.fill(); } } }
  cache.set(key, c); return c;
}
export function animatedDecor(ctx: CanvasRenderingContext2D, b: Biome, w: number, h: number, t: number) {
  const outlined = (fill: string, width = 4) => { ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = width; ctx.fill(); ctx.stroke(); };
  const hz = h * HORIZON;
  if (b.decor === "grotto") { for (let i = 0; i < 6; i++) { const x = (i + .5) * w / 6 + Math.sin(i) * 40, fl = Math.sin(t * .012 + i) * 7; ctx.fillStyle = "#ff8c4a"; ctx.globalAlpha = .75; ctx.beginPath(); ctx.moveTo(x - 18, hz); ctx.quadraticCurveTo(x - 10, hz - 26 - fl, x, hz - 44 - fl * 1.5); ctx.quadraticCurveTo(x + 12, hz - 20, x + 18, hz); ctx.fill(); ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.moveTo(x - 8, hz); ctx.quadraticCurveTo(x - 3, hz - 14 - fl, x + 1, hz - 22 - fl); ctx.quadraticCurveTo(x + 6, hz - 10, x + 8, hz); ctx.fill(); } ctx.globalAlpha = .18; ctx.fillStyle = "#ff8c4a"; ctx.fillRect(0, hz - 4, w, 10); for (let i = 0; i < 14; i++) { ctx.globalAlpha = .5; ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.arc((i * 131 + t * .01 * (1 + i % 3)) % w, hz - ((t * .03 * (1 + i % 2) + i * 60) % hz), 1.5 + i % 2, 0, TAU); ctx.fill(); } }
  else if (b.decor === "moor") { ctx.globalAlpha = .12; ctx.fillStyle = "#dfeee8"; for (let i = 0; i < 3; i++) { const y = hz + 20 + i * 60 + Math.sin(t * .0007 + i) * 10; ctx.beginPath(); ctx.ellipse((t * .02 * (i + 1)) % (w + 300) - 150, y, 240, 18, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; for (let i = 0; i < 12; i++) { const a = .3 + .7 * Math.abs(Math.sin(t * .003 + i * 1.7)); ctx.globalAlpha = a * .8; ctx.fillStyle = "#e6ffb0"; ctx.beginPath(); ctx.arc((i * 137 + t * .01) % w, hz + 30 + (i * 53) % (h - hz - 60) + Math.sin(t * .002 + i) * 12, 2.2, 0, TAU); ctx.fill(); } }
  else if (b.decor === "carnival") { ctx.save(); ctx.translate(w * .82, hz - hz * .45); ctx.rotate(t * .0004); ctx.strokeStyle = "#f2d9a5"; ctx.lineWidth = 4; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(0, 0, hz * .42, 0, TAU); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * hz * .42, Math.sin(a) * hz * .42); ctx.stroke(); ctx.fillStyle = ["#ffd166", "#ff6b6b", "#74e6ff"][i % 3]; ctx.beginPath(); ctx.arc(Math.cos(a) * hz * .42, Math.sin(a) * hz * .42, 9, 0, TAU); ctx.fill(); } ctx.restore(); for (let i = 0; i < w / 34; i++) { ctx.fillStyle = ["#ffd166", "#ff6b6b", "#8fd15a", "#74e6ff"][i % 4]; ctx.globalAlpha = Math.floor(t / 250 + i) % 3 === 0 ? .35 : 1; ctx.beginPath(); ctx.arc(i * 34 + 10, hz - 12 + Math.sin(i * .8) * 8, 4, 0, TAU); ctx.fill(); } }
  else if (b.decor === "frost") { ctx.fillStyle = "#f4fbff"; for (let i = 0; i < 60; i++) { const y = (t * .05 * (1 + i % 3 * .4) + i * 97) % h, x = (i * 173 + Math.sin(t * .001 + i) * 30) % w; ctx.globalAlpha = .35 + (i % 3) * .2; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, TAU); ctx.fill(); } }
  else if (b.decor === "swamp") { for (let i = 0; i < 16; i++) { const y = h - ((t * .04 * (1 + i % 3 * .3) + i * 130) % (h - hz)), x = (i * 211 + Math.sin(t * .002 + i) * 20) % w; ctx.strokeStyle = "#ffd7f0"; ctx.globalAlpha = .45; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 4 + i % 4, 0, TAU); ctx.stroke(); } }
  else if (b.decor === "clock") { // swinging pendulum + turning gear
    ctx.save(); ctx.translate(w * .5, 0); ctx.rotate(Math.sin(t * .0012) * .35); ctx.strokeStyle = "#2a1c12"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, hz * .75); ctx.stroke(); ctx.fillStyle = "#e8b25a"; ctx.beginPath(); ctx.arc(0, hz * .78, 22, 0, TAU); outlined("#e8b25a", 3); ctx.restore();
    ctx.save(); ctx.translate(w * .15, hz * .3); ctx.rotate(t * .0006); ctx.fillStyle = "#6b4a2c"; ctx.globalAlpha = .7; ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, rr = i % 2 ? 40 : 48; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
    for (let i = 0; i < 20; i++) { ctx.globalAlpha = .35; ctx.fillStyle = "#f2c14e"; const y = (t * .015 * (1 + i % 3 * .3) + i * 97) % h; ctx.fillRect((i * 173 + Math.sin(t * .001 + i) * 30) % w, y, 2, 2); } ctx.globalAlpha = 1;
  }
  else if (b.decor === "train") { // Phantom Express railway speed lines + smoke
    ctx.strokeStyle = "#8be9fd"; ctx.globalAlpha = .3; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const ly = hz + ((i * 45 + t * .2) % (h - hz));
      ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(w, ly); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  else if (b.decor === "crypt") { // Ghostly crypt glow
    ctx.fillStyle = "#bd93f9"; ctx.globalAlpha = .12;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.arc((i * 220 + t * .02) % w, hz * 0.7 + Math.sin(t * .002 + i) * 12, 40, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  else if (b.decor === "rooftop") { // rain streaks + far-away sheet lightning
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) {
      const y0 = hz + 42 + i * 52, sag = 24 + Math.sin(t * .004 + i) * 5;
      ctx.strokeStyle = "#dfe6f2"; ctx.globalAlpha = .4;
      ctx.beginPath(); ctx.moveTo(0, y0); ctx.quadraticCurveTo(w / 2, y0 + sag, w, y0); ctx.stroke();
      for (let sh = 0; sh < 7; sh++) {
        const sx = (sh + .5) * w / 7, k = Math.sin(Math.PI * (sh + .5) / 7);
        const ly = y0 + sag * k, sway = Math.sin(t * .006 + sh * 1.7 + i * 2) * 6 * k;
        ctx.fillStyle = sh % 3 === 0 ? "#ff9a6a" : sh % 3 === 1 ? "#e8dcd0" : "#8de1d4";
        ctx.globalAlpha = .5;
        ctx.beginPath(); ctx.moveTo(sx - 8, ly); ctx.lineTo(sx + 8, ly);
        ctx.lineTo(sx + 8 + sway, ly + 18); ctx.lineTo(sx - 8 + sway, ly + 18);
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#9fb4e8"; ctx.lineWidth = 1.5; ctx.globalAlpha = .35;
    for (let i = 0; i < 40; i++) { const rx = (i * 97 + t * .5) % w, ry = (i * 53 + t * .9) % h; ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke(); }
    ctx.globalAlpha = 1;
    if (Math.floor(t / 2600) % 3 === 0 && (t % 2600) < 140) { ctx.fillStyle = "#dfe6ff"; ctx.globalAlpha = .16; ctx.fillRect(0, 0, w, hz); ctx.globalAlpha = 1; }
    for (let i = 0; i < 3; i++) { const y0 = hz + 40 + i * 50, sway = Math.sin(t * .001 + i) * 14; ctx.strokeStyle = "#dfe6f2"; ctx.globalAlpha = .7; ctx.lineWidth = 2; for (let s = 0; s < 5; s++) { const sx = w * (s + .5) / 5 + sway; ctx.beginPath(); ctx.moveTo(sx - 6, y0 + 4); ctx.lineTo(sx - 6, y0 + 16); ctx.lineTo(sx + 6, y0 + 16); ctx.lineTo(sx + 6, y0 + 4); ctx.stroke(); } ctx.globalAlpha = 1; }
  } else if (b.decor === "library") { // dust motes + drifting glyphs + candle flicker
    for (let i = 0; i < 4; i++) {
      const cx = (i + .5) * w / 4, cy = hz + 16;
      const fl = .75 + Math.sin(t * .02 + i * 2.3) * .15 + Math.sin(t * .047 + i) * .1;
      ctx.fillStyle = "#ffb347"; ctx.globalAlpha = .85 * fl;
      ctx.beginPath(); ctx.ellipse(cx, cy - 7 * fl, 3, 6.5 * fl, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = .1 * fl;
      ctx.beginPath(); ctx.arc(cx, cy - 6, 17, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#e8d8b0"; for (let i = 0; i < 24; i++) { ctx.globalAlpha = .2 + (i % 3) * .12; const dy = (t * .012 * (1 + i % 3 * .3) + i * 91) % h; ctx.beginPath(); ctx.arc((i * 167 + Math.sin(t * .001 + i) * 26) % w, dy, 1.4 + i % 2, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = .3; ctx.strokeStyle = "#c9a86a"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const gx = (i * 331 + t * .02) % w, gy = hz * .3 + (i * 97) % (hz * .5) + Math.sin(t * .0015 + i) * 10; ctx.beginPath(); ctx.moveTo(gx - 5, gy + 6); ctx.lineTo(gx, gy - 6); ctx.lineTo(gx + 5, gy + 6); ctx.moveTo(gx - 3, gy); ctx.lineTo(gx + 3, gy); ctx.stroke(); }
    ctx.globalAlpha = 1;
  } else { // Devil's Inferno flames
    ctx.fillStyle = "#ff5555"; ctx.globalAlpha = .35;
    for (let i = 0; i < 14; i++) {
      const flX = (i * 90 + t * .04) % w;
      const flY = h - ((t * .08 + i * 40) % (h - hz));
      ctx.beginPath(); ctx.arc(flX, flY, 3 + (i % 3) * 2, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // sky critters: bats / crows
  ctx.globalAlpha = .8; ctx.strokeStyle = "#0e0a10"; ctx.lineWidth = 2.5; ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) { const speed = 25 + i * 9, x = ((t * .001 * speed + i * 300) % (w + 200)) - 100, y = hz * (.15 + (i % 3) * .2) + Math.sin(t * .003 + i) * 10, f = Math.sin(t * .02 + i * 2) * 5; ctx.beginPath(); ctx.moveTo(x - 10, y + f); ctx.quadraticCurveTo(x - 5, y - 4, x, y); ctx.quadraticCurveTo(x + 5, y - 4, x + 10, y + f); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

// ---------- player ----------
