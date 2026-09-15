/**
 * THE WORLD, authored rather than tiled.
 *
 * Every stage in this file is one screen of the map, and every screen was placed by hand: which
 * act it is, what it is called, what the light and weather feel like, what stands on the boards,
 * what Porbo left lying around, and how hard it is. The map is not a rectangle of repeats — the
 * silhouette is stepped (12 / 11 / 10 / 11 across), so the world has an outline, dead ends and
 * edges you can see, and the rows are offset so no two neighbouring screens share an act.
 */
import type { HazardKind } from "./types";

export type PropKind =
  | "watertower" | "billboard" | "fence" | "crates" | "barrels" | "lamppost" | "statue"
  | "fountain" | "windmill" | "gravestone" | "wreck" | "tent" | "silo" | "pipes"
  | "antenna" | "laundry" | "stall" | "bonfire" | "totem" | "archgate" | "boat" | "cactus"
  | "minecart" | "tophat" | "palm" | "gear" | "bridge" | "bell"
  | "waterwheel" | "scaffold" | "obelisk" | "ferris"
  | "boiler" | "chains";

/** [kind, x, y, layer?] — x/y are 0..1 of the stage box, y is measured to the feet of the prop. */
export type PropSpec = [PropKind, number, number, ("back" | "front")?];

export type StageMood = {
  /** a wash laid over the whole screen: this is what makes two stages on the same set feel apart */
  tint: string; wash: number;
  /** 0 = the lamps are on, 1 = broad daylight */
  light: number;
  /** 0..1 how much fog eats the far plane */
  fog: number;
  /** colour punch: <1 bleaches the palette toward ink, >1 saturates it */
  sat: number;
};

export type StageDef = {
  id: number;
  name: string;
  tagline: string;
  col: number;
  row: number;
  /** which art set the boards, the skyline and the critters come from */
  biome: number;
  /** position in the walk-through order, 1..N — the intended route */
  act: number;
  mood: StageMood;
  props: PropSpec[];
  /** jumpable ledges, in the same 0..1 space: [x, y, width] */
  ledges?: [number, number, number][];
  /** override the art set's usual hazard when the stage wants a different threat */
  hazard?: HazardKind;
  /** how many creeps the stage throws at you, as a multiplier on the clock's difficulty */
  pressure?: number;
};

export type MapId = "gigantic" | "strip" | "arena" | "alley";
export type MapDef = {
  id: MapId; name: string; label: string; blurb: string;
  cols: number; rows: number; stages: StageDef[];
};

/* --- the mood palette: a dozen looks a stage can borrow, then tuned per stage -------------- */
const MOOD = {
  dawn: { tint: "#ff9d5c", wash: .1, light: .45, fog: .35, sat: 1.08 },
  dusk: { tint: "#7b3f7a", wash: .14, light: .3, fog: .3, sat: 1.05 },
  night: { tint: "#1c2340", wash: .26, light: .12, fog: .42, sat: .86 },
  storm: { tint: "#3d4a63", wash: .2, light: .22, fog: .6, sat: .72 },
  witching: { tint: "#3a1f4d", wash: .22, light: .08, fog: .5, sat: 1.12 },
  ashlight: { tint: "#5a5148", wash: .18, light: .3, fog: .55, sat: .6 },
  gaslight: { tint: "#c8a35a", wash: .12, light: .5, fog: .22, sat: .96 },
  moonbrook: { tint: "#5f7fae", wash: .16, light: .25, fog: .4, sat: .9 },
  furnace: { tint: "#b4482a", wash: .16, light: .55, fog: .28, sat: 1.16 },
  frostbite: { tint: "#8fd0e8", wash: .12, light: .62, fog: .32, sat: .8 },
  sepia: { tint: "#a8875c", wash: .2, light: .4, fog: .3, sat: .55 },
  blackout: { tint: "#0d0b14", wash: .34, light: .04, fog: .68, sat: .6 },
} satisfies Record<string, StageMood>;

const P = (kind: PropKind, x: number, y: number, layer?: "back" | "front"): PropSpec => [kind, x, y, layer];

/**
 * 44 hand-placed stages. Rows are 12 / 11 / 10 / 11 screens wide and start at columns 0 / 1 / 0 /
 * 0, so the map is a stepped slab rather than a box. Biomes were assigned so that no two screens
 * sharing an edge use the same art set (asserted in tests/features.test.ts), and `act` walks a
 * snake: east along the rooftops, west through the middle, east again through the undercroft, then
 * west one last time down the flooded vaults to the curtain call.
 */
