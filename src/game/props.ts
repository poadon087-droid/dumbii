/**
 * The set dressing of the authored world: everything that stands on the boards.
 *
 * Each prop is drawn from its own feet, at unit scale `u` (u = 1 at a 620px-tall screen), with the
 * house inking: flat fill, one highlight, a 3px outline and a contact shadow. `night` dims the
 * fill and lets the lit windows and flames come forward, which is how two stages using the same
 * art set read as different places.
 */
import type { StageDef, PropKind } from "./world";

type C = CanvasRenderingContext2D;
const INK = "#171217";

const ink = (c: C, fill: string, lw = 3) => { c.fillStyle = fill; c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = "round"; };
const shadow = (c: C, w: number, u: number) => {
  c.globalAlpha = .3; c.fillStyle = "#120e16";
  c.beginPath(); c.ellipse(0, 2 * u, w, w * .3, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
};
const lit = (kind: string) => kind;   // readability only

function box(c: C, x: number, y: number, w: number, h: number, fill: string, lw = 3) {
  ink(c, fill, lw); c.beginPath(); c.rect(x, y, w, h); c.fill(); c.stroke();
}
function post(c: C, x: number, topY: number, botY: number, w: number, fill: string) {
  ink(c, fill); c.beginPath(); c.rect(x - w / 2, topY, w, botY - topY); c.fill(); c.stroke();
}
function bulb(c: C, x: number, y: number, r: number, colour: string, t: number, phase = 0) {
  const pulse = .65 + .35 * Math.sin(t * .0035 + phase);
  c.globalAlpha = .5 * pulse; c.fillStyle = colour;
  c.beginPath(); c.arc(x, y, r * 2.6, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1; c.fillStyle = "#fff3c4";
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
}

/** painters: all take (ctx, u, t, night) with the origin at the prop's feet */
const PAINT: Partial<Record<PropKind, (c: C, u: number, t: number, night: number) => void>> = {
  watertower: (c, u, _t, n) => {
    shadow(c, 30 * u, u);
    for (const sx of [-22, 22]) post(c, sx * u, -46 * u, 0, 6 * u, "#4a3a34");
    post(c, -12 * u, -34 * u, 0, 5 * u, "#4a3a34"); post(c, 12 * u, -34 * u, 0, 5 * u, "#4a3a34");
    ink(c, n > .4 ? "#5d4a3c" : "#3c3038");
    c.beginPath(); c.moveTo(-30 * u, -70 * u); c.lineTo(30 * u, -70 * u); c.lineTo(24 * u, -40 * u); c.lineTo(-24 * u, -40 * u); c.closePath(); c.fill(); c.stroke();
    ink(c, "#7a5f48"); c.beginPath(); c.moveTo(-20 * u, -92 * u); c.lineTo(20 * u, -92 * u); c.lineTo(30 * u, -70 * u); c.lineTo(-30 * u, -70 * u); c.closePath(); c.fill(); c.stroke();
    ink(c, "#2c2430"); c.beginPath(); c.moveTo(-22 * u, -92 * u); c.lineTo(0, -108 * u); c.lineTo(22 * u, -92 * u); c.closePath(); c.fill(); c.stroke();
    c.globalAlpha = .35; ink(c, "#fff3c4", 0); c.fillRect(-16 * u, -86 * u, 6 * u, 14 * u); c.globalAlpha = 1;
  },
  billboard: (c, u, t, n) => {
    shadow(c, 34 * u, u);
    post(c, -22 * u, -44 * u, 0, 6 * u, "#3f3038"); post(c, 22 * u, -44 * u, 0, 6 * u, "#3f3038");
    box(c, -40 * u, -104 * u, 80 * u, 60 * u, n > .35 ? "#c9b487" : "#8e7c5d", 4);
    box(c, -34 * u, -98 * u, 68 * u, 48 * u, "#e8dcc0", 2);
    c.strokeStyle = "#b4453a"; c.lineWidth = 4 * u;
    for (let i = 0; i < 3; i++) { const y = -90 * u + i * 14 * u; c.beginPath(); c.moveTo(-28 * u, y); c.lineTo((i === 1 ? 10 : 26) * u, y); c.stroke(); }
    c.globalAlpha = .5 + .5 * Math.sin(t * .004); ink(c, "#ffd75a", 0); c.fillRect(20 * u, -96 * u, 8 * u, 8 * u); c.globalAlpha = 1;
  },
  fence: (c, u, _t, n) => {
    shadow(c, 44 * u, u);
    ink(c, n > .4 ? "#6b5346" : "#3b2f36");
    for (let i = -4; i <= 4; i++) { const x = i * 11 * u; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, -26 * u); c.lineTo(x + 5 * u, -31 * u); c.lineTo(x + 10 * u, -26 * u); c.lineTo(x + 10 * u, 0); c.closePath(); c.fill(); c.stroke(); }
    c.beginPath(); c.moveTo(-46 * u, -18 * u); c.lineTo(46 * u, -18 * u); c.moveTo(-46 * u, -7 * u); c.lineTo(46 * u, -7 * u); c.stroke();
  },
  crates: (c, u, _t, n) => {
    const fill = n > .4 ? "#a9793f" : "#6d4f30";
    shadow(c, 26 * u, u);
    box(c, -22 * u, -22 * u, 22 * u, 22 * u, fill, 3);
    box(c, 2 * u, -20 * u, 20 * u, 20 * u, fill, 3);
    box(c, -14 * u, -40 * u, 20 * u, 18 * u, fill, 3);
    c.strokeStyle = "#e8dcc0"; c.lineWidth = 2;
    for (const [bx, by, bw, bh] of [[-22, -22, 22, 22], [2, -20, 20, 20], [-14, -40, 20, 18]] as const) {
      c.beginPath(); c.moveTo(bx * u, by * u); c.lineTo((bx + bw) * u, (by + bh) * u); c.moveTo((bx + bw) * u, by * u); c.lineTo(bx * u, (by + bh) * u); c.stroke();
    }
  },
  barrels: (c, u, _t, n) => {
    shadow(c, 22 * u, u);
    for (const [bx, s] of [[-14, 1], [10, .82]] as const) {
      ink(c, n > .4 ? "#7c5a3e" : "#463845");
      c.beginPath(); c.ellipse(bx * u, -17 * s * u, 11 * s * u, 17 * s * u, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.strokeStyle = "#d8c69a"; c.lineWidth = 2;
      c.beginPath(); c.ellipse(bx * u, -22 * s * u, 10 * s * u, 3.4 * s * u, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.ellipse(bx * u, -12 * s * u, 10 * s * u, 3.4 * s * u, 0, 0, Math.PI * 2); c.stroke();
    }
  },
  lamppost: (c, u, t, n) => {
    shadow(c, 12 * u, u);
    post(c, 0, -74 * u, 0, 6 * u, "#2f2734");
    ink(c, "#2f2734"); c.beginPath(); c.moveTo(0, -74 * u); c.quadraticCurveTo(14 * u, -84 * u, 22 * u, -76 * u); c.stroke(); c.lineWidth = 4; c.stroke();
    const glow = .55 + .45 * Math.sin(t * .002 + 1);
    c.globalAlpha = .3 * glow * (0.35 + n); ink(c, "#ffe6a8", 0);
    c.beginPath(); c.arc(24 * u, -72 * u, 17 * u, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    ink(c, n > .2 ? "#fff3c4" : "#ffe07a", 2.4);
    c.beginPath(); c.moveTo(17 * u, -72 * u); c.lineTo(31 * u, -72 * u); c.lineTo(27 * u, -60 * u); c.lineTo(21 * u, -60 * u); c.closePath(); c.fill(); c.stroke();
  },
  statue: (c, u, _t, n) => {
    shadow(c, 20 * u, u);
    box(c, -18 * u, -14 * u, 36 * u, 14 * u, "#6f6470", 3);
    ink(c, n > .4 ? "#b7ac9a" : "#7d7484");
    c.beginPath(); c.moveTo(-10 * u, -14 * u); c.lineTo(-13 * u, -54 * u); c.lineTo(13 * u, -54 * u); c.lineTo(10 * u, -14 * u); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -62 * u, 9 * u, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(-11 * u, -48 * u); c.lineTo(-26 * u, -66 * u); c.stroke();
    c.globalAlpha = .5; ink(c, "#fff3c4", 0); c.beginPath(); c.ellipse(-26 * u, -70 * u, 7 * u, 7 * u, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  },
  fountain: (c, u, t, n) => {
    shadow(c, 34 * u, u);
    ink(c, n > .4 ? "#8c8296" : "#5a5165");
    c.beginPath(); c.ellipse(0, -10 * u, 34 * u, 11 * u, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, -30 * u, 16 * u, 6 * u, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    post(c, 0, -30 * u, -10 * u, 7 * u, "#6f6470");
    c.strokeStyle = "#bfe9ff"; c.lineWidth = 2.4; c.globalAlpha = .8;
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2, wob = Math.sin(t * .006 + i) * 3 * u;
      c.beginPath(); c.moveTo(0, -34 * u); c.quadraticCurveTo(Math.cos(a) * 12 * u, -26 * u, Math.cos(a) * 26 * u + wob, -12 * u); c.stroke();
    }
    c.globalAlpha = 1;
  },
  windmill: (c, u, t, n) => {
    shadow(c, 18 * u, u);
    ink(c, n > .4 ? "#9a8265" : "#4d4049");
    c.beginPath(); c.moveTo(-13 * u, 0); c.lineTo(-7 * u, -58 * u); c.lineTo(7 * u, -58 * u); c.lineTo(13 * u, 0); c.closePath(); c.fill(); c.stroke();
    c.save(); c.translate(0, -62 * u); c.rotate(t * .0011);
    ink(c, "#d8c69a", 2.4);
    for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(5 * u, -30 * u); c.lineTo(-6 * u, -28 * u); c.closePath(); c.fill(); c.stroke(); }
    c.restore();
  },
  gravestone: (c, u, _t, n) => {
    shadow(c, 13 * u, u);
    ink(c, n > .4 ? "#8f8798" : "#4e4a5c");
    c.beginPath(); c.moveTo(-10 * u, 0); c.lineTo(-10 * u, -22 * u); c.arc(0, -22 * u, 10 * u, Math.PI, 0); c.lineTo(10 * u, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "#2c2733"; c.lineWidth = 2; c.beginPath(); c.moveTo(-5 * u, -18 * u); c.lineTo(5 * u, -18 * u); c.moveTo(-5 * u, -12 * u); c.lineTo(3 * u, -12 * u); c.stroke();
    c.rotate(-.05);
  },
  wreck: (c, u, _t, n) => {
    shadow(c, 40 * u, u);
    ink(c, n > .4 ? "#7b6a55" : "#463d4a");
    c.beginPath(); c.moveTo(-40 * u, 0); c.quadraticCurveTo(-34 * u, -26 * u, 0, -30 * u); c.quadraticCurveTo(34 * u, -26 * u, 40 * u, -6 * u); c.lineTo(36 * u, 0); c.closePath(); c.fill(); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(-14 * u, -28 * u); c.lineTo(-8 * u, -54 * u); c.lineTo(6 * u, -50 * u); c.stroke();
    c.strokeStyle = "#d8c69a"; c.lineWidth = 2; c.beginPath(); c.moveTo(-26 * u, -14 * u); c.lineTo(22 * u, -12 * u); c.stroke();
  },
  tent: (c, u, t, n) => {
    shadow(c, 38 * u, u);
    ink(c, n > .4 ? "#c25a4e" : "#75332f");
    c.beginPath(); c.moveTo(-36 * u, 0); c.lineTo(0, -50 * u); c.lineTo(36 * u, 0); c.closePath(); c.fill(); c.stroke();
    c.save(); c.beginPath(); c.moveTo(-36 * u, 0); c.lineTo(0, -50 * u); c.lineTo(36 * u, 0); c.closePath(); c.clip();
    ink(c, "#f3e9d2", 0);
    for (let i = -3; i <= 3; i += 2) c.fillRect(i * 11 * u, -52 * u, 9 * u, 54 * u);
    c.restore();
    post(c, 0, -62 * u, -48 * u, 3 * u, "#2f2734");
    c.save(); c.translate(0, -60 * u); c.rotate(Math.sin(t * .002) * .2);
    ink(c, "#ffd75a", 2); c.beginPath(); c.moveTo(0, 0); c.lineTo(16 * u, 5 * u); c.lineTo(0, 10 * u); c.closePath(); c.fill(); c.stroke(); c.restore();
  },
  silo: (c, u, _t, n) => {
    shadow(c, 22 * u, u);
    ink(c, n > .4 ? "#9a8f7c" : "#4f4a52");
    c.beginPath(); c.rect(-18 * u, -84 * u, 36 * u, 84 * u); c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -84 * u, 18 * u, Math.PI, 0); c.fill(); c.stroke();
    c.strokeStyle = "#5c5045"; c.lineWidth = 2;
    for (let i = 1; i < 5; i++) { const y = -84 * u + i * 17 * u; c.beginPath(); c.moveTo(-18 * u, y); c.lineTo(18 * u, y); c.stroke(); }
  },
  pipes: (c, u, t, n) => {
    shadow(c, 30 * u, u);
    ink(c, n > .4 ? "#7d6a5a" : "#453c48", 3);
    c.beginPath(); c.rect(-30 * u, -34 * u, 44 * u, 12 * u); c.fill(); c.stroke();
    c.beginPath(); c.rect(6 * u, -60 * u, 12 * u, 60 * u); c.fill(); c.stroke();
    ink(c, "#9c8a76", 2.4);
    for (const [x, y, w] of [[-30, -34, 8], [14, -34, 8], [6, -60, 12]] as const) c.fillRect(x * u, y * u, w * u, 12 * u);
    c.globalAlpha = .3; ink(c, "#e8dcc0", 0);
    for (let i = 0; i < 3; i++) { const yy = -66 * u - i * 12 * u - (t * .02 % 12); c.beginPath(); c.ellipse(12 * u, yy, (6 + i * 3) * u, (4 + i * 2) * u, 0, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  },
  antenna: (c, u, t, n) => {
    post(c, 0, -58 * u, 0, 4 * u, n > .4 ? "#5a4c52" : "#332c3a");
    c.strokeStyle = INK; c.lineWidth = 2.4;
    for (let i = 0; i < 3; i++) { const y = -54 * u + i * 8 * u; c.beginPath(); c.moveTo(-11 * u, y + 8 * u); c.lineTo(0, y); c.lineTo(11 * u, y + 8 * u); c.stroke(); }
    bulb(c, 0, -62 * u, 3 * u, "#ff6a3d", t, 0);
    void lit("antenna");
  },
  laundry: (c, u, t, n) => {
    post(c, -46 * u, -46 * u, 0, 4 * u, "#3a3040"); post(c, 46 * u, -46 * u, 0, 4 * u, "#3a3040");
    c.strokeStyle = "#d8c69a"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-46 * u, -44 * u); c.quadraticCurveTo(0, -34 * u + Math.sin(t * .0012) * 2 * u, 46 * u, -44 * u); c.stroke();
    const cloths = ["#c9524c", "#e8dcc0", "#6fa8d6", "#f0c46a", "#9c7fb8"];
    for (let i = 0; i < 5; i++) {
      const x = -36 * u + i * 18 * u, sway = Math.sin(t * .0016 + i) * 3 * u;
      ink(c, cloths[i], 2);
      c.beginPath(); c.moveTo(x, -42 * u); c.lineTo(x + 13 * u, -41 * u); c.lineTo(x + 12 * u + sway, -22 * u); c.lineTo(x + sway, -23 * u); c.closePath(); c.fill(); c.stroke();
    }
    void n;
  },
  stall: (c, u, t, n) => {
    shadow(c, 28 * u, u);
    box(c, -26 * u, -26 * u, 52 * u, 26 * u, n > .4 ? "#8a6b45" : "#4d3d33", 3);
    box(c, -24 * u, -20 * u, 16 * u, 10 * u, "#ffd75a", 2); box(c, -4 * u, -20 * u, 12 * u, 10 * u, "#c9524c", 2); box(c, 10 * u, -20 * u, 12 * u, 10 * u, "#8fd15a", 2);
    post(c, -26 * u, -54 * u, -26 * u, 4 * u, "#3a2f36"); post(c, 26 * u, -54 * u, -26 * u, 4 * u, "#3a2f36");
    ink(c, "#e8dcc0", 2.4);
    c.beginPath(); c.moveTo(-32 * u, -54 * u); c.lineTo(32 * u, -54 * u); c.lineTo(28 * u, -44 * u); c.lineTo(-28 * u, -44 * u); c.closePath(); c.fill(); c.stroke();
    c.save(); c.beginPath(); c.rect(-32 * u, -54 * u, 64 * u, 11 * u); c.clip(); ink(c, "#b4453a", 0);
    for (let i = 0; i < 6; i++) c.fillRect(-32 * u + i * 11 * u, -54 * u, 5 * u, 12 * u); c.restore();
    void t;
  },
  bonfire: (c, u, t, n) => {
    shadow(c, 20 * u, u);
    ink(c, "#4a3a30", 2.4);
    for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; c.beginPath(); c.moveTo(-14 * u * Math.cos(a), -2 * u); c.lineTo(14 * u * Math.cos(a), -10 * u); c.lineWidth = 5; c.stroke(); }
    const f = .8 + .2 * Math.sin(t * .012);
    c.globalAlpha = .3 + .3 * n; ink(c, "#ff9d3a", 0);
    c.beginPath(); c.ellipse(0, -18 * u, 20 * u * f, 24 * u * f, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    ink(c, "#ffb347", 2);
    c.beginPath(); c.moveTo(-10 * u, -6 * u); c.quadraticCurveTo(-4 * u, -26 * u * f, 2 * u, -8 * u); c.quadraticCurveTo(8 * u, -22 * u * f, 10 * u, -6 * u); c.closePath(); c.fill(); c.stroke();
    ink(c, "#fff3c4", 0); c.beginPath(); c.ellipse(0, -10 * u, 4 * u, 7 * u * f, 0, 0, Math.PI * 2); c.fill();
  },
  totem: (c, u, t, n) => {
    shadow(c, 18 * u, u);
    ink(c, n > .4 ? "#8a5a36" : "#4d3526", 3);
    c.beginPath(); c.rect(-14 * u, -78 * u, 28 * u, 78 * u); c.fill(); c.stroke();
    for (let i = 0; i < 3; i++) {
      const y = -20 * u - i * 22 * u;
      ink(c, ["#c9524c", "#ffd75a", "#6fa8d6"][i], 2);
      c.beginPath(); c.arc(0, y - 6 * u, 9 * u, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = INK; c.beginPath(); c.arc(-3 * u, y - 7 * u, 1.8 * u, 0, Math.PI * 2); c.arc(3 * u, y - 7 * u, 1.8 * u, 0, Math.PI * 2); c.fill();
    }
    c.save(); c.translate(0, -82 * u); c.rotate(Math.sin(t * .0013) * .1);
    ink(c, "#ffd75a", 2); c.beginPath(); c.moveTo(-10 * u, 0); c.lineTo(0, -12 * u); c.lineTo(10 * u, 0); c.closePath(); c.fill(); c.stroke(); c.restore();
  },
  archgate: (c, u, _t, n) => {
    ink(c, n > .4 ? "#6b5a4a" : "#3b3342", 3.4);
    c.beginPath();
    c.moveTo(-40 * u, 0); c.lineTo(-40 * u, -58 * u); c.arc(0, -58 * u, 40 * u, Math.PI, 0); c.lineTo(40 * u, 0);
    c.lineTo(28 * u, 0); c.lineTo(28 * u, -58 * u); c.arc(0, -58 * u, 28 * u, 0, Math.PI, true); c.lineTo(-28 * u, 0); c.closePath();
    c.fill(); c.stroke();
    c.globalAlpha = .5; ink(c, "#ffe07a", 0);
    for (const sx of [-34, 34]) { c.beginPath(); c.arc(sx * u, -46 * u, 5 * u, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  },
  boat: (c, u, t, n) => {
    shadow(c, 40 * u, u);
    ink(c, n > .4 ? "#6f5346" : "#3d3140", 3);
    c.beginPath(); c.moveTo(-38 * u, -6 * u); c.quadraticCurveTo(0, 8 * u, 38 * u, -6 * u); c.lineTo(30 * u, -20 * u); c.lineTo(-30 * u, -20 * u); c.closePath(); c.fill(); c.stroke();
    post(c, 2 * u, -66 * u, -20 * u, 4 * u, "#4a3a34");
    c.save(); c.translate(2 * u, -62 * u); c.rotate(Math.sin(t * .0009) * .04);
    ink(c, "#e8dcc0", 2.4); c.beginPath(); c.moveTo(0, 0); c.lineTo(26 * u, 30 * u); c.lineTo(0, 34 * u); c.closePath(); c.fill(); c.stroke(); c.restore();
  },
  cactus: (c, u, _t, n) => {
    shadow(c, 14 * u, u);
    ink(c, n > .4 ? "#5f8a52" : "#3a5744", 3);
    c.beginPath(); c.roundRect(-8 * u, -52 * u, 16 * u, 52 * u, 8 * u); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(-24 * u, -40 * u, 12 * u, 22 * u, 6 * u); c.fill(); c.stroke();
    c.beginPath(); c.roundRect(12 * u, -32 * u, 12 * u, 18 * u, 6 * u); c.fill(); c.stroke();
    c.fillStyle = "#ffd75a"; c.beginPath(); c.arc(0, -54 * u, 3.4 * u, 0, Math.PI * 2); c.fill();
  },
  gear: (c, u, t, _n) => {
    shadow(c, 26 * u, u);
    c.save(); c.translate(0, -26 * u); c.rotate(t * .0006);
    ink(c, "#7d6a52", 3);
    c.beginPath();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = i % 2 ? 20 * u : 27 * u; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.closePath(); c.fill(); c.stroke();
    ink(c, "#2c2430", 2.4); c.beginPath(); c.arc(0, 0, 7 * u, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  },
  minecart: (c, u, _t, n) => {
    shadow(c, 30 * u, u);
    ink(c, n > .4 ? "#6d5a4a" : "#3f3546", 3);
    c.beginPath(); c.moveTo(-26 * u, -12 * u); c.lineTo(26 * u, -12 * u); c.lineTo(20 * u, -30 * u); c.lineTo(-20 * u, -30 * u); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#8a4a2a"; c.beginPath(); c.moveTo(-18 * u, -30 * u); c.lineTo(18 * u, -30 * u); c.lineTo(12 * u, -38 * u); c.lineTo(-10 * u, -37 * u); c.closePath(); c.fill(); c.stroke();
    ink(c, "#2c2430", 2.4);
    for (const wx of [-16, 16]) { c.beginPath(); c.arc(wx * u, -8 * u, 6 * u, 0, Math.PI * 2); c.fill(); c.stroke(); }
  },
  tophat: (c, u, t, _n) => {
    shadow(c, 14 * u, u);
    c.save(); c.translate(0, -2 * u + Math.sin(t * .0022) * 2 * u);
    ink(c, "#241d28", 3);
    c.beginPath(); c.ellipse(0, -6 * u, 18 * u, 5 * u, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.rect(-10 * u, -30 * u, 20 * u, 26 * u); c.fill(); c.stroke();
    ink(c, "#c9524c", 0); c.fillRect(-10 * u, -14 * u, 20 * u, 5 * u);
    c.restore();
  },
  palm: (c, u, t, n) => {
    shadow(c, 12 * u, u);
    c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6 * u, -30 * u, 2 * u, -56 * u); c.stroke();
    ink(c, n > .4 ? "#8a6b45" : "#4d3d33", 0); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6 * u, -30 * u, 2 * u, -56 * u); c.lineWidth = 5; c.strokeStyle = "#7a5f48"; c.stroke();
    c.save(); c.translate(2 * u, -58 * u);
    ink(c, n > .4 ? "#4f7a45" : "#2f4a3a", 2.6);
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI + i / 5 * Math.PI + Math.sin(t * .0011 + i) * .05;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * 20 * u, Math.sin(a) * 12 * u, Math.cos(a) * 34 * u, Math.sin(a) * 8 * u + 8 * u); c.lineTo(Math.cos(a) * 30 * u, Math.sin(a) * 14 * u + 6 * u); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  },
  bell: (c, u, t, _n) => {
    post(c, -16 * u, -62 * u, 0, 5 * u, "#3a3040"); post(c, 16 * u, -62 * u, 0, 5 * u, "#3a3040");
    box(c, -24 * u, -68 * u, 48 * u, 8 * u, "#5a4c52", 3);
    c.save(); c.translate(0, -62 * u); c.rotate(Math.sin(t * .0017) * .09);
    ink(c, "#d8a545", 3);
    c.beginPath(); c.moveTo(-13 * u, 0); c.quadraticCurveTo(0, -30 * u, 13 * u, 0); c.lineTo(-13 * u, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = "#ffe6a8"; c.beginPath(); c.arc(0, 4 * u, 4 * u, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    c.restore();
  },
  bridge: (c, u, _t, n) => {
    ink(c, n > .4 ? "#6b5a4a" : "#3b3342", 3);
    c.beginPath(); c.moveTo(-48 * u, 0); c.lineTo(-48 * u, -10 * u); c.lineTo(48 * u, -10 * u); c.lineTo(48 * u, 0); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = "#d8c69a"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-46 * u, -14 * u); c.quadraticCurveTo(0, -30 * u, 46 * u, -14 * u); c.stroke();
    for (let i = -4; i <= 4; i++) { const x = i * 11 * u; c.beginPath(); c.moveTo(x, -10 * u); c.lineTo(x, -14 * u - Math.cos(i / 4.6) * 8 * u); c.stroke(); }
  },
  /* the four that dress the flooded vaults: a turning wheel, a work platform, a carved stone and
     the one ride down there that still has its lights on */
  waterwheel: (c, u, t, n) => {
    shadow(c, 40 * u, u);
    ink(c, n > .4 ? "#3f5f6b" : "#26324a", 2.6);                       // the water it stands in
    c.beginPath(); c.ellipse(0, -2 * u, 46 * u, 9 * u, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    for (const sx of [-1, 1]) post(c, sx * 34 * u, -30 * u, 0, 7 * u, "#4a3a34");
    box(c, -40 * u, -36 * u, 80 * u, 7 * u, "#5d4a3c", 3);
    c.save(); c.translate(0, -46 * u); c.rotate(t * .0009);
    ink(c, n > .4 ? "#8a6b45" : "#4d3d33", 3);
    for (let i = 0; i < 10; i++) { c.rotate(Math.PI / 5); c.beginPath(); c.rect(-3.4 * u, -31 * u, 6.8 * u, 13 * u); c.fill(); c.stroke(); }
    c.beginPath(); c.arc(0, 0, 30 * u, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(0, 0, 21 * u, 0, Math.PI * 2); c.stroke();
    ink(c, "#2c2430", 2.4); c.beginPath(); c.arc(0, 0, 6 * u, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
    c.globalAlpha = .5; ink(c, "#bfe9ff", 0);                          // what it lifts out and lets go
    for (let i = 0; i < 3; i++) { const yy = -34 * u + ((t * .05 + i * 13) % 32) * u; c.beginPath(); c.ellipse((i - 1) * 22 * u, yy, 2.4 * u, 4.4 * u, 0, 0, Math.PI * 2); c.fill(); }
    c.globalAlpha = 1;
  },
  scaffold: (c, u, t, n) => {
    shadow(c, 32 * u, u);
    const wood = n > .4 ? "#8a6b45" : "#4a3f4d";
    for (const sx of [-26, 26]) post(c, sx * u, -96 * u, 0, 6 * u, wood);
    ink(c, wood, 3);
    for (const y of [-30, -58, -86]) { c.beginPath(); c.rect(-30 * u, y * u, 60 * u, 7 * u); c.fill(); c.stroke(); }
    c.strokeStyle = "#d8c69a"; c.lineWidth = 2.4; c.globalAlpha = .75;
    c.beginPath();
    c.moveTo(-26 * u, -30 * u); c.lineTo(26 * u, -58 * u); c.moveTo(26 * u, -30 * u); c.lineTo(-26 * u, -58 * u);
    c.moveTo(-26 * u, -58 * u); c.lineTo(26 * u, -86 * u); c.stroke();
    c.globalAlpha = 1;
    ink(c, "#5d4a3c", 2.6);                                            // the ladder up the side
    for (const lx of [34, 45]) { c.beginPath(); c.rect(lx * u, -88 * u, 3.4 * u, 88 * u); c.fill(); c.stroke(); }
    for (let i = 0; i < 7; i++) { c.beginPath(); c.rect(34 * u, -80 * u + i * 12 * u, 11 * u, 3 * u); c.fill(); c.stroke(); }
    c.save(); c.translate(-14 * u, -86 * u); c.rotate(Math.sin(t * .0016) * .12);   // a work lamp, swinging
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 13 * u); c.stroke();
    bulb(c, 0, 17 * u, 5 * u, "#ffe07a", t, 1.4);
    c.restore();
  },
  obelisk: (c, u, t, n) => {
    shadow(c, 18 * u, u);
    box(c, -17 * u, -12 * u, 34 * u, 12 * u, "#5f5666", 3);
    ink(c, n > .4 ? "#a99fb0" : "#5b5468", 3);
    c.beginPath(); c.moveTo(-11 * u, -12 * u); c.lineTo(-7 * u, -94 * u); c.lineTo(0, -112 * u); c.lineTo(7 * u, -94 * u); c.lineTo(11 * u, -12 * u); c.closePath(); c.fill(); c.stroke();
    c.globalAlpha = .3; ink(c, "#fff3c4", 0);
    c.beginPath(); c.moveTo(-6 * u, -14 * u); c.lineTo(-3 * u, -92 * u); c.lineTo(0, -100 * u); c.lineTo(0, -14 * u); c.closePath(); c.fill();
    c.globalAlpha = 1;
    c.globalAlpha = .4 + .35 * Math.sin(t * .0022); ink(c, "#8de1d4", 0);   // glyphs, breathing
    for (let i = 0; i < 4; i++) { const wd = (5 - i * .7) * u; c.fillRect(-wd, -30 * u - i * 18 * u, wd * 2, 5 * u); }
    c.globalAlpha = 1;
  },
  ferris: (c, u, t, n) => {
    shadow(c, 30 * u, u);
    ink(c, n > .4 ? "#7a5f48" : "#3f3546", 3);
    c.beginPath(); c.moveTo(-26 * u, 0); c.lineTo(0, -58 * u); c.lineTo(26 * u, 0); c.lineTo(15 * u, 0); c.lineTo(0, -46 * u); c.lineTo(-15 * u, 0); c.closePath(); c.fill(); c.stroke();
    const spin = t * .0007;
    c.save(); c.translate(0, -80 * u); c.rotate(spin);
    ink(c, "#c9524c", 2.6);
    c.beginPath(); c.arc(0, 0, 40 * u, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(0, 0, 30 * u, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 40 * u, Math.sin(a) * 40 * u); c.stroke();
      c.save(); c.translate(Math.cos(a) * 40 * u, Math.sin(a) * 40 * u); c.rotate(-spin);   // cabins hang true
      ink(c, i % 2 ? "#ffd166" : "#74c7d8", 2.4);
      c.beginPath(); c.rect(-6 * u, -2 * u, 12 * u, 11 * u); c.fill(); c.stroke();
      c.restore();
    }
    ink(c, "#2c2430", 2.4); c.beginPath(); c.arc(0, 0, 6 * u, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
    for (let i = 0; i < 6; i++) {                                       // rim lamps, chasing round
      const a = i / 6 * Math.PI * 2 + spin;
      bulb(c, Math.cos(a) * 40 * u, -80 * u + Math.sin(a) * 40 * u, 2.6 * u, "#ffe07a", t, i);
    }
  },
  // THE FOUNDATION's own dressing: a riveted steam boiler that is always slightly angry
  boiler: (c, u, t, n) => {
    shadow(c, 26 * u, u);
    const hot = .5 + .5 * Math.sin(t * .0021);
    ink(c, n > .4 ? "#6a4a3a" : "#3a2f36", 3);
    c.beginPath(); c.moveTo(-18 * u, 0); c.lineTo(-18 * u, -52 * u); c.quadraticCurveTo(-18 * u, -66 * u, 0, -66 * u);
    c.quadraticCurveTo(18 * u, -66 * u, 18 * u, -52 * u); c.lineTo(18 * u, 0); c.closePath(); c.fill(); c.stroke();
    ink(c, "rgba(0,0,0,.22)", 2);                                   // rivet bands
    for (const y of [-14, -34, -52]) { c.beginPath(); c.moveTo(-18 * u, y * u); c.lineTo(18 * u, y * u); c.stroke(); }
    c.fillStyle = "rgba(20,14,18,.8)";
    for (const y of [-14, -34, -52]) for (let x = -14; x <= 14; x += 7) { c.beginPath(); c.arc(x * u, (y - 3) * u, 1.3 * u, 0, 7); c.fill(); }
    // firebox door: the glow inside leaks out and breathes
    ink(c, "#241a1e", 2.4); c.beginPath(); c.rect(-9 * u, -12 * u, 18 * u, 12 * u); c.fill(); c.stroke();
    c.fillStyle = `rgba(255,${Math.round(120 + 70 * hot)},40,${.5 + .35 * hot})`;
    c.beginPath(); c.rect(-6.5 * u, -9.5 * u, 13 * u, 7 * u); c.fill();
    // pressure gauge with a needle that never settles
    ink(c, "#e8dcc0", 2.2); c.beginPath(); c.arc(11 * u, -44 * u, 6.5 * u, 0, 7); c.fill(); c.stroke();
    const needle = -Math.PI * .75 + Math.sin(t * .0031) * .5 + Math.sin(t * .0113) * .12;
    c.strokeStyle = "#c9524c"; c.lineWidth = 1.8 * u;
    c.beginPath(); c.moveTo(11 * u, -44 * u); c.lineTo(11 * u + Math.cos(needle) * 4.6 * u, -44 * u + Math.sin(needle) * 4.6 * u); c.stroke();
    // safety valve: a tired puff of steam, on its own clock
    const ph = (t * .0006 + .3) % 1;
    if (ph < .5) { const a = .5 - ph; c.fillStyle = `rgba(230,228,220,${a * .5})`;
      c.beginPath(); c.arc(-4 * u + Math.sin(t * .004) * 2 * u, -70 * u - (1 - a) * 16 * u, (3 + (1 - a) * 6) * u, 0, 7); c.fill(); }
    ink(c, n > .4 ? "#7a5f48" : "#463a44", 2.6);                    // elbow pipe out the side
    c.beginPath(); c.moveTo(-18 * u, -40 * u); c.lineTo(-28 * u, -40 * u); c.lineTo(-28 * u, -20 * u); c.stroke();
    c.beginPath(); c.arc(-28 * u, -18 * u, 2.4 * u, 0, 7); c.fill();
  },
  // a curtain of chains off the joists — they sway a half-beat behind each other
  chains: (c, u, t, n) => {
    ink(c, n > .4 ? "#5a4a3c" : "#332b36", 3.4);
    c.beginPath(); c.moveTo(-40 * u, 0); c.lineTo(40 * u, 0); c.stroke();
    for (let i = 0; i < 5; i++) {
      const x = -32 * u + i * 16 * u, len = (26 + (i * 13) % 34) * u, sway = Math.sin(t * .0013 + i * 1.7) * 2.6 * u;
      c.strokeStyle = n > .4 ? "#8a7a66" : "#584d5c"; c.lineWidth = 1.7 * u;
      c.beginPath(); c.moveTo(x, 0);
      for (let l = 0; l < 5; l++) { const y = (l + 1) / 5 * len; c.lineTo(x + sway * (y / len), y); }
      c.stroke();
      ink(c, n > .4 ? "#9a8a72" : "#645a68", 2);                   // the hook at the end
      c.beginPath(); c.arc(x + sway, len + 3 * u, 3 * u, -Math.PI * .2, Math.PI * 1.1); c.stroke();
    }
    bulb(c, 34 * u, 4 * u, 2.2 * u, "#ffd98a", t, 2);
  },

};

/** A hop-able plank: the same rectangle the sim collides with, drawn like something a roadshow
 *  would have nailed together. One source of truth — this reads stage.ledges, not a copy. */
function drawPlanks(c: C, stage: StageDef, w: number, h: number, night: number) {
  if (!stage.ledges?.length) return;
  const u = h / 620;
  for (const [lx, ly, lw] of stage.ledges) {
    const x = lx * w, y = ly * h, bw = lw * w;
    c.save(); c.translate(x, y);
    ink(c, night > .5 ? "#4a3a34" : "#7a5f48", 3);
    c.beginPath(); c.roundRect(0, 0, bw, 13 * u, 3); c.fill(); c.stroke();
    c.globalAlpha = .55; ink(c, "#e8dcc0", 0); c.fillRect(4 * u, 2.5 * u, bw - 8 * u, 2.6 * u); c.globalAlpha = 1;
    for (const px of [10, bw - 10 * u]) {
      post(c, px, 13 * u, 34 * u, 5 * u, night > .5 ? "#3b2f30" : "#5d4a3c");
    }
    c.strokeStyle = "#d8c69a"; c.lineWidth = 2; c.globalAlpha = .7;
    c.beginPath(); c.moveTo(10, 30 * u); c.quadraticCurveTo(bw / 2, 44 * u, bw - 10 * u, 30 * u); c.stroke();
    c.globalAlpha = 1; c.restore();
  }
}

/** The whole authored dressing of one stage, in that stage's own tile space. */
export function drawStageProps(c: C, stage: StageDef, w: number, h: number, t: number) {
  const u = h / 620;
  const night = 1 - stage.mood.light;
  for (const [kind, x, y] of stage.props) {
    const paint = PAINT[kind as PropKind];
    if (!paint) continue;
    c.save(); c.translate(x * w, y * h);
    paint(c, u, t, night);
    c.restore();
  }
  drawPlanks(c, stage, w, h, night);
}

/** Light, weather and colour punch of a stage, laid over its backdrop. */
export function applyMood(c: C, stage: StageDef | null, x: number, y: number, w: number, h: number, t: number) {
  if (!stage) return;
  const m = stage.mood;
  c.save(); c.translate(x, y);
  if (m.wash > 0) { c.globalAlpha = m.wash; c.fillStyle = m.tint; c.fillRect(0, 0, w, h); }
  if (m.light < .5) {                                              // the lamps are on: darken the sky
    c.globalAlpha = (.5 - m.light) * .5; c.fillStyle = "#0c0a14";
    c.beginPath(); c.rect(0, 0, w, h * .34); c.fill();
  }
  if (m.fog > .3) {                                                // a band of weather on the far plane
    c.globalAlpha = (m.fog - .3) * .5; c.fillStyle = "#c9c2b4";
    for (let i = 0; i < 4; i++) {
      const yy = h * (.3 + i * .06) + Math.sin(t * .0004 + i) * 6;
      c.beginPath(); c.ellipse(w * (.2 + .2 * i), yy, w * .3, h * .028, 0, 0, Math.PI * 2); c.fill();
    }
  }
  c.restore(); c.globalAlpha = 1;
}

/** The dried-ink margin: what lies beyond the silhouette of the map. */
export function drawVoid(c: C, x: number, y: number, w: number, h: number, t: number, edge: { l?: boolean; r?: boolean; u?: boolean; d?: boolean }) {
  c.save(); c.translate(x, y);
  // the reel ends here: two passes of ink so the margin reads as absent, not as a dark stage
  c.fillStyle = "#0a0810"; c.fillRect(-2, -2, w + 4, h + 4);
  c.globalAlpha = .6; c.fillStyle = "#04030a"; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
  c.globalAlpha = .5; c.fillStyle = "#1a1424";
  for (let i = 0; i < 5; i++) { const yy = (i + .5) * h / 5; c.beginPath(); c.ellipse(w * .5 + Math.sin(t * .0003 + i) * 30, yy, w * .42, h * .05, 0, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1;
  // a torn paper edge, drawn on whichever sides face the playable map
  c.strokeStyle = "#d8c69a"; c.lineWidth = 3; c.fillStyle = "#0a0810";
  const teeth = 18, tw = w / teeth;
  if (edge.u) {
    c.beginPath(); c.moveTo(0, 0);
    for (let i = 0; i <= teeth; i++) c.lineTo(i * tw, (i % 2 ? 9 : 0) + Math.sin(i * 1.7) * 3);
    c.lineTo(w, -12); c.lineTo(0, -12); c.closePath(); c.fill(); c.stroke();
  }
  if (edge.d) {
    c.beginPath(); c.moveTo(0, h);
    for (let i = 0; i <= teeth; i++) c.lineTo(i * tw, h - (i % 2 ? 9 : 0) - Math.sin(i * 1.3) * 3);
    c.lineTo(w, h + 12); c.lineTo(0, h + 12); c.closePath(); c.fill(); c.stroke();
  }
  if (edge.l) { c.beginPath(); c.moveTo(0, 0); for (let i = 0; i <= 14; i++) c.lineTo((i % 2 ? 9 : 0) + Math.sin(i * 1.5) * 3, i * h / 14); c.lineTo(-12, h); c.lineTo(-12, 0); c.closePath(); c.fill(); c.stroke(); }
  if (edge.r) { c.beginPath(); c.moveTo(w, 0); for (let i = 0; i <= 14; i++) c.lineTo(w - (i % 2 ? 9 : 0) - Math.sin(i * 1.9) * 3, i * h / 14); c.lineTo(w + 12, h); c.lineTo(w + 12, 0); c.closePath(); c.fill(); c.stroke(); }
  c.restore();
}

/** A plank sign hung on a doorway, naming the screen on the other side. */
export function drawDoorSign(c: C, name: string, x: number, y: number, t: number, vertical = false) {
  const u = 1;
  const text = (vertical ? "↓ " : "→ ") + name.toUpperCase();
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * .0011) * (vertical ? 0 : .012));
  c.font = `900 ${Math.round(11 * u)}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
  const twid = c.measureText(text).width + 16;
  c.fillStyle = "#1c1620"; c.fillRect(-twid / 2 + 2, -9 + 2, twid, 18);
  c.fillStyle = "#d8c69a"; c.strokeStyle = "#171217"; c.lineWidth = 2;
  c.beginPath(); c.rect(-twid / 2, -9, twid, 18); c.fill(); c.stroke();
  c.fillStyle = "#241d28"; c.fillText(text, 0, 1);
  c.restore();
}
