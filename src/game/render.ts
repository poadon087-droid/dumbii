import { BIOMES, CHARACTERS, ENEMIES, POWERUPS, WEAPONS, skinFor } from "./data";
import { HORIZON } from "./engine";
import { type StyleId } from "./styles";
import { canStand, stageAt, worldOf, type StageDef } from "./world";
import { applyMood, drawDoorSign, drawStageProps, drawVoid } from "./props";
import type { Bullet, Enemy, GameState, Pickup, Player } from "./types";

type Ctx = CanvasRenderingContext2D;
import { animatedDecor, paintBackdrop, paintForeground, setSceneryStyle } from "./scenery";

const INK = "#1a1418";
const TAU = Math.PI * 2;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
let ctx: Ctx;
let frame = 0;
/** Stage size in CSS pixels — per-entity helpers (culling, organ lanes, hazards) get no w/h. */
let stageW = 1280;
let stageH = 720;
/** camera: world x of the left edge of the viewport, folded into onScreen() culling */
let camX = 0, camY = 0;
const boil = (i: number) => Math.sin(frame * 7.13 + i * 3.71) * .9;
/** Player-tunable visual switches, wired to the menu's Options screen. */
const fxo = { speedlines: true, contrast: false, dressing: true, style: "ink" as StyleId, text: "all" as TextMode };
export function setFxOpts(o: Partial<typeof fxo>) { Object.assign(fxo, o); }
/** How much the show is allowed to talk over itself:
 *  `all` — everything, as shipped; `quiet` — no damage pops or callouts floating over the fight;
 *  `none` — not one word on the stage: no pops, no banners, no signage, no nameplates. */
export type TextMode = "all" | "quiet" | "none";
/** true when a piece of writing may be painted at all */
const words = () => fxo.text !== "none";
/** true when floating combat text may be painted */
const pops = () => fxo.text === "all";
/* "pink means danger" is a colour that has to be seen to be read, so the game
   can move that language to cyan without touching a single gameplay value. */
/** the danger colour is part of the look: noir bleeds it to blood, riso prints it in cyan */
const styleAccent = () => (fxo.style === "noir" ? "#b91c1c" : fxo.style === "riso" ? "#00c8d7" : null);
const pinkC = () => styleAccent() ?? (fxo.contrast ? "#38e8ff" : "#ff7ad9");
const pinkHot = () => (fxo.contrast ? "#8ff4ff" : "#ff8ad3");

/** Two-bone IK limb with a real joint (knee/elbow): shoulder (ax,ay) to hand (tx,ty). */
function bone2(ax: number, ay: number, tx: number, ty: number, l1: number, l2: number, bend: number, width = 6, color = INK) {
  const ux = tx - ax, uy = ty - ay; let d = Math.hypot(ux, uy) || 1;
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + .01), l1 + l2 - .01);
  const nx = ux / (Math.hypot(ux, uy) || 1), ny = uy / (Math.hypot(ux, uy) || 1);
  const aa = (l1 * l1 - l2 * l2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, l1 * l1 - aa * aa));
  const mx = ax + nx * aa, my = ay + ny * aa;
  const ex = mx - ny * hh * bend, ey = my + nx * hh * bend;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.lineTo(tx, ty); ctx.stroke();
  return [ex, ey] as const;
}
function noodle(x1: number, y1: number, x2: number, y2: number, bend: number, width = 6, color = INK) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1;
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(mx - dy * bend + boil(x1), my + dx * bend + boil(y1), x2, y2); ctx.stroke();
}
function glove(x: number, y: number, r = 7, angle = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = "#fbf6ea"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(r * .55, -r * .5, r * .42, 0, TAU); ctx.arc(r * .8, r * .1, r * .42, 0, TAU); ctx.arc(r * .5, r * .65, r * .4, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.arc(r * .25, 0, r * .6, 0, TAU); ctx.fill(); ctx.restore();
}
function pieEye(x: number, y: number, rx: number, ry: number, tilt = 0, face = "#fbf6ea", closed = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  if (closed) { ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-rx, 0); ctx.quadraticCurveTo(0, ry * .6, rx, 0); ctx.stroke(); ctx.restore(); return; }
  ctx.scale(rx, ry); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 1, 0, TAU); ctx.fill();
  ctx.fillStyle = face; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1.02, -1.95, -.85); ctx.closePath(); ctx.fill(); ctx.restore();
}
function shoe(x: number, y: number, dir: number, color = "#b8672f") {
  ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + dir * 5, y, 12, 6.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff4dc"; ctx.beginPath(); ctx.ellipse(x + dir * 9, y - 2, 3, 1.6, 0, 0, TAU); ctx.fill();
}
function outlined(fill: string, width = 4) { ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = width; ctx.fill(); ctx.stroke(); }
/** Text labels are rasterized once per (text,color,size) and blitted — strokeText every frame is a major hotspot. */
const labelCache = new Map<string, HTMLCanvasElement>();
function label(text: string, x: number, y: number, size: number, color: string, rot = 0, stroke = 5) {
  const base = size > 26 ? 32 : 22, key = `${text}|${color}|${base}`;
  let c = labelCache.get(key);
  if (!c) {
    if (labelCache.size > 160) labelCache.clear();
    c = document.createElement("canvas"); const pad = 14; c.width = Math.ceil(text.length * base * .68) + pad * 2; c.height = base + pad * 2; const x2 = c.getContext("2d")!;
    x2.font = `900 ${base}px Impact, "Arial Black", sans-serif`; x2.textAlign = "center"; x2.textBaseline = "middle"; x2.lineJoin = "round"; x2.lineWidth = stroke; x2.strokeStyle = INK; x2.strokeText(text, c.width / 2, c.height / 2); x2.fillStyle = color; x2.fillText(text, c.width / 2, c.height / 2);
    labelCache.set(key, c);
  }
  const s = size / base; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
}
let lowFx = false;
/** Cheap glow: layered translucent discs instead of shadowBlur (which forces a slow GPU readback path). */
function glow(x: number, y: number, r: number, color: string, a = .35) { if (lowFx) return; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r * 1.8, 0, TAU); ctx.fill(); ctx.globalAlpha = a * .8; ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, TAU); ctx.fill(); ctx.restore(); }
const pathCache = new Map<string, Path2D>();
/** Path2D objects are parsed once and reused — rebuilding them per frame was a real hotspot. */
const cachedPath = (d: string) => {
  let p = pathCache.get(d);
  if (!p) { if (pathCache.size > 90) pathCache.clear(); p = new Path2D(d); pathCache.set(d, p); }
  return p;
};
function iconPath(d: string, x: number, y: number, scale: number, fill: string) {
  ctx.save(); ctx.translate(x - 32 * scale, y - 22 * scale); ctx.scale(scale, scale); const p = cachedPath(d); ctx.fillStyle = fill; ctx.strokeStyle = INK; ctx.lineWidth = 3 / scale; ctx.lineJoin = "round"; ctx.fill(p); ctx.stroke(p); ctx.restore();
}