export const STAGES: StageDef[] = [
  // ── the rooftops: row 0, twelve screens, walked east ──────────────────────────────────────
  { id: 0, name: "Cinder Grotto", tagline: "Where the band first struck up.", col: 0, row: 0, biome: 0, act: 1,
    mood: { ...MOOD.furnace, wash: .12 }, props: [P("crates", .2, .74), P("bonfire", .68, .7), P("barrels", .86, .72), P("fence", .42, .66, "front"), P("fence", .62, .84, "front"), P("barrels", .4, .84)],
    ledges: [[.3, .58, .16]], pressure: .8 },
  { id: 1, name: "Ember Hollow", tagline: "The lava keeps its own time.", col: 1, row: 0, biome: 1, act: 2,
    mood: MOOD.dusk, props: [P("palm", .16, .7), P("gravestone", .5, .72), P("fence", .78, .68, "front"), P("lamppost", .82, .66), P("crates", .7, .78)], pressure: .85 },
  { id: 2, name: "The Painted Tent", tagline: "Step right up, pay the ringmaster.", col: 2, row: 0, biome: 2, act: 3,
    mood: { ...MOOD.gaslight, wash: .14 }, props: [P("tent", .3, .68), P("totem", .62, .7), P("stall", .84, .74, "front"), P("lamppost", .12, .68), P("crates", .74, .78, "front")],
    ledges: [[.44, .52, .2]], pressure: .9 },
  { id: 3, name: "Night Freight", tagline: "Mind the platforms — they move.", col: 3, row: 0, biome: 3, act: 4,
    mood: MOOD.night, props: [P("pipes", .22, .7), P("lamppost", .54, .66), P("minecart", .8, .76), P("lamppost", .38, .66), P("crates", .68, .78, "front")],
    ledges: [[.34, .56, .22], [.68, .46, .16]], pressure: .95 },
  { id: 4, name: "Frostbite Siding", tagline: "Everything slides. Everything.", col: 4, row: 0, biome: 4, act: 5,
    mood: MOOD.frostbite, props: [P("silo", .18, .68), P("antenna", .46, .64), P("crates", .74, .74, "front"), P("lamppost", .36, .62), P("fence", .62, .76, "front"), P("waterwheel", .56, .7)],
    ledges: [[.66, .52, .18]], pressure: 1 },
  { id: 5, name: "Sugar Swamp", tagline: "The tar breathes when you least expect it.", col: 5, row: 0, biome: 5, act: 6,
    mood: { ...MOOD.dawn, wash: .18 }, props: [P("palm", .24, .72), P("boat", .6, .76), P("barrels", .86, .7), P("barrels", .42, .76), P("fence", .84, .72, "front"), P("waterwheel", .46, .66)], pressure: 1 },
  { id: 6, name: "The Clock Yard", tagline: "Four hands, one of them broken.", col: 6, row: 0, biome: 6, act: 7,
    mood: MOOD.sepia, props: [P("gear", .3, .68), P("gear", .68, .6, "back"), P("bell", .86, .66), P("statue", .12, .72), P("lamppost", .84, .66), P("barrels", .44, .78)],
    ledges: [[.5, .5, .18]], pressure: 1.05 },
  { id: 7, name: "Rust Gardens", tagline: "Things grow here that shouldn't.", col: 7, row: 0, biome: 7, act: 8,
    mood: { ...MOOD.ashlight, sat: 1.05 }, props: [P("pipes", .2, .68), P("watertower", .62, .5), P("fence", .42, .74, "front"), P("barrels", .38, .78), P("crates", .9, .74, "front"), P("scaffold", .8, .68)],
    ledges: [[.3, .56, .16]], pressure: 1.05 },
  { id: 8, name: "Harlequin Row", tagline: "Every window is watching.", col: 8, row: 0, biome: 8, act: 9,
    mood: MOOD.witching, props: [P("stall", .22, .74), P("laundry", .5, .5, "front"), P("lamppost", .78, .68), P("fence", .34, .78, "front"), P("crates", .92, .74)], pressure: 1.1 },
  { id: 9, name: "The Drowned Pier", tagline: "The tide brought something back.", col: 9, row: 0, biome: 9, act: 10,
    mood: MOOD.moonbrook, props: [P("boat", .3, .78), P("barrels", .58, .72), P("lamppost", .84, .64), P("lamppost", .44, .64), P("fence", .68, .78, "front")],
    ledges: [[.44, .6, .2]], pressure: 1.1 },
  { id: 10, name: "Bone Lantern Way", tagline: "The lights are for you. Kind of.", col: 10, row: 0, biome: 10, act: 11,
    mood: { ...MOOD.blackout, wash: .26 }, props: [P("gravestone", .18, .72), P("gravestone", .3, .7), P("lamppost", .56, .66), P("archgate", .8, .68), P("fence", .38, .76, "front"), P("wreck", .5, .74)], pressure: 1.15 },
  { id: 11, name: "The High Wire", tagline: "One plank wide, all the way down.", col: 11, row: 0, biome: 0, act: 12,
    mood: { ...MOOD.dawn, light: .6 }, props: [P("watertower", .2, .5), P("antenna", .52, .56), P("fence", .8, .7, "front"), P("crates", .36, .72), P("fence", .58, .8)],
    ledges: [[.26, .54, .3], [.7, .44, .18]], pressure: 1.2, hazard: "lava" },

  // ── the middle row: eleven screens, walked west ───────────────────────────────────────────
  { id: 12, name: "Boneyard Crypt", tagline: "Tombstones rise and stay up.", col: 11, row: 1, biome: 10, act: 13,
    mood: MOOD.night, props: [P("gravestone", .16, .72), P("gravestone", .28, .7), P("statue", .64, .66), P("archgate", .86, .68), P("lamppost", .44, .64), P("fence", .78, .78, "front"), P("obelisk", .5, .68)],
    hazard: "tomb", pressure: 1.2 },
  { id: 13, name: "The Tar Parlour", tagline: "Slow floors, faster company.", col: 10, row: 1, biome: 5, act: 14,
    mood: { ...MOOD.furnace, light: .2 }, props: [P("stall", .26, .74), P("barrels", .54, .72), P("bonfire", .82, .68), P("lamppost", .12, .66), P("fence", .66, .78, "front")], pressure: 1.25 },
  { id: 14, name: "Carnival Wreck", tagline: "The funfair ended badly.", col: 9, row: 1, biome: 2, act: 15,
    mood: { ...MOOD.dusk, sat: 1.14 }, props: [P("wreck", .3, .7), P("tent", .62, .72), P("fence", .86, .74, "front"), P("lamppost", .12, .66), P("barrels", .44, .76)],
    ledges: [[.46, .56, .18]], pressure: 1.25 },
  { id: 15, name: "Express Roof", tagline: "The train never quite stops.", col: 8, row: 1, biome: 3, act: 16,
    mood: { ...MOOD.storm, light: .3 }, props: [P("pipes", .24, .66), P("lamppost", .56, .62), P("minecart", .82, .74), P("lamppost", .12, .6), P("crates", .66, .78, "front")],
    ledges: [[.36, .5, .26]], pressure: 1.3 },
  { id: 16, name: "Glacier Hold", tagline: "Cold enough to snap a cue.", col: 7, row: 1, biome: 4, act: 17,
    mood: { ...MOOD.frostbite, wash: .18 }, props: [P("silo", .2, .66), P("crates", .52, .74), P("antenna", .8, .6), P("fence", .38, .78, "front"), P("lamppost", .9, .64)], pressure: 1.3 },
  { id: 17, name: "Molten Foundry", tagline: "The pour bell means run.", col: 6, row: 1, biome: 0, act: 18,
    mood: { ...MOOD.furnace, wash: .2 }, props: [P("gear", .26, .68), P("pipes", .54, .64), P("bonfire", .84, .74), P("lamppost", .12, .66), P("crates", .68, .78)],
    ledges: [[.24, .52, .16]], hazard: "lava", pressure: 1.35 },
  { id: 18, name: "The Weeping Moor", tagline: "Follow the wisps and drown.", col: 5, row: 1, biome: 1, act: 19,
    mood: { ...MOOD.moonbrook, fog: .58 }, props: [P("fence", .18, .72, "front"), P("gravestone", .46, .7), P("boat", .76, .78), P("lamppost", .24, .66), P("crates", .88, .76)], pressure: 1.35 },
  { id: 19, name: "Rust Chapel", tagline: "Something sings in here.", col: 4, row: 1, biome: 7, act: 20,
    mood: { ...MOOD.ashlight, sat: 1.1 }, props: [P("statue", .3, .64), P("bell", .58, .56), P("archgate", .84, .68), P("crates", .12, .78), P("lamppost", .68, .66)],
    ledges: [[.44, .52, .2]], pressure: 1.4 },
  { id: 20, name: "Masquerade Mile", tagline: "Nobody here has a face.", col: 3, row: 1, biome: 8, act: 21,
    mood: { ...MOOD.witching, wash: .26 }, props: [P("lamppost", .2, .66), P("stall", .48, .74), P("laundry", .74, .5, "front"), P("barrels", .12, .76), P("fence", .62, .8, "front")], pressure: 1.4 },
  { id: 21, name: "Brine Docks", tagline: "Ropes, crates, and teeth.", col: 2, row: 1, biome: 9, act: 22,
    mood: { ...MOOD.storm, light: .28 }, props: [P("crates", .22, .74), P("boat", .52, .78), P("watertower", .82, .5), P("bonfire", .38, .74), P("fence", .5, .8, "front"), P("scaffold", .66, .66)],
    ledges: [[.34, .56, .22]], pressure: 1.45 },
  { id: 22, name: "Lantern Field", tagline: "The lamps went out one by one.", col: 1, row: 1, biome: 10, act: 23,
    mood: { ...MOOD.blackout, wash: .3 }, props: [P("gravestone", .2, .72), P("lamppost", .46, .64), P("fence", .72, .7, "front"), P("totem", .9, .66), P("wreck", .12, .74), P("crates", .62, .76), P("obelisk", .58, .7)], pressure: 1.45 },

  // ── the undercroft: ten screens, walked east ──────────────────────────────────────────────
  { id: 23, name: "Cold Cellar", tagline: "The pipes sweat something red.", col: 0, row: 2, biome: 4, act: 24,
    mood: { ...MOOD.moonbrook, sat: .74 }, props: [P("pipes", .24, .68), P("barrels", .5, .76), P("lamppost", .8, .62), P("fence", .42, .78, "front"), P("lamppost", .9, .64)], pressure: 1.5 },
  { id: 24, name: "The Ash Pit", tagline: "Everything down here is grey.", col: 1, row: 2, biome: 7, act: 25,
    mood: { ...MOOD.ashlight, wash: .24 }, props: [P("minecart", .22, .76), P("silo", .56, .64), P("fence", .84, .74, "front"), P("lamppost", .42, .64), P("barrels", .72, .74)], pressure: 1.55 },
  { id: 25, name: "Giggles Gulch", tagline: "The laugh track is armed.", col: 2, row: 2, biome: 2, act: 26,
    mood: { ...MOOD.dawn, sat: 1.2 }, props: [P("tent", .28, .7), P("totem", .6, .66), P("crates", .86, .76), P("lamppost", .12, .66), P("wreck", .88, .74)],
    ledges: [[.42, .52, .2]], pressure: 1.55 },
  { id: 26, name: "Marrow Tunnel", tagline: "The walls are not rock.", col: 3, row: 2, biome: 5, act: 27,
    mood: { ...MOOD.witching, fog: .6 }, props: [P("archgate", .2, .68), P("gravestone", .5, .74), P("pipes", .78, .62), P("fence", .42, .78, "front"), P("crates", .88, .74)],
    hazard: "geyser", pressure: 1.6 },
  { id: 27, name: "Iron Orchard", tagline: "The trees ring when they fall.", col: 4, row: 2, biome: 0, act: 28,
    mood: { ...MOOD.furnace, light: .34 }, props: [P("palm", .18, .7), P("gear", .44, .64), P("watertower", .76, .48), P("crates", .56, .76, "front"), P("lamppost", .1, .64)], pressure: 1.65 },
  { id: 28, name: "The Sunken Platform", tagline: "Mind the water. Mind what's in it.", col: 5, row: 2, biome: 3, act: 29,
    mood: { ...MOOD.storm, wash: .24 }, props: [P("boat", .3, .78), P("lamppost", .6, .62), P("fence", .86, .72, "front"), P("lamppost", .42, .62), P("fence", .88, .76, "front")],
    ledges: [[.4, .5, .24]], pressure: 1.7 },
  { id: 29, name: "Whistling Ridge", tagline: "The wind carries the tune, and you.", col: 6, row: 2, biome: 1, act: 30,
    mood: { ...MOOD.dusk, light: .5 }, props: [P("windmill", .26, .56), P("cactus", .56, .74), P("fence", .84, .7, "front"), P("fence", .42, .76, "front"), P("lamppost", .68, .66)],
    hazard: "lightning", pressure: 1.75 },
  { id: 30, name: "Candle Vault", tagline: "Count the flames. Then the creeps.", col: 7, row: 2, biome: 10, act: 31,
    mood: { ...MOOD.gaslight, wash: .22, light: .16 }, props: [P("statue", .28, .66), P("bonfire", .56, .74), P("gravestone", .84, .72), P("crates", .42, .76), P("fence", .68, .78, "front")], pressure: 1.8 },
  { id: 31, name: "The Last Fairground", tagline: "One ride left. It's the carousel.", col: 8, row: 2, biome: 8, act: 32,
    mood: { ...MOOD.witching, sat: 1.2 }, props: [P("totem", .3, .64), P("billboard", .62, .5), P("stall", .88, .74, "front"), P("fence", .12, .78, "front"), P("crates", .42, .76), P("ferris", .76, .62)], pressure: 1.85 },
  { id: 32, name: "Requiem Stage", tagline: "The band is waiting. Take a bow.", col: 9, row: 2, biome: 6, act: 33,
    mood: { ...MOOD.blackout, light: .1, wash: .28 }, props: [P("archgate", .18, .62), P("billboard", .46, .44), P("bell", .7, .5), P("tophat", .88, .74, "front"), P("crates", .42, .78), P("fence", .26, .82, "front")],
    ledges: [[.3, .5, .16], [.62, .42, .16]], hazard: "bolt", pressure: 2 },

  // ── the flooded vaults: row 3, eleven screens, walked west to the curtain call ─────────────
  { id: 33, name: "The Drowned Bell", tagline: "The bell rings under the water. Something answers.", col: 10, row: 3, biome: 1, act: 34,
    mood: { ...MOOD.moonbrook, fog: .62, light: .18 }, props: [P("boat", .24, .78), P("waterwheel", .56, .7), P("gravestone", .82, .72), P("lamppost", .1, .64), P("fence", .42, .8, "front"), P("barrels", .92, .76)],
    ledges: [[.38, .56, .18]], hazard: "wisp", pressure: 2 },
  { id: 34, name: "Treacle Vault", tagline: "The syrup is waist deep here, and it remembers you.", col: 9, row: 3, biome: 5, act: 35,
    mood: { ...MOOD.dusk, sat: 1.12, fog: .44 }, props: [P("barrels", .18, .76), P("pipes", .44, .66), P("stall", .72, .74, "front"), P("waterwheel", .92, .68), P("fence", .32, .8, "front"), P("bonfire", .58, .72)],
    hazard: "geyser", pressure: 2.02 },
  { id: 35, name: "The Slag Cellar", tagline: "What the foundry forgot, it left down here burning.", col: 8, row: 3, biome: 0, act: 36,
    mood: { ...MOOD.furnace, wash: .22, light: .38 }, props: [P("gear", .2, .66), P("barrels", .42, .76), P("bonfire", .66, .7), P("scaffold", .86, .62), P("crates", .1, .78, "front"), P("pipes", .54, .64)],
    ledges: [[.3, .52, .2]], hazard: "lava", pressure: 2.04 },
  { id: 36, name: "Rime Cistern", tagline: "Ice on the pipes, ice on the boards, ice in the lungs.", col: 7, row: 3, biome: 4, act: 37,
    mood: { ...MOOD.frostbite, wash: .2, light: .48 }, props: [P("pipes", .18, .68), P("silo", .46, .64), P("waterwheel", .74, .72), P("crates", .32, .78), P("lamppost", .9, .62), P("fence", .6, .8, "front")],
    hazard: "glaze", pressure: 2.06 },
  { id: 37, name: "Ossuary Deep", tagline: "Every stone upstairs has a room down here.", col: 6, row: 3, biome: 7, act: 38,
    mood: { ...MOOD.blackout, wash: .28, light: .1 }, props: [P("gravestone", .16, .72), P("gravestone", .28, .7), P("obelisk", .5, .66), P("archgate", .76, .64), P("statue", .92, .7), P("fence", .4, .78, "front"), P("lamppost", .64, .62)],
    hazard: "tomb", pressure: 2.08 },
  { id: 38, name: "The Sunken Midway", tagline: "The rides still turn. Nobody is driving them.", col: 5, row: 3, biome: 2, act: 39,
    mood: { ...MOOD.witching, sat: 1.22, wash: .2 }, props: [P("ferris", .28, .58), P("tent", .6, .7), P("totem", .84, .66), P("stall", .1, .76, "front"), P("crates", .46, .78), P("billboard", .72, .42)],
    ledges: [[.42, .54, .18]], hazard: "spinner", pressure: 2.1 },
  { id: 39, name: "The Leaking Sky", tagline: "Four floors of weather, and all of it is coming down.", col: 4, row: 3, biome: 9, act: 40,
    mood: { ...MOOD.storm, wash: .24, fog: .5 }, props: [P("antenna", .18, .6), P("watertower", .46, .5), P("laundry", .72, .4, "front"), P("scaffold", .88, .64), P("lamppost", .32, .62), P("barrels", .58, .76)],
    hazard: "lightning", pressure: 2.12 },
  { id: 40, name: "The Escapement", tagline: "The clock's own guts, still ticking under the floor.", col: 3, row: 3, biome: 6, act: 41,
    mood: { ...MOOD.gaslight, wash: .2, light: .32 }, props: [P("gear", .22, .66), P("gear", .56, .56, "back"), P("scaffold", .8, .62), P("bell", .38, .5), P("pipes", .1, .7), P("crates", .66, .78)],
    ledges: [[.32, .5, .2], [.66, .42, .16]], hazard: "pendulum", pressure: 2.14 },
  { id: 41, name: "The Stacks Below", tagline: "Shelf marks on the wall. Something has been re-shelving.", col: 2, row: 3, biome: 10, act: 42,
    mood: { ...MOOD.sepia, wash: .22, light: .22 }, props: [P("obelisk", .18, .66), P("statue", .42, .68), P("archgate", .68, .62), P("crates", .88, .76), P("lamppost", .32, .6), P("fence", .56, .8, "front")],
    hazard: "tome", pressure: 2.15 },
  { id: 42, name: "Terminal Zero", tagline: "The last platform. The train is still arriving.", col: 1, row: 3, biome: 3, act: 43,
    mood: { ...MOOD.night, wash: .24, fog: .46 }, props: [P("pipes", .2, .66), P("minecart", .48, .76), P("lamppost", .34, .6), P("lamppost", .76, .62), P("scaffold", .9, .64), P("crates", .62, .78, "front")],
    ledges: [[.28, .54, .22]], pressure: 2.15 },
  { id: 43, name: "Curtain Call", tagline: "The house lights come up. Nothing else does.", col: 0, row: 3, biome: 8, act: 44,
    mood: { tint: "#3a0d12", wash: .3, light: .08, fog: .5, sat: 1.12 }, props: [P("archgate", .14, .6), P("obelisk", .36, .64), P("bonfire", .58, .72), P("tophat", .8, .74, "front"), P("billboard", .48, .38), P("fence", .24, .82, "front"), P("crates", .7, .78)],
    ledges: [[.3, .5, .16], [.64, .42, .18]], hazard: "pillar", pressure: 2.2 },

  // ── ROW 4 · THE FOUNDATION — the boiler dark under the whole house, walked east, acts 45..56
  { id: 44, name: "The Undertent", tagline: "Sawdust and rope from above. The show keeps a floor down here too.", col: 0, row: 4, biome: 2, act: 45,
    mood: { tint: "#2a1226", wash: .3, light: .1, fog: .44, sat: 1.05 }, props: [P("tent", .2, .58), P("chains", .44, .34), P("boiler", .68, .66), P("crates", .84, .76, "front"), P("barrels", .56, .78), P("lamppost", .32, .62)],
    ledges: [[.5, .48, .2]], pressure: 2.05 },
  { id: 45, name: "Root Cellar of Names", tagline: "Headstones stored face-down. The dead keep their own archive.", col: 1, row: 4, biome: 7, act: 46,
    mood: { ...MOOD.night, wash: .3, fog: .52, sat: .92 }, props: [P("gravestone", .16, .7), P("gravestone", .3, .66), P("chains", .52, .3), P("obelisk", .72, .62), P("crates", .88, .74, "front"), P("bonfire", .44, .78)],
    ledges: [[.62, .46, .18]], hazard: "tome", pressure: 2.1 },
  { id: 46, name: "The Frozen Sump", tagline: "The drain froze mid-pour. Everything under the ice is still moving.", col: 2, row: 4, biome: 4, act: 47,
    mood: { tint: "#0e2233", wash: .26, light: .16, fog: .4, sat: .96 }, props: [P("pipes", .18, .6), P("boiler", .4, .68), P("chains", .62, .32), P("fence", .8, .72, "front"), P("barrels", .28, .78)],
    hazard: "geyser", pressure: 2.1 },
  { id: 47, name: "Peat Works", tagline: "Lanterns in the peat. The moor leaks down through the boards.", col: 3, row: 4, biome: 1, act: 48,
    mood: { ...MOOD.storm, wash: .34, fog: .62 }, props: [P("lamppost", .14, .64), P("laundry", .36, .36), P("boiler", .58, .66), P("stall", .8, .7), P("palm", .68, .74), P("crates", .9, .78, "front")],
    ledges: [[.24, .5, .2]], pressure: 2.05 },
  { id: 48, name: "Mainspring Vault", tagline: "The spring that winds the night. Do not touch it. It notices.", col: 4, row: 4, biome: 6, act: 49,
    mood: { tint: "#241a10", wash: .28, light: .12, fog: .42, sat: 1.08 }, props: [P("gear", .22, .56), P("gear", .4, .44), P("chains", .6, .3), P("boiler", .78, .68), P("scaffold", .9, .62), P("minecart", .5, .78)],
    ledges: [[.3, .44, .18], [.68, .5, .16]], hazard: "saw", pressure: 2.2 },
  { id: 49, name: "The Restricted Shelf", tagline: "Books chained to the pipes. Some of them are still reading.", col: 5, row: 4, biome: 10, act: 50,
    mood: { ...MOOD.night, wash: .3, fog: .48 }, props: [P("chains", .2, .32), P("chains", .46, .3), P("stall", .66, .68), P("crates", .84, .76, "front"), P("lamppost", .34, .6), P("fence", .1, .74, "front")],
    hazard: "wisp", pressure: 2.15 },
  { id: 50, name: "Rail Zero", tagline: "The first track ever laid. The first train never left it.", col: 6, row: 4, biome: 3, act: 51,
    mood: { tint: "#101820", wash: .3, light: .1, fog: .5, sat: .94 }, props: [P("minecart", .18, .74), P("pipes", .4, .6), P("boiler", .62, .66), P("chains", .8, .32), P("barrels", .3, .78), P("lamppost", .72, .62)],
    ledges: [[.46, .5, .22]], pressure: 2.2 },
  { id: 51, name: "Furnace Row", tagline: "Every stove in the house vents here. So does everything else.", col: 7, row: 4, biome: 8, act: 52,
    mood: { tint: "#3a0d0d", wash: .32, light: .08, fog: .46, sat: 1.16 }, props: [P("boiler", .16, .66), P("boiler", .38, .64), P("chains", .58, .3), P("bonfire", .76, .74), P("pipes", .88, .6), P("barrels", .5, .78, "front")],
    hazard: "lava", pressure: 2.3 },
  { id: 52, name: "Molasses Reservoir", tagline: "The sweet sea under the swamp. It rises when it hears music.", col: 8, row: 4, biome: 5, act: 53,
    mood: { ...MOOD.witching, wash: .3, fog: .55, sat: 1.04 }, props: [P("barrels", .14, .72), P("pipes", .36, .62), P("boiler", .58, .68), P("boat", .82, .7), P("chains", .68, .32), P("crates", .26, .78, "front")],
    ledges: [[.5, .46, .2]], pressure: 2.15 },
  { id: 53, name: "Cinder Bed", tagline: "Where the grotto's embers fall to rest. Some of them get back up.", col: 9, row: 4, biome: 0, act: 54,
    mood: { tint: "#2b1220", wash: .28, light: .1, fog: .44, sat: 1.1 }, props: [P("bonfire", .18, .72), P("boiler", .42, .66), P("chains", .6, .3), P("gravestone", .78, .68), P("fence", .9, .74, "front"), P("crates", .32, .78)],
    hazard: "bolt", pressure: 2.25 },
  { id: 54, name: "The Rain Cistern", tagline: "Every roof drains here. The city's weather, kept in a tank.", col: 10, row: 4, biome: 9, act: 55,
    mood: { ...MOOD.storm, wash: .3, fog: .52 }, props: [P("watertower", .22, .6), P("pipes", .46, .64), P("boiler", .68, .66), P("chains", .84, .32), P("barrels", .56, .78), P("lamppost", .12, .62)],
    ledges: [[.3, .48, .18], [.7, .44, .16]], hazard: "geyser", pressure: 2.2 },
  { id: 55, name: "The Winding Room", tagline: "Where the night is wound by hand. You are early. It is not happy.", col: 11, row: 4, biome: 6, act: 56,
    mood: { tint: "#20140c", wash: .34, light: .06, fog: .48, sat: 1.12 }, props: [P("gear", .18, .5), P("gear", .34, .62), P("chains", .52, .28), P("boiler", .72, .66), P("scaffold", .88, .6), P("tophat", .6, .78, "front"), P("billboard", .42, .36)],
    ledges: [[.24, .44, .2]], hazard: "spinner", pressure: 2.4 },
];

