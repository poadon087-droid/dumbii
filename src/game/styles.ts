/**
 * ART STYLES — five ways to draw the same game, not five tints of one drawing.
 *
 * A style is a set of flags the 2D painters read (flat fills, outline weight, halftone, contact
 * shadows) plus a mode the post pass reads (posterize, duotone with misregistration, monochrome,
 * pixel quantisation) and a render scale for the pixel look. Everything the game draws goes
 * through these flags, so switching style changes the *drawing*, not just the colour grade.
 */
export type StyleId = "ink" | "toon" | "noir" | "riso" | "pixel";

export type StyleFlags = {
  /** hard flat fills — no sky gradient, no ground falloff */
  flat: boolean;
  /** outline weight multiplier for actors and props */
  outline: number;
  /** dither dots for shadows instead of gradients */
  halftone: boolean;
  /** ellipses under the feet */
  shadows: boolean;
  /** film grain multiplier (the post pass also adds its own per style) */
  grain: number;
  /** internal render scale: <1 is chunky and nearest-neighbour upscaled */
  scale: number;
  /** 0 none, 1 posterize, 2 monochrome, 3 duotone + misregistration, 4 quantise + dither */
  post: 0 | 1 | 2 | 3 | 4;
  /** the danger colour the whole look is built around */
  accent: string;
  /** paper/ink colours for the flat looks */
  paper: string;
};

export type StyleDef = { id: StyleId; name: string; blurb: string; swatch: [string, string, string]; f: StyleFlags };

export const STYLES: StyleDef[] = [
  {
    id: "ink", name: "INK & WASH", blurb: "The house look: gradient skies, soft contact shadows, warm stock.",
    swatch: ["#e8dcc0", "#c9524c", "#2c2430"],
    f: { flat: false, outline: 1, halftone: false, shadows: true, grain: .35, scale: 1, post: 0, accent: "#ff7ad9", paper: "#e8dcc0" },
  },
  {
    id: "toon", name: "FLAT CEL", blurb: "Two hard tones, thick outlines, halftone shadows. No gradients anywhere.",
    swatch: ["#fff3c4", "#ff4d4d", "#101018"],
    f: { flat: true, outline: 1.7, halftone: true, shadows: true, grain: 0, scale: 1, post: 1, accent: "#ff2d6f", paper: "#fff6d8" },
  },
  {
    id: "noir", name: "SILVER NOIR", blurb: "Monochrome, hard contrast, heavy grain and rain. Only blood keeps its colour.",
    swatch: ["#d9d9d9", "#6e6e6e", "#0a0a0c"],
    f: { flat: false, outline: 1.15, halftone: false, shadows: true, grain: 1.35, scale: 1, post: 2, accent: "#b91c1c", paper: "#cfcfcf" },
  },
  {
    id: "riso", name: "RISOGRAPH", blurb: "Two inks, out of register, printed on cheap paper. Every edge is a dot screen.",
    swatch: ["#ffe6f4", "#ff2fb0", "#00c8d7"],
    f: { flat: true, outline: 1.45, halftone: true, shadows: false, grain: .8, scale: 1, post: 3, accent: "#00c8d7", paper: "#f7ead9" },
  },
  {
    id: "pixel", name: "8-BIT REEL", blurb: "The whole show rendered at a quarter of the size, nearest-neighbour, four shades.",
    swatch: ["#5a2c44", "#ffd166", "#1b1230"],
    f: { flat: false, outline: .85, halftone: false, shadows: true, grain: .15, scale: .42, post: 4, accent: "#ff7ad9", paper: "#e8dcc0" },
  },
];

const BY_ID = new Map(STYLES.map((s) => [s.id, s]));

export const styleOf = (id: StyleId | string | undefined): StyleDef => BY_ID.get((id ?? "ink") as StyleId) ?? STYLES[0];
export const flagsOf = (id: StyleId | string | undefined): StyleFlags => styleOf(id).f;
export const STYLE_INDEX: Record<StyleId, number> = { ink: 0, toon: 1, noir: 2, riso: 3, pixel: 4 };
/** posterise levels for the cel look, bits per channel for the pixel look */
export const styleLevels = (id: StyleId | string | undefined) => {
  const f = flagsOf(id);
  return f.post === 1 ? 4 : f.post === 3 ? 3 : f.post === 4 ? 3 : 0;
};