// ---------- backdrop cache ----------
function drawWeaponSprite(key: string, charge: number) {
  const c = WEAPONS[key as keyof typeof WEAPONS].color; ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath();
  if (key === "popper") { ctx.roundRect(-4, -6, 26, 12, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, 5); ctx.lineTo(0, 15); ctx.lineTo(9, 15); ctx.lineTo(12, 5); ctx.fill(); ctx.stroke(); }
  else if (key === "choir") { ctx.moveTo(-8, -6); ctx.lineTo(27, -12); ctx.lineTo(31, 0); ctx.lineTo(-7, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(2, 5); ctx.lineTo(12, 17); ctx.lineTo(21, 15); ctx.lineTo(14, 3); ctx.fill(); ctx.stroke(); }
  else if (key === "note") { ctx.roundRect(-5, -5, 31, 10, 5); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(28, 0, 7 + Math.sin(frame * .6) * 1.5, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (key === "mortar") { ctx.arc(5, 0, 12, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(5, -8, 30, 16, 6); ctx.fill(); ctx.stroke(); }
  else if (key === "halo") { ctx.arc(14, 0, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.arc(14, 0, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (key === "kettle") { ctx.roundRect(-4, -9, 24, 18, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(20, -4); ctx.lineTo(34, -9); ctx.lineTo(32, -1); ctx.closePath(); ctx.fill(); ctx.stroke(); if (charge > .1) { ctx.fillStyle = `rgba(255,240,150,${.4 + charge * .5})`; ctx.beginPath(); ctx.arc(34, -5, 4 + charge * 12 + Math.sin(frame) * 2, 0, TAU); ctx.fill(); } }
  else if (key === "shard") { ctx.moveTo(-4, -7); ctx.lineTo(22, -7); ctx.lineTo(32, 0); ctx.lineTo(22, 7); ctx.lineTo(-4, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(24, -3); ctx.lineTo(29, 0); ctx.lineTo(24, 3); ctx.fill(); }
  else if (key === "lobber") { ctx.roundRect(-4, -7, 22, 14, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.arc(24, -2, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#9b86e0"; ctx.beginPath(); ctx.arc(21, -5, 3, 0, TAU); ctx.fill(); }
  else if (key === "fountain") { ctx.roundRect(-6, -8, 20, 16, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(34, -9); ctx.lineTo(34, 9); ctx.lineTo(14, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.arc(2, -12, 6, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (key === "peel") { ctx.roundRect(-4, -7, 24, 14, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#8a6a1c"; ctx.beginPath(); ctx.arc(22, 0, 5, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff3c4"; ctx.beginPath(); ctx.ellipse(6, -3, 5, 3, -.3, 0, TAU); ctx.fill(); }
  else if (key === "kazoo") { ctx.roundRect(-6, -6, 30, 12, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#e8a020"; ctx.beginPath(); ctx.arc(26, 0, 7, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(4, 6); ctx.moveTo(12, -6); ctx.lineTo(12, 6); ctx.stroke(); }
  else if (key === "barrel") { ctx.beginPath(); ctx.roundRect(-6, -11, 30, 22, 5); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, -11); ctx.lineTo(2, 11); ctx.moveTo(14, -11); ctx.lineTo(14, 11); ctx.stroke(); }
  else if (key === "syrup") { ctx.moveTo(-4, -9); ctx.lineTo(20, -9); ctx.lineTo(17, 10); ctx.lineTo(-1, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#7a4418"; ctx.fillRect(-6, -13, 28, 5); ctx.strokeRect(-6, -13, 28, 5); }
  else if (key === "whistle") { ctx.beginPath(); ctx.roundRect(-4, -6, 22, 12, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#c0c8d8"; ctx.beginPath(); ctx.arc(22, 0, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.quadraticCurveTo(-14, -14, -6, -18); ctx.stroke(); }
  else if (key === "umbrella") { ctx.strokeStyle = "#5a4030"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 12); ctx.lineTo(10, -6); ctx.stroke(); ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.quadraticCurveTo(10, -24, 26, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(6, -18); ctx.moveTo(18, -7); ctx.lineTo(14, -18); ctx.stroke(); }
  else if (key === "trio") { ctx.moveTo(-4, -8); ctx.lineTo(26, -12); ctx.lineTo(30, 0); ctx.lineTo(26, 12); ctx.lineTo(-4, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; for (const oy of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(26, oy, 2, 0, TAU); ctx.fill(); } }
  else if (key === "quill") { ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.moveTo(-4, -5); ctx.lineTo(30, -5); ctx.lineTo(44, 0); ctx.lineTo(30, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.moveTo(30, -4); ctx.lineTo(44, 0); ctx.lineTo(30, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#d84a45"; ctx.fillRect(4, -6, 6, 12); ctx.strokeRect(4, -6, 6, 12); }
  else if (key === "popcorn") { ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.moveTo(-4, -9); ctx.lineTo(24, -9); ctx.lineTo(20, 9); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) ctx.fillRect(2 + i * 7, -8, 3, 16); ctx.fillStyle = "#fff0b8"; for (const [px, py] of [[4, -13], [12, -16], [20, -12]]) { ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU); ctx.fill(); ctx.stroke(); } }
  else if (key === "trumpet") { ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-4, -4, 22, 8, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(18, -6); ctx.lineTo(36, -14); ctx.lineTo(36, 14); ctx.lineTo(18, 6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = .5; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(36, 0, 3, 12, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  else if (key === "mitt") { ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.roundRect(-4, -5, 16, 10, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(22, 0, 9, -Math.PI / 2 - .3, Math.PI / 2 + .3, true); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(22, 0, 12.5, -Math.PI / 2 - .3, Math.PI / 2 + .3, true); ctx.arc(22, 0, 5.5, Math.PI / 2 + .3, -Math.PI / 2 - .3); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.fillRect(28, -12, 6, 5); ctx.fillRect(28, 7, 6, 5); }
  else if (key === "anvil") { ctx.fillStyle = "#444b58"; ctx.beginPath(); ctx.roundRect(-4, -8, 28, 16, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#8a96a8"; ctx.beginPath(); ctx.moveTo(24, -8); ctx.lineTo(34, -4); ctx.lineTo(34, 4); ctx.lineTo(24, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  else if (key === "bubbles") { ctx.fillStyle = "#74f0ff"; ctx.beginPath(); ctx.roundRect(-4, -6, 26, 12, 6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(26, -2, 8, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (key === "boombox") { ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.roundRect(-6, -10, 30, 20, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(6, 0, 6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(18, 0, 6, 0, TAU); ctx.fill(); }
  else if (key === "grapple") { ctx.fillStyle = "#8a6a3a"; ctx.beginPath(); ctx.roundRect(-4, -5, 18, 10, 4); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(20, 0, 7, -1.2, 2.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(25, 4); ctx.lineTo(30, 8); ctx.stroke(); }
  else if (key === "slots") { ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.roundRect(-6, -9, 28, 18, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; for (let i = 0; i < 3; i++) ctx.fillRect(-2 + i * 8, -5, 6, 10); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(-2, -5, 6, 10); ctx.strokeRect(6, -5, 6, 10); ctx.strokeRect(14, -5, 6, 10); ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(26, -6, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (key === "paint") { ctx.fillStyle = "#c0c8d8"; ctx.beginPath(); ctx.roundRect(-4, -7, 20, 14, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(20, 0, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(24, -2); ctx.lineTo(30, 0); ctx.lineTo(24, 2); ctx.fill(); }
  else if (key === "pie") { ctx.fillStyle = "#e8b25a"; ctx.beginPath(); ctx.ellipse(14, 2, 14, 6, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff6e0"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(6 + i * 6, -2, 5, 0, TAU); ctx.fill(); ctx.stroke(); } }
  else if (key === "stamp") { ctx.fillStyle = "#7ee08a"; ctx.beginPath(); ctx.roundRect(-4, -8, 26, 16, 3); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(9, 0); ctx.lineTo(22, -8); ctx.stroke(); ctx.fillStyle = "#2a5a3a"; ctx.fillRect(14, -2, 6, 5); }
  else { ctx.fillStyle = "#c9863a"; ctx.beginPath(); ctx.roundRect(-4, -7, 24, 14, 4); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ff8ad3"; ctx.beginPath(); ctx.arc(24, 0, 10, 0, TAU); ctx.fill(); ctx.stroke(); }
}
// ---------- the rubber-hose rig ----------
/** Secondary-motion springs live in the renderer, never in game state, so update() stays pure
 *  and the headless harnesses keep running the sim with no drawing at all. */
function drawPlayer(p: Player, g: GameState) {
  const wk = g.weapons[g.active], dashing = p.dashTime > 0, ft = frame * 83;
  const bob = p.moving ? Math.abs(Math.sin(ft * .021)) * 5 : Math.sin(ft * .006) * 2;
  const stride = p.moving ? Math.sin(ft * .021) * 13 : 0;
  const flip = p.facing < 0, la = flip ? Math.PI - p.angle : p.angle;
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.globalAlpha = .28; ctx.fillStyle = "#0d0a10"; ctx.beginPath(); ctx.ellipse(0, 37, 24, 7, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  if (p.superTime > 0) { ctx.globalAlpha = .5 + Math.sin(frame) * .2; ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -2, 44 + Math.sin(frame * .8) * 4, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  if (p.shield > 0) { ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = "#8fd1ff"; ctx.fillStyle = "rgba(143,209,255,.12)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -4, 46, 0, TAU); ctx.fill(); ctx.stroke(); ctx.setLineDash([6, 8]); ctx.lineDashOffset = -frame * 2; ctx.beginPath(); ctx.arc(0, -4, 40, 0, TAU); ctx.stroke(); ctx.restore(); if (p.shield > 1) { ctx.fillStyle = "#8fd1ff"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -60); ctx.quadraticCurveTo(0, -78, 14, -60); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -50); ctx.stroke(); } }
  if (p.rapid > 0) { ctx.globalAlpha = .7; for (let i = 0; i < 3; i++) { const a = frame * .5 + i * 2.1; ctx.fillStyle = "#ff6a3d"; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 34, -8 + Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 34 + 4, -20 + Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 34 - 4, -16 + Math.sin(a) * 30); ctx.fill(); } ctx.globalAlpha = 1; }
  if (p.invuln > 0 && !dashing && frame % 2 === 0) ctx.globalAlpha = .45;
  const CH = CHARACTERS[p.character] ?? CHARACTERS.milo;
  const SKN = skinFor(p.character, p.skin);
  ctx.scale(flip ? -1 : 1, 1); ctx.translate(0, -bob); ctx.scale(CH.radius, CH.radius);
  const sq = p.squash; ctx.scale(1 + sq * .22, 1 - sq * .22); if (dashing) ctx.scale(1.18, .86);
  const lift = (s: number) => Math.max(0, s) * .5;
  bone2(-6, 16, -9 - stride, 34 - lift(-stride) + bob, 12, 13, -1, 6); shoe(-9 - stride, 36 - lift(-stride) + bob, -1);
  bone2(6, 16, 9 + stride, 34 - lift(stride) + bob, 12, 13, -1, 6); shoe(9 + stride, 36 - lift(stride) + bob, 1);
  ctx.beginPath(); ctx.moveTo(-14, -6); ctx.quadraticCurveTo(-18, 20, 0, 22); ctx.quadraticCurveTo(18, 20, 14, -6); ctx.closePath(); outlined(SKN.accent);
  ctx.beginPath(); ctx.moveTo(-15, 8); ctx.lineTo(15, 8); ctx.lineTo(13, 22); ctx.lineTo(-13, 22); ctx.closePath(); outlined("#2a2230", 3);
  ctx.fillStyle = "#f2c14e"; ctx.strokeStyle = INK; ctx.lineWidth = 2; for (const bx of [-5, 5]) { ctx.beginPath(); ctx.arc(bx, 12, 3, 0, TAU); ctx.fill(); ctx.stroke(); }
  const swing = Math.sin(ft * .021) * (p.moving ? 10 : 2);
  bone2(-11, 0, -25, 12 + swing, 11, 12, 1, 6); glove(-26, 14 + swing, 7, 0);
  ctx.beginPath(); ctx.ellipse(0, -22, 19, 19, 0, 0, TAU); outlined(SKN.head);
  const closed = p.blink < 0; pieEye(-6.5, -25, 4, 6.5, -.1, "#fbf6ea", closed); pieEye(6.5, -25, 4, 6.5, .1, "#fbf6ea", closed);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(1, -16, 8, .2, Math.PI - .2); ctx.stroke();
  ctx.fillStyle = "#f6b3a5"; ctx.beginPath(); ctx.arc(-13, -16, 3, 0, TAU); ctx.arc(13, -16, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(3, -20, 2.2, 0, TAU); ctx.fill();
  if (p.character === "dixie") {
    // beret with a showgirl feather
    ctx.beginPath(); ctx.ellipse(-1, -42, 17, 8, -.14, 0, TAU); outlined(SKN.trim, 3);
    ctx.fillStyle = "#ffd7f0"; ctx.beginPath(); ctx.arc(4, -46, 3.5, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = SKN.detail; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(6, -47); ctx.quadraticCurveTo(20, -62 + Math.sin(ft * .012) * 4, 26, -54); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { const tx = 10 + i * 4.5; ctx.beginPath(); ctx.moveTo(tx, -52 - i * 2.6); ctx.lineTo(tx + 4, -58 - i * 2.2); ctx.stroke(); }
  } else if (p.character === "barnaby") {
    // bowler on a broad brow
    ctx.beginPath(); ctx.ellipse(0, -38, 22, 5, 0, 0, TAU); outlined(SKN.trim, 3);
    ctx.beginPath(); ctx.roundRect(-13, -52, 26, 15, [8, 8, 2, 2]); outlined(SKN.trim, 3);
    ctx.fillStyle = SKN.detail; ctx.fillRect(-13, -41, 26, 3.5); ctx.strokeRect(-13, -41, 26, 3.5);
  } else if (p.character === "coco") {
    // broad cabaret brim, a crown like a lit marquee, and a plume that keeps its own time
    ctx.beginPath(); ctx.ellipse(0, -40, 25, 6.5, -.06, 0, TAU); outlined(SKN.trim, 3);
    ctx.beginPath(); ctx.moveTo(-11, -41); ctx.quadraticCurveTo(-13, -56, 0, -57); ctx.quadraticCurveTo(13, -56, 11, -41); ctx.closePath(); outlined(SKN.trim, 3);
    ctx.fillStyle = SKN.detail; ctx.fillRect(-11, -44, 22, 3.2); ctx.strokeRect(-11, -44, 22, 3.2);
    ctx.strokeStyle = SKN.detail; ctx.lineWidth = 3; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(8, -52); ctx.quadraticCurveTo(22, -66 + Math.sin(ft * .011) * 4, 30, -56); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    for (let i = 0; i < 4; i++) { const tx = 14 + i * 4.4; ctx.beginPath(); ctx.moveTo(tx, -58 - i * 2.2); ctx.lineTo(tx + 4, -63 - i * 1.8); ctx.stroke(); }
    ctx.fillStyle = SKN.detail; for (const bx of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(bx, -42.5, 1.5, 0, TAU); ctx.fill(); }
  } else if (p.character === "rusty") {
    // riveted helm with a goggle strap: the lenses catch the light when he turns
    ctx.beginPath(); ctx.moveTo(-15, -36); ctx.quadraticCurveTo(-16, -54, 0, -55); ctx.quadraticCurveTo(16, -54, 15, -36); ctx.closePath(); outlined(SKN.trim, 3);
    ctx.fillStyle = SKN.detail; ctx.fillRect(-15, -40, 30, 3.4); ctx.strokeRect(-15, -40, 30, 3.4);
    ctx.fillStyle = "rgba(20,16,20,.85)"; ctx.beginPath(); ctx.rect(-13, -36, 26, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = SKN.detail; ctx.beginPath(); ctx.arc(-6, -33, 3.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(7, -33, 3.4, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.beginPath(); ctx.arc(-7, -34, 1.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(6, -34, 1.1, 0, TAU); ctx.fill();
    ctx.fillStyle = INK; for (const rx of [-11, 0, 11]) { ctx.beginPath(); ctx.arc(rx, -47, 1.4, 0, TAU); ctx.fill(); }
  } else {
    ctx.beginPath(); ctx.roundRect(-13, -47, 26, 11, 3); outlined(SKN.trim, 3); ctx.fillStyle = SKN.detail; ctx.fillRect(-13, -39, 26, 2.5); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-13, -36); ctx.quadraticCurveTo(0, -30, 13, -36); ctx.stroke();
  }
  if (p.character === "barnaby") { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-8, -12); ctx.quadraticCurveTo(0, -8, 8, -12); ctx.stroke(); }
  if (p.character === "dixie") { ctx.fillStyle = SKN.trim; for (const ex of [-13, 13]) { ctx.beginPath(); ctx.arc(ex, -16, 2.6, 0, TAU); ctx.fill(); } }
  const kick = p.recoil * 7;
  const hx = Math.cos(la) * (26 - kick), hy = -4 + Math.sin(la) * (26 - kick);
  bone2(11, -1, hx, hy, 13, 13, -1, 6); ctx.save(); ctx.translate(hx, hy); ctx.rotate(la); drawWeaponSprite(wk, p.charge); ctx.restore();
  // muzzle flash: a shape per family, gone in a blink — star for rifles, cones for blast, rings for sound
  if (p.recoil > .55 && wk !== "candle" && wk !== "whistle" && wk !== "harp" && wk !== "quill") {
    const k = (p.recoil - .55) / .45, fx2 = hx + Math.cos(la) * 30, fy2 = hy + Math.sin(la) * 30;
    ctx.save(); ctx.translate(fx2, fy2); ctx.rotate(la); ctx.globalAlpha = k;
    const col = WEAPONS[wk]?.color ?? "#ffd75a";
    if (wk === "choir" || wk === "fountain" || wk === "sprinkler") {
      ctx.fillStyle = col; ctx.strokeStyle = "#fff6da"; ctx.lineWidth = 2;
      for (const da of [-.5, 0, .5]) { ctx.save(); ctx.rotate(da); ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(16 + k * 8, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    } else if (wk === "boombox" || wk === "trumpet" || wk === "phonograph") {
      ctx.strokeStyle = col; ctx.lineWidth = 3; for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(0, 0, 8 * i + k * 6, -1, 1); ctx.stroke(); }
    } else {
      ctx.fillStyle = "#fff6da"; ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? 5 : 13 + k * 7, aa = i / 8 * TAU; ctx.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  glove(hx, hy, 6.5, la);
  if (p.parryFlash > 0) { const k = p.parryFlash > .16 ? 1 : p.parryFlash / .16; ctx.globalAlpha = k; glove(Math.cos(la) * 48, -8 + Math.sin(la) * 48, 12, la + 1); ctx.strokeStyle = "#ff8ad3"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(Math.cos(la) * 30, -6 + Math.sin(la) * 30, 34, la - 1.2, la + 1.2); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.restore();
}

// ---------- enemies ----------
function drawEnemy(e: Enemy, g: GameState) {
  const def = ENEMIES[e.kind], ft = frame * 83 + e.phase * 1000, bob = Math.sin(ft * .008) * (e.kind === "wisp" || e.kind === "bloat" || e.kind === "hex" ? 8 : 2);
  const x = e.x, y = e.y + bob, s = e.size, closed = e.blink < 0;
  ctx.save();
  if (e.kind === "nut" && e.airborne > 0) { const k = 1 - e.airborne / 1.3; ctx.globalAlpha = .25 + k * .3; ctx.fillStyle = "#0d0a10"; ctx.beginPath(); ctx.ellipse(e.x, e.y + 12, 10 + k * 26, 4 + k * 9, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.translate(0, -e.airborne * 520); }
  else { ctx.globalAlpha = .26; ctx.fillStyle = "#0d0a10"; ctx.beginPath(); ctx.ellipse(x, e.y + e.r + 10, e.r * 1.1, e.r * .32, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  if (e.elite) { ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = "#ffd75a"; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.lineDashOffset = frame * 3; ctx.beginPath(); ctx.arc(x, y, e.r + 14, 0, TAU); ctx.stroke(); ctx.restore(); for (let i = 0; i < 3; i++) { const a = frame * .3 + i * 2.1; ctx.fillStyle = "#ffd75a"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); const sx = x + Math.cos(a) * (e.r + 16), sy = y + Math.sin(a) * (e.r + 10); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx + 2, sy - 2); ctx.lineTo(sx + 6, sy); ctx.lineTo(sx + 2, sy + 2); ctx.lineTo(sx, sy + 6); ctx.lineTo(sx - 2, sy + 2); ctx.lineTo(sx - 6, sy); ctx.lineTo(sx - 2, sy - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.fillStyle = "#ffd75a"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, y - e.r - 12); ctx.lineTo(x - 8, y - e.r - 26); ctx.lineTo(x - 2, y - e.r - 16); ctx.lineTo(x, y - e.r - 30); ctx.lineTo(x + 2, y - e.r - 16); ctx.lineTo(x + 8, y - e.r - 26); ctx.lineTo(x + 12, y - e.r - 12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (e.attack > 0 && (e.kind === "lugger" || e.kind === "wisp" || e.kind === "boss")) { const pulse = 1 + Math.sin(frame * 1.2) * .12; ctx.strokeStyle = e.kind === "boss" ? "#ffd166" : "#ff6659"; ctx.lineWidth = 3; ctx.globalAlpha = .75; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(x, y, (e.r + 12) * pulse, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    if (e.kind === "lugger" && e.attack > .4) { ctx.strokeStyle = "#ff6659"; ctx.lineWidth = 5; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + e.vx * 220, y + e.vy * 220); ctx.stroke(); ctx.globalAlpha = 1; } }
  if (e.pink) glow(x, y, e.r, pinkC(), .3);
  if (e.buffed > 0) { ctx.strokeStyle = "#f0b24a"; ctx.lineWidth = 2; ctx.globalAlpha = .7; for (let i = 0; i < 3; i++) { const a = frame * .4 + i * 2.1; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (e.r + 6), y + Math.sin(a) * (e.r + 6)); ctx.lineTo(x + Math.cos(a) * (e.r + 14), y + Math.sin(a) * (e.r + 14)); ctx.stroke(); } ctx.globalAlpha = 1; }
  if (e.kind === "eel" && e.segments) { const segs = e.segments; for (let i = segs.length - 1; i >= 0; i--) { const s = segs[i], r = 13 - i * .9; ctx.fillStyle = i % 2 ? "#3d3a6e" : "#4d4a86"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.x, s.y + Math.sin(frame * .6 + i) * 2, r, 0, TAU); ctx.fill(); ctx.stroke(); if (i === segs.length - 1) { ctx.fillStyle = "#3d3a6e"; ctx.beginPath(); ctx.moveTo(s.x - 6, s.y); ctx.lineTo(s.x - 18, s.y - 10 + Math.sin(frame) * 4); ctx.lineTo(s.x - 18, s.y + 10); ctx.closePath(); ctx.fill(); ctx.stroke(); } } }
  if (e.alpha < 1) ctx.globalAlpha = e.alpha;
  if (e.phased) ctx.globalAlpha *= .35;
  // Cheap hit-flash: a squash-pop plus a white core wash. The old `ctx.filter = "brightness()"`
  // route forced a filtered offscreen composite for every damaged creep on screen.
  if (e.hit > 0) { const k = Math.min(1, e.hit / .12) * .18; ctx.translate(x, y); ctx.scale(1 + k, 1 - k * .7); ctx.translate(-x, -y); }
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  if (e.kind === "daisy") {
    noodle(x - 6, y + 10, x - 10 + Math.sin(ft * .02) * 7, y + 24, .3, 4); noodle(x + 6, y + 10, x + 10 - Math.sin(ft * .02) * 7, y + 24, -.3, 4);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + ft * .002; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 15 * s, y + Math.sin(a) * 15 * s, 8 * s, 5 * s, a, 0, TAU); outlined(def.color, 3); }
    ctx.beginPath(); ctx.arc(x, y, 12 * s, 0, TAU); outlined("#fbe7a1", 3); pieEye(x - 4, y - 2, 2.6, 4, -.3, "#fbe7a1", closed); pieEye(x + 4, y - 2, 2.6, 4, .3, "#fbe7a1", closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y - 7); ctx.lineTo(x - 2, y - 5); ctx.moveTo(x + 8, y - 7); ctx.lineTo(x + 2, y - 5); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 4, 5, .1, Math.PI - .1); ctx.stroke();
  } else if (e.kind === "wisp") {
    ctx.beginPath(); ctx.moveTo(x, y - 22); ctx.bezierCurveTo(x + 26, y - 12, x + 22, y + 10, x + 8 + Math.sin(ft * .01) * 6, y + 26); ctx.quadraticCurveTo(x, y + 14, x - 8 - Math.sin(ft * .01) * 6, y + 26); ctx.bezierCurveTo(x - 22, y + 10, x - 26, y - 12, x, y - 22); outlined(def.color);
    noodle(x - 12, y + 2, x - 24, y + 10, .3, 4); glove(x - 25, y + 11, 5); noodle(x + 12, y + 2, x + 24, y + 10, -.3, 4); glove(x + 25, y + 11, 5);
    pieEye(x - 7, y - 6, 3.5, 5, .3, def.color, closed); pieEye(x + 7, y - 6, 3.5, 5, -.3, def.color, closed);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - 10, y + 4); ctx.lineTo(x + 10, y + 4); ctx.lineTo(x + 7, y + 12); ctx.lineTo(x - 7, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1.5; for (const tx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(x + tx, y + 4); ctx.lineTo(x + tx, y + 12); ctx.stroke(); }
  } else if (e.kind === "lugger") {
    noodle(x - 18, y + 18, x - 22, y + 36, .2, 8); shoe(x - 24, y + 38, -1, "#4a3527"); noodle(x + 18, y + 18, x + 22, y + 36, -.2, 8); shoe(x + 24, y + 38, 1, "#4a3527");
    ctx.beginPath(); ctx.moveTo(x - 24, y - 22); ctx.quadraticCurveTo(x - 34, y, x - 24, y + 22); ctx.lineTo(x + 24, y + 22); ctx.quadraticCurveTo(x + 34, y, x + 24, y - 22); ctx.closePath(); outlined(def.color);
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 5; for (const oy of [-12, 12]) { ctx.beginPath(); ctx.moveTo(x - 29, y + oy); ctx.lineTo(x + 29, y + oy); ctx.stroke(); }
    const arm = e.attack > .4 ? -16 : 6; noodle(x - 26, y - 4, x - 40, y + arm, .4, 8); glove(x - 42, y + arm, 10); noodle(x + 26, y - 4, x + 40, y + arm, -.4, 8); glove(x + 42, y + arm, 10);
    pieEye(x - 9, y - 4, 4, 6, -.2, def.color, closed); pieEye(x + 9, y - 4, 4, 6, .2, def.color, closed); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 15, y - 13); ctx.lineTo(x - 4, y - 9); ctx.moveTo(x + 15, y - 13); ctx.lineTo(x + 4, y - 9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 10, y + 8); ctx.lineTo(x + 10, y + 8); ctx.stroke();
  } else if (e.kind === "toad") {
    const puffT = e.attack > 0 ? 1.4 : 1; ctx.beginPath(); ctx.ellipse(x, y + 6, 22, 16 * puffT, 0, 0, TAU); outlined("#d6e8a0"); ctx.beginPath(); ctx.ellipse(x, y - 4, 22, 16, 0, 0, TAU); outlined(def.color);
    for (const sx of [-10, 10]) { ctx.beginPath(); ctx.arc(x + sx, y - 16, 8, 0, TAU); outlined(def.color, 3); pieEye(x + sx, y - 16, 4, 4.5, 0, def.color, closed); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 14, y + 2); ctx.quadraticCurveTo(x, y + 10, x + 14, y + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 8, y + 12); ctx.lineTo(x, y + 16); ctx.lineTo(x + 8, y + 12); ctx.lineTo(x, y + 20); ctx.closePath(); outlined("#d84a45", 2);
    noodle(x - 18, y + 8, x - 26, y + 22, .3, 4); noodle(x + 18, y + 8, x + 26, y + 22, -.3, 4);
  } else if (e.kind === "cap") {
    if (!e.hidden) { ctx.beginPath(); ctx.roundRect(x - 12, y - 4, 24, 26, 8); outlined("#f3e2b8"); pieEye(x - 5, y + 4, 3, 4.5, 0, "#f3e2b8", closed); pieEye(x + 5, y + 4, 3, 4.5, 0, "#f3e2b8", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 11, 4, 0, Math.PI); ctx.stroke(); }
    const cy = e.hidden ? y + 10 : y - 8, ch = e.hidden ? 14 : 20; ctx.beginPath(); ctx.ellipse(x, cy, 26, ch, 0, Math.PI, 0); ctx.lineTo(x + 26, cy + 4); ctx.lineTo(x - 26, cy + 4); ctx.closePath(); outlined(def.color);
    ctx.fillStyle = "#fff4dc"; for (const [sx, sy, sr] of [[-12, -8, 4], [4, -12, 5], [16, -4, 3.5]]) { ctx.beginPath(); ctx.arc(x + sx, cy + sy * (ch / 20), sr, 0, TAU); ctx.fill(); }
    if (e.hidden) { pieEye(x - 8, cy + 1, 2.5, 3, 0, def.color); pieEye(x + 8, cy + 1, 2.5, 3, 0, def.color); }
  } else if (e.kind === "bloat") {
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 20); ctx.quadraticCurveTo(x + 6 + Math.sin(ft * .01) * 5, y + 30, x - 2, y + 42); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, 19, 22, 0, 0, TAU); outlined(e.pink ? "#ff8ad3" : def.color); ctx.beginPath(); ctx.moveTo(x - 4, y + 20); ctx.lineTo(x + 4, y + 20); ctx.lineTo(x, y + 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(x - 7, y - 10, 4, 7, .5, 0, TAU); ctx.fill();
    pieEye(x - 6, y - 4, 3, 5, -.25, e.pink ? "#ff8ad3" : def.color, closed); pieEye(x + 6, y - 4, 3, 5, .25, e.pink ? "#ff8ad3" : def.color, closed); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 10, y - 12); ctx.lineTo(x - 3, y - 9); ctx.moveTo(x + 10, y - 12); ctx.lineTo(x + 3, y - 9); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 8, 6, Math.PI + .3, TAU - .3); ctx.stroke();
  } else if (e.kind === "gloop") {
    const wob = 1 + Math.sin(ft * .015) * .12; ctx.beginPath(); ctx.ellipse(x, y + 4 * s, 20 * s * wob, 17 * s / wob, 0, 0, TAU); outlined(def.color);
    ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.ellipse(x - 7 * s, y - 4 * s, 5 * s, 3 * s, -.4, 0, TAU); ctx.fill();
    pieEye(x - 6 * s, y - 1, 3 * s, 4.5 * s, 0, def.color, closed); pieEye(x + 6 * s, y - 1, 3 * s, 4.5 * s, 0, def.color, closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 8 * s, 5 * s, .2, Math.PI - .2); ctx.stroke();
  } else if (e.kind === "nut") {
    noodle(x - 6, y + 12, x - 9 + Math.sin(ft * .02) * 6, y + 26, .3, 4); noodle(x + 6, y + 12, x + 9 - Math.sin(ft * .02) * 6, y + 26, -.3, 4);
    ctx.beginPath(); ctx.moveTo(x - 15, y - 6); ctx.quadraticCurveTo(x - 16, y + 18, x, y + 20); ctx.quadraticCurveTo(x + 16, y + 18, x + 15, y - 6); ctx.closePath(); outlined("#d99a5b");
    ctx.beginPath(); ctx.ellipse(x, y - 8, 18, 9, 0, 0, TAU); outlined(def.color); ctx.fillStyle = INK; ctx.fillRect(x - 2, y - 24, 4, 9);
    pieEye(x - 5, y + 2, 2.6, 4, 0, "#d99a5b", closed); pieEye(x + 5, y + 2, 2.6, 4, 0, "#d99a5b", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 9, 4, 0, Math.PI); ctx.stroke();
  } else if (e.kind === "hex") {
    ctx.beginPath(); ctx.moveTo(x - 20, y + 26); ctx.lineTo(x, y - 10); ctx.lineTo(x + 20, y + 26); ctx.closePath(); outlined(def.color);
    ctx.beginPath(); ctx.arc(x, y - 12, 14, 0, TAU); outlined("#f3e2c8"); pieEye(x - 5, y - 14, 3, 4.5, 0, "#f3e2c8", closed); pieEye(x + 5, y - 14, 3, 4.5, 0, "#f3e2c8", closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 9, y - 6); ctx.quadraticCurveTo(x - 4, y - 2, x, y - 5); ctx.quadraticCurveTo(x + 4, y - 2, x + 9, y - 6); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - 11, y - 44, 22, 20); outlined("#1f1a24", 3); ctx.beginPath(); ctx.rect(x - 17, y - 26, 34, 5); outlined("#1f1a24", 3); ctx.fillStyle = "#d84a45"; ctx.fillRect(x - 11, y - 30, 22, 4);
    const fl = Math.sin(ft * .012) * 6; glove(x - 30, y + fl, 6, -.4); glove(x + 30, y - fl, 6, .4);
  } else if (e.kind === "eel") {
    ctx.beginPath(); ctx.ellipse(x, y, 17, 13, 0, 0, TAU); outlined("#4d4a86");
    ctx.beginPath(); ctx.moveTo(x - 6, y - 12); ctx.lineTo(x, y - 24); ctx.lineTo(x + 6, y - 12); ctx.closePath(); outlined("#ff5aa5", 3);
    pieEye(x - 6, y - 3, 3.2, 4.5, -.3, "#4d4a86", closed); pieEye(x + 6, y - 3, 3.2, 4.5, .3, "#4d4a86", closed);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - 10, y + 5); ctx.lineTo(x + 10, y + 5); ctx.lineTo(x + 6, y + 12); ctx.lineTo(x - 6, y + 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.lineWidth = 1.5; for (const tx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(x + tx, y + 5); ctx.lineTo(x + tx, y + 12); ctx.stroke(); }
  } else if (e.kind === "jack") {
    const sprung = e.attack > 0; const bx = x, by = sprung ? y + 30 : y + 8;
    ctx.beginPath(); ctx.roundRect(bx - 18, by - 10, 36, 26, 3); outlined("#c9863a"); ctx.fillStyle = "#e8c34a"; ctx.fillRect(bx - 18, by - 10, 36, 6); ctx.strokeRect(bx - 18, by - 10, 36, 6);
    if (sprung) { ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 6; i++) { ctx.lineTo(bx + (i % 2 ? 10 : -10), by - 12 - i * 8); } ctx.stroke(); }
    const hy = sprung ? y - 26 : y - 6; ctx.beginPath(); ctx.arc(bx, hy, 15, 0, TAU); outlined("#fbf6ea");
    ctx.beginPath(); ctx.moveTo(bx - 14, hy - 6); ctx.lineTo(bx - 4, hy - 30); ctx.lineTo(bx + 4, hy - 12); ctx.lineTo(bx + 14, hy - 6); ctx.closePath(); outlined("#d84a45", 3); ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.arc(bx - 4, hy - 30, 4, 0, TAU); ctx.fill(); ctx.stroke();
    pieEye(bx - 5, hy - 2, 3, sprung ? 5.5 : 4, 0, "#fbf6ea", closed && !sprung); pieEye(bx + 5, hy - 2, 3, sprung ? 5.5 : 4, 0, "#fbf6ea", closed && !sprung);
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(bx, hy + 4, 7, .2, Math.PI - .2); ctx.stroke(); ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.arc(bx, hy + 3, 2.5, 0, TAU); ctx.fill();
  } else if (e.kind === "spider") {
    for (let i = 0; i < 4; i++) { const sw = Math.sin(ft * .02 + i * 1.5) * 5; noodle(x - 8, y + i * 3 - 4, x - 26 - i * 3, y + 4 + i * 7 + sw, .4, 3.5); noodle(x + 8, y + i * 3 - 4, x + 26 + i * 3, y + 4 + i * 7 - sw, -.4, 3.5); }
    ctx.beginPath(); ctx.ellipse(x, y + 4, 18, 15, 0, 0, TAU); outlined(def.color); ctx.fillStyle = "#d84a45"; for (const [sx, sy] of [[-7, 2], [6, -3], [1, 9]]) { ctx.beginPath(); ctx.arc(x + sx, y + sy, 3.5, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 12, y - 4); ctx.lineTo(x + 12, y - 4); ctx.moveTo(x - 10, y + 12); ctx.lineTo(x + 10, y + 12); ctx.stroke();
    for (const [sx, sy] of [[-6, -6], [6, -6], [-3, -11], [3, -11]]) pieEye(x + sx, y + sy, 2.4, 3, 0, def.color, closed);
  } else if (e.kind === "mime") {
    noodle(x - 6, y + 14, x - 9 + Math.sin(ft * .02) * 6, y + 30, .3, 5); shoe(x - 9, y + 32, -1, "#1f1a24"); noodle(x + 6, y + 14, x + 9 - Math.sin(ft * .02) * 6, y + 30, -.3, 5); shoe(x + 9, y + 32, 1, "#1f1a24");
    ctx.beginPath(); ctx.roundRect(x - 13, y - 8, 26, 26, 8); outlined("#1f1a24"); ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; for (const oy of [-2, 5, 12]) { ctx.beginPath(); ctx.moveTo(x - 12, y + oy); ctx.lineTo(x + 12, y + oy); ctx.stroke(); }
    const ax = Math.sin(ft * .01) * 6; noodle(x - 12, y - 2, x - 28, y - 10 + ax, .4, 5); glove(x - 30, y - 12 + ax, 6); noodle(x + 12, y - 2, x + 28, y - 10 - ax, -.4, 5); glove(x + 30, y - 12 - ax, 6);
    ctx.beginPath(); ctx.arc(x, y - 22, 15, 0, TAU); outlined("#fbf6ea"); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y - 34, 16, 4, 0, 0, TAU); ctx.fill(); ctx.fillRect(x - 10, y - 46, 20, 12);
    pieEye(x - 5, y - 24, 3, 4.5, 0, "#fbf6ea", closed); pieEye(x + 5, y - 24, 3, 4.5, 0, "#fbf6ea", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y - 32); ctx.lineTo(x - 5, y - 16); ctx.stroke(); ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.arc(x, y - 14, 2.5, 0, TAU); ctx.fill();
  } else if (e.kind === "bell") {
    noodle(x - 8, y + 18, x - 10, y + 34, .2, 6); shoe(x - 10, y + 36, -1, "#1f1a24"); noodle(x + 8, y + 18, x + 10, y + 34, -.2, 6); shoe(x + 10, y + 36, 1, "#1f1a24");
    ctx.beginPath(); ctx.roundRect(x - 16, y - 10, 32, 30, 6); outlined("#d84a45"); ctx.fillStyle = "#f2c14e"; for (const bx of [-8, 0, 8]) { ctx.beginPath(); ctx.arc(x + bx, y + 4, 3, 0, TAU); ctx.fill(); }
    ctx.beginPath(); ctx.arc(x, y - 22, 14, 0, TAU); outlined("#fbf6ea"); ctx.beginPath(); ctx.roundRect(x - 12, y - 42, 24, 10, 2); outlined("#d84a45", 3); ctx.fillStyle = "#f2c14e"; ctx.fillRect(x - 12, y - 34, 24, 2);
    pieEye(x - 5, y - 23, 3, 4.5, 0, "#fbf6ea", closed); pieEye(x + 5, y - 23, 3, 4.5, 0, "#fbf6ea", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y - 18, 6, .2, Math.PI - .2); ctx.stroke();
    const ring_ = e.attack > 0 ? Math.sin(frame * 2) * .4 : 0; ctx.save(); ctx.translate(x + 26, y - 8); ctx.rotate(ring_); noodle(-14, 0, 0, 0, 0, 5); ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-10, -16, 0, -16); ctx.quadraticCurveTo(10, -16, 10, 4); ctx.closePath(); outlined("#f0b24a", 3); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 6, 3, 0, TAU); ctx.fill(); ctx.restore();
  } else if (e.kind === "ghoul") {
    const r = 18; ctx.beginPath(); ctx.moveTo(x - r, y + r); ctx.lineTo(x - r, y - r * .2); ctx.arc(x, y - r * .2, r, Math.PI, 0); ctx.lineTo(x + r, y + r); for (let i = 0; i < 4; i++) ctx.lineTo(x + r - (i + .5) * r / 2, y + r * (i % 2 ? .75 : 1.15) + Math.sin(ft * .02 + i) * 3); ctx.closePath(); outlined(def.color);
    noodle(x - 14, y, x - 26, y + 8 + Math.sin(ft * .012) * 5, .3, 4); glove(x - 27, y + 9, 5); noodle(x + 14, y, x + 26, y + 8 - Math.sin(ft * .012) * 5, -.3, 4); glove(x + 27, y + 9, 5);
    if (e.revived) { ctx.strokeStyle = INK; ctx.lineWidth = 2.5; for (const sx of [-6, 6]) { ctx.beginPath(); ctx.moveTo(x + sx - 3, y - 9); ctx.lineTo(x + sx + 3, y - 3); ctx.moveTo(x + sx + 3, y - 9); ctx.lineTo(x + sx - 3, y - 3); ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y + 6, 7, Math.PI + .3, TAU - .3); ctx.stroke(); }
    else { pieEye(x - 6, y - 6, 3.4, 5, 0, def.color, closed); pieEye(x + 6, y - 6, 3.4, 5, 0, def.color, closed); ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(x, y + 6, 4, 6, 0, 0, TAU); ctx.fill(); }
  } else if (e.kind === "candle") {
    const run = Math.sin(ft * .03) * 9; noodle(x - 5, y + 14, x - 8 - run, y + 28, .3, 4); shoe(x - 8 - run, y + 30, -1, "#4a3527"); noodle(x + 5, y + 14, x + 8 + run, y + 28, -.3, 4); shoe(x + 8 + run, y + 30, 1, "#4a3527");
    ctx.beginPath(); ctx.roundRect(x - 11, y - 12, 22, 30, 4); outlined("#fbf0d0"); ctx.fillStyle = "#f6dfa8"; ctx.beginPath(); ctx.moveTo(x - 11, y - 12); ctx.quadraticCurveTo(x - 6, y - 2, x - 11, y + 4); ctx.lineTo(x - 11, y - 12); ctx.fill();
    pieEye(x - 4, y - 2, 2.6, 4, 0, "#fbf0d0", closed); pieEye(x + 4, y - 2, 2.6, 4, 0, "#fbf0d0", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 6, 4, .1, Math.PI - .1); ctx.stroke();
    const fl = Math.sin(ft * .04) * 4; ctx.fillStyle = "#ff8c4a"; ctx.beginPath(); ctx.moveTo(x - 7, y - 12); ctx.quadraticCurveTo(x - 4 + fl, y - 26, x, y - 34 - fl); ctx.quadraticCurveTo(x + 5, y - 24, x + 7, y - 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.moveTo(x - 3, y - 12); ctx.quadraticCurveTo(x - 1 + fl * .5, y - 20, x, y - 24); ctx.quadraticCurveTo(x + 2, y - 19, x + 3, y - 12); ctx.fill();
    glow(x, y - 22, 12, "#ffb347", .25);
  } else if (e.kind === "puppet") {
    const A = e.anchor!; ctx.strokeStyle = "#e8dfcf"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(x, y - 26); ctx.stroke(); ctx.beginPath(); ctx.moveTo(A.x - 6, A.y + 4); ctx.lineTo(x - 22, y + 2); ctx.moveTo(A.x + 6, A.y + 4); ctx.lineTo(x + 22, y + 2); ctx.stroke();
    ctx.fillStyle = "#5a3a20"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(A.x - 22, A.y - 6, 44, 8, 3); ctx.fill(); ctx.stroke();
    const dangle = Math.sin(ft * .01) * 8; noodle(x - 6, y + 14, x - 8, y + 30 + dangle, .2, 4); shoe(x - 8, y + 32 + dangle, -1, "#8a5a3a"); noodle(x + 6, y + 14, x + 8, y + 30 - dangle, -.2, 4); shoe(x + 8, y + 32 - dangle, 1, "#8a5a3a");
    ctx.beginPath(); ctx.roundRect(x - 12, y - 6, 24, 24, 5); outlined(def.color); ctx.fillStyle = INK; ctx.fillRect(x - 12, y + 6, 24, 2);
    noodle(x - 12, y, x - 22, y + 2, .3, 4); glove(x - 23, y + 3, 5); noodle(x + 12, y, x + 22, y + 2, -.3, 4); glove(x + 23, y + 3, 5);
    ctx.beginPath(); ctx.arc(x, y - 18, 13, 0, TAU); outlined("#f3d9b8"); ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.arc(x - 6, y - 15, 2.5, 0, TAU); ctx.arc(x + 6, y - 15, 2.5, 0, TAU); ctx.fill();
    pieEye(x - 5, y - 20, 2.6, 3.6, 0, "#f3d9b8", closed); pieEye(x + 5, y - 20, 2.6, 3.6, 0, "#f3d9b8", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y - 11); ctx.lineTo(x + 5, y - 11); ctx.moveTo(x - 3, y - 11); ctx.lineTo(x - 3, y - 7); ctx.moveTo(x + 3, y - 11); ctx.lineTo(x + 3, y - 7); ctx.stroke();
    ctx.fillStyle = "#c97a5a"; ctx.beginPath(); ctx.moveTo(x - 12, y - 24); ctx.lineTo(x, y - 40); ctx.lineTo(x + 12, y - 24); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.kind === "twin") {
    const mate = e.partner !== undefined ? g.enemies.find((o) => o.id === e.partner) : undefined;
    if (mate && e.id < mate.id) { ctx.save(); ctx.strokeStyle = "#2f3d7a"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); const mx = (x + mate.x) / 2, my = (y + mate.y) / 2 + 26 + Math.sin(frame * .5) * 6; ctx.quadraticCurveTo(mx, my, mate.x, mate.y); ctx.stroke(); ctx.strokeStyle = "#7f8fd6"; ctx.lineWidth = 2.5; ctx.setLineDash([6, 10]); ctx.lineDashOffset = -frame * 3; ctx.stroke(); ctx.restore(); }
    const wob = 1 + Math.sin(ft * .02) * .1; ctx.beginPath(); ctx.moveTo(x, y - 18 * wob); ctx.bezierCurveTo(x + 22, y - 10, x + 18, y + 16, x, y + 18 / wob); ctx.bezierCurveTo(x - 18, y + 16, x - 22, y - 10, x, y - 18 * wob); outlined(def.color); for (let i = 0; i < 3; i++) { ctx.fillStyle = def.color; ctx.beginPath(); ctx.arc(x + Math.cos(ft * .005 + i * 2.1) * 20, y + Math.sin(ft * .005 + i * 2.1) * 16, 4, 0, TAU); ctx.fill(); ctx.stroke(); }
    pieEye(x - 5, y - 3, 3, 5, 0, def.color, closed); pieEye(x + 5, y - 3, 3, 5, 0, def.color, closed); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y + 8, 4, 0, Math.PI); ctx.fill(); ctx.stroke();
  } else if (e.kind === "phono") {
    ctx.beginPath(); ctx.roundRect(x - 22, y, 44, 22, 4); outlined("#5a3a20"); ctx.fillStyle = "#c9a75a"; ctx.fillRect(x - 18, y + 4, 36, 4);
    ctx.save(); ctx.translate(x + 4, y - 8); ctx.rotate(-.5 + Math.sin(ft * .004) * .05); ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(10, 8); ctx.lineTo(30, -26); ctx.lineTo(-30, -26); ctx.closePath(); outlined(def.color); ctx.fillStyle = "#3a2a1c"; ctx.beginPath(); ctx.ellipse(0, -26, 30, 8, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.ellipse(0, -26, 18, 4, 0, 0, TAU); ctx.fill(); pieEye(-6, -26, 2.6, 2.4, 0, "#fbf6ea", closed); pieEye(6, -26, 2.6, 2.4, 0, "#fbf6ea", closed); ctx.restore();
    ctx.save(); ctx.translate(x - 12, y - 6); ctx.rotate(frame * .5); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); ctx.restore();
    if (e.attack > 0) for (let i = 0; i < 3; i++) { ctx.fillStyle = "#fbf6ea"; ctx.strokeStyle = INK; ctx.lineWidth = 2; const nx = x + 24 + i * 10, ny = y - 30 - i * 8 - Math.sin(ft * .02 + i) * 4; ctx.beginPath(); ctx.ellipse(nx, ny, 4, 3, -.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(nx + 3, ny - 1); ctx.lineTo(nx + 3, ny - 12); ctx.stroke(); }
  } else if (e.kind === "mirror") {
    noodle(x - 7, y + 12, x - 9 + Math.sin(ft * .02) * 6, y + 28, .3, 5); shoe(x - 9, y + 30, -1, "#4a3a5a"); noodle(x + 7, y + 12, x + 9 - Math.sin(ft * .02) * 6, y + 28, -.3, 5); shoe(x + 9, y + 30, 1, "#4a3a5a");
    ctx.beginPath(); ctx.roundRect(x - 12, y - 8, 24, 24, 6); outlined("#6d5a8a");
    ctx.save(); ctx.translate(x, y - 6); ctx.rotate(e.facingA); // mirror faces the player
    ctx.fillStyle = "#e6f4fb"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(12, 0, 8, 26, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.ellipse(12, 0, 10.5, 29, 0, -Math.PI / 2, Math.PI / 2); ctx.lineTo(12, 26); ctx.ellipse(12, 0, 8, 26, 0, Math.PI / 2, -Math.PI / 2, true); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = .7; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(13, -10, 2.5, 8, .2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y - 20, 13, 0, TAU); outlined("#f3e2c8"); ctx.fillStyle = "#e6f4fb"; ctx.beginPath(); ctx.moveTo(x - 12, y - 24); ctx.quadraticCurveTo(x, y - 34, x + 12, y - 24); ctx.quadraticCurveTo(x, y - 16, x - 12, y - 24); ctx.fill(); ctx.stroke(); pieEye(x - 5, y - 24, 2.6, 3.4, 0, "#e6f4fb", closed); pieEye(x + 5, y - 24, 2.6, 3.4, 0, "#e6f4fb", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 14, 5, .2, Math.PI - .2); ctx.stroke();
  } else if (e.kind === "turret") {
    ctx.beginPath(); ctx.moveTo(x - 24, y + 22); ctx.lineTo(x - 16, y - 2); ctx.lineTo(x + 16, y - 2); ctx.lineTo(x + 24, y + 22); ctx.closePath(); outlined("#3a3f52");
    const a = e.laser ? e.laser.a : Math.atan2(g.player.y - y, g.player.x - x); ctx.save(); ctx.translate(x, y - 6); ctx.rotate(a); ctx.beginPath(); ctx.roundRect(-8, -9, 40, 18, 6); outlined(def.color); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(32, 0, 6, 0, TAU); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(x, y - 6, 15, 0, TAU); outlined("#fbf6ea"); pieEye(x, y - 6, 6, 7, 0, "#fbf6ea", closed); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 10, y - 16); ctx.lineTo(x + 10, y - 14); ctx.stroke();
  } else if (e.kind === "clown") {
    // Unicycle wheel
    ctx.save(); ctx.translate(x, y + 16); ctx.rotate(frame * 0.3);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.stroke(); }
    ctx.restore();
    // Body & head
    ctx.beginPath(); ctx.roundRect(x - 12, y - 10, 24, 20, 4); outlined(def.color);
    ctx.beginPath(); ctx.arc(x, y - 20, 14, 0, TAU); outlined("#fbf6ea");
    ctx.fillStyle = "#ff5964"; ctx.beginPath(); ctx.arc(x, y - 18, 4, 0, TAU); ctx.fill();
    pieEye(x - 5, y - 23, 2.5, 3.5, 0, "#fbf6ea", closed); pieEye(x + 5, y - 23, 2.5, 3.5, 0, "#fbf6ea", closed);
    // Juggling pins in air
    for (let i = 0; i < 3; i++) {
      const pa = ft * 0.008 + i * (TAU / 3);
      const px = x + Math.cos(pa) * 22, py = y - 36 + Math.sin(pa) * 14;
      ctx.fillStyle = i === 1 ? "#ffd166" : "#ff5964"; ctx.beginPath(); ctx.ellipse(px, py, 4, 8, pa, 0, TAU); ctx.fill(); ctx.stroke();
    }
  } else if (e.kind === "bat") {
    const flap = Math.sin(ft * 0.02) * 12;
    ctx.fillStyle = def.color; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - 22, y + flap); ctx.quadraticCurveTo(x - 10, y - 14, x, y - 4); ctx.quadraticCurveTo(x + 10, y - 14, x + 22, y + flap); ctx.quadraticCurveTo(x + 12, y + 6, x, y + 10); ctx.quadraticCurveTo(x - 12, y + 6, x - 22, y + flap); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 6, 8, 0, TAU); outlined(def.color);
    pieEye(x - 3, y - 7, 2, 3, 0, def.color, closed); pieEye(x + 3, y - 7, 2, 3, 0, def.color, closed);
  } else if (e.kind === "skeleton") {
    noodle(x - 6, y + 10, x - 9 + Math.sin(ft * 0.02) * 6, y + 26, 0.2, 4); shoe(x - 9, y + 28, -1, "#e5dec9");
    noodle(x + 6, y + 10, x + 9 - Math.sin(ft * 0.02) * 6, y + 26, -0.2, 4); shoe(x + 9, y + 28, 1, "#e5dec9");
    ctx.beginPath(); ctx.roundRect(x - 10, y - 8, 20, 20, 3); outlined("#e5dec9");
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.moveTo(x - 8, y - 4 + r * 6); ctx.lineTo(x + 8, y - 4 + r * 6); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y - 18, 12, 0, TAU); outlined("#fbf6ea");
    pieEye(x - 4, y - 19, 3, 4, 0, "#fbf6ea", closed); pieEye(x + 4, y - 19, 3, 4, 0, "#fbf6ea", closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x - 6, y - 11); ctx.lineTo(x + 6, y - 11);
    for (let t = -4; t <= 4; t += 2) { ctx.moveTo(x + t, y - 13); ctx.lineTo(x + t, y - 9); }
    ctx.stroke();
  } else if (e.kind === "totem") {
    ctx.beginPath(); ctx.roundRect(x - 16, y - 26, 32, 52, 6); outlined(def.color);
    ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.ellipse(x, y - 12, 8, 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
    pieEye(x - 6, y - 18, 3, 4, 0, def.color, closed); pieEye(x + 6, y - 18, 3, 4, 0, def.color, closed);
    pieEye(x - 6, y + 6, 3, 4, 0, def.color, closed); pieEye(x + 6, y + 6, 3, 4, 0, def.color, closed);
    if (e.attack > 0) {
      ctx.fillStyle = "#e5dec9"; ctx.beginPath(); ctx.arc(x, y - 32, 10, 0, TAU); ctx.fill();
    }
  } else if (e.kind === "siren") {
    // pull field
    if (e.attack <= 0) {
      ctx.save(); ctx.globalAlpha = .16 + Math.sin(frame * .5) * .05; ctx.strokeStyle = "#7ad9c4"; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const rr = 90 + i * 70 + (frame * 2 % 70); ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    // shell + tail
    ctx.beginPath(); ctx.ellipse(x, y + 14 * s, 20 * s, 12 * s, 0, 0, TAU); outlined("#e8b7c8", 3);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 7 * s, y + 4 * s); ctx.lineTo(x + i * 9 * s, y + 25 * s); ctx.stroke(); }
    noodle(x - 8 * s, y + 18 * s, x - 20 * s + Math.sin(ft * .02) * 8, y + 34 * s, .4, 5); noodle(x + 8 * s, y + 18 * s, x + 20 * s - Math.sin(ft * .02) * 8, y + 34 * s, -.4, 5);
    // torso + head
    ctx.beginPath(); ctx.moveTo(x - 10 * s, y + 6 * s); ctx.quadraticCurveTo(x - 13 * s, y - 12 * s, x, y - 14 * s); ctx.quadraticCurveTo(x + 13 * s, y - 12 * s, x + 10 * s, y + 6 * s); ctx.closePath(); outlined(def.color, 3);
    ctx.beginPath(); ctx.arc(x, y - 22 * s, 11 * s, 0, TAU); outlined(def.color, 3);
    // big 1930s hair
    ctx.beginPath(); ctx.moveTo(x - 13 * s, y - 20 * s); ctx.quadraticCurveTo(x - 20 * s, y - 36 * s, x - 4 * s, y - 34 * s); ctx.quadraticCurveTo(x + 4 * s, y - 40 * s, x + 12 * s, y - 32 * s); ctx.quadraticCurveTo(x + 18 * s, y - 24 * s, x + 12 * s, y - 18 * s); ctx.closePath(); outlined("#2f4f5a", 3);
    pieEye(x - 4 * s, y - 24 * s, 2.4, 3.4, -.2, def.color, closed); pieEye(x + 4 * s, y - 24 * s, 2.4, 3.4, .2, def.color, closed);
    // open singing mouth
    const open = 3 + Math.abs(Math.sin(ft * .014)) * 4;
    ctx.fillStyle = "#5a2030"; ctx.beginPath(); ctx.ellipse(x, y - 16 * s, 4 * s, open * s, 0, 0, TAU); ctx.fill(); ctx.stroke();
    // floating notes
    for (let i = 0; i < 3; i++) { const a = frame * .5 + i * 2.1, nx = x + Math.cos(a) * 30, ny = y - 26 + Math.sin(a * 1.4) * 8; ctx.fillStyle = "#bff0e4"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(nx, ny, 4, 3, -.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(nx + 3.5, ny - 1); ctx.lineTo(nx + 3.5, ny - 11); ctx.stroke(); }
  } else if (e.kind === "chef") {
    noodle(x - 8, y + 16, x - 10 + Math.sin(ft * .018) * 4, y + 32, .2, 6); shoe(x - 12, y + 34, -1, "#3a3038"); noodle(x + 8, y + 16, x + 10 - Math.sin(ft * .018) * 4, y + 32, -.2, 6); shoe(x + 12, y + 34, 1, "#3a3038");
    // apron body
    ctx.beginPath(); ctx.moveTo(x - 16, y - 10); ctx.quadraticCurveTo(x - 20, y + 10, x - 15, y + 20); ctx.lineTo(x + 15, y + 20); ctx.quadraticCurveTo(x + 20, y + 10, x + 16, y - 10); ctx.closePath(); outlined("#fbf6ea", 4);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 13, y + 2); ctx.lineTo(x + 13, y + 2); ctx.stroke(); ctx.fillStyle = def.color; ctx.fillRect(x - 6, y + 5, 12, 10); ctx.strokeRect(x - 6, y + 5, 12, 10);
    // head + toque
    ctx.beginPath(); ctx.arc(x, y - 20, 13, 0, TAU); outlined("#f0c9a0", 3);
    ctx.beginPath(); ctx.moveTo(x - 15, y - 28); ctx.quadraticCurveTo(x - 20, y - 48, x - 5, y - 44); ctx.quadraticCurveTo(x, y - 52, x + 6, y - 44); ctx.quadraticCurveTo(x + 20, y - 48, x + 15, y - 28); ctx.closePath(); outlined("#ffffff", 3);
    // moustache
    ctx.fillStyle = "#4a3527"; ctx.beginPath(); ctx.moveTo(x - 11, y - 15); ctx.quadraticCurveTo(x - 5, y - 19, x, y - 15); ctx.quadraticCurveTo(x + 5, y - 19, x + 11, y - 15); ctx.quadraticCurveTo(x + 5, y - 11, x, y - 13); ctx.quadraticCurveTo(x - 5, y - 11, x - 11, y - 15); ctx.fill();
    pieEye(x - 5, y - 23, 2.6, 4, -.2, "#f0c9a0", closed); pieEye(x + 5, y - 23, 2.6, 4, .2, "#f0c9a0", closed);
    // frying pan, wound up when about to lob
    const swing = e.attack > 0 ? -1.5 : .5;
    noodle(x + 16, y - 4, x + 34, y - 4 + swing * 16, -.3, 6);
    ctx.save(); ctx.translate(x + 36, y - 4 + swing * 16); ctx.rotate(swing * .8);
    ctx.fillStyle = "#3a3a44"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 13, 7, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#585866"; ctx.beginPath(); ctx.ellipse(0, -2, 9, 4, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#3a3a44"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(22, -2); ctx.stroke(); ctx.restore();
  } else if (e.kind === "balloon") {
    const R = e.r * s;
    // string + basket
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y + R); ctx.quadraticCurveTo(x + Math.sin(ft * .01) * 6, y + R + 16, x, y + R + 26); ctx.stroke();
    ctx.fillStyle = "#8a5a36"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x - 13, y + R + 26, 26, 16, 3); ctx.fill(); ctx.stroke();
    // envelope
    ctx.beginPath(); ctx.moveTo(x, y - R); ctx.bezierCurveTo(x + R * 1.25, y - R * .8, x + R * 1.1, y + R * .7, x, y + R); ctx.bezierCurveTo(x - R * 1.1, y + R * .7, x - R * 1.25, y - R * .8, x, y - R); outlined(def.color, 4);
    // gore stripes
    ctx.save(); ctx.beginPath(); ctx.moveTo(x, y - R); ctx.bezierCurveTo(x + R * 1.25, y - R * .8, x + R * 1.1, y + R * .7, x, y + R); ctx.bezierCurveTo(x - R * 1.1, y + R * .7, x - R * 1.25, y - R * .8, x, y - R); ctx.clip();
    ctx.fillStyle = "#ffd7e0"; for (const ox of [-R * .55, R * .55]) { ctx.beginPath(); ctx.ellipse(x + ox, y, R * .22, R * 1.05, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    // shine
    ctx.globalAlpha = .5; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(x - R * .4, y - R * .45, R * .17, R * .28, -.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    // face
    pieEye(x - R * .26, y - R * .12, R * .1, R * .16, -.2, def.color, closed); pieEye(x + R * .26, y - R * .12, R * .1, R * .16, .2, def.color, closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y + R * .22, R * .26, .15, Math.PI - .15); ctx.stroke();
    // knot
    ctx.fillStyle = "#e06a80"; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x - 7, y + R); ctx.lineTo(x + 7, y + R); ctx.lineTo(x, y + R + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.kind === "organ") {
    // telegraphed lanes
    const laneHz = stageH * HORIZON;
    if (e.lanes) {
      ctx.save();
      for (const L of e.lanes) {
        const k = L.t > 0 ? 1 - L.t / 1.05 : 0;
        ctx.globalAlpha = .18 + (1 - k) * .3;
        ctx.fillStyle = L.t > 0 ? "#6a5a8a" : "#a89ad8";
        ctx.fillRect(L.x - 26, laneHz, 52, stageH - laneHz);
        ctx.globalAlpha = .8; ctx.strokeStyle = "#a89ad8"; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); ctx.lineDashOffset = -frame * 4;
        ctx.beginPath(); ctx.moveTo(L.x - 26, laneHz); ctx.lineTo(L.x - 26, stageH); ctx.moveTo(L.x + 26, laneHz); ctx.lineTo(L.x + 26, stageH); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    }
    // cabinet
    ctx.beginPath(); ctx.roundRect(x - 30, y - 30, 60, 62, 5); outlined("#3d3350", 4);
    // pipes
    for (let i = 0; i < 5; i++) {
      const ph = 26 + (i === 2 ? 16 : i % 2 ? 0 : 8), px = x - 22 + i * 11;
      ctx.fillStyle = i % 2 ? "#c9bfd8" : "#a89ad8"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(px - 4, y - 30 - ph, 9, ph, [4, 4, 0, 0]); ctx.fill(); ctx.stroke();
      if (e.attack > 0) { ctx.fillStyle = "#fff3c4"; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(px + .5, y - 32 - ph, 4 + Math.sin(frame + i) * 2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    // keyboard
    ctx.fillStyle = "#fbf6ea"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x - 24, y + 6, 48, 12, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; for (let i = 0; i < 5; i++) ctx.fillRect(x - 20 + i * 10, y + 6, 4, 7);
    // hunched player
    ctx.beginPath(); ctx.arc(x, y - 8, 12, 0, TAU); outlined(def.color, 3);
    ctx.beginPath(); ctx.moveTo(x - 16, y - 22); ctx.quadraticCurveTo(x, y - 34, x + 16, y - 22); ctx.lineTo(x + 12, y - 16); ctx.lineTo(x - 12, y - 16); ctx.closePath(); outlined("#241d33", 3);
    pieEye(x - 4, y - 10, 2.4, 3.4, 0, def.color, closed); pieEye(x + 4, y - 10, 2.4, 3.4, 0, def.color, closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 5, y - 2); ctx.lineTo(x + 5, y - 2); ctx.stroke();
  } else if (e.kind === "disco") {
    // Glitter Globe — a waltzing mirror-ball golem; facets glint while the shell is up
    noodle(x - 8, y + 12, x - 16 + Math.sin(ft * .016) * 5, y + 26, .3, 5); noodle(x + 8, y + 12, x + 16 - Math.sin(ft * .016) * 5, y + 26, -.3, 5);
    ctx.beginPath(); ctx.arc(x, y, 17 * s, 0, TAU); outlined("#9fd8ff", 3);
    for (let ry = -2; ry <= 2; ry++) for (let rx = -2; rx <= 2; rx++) {
      const px = rx * 6.5 * s, py = ry * 6.5 * s; if (px * px + py * py > 250 * s * s) continue;
      const gl = Math.sin(ft * .02 + rx * 2.1 + ry * 3.3) > .55;
      ctx.fillStyle = gl ? "#ffffff" : (rx + ry) % 2 ? "#6aa8d8" : "#c8ecff";
      ctx.fillRect(x + px - 2.6 * s, y + py - 2.6 * s, 5.2 * s, 5.2 * s);
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 17 * s, 0, TAU); ctx.stroke();
    pieEye(x - 5 * s, y - 4 * s, 2.4, 3.2, -.2, "#eaf8ff", closed); pieEye(x + 5 * s, y - 4 * s, 2.4, 3.2, .2, "#eaf8ff", closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 3 * s, 5 * s, .2, Math.PI - .2); ctx.stroke();
    if ((e.reflect || 0) > 0) {
      ctx.save(); ctx.globalAlpha = .5 + Math.sin(frame * .8) * .2; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3;
      for (let i = 0; i < 4; i++) { const a2 = frame * .25 + i * Math.PI / 2; const gx = x + Math.cos(a2) * (e.r + 7), gy = y + Math.sin(a2) * (e.r + 7);
        ctx.beginPath(); ctx.moveTo(gx - 6, gy); ctx.lineTo(gx + 6, gy); ctx.moveTo(gx, gy - 6); ctx.lineTo(gx, gy + 6); ctx.stroke(); }
      ctx.restore();
    }
  } else if (e.kind === "skunk") {
    // Ink Skunk — big noodle tail with a white banner stripe
    ctx.strokeStyle = INK; ctx.lineWidth = 12; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x - 12, y + 6); ctx.quadraticCurveTo(x - 30, y - 6 + Math.sin(ft * .02) * 6, x - 26, y - 26 + Math.sin(ft * .014) * 4); ctx.stroke();
    ctx.strokeStyle = "#f4f0fa"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 12, y + 4); ctx.quadraticCurveTo(x - 28, y - 8 + Math.sin(ft * .02) * 6, x - 25, y - 25 + Math.sin(ft * .014) * 4); ctx.stroke();
    noodle(x - 5, y + 12, x - 8, y + 24, .2, 5); noodle(x + 5, y + 12, x + 8, y + 24, -.2, 5);
    ctx.beginPath(); ctx.ellipse(x, y + 2, 15 * s, 12 * s, 0, 0, TAU); outlined("#3a3444", 3);
    ctx.beginPath(); ctx.moveTo(x, y - 10 * s); ctx.quadraticCurveTo(x - 4, y + 2, x, y + 13 * s); ctx.quadraticCurveTo(x + 4, y + 2, x, y - 10 * s); ctx.closePath(); outlined("#f4f0fa", 2.5);
    ctx.beginPath(); ctx.arc(x + 4 * s, y - 10 * s, 9 * s, 0, TAU); outlined("#3a3444", 3);
    ctx.fillStyle = "#f4f0fa"; ctx.beginPath(); ctx.moveTo(x - 2 * s, y - 18 * s); ctx.quadraticCurveTo(x + 4 * s, y - 22 * s, x + 10 * s, y - 16 * s); ctx.lineTo(x + 8 * s, y - 12 * s); ctx.quadraticCurveTo(x + 3 * s, y - 16 * s, x - 1 * s, y - 14 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    pieEye(x + 2 * s, y - 11 * s, 2, 2.8, 0, "#f4f0fa", closed); pieEye(x + 7 * s, y - 10 * s, 2, 2.8, 0, "#f4f0fa", closed);
    if (e.cooldown < .4) { ctx.fillStyle = "#5a4a6e"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x + 14 + i * 5, y - 4 - i * 3, 3 - i * .6, 0, TAU); ctx.fill(); } }
  } else if (e.kind === "strong") {
    // Mighty Marcel — striped strongman; barbell goes up while he winds the slam
    const up = e.wound ? Math.min(1, (.7 - e.attack) * 6) : 0;
    noodle(x - 6, y + 18, x - 8, y + 32, .2, 6); shoe(x - 9, y + 34, -1, "#3a3038"); noodle(x + 6, y + 18, x + 8, y + 32, -.2, 6); shoe(x + 9, y + 34, 1, "#3a3038");
    ctx.beginPath(); ctx.moveTo(x - 16, y - 8); ctx.quadraticCurveTo(x - 20, y + 16, x, y + 20); ctx.quadraticCurveTo(x + 20, y + 16, x + 16, y - 8); ctx.closePath(); outlined("#d84a45", 3);
    ctx.strokeStyle = "#fbf6ea"; ctx.lineWidth = 4; for (const oy of [0, 7]) { ctx.beginPath(); ctx.moveTo(x - 14, y + oy); ctx.lineTo(x + 14, y + oy + 3); ctx.stroke(); }
    const ay = -26 - up * 14;
    const [elx, ely] = bone2(x - 14, y - 4, x - 24, y + ay * .4, 14, 14, 1, 7); bone2(elx as number, ely as number, x - 26, y + ay, 2, 2, 1, 7);
    const [erx, ery] = bone2(x + 14, y - 4, x + 24, y + ay * .4, 14, 14, -1, 7); bone2(erx as number, ery as number, x + 26, y + ay, 2, 2, -1, 7);
    if (e.wound) { ctx.strokeStyle = "#5a4030"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 34, y + ay); ctx.lineTo(x + 34, y + ay); ctx.stroke(); ctx.fillStyle = "#444b58"; ctx.strokeStyle = INK; ctx.lineWidth = 3; for (const sx of [-34, 34]) { ctx.beginPath(); ctx.arc(x + sx, y + ay, 9, 0, TAU); ctx.fill(); ctx.stroke(); } }
    else { glove(x - 25, y + 10, 8); glove(x + 25, y + 10, 8); }
    ctx.beginPath(); ctx.arc(x, y - 18, 11, 0, TAU); outlined("#f0c8a0", 3);
    ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.ellipse(x, y - 26, 10, 4, 0, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - 7, y - 14); ctx.quadraticCurveTo(x - 3, y - 11, x - 1, y - 14); ctx.moveTo(x + 7, y - 14); ctx.quadraticCurveTo(x + 3, y - 11, x + 1, y - 14); ctx.stroke();
    pieEye(x - 4, y - 20, 2, 2.6, 0, "#f0c8a0", closed); pieEye(x + 4, y - 20, 2, 2.6, 0, "#f0c8a0", closed);
  } else if (e.kind === "usher") {
    // Phantom Usher — tuxedoed apparition with a little flashlight
    glow(x, y, e.r, "#bfe3c8", .22);
    ctx.beginPath(); ctx.moveTo(x - 12, y - 10); ctx.quadraticCurveTo(x - 16, y + 14, x - 10, y + 20); ctx.quadraticCurveTo(x - 4, y + 14, x, y + 20); ctx.quadraticCurveTo(x + 4, y + 14, x + 10, y + 20); ctx.quadraticCurveTo(x + 16, y + 14, x + 12, y - 10); ctx.closePath(); outlined("#20302a", 3);
    ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.lineTo(x, y + 8); ctx.lineTo(x + 5, y - 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.moveTo(x - 5, y - 9); ctx.lineTo(x, y - 5); ctx.lineTo(x + 5, y - 9); ctx.lineTo(x + 3, y - 12); ctx.lineTo(x, y - 9); ctx.lineTo(x - 3, y - 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - 18, 10, 0, TAU); outlined("#bfe3c8", 3);
    pieEye(x - 3.5, y - 20, 2, 3, -.1, "#bfe3c8", closed); pieEye(x + 3.5, y - 20, 2, 3, .1, "#bfe3c8", closed);
    ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 2; ctx.globalAlpha *= .8;
    ctx.beginPath(); ctx.moveTo(x + 12, y - 2); ctx.lineTo(x + 46, y - 14); ctx.lineTo(x + 46, y + 10); ctx.closePath(); ctx.fillStyle = "rgba(255,226,122,.18)"; ctx.fill(); ctx.stroke();
    ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 1.25);
  } else if (e.kind === "magnet") {
    // Lodestone Diver — brass diving bell with a humming horseshoe crown
    noodle(x - 8, y + 14, x - 12, y + 26, .25, 6); noodle(x + 8, y + 14, x + 12, y + 26, -.25, 6);
    ctx.beginPath(); ctx.arc(x, y, 16 * s, 0, TAU); outlined("#c98a3a", 3);
    ctx.fillStyle = "#8fd1ff"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y - 2 * s, 8 * s, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - 3 * s, y - 5 * s, 4 * s, Math.PI, Math.PI * 1.5); ctx.stroke();
    ctx.fillStyle = "#d84a45"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - 10, y - 14 * s); ctx.lineTo(x - 10, y - 26 * s); ctx.arc(-0 + x, y - 26 * s, 10, Math.PI, 0); ctx.lineTo(x + 10, y - 14 * s); ctx.lineTo(x + 5, y - 14 * s); ctx.lineTo(x + 5, y - 24 * s); ctx.arc(x, y - 24 * s, 5, 0, Math.PI, true); ctx.lineTo(x - 5, y - 14 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fbf6ea"; ctx.fillRect(x - 11, y - 16 * s, 6, 4); ctx.fillRect(x + 5, y - 16 * s, 6, 4); ctx.strokeRect(x - 11, y - 16 * s, 6, 4); ctx.strokeRect(x + 5, y - 16 * s, 6, 4);
    ctx.strokeStyle = "#8a9bd8"; ctx.lineWidth = 2; ctx.globalAlpha = .5 + Math.sin(ft * .03) * .25;
    for (let i = 0; i < 3; i++) { const rr = 26 + i * 12 + (frame % 24); ctx.beginPath(); ctx.arc(x, y, rr, -.6, .6); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, rr, Math.PI - .6, Math.PI + .6); ctx.stroke(); }
    ctx.globalAlpha = 1;
  } else if (e.kind === "cutpurse") {
    // The Card Sharp — a snouted little bounder in a coat two sizes too good for him.
    const R = e.r * s;
    noodle(x - R * .4, y + R * .7, x - R * .5 + Math.sin(ft * .02) * 5, y + R + 9, .3, 5);
    noodle(x + R * .4, y + R * .7, x + R * .5 - Math.sin(ft * .02) * 5, y + R + 9, -.3, 5);
    ctx.beginPath(); ctx.ellipse(x, y + R * .1, R * .62, R * .8, 0, 0, TAU); outlined("#2b2438", 3);
    ctx.beginPath(); ctx.moveTo(x - R * .62, y - R * .3); ctx.lineTo(x - R * .18, y + R * .55); ctx.lineTo(x + R * .18, y + R * .55); ctx.lineTo(x + R * .62, y - R * .3); ctx.closePath(); outlined(def.color, 3);
    ctx.beginPath(); ctx.ellipse(x, y - R * .68, R * .44, R * .4, 0, 0, TAU); outlined("#f2d8a8", 3);
    ctx.beginPath(); ctx.moveTo(x + R * .1, y - R * .62); ctx.lineTo(x + R * .62, y - R * .5); ctx.lineTo(x + R * .12, y - R * .42); ctx.closePath(); outlined("#f2d8a8", 2.5);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + R * .18, y - R * .8, 1.9, 0, TAU); ctx.fill();
    ctx.fillStyle = "#1f1a24"; ctx.beginPath(); ctx.ellipse(x, y - R * 1.02, R * .5, R * .14, 0, 0, TAU); ctx.fill();
    ctx.fillRect(x - R * .3, y - R * 1.34, R * .6, R * .34); ctx.strokeRect(x - R * .3, y - R * 1.34, R * .6, R * .34);
    glove(x - R * .66, y + R * .1, 6, -.4);
    if (e.holding) {
      ctx.save(); ctx.translate(x - R * .8, y - R * .3); ctx.rotate(-.35 + Math.sin(ft * .03) * .12);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i - 1) * .42); ctx.fillStyle = "#fbf6ea"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(-4, -9, 8, 13, 1.6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ff5aa5"; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(2.6, -1.5); ctx.lineTo(0, 2); ctx.lineTo(-2.6, -1.5); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.restore(); glow(x, y - R * .4, R * .8, "#ff5aa5", .22);
    }
  } else if (e.kind === "bellhop") {
    // Bellhop Bolt — a brass-buttoned gofer with a shield umbrella, tethered to his charge.
    const R = e.r * s;
    if (e.anchor) {
      ctx.save(); ctx.globalAlpha = .8; ctx.strokeStyle = "#74e6ff"; ctx.lineWidth = 3; ctx.setLineDash([9, 7]); ctx.lineDashOffset = -frame * 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(e.anchor.x, e.anchor.y + Math.sin(ft * .008) * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    noodle(x - R * .35, y + R * .6, x - R * .4, y + R + 8, .2, 5); noodle(x + R * .35, y + R * .6, x + R * .4, y + R + 8, -.2, 5);
    ctx.beginPath(); ctx.ellipse(x, y + R * .05, R * .6, R * .78, 0, 0, TAU); outlined(def.color, 3);
    ctx.strokeStyle = "#f2c14e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - R * .5, y - R * .2); ctx.lineTo(x + R * .5, y - R * .2); ctx.stroke();
    ctx.fillStyle = "#f2c14e"; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; for (let i = -1; i < 2; i++) { ctx.beginPath(); ctx.arc(x + i * R * .3, y + R * .16, 2.4, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y - R * .72, R * .42, 0, TAU); outlined("#fbf6ea", 3);
    pieEye(x - R * .16, y - R * .76, 2.2, 3.2, 0, def.color, closed); pieEye(x + R * .16, y - R * .76, 2.2, 3.2, 0, def.color, closed);
    ctx.beginPath(); ctx.moveTo(x - R * .5, y - R * 1.02); ctx.quadraticCurveTo(x, y - R * 1.5, x + R * .5, y - R * 1.02); ctx.closePath(); outlined("#8fd1ff", 3);
    if (e.attack > 0) glow(x, y, R * 1.5, "#74e6ff", .3);
  } else if (e.kind === "drover") {
    // The Drover — a wide-brimmed herder who works the crowd, crook always pointing your way.
    const R = e.r * s, aim = e.anchor ? Math.atan2(g.player.y - e.anchor.y, g.player.x - e.anchor.x) : 0;
    noodle(x - R * .45, y + R * .6, x - R * .55, y + R + 9, .25, 6); noodle(x + R * .45, y + R * .6, x + R * .55, y + R + 9, -.25, 6);
    ctx.beginPath(); ctx.ellipse(x, y, R * .66, R * .74, 0, 0, TAU); outlined(def.color, 3);
    ctx.beginPath(); ctx.ellipse(x, y - R * .74, R * .9, R * .2, 0, 0, TAU); outlined("#7a5a34", 3);
    ctx.beginPath(); ctx.roundRect(x - R * .4, y - R * 1.24, R * .8, R * .5, [R * .2, R * .2, 2, 2]); outlined("#7a5a34", 3);
    ctx.beginPath(); ctx.arc(x, y - R * .5, R * .34, 0, TAU); outlined("#f2d8a8", 3);
    pieEye(x - R * .13, y - R * .54, 2, 3, 0, "#f2d8a8", closed); pieEye(x + R * .13, y - R * .54, 2, 3, 0, "#f2d8a8", closed);
    ctx.save(); ctx.translate(x + R * .62, y - R * .1); ctx.rotate(aim + Math.sin(ft * .02) * .12);
    ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R * 1.1, 0); ctx.arc(R * 1.1, -R * .3, R * .3, Math.PI / 2, -Math.PI / 2, true); ctx.stroke(); ctx.restore();
    if (e.attack > 0) { ctx.globalAlpha = .5; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, R * 2.1 - e.attack, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
  } else if (e.kind === "lancer") {
    // Marquee Deadeye — a tripod sign-lamp with a long rifle lamp-shade snout.
    const R = e.r * s, a = e.laser ? e.laser.a : Math.atan2(g.player.y - y, g.player.x - x);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - R * .5, y + R + 10); ctx.lineTo(x, y + R * .3); ctx.lineTo(x + R * .5, y + R + 10); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R * .72, 0, TAU); outlined(def.color, 3);
    ctx.fillStyle = e.laser ? "#fff3c4" : "#6a5a3a"; ctx.beginPath(); ctx.arc(x, y, R * .42, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = "#4a4454"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(R * .3, -R * .16, R * 1.5, R * .32, 3); ctx.fill(); ctx.stroke();
    if (e.laser && e.laser.t < .34) { ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(R * 1.86, 0, R * .3, 0, TAU); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 4; i++) { const aa = i / 4 * TAU + frame * .1; ctx.fillStyle = i % 2 ? "#fff3c4" : "#d84a45"; ctx.beginPath(); ctx.arc(x + Math.cos(aa) * R * .86, y + Math.sin(aa) * R * .86, 2.2, 0, TAU); ctx.fill(); }
  } else if (e.kind === "janitor") {
    // The Stagehand — a hunched sweeper with a bucket that clinks with things that were yours.
    const R = e.r * s;
    noodle(x - R * .4, y + R * .5, x - R * .45, y + R + 8, .2, 5); noodle(x + R * .4, y + R * .5, x + R * .45, y + R + 8, -.2, 5);
    ctx.beginPath(); ctx.ellipse(x, y, R * .6, R * .72, .12, 0, TAU); outlined("#6a6a78", 3);
    ctx.beginPath(); ctx.arc(x + R * .1, y - R * .72, R * .38, 0, TAU); outlined("#f2d8a8", 3);
    ctx.fillStyle = "#c0c8d8"; ctx.beginPath(); ctx.moveTo(x - R * .3, y - R * 1.02); ctx.lineTo(x + R * .5, y - R * 1.02); ctx.lineTo(x + R * .4, y - R * 1.2); ctx.lineTo(x - R * .2, y - R * 1.2); ctx.closePath(); outlined("#c0c8d8", 2.5);
    pieEye(x, y - R * .74, 2.4, 3, 0, "#f2d8a8", closed);
    ctx.save(); ctx.translate(x + R * .78, y + R * .2);
    ctx.strokeStyle = "#8a6a3a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -R * .9); ctx.lineTo(0, R * .3); ctx.stroke();
    ctx.fillStyle = def.color; ctx.beginPath(); ctx.moveTo(-R * .3, R * .3); ctx.lineTo(R * .3, R * .3); ctx.lineTo(R * .2, R * .75); ctx.lineTo(-R * .2, R * .75); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#9aa0a8"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x - R * .95, y + R * .1); ctx.lineTo(x - R * .45, y + R * .1); ctx.lineTo(x - R * .55, y + R * .62); ctx.lineTo(x - R * .85, y + R * .62); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (e.counter > 0) { ctx.fillStyle = "#ffe27a"; for (let i = 0; i < Math.min(3, e.counter); i++) { ctx.beginPath(); ctx.arc(x - R * .7 + i * 4, y - R * .05, 2, 0, TAU); ctx.fill(); ctx.stroke(); } }
  } else if (e.kind === "hooker") {
    // The Press Agent — tall, top-hatted, and holding all the rope in the room.
    const R = e.r * s, a = e.laser ? e.laser.a : 0;
    if (e.laser) {
      ctx.save(); ctx.globalAlpha = .55 + (1 - e.laser.t / .62) * .45; ctx.strokeStyle = "#ff6659"; ctx.lineWidth = 2.5; ctx.setLineDash([12, 9]); ctx.lineDashOffset = -frame * 6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 360, y + Math.sin(a) * 360); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }
    noodle(x - R * .35, y + R * .6, x - R * .4, y + R + 11, .2, 5); noodle(x + R * .35, y + R * .6, x + R * .4, y + R + 11, -.2, 5);
    ctx.beginPath(); ctx.ellipse(x, y, R * .55, R * .82, 0, 0, TAU); outlined(def.color, 3);
    ctx.strokeStyle = "#fbf6ea"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - R * .5, y - R * .1); ctx.lineTo(x + R * .5, y - R * .1); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y - R * .85, R * .4, 0, TAU); outlined("#f2d8a8", 3);
    pieEye(x - R * .14, y - R * .9, 2.1, 3.1, 0, "#f2d8a8", closed); pieEye(x + R * .14, y - R * .9, 2.1, 3.1, 0, "#f2d8a8", closed);
    ctx.fillStyle = "#1f1a24"; ctx.beginPath(); ctx.rect(x - R * .44, y - R * 1.66, R * .88, R * .66); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - R * .62, y - R * 1.06, R * 1.24, R * .12); ctx.fill();
    ctx.save(); ctx.translate(x + R * .62, y - R * .2); ctx.rotate(a);
    ctx.strokeStyle = "#e8d8a8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(R * .5, Math.sin(ft * .04) * 6, R * 1.05, 0); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.arc(R * 1.2, 0, R * .2, -.4, 3.4); ctx.stroke();
    ctx.restore();
  } else if (e.kind === "boss") {
    const R = e.r; noodle(x - R * .5, y + R * .5, x - R * .6, y + R + 10, .2, 10); shoe(x - R * .6, y + R + 12, -1, "#2a2230"); noodle(x + R * .5, y + R * .5, x + R * .6, y + R + 10, -.2, 10); shoe(x + R * .6, y + R + 12, 1, "#2a2230");
    ctx.beginPath(); ctx.ellipse(x, y + R * .25, R * .9, R * .75, 0, 0, TAU); outlined(def.color, 5); ctx.fillStyle = "#f2c14e"; ctx.strokeStyle = INK; ctx.lineWidth = 2; for (const by of [-10, 8, 26]) { ctx.beginPath(); ctx.arc(x, y + by, 5, 0, TAU); ctx.fill(); ctx.stroke(); }
    const arm = e.attack > 0 ? -R * .8 : R * .2; noodle(x - R * .8, y, x - R * 1.35, y + arm, .4, 9); glove(x - R * 1.38, y + arm, 13); noodle(x + R * .8, y, x + R * 1.35, y + arm, -.4, 9); glove(x + R * 1.38, y + arm, 13);
    ctx.beginPath(); ctx.ellipse(x, y - R * .55, R * .62, R * .58, 0, 0, TAU); outlined("#fbf6ea", 5);
    pieEye(x - R * .22, y - R * .65, R * .12, R * .2, -.15, "#fbf6ea", closed); pieEye(x + R * .22, y - R * .65, R * .12, R * .2, .15, "#fbf6ea", closed);
    ctx.strokeStyle = INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - R * .4, y - R * .85); ctx.lineTo(x - R * .1, y - R * .78); ctx.moveTo(x + R * .4, y - R * .85); ctx.lineTo(x + R * .1, y - R * .78); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(x - R * .38, y - R * .38); ctx.quadraticCurveTo(x, y - R * .05, x + R * .38, y - R * .38); ctx.quadraticCurveTo(x, y - R * .22, x - R * .38, y - R * .38); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - R * .42); ctx.quadraticCurveTo(x - R * .3, y - R * .6, x - R * .5, y - R * .4); ctx.moveTo(x, y - R * .42); ctx.quadraticCurveTo(x + R * .3, y - R * .6, x + R * .5, y - R * .4); ctx.stroke();
    ctx.beginPath(); ctx.rect(x - R * .4, y - R * 1.75, R * .8, R * .7); outlined("#1f1a24", 4); ctx.beginPath(); ctx.rect(x - R * .62, y - R * 1.12, R * 1.24, R * .1); outlined("#1f1a24", 4); ctx.fillStyle = "#f2c14e"; ctx.fillRect(x - R * .4, y - R * 1.25, R * .8, R * .1);
  }
  if (e.hit > 0) { ctx.globalAlpha = Math.min(.5, e.hit * 4.2); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, e.r * .92, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  ctx.globalAlpha = 1;
  if (e.frozen > 0) { ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = "#aef1ff"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); const R = e.r + 8; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr = i % 2 ? R * .85 : R * 1.1; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(x - R * .5, y - R * .6); ctx.lineTo(x - R * .2, y - R * .1); ctx.stroke(); ctx.restore(); }
  if (e.stun && e.stun > 0) { ctx.save(); ctx.globalAlpha = .9; for (let i = 0; i < 4; i++) { const a2 = frame * .7 + i / 4 * TAU, sx = x + Math.cos(a2) * (e.r + 12), sy = y - e.r - 12 + Math.sin(a2 * 2) * 5; ctx.fillStyle = "#ffe27a"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy - 6); ctx.lineTo(sx + 2, sy - 2); ctx.lineTo(sx + 6, sy); ctx.lineTo(sx + 2, sy + 2); ctx.lineTo(sx, sy + 6); ctx.lineTo(sx - 2, sy + 2); ctx.lineTo(sx - 6, sy); ctx.lineTo(sx - 2, sy - 2); ctx.closePath(); ctx.fill(); ctx.stroke(); } ctx.restore(); }
  if (e.burn > 0) { for (let i = 0; i < 3; i++) { const fx = x + Math.sin(frame * .9 + i * 2) * e.r * .6, fy = y - e.r * .4 - i * 5, fl = 8 + Math.sin(frame * 1.3 + i) * 4; ctx.fillStyle = i % 2 ? "#ff6a3d" : "#ffb347"; ctx.beginPath(); ctx.moveTo(fx - 6, fy + 6); ctx.quadraticCurveTo(fx - 4, fy - fl * .5, fx, fy - fl); ctx.quadraticCurveTo(fx + 5, fy - fl * .4, fx + 6, fy + 6); ctx.fill(); } }
  if (e.slow > 0) { ctx.globalAlpha = .6; ctx.fillStyle = "#6b4fbf"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x + (i - 1) * e.r * .6, y + e.r * .7 + Math.sin(frame + i) * 2, 6, 3, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  if (e.paint && e.paint > 0) { ctx.globalAlpha = .85; ctx.fillStyle = e.paintC || "#ff5aa5"; for (let i = 0; i < 6; i++) { const a2 = i / 6 * TAU + e.phase; ctx.beginPath(); ctx.arc(x + Math.cos(a2) * e.r * .62, y + Math.sin(a2) * e.r * .52, 3.4, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  if (e.blind && e.blind > 0) {
    ctx.fillStyle = "#e8b25a"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(x, y - 2, e.r * .95, e.r * .5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff6e0"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + Math.cos(i * 2.4) * e.r * .5, y - 5 + Math.sin(i * 1.7) * 4, 5.5, 0, TAU); ctx.fill(); }
  }
  if (e.tag) {
    ctx.save(); ctx.translate(x + e.r * .5, y - e.r * .8); ctx.rotate(.2);
    ctx.fillStyle = "#7ee08a"; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-7, -9, 14, 18); ctx.strokeRect(-7, -9, 14, 18);
    ctx.fillStyle = "#2a5a3a"; ctx.fillRect(-4, -6, 8, 3); ctx.restore();
    if (e.tag.t < .7 && frame % 4 < 2) { ctx.fillStyle = "#ff5555"; ctx.beginPath(); ctx.arc(x + e.r * .5, y - e.r * .8 - 14, 4, 0, TAU); ctx.fill(); }
  }
  if (e.wound) { ctx.strokeStyle = "#ff6659"; ctx.lineWidth = 3; ctx.globalAlpha = .55 + Math.sin(frame * 1.4) * .2; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.arc(x, y, e.r + 10, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  if (e.elite) {
    // Elite crown, tinted by affix: pink = painted, ice = mirror shell, green = swift
    const cy = y - e.r - 17 + Math.sin(frame * 3 + e.phase) * 2;
    ctx.fillStyle = e.affix === "painted" ? "#ff5aa5" : e.affix === "mirror" ? "#b8d8e8" : e.affix === "swift" ? "#8fd15a" : "#ffd75a";
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 11, cy + 6); ctx.lineTo(x - 11, cy - 3); ctx.lineTo(x - 5.5, cy + 2); ctx.lineTo(x, cy - 6);
    ctx.lineTo(x + 5.5, cy + 2); ctx.lineTo(x + 11, cy - 3); ctx.lineTo(x + 11, cy + 6);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  if (e.reflect && e.kind !== "disco") {
    // mirror-shell glints (elite affix or boss phase 2) — shots will skate off
    ctx.strokeStyle = "#dff4ff"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const ga = frame * 2 + i * TAU / 4, gx = x + Math.cos(ga) * (e.r + 7), gy = y + Math.sin(ga) * (e.r + 7);
      ctx.beginPath(); ctx.moveTo(gx - 4, gy); ctx.lineTo(gx + 4, gy); ctx.moveTo(gx, gy - 4); ctx.lineTo(gx, gy + 4); ctx.stroke();
    }
  }
  if (e.laser) {
    const a = e.laser.a;
    const isFiring = e.laser.t < 0.22;
    ctx.save();
    ctx.globalAlpha = isFiring ? 0.95 : Math.max(0.25, 1 - e.laser.t / 1.1);
    ctx.strokeStyle = isFiring ? "#ffffff" : "#ffd166";
    ctx.lineWidth = isFiring ? 12 : 2.5;
    if (!isFiring) {
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -frame * 4;
    }
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * (e.r + 4), y - 6 + Math.sin(a) * (e.r + 4));
    ctx.lineTo(x + Math.cos(a) * 800, y - 6 + Math.sin(a) * 800);
    ctx.stroke();
    if (isFiring) {
      ctx.strokeStyle = "#ff6659";
      ctx.lineWidth = 22;
      ctx.globalAlpha = 0.45;
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  if (e.hp < e.maxHp && e.kind !== "boss") { const bw = e.r * 2 + 6; ctx.fillStyle = INK; ctx.fillRect(x - bw / 2, e.y - e.r - 20 - (e.elite ? 14 : 0), bw, 6); ctx.fillStyle = e.elite ? "#ffd75a" : "#f0c84b"; ctx.fillRect(x - bw / 2 + 1, e.y - e.r - 19 - (e.elite ? 14 : 0), (bw - 2) * Math.max(0, e.hp / e.maxHp), 4); }
  void g;
}

function drawBullet(b: Bullet, px: number, py: number) {
  const a = Math.atan2(b.vy, b.vx); ctx.save();
  if (b.slash) { const k = b.life / b.maxLife; ctx.translate(px, py - 4); ctx.globalAlpha = k; ctx.fillStyle = "rgba(255,243,196,.55)"; ctx.strokeStyle = "#fbf6ea"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 100 * (1.1 - k * .3), b.slash.a - b.slash.w / 2, b.slash.a + b.slash.w / 2); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 100 * (1.1 - k * .3), b.slash.a - b.slash.w / 2, b.slash.a + b.slash.w / 2); ctx.stroke(); ctx.restore(); return; }
  if (b.fuse !== undefined) { ctx.translate(b.x, b.y); const k = 1 - b.fuse; ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -frame * 4; ctx.globalAlpha = .5 + k * .5; ctx.beginPath(); ctx.arc(0, 0, (b.splash || 90) * (.3 + k * .7), 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(0, -k * 40, 5, 0, TAU); ctx.fill(); ctx.restore(); return; }
  if (b.ringWave) { ctx.translate(b.x, b.y); const k = b.life / b.maxLife; ctx.globalAlpha = .25 + k * .6; ctx.strokeStyle = b.color; ctx.lineWidth = b.pink ? 9 : 6; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.stroke(); ctx.strokeStyle = b.pink ? "#fff" : INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, b.r + 4, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, b.r - 4, 0, TAU); ctx.stroke(); if (b.pink) for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU + frame * .3; ctx.fillStyle = "#ff8ad3"; ctx.beginPath(); ctx.arc(Math.cos(ang) * b.r, Math.sin(ang) * b.r, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke(); } ctx.restore(); return; }
  if (b.ghostWave) { ctx.translate(b.x, b.y); ctx.rotate(a); glow(0, 0, b.r * .7, b.color, .2); ctx.globalAlpha = .75; ctx.fillStyle = b.color; ctx.strokeStyle = "#fbf6ea"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(-b.r * .2, 0, b.r * .55, b.r, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.ellipse(-b.r * .3, b.r * .3, b.r * .28, b.r * .2, -.4, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-b.r * .05, b.r * .2); ctx.lineTo(-b.r * .05, -b.r * .7); ctx.stroke(); pieEye(-b.r * .35, -b.r * .3, b.r * .14, b.r * .2, 0, b.color); ctx.restore(); return; }
  if (b.gravity) { ctx.translate(b.x, b.y); const big = b.gravity > 1000; ctx.rotate(frame * .35); ctx.globalAlpha = .35; ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.arc(0, 0, big ? 60 : 40, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; ctx.strokeStyle = b.color; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, b.r, .6, TAU - .6); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, b.r + 3.5, .6, TAU - .6); ctx.arc(0, 0, b.r - 3.5, TAU - .6, .6, true); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.fillRect(Math.cos(.6) * b.r - 4, Math.sin(.6) * b.r - 3, 8, 6); ctx.fillRect(Math.cos(-.6) * b.r - 4, Math.sin(-.6) * b.r - 3, 8, 6); ctx.restore(); return; }
  if (b.popAt !== undefined) { ctx.translate(b.x, b.y); ctx.rotate(b.spin + frame * .5); const hot = b.popAt < .2; ctx.fillStyle = hot ? "#ffb347" : "#f2c14e"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(0, 0, 7, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#8a5a2a"; ctx.beginPath(); ctx.arc(-4, 0, 2, 0, TAU); ctx.fill(); if (hot) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -8, 3 + Math.sin(frame * 2) * 1.5, 0, TAU); ctx.fill(); } ctx.restore(); return; }
  if (b.hook) { ctx.strokeStyle = "#c9a227"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo((px + b.x) / 2, (py + b.y) / 2 + 14, b.x, b.y); ctx.stroke(); ctx.translate(b.x, b.y); ctx.rotate(a); ctx.fillStyle = "#8a96a8"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 6, -1.4, 2.4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(5, 4); ctx.lineTo(10, 7); ctx.lineTo(6, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); return; }
  if (b.pie) { ctx.translate(b.x, b.y); ctx.rotate(b.spin + frame * .3); ctx.fillStyle = "#e8b25a"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 2, 12, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff6e0"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-6 + i * 4, -2 - (i % 2) * 2, 4.5, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); return; }
  if (b.stampTag) { ctx.translate(b.x, b.y); ctx.rotate(Math.sin(frame * .4) * .3); ctx.fillStyle = "#7ee08a"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-8, -6, 16, 12, 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(0, 0); ctx.lineTo(8, -6); ctx.stroke(); ctx.restore(); return; }
  if (b.paintMark) { ctx.translate(b.x, b.y); ctx.fillStyle = b.paintMark; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(-b.r * .8, 3, b.r * .4, 0, TAU); ctx.arc(b.r * .7, -3, b.r * .35, 0, TAU); ctx.fill(); ctx.restore(); return; }
  if (b.ink) { ctx.translate(b.x, b.y); ctx.fillStyle = "#5a4a6e"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, -b.r); ctx.quadraticCurveTo(b.r, 0, 0, b.r); ctx.quadraticCurveTo(-b.r, 0, 0, -b.r); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.globalAlpha = .6; ctx.beginPath(); ctx.arc(-2, -3, 2, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.restore(); return; }
  if (b.arc) { const [s, e] = b.arc; const k = b.life / b.maxLife; ctx.globalAlpha = Math.min(1, k * 3); ctx.lineCap = "round"; const seg = 7; for (const [wd, col] of [[7, b.color], [2.5, "#ffffff"]] as [number, string][]) { ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(s.x, s.y); for (let i = 1; i < seg; i++) { const t = i / seg; ctx.lineTo(s.x + (e.x - s.x) * t + Math.sin(i * 7.3 + frame * 3) * 14, s.y + (e.y - s.y) * t + Math.cos(i * 5.1 + frame * 2) * 14); } ctx.lineTo(e.x, e.y); ctx.stroke(); } ctx.restore(); return; }
  if (b.tether) { ctx.strokeStyle = "#e8dfcf"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, py - 4); const mx = (px + b.x) / 2, my = (py + b.y) / 2 + 14; ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke(); ctx.translate(b.x, b.y); ctx.rotate(b.spin); ctx.fillStyle = b.color; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? b.r * .75 : b.r * 1.15, ang = i / 16 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.arc(0, 0, b.r * .45, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-b.r * .45, 0); ctx.lineTo(b.r * .45, 0); ctx.stroke(); ctx.restore(); return; }
  if (b.weapon === "lance") { ctx.translate(b.x, b.y); ctx.rotate(a); const k = b.life / b.maxLife;
    ctx.globalAlpha = .35; ctx.strokeStyle = b.color; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-46, 0); ctx.lineTo(0, 0); ctx.stroke();   // the rail it came in on
    ctx.globalAlpha = 1; ctx.fillStyle = b.color; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#1a1418"; ctx.beginPath(); ctx.rect(-5, -1.6, 3, 3.2); ctx.fill();                              // the punch-hole
    ctx.globalAlpha = .8 * k; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.rect(-2, -1, 6, 2); ctx.fill(); ctx.globalAlpha = 1; }
  else if (b.weapon === "sprinkler") { ctx.translate(b.x, b.y); ctx.rotate(a);
    ctx.fillStyle = b.color; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.quadraticCurveTo(0, -6, -5, 0); ctx.quadraticCurveTo(0, 6, 7, 0); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(1, -1.4, 1.6, 0, TAU); ctx.fill(); }
  else if (b.weapon === "candle") { ctx.translate(b.x, b.y); const fl = Math.sin(frame * .6 + b.x) * .5 + Math.sin(frame * 1.7) * .3;
    glow(0, -10, 26, "#ffd98a", .3 + .1 * fl);
    ctx.fillStyle = "#f0e4c8"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(-5, -8, 10, 16, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e8d0a0"; ctx.beginPath(); ctx.ellipse(0, -8, 5, 2, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -12); ctx.stroke();
    ctx.fillStyle = fl > .2 ? "#ffe07a" : "#ffb347"; ctx.beginPath();
    ctx.moveTo(0, -22 - fl * 2); ctx.quadraticCurveTo(5, -16, 0, -12); ctx.quadraticCurveTo(-5, -16, 0, -22 - fl * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = .5; ctx.strokeStyle = "#ffd98a"; ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]); ctx.lineDashOffset = -frame; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  else if (b.lob) { const hgt = b.charge || 0; ctx.globalAlpha = .3; ctx.fillStyle = "#0d0a10"; ctx.beginPath(); ctx.ellipse(b.x, b.y + 6, b.r * (1.2 - hgt / 300), b.r * .4, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.translate(b.x, b.y - hgt); ctx.rotate(frame * .4); ctx.fillStyle = "#2a2230"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(-b.r * .3, -b.r * .3, b.r * .35, 0, TAU); ctx.arc(b.r * .35, b.r * .2, b.r * .22, 0, TAU); ctx.fill(); ctx.restore(); return; }
  ctx.translate(b.x, b.y); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
  if (b.enemy) {
    ctx.rotate(b.spin + frame * .3);
    if (b.pink) { glow(0, 0, b.r, pinkC(), .3); ctx.fillStyle = pinkHot(); const pr = b.r * (1 + Math.sin(frame * 1.1) * .12); ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? pr * .6 : pr * 1.35, ang = i / 10 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, pr * .35, 0, TAU); ctx.fill(); }
    else { ctx.fillStyle = b.color; ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? b.r * .65 : b.r * 1.3, ang = i / 8 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 0, b.r * .3, 0, TAU); ctx.fill(); }
    ctx.restore(); return;
  }
  ctx.fillStyle = b.color;
  if (b.pet) {
    const flip = b.vx < 0; ctx.scale(flip ? -1 : 1, 1); const flap = Math.sin(frame * 1.6) * 8;
    ctx.fillStyle = b.color; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-4, -2); ctx.quadraticCurveTo(-14, -10 - flap, -20, -4 - flap); ctx.quadraticCurveTo(-12, 0, -4, 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 2, 12, 9, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-20, 8); ctx.lineTo(-18, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, -6, 8, 0, TAU); outlined(b.color, 2.5);
    ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(24, -3 + (b.pet.hop > 0 ? 3 : 0)); ctx.lineTo(14, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
    pieEye(8, -8, 2.6, 3.4, 0, b.color); ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.moveTo(4, -14); ctx.lineTo(8, -20); ctx.lineTo(11, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore(); return;
  }
  if (b.orbit && b.weapon === "yoyo") { ctx.strokeStyle = "#e8dfcf"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px - b.x, py - 4 - b.y); ctx.lineTo(0, 0); ctx.stroke(); ctx.rotate(frame * .8); ctx.fillStyle = b.color; ctx.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? b.r * .75 : b.r * 1.15, ang = i / 16 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.arc(0, 0, b.r * .45, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (b.orbit) { ctx.rotate(frame * .4); glow(0, 0, 6, b.color, .3); ctx.beginPath(); ctx.ellipse(0, 3, 6, 4.5, -.4, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(5, 2); ctx.lineTo(5, -12); ctx.stroke(); }
  else if (b.wave) { ctx.rotate(a); glow(0, 0, b.r * .8, b.color, .25); ctx.fillStyle = b.color; ctx.beginPath(); ctx.ellipse(-3, 2, 6, 4.5, -.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2, 1); ctx.lineTo(2, -13); ctx.lineTo(9, -10); ctx.stroke(); }
  else if (b.weapon === "frost") { const k = b.life / b.maxLife; ctx.globalAlpha = .3 + k * .6; ctx.rotate(b.spin + frame * .3); ctx.fillStyle = "#e6faff"; ctx.strokeStyle = "#aef1ff"; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const ang = i / 6 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * b.r, Math.sin(ang) * b.r); ctx.moveTo(Math.cos(ang) * b.r * .6, Math.sin(ang) * b.r * .6); ctx.lineTo(Math.cos(ang + .5) * b.r * .8, Math.sin(ang + .5) * b.r * .8); } ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, b.r * .3, 0, TAU); ctx.fill(); }
  else if (b.anvilDrop) {
    ctx.translate(0, 0);
    ctx.fillStyle = "#444b58"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-16, -12); ctx.lineTo(16, -12); ctx.lineTo(12, 10); ctx.lineTo(-12, 10); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8a96a8"; ctx.fillRect(-14, -10, 28, 4);
  }
  else if (b.bubbleFloat) {
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = "#74f0ff"; ctx.lineWidth = 2.5;
    ctx.fillStyle = "rgba(116, 240, 255, 0.25)";
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.ellipse(-b.r * 0.35, -b.r * 0.35, b.r * 0.25, b.r * 0.15, -0.6, 0, TAU); ctx.fill();
  }
  else if (b.sonicRing) {
    ctx.globalAlpha = (b.life / b.maxLife) * 0.85;
    ctx.strokeStyle = b.color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, b.r * 0.75, 0, TAU); ctx.stroke();
  }
  else if (b.sentry) { ctx.rotate(frame * .25); ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? b.r * .5 : b.r, ang = i / 10 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.rotate(-frame * .25); pieEye(0, 0, 3, 4.5, 0, b.color); }
  else if (b.trap) {
    // Slapstick Peel: a banana skin lying flat on the boards
    const k = b.trap.armed > 0 ? 1 : Math.min(1, b.life / 8);
    ctx.globalAlpha = k > .8 ? 1 : .55 + k * .45;
    ctx.rotate(b.spin * .3);
    ctx.fillStyle = "#f5d142"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.15, b.r * .55, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e0b520"; for (const ox of [-b.r * .55, 0, b.r * .55]) { ctx.beginPath(); ctx.ellipse(ox, -b.r * .1, b.r * .26, b.r * .4, ox * .05, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = "#8a6a1c"; ctx.beginPath(); ctx.arc(b.r * .95, 0, 2.4, 0, TAU); ctx.fill();
    if (b.trap.armed <= 0) { ctx.globalAlpha = .35 + Math.sin(frame * .8) * .12; ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, b.r * 1.5, b.r * .8, 0, 0, TAU); ctx.stroke(); }
  }
  else if (b.brolly) {
    ctx.rotate(b.spin);
    glow(0, 0, b.r * .7, "#8fd1ff", .3);
    ctx.fillStyle = "#8fd1ff"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-b.r, 0); ctx.quadraticCurveTo(0, -b.r * 1.1, b.r, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 2;
    for (const ox of [-b.r * .5, 0, b.r * .5]) { ctx.beginPath(); ctx.moveTo(ox, -b.r * .05); ctx.lineTo(ox * .6, -b.r * .72); ctx.stroke(); }
    ctx.strokeStyle = "#5a4030"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, b.r * .9); ctx.quadraticCurveTo(0, b.r * 1.25, -4, b.r * 1.25); ctx.stroke();
  }
  else if (b.roll) {
    ctx.rotate(b.spin);
    ctx.fillStyle = "#a9713c"; ctx.strokeStyle = INK; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#5a3a20"; ctx.lineWidth = 4;
    for (const oy of [-b.r * .55, 0, b.r * .55]) { ctx.beginPath(); ctx.moveTo(-b.r * .92, oy); ctx.lineTo(b.r * .92, oy); ctx.stroke(); }
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * b.r * .3, Math.sin(a) * b.r * .3); ctx.lineTo(Math.cos(a) * b.r * .9, Math.sin(a) * b.r * .9); ctx.stroke(); }
    ctx.fillStyle = "#c98a4a"; ctx.beginPath(); ctx.arc(0, 0, b.r * .28, 0, TAU); ctx.fill(); ctx.stroke();
  }
  else if (b.weapon === "kazoo") {
    const f = Math.sin(frame * 3 + b.spin) * 3;
    ctx.fillStyle = "rgba(230,245,255,.5)"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-2, s * 3 - 1, 5, 3 + f * .3, s * .5, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = "#ffc94a"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(0, 0, b.r * .8, b.r * .6, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(-b.r * .5, -b.r * .6, b.r * .34, b.r * 1.2);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(b.r * .45, -b.r * .2, 1.8, 0, TAU); ctx.fill();
  }
  else if (b.weapon === "syrup") {
    ctx.rotate(b.spin + frame * .2);
    ctx.fillStyle = "#b06a2c"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-b.r * .8, -b.r * .7); ctx.lineTo(b.r * .8, -b.r * .7); ctx.lineTo(b.r * .6, b.r * .8); ctx.lineTo(-b.r * .6, b.r * .8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#7a4418"; ctx.fillRect(-b.r * .9, -b.r * .95, b.r * 1.8, b.r * .35); ctx.strokeRect(-b.r * .9, -b.r * .95, b.r * 1.8, b.r * .35);
    ctx.fillStyle = "#e8b06a"; ctx.beginPath(); ctx.ellipse(-b.r * .3, 0, b.r * .22, b.r * .4, 0, 0, TAU); ctx.fill();
  }
  else if (b.roam || b.boomerang) { ctx.rotate(b.spin); ctx.beginPath(); const n = b.roam ? 14 : 4; for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? b.r * .68 : b.r, ang = i / (n * 2) * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.arc(0, 0, b.r * .3, 0, TAU); ctx.fill(); ctx.stroke(); }
  else if (b.beam) { ctx.rotate(a); ctx.globalAlpha = .9; ctx.fillStyle = b.color; ctx.beginPath(); ctx.roundRect(-70 - b.r * 2, -b.r, 84 + b.r * 2, b.r * 2, b.r); ctx.fill(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.roundRect(-50 - b.r, -b.r * .35, 60 + b.r, b.r * .7, b.r * .35); ctx.fill(); }
  else if (b.weapon === "fountain") { const k = b.life / b.maxLife; ctx.globalAlpha = .35 + k * .6; ctx.fillStyle = k > .55 ? "#ffb347" : k > .3 ? "#ff6a3d" : "#2a2230"; ctx.rotate(frame * .7 + b.spin); ctx.beginPath(); for (let i = 0; i < 7; i++) { const rr = b.r * (i % 2 ? .75 : 1) * (1 + Math.sin(frame + i) * .12), ang = i / 7 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); if (k > .5) { ctx.fillStyle = "#fff3c4"; ctx.beginPath(); ctx.arc(0, 0, b.r * .35, 0, TAU); ctx.fill(); } }
  else {
    ctx.rotate(a); ctx.globalAlpha = .35; ctx.strokeStyle = b.color; ctx.lineWidth = Math.max(3, b.r); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-24 - b.r, 0); ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    if (b.weapon === "choir") { ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (b.weapon === "note") { glow(0, 0, b.r, b.color, .3); ctx.fillStyle = "#eaffff"; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.strokeStyle = b.color; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.bezierCurveTo(-12, -9, -18, 9, -28, 0); ctx.stroke(); }
    else if (b.weapon === "mortar") { ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f8ecff"; ctx.beginPath(); ctx.arc(-b.r * .3, -b.r * .3, b.r * .3, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(b.r * .3, b.r * .2, b.r * .18, 0, TAU); ctx.fill(); }
    else if (b.weapon === "kettle") { const c = b.charge ?? .4; glow(0, 0, b.r + c * 6, b.color, .3); ctx.beginPath(); ctx.moveTo(-14 - c * 12, -3); ctx.lineTo(-2, -3 - c * 6); ctx.lineTo(-4, 0); ctx.lineTo(10 + c * 10, 0); ctx.lineTo(-2, 3 + c * 6); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (b.weapon === "shard") { ctx.beginPath(); ctx.moveTo(b.r * 1.4, 0); ctx.lineTo(0, -b.r * .8); ctx.lineTo(-b.r * 1.2, 0); ctx.lineTo(0, b.r * .8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(b.r * .6, 0); ctx.lineTo(0, -b.r * .35); ctx.lineTo(-b.r * .4, 0); ctx.closePath(); ctx.fill(); }
    else { ctx.beginPath(); ctx.roundRect(-8, -b.r * .75, 17, b.r * 1.5, 4); ctx.fill(); ctx.stroke(); }
  }
  ctx.restore();
}
function drawPickup(k: Pickup) {
  ctx.save(); const drop = k.fresh ? (1 - Math.min(1, k.phase / .5)) : 0; ctx.translate(k.x, k.y + Math.sin(k.phase * 3) * 4 - drop * drop * 260); ctx.strokeStyle = INK; ctx.lineWidth = 3;
  if (k.life < 2.5 && Math.floor(k.life * 8) % 2 === 0) ctx.globalAlpha = .4;
  if (k.kind === "heart") { ctx.fillStyle = "#ff5a6a"; ctx.beginPath(); ctx.moveTo(0, 10); ctx.bezierCurveTo(-16, -2, -8, -16, 0, -6); ctx.bezierCurveTo(8, -16, 16, -2, 0, 10); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(-5, -6, 2.5, 3.5, .5, 0, TAU); ctx.fill(); }
  else if (k.kind === "coin") { ctx.scale(Math.abs(Math.cos(k.phase * 4)) * .9 + .1, 1); ctx.fillStyle = "#f4c94f"; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#b8862d"; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); ctx.fillStyle = "#fff4c4"; ctx.font = "900 9px Impact"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("¢", 0, 1);
    const gl = (frame + Math.floor(k.phase * 997)) % 96; if (gl < 10) { const a2 = gl / 10; ctx.globalAlpha = 1 - a2; ctx.strokeStyle = "#fffbe0"; ctx.lineWidth = 2;
      const r2 = 10 + a2 * 7; ctx.beginPath(); ctx.moveTo(-r2, -r2 * .5); ctx.lineTo(-r2 * .4, -r2 * .2); ctx.moveTo(r2 * .5, r2 * .6); ctx.lineTo(r2 * .2, r2 * .3); ctx.stroke(); ctx.globalAlpha = 1; } }
  else if (k.kind === "bulb") { glow(0, 0, 13, pinkC(), .3); ctx.rotate(k.phase * 1.5); ctx.fillStyle = pinkHot(); const pr = 13 + Math.sin(frame * 1.1) * 2; ctx.beginPath(); for (let i = 0; i < 12; i++) { const rr = i % 2 ? pr * .55 : pr * 1.3, ang = i / 12 * TAU; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#fff"; ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill(); }
  else if (k.kind === "weapon" && k.weapon) {
    const wd = WEAPONS[k.weapon]; glow(0, 4, 28, wd.color, .22);
    ctx.globalAlpha = .28; ctx.fillStyle = "#0d0a10"; ctx.beginPath(); ctx.ellipse(0, 26, 30, 8, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save(); ctx.rotate(Math.sin(k.phase * 2) * .06); ctx.fillStyle = "#c9863a"; ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.roundRect(-26, -16, 52, 38, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e8b25a"; ctx.fillRect(-26, -16, 52, 8); ctx.strokeRect(-26, -16, 52, 8); ctx.fillStyle = wd.color; ctx.fillRect(-6, -18, 12, 42); ctx.strokeRect(-6, -18, 12, 42); ctx.fillRect(-28, -1, 56, 10); ctx.strokeRect(-28, -1, 56, 10);
    ctx.fillStyle = "#fff3c4"; ctx.beginPath(); ctx.arc(0, 4, 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.font = "900 13px Impact"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 0, 5); ctx.restore();
    const ty = words() ? -34 + Math.sin(k.phase * 4) * 3 : 0;
    if (words()) { ctx.fillStyle = "#fbf6ea"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-46, ty - 16, 92, 26, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, ty + 10); ctx.lineTo(0, ty + 18); ctx.lineTo(6, ty + 10); ctx.fill(); ctx.stroke();
    iconPath(wd.icon, -26, ty - 3, .45, wd.color); ctx.fillStyle = INK; ctx.font = "900 9px Impact"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(wd.name.toUpperCase(), -10, ty - 3); }
    for (let i = 0; i < 3; i++) { const sa = k.phase * 3 + i * 2.1; ctx.fillStyle = "#fff3c4"; ctx.beginPath(); const sx = Math.cos(sa) * 40, sy = 4 + Math.sin(sa) * 24; ctx.moveTo(sx, sy - 5); ctx.lineTo(sx + 1.5, sy - 1.5); ctx.lineTo(sx + 5, sy); ctx.lineTo(sx + 1.5, sy + 1.5); ctx.lineTo(sx, sy + 5); ctx.lineTo(sx - 1.5, sy + 1.5); ctx.lineTo(sx - 5, sy); ctx.lineTo(sx - 1.5, sy - 1.5); ctx.closePath(); ctx.fill(); }
  }
  else { const pu = POWERUPS[k.kind as keyof typeof POWERUPS]; glow(0, 0, 15, pu.color, .25); ctx.fillStyle = "#fbf6ea"; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = pu.color;
    if (k.kind === "wind") { ctx.strokeStyle = "#74e6ff"; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.quadraticCurveTo(-2, -12, 4, -4); ctx.quadraticCurveTo(8, 2, 12, -4); ctx.moveTo(-10, 5); ctx.quadraticCurveTo(-2, -2, 4, 5); ctx.quadraticCurveTo(8, 10, 12, 5); ctx.stroke(); ctx.fillStyle = "#ff5a6a"; ctx.beginPath(); ctx.moveTo(0, -1); ctx.bezierCurveTo(-7, -7, -3, -13, 0, -9); ctx.bezierCurveTo(3, -13, 7, -7, 0, -1); ctx.fill(); }
    else if (k.kind === "decoy") { ctx.fillStyle = "#c9863a"; ctx.fillRect(-2, -4, 4, 14); ctx.strokeRect(-2, -4, 4, 14); ctx.beginPath(); ctx.arc(0, -7, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-3, -9); ctx.lineTo(-1, -6); ctx.moveTo(-1, -9); ctx.lineTo(-3, -6); ctx.moveTo(3, -9); ctx.lineTo(1, -6); ctx.moveTo(1, -9); ctx.lineTo(3, -6); ctx.stroke(); }
    else if (k.kind === "fireworks") { ctx.fillStyle = "#ff5aa5"; ctx.beginPath(); ctx.moveTo(-3, 10); ctx.lineTo(-3, -4); ctx.lineTo(0, -10); ctx.lineTo(3, -4); ctx.lineTo(3, 10); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffd166"; for (let i = 0; i < 5; i++) { const ang = i / 5 * TAU + k.phase * 3; ctx.beginPath(); ctx.arc(Math.cos(ang) * 11, -6 + Math.sin(ang) * 6, 2, 0, TAU); ctx.fill(); } }
    else if (k.kind === "clock") { ctx.fillStyle = "#f2c14e"; ctx.beginPath(); ctx.arc(0, 1, 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, -6); ctx.moveTo(0, 1); ctx.lineTo(5, 3); ctx.stroke(); ctx.fillRect(-3, -14, 6, 4); }
    else if (k.kind === "star") { ctx.rotate(k.phase * 2); ctx.fillStyle = "#fff3c4"; ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 5 : 12, ang = i / 10 * TAU - Math.PI / 2; ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.rotate(-k.phase * 2); pieEye(-3, 0, 1.6, 2.4, 0, "#fff3c4"); pieEye(3, 0, 1.6, 2.4, 0, "#fff3c4"); }
    else if (k.kind === "magnet") { ctx.strokeStyle = "#d84a45"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.stroke(); ctx.fillStyle = "#d84a45"; ctx.fillRect(-11, -2, 6, 10); ctx.fillRect(5, -2, 6, 10); ctx.strokeRect(-11, -2, 6, 10); ctx.strokeRect(5, -2, 6, 10); ctx.fillStyle = "#fbf6ea"; ctx.fillRect(-11, 4, 6, 4); ctx.fillRect(5, 4, 6, 4); }
    else if (k.kind === "mirror") { ctx.fillStyle = "#b8d8e8"; ctx.beginPath(); ctx.ellipse(0, -2, 9, 11, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#eaf6ff"; ctx.beginPath(); ctx.ellipse(-2, -4, 4, 6, -.4, 0, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(0, 14); ctx.stroke(); ctx.fillStyle = "#8a6a4a"; ctx.fillRect(-4, 13, 8, 3); ctx.strokeRect(-4, 13, 8, 3); }
    else if (k.kind === "bees") { ctx.fillStyle = "#e8f0d8"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(-9, -6, 18, 16, 3); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#c9a227"; ctx.fillRect(-9, -2, 18, 4); ctx.strokeRect(-9, -2, 18, 4); ctx.fillStyle = "#8a6a3a"; ctx.fillRect(-11, -9, 22, 4); ctx.strokeRect(-11, -9, 22, 4); for (let i = 0; i < 3; i++) { const a = frame * .9 + i * 2.1; ctx.fillStyle = "#ffc94a"; ctx.beginPath(); ctx.arc(Math.cos(a) * 13, -13 + Math.sin(a) * 5, 2.6, 0, TAU); ctx.fill(); ctx.stroke(); } }
    else if (k.kind === "grease") { ctx.fillStyle = "#c9a227"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.lineTo(8, 11); ctx.lineTo(-8, 11); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#8a7018"; ctx.fillRect(-11, -8, 22, 5); ctx.strokeRect(-11, -8, 22, 5); ctx.strokeStyle = "#e8d070"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -12); ctx.quadraticCurveTo(9, -18, 13, -14); ctx.stroke(); }
    else if (k.kind === "rapid") { ctx.beginPath(); ctx.moveTo(-2, -10); ctx.lineTo(4, -2); ctx.lineTo(0, -2); ctx.lineTo(3, 9); ctx.lineTo(-5, 0); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if (k.kind === "shield") { ctx.beginPath(); ctx.moveTo(-11, 1); ctx.quadraticCurveTo(0, -14, 11, 1); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, 10); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(0, 2, 8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#ff6a3d"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -5); ctx.quadraticCurveTo(8, -12, 12, -9); ctx.stroke(); ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.arc(12, -10, 2.5 + Math.sin(frame) * 1, 0, TAU); ctx.fill(); } }
  ctx.restore();
}

/**
 * Stage hazards — every biome's signature threat. Telegraphed first (dashed outline /
 * glowing crack) so a player who is watching can always read it and get out of the way.
 */
function drawHazards(g: GameState) {
  const hz = stageH * HORIZON;
  for (const H of g.hazards) {
    if (H.kind !== "pillar" && !onScreen(H.x, H.y, H.r + 90)) continue;
    const k = Math.min(1, H.life / .45) * Math.min(1, (H.max - H.life) * 3 + .25);
    const tele = !H.active;
    ctx.save();
    if (H.kind === "pillar") {
      // Brimstone pillar: a full-height column, telegraphed as a thin crack line
      const col = tele ? "#ff5555" : "#ff7a3a";
      ctx.globalAlpha = tele ? .3 + Math.sin(frame * 1.4) * .16 : .88 * k;
      ctx.fillStyle = col;
      const hw = tele ? H.r * .22 : H.r * .5;
      ctx.beginPath();
      ctx.moveTo(H.x - hw, hz);
      ctx.lineTo(H.x + hw, hz);
      ctx.lineTo(H.x + hw * .8, stageH);
      ctx.lineTo(H.x - hw * .8, stageH);
      ctx.closePath(); ctx.fill();
      if (!tele) {
        ctx.globalAlpha = .75 * k; ctx.fillStyle = "#ffe08a";
        ctx.beginPath(); ctx.moveTo(H.x - hw * .4, hz); ctx.lineTo(H.x + hw * .4, hz); ctx.lineTo(H.x + hw * .3, stageH); ctx.lineTo(H.x - hw * .3, stageH); ctx.closePath(); ctx.fill();
      } else {
        ctx.globalAlpha = .9; ctx.strokeStyle = "#ffb347"; ctx.lineWidth = 2; ctx.setLineDash([9, 7]); ctx.lineDashOffset = -frame * 4;
        ctx.beginPath(); ctx.moveTo(H.x - hw, hz); ctx.lineTo(H.x - hw, stageH); ctx.moveTo(H.x + hw, hz); ctx.lineTo(H.x + hw, stageH); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore(); continue;
    }
    ctx.translate(H.x, H.y);
    if (H.kind === "lava" || H.kind === "geyser") {
      if (tele) {
        ctx.globalAlpha = .4 + Math.sin(frame * 1.3) * .2;
        ctx.fillStyle = H.kind === "lava" ? "#ff5522" : "#8a6fbf";
        ctx.beginPath(); ctx.ellipse(0, 0, H.r * .82, H.r * .34, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#ffe08a"; ctx.lineWidth = 2; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -frame * 3;
        ctx.beginPath(); ctx.ellipse(0, 0, H.r * .95, H.r * .42, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      } else {
        const hgt = 74 + Math.sin(frame * 1.5) * 16;
        ctx.globalAlpha = .55 * k; ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.ellipse(0, 8, H.r * .9, H.r * .3, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = .92 * k; ctx.fillStyle = H.kind === "lava" ? "#ff8c4a" : "#dfe6f2";
        ctx.beginPath(); ctx.moveTo(-H.r * .72, 6);
        ctx.quadraticCurveTo(-H.r * .4, -hgt * .62, -H.r * .1, -hgt);
        ctx.quadraticCurveTo(H.r * .18, -hgt * .7, H.r * .34, -hgt * .92);
        ctx.quadraticCurveTo(H.r * .5, -hgt * .5, H.r * .72, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = H.kind === "lava" ? "#ffe08a" : "#ffffff";
        ctx.beginPath(); ctx.moveTo(-H.r * .32, 5); ctx.quadraticCurveTo(0, -hgt * .55, H.r * .32, 5); ctx.closePath(); ctx.fill();
      }
    } else if (H.kind === "tomb") {
      const rise = tele ? 0 : Math.min(1, (H.max - H.life - H.warn) / .35);
      ctx.globalAlpha = tele ? .45 + Math.sin(frame * 1.5) * .2 : .95 * k;
      if (tele) {
        ctx.strokeStyle = "#bd93f9"; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]); ctx.lineDashOffset = frame * 3;
        ctx.beginPath(); ctx.ellipse(0, 0, H.r, H.r * .4, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = "#7a5a9a"; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-H.r * .6, 0); ctx.lineTo(-H.r * .2, -4); ctx.lineTo(H.r * .2, 2); ctx.lineTo(H.r * .6, -2); ctx.stroke();
      } else {
        const ty = -rise * 30;
        ctx.globalAlpha = .4 * k; ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.ellipse(0, 4, H.r * .9, H.r * .26, 0, 0, TAU); ctx.fill();
        ctx.globalAlpha = .95 * k;
        ctx.fillStyle = "#6a5a80"; ctx.strokeStyle = INK; ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.roundRect(-H.r * .62, ty - H.r * 1.1, H.r * 1.24, H.r * 1.3, [H.r * .5, H.r * .5, 3, 3]); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#4a3f5e"; ctx.beginPath(); ctx.roundRect(-H.r * .42, ty - H.r * .82, H.r * .84, H.r * .78, [H.r * .35, H.r * .35, 2, 2]); ctx.fill();
        ctx.strokeStyle = "#cbb8e0"; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(0, ty - H.r * .72); ctx.lineTo(0, ty - H.r * .24); ctx.moveTo(-H.r * .2, ty - H.r * .58); ctx.lineTo(H.r * .2, ty - H.r * .58); ctx.stroke();
      }
    } else if (H.kind === "wisp") {
      const pulse = 1 + Math.sin(frame * 1.1) * .16;
      glow(0, 0, H.r * 1.5, "#bfe9c8", .4);
      ctx.globalAlpha = .85;
      ctx.fillStyle = "#e6ffb0"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(0, -H.r * pulse); ctx.bezierCurveTo(H.r * .9, -H.r * .3, H.r * .7, H.r * .8, 0, H.r * pulse);
      ctx.bezierCurveTo(-H.r * .7, H.r * .8, -H.r * .9, -H.r * .3, 0, -H.r * pulse); ctx.fill(); ctx.stroke();
      pieEye(-4, -2, 2.4, 3.6, -.2, "#e6ffb0"); pieEye(4, -2, 2.4, 3.6, .2, "#e6ffb0");
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 5, 4, .2, Math.PI - .2); ctx.stroke();
    } else if (H.kind === "spinner") {
      ctx.globalAlpha = .25; ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(0, 0, H.r, 0, TAU); ctx.fill();
      ctx.globalAlpha = .5; ctx.strokeStyle = "#ffd166"; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.lineDashOffset = frame * 2;
      ctx.beginPath(); ctx.arc(0, 0, H.r, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      // post
      ctx.fillStyle = "#5c4033"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-7, -10, 14, 20, 3); ctx.fill(); ctx.stroke();
      // arms
      for (const off of [0, Math.PI]) {
        const a = H.angle + off;
        const tx = Math.cos(a) * H.r, ty = Math.sin(a) * H.r;
        ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.strokeStyle = "#ff6b6b"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.fillStyle = "#ffd166"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
        ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? 7 : 14, ang = i / 10 * TAU + frame * .4; ctx.lineTo(tx + Math.cos(ang) * rr, ty + Math.sin(ang) * rr); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
    } else if (H.kind === "glaze") {
      ctx.globalAlpha = .55;
      const grd = ctx.createRadialGradient(0, 0, H.r * .2, 0, 0, H.r);
      grd.addColorStop(0, "rgba(220,245,255,.85)"); grd.addColorStop(1, "rgba(150,200,230,.12)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(0, 0, H.r, H.r * .48, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = .7; ctx.strokeStyle = "#eafaff"; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const a = i * 1.7 + (H.phase || 0); ctx.beginPath(); ctx.moveTo(Math.cos(a) * H.r * .2, Math.sin(a) * H.r * .1); ctx.lineTo(Math.cos(a) * H.r * .8, Math.sin(a) * H.r * .38); ctx.stroke(); }
    } else if (H.kind === "pendulum") {
      const A = H.pivot!;
      ctx.globalAlpha = .3; ctx.strokeStyle = "#f2c14e"; ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.arc(A.x - H.x, A.y - H.y, H.arm!, Math.PI / 2 - 1.05, Math.PI / 2 + 1.05); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#2a1c12"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(A.x - H.x, A.y - H.y); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = "#e8b25a"; ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, 0, H.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#c9922e"; ctx.beginPath(); ctx.arc(0, 0, H.r * .55, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-H.r * .3, -H.r * .3, H.r * .28, Math.PI, Math.PI * 1.6); ctx.stroke();
    } else if (H.kind === "bolt") {
      if (!H.active) {
        ctx.globalAlpha = .35 + Math.sin(frame * 1.6) * .2; ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 3; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(0, -H.y - 40); ctx.lineTo(0, 0); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.ellipse(0, 0, H.r * .8, H.r * .3, 0, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = "#fff3c4"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -H.y - 60);
        for (let i = 1; i < 6; i++) ctx.lineTo(Math.sin(i * 3.7 + frame) * 14, -H.y - 60 + i * (H.y + 60) / 6);
        ctx.lineTo(0, 0); ctx.stroke();
        ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 3; ctx.stroke();
        glow(0, 0, H.r, "#ffe27a", .5);
      }
    } else if (H.kind === "tome") {
      if (!H.active) {
        ctx.globalAlpha = .3 + (H.timer / H.warn) * .3; ctx.fillStyle = "#0d0a10";
        ctx.beginPath(); ctx.ellipse(0, 0, H.r * (0.4 + H.timer / H.warn * .6), H.r * .3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      } else if (H.timer < H.warn + .5) {
        const fall = Math.max(0, 1 - (H.timer - H.warn) * 4);
        ctx.save(); ctx.translate(0, -fall * 500); ctx.rotate(fall * 2.2);
        ctx.fillStyle = "#6a4a2c"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-H.r * .6, -H.r * .4, H.r * 1.2, H.r * .8, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#c9a86a"; ctx.fillRect(-H.r * .6 + 5, -H.r * .4 + 5, H.r * 1.2 - 10, 4);
        ctx.restore();
      } else {
        ctx.globalAlpha = Math.max(0, 1 - (H.timer - H.warn - .5) * 1.4);
        ctx.fillStyle = "#6a4a2c"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-H.r * .6, -H.r * .3, H.r * 1.2, H.r * .6, 4); ctx.fill(); ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else {
      ctx.globalAlpha = .8 * k; ctx.fillStyle = "#dfe6f2";
      ctx.beginPath(); ctx.moveTo(-H.r * .6, 6); ctx.quadraticCurveTo(0, -H.r * 1.6, H.r * .6, 6); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
}

/** Loyal hounds and bees summoned by the Dog Whistle / Jar of Bees. */
function drawCompanions(g: GameState) {
  for (const c of g.companions) {
    if (!onScreen(c.x, c.y, 40)) continue;
    const k = Math.min(1, c.life / .8);
    ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = k;
    if (c.bee) {
      const f = Math.sin(frame * 4 + c.hop) * 4;
      ctx.fillStyle = "rgba(235,248,255,.6)"; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(-2, s * 3 - 2, 6, 3 + f * .35, s * .5, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = "#ffc94a"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, 7, 5.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = INK; ctx.fillRect(-3, -5.4, 2.6, 10.8); ctx.fillRect(1.4, -5, 2.4, 10);
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(6, -1); ctx.lineTo(10, -3); ctx.stroke();
    } else {
      const hop = Math.abs(Math.sin(c.hop)) * 5;
      ctx.globalAlpha = .28 * k; ctx.fillStyle = "#0d0a10"; ctx.beginPath(); ctx.ellipse(0, 16, 15, 5, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = k; ctx.translate(0, -hop);
      ctx.scale(c.facing, 1);
      // rubber-hose legs
      const sw = Math.sin(c.hop) * 6;
      noodle(-6, 6, -8 + sw, 16, .3, 3.5); noodle(6, 6, 8 - sw, 16, -.3, 3.5);
      // body + tail
      ctx.beginPath(); ctx.ellipse(0, 0, 14, 9, 0, 0, TAU); outlined("#e8c9a0", 3);
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(-13, -3); ctx.quadraticCurveTo(-22, -10 + Math.sin(frame * 1.4) * 5, -18, -16); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(12, -8, 8, 0, TAU); outlined("#e8c9a0", 3);
      ctx.fillStyle = "#c9a27a"; ctx.beginPath(); ctx.moveTo(16, -12); ctx.lineTo(22, -18); ctx.lineTo(20, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -13); ctx.lineTo(3, -20); ctx.lineTo(11, -15); ctx.closePath(); ctx.fill(); ctx.stroke();
      pieEye(14, -9, 2, 3, 0, "#e8c9a0");
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(19, -6, 2.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(15, -4, 4, .2, Math.PI - .4); ctx.stroke();
      // collar
      ctx.fillStyle = "#d84a45"; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(5, -3, 7, 4, 2); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
}

/** Off-screen actors are skipped entirely — creeps spawn well past the edges and walk in. */
const onScreen = (x: number, y: number, pad = 90) => { const sx = x - camX, sy = y - camY; return sx > -pad && sx < stageW + pad && sy > -pad && sy < stageH + pad; };

/** The seam between two districts: two flats, rope lights and a soft ink wash, so a change of
 *  stage reads as walking through a doorway rather than a cut in the picture. */
function drawStageGate(sx: number, hz: number, h: number, t: number) {
  ctx.save();
  const wash = ctx.createLinearGradient(sx - 84, 0, sx + 84, 0);
  wash.addColorStop(0, "rgba(20,14,18,0)"); wash.addColorStop(.5, "rgba(20,14,18,.2)"); wash.addColorStop(1, "rgba(20,14,18,0)");
  ctx.fillStyle = wash; ctx.fillRect(sx - 84, 0, 168, hz + 4);
  const top = Math.min(hz - 26, Math.max(120, hz - 78));      // under the HUD, above the boards
  ctx.strokeStyle = "#3a2c34"; ctx.lineWidth = 4; for (const off of [-30, 30]) { ctx.beginPath(); ctx.moveTo(sx + off, top + 18); ctx.lineTo(sx + off, hz); ctx.stroke(); }
  ctx.strokeStyle = INK; ctx.lineWidth = 9; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(sx - 46, top + 40); ctx.quadraticCurveTo(sx, top - 12, sx + 46, top + 40); ctx.stroke();
  ctx.lineWidth = 5; ctx.strokeStyle = "#54414a"; ctx.beginPath(); ctx.moveTo(sx - 46, top + 40); ctx.quadraticCurveTo(sx, top - 8, sx + 46, top + 40); ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const u = (i + .5) / 7, bx = sx - 46 + 92 * u, by = top + 40 - Math.sin(u * Math.PI) * 44;
    const on = (Math.floor(t / 150) + i) % 3 === 0;
    ctx.fillStyle = on ? "#ffe08a" : "#7a6a58"; ctx.beginPath(); ctx.arc(bx, by, 3.6, 0, TAU); ctx.fill();
    if (on) { ctx.globalAlpha = .3; ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(bx, by, 11, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  }
  // a lit doorway, not a wall: warm hairline down the joint, ink only where the two floors meet
  ctx.strokeStyle = "rgba(255,224,138,.42)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, top + 44); ctx.lineTo(sx, hz - 8); ctx.stroke();
  ctx.strokeStyle = "rgba(20,14,18,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx, hz - 6); ctx.lineTo(sx, h - 4); ctx.stroke();
  ctx.restore();
}

/** A lit gangway where two stacked rows of stages meet. The boards change colour at that line, so
 *  the join is dressed rather than hidden: planks, rope lights and a bulb chase across the width. */
function drawWalkway(sy: number, vw: number, t: number) {
  ctx.save();
  const wash = ctx.createLinearGradient(0, sy - 52, 0, sy + 52);
  wash.addColorStop(0, "rgba(20,14,18,0)"); wash.addColorStop(.5, "rgba(20,14,18,.4)"); wash.addColorStop(1, "rgba(20,14,18,0)");
  ctx.fillStyle = wash; ctx.fillRect(0, sy - 52, vw, 104);
  ctx.strokeStyle = "#2a2230"; ctx.lineWidth = 3;
  for (const off of [-17, 17]) { ctx.beginPath(); ctx.moveTo(0, sy + off); ctx.lineTo(vw, sy + off); ctx.stroke(); }
  ctx.strokeStyle = "rgba(20,14,18,.45)"; ctx.lineWidth = 2;
  for (let x = -74 + (t * .02) % 74; x < vw; x += 74) { ctx.beginPath(); ctx.moveTo(x, sy - 17); ctx.lineTo(x + 12, sy + 17); ctx.stroke(); }
  for (const yy of [sy - 24, sy + 24]) {
    ctx.strokeStyle = "#3a2c34"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(vw, yy); ctx.stroke();
    for (let i = 0, x = 30; x < vw; i++, x += 74) {
      const on = (Math.floor(t / 150) + i) % 3 === 0;
      ctx.fillStyle = on ? "#ffe08a" : "#7a6a58"; ctx.beginPath(); ctx.arc(x, yy, 3.2, 0, TAU); ctx.fill();
      if (on) { ctx.globalAlpha = .26; ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, yy, 9, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
  }
  ctx.restore();
}

const orderBuf: Enemy[] = [];
export function render(c: Ctx, g: GameState, w: number, h: number, t: number) {
  ctx = c; frame = Math.floor(t / 83); lowFx = g.lowFx; stageW = w; stageH = h;
  const biome = BIOMES[g.biome], p = g.player;
  const rows = Math.max(1, Math.round(g.rows || 1)), worldH = Math.max(h, g.worldH || h);
  const bkw = Math.max(320, Math.round(g.worldW / Math.max(1, g.districts)));
  const bkh = Math.max(320, Math.round(worldH / rows));
  const multi = (g.districts > 1 || rows > 1) && (g.worldW > w + 4 || worldH > h + 4);
  setSceneryStyle(fxo.style);
  camX = multi ? Math.max(0, Math.min(Math.max(0, g.worldW - w), g.cam?.x ?? 0)) : 0;
  camY = multi ? Math.max(0, Math.min(Math.max(0, worldH - h), g.cam?.y ?? 0)) : 0;
  let di0 = 0, di1 = 0;
  const world = worldOf(g.map ?? "arena");
  const auth = world.stages.length > 0;
  const tileStage = (c: number, r: number): StageDef | null => (auth ? stageAt(world, c, r) ?? null : null);
  if (!multi) {
    ctx.drawImage(paintBackdrop(biome, w, h), 0, 0);
    applyMood(ctx, g.stage ?? null, 0, 0, w, h, t);
    if (!lowFx) animatedDecor(ctx, biome, w, h, t);
    if (g.stage && fxo.dressing) drawStageProps(ctx, g.stage, w, h, t);
  } else {
    // Authored maps name each tile; the legacy grid offsets rows by four so no two neighbours share
    // a biome — the same rule the sim uses.
    const tileStageOf = (c: number, r: number) => tileStage(c, r);
    const tileBiomeIdx = (c: number, r: number) => {
      const st = tileStageOf(c, r);
      if (st) return st.biome;
      return (((c + r * 4) % BIOMES.length) + BIOMES.length) % BIOMES.length;
    };
    const tileBiome = (c: number, r: number) => BIOMES[tileBiomeIdx(c, r)];
    const cut = bkh * HORIZON;
    // The top row keeps its sky. Every row under it has that band cropped away and its boards
    // stretched to fill the tile, so walking up the map does not put the runner in a skyline.
    const blitBg = (c: number, r: number, x: number, y: number) => {
      const bmp = paintBackdrop(tileBiome(c, r), bkw, bkh);
      if (r === 0) ctx.drawImage(bmp, x, y, bkw, bkh);
      else ctx.drawImage(bmp, 0, cut, bkw, bkh - cut, x, y, bkw, bkh);
      applyMood(ctx, tileStageOf(c, r), x, y, bkw, bkh, t);
    };
    const blitFg = (c: number, r: number, x: number, y: number) => {
      const bmp = paintForeground(tileBiome(c, r), bkw, bkh, true);
      if (r === 0) ctx.drawImage(bmp, x, y, bkw, bkh);
      else ctx.drawImage(bmp, 0, cut, bkw, bkh - cut, x, y + cut, bkw, bkh - cut);
    };
    di0 = Math.max(0, Math.floor(camX / bkw)); di1 = Math.min(g.districts - 1, Math.floor((camX + w) / bkw));
    const rj0 = Math.max(0, Math.floor(camY / bkh)), rj1 = Math.min(rows - 1, Math.floor((camY + h) / bkh));
    for (let r = rj0; r <= rj1; r++) {
      const y0 = Math.round(r * bkh - camY);
      for (let i = di0; i <= di1; i++) {
        const x0 = Math.round(i * bkw - camX);
        if (auth && !tileStageOf(i, r)) {
          // the torn edge has to face the map, or it reads as a rectangle of nothing
          drawVoid(ctx, x0, y0, bkw, bkh, t, { l: canStand(world, i - 1, r), r: canStand(world, i + 1, r), u: canStand(world, i, r - 1), d: canStand(world, i, r + 1) });
          continue;
        }
        blitBg(i, r, x0, y0);
      }
    }
    const hz = bkh * HORIZON;
    const fr = Math.max(rj0, Math.min(rj1, Math.max(0, Math.round(g.tRow || 0))));   // the runner's own row
    for (let k = di0 + 1; k <= di1; k++) {
      const sx = Math.round(k * bkw - camX), SW = Math.max(120, Math.min(300, bkw * .22)), sl = 8, st = SW / sl;
      const y0 = Math.round(fr * bkh - camY);
      if (!lowFx) for (let s = 0; s < sl; s++) {   // stepped cross-dissolve: both stages bleed across the seam
        ctx.save(); ctx.beginPath(); ctx.rect(sx - SW / 2 + st * s, y0, st + 1.5, bkh); ctx.clip();
        ctx.globalAlpha = ((s + 1) / (sl + 1)) * .6; blitBg(k, fr, Math.round(k * bkw - camX), y0);
        ctx.globalAlpha = (1 - (s + 1) / (sl + 1)) * .6; blitBg(k - 1, fr, Math.round((k - 1) * bkw - camX), y0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      for (let r = rj0; r <= rj1; r++) { ctx.save(); ctx.translate(0, Math.round(r * bkh - camY)); drawStageGate(sx, hz, bkh, t); ctx.restore(); }
    }
    if (rows > 1) for (let rr = rj0 + 1; rr <= rj1; rr++) drawWalkway(Math.round(rr * bkh - camY), w, t);
    if (auth) {
      const fr2 = Math.max(0, Math.min(rows - 1, g.tRow || 0));
      for (let k = di0 + 1; k <= di1; k++) {
        const nx = tileStageOf(k, fr2), pv = tileStageOf(k - 1, fr2);
        if (!nx || !pv) continue;
        const from = nx.col > pv.col ? nx : pv;                     // the sign names where you'd go
        if (words()) drawDoorSign(ctx, from.name, Math.round(k * bkw - camX), Math.round(fr2 * bkh - camY + bkh * HORIZON - 30), t);
      }
      for (let rr = rj0 + 1; rr <= rj1; rr++) {
        const below = tileStageOf(g.tCol, rr), above = tileStageOf(g.tCol, rr - 1);
        if (!below || !above) continue;
        if (words()) drawDoorSign(ctx, below.name, Math.round((g.tCol + .5) * bkw - camX), Math.round(rr * bkh - camY - 16), t, true);
      }
    }
    for (let r = rj0; r <= rj1; r++) for (let i = di0; i <= di1; i++) {
      const x0 = Math.round(i * bkw - camX), y0 = Math.round(r * bkh - camY);
      const st = tileStageOf(i, r);
      if (auth && !st) continue;                                   // nothing stands in the void
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 3, y0, bkw + 6, bkh); ctx.clip(); ctx.translate(x0, y0);
      if (!lowFx) animatedDecor(ctx, tileBiome(i, r), bkw, bkh, t);
      if (st && fxo.dressing) drawStageProps(ctx, st, bkw, bkh, t);
      ctx.restore();
    }
    // the props of a wide stage belong behind the actors: mid-height scenery in front of the
    // runner read as a wall he was standing on, which is not the doorway we are trying to sell
    for (let r = rj0; r <= rj1; r++) for (let i = di0; i <= di1; i++) {
      const x0 = Math.round(i * bkw - camX), y0 = Math.round(r * bkh - camY);
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 3, y0, bkw + 6, bkh); ctx.clip();
      ctx.globalAlpha = .9; blitFg(i, r, x0, y0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  ctx.save(); const sh = Math.min(g.shake, 20); ctx.translate((Math.random() - .5) * sh - camX, (Math.random() - .5) * sh - camY);

  // Moving platforms (train carriages or clouds)
  for (const pl of g.platforms) {
    if (pl.kind === "plank") continue;      // authored ledges are drawn as set dressing, from the same table
    ctx.save(); ctx.translate(pl.x, pl.y);
    ctx.fillStyle = "#5c4033"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(0, 0, pl.w, pl.h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#8b5a2b"; ctx.fillRect(4, 4, pl.w - 8, 4);
    // wheels
    ctx.fillStyle = "#333333";
    for (const wx of [16, pl.w - 16]) {
      ctx.beginPath(); ctx.arc(wx, pl.h + 8, 8, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  for (const pu of g.puddles) {
    if (!onScreen(pu.x, pu.y, pu.r + 40)) continue;
    const k = Math.min(1, pu.life / .6) * Math.min(1, (pu.max - pu.life) * 4 + .2);
    if (pu.kind === "fire") { const f = (frame + Math.floor(pu.x)) % 3; ctx.globalAlpha = .85 * k; ctx.fillStyle = "#ff8c4a"; ctx.beginPath(); ctx.moveTo(pu.x - pu.r, pu.y + 4); ctx.quadraticCurveTo(pu.x - pu.r * .4, pu.y - 10 - f * 3, pu.x, pu.y - 20 - f * 4); ctx.quadraticCurveTo(pu.x + pu.r * .5, pu.y - 8, pu.x + pu.r, pu.y + 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.moveTo(pu.x - pu.r * .4, pu.y + 3); ctx.quadraticCurveTo(pu.x, pu.y - 8 - f * 2, pu.x + pu.r * .3, pu.y + 3); ctx.fill(); ctx.fillStyle = "#2a2230"; ctx.globalAlpha = .4 * k; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 6, pu.r, pu.r * .35, 0, 0, TAU); ctx.fill(); continue; }
    if (pu.kind === "decoy") { ctx.save(); ctx.translate(pu.x, pu.y); ctx.rotate(Math.sin(frame * .4) * .12); ctx.globalAlpha = Math.min(1, pu.life * 2); ctx.fillStyle = "#c9863a"; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.fillRect(-4, -10, 8, 40); ctx.strokeRect(-4, -10, 8, 40); ctx.beginPath(); ctx.roundRect(-16, -14, 32, 24, 5); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -30, 14, 0, TAU); ctx.fillStyle = "#e8c9a0"; ctx.fill(); ctx.stroke(); ctx.fillStyle = INK; for (const sx of [-5, 5]) { ctx.beginPath(); ctx.moveTo(sx - 3, -33); ctx.lineTo(sx + 3, -27); ctx.moveTo(sx + 3, -33); ctx.lineTo(sx - 3, -27); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, -24, 5, 0, Math.PI); ctx.stroke(); ctx.fillStyle = "#d84a45"; ctx.beginPath(); ctx.arc(0, -2, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, -2, 2.5, 0, TAU); ctx.fill(); ctx.restore(); continue; }
    if (pu.kind === "geyser") {
      ctx.save(); ctx.translate(pu.x, pu.y);
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath(); ctx.moveTo(-pu.r * 0.6, 0); ctx.quadraticCurveTo(0, -pu.r * 2.2, pu.r * 0.6, 0); ctx.fill();
      ctx.restore(); continue;
    }
    if (pu.kind === "crater") {
      ctx.globalAlpha = .9 * k; ctx.fillStyle = "#241d33"; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 4, pu.r * k, pu.r * .4 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#d9a8ff"; ctx.lineWidth = 2.5; ctx.globalAlpha = .55 * k; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 4, pu.r * k, pu.r * .4 * k, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + pu.x; ctx.fillStyle = "#6a5a8a"; ctx.beginPath(); ctx.arc(pu.x + Math.cos(a) * pu.r * .8 * k, pu.y + 4 + Math.sin(a) * pu.r * .3, 3, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1; continue;
    }
    if (pu.kind === "web") { ctx.save(); ctx.translate(pu.x, pu.y); ctx.scale(1, .5); ctx.globalAlpha = .8 * k; ctx.strokeStyle = "#f3efe6"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * pu.r, Math.sin(a) * pu.r); } for (let rr = pu.r * .3; rr < pu.r; rr += pu.r * .22) { for (let i = 0; i <= 8; i++) { const a = i / 8 * TAU; ctx.lineTo(Math.cos(a) * rr * (i % 2 ? .92 : 1), Math.sin(a) * rr * (i % 2 ? .92 : 1)); } } ctx.stroke(); ctx.restore(); continue; }
    if (pu.kind === "syrup") {
      ctx.globalAlpha = .82 * k; ctx.fillStyle = "#8a4a18"; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 4, pu.r * k, pu.r * .42 * k, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "#b06a2c"; ctx.globalAlpha = .7 * k; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 3, pu.r * .78 * k, pu.r * .3 * k, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#e8b06a"; ctx.lineWidth = 2; ctx.globalAlpha = .5 * k;
      for (let i = 0; i < 3; i++) { const a2 = i * 2.1 + frame * .05; ctx.beginPath(); ctx.ellipse(pu.x + Math.cos(a2) * pu.r * .35, pu.y + 3 + Math.sin(a2) * pu.r * .14, 5 + i, 2.5, 0, 0, TAU); ctx.stroke(); }
      if (!lowFx) { ctx.globalAlpha = .45 * k; ctx.fillStyle = "#ffb347"; for (let i = 0; i < 3; i++) { const bx = pu.x + Math.sin(i * 2.2 + frame * .22) * pu.r * .55; ctx.beginPath(); ctx.arc(bx, pu.y + 2 + Math.sin(frame * .5 + i) * 2, 2 + i % 2, 0, TAU); ctx.fill(); } }
      continue;
    }
    if (pu.kind === "grease") {
      ctx.globalAlpha = .6 * k;
      const grd = ctx.createRadialGradient(pu.x, pu.y + 3, pu.r * .15, pu.x, pu.y + 3, pu.r);
      grd.addColorStop(0, "rgba(201,162,39,.9)"); grd.addColorStop(1, "rgba(201,162,39,.08)");
      ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 3, pu.r * k, pu.r * .44 * k, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = .5 * k; ctx.strokeStyle = "#f0dc90"; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const a2 = i * 2 + frame * .04; ctx.beginPath(); ctx.ellipse(pu.x + Math.cos(a2) * pu.r * .4, pu.y + 3 + Math.sin(a2) * pu.r * .16, 6, 2.6, 0, 0, TAU); ctx.stroke(); }
      continue;
    }
    ctx.globalAlpha = .75 * k; ctx.fillStyle = "#2a2230"; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 4, pu.r * k, pu.r * .42 * k, 0, 0, TAU); ctx.fill(); ctx.fillStyle = "#6b4fbf"; ctx.globalAlpha = .55 * k; ctx.beginPath(); ctx.ellipse(pu.x, pu.y + 4, pu.r * .8 * k, pu.r * .3 * k, 0, 0, TAU); ctx.fill(); if (!lowFx) for (let i = 0; i < 4; i++) { const bx = pu.x + Math.sin(i * 2.4 + frame * .3) * pu.r * .5 * k, by = pu.y + Math.cos(i * 1.7 + frame * .2) * pu.r * .15; ctx.fillStyle = "#9b86e0"; ctx.beginPath(); ctx.arc(bx, by, 3 + (frame + i) % 3, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;

  drawHazards(g);

  // Porkrind Shop NPC on stage when active
  if (g.shopNpc && g.shopNpc.active) {
    const sx = g.shopNpc.x, sy = g.shopNpc.y;
    ctx.save(); ctx.translate(sx, sy);
    // Stall counter
    ctx.fillStyle = "#8a5a36"; ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-42, 6, 84, 28, 4); ctx.fill(); ctx.stroke();
    // Awning stripes
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = (i % 2 === 0) ? "#d84a45" : "#fbf6ea";
      ctx.fillRect(i * 12, -26, 12, 14);
      ctx.strokeRect(i * 12, -26, 12, 14);
    }
    // Pig merchant face & eyepatch
    ctx.beginPath(); ctx.arc(0, -6, 16, 0, TAU); outlined("#f4b2a8");
    ctx.beginPath(); ctx.ellipse(0, -3, 8, 5, 0, 0, TAU); outlined("#e68e83", 2);
    pieEye(5, -9, 3, 4, 0, "#f4b2a8", false);
    // eyepatch on left eye
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(-5, -9, 4.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-16, -12); ctx.lineTo(16, -4); ctx.stroke();
    // sign
    if (words()) label("PORBO'S EMPO'IUM", 0, -36, 11, "#ffd700", 0, 3);
    ctx.restore();
  }
  orderBuf.length = 0; for (const e of g.enemies) if (onScreen(e.x, e.y, e.r + 80)) orderBuf.push(e);
  orderBuf.sort((a, b) => a.y - b.y);
  for (const k of g.pickups) if (onScreen(k.x, k.y, 40)) drawPickup(k);
  drawCompanions(g);
  let drewPlayer = false;
  for (const e of orderBuf) { if (!drewPlayer && e.y + e.r > p.y + 10) { drawPlayer(p, g); drewPlayer = true; } drawEnemy(e, g); }
  if (!drewPlayer) drawPlayer(p, g);
  if (p.star > 0) { ctx.save(); ctx.translate(p.x, p.y - 4); ctx.rotate(frame * .3); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.fillStyle = ["#ffd75a", "#ff8ad3", "#74e6ff", "#8fd15a", "#ff6a3d"][i]; ctx.beginPath(); const sx = Math.cos(a) * 44, sy = Math.sin(a) * 44; for (let j = 0; j < 10; j++) { const rr = j % 2 ? 3 : 7, ang = j / 10 * TAU; ctx.lineTo(sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr); } ctx.closePath(); ctx.fill(); } ctx.restore(); }
  if (p.clock > 0) { ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = "#f2c14e"; ctx.lineWidth = 3; ctx.setLineDash([12, 10]); ctx.lineDashOffset = -frame * 5; ctx.beginPath(); ctx.arc(p.x, p.y - 4, 60, 0, TAU); ctx.stroke(); ctx.restore(); }
  for (const b of g.bullets) if (onScreen(b.x, b.y, b.r + 60)) drawBullet(b, p.x, p.y);
  // Target lock / reticle indicator
  let lockedEnemy: Enemy | null = null;
  let bestD = Infinity;
  for (const e of g.enemies) {
    if (e.hp > 0 && !e.hidden && e.airborne <= 0 && e.alpha > 0.2) {
      const d = dist(e, p);
      if (d < bestD) { bestD = d; lockedEnemy = e; }
    }
  }
  if (lockedEnemy && bestD < 460) {
    ctx.save();
    ctx.translate(lockedEnemy.x, lockedEnemy.y);
    ctx.strokeStyle = lockedEnemy.pink ? pinkC() : "#ffd75a";
    ctx.lineWidth = 2.5;
    const br = lockedEnemy.r + 8 + Math.sin(frame * 0.8) * 2;
    const cr = 6;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(br - cr, -br);
      ctx.lineTo(br, -br);
      ctx.lineTo(br, -br + cr);
      ctx.stroke();
    }
    ctx.restore();
  }
  for (const gh of g.ghosts) { if (!onScreen(gh.x, gh.y, 50)) continue; const k = gh.life / 1.1; ctx.save(); ctx.globalAlpha = k * .85; ctx.translate(gh.x + Math.sin(frame * .5 + gh.phase) * 4, gh.y); const r = gh.size * .8; ctx.fillStyle = "#fbf6ea"; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-r, r * .8); ctx.lineTo(-r, -r * .2); ctx.arc(0, -r * .2, r, Math.PI, 0); ctx.lineTo(r, r * .8); for (let i = 0; i < 4; i++) ctx.lineTo(r - (i + .5) * r / 2, r * (i % 2 ? .8 : 1.1)); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.lineWidth = 2; const ex = r * .4; for (const sx of [-ex, ex]) { ctx.beginPath(); ctx.moveTo(sx - 4, -r * .4 - 4); ctx.lineTo(sx + 4, -r * .4 + 4); ctx.moveTo(sx + 4, -r * .4 - 4); ctx.lineTo(sx - 4, -r * .4 + 4); ctx.stroke(); } ctx.strokeStyle = "#ffd75a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -r * 1.35, r * .7, r * .22, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  for (const q of g.puffs) {
    if (q.shell) { const k = q.life / q.max; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.spin || 0);
      ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = q.color; ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.rect(-3, -1.6, 6, 3.2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fillRect(-3, -1.6, 2, 1.2); ctx.restore(); ctx.globalAlpha = 1; continue; }
    if (!onScreen(q.x, q.y, 40)) continue;
    const k = q.life / q.max; ctx.globalAlpha = k;
    if (q.ring) { ctx.strokeStyle = q.color; ctx.lineWidth = 6 * k + 2; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.15 - k), 0, TAU); ctx.stroke(); }
    else { ctx.fillStyle = q.color; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1.35 - k), 0, TAU); ctx.fill(); if (q.size > 5) ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  if (pops()) for (const tx of g.texts) { const k = tx.life / tx.max, pop = k > .8 ? 1 + (k - .8) * 3 : 1; ctx.globalAlpha = Math.min(1, k * 2.2); label(tx.text, tx.x, tx.y, (tx.big ? 30 : 20) * pop, tx.color, tx.rot, tx.big ? 7 : 5); }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.save(); ctx.globalAlpha = .92; ctx.translate(Math.sin(t * .0006) * 3, 0);
  if (!multi) ctx.drawImage(paintForeground(biome, w, h), 0, 0);   // in one screen the props do occlude, that is the depth cue
  ctx.restore();

  // Boss Dramatic Intro Splash Card — a card of pure type, so a clean screen drops it whole
  if (g.bossIntro && words()) {
    const k = Math.min(1, g.bossIntro.life / 0.5);
    ctx.save();
    ctx.globalAlpha = k * 0.95;
    ctx.fillStyle = "rgba(18, 12, 22, 0.88)";
    ctx.fillRect(0, h * 0.32, w, h * 0.36);
    ctx.strokeStyle = "#ffd75a"; ctx.lineWidth = 4;
    ctx.strokeRect(0, h * 0.32, w, h * 0.36);
    label(g.bossIntro.name.toUpperCase(), w * 0.5, h * 0.42, 38, "#ffd700", 0, 6);
    label(g.bossIntro.title, w * 0.5, h * 0.50, 16, "#fbf6ea", 0, 4);
    ctx.font = 'italic 900 13px Georgia, serif';
    ctx.fillStyle = "#ff8ad3"; ctx.textAlign = "center";
    ctx.fillText(`"${g.bossIntro.quote}"`, w * 0.5, h * 0.58);
    ctx.restore();
  }

  // On a map this size the useful question is "where is the trouble?". A chevron on the bezel points
  // at the nearest creep and says how many screens away it is, so wandering off never feels lost.
  if (multi) {
    let bt: Enemy | null = null, bd = Infinity;
    for (const e of g.enemies) {
      if (e.hidden || e.hp <= 0) continue;
      const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
      if (d2 < bd) { bd = d2; bt = e; }
    }
    if (bt) {
      const sx = bt.x - camX, sy = bt.y - camY, mg = 44;
      const cx = w / 2, cy = h / 2, dx = sx - cx, dy = sy - cy;
      if (Math.abs(dx) > cx - mg || Math.abs(dy) > cy - mg) {
        const k = Math.min(1, Math.abs(dx) > .001 ? (cx - mg) / Math.abs(dx) : 1e9, Math.abs(dy) > .001 ? (cy - mg) / Math.abs(dy) : 1e9);
        const ex = cx + dx * k, ey = cy + dy * k, ang = Math.atan2(dy, dx);
        const dc = pinkC(), far = Math.hypot(dx, dy) / Math.max(1, w);
        ctx.save(); ctx.translate(ex, ey); ctx.globalAlpha = .92;
        glow(0, 0, 13, dc, .3);
        ctx.rotate(ang); ctx.fillStyle = dc; ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-6, -10); ctx.lineTo(-1, 0); ctx.lineTo(-6, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        if (words()) {
          // The chevron rides the bezel, so its caption can hang half off-screen: pull it back in.
          const lx = Math.max(52, Math.min(w - 52, ex)), ly = Math.max(24, Math.min(h - 16, ey + 22));
          label(far >= 1 ? `${far.toFixed(1)} SCREENS` : `${Math.round(Math.hypot(dx, dy))} PACE${Math.round(Math.hypot(dx, dy)) === 1 ? "" : "S"}`, lx, ly, 12, "#fbf6ea", 0, 4);
        }
      }
    }
  }

  // Keep off-screen actors readable without opening a map. The same edge language is used for
  // enemies, incoming enemy fire, and player shots that are still travelling through another
  // district, so the player can react before anything enters the camera.
  const edgeSignal = (x: number, y: number, color: string, caption: string, pulse: number) => {
    const sx = x - camX, sy = y - camY, mg = 24;
    if (sx > mg && sx < w - mg && sy > mg && sy < h - mg) return;
    const cx = w / 2, cy = h / 2, dx = sx - cx, dy = sy - cy;
    const k = Math.min(1, Math.abs(dx) > .001 ? (cx - mg) / Math.abs(dx) : 1e9, Math.abs(dy) > .001 ? (cy - mg) / Math.abs(dy) : 1e9);
    const ex = cx + dx * k, ey = cy + dy * k, ang = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang); ctx.globalAlpha = .72 + Math.sin(t * .01 + pulse) * .2;
    ctx.fillStyle = color; ctx.strokeStyle = INK; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -7); ctx.lineTo(-2, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    if (words()) label(caption, Math.max(38, Math.min(w - 38, ex)), Math.max(16, Math.min(h - 12, ey + 16)), 10, color, 0, 3);
  };
  let enemySignals = 0, threatSignals = 0, weaponSignals = 0;
  for (const e of g.enemies) {
    if (enemySignals >= 5 || e.hidden || e.hp <= 0 || onScreen(e.x, e.y, e.r + 20)) continue;
    edgeSignal(e.x, e.y, e.pink ? pinkC() : "#ffd75a", "ENEMY", enemySignals++);
  }
  for (const b of g.bullets) {
    if (b.enemy && threatSignals < 4 && !onScreen(b.x, b.y, b.r + 12)) {
      edgeSignal(b.x, b.y, pinkHot(), "INCOMING", threatSignals++ + 11);
    } else if (!b.enemy && weaponSignals < 3 && !onScreen(b.x, b.y, b.r + 12)) {
      edgeSignal(b.x, b.y, "#74e6ff", "SHOT", weaponSignals++ + 23);
    }
  }

  if (g.modifier?.id === "fog") { // rolling fog with a clear pocket around the player
    const grd = ctx.createRadialGradient(p.x - camX, p.y - camY, 60, p.x - camX, p.y - camY, 260); grd.addColorStop(0, "rgba(220,214,200,0)"); grd.addColorStop(1, "rgba(220,214,200,.82)"); ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
    if (!lowFx) { ctx.globalAlpha = .25; ctx.fillStyle = "#ece6da"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(((t * .03 * (1 + i % 3 * .3)) + i * 260) % (w + 400) - 200, h * .4 + i * 60 + Math.sin(t * .001 + i) * 20, 220, 40, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  }
  if (!post) { // CSS-less fallback effects when the WebGL pass is unavailable
    if (g.flash > 0) { ctx.globalAlpha = g.flash * .7; ctx.fillStyle = "#fff3d6"; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
    if (g.slowmo > 0) { ctx.globalAlpha = .18; ctx.fillStyle = "#2a1330"; ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
    if (g.modifier?.id === "pink") { ctx.globalAlpha = .08 + Math.sin(t * .01) * .03; ctx.fillStyle = pinkC(); ctx.fillRect(0, 0, w, h); ctx.globalAlpha = 1; }
  }
  // ---- SPEED LINES: hot combos ----
  if (fxo.speedlines && p && g.combo >= 40) {
    const power = Math.min(.55, (g.combo - 40) / 90);
    const tNew = p.trail[p.trail.length - 1], tOld = p.trail[0];
    const a0 = tNew && tOld && Math.hypot(tNew.x - tOld.x, tNew.y - tOld.y) > 6
      ? Math.atan2(tOld.y - tNew.y, tOld.x - tNew.x)      // streaks trail behind the motion
      : Math.atan2(-p.dashDir.y, -p.dashDir.x);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < 16; i++) {
      const a = a0 + (i / 16 - .5) * 1.5 + boil(i * 31) * .04;
      const r0 = 54 + boil(i * 13) * 26 + (1 - power) * 40;
      const len = 40 + power * 150 + boil(i * 3) * 30;
      ctx.globalAlpha = .1 + power * .3;
      ctx.strokeStyle = i % 3 === 0 ? "#fff6e2" : "#e8c9a0";
      ctx.lineWidth = 1.5 + power * 2.5;
      ctx.beginPath();
      ctx.moveTo(p.x - camX + Math.cos(a) * r0, p.y - camY - 6 + Math.sin(a) * r0 * .5);
      ctx.lineTo(p.x - camX + Math.cos(a) * (r0 + len), p.y - camY - 6 + Math.sin(a) * (r0 + len) * .5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ---- ON THE BEAT: metronome ring around the star ----
  if (g.mode === "beat") {
    const B = 60 / 88, ph = (g.beatT % B) / B, p = g.player;
    ctx.save();
    ctx.globalAlpha = .5 * (1 - ph);
    ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.r + 8 + ph * 40, 0, TAU); ctx.stroke();
    if (g.onBeat) { ctx.globalAlpha = .9; ctx.strokeStyle = "#ffe27a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.r + 7, 0, TAU); ctx.stroke(); }
    ctx.restore();
  }
  // ---- BULLET DANCE: the floor is a ballroom, and your streak is the band ----
  if (g.mode === "bulletdance") {
    const p = g.player, d = g.dance, heat = Math.min(1, d.heat / 2.2);
    ctx.save();
    ctx.globalAlpha = .10 + heat * .16;
    const bg = ctx.createRadialGradient(p.x - camX, p.y - camY, 20, p.x - camX, p.y - camY, 260);
    bg.addColorStop(0, pinkC()); bg.addColorStop(1, fxo.contrast ? "rgba(56,232,255,0)" : "rgba(255,122,217,0)");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, 260, 0, TAU); ctx.fill();
    if (d.streak > 0) {
      const seg = Math.min(12, d.streak);
      ctx.globalAlpha = .85; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.strokeStyle = "#ffe27a";
      for (let i = 0; i < seg; i++) { const a0 = -Math.PI / 2 + (i / 12) * TAU; ctx.beginPath(); ctx.arc(p.x - camX, p.y - camY, p.r + 16 + heat * 5, a0, a0 + .3); ctx.stroke(); }
      if (d.streak > 12 && words()) { ctx.globalAlpha = .7; ctx.fillStyle = "#ffe27a"; ctx.font = "900 13px Impact, sans-serif"; ctx.textAlign = "center"; ctx.fillText(`×${(1 + d.heat * .9).toFixed(2)}`, p.x - camX, p.y - camY - p.r - 24); }
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  // ---- BLACKOUT: the world shrinks to your circle of light ----
  if (g.mode === "blackout") {
    const p = g.player, fl = 1 + Math.sin(t * .013) * .04;
    const grd = ctx.createRadialGradient(p.x - camX, p.y - camY, g.lightR * .35 * fl, p.x - camX, p.y - camY, g.lightR * fl);
    grd.addColorStop(0, "rgba(4,2,10,0)"); grd.addColorStop(.75, "rgba(4,2,10,.72)"); grd.addColorStop(1, "rgba(4,2,10,.97)");
    ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  }
  if (!lowFx) { ctx.globalAlpha = .12; ctx.fillStyle = "#f3e6c7"; for (let i = 0; i < 40; i++) ctx.fillRect((i * 97 + t * .02 * (1 + i % 3)) % w, (i * 173 + t * .01) % h, 1.5, 1.5); ctx.globalAlpha = 1; }
}
let post = false;
export function setPostEnabled(v: boolean) { post = v; }