/**
 * PORBO'S ALLEY — the small one. A single screen, but hand-dressed wall to wall: eight props, a
 * shopfront you can actually walk into, two ledges, laundry overhead, and a hazard of its own.
 * Turn it on from Options → MAP when you want a dense little arena instead of a continent.
 */
export const ALLEY: StageDef = {
  id: 100, name: "Porbo's Alley", tagline: "Everything you need, nothing you deserve.",
  col: 0, row: 0, biome: 8, act: 1,
  mood: { tint: "#c8a35a", wash: .18, light: .2, fog: .34, sat: 1.06 },
  hazard: "spinner", pressure: 1.15,
  props: [
    P("stall", .18, .76), P("crates", .34, .72), P("barrels", .48, .74), P("laundry", .62, .34, "front"),
    P("lamppost", .78, .62), P("archgate", .9, .56), P("bonfire", .06, .78, "front"), P("billboard", .44, .3),
    P("fence", .26, .68, "front"), P("palm", .68, .7),
  ],
  ledges: [[.3, .56, .18], [.62, .46, .2]],
};

const clone = (s: StageDef): StageDef => ({ ...s, props: s.props.map((p) => [...p] as PropSpec), ledges: s.ledges?.map((l) => [...l] as [number, number, number]) });

function shape(stages: StageDef[], cols: number, rows: number) {
  return { cols, rows, stages };
}

export const MAPS: Record<MapId, MapDef> = {
  gigantic: { id: "gigantic", name: "THE WHOLE SHOW", label: "56 HAND-Laid STAGES", blurb: "Every act authored: its own name, light, set dressing and threat. Stepped 12 / 11 / 10 / 11 / 12, walked as a snake down to the flooded vaults and the boiler dark under them.", ...shape(STAGES, 12, 5) },
  strip: { id: "strip", name: "THE STRIP", label: "ROOFTOPS ONLY · 12", blurb: "The top row on its own — twelve authored screens in a line, no rows below.", cols: 12, rows: 1, stages: STAGES.filter((s) => s.row === 0).map(clone) },
  arena: { id: "arena", name: "ONE SCREEN", label: "THE ORIGINAL ARENA", blurb: "One screen. The act changes on the clock, exactly as the game shipped.", stages: [], cols: 1, rows: 1 },
  alley: { id: "alley", name: "PORBO'S ALLEY", label: "SMALL & DENSE", blurb: "One hand-dressed street: ten props, ledges, a shopfront, laundry overhead. Everything is in arm's reach.", stages: [clone(ALLEY)], cols: 1, rows: 1 },
};
export type WorldMap = MapDef & { /** per row, the inclusive columns that exist */ spans: { c0: number; c1: number }[] };

const cache = new Map<string, WorldMap>();
/** Resolve a map into the geometry the engine and painter need (row spans + a lookup grid). */
export function worldOf(id: MapId): WorldMap {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = MAPS[id] ?? MAPS.arena;
  const rows = Math.max(1, def.rows), cols = Math.max(1, def.cols);
  const spans = Array.from({ length: rows }, (_, r) => {
    const cs = def.stages.filter((s) => s.row === r).map((s) => s.col);
    return cs.length ? { c0: Math.min(...cs), c1: Math.max(...cs) } : { c0: 0, c1: cols - 1 };
  });
  const grid = new Map<string, StageDef>();
  for (const s of def.stages) grid.set(`${s.col},${s.row}`, s);
  const built: WorldMap = { ...def, cols, rows, spans, grid } as WorldMap;
  (built as WorldMap & { grid: Map<string, StageDef> }).grid = grid;
  cache.set(id, built);
  return built;
}

export const stageAt = (m: WorldMap, col: number, row: number): StageDef | undefined =>
  (m as WorldMap & { grid: Map<string, StageDef> }).grid?.get(`${col},${row}`)
  ?? m.stages.find((s) => s.col === col && s.row === row);

/** The voids in the silhouette are not playable: this is the single source of that truth. */
export const canStand = (m: WorldMap, col: number, row: number) => {
  if (m.stages.length === 0) return true;                       // the arena has no authored cells
  if (row < 0 || row >= m.rows) return false;
  const sp = m.spans[row];
  return col >= sp.c0 && col <= sp.c1;
};

export const rowSpanOf = (m: WorldMap, row: number) => {
  const r = Math.max(0, Math.min(m.rows - 1, Math.round(row)));
  return m.stages.length === 0 ? { c0: 0, c1: m.cols - 1 } : m.spans[r];
};

/** The route order, for the run-over letter and the map widget's tooltip. */
export const routeOf = (m: WorldMap) => [...m.stages].sort((a, b) => a.act - b.act);
