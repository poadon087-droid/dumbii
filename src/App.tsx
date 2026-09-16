import { useCallback, useEffect, useRef, useState } from "react";
import { BIOMES, CHARACTERS, CHARACTER_KEYS, CHARMS, CHARM_KEYS, ENEMIES, ENEMY_KEYS, POWERUPS, STARTER_WEAPONS, UNLOCK_KEY, UPGRADES, WEAPONS, WEAPON_KEYS, SKINS, skinFor } from "./game/data";
import { ACHIEVEMENTS, applyUpgrade, buyShopItem, createState, currentWeapon, earnedAchievements, pickUpgrades, update } from "./game/engine";
import { render, setFxOpts, setPostEnabled } from "./game/render";
import { PostFX } from "./game/post";
import { holdAudio, playMusic, preload, setMuted as setAudioMuted, setMusicIntensity, setVolumes, sfx, stopMusic, unlock } from "./game/audio";
import { readPad, resetPadEdges, rumble } from "./game/pad";
import { mergeKeyMap } from "./game/util";
import { MAPS, stageAt, worldOf, type MapId } from "./game/world";
import { STYLE_INDEX, STYLES, flagsOf, type StyleId } from "./game/styles";
import type { TextMode } from "./game/render";
import type { CharmKey, CharacterKey, GameState, Input, Mode, ShopItem, WeaponKey } from "./game/types";
import type { PadFrame } from "./game/pad";

const QUALITY_KEY = "rubberRequiemQuality";
// Storage can be outright unavailable: sandboxed iframes (no allow-same-origin),
// private windows, locked-down browsers. Every access used to throw SecurityError
// in those, and one unlocked weapon mid-run killed React with a white screen.
// All persistence now goes through these two guards.
/** The browser probes (probe.mjs, verify*.mjs, tests/browser) read the live state through a
 *  handle that only exists when the URL carries `#debug`. The shipped page never exposes it. */
const DEBUG = (() => {
  if (typeof window === "undefined") return false;
  const frag = window.location.hash.replace(/^#/, "").split(/[&,/\s]+/);
  return frag.includes("debug") || new URLSearchParams(window.location.search).has("debug");
})();
const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* no storage — play session-only */ } },
};
type Quality = { shaders: boolean; lowFx: boolean; reduced: boolean; look: "crystal" | "crt" | "vintage" | "noir"; style: StyleId; shake: number; palette: "house" | "sepia" | "toons" | "midnight"; speedlines: boolean; contrast: boolean; world: MapId; dressing: boolean;
  /** how much the show may talk over itself: every word, no combat pops, or no words at all */
  text: TextMode;
  /** the overlay: everything, bars and icons with no words, or nothing but the pause button */
  hud: "full" | "minimal" | "off" };
const DAILY_KEY = "rubberRequiemDailyBest";
const ACHV_KEY = "rubberRequiemAchv";
const KEYS_KEY = "rubberRequiemKeys";
const dailySeed = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
type ActName = "up" | "down" | "left" | "right" | "fire" | "dash" | "parry" | "ex" | "superMove" | "swap" | "interact" | "pause";
const DEFAULT_KEYS: Record<ActName, string[]> = {
  up: ["KeyW", "ArrowUp"], down: ["KeyS", "ArrowDown"], left: ["KeyA", "ArrowLeft"], right: ["KeyD", "ArrowRight"],
  fire: ["KeyF"], dash: ["ShiftLeft", "ShiftRight", "KeyL"], parry: ["Space", "KeyK"], ex: ["KeyE", "KeyJ"],
  superMove: ["KeyQ", "KeyI"], swap: ["Tab", "KeyR"], interact: ["KeyT", "KeyG"], pause: ["Escape", "KeyP"],
};
/** Loadout, charm, mode, mute and auto-fire: the five choices a player makes once and expects to
 *  still have after a reload. Validated on the way in, exactly like every other stored value. */
const PREF_KEY = "rubberRequiemPrefs";
type Prefs = { loadout: [WeaponKey, WeaponKey]; charm: CharmKey; mode: Mode; muted: boolean; autoFire: boolean; skins: Record<string, string> };
const readPrefs = (): Prefs => {
  const owned = loadUnlocks();
  const d: Prefs = { loadout: ["popper", "choir"], charm: "smoke", mode: "endless", muted: false, autoFire: true, skins: {} };
  try {
    const r = JSON.parse(store.get(PREF_KEY) || "{}");
    const w = (v: unknown, f: WeaponKey): WeaponKey => (typeof v === "string" && owned.includes(v as WeaponKey) ? (v as WeaponKey) : f);
    d.loadout = [w(Array.isArray(r.loadout) ? r.loadout[0] : undefined, "popper"), w(Array.isArray(r.loadout) ? r.loadout[1] : undefined, "choir")];
    if (typeof r.charm === "string" && CHARMS[r.charm as CharmKey]) d.charm = r.charm as CharmKey;
    if (typeof r.mode === "string" && MODES.some((m) => m.id === r.mode)) d.mode = r.mode as Mode;
    if (typeof r.muted === "boolean") d.muted = r.muted;
    if (typeof r.autoFire === "boolean") d.autoFire = r.autoFire;
    if (r.skins && typeof r.skins === "object") for (const [k, v] of Object.entries(r.skins as Record<string, unknown>))
      if (typeof v === "string" && SKINS[k as CharacterKey]?.some((x) => x.id === v)) d.skins[k] = v;
  } catch { /* defaults */ }
  return d;
};
let prefsCache: Prefs | null = null;
/** memoised: five initializers ask for it once at mount, and storage reads are not free */
const loadPrefs = (): Prefs => (prefsCache ??= readPrefs());

const loadKeys = (): Record<ActName, string[]> => {
  try { return mergeKeyMap(JSON.parse(store.get(KEYS_KEY) || "{}"), DEFAULT_KEYS); }
  catch { return { ...DEFAULT_KEYS }; }
};
const prettyKey = (c: string) => c.startsWith("Key") ? c.slice(3)
  : c === "ArrowUp" ? "↑" : c === "ArrowDown" ? "↓" : c === "ArrowLeft" ? "←" : c === "ArrowRight" ? "→"
  : c === "Space" ? "SPACE" : c === "Escape" ? "ESC" : c.replace("Left", "").replace("Right", "").toUpperCase();
const loadQuality = (): Quality => {
  try {
    const raw = JSON.parse(store.get(QUALITY_KEY) || "{}");
    // Validate every field. The old version spread `...raw` last, which threw the
    // sanitised `look` away and let anything persisted straight into the post pass.
    return {
      shaders: typeof raw.shaders === "boolean" ? raw.shaders : true,
      lowFx: typeof raw.lowFx === "boolean" ? raw.lowFx : false,
      reduced: typeof raw.reduced === "boolean" ? raw.reduced : (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches),
      look: raw.look === "vintage" ? "vintage" : raw.look === "crt" ? "crt" : raw.look === "noir" ? "noir" : "crystal",
      shake: typeof raw.shake === "number" ? Math.min(1.5, Math.max(0, raw.shake)) : 1,
      palette: raw.palette === "sepia" ? "sepia" : raw.palette === "toons" ? "toons" : raw.palette === "midnight" ? "midnight" : "house",
      speedlines: typeof raw.speedlines === "boolean" ? raw.speedlines : true,
      // "pink means danger" is the palette many players override anyway — follow the OS hint
      contrast: typeof raw.contrast === "boolean" ? raw.contrast : (typeof matchMedia === "function" && matchMedia("(prefers-contrast: more)").matches),
      world: raw.world === "one" ? "arena" : raw.world === "show" ? "gigantic"
        : raw.world === "strip" || raw.world === "arena" || raw.world === "alley" || raw.world === "gigantic" ? raw.world : "gigantic",
      style: raw.style === "toon" || raw.style === "noir" || raw.style === "riso" || raw.style === "pixel" ? raw.style : "ink",
      dressing: typeof raw.dressing === "boolean" ? raw.dressing : true,
      text: raw.text === "quiet" || raw.text === "none" ? raw.text : "all",
      hud: raw.hud === "minimal" || raw.hud === "off" ? raw.hud : "full",
    };
  } catch {
    return { shaders: true, lowFx: false, reduced: false, look: "crystal", style: "ink", shake: 1, palette: "house", speedlines: true, contrast: false, world: "gigantic", dressing: true, text: "all", hud: "full" };
  }
};
const hexToRgb = (hex: string): [number, number, number] => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
const GRADES = BIOMES.map((b) => { const c = hexToRgb(b.accent); const m = Math.max(...c) || 1; return [.85 + c[0] / m * .3, .85 + c[1] / m * .3, .85 + c[2] / m * .3] as [number, number, number]; });
const STEP = 1 / 120;
/* A colour grade per palette — multiplied into the per-biome grade, so the whole
   stage can be re-lit without the sim ever noticing. */
const PALS: Record<Quality["palette"], [number, number, number]> = {
  house: [1, 1, 1], sepia: [1.1, .96, .78], toons: [1.14, 1.12, .98], midnight: [.78, .86, 1.24],
};
/** Clean screen: two dials, one for the words painted into the show and one for the overlay. */
const TEXT_NAME: Record<TextMode, string> = { all: "EVERYTHING", quiet: "QUIET", none: "NO TEXT" };
const TEXT_HINT: Record<TextMode, string> = {
  all: "Words: every damage pop, call-out, banner and door sign, exactly as the show shipped.",
  quiet: "Words: no damage numbers or call-outs over the fight and no wave banners. The stage keeps its signage.",
  none: "Words: not one of them. No pops, no banners, no door signs, no boss card, no crate nameplates — picture only.",
};
const HUD_NAME: Record<Quality["hud"], string> = { full: "FULL", minimal: "BARS ONLY", off: "HIDDEN" };
const HUD_HINT: Record<Quality["hud"], string> = {
  full: "Overlay: meters, labels, captions and the score, all of it.",
  minimal: "Overlay: bars, pips and icons only — every word and number is taken off it.",
  off: "Overlay: gone. Only the pause button stays, so a run can never trap you.",
};
const VOL_KEY = "rubberRequiemVol";
const MODE_BEST_KEY = "rubberRequiemModeBest";
type Vols = { master: number; music: number; sfx: number };
const loadVols = (): Vols => {
  try { const r = JSON.parse(store.get(VOL_KEY) || "{}"); const n = (v: unknown, d: number) => (typeof v === "number" && v >= 0 && v <= 1 ? v : d); return { master: n(r.master, .85), music: n(r.music, 1), sfx: n(r.sfx, 1) }; }
  catch { return { master: .85, music: 1, sfx: 1 }; }
};

type Phase = "menu" | "playing" | "paused" | "upgrade" | "gameover";
const MODES: { id: Mode; name: string; sub: string; group: "bill" | "show" }[] = [
  { id: "endless", name: "ENDLESS", sub: "survive · score · repeat", group: "bill" },
  { id: "bulletdance", name: "BULLET DANCE", sub: "every shot is pink · slap the whole room back", group: "show" },
  { id: "beat", name: "ON THE BEAT", sub: "hit with the band — ×1.75 on the pulse", group: "show" },
  { id: "glass", name: "GLASS CANNON", sub: "1 HP · huge damage · spare breaths are shields", group: "show" },
  { id: "blackout", name: "BLACKOUT", sub: "a small circle of light · parry bulbs to widen it", group: "show" },
];
type Hud = {
  score: number; health: number; maxHealth: number; cards: number; combo: number; level: number; biome: string;
  weapon: WeaponKey; other: WeaponKey; dash: number; boss: { name: string; hp: number; phase: number } | null;
  announce: { title: string; sub: string } | null; kills: number; parries: number; maxCombo: number; elapsed: number;
  stats: { shots: number; hits: number; byWeapon: Partial<Record<WeaponKey, number>> }; daily: boolean;
  damageTaken: number; bosses: number; charge: number; modifier: { name: string; time: number; id: string } | null;
  rapid: number; shield: number; found: WeaponKey[]; crates: number; star: number; clock: number; fps: number;
  waves: number; revives: number; wind: number; coins: number; shopOpen: boolean; shopItems: ShopItem[];
  mode: Mode; onBeat: boolean; lightR: number;
  dance: { streak: number; best: number; heat: number };
  threat: string; charm: CharmKey; up: [string, number][];
  /** where the run stands on the authored map — shown on the pause panel and the death letter (the in-game floating map widget was removed) */
  world: { cols: number; rows: number; c: number; r: number; name: string; act: number; total: number };
};

const Glyph = ({ d, className = "" }: { d: string; className?: string }) => <svg viewBox="0 0 64 44" className={className}><path d={d} /></svg>;
/* HUD pictograms drawn in-page: an emoji coin or umbrella is a blank box on any system without
   an emoji font, and the HUD has to read on every machine the game ships to. */
const ICONS: Record<string, string> = {
  coin: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 3.4a5.6 5.6 0 0 1 5.6 5.6 5.6 5.6 0 0 1-5.6 5.6A5.6 5.6 0 0 1 6.4 12 5.6 5.6 0 0 1 12 6.4Zm0 2.2a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z",
  cart: "M3 4h2.6l2.2 9.4a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.5L21 7H7.4M10 19.6a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Zm7.6 0a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
  umbrella: "M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9Zm0 0v13a2.6 2.6 0 0 0 5.2 0",
  star: "m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8L12 3Z",
  clock: "M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2Zm0 3.6v5l3.4 2",
  lock: "M8 10.4V8a4 4 0 0 1 8 0v2.4M6.4 10.4h11.2v9H6.4v-9Zm5.6 3v3",
  heart: "M12 20.4S3.6 15.4 3.6 9.6A4.4 4.4 0 0 1 12 7.4a4.4 4.4 0 0 1 8.4 2.2c0 5.8-8.4 10.8-8.4 10.8Z",
  pause: "M8.5 5v14M15.5 5v14",
  play: "M7.5 4.6 19 12 7.5 19.4V4.6Z",
};
const Icon = ({ n, label }: { n: keyof typeof ICONS; label?: string }) => (
  <svg className={`icon icon-${n}`} viewBox="0 0 24 24" aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined}><path d={ICONS[n]} /></svg>
);
const Pip = ({ n }: { n: number }) => <span className="pips">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span>;
const loadUnlocks = (): WeaponKey[] => { try { const saved = JSON.parse(store.get(UNLOCK_KEY) || "[]") as WeaponKey[]; return Array.from(new Set([...STARTER_WEAPONS, ...saved.filter((k) => WEAPON_KEYS.includes(k))])); } catch { return [...STARTER_WEAPONS]; } };
const CHAR_KEY = "rubberRequiemCharacter";
const loadCharacter = (): CharacterKey => { const c = store.get(CHAR_KEY) as CharacterKey | null; return c && CHARACTER_KEYS.includes(c) ? c : "milo"; };

function grade(h: Hud) {
  const s = h.score / 1000 + h.parries * 1.5 + h.bosses * 12 + h.maxCombo * .4 - h.damageTaken * 1.2;
  return s > 120 ? "S" : s > 70 ? "A" : s > 35 ? "B" : s > 12 ? "C" : "D";
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const game = useRef<GameState | null>(null);
  const keys = useRef<Record<string, boolean>>({});
  const input = useRef<Input>({ mx: 0, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire: true, swap: false, interact: false });
  const joy = useRef({ x: 0, y: 0, id: -1 });
  const aimJoy = useRef({ x: 0, y: 0, id: -1, active: false });
  const keysMap = useRef<Record<ActName, string[]>>(loadKeys());
  const actionFor = (code: string): ActName | null => { for (const a of Object.keys(keysMap.current) as ActName[]) if (keysMap.current[a].includes(code)) return a; return null; };
  const held = (a: ActName) => keysMap.current[a].some((c) => keys.current[c]);
  const [binding, setBinding] = useState<ActName | null>(null);
  const [keyRev, setKeyRev] = useState(0);   // bump to repaint the key labels, which read a ref
  void keyRev;
  const bindingRef = useRef<ActName | null>(null);
  const mouse = useRef({ x: 0, y: 0, active: false, down: false });
  // the pad frame for this tick, so movement can be folded in once (it used to be overwritten)
  const padHeld = useRef<PadFrame>({ present: false, mx: 0, my: 0, ax: 0, ay: 0, fire: false, dash: false, parry: false, ex: false, sup: false, swap: false, interact: false, pause: false });
  const phaseRef = useRef<Phase>("menu");
  const bossMusic = useRef(false);
  const [phase, setPhaseState] = useState<Phase>("menu");
  const setPhase = useCallback((p: Phase) => { phaseRef.current = p; setPhaseState(p); }, []);
  const [unlocks, setUnlocks] = useState<WeaponKey[]>(loadUnlocks);
  const [loadout, setLoadout] = useState<[WeaponKey, WeaponKey]>(() => loadPrefs().loadout);
  const [slot, setSlot] = useState<0 | 1>(0);
  const [charm, setCharm] = useState<CharmKey>(() => loadPrefs().charm);
  const [mode, setMode] = useState<Mode>(() => loadPrefs().mode);
  const [character, setCharacterState] = useState<CharacterKey>(loadCharacter);
  const setCharacter = (c: CharacterKey) => { setCharacterState(c); store.set(CHAR_KEY, c); };
  /** the wardrobe: pick an outfit, and if that cast member is on the boards right now, re-dress them live */
  const pickSkin = (k: CharacterKey, id: string) => { setSkins((sp) => ({ ...sp, [k]: id })); if (game.current && game.current.player.character === k) game.current.player.skin = id; };
  const [muted, setMuted] = useState(() => loadPrefs().muted);
  const [autoFire, setAutoFire] = useState(() => loadPrefs().autoFire);
  // one write for the whole session's choices, so nothing can be added and forgotten
  const [skins, setSkins] = useState<Record<string, string>>(() => loadPrefs().skins);
  useEffect(() => { store.set(PREF_KEY, JSON.stringify({ loadout, charm, mode, muted, autoFire, skins })); }, [loadout, charm, mode, muted, autoFire, skins]);
  const [tab, setTab] = useState<"arms" | "cast" | "charm" | "foes" | "how">("arms");
  const [choices, setChoices] = useState(pickUpgrades({ upgrades: {} } as GameState));

  const optionsBlock = (inPause: boolean) => <>
    <div className="opt-sect">PICTURE</div>
    <div className="look-row">
      <span>LOOK</span>
      <button className={quality.look === "crystal" ? "on" : ""} onClick={() => setQuality({ look: "crystal" })}>CRYSTAL HD</button>
      <button className={quality.look === "crt" ? "on" : ""} onClick={() => setQuality({ look: "crt" })}>RETRO CRT</button>
      <button className={quality.look === "vintage" ? "on" : ""} onClick={() => setQuality({ look: "vintage" })}>1930s FILM</button>
      <button className={quality.look === "noir" ? "on" : ""} onClick={() => setQuality({ look: "noir" })}>INK NOIR</button>
    </div>
    <div className="opt-sect">FEEL &amp; READ</div>
    <label className="toggle"><input type="checkbox" checked={autoFire} onChange={(e) => setAutoFire(e.target.checked)} /><span>{inPause ? "Auto-fire" : "Auto-fire at nearest creep"}</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.shaders} onChange={(e) => setQuality({ shaders: e.target.checked })} /><span>Post-processing shaders</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.lowFx} onChange={(e) => setQuality({ lowFx: e.target.checked })} /><span>{inPause ? "Low FX mode (fewer particles, higher FPS)" : "Low FX mode for older phones"}</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.reduced} onChange={(e) => setQuality({ reduced: e.target.checked })} /><span>Calm FX - less shake and flash (auto-on with reduced-motion)</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.speedlines} onChange={(e) => setQuality({ speedlines: e.target.checked })} /><span>Speed lines on dash and hot combos</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.contrast} onChange={(e) => { setQuality({ contrast: e.target.checked }); sfx("click"); }} /><span>High-contrast danger cue - pink becomes CYAN</span></label>
    <div className="slider-row"><span>SCREEN SHAKE</span><input type="range" min={0} max={1.5} step={.05} value={quality.shake} onChange={(e) => setQuality({ shake: Number(e.target.value) })} /><b>{quality.shake === 0 ? "OFF" : Math.round(quality.shake * 100) + "%"}</b></div>
    <div className="opt-sect">SOUND</div>
    <div className="slider-row"><span>MASTER</span><input type="range" min={0} max={1} step={.02} value={vols.master} onChange={(e) => setVols({ master: Number(e.target.value) })} /><b>{Math.round(vols.master * 100)}</b></div>
    <div className="slider-row"><span>MUSIC</span><input type="range" min={0} max={1} step={.02} value={vols.music} onChange={(e) => setVols({ music: Number(e.target.value) })} /><b>{Math.round(vols.music * 100)}</b></div>
    <div className="slider-row"><span>SFX</span><input type="range" min={0} max={1} step={.02} value={vols.sfx} onChange={(e) => setVols({ sfx: Number(e.target.value) })} /><b>{Math.round(vols.sfx * 100)}</b></div>
    <div className="opt-sect">ART STYLE</div>
    <div className="style-row">
      {STYLES.map((st) => <button key={st.id} data-style={st.id} className={`style-btn${quality.style === st.id ? " on" : ""}`} onClick={() => { setQuality({ style: st.id }); sfx("click"); }} title={st.blurb}>
        <i style={{ background: `linear-gradient(135deg, ${st.swatch[0]} 0 40%, ${st.swatch[1]} 40% 72%, ${st.swatch[2]} 72% 100%)` }} />
        <span>{st.name}</span>
      </button>)}
    </div>
    <p className="opt-hint">{STYLES.find((x) => x.id === quality.style)?.blurb} Changing it repaints the whole show — backdrops, halftone, outline weight and the post pass — and it applies mid-run.</p>
    <label className="toggle"><input type="checkbox" checked={quality.dressing} onChange={(e) => { setQuality({ dressing: e.target.checked }); sfx("click"); }} /><span>Set dressing on the stages (props, signage, ledges)</span></label>
    <div className="opt-sect">CLEAN SCREEN</div>
    <div className="look-row text-row">
      <span>WORDS</span>
      {(["all", "quiet", "none"] as const).map((id) => <button key={id} data-text={id} className={quality.text === id ? "on" : ""} title={TEXT_HINT[id]} onClick={() => { setQuality({ text: id }); sfx("click"); }}>{TEXT_NAME[id]}</button>)}
    </div>
    <div className="look-row hud-row">
      <span>HUD</span>
      {(["full", "minimal", "off"] as const).map((id) => <button key={id} data-hud={id} className={quality.hud === id ? "on" : ""} title={HUD_HINT[id]} onClick={() => { setQuality({ hud: id }); sfx("click"); }}>{HUD_NAME[id]}</button>)}
    </div>
    <p className="opt-hint">{TEXT_HINT[quality.text]} {HUD_HINT[quality.hud]} Both apply instantly, mid-run included, and both are remembered — set WORDS to NO TEXT and HUD to BARS ONLY for a screen with no writing on it at all.</p>
    <div className="opt-sect">THE MAP</div>
    <div className="look-row map-row">
      <span>MAP</span>
      {(Object.keys(MAPS) as MapId[]).map((id) => <button key={id} className={quality.world === id ? "on" : ""} onClick={() => { setQuality({ world: id }); sfx("click"); }} title={MAPS[id].blurb}>{MAPS[id].name} · {MAPS[id].label}</button>)}
    </div>
    <p className="opt-hint">{MAPS[quality.world].blurb} Change it any time, mid-run included.</p>
    <div className="look-row"><span>GRADED</span>{(["house", "sepia", "toons", "midnight"] as const).map((pal) => <button key={pal} className={quality.palette === pal ? "on" : ""} onClick={() => { setQuality({ palette: pal }); sfx("click"); }}>{pal.toUpperCase()}</button>)}</div>
    <div className="pad-row"><small>CONTROLLER</small><b className={padOn ? "on" : ""}>{padOn ? "CONNECTED - left stick move, right stick aim, A dash, X parry, Y EX, B super, LB swap, Start pause" : "NOT DETECTED - plug one in and it will be picked up mid-run"}</b></div>
    <div className="opt-btns">
      <button className="text-btn" onClick={() => { toggleFullscreen(); sfx("click"); }}>{isFs ? "EXIT FULLSCREEN" : "FULLSCREEN"}</button>
      <button className="text-btn" onClick={() => { setBest(0); store.set("rubberRequiemBest", "0"); setModeBest({}); modeBestRef.current = {}; store.set(MODE_BEST_KEY, "{}"); setDailyBest(0); sfx("click"); }}>RESET SCORES</button>
    </div>
  </>;
  const [best, setBest] = useState(() => Number(store.get("rubberRequiemBest") || 0));
  // mirrored so the frame loop can read the current record without `best` being a dependency —
  // listing it there used to tear down the canvas, the post pass and the RAF loop mid-run
  const bestRef = useRef(best);
  useEffect(() => { const v = Number(store.get("rubberRequiemBest") || 0); if (Number.isFinite(v) && v >= 0) bestRef.current = v; }, [best]);
  const [dailyBest, setDailyBest] = useState<number>(() => { try { const r = JSON.parse(store.get(DAILY_KEY) || "{}"); return r.seed === dailySeed() ? r.score || 0 : 0; } catch { return 0; } });
  const [achv, setAchv] = useState<string[]>(() => { try { const l = JSON.parse(store.get(ACHV_KEY) || "[]"); return Array.isArray(l) ? l.filter((x): x is string => typeof x === "string") : []; } catch { return []; } });
  const achvRef = useRef<string[]>(achv); achvRef.current = achv;
  const [newAchv, setNewAchv] = useState<string[]>([]);
  const [shopView, setShopView] = useState(false);
  const [hud, setHud] = useState<Hud>({
    score: 0, health: 100, maxHealth: 100, cards: 0, combo: 0, level: 1, biome: BIOMES[0].name,
    weapon: "popper", other: "choir", dash: 0, boss: null, announce: null, kills: 0, parries: 0,
    maxCombo: 0, elapsed: 0, damageTaken: 0, bosses: 0, charge: 0, modifier: null, rapid: 0,
    shield: 0, found: [], crates: 0, star: 0, clock: 0, fps: 60, waves: 0, revives: 0, wind: 0,
    coins: 0, shopOpen: false, shopItems: [],
    stats: { shots: 0, hits: 0, byWeapon: {} }, daily: false,
    mode: "endless", onBeat: false, lightR: 250,
    dance: { streak: 0, best: 0, heat: 0 }, threat: "", charm: "smoke", up: [],
    world: { cols: 1, rows: 1, c: 0, r: 0, name: BIOMES[0].name, act: 0, total: 0 },
  });
  const [touch, setTouch] = useState(() => matchMedia("(pointer: coarse)").matches);
  const [joyPos, setJoyPos] = useState({ x: 0, y: 0 });
  const [aimPos, setAimPos] = useState({ x: 0, y: 0, on: false });
  const [started, setStarted] = useState(false);
  const [postOk, setPostOk] = useState(true);
  // A single unexpected throw in the sim or the painter should not leave the player staring at a
  // frozen canvas: the loop stops, the reason is printed, and one click picks the run back up.
  const crashed = useRef<string | null>(null);
  const [crashMsg, setCrashMsg] = useState<string | null>(null);
  const [quality, setQualityState] = useState<Quality>(loadQuality);
  const qualityRef = useRef(quality);
  const setQuality = (q: Partial<Quality>) => { const n = { ...qualityRef.current, ...q }; qualityRef.current = n; setQualityState(n); store.set(QUALITY_KEY, JSON.stringify(n)); };
  const [vols, setVolsState] = useState<Vols>(loadVols);
  const setVols = (v: Partial<Vols>) => { const n = { ...vols, ...v }; setVolsState(n); store.set(VOL_KEY, JSON.stringify(n)); setVolumes(n); };
  useEffect(() => { setVolumes(vols); }, []); // the stored mix has to reach a bus that may not exist yet
  // best score per mode, so "my Blackout run" and "my Beat run" are not the same number
  const [modeBest, setModeBest] = useState<Partial<Record<Mode, number>>>(() => { try { const r = JSON.parse(store.get(MODE_BEST_KEY) || "{}"); return r && typeof r === "object" ? r : {}; } catch { return {}; } });
  const modeBestRef = useRef(modeBest);
  const [isFs, setIsFs] = useState(false);
  const toggleFullscreen = () => { try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); } catch { /* refused by the browser */ } };
  const [padOn, setPadOn] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const padRef = useRef(false);
  useEffect(() => { const on = () => setIsFs(!!document.fullscreenElement); document.addEventListener("fullscreenchange", on); return () => document.removeEventListener("fullscreenchange", on); }, []);

  useEffect(() => { input.current.autoFire = autoFire; }, [autoFire]);
  useEffect(() => { setAudioMuted(muted); }, [muted]);
  // Read-only debug handle for the browser probes, and only when the URL asks for it.
  useEffect(() => {
    if (!DEBUG) return;
    const w = window as unknown as { __rr_game?: () => GameState | null; __rr_input?: () => Input };
    w.__rr_game = () => game.current;
    w.__rr_input = () => input.current;
    return () => { delete w.__rr_game; delete w.__rr_input; };
  }, []);

  useEffect(() => { const wake = () => { unlock(); preload(); if (phaseRef.current === "menu") playMusic("menu"); setStarted(true); window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); }; window.addEventListener("pointerdown", wake); window.addEventListener("keydown", wake); return () => { window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); }; }, []);

  const persistUnlocks = useCallback((list: WeaponKey[]) => { const merged = Array.from(new Set([...loadUnlocks(), ...list])); store.set(UNLOCK_KEY, JSON.stringify(merged)); setUnlocks(merged); }, []);

  const startRun = useCallback((opts?: { daily?: boolean; mode?: Mode }) => {
    unlock(); const shell = shellRef.current!;
    const daily = !!opts?.daily;
    game.current = createState(shell.clientWidth, shell.clientHeight, loadout, charm, unlocks, character, daily ? dailySeed() : undefined, opts?.mode ?? mode, undefined, undefined, qualityRef.current.world);
    game.current.player.skin = skins[character] ?? "";
    setNewAchv([]); setShopView(false); setChoices([]); releaseAll();
    bossMusic.current = false; setPhase("playing"); playMusic("play"); sfx("click");
  }, [loadout, charm, unlocks, character, mode, setPhase]);
  /** The run walks an authored map (src/game/world.ts): THE WHOLE SHOW is 33 hand-laid screens in
   *  a stepped 12 / 11 / 10 silhouette, THE STRIP is the top row, PORBO'S ALLEY is one dense
   *  street, ONE SCREEN is the original arena. Size comes from the map, never from a multiplier. */
  const mapDef = () => worldOf(qualityRef.current.world);
  const startRunRef = useRef<(() => void) | null>(null);
  startRunRef.current = () => startRun({ mode: game.current?.mode ?? mode });

  useEffect(() => {
    const press = (a: ActName | null, code: string) => {
      const inp = input.current, ph = phaseRef.current;
      if (a === "pause") { if (ph === "playing") setPhase("paused"); else if (ph === "paused") setPhase("playing"); return; }
      // B peeks at Porbo's ledger — mid-run only, so it can't pop a shop over the title card
      if (code === "KeyB") { if (ph === "playing") setShopView((v) => !v); return; }
      if (ph !== "playing" || !a) return;
      if (a === "dash") inp.dash = true;
      else if (a === "parry") inp.parry = true;
      else if (a === "ex") inp.ex = true;
      else if (a === "superMove") inp.superMove = true;
      else if (a === "swap") inp.swap = true;
      else if (a === "interact") inp.interact = true;
    };
    const down = (e: KeyboardEvent) => {
      if (bindingRef.current) return; // a remap is listening for this very press
      const a = actionFor(e.code);
      const onControl = (() => { const el = document.activeElement; return !!el && (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA"); })();
      // Tab is the swap key mid-run, but stealing it while a menu has focus traps keyboard players
      if (e.code === "Tab" && (onControl || phaseRef.current !== "playing")) return;
      if (a === "up" || a === "down" || a === "left" || a === "right" || a === "fire" || a === "parry" || a === "swap" || a === "pause") e.preventDefault();
      if (!keys.current[e.code]) press(a, e.code);
      keys.current[e.code] = true;
      if (a === "fire") input.current.fire = true;
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; if (actionFor(e.code) === "fire") input.current.fire = false; };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [setPhase]);

  // Key remapping: click an action, press any key, it rebinds (one key per action)
  useEffect(() => {
    if (!binding) return;
    const grab = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.code !== "Escape") {
        // the key being rebound is taken away from whoever held it first, then mergeKeyMap
        // makes the map legal again: one key per action, and nothing left with no binding
        const base: Record<ActName, string[]> = { ...keysMap.current };
        for (const act of Object.keys(base) as ActName[]) base[act] = base[act].filter((c) => c !== e.code);
        base[binding] = [e.code, ...base[binding]];
        const m = mergeKeyMap(base, DEFAULT_KEYS);
        keysMap.current = m; store.set(KEYS_KEY, JSON.stringify(m));
        setKeyRev((r) => r + 1);                                    // the labels read a ref
        input.current.fire = false; keys.current = {};
      }
      bindingRef.current = null; setBinding(null);
    };
    window.addEventListener("keydown", grab);
    return () => window.removeEventListener("keydown", grab);
  }, [binding]);

  /** Every input source has to be let go at once: a key still marked down when the window is
   *  hidden (alt-tab, a click on another window, an OS overlay) never receives its keyup, and
   *  the runner used to keep walking and firing into the pause panel and back out again. */
  const releaseAll = useCallback(() => {
    keys.current = {};
    const inp = input.current;
    inp.mx = 0; inp.my = 0; inp.fire = false; inp.aim = null;
    inp.dash = inp.parry = inp.ex = inp.superMove = inp.swap = inp.interact = false;
    mouse.current.down = false; mouse.current.active = false;
    joy.current = { x: 0, y: 0, id: -1 }; aimJoy.current = { x: 0, y: 0, id: -1, active: false };
    setJoyPos({ x: 0, y: 0 }); setAimPos({ x: 0, y: 0, on: false });
    resetPadEdges();
    // and drop any press that was still buffered, so resuming never opens with a ghost shot
    const g = game.current; if (g) g.player.trigger = 0;
  }, []);

  // Alt-tab protection: leaving the tab mid-run pauses instead of dumping you into a lunge
  useEffect(() => {
    const onHide = () => {
      holdAudio(document.hidden);
      if (document.hidden) { releaseAll(); if (phaseRef.current === "playing") setPhase("paused"); }
    };
    const onBlur = () => releaseAll();   // side-by-side windows never fire visibilitychange
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("blur", onBlur);
    return () => { document.removeEventListener("visibilitychange", onHide); window.removeEventListener("blur", onBlur); };
  }, [setPhase, releaseAll]);

  useEffect(() => {
    const canvas = canvasRef.current!, shell = shellRef.current!;
    // Offscreen 2D scene buffer → WebGL post pass onto the visible canvas. Falls back to direct 2D when WebGL is unavailable.
    const scene = document.createElement("canvas"); const sctx = scene.getContext("2d", { alpha: false })!;
    const post = new PostFX(canvas); const direct = post.ok ? null : canvas.getContext("2d", { alpha: false })!;
    setPostEnabled(post.ok); setPostOk(post.ok);
    // Mobile Safari and every GPU reset hand back a dead context now and then. post.ts rebuilds
    // itself on `webglcontextrestored`; until then the run is put on ice instead of playing blind.
    post.onLost = () => { setGlLost(true); setPostOk(false); if (phaseRef.current === "playing") setPhase("paused"); };
    post.onRestored = () => { setGlLost(false); setPostOk(true); resize(); };
    let raf = 0, last = performance.now(), hudClock = 0, fpsAcc = 0, fpsN = 0, fps = 60, slowFrames = 0, hurtGlow = 0, acc = 0, lastScale = 0;
    let dprCap = 2, pixelScale = 1;
    // every style draws at the shell's CSS size; the pixel look shrinks the buffer and the post
    // pass blows it back up with hard edges
    const resize = () => { const r = shell.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, dprCap) * pixelScale; const W = Math.round(r.width * dpr), H = Math.round(r.height * dpr); scene.width = W; scene.height = H; sctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (direct) { canvas.width = W; canvas.height = H; direct.setTransform(dpr, 0, 0, dpr, 0, 0); } canvas.style.width = `${r.width}px`; canvas.style.height = `${r.height}px`; };
    resize(); const ro = new ResizeObserver(resize); ro.observe(shell);
    if (!game.current) { const c0 = loadCharacter(); game.current = createState(shell.clientWidth, shell.clientHeight, ["popper", "choir"], "smoke", loadUnlocks(), c0, undefined, "endless", undefined, undefined, qualityRef.current.world); game.current.player.skin = skins[c0] ?? ""; }
    const tick = (now: number) => {
      const w = shell.clientWidth, h = shell.clientHeight, raw = (now - last) / 1000, dt = Math.min(.034, raw); last = now;
      // adaptive resolution: if we sustain < 45fps, drop the DPR cap once
      fpsAcc += raw; fpsN++;
      if (fpsAcc > .5) {
        fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0;
        // One-way, with a cooldown: stepping the resolution back UP while a session is running made
        // mid-range machines ping-pong across the threshold — a canvas realloc hitch every few
        // seconds, which reads as "the aiming went laggy". Down only; it recovers on the next run.
        if (fps < 45 && dprCap > 1 && now - lastScale > 5000) { if (++slowFrames > 3) { dprCap = 1; slowFrames = 0; lastScale = now; resize(); } }
        else slowFrames = Math.max(0, slowFrames - 1);
      }
      const g = game.current!, inp = input.current, ph = phaseRef.current;
      g.lowFx = qualityRef.current.lowFx;
      const mz = mapDef();
      // Resize the world the moment the option changes, even behind the pause panel: the frozen
      // frame is still being drawn, and update() (which normally resyncs) is not running.
      if (g.map !== mz.id || g.districts !== mz.cols || g.rows !== mz.rows) {
        g.map = mz.id; g.worldW = Math.round(w * mz.cols); g.worldH = Math.round(h * mz.rows);
        g.stage = mz.stages.length ? stageAt(mz, g.tCol, g.tRow) ?? mz.stages[0] ?? null : null;
      }
      g.districts = mz.cols; g.rows = mz.rows;
      const q0 = qualityRef.current;
      setFxOpts({ speedlines: q0.speedlines, contrast: q0.contrast, dressing: q0.dressing, style: q0.style, text: q0.text });
      // a style can ask for a smaller scene buffer (the 8-bit look) — only resize when it changes
      const wantScale = flagsOf(q0.style).scale;
      if (wantScale !== pixelScale) { pixelScale = wantScale; post.setNearest(wantScale < 1); resize(); }
      // ---- GAMEPAD: polled once a frame, edges resolved in pad.ts ----
      const pad = readPad();
      padHeld.current = pad;
      if (pad.present !== padRef.current) { padRef.current = pad.present; setPadOn(pad.present); }
      if (pad.pause) { if (ph === "playing") { releaseAll(); setPhase("paused"); } else if (ph === "paused") setPhase("playing"); else if (ph === "gameover") startRunRef.current?.(); }
      if (pad.present && ph === "playing") {
        if (Math.hypot(pad.ax, pad.ay) > .15) inp.aim = { x: g.player.x + pad.ax * 260, y: g.player.y + pad.ay * 260 };
        if (pad.dash) inp.dash = true;
        if (pad.parry) inp.parry = true;
        if (pad.ex) inp.ex = true;
        if (pad.sup) inp.superMove = true;
        if (pad.swap) inp.swap = true;
        if (pad.interact) inp.interact = true;
      }
      if (qualityRef.current.reduced) { g.shake = Math.min(g.shake, 1.2); g.flash = Math.min(g.flash, .2); } // Calm FX
      if (ph === "playing") {
        const padNow = padHeld.current;
        // every movement source in one place: keys, the on-screen stick, then the pad stick
        inp.mx = Math.max(-1, Math.min(1, (held("right") ? 1 : 0) - (held("left") ? 1 : 0) + joy.current.x + padNow.mx));
        inp.my = Math.max(-1, Math.min(1, (held("down") ? 1 : 0) - (held("up") ? 1 : 0) + joy.current.y + padNow.my));
        // the pointer is a screen position; the world scrolls, so aim has to be converted
        // screen → world on BOTH axes: with rows stacked, cam.y is not zero, and leaving it out
        // made every click aim at the wrong height (which reads as "it sometimes won't fire")
        inp.aim = mouse.current.active ? { x: mouse.current.x + g.cam.x, y: mouse.current.y + g.cam.y } : null;
        if (aimJoy.current.active) {                        // thumb on the stick = aim that way and shoot
          inp.aim = { x: g.player.x + aimJoy.current.x * 320, y: g.player.y + aimJoy.current.y * 320 };
        }
        inp.fire = held("fire") || mouse.current.down || aimJoy.current.active || padNow.fire;
        // fixed-timestep accumulator: consistent physics regardless of refresh rate (60/90/120/144Hz)
        acc += dt; let steps = 0;
        while (acc >= STEP && steps < 6) { update(g, inp, STEP, w, h); acc -= STEP; steps++; }
        if (steps === 6) acc = 0;      // a throttled tab must not stampede the sim on return
        for (const ev of g.events) {
          sfx(ev); if (ev === "unlock") persistUnlocks(g.unlocks);
          if (ev === "hurt") rumble(140, .85, .5); else if (ev === "parry") rumble(70, .45, .8); else if (ev === "boom") rumble(90, .6, .3);
        }
        g.events.length = 0;
        const bossNow = !!g.boss; if (bossNow !== bossMusic.current) { bossMusic.current = bossNow; playMusic(bossNow ? "boss" : "play"); }
        if (g.upgradeReady) { setChoices(pickUpgrades(g)); setPhase("upgrade"); }
        if (g.over) {
          releaseAll(); setShopView(false);
          const nb = Math.max(bestRef.current, g.score); bestRef.current = nb; setBest(nb); store.set("rubberRequiemBest", String(nb));
          const mb = { ...modeBestRef.current }; const gm = g.mode;
          if ((mb[gm] || 0) < g.score) { mb[gm] = g.score; modeBestRef.current = mb; setModeBest(mb); store.set(MODE_BEST_KEY, JSON.stringify(mb)); }
          if (g.dailySeed !== undefined) {
            let prev = 0;
            try { const r = JSON.parse(store.get(DAILY_KEY) || "{}"); if (r.seed === g.dailySeed) prev = r.score || 0; } catch { /* fresh day */ }
            const db = Math.max(prev, g.score); setDailyBest(db);
            store.set(DAILY_KEY, JSON.stringify({ seed: g.dailySeed, score: db }));
          }
          const earned = earnedAchievements(g).filter((id) => !achvRef.current.includes(id));
          if (earned.length) {
            const merged = [...achvRef.current, ...earned];
            achvRef.current = merged; setAchv(merged); store.set(ACHV_KEY, JSON.stringify(merged)); sfx("unlock");
          }
          setNewAchv(earned);
          setPhase("gameover"); stopMusic();
        }
        setMusicIntensity(g.boss ? 1 : Math.min(1, g.enemies.length / 10));
      } else { g.events.length = 0; }
      render(sctx, g, w, h, now);
      const p = g.player;
      hurtGlow = Math.max(0, hurtGlow - dt * 2); if (p.invuln > .85 && p.health > 0 && ph === "playing") hurtGlow = 1;
      const q = qualityRef.current;
      const pal = PALS[q.palette];
      const nx = GRADES[Math.min(GRADES.length - 1, g.biomeNext)] ?? GRADES[g.biome];
      const mx = Math.max(0, Math.min(1, g.biomeMix));
      const grade3 = GRADES[g.biome].map((v, i) => (v * (1 - mx) + nx[i] * mx) * pal[i]) as [number, number, number];
      const lookVal = q.look === "crystal" ? 0 : q.look === "crt" ? 1 : q.look === "vintage" ? 2 : 3;
      if (post.ok && q.shaders) {
        post.draw(scene, {
          time: now / 1000, flash: g.flash, hurt: hurtGlow * .8,
          fog: g.modifier?.id === "fog" ? 1 : 0, pink: g.modifier?.id === "pink" ? 1 : 0,
          slow: g.slowmo > 0 || p.clock > 0 ? 1 : 0, intensity: q.lowFx ? .6 : 1,
          shake: g.shake * q.shake, grade: grade3, lookMode: lookVal, low: q.lowFx ? 1 : 0,
          danger: ph === "playing" && p.health < p.maxHealth * .3 ? (1 - p.health / (p.maxHealth * .3)) * (0.5 + 0.5 * Math.sin(now / 140)) : 0,
          styleMode: STYLE_INDEX[q0.style] ?? 0
        });
      } else if (post.ok) {
        post.draw(scene, {
          time: now / 1000, flash: g.flash, hurt: hurtGlow * .5,
          fog: g.modifier?.id === "fog" ? 1 : 0, pink: 0, slow: 0,
          intensity: 0, shake: 0, grade: [1, 1, 1], lookMode: 0, low: 1, danger: 0, styleMode: 0
        });
      } else if (direct) { direct.drawImage(scene, 0, 0, w, h); }
      hudClock += dt;
      if (hudClock > .1) {
        hudClock = 0;
        setHud({
          score: g.score, health: Math.max(0, p.health), maxHealth: p.maxHealth, cards: p.cards,
          combo: g.combo, level: g.level, biome: g.stage?.name ?? BIOMES[g.biome].name, weapon: currentWeapon(g),
          other: g.weapons[g.active === 0 ? 1 : 0], dash: p.dashCd > 0 ? p.dashCd / (1.15 * p.dashCdMult) : 0,
          boss: g.boss ? { name: g.boss.bossName || "Boss", hp: g.boss.hp / g.boss.maxHp, phase: g.boss.bossPhase || 1 } : null,
          announce: g.announce && g.announce.life > 0 ? { title: g.announce.title, sub: g.announce.sub } : null,
          kills: g.kills, parries: g.parries, maxCombo: g.maxCombo, elapsed: g.elapsed, damageTaken: g.damageTaken,
          bosses: g.bossesBeaten, charge: p.charge, modifier: g.modifier ? { name: g.modifier.name, time: g.modifier.time, id: g.modifier.id } : null,
          rapid: p.rapid, shield: p.shield, found: g.found, crates: g.cratesOpened, star: p.star, clock: p.clock,
          fps: Math.round(fps), waves: g.wave, revives: g.revives, wind: p.wind,
          coins: p.coins, shopOpen: g.shopOpen, shopItems: g.shopItems,
          stats: g.stats, daily: g.dailySeed !== undefined,
          mode: g.mode, onBeat: g.onBeat, lightR: Math.round(g.lightR),
          dance: { streak: g.dance.streak, best: g.dance.best, heat: g.dance.heat },
          threat: g.lastThreat, charm: g.charm, up: Object.entries(g.upgrades).filter(([, v]) => (v as number) > 0) as [string, number][],
          world: {
            cols: g.districts, rows: g.rows || 1, c: g.tCol, r: g.tRow,
            name: g.stage?.name ?? BIOMES[g.biome]?.name ?? "",
            act: g.stage?.act ?? 0, total: worldOf(g.map ?? "arena").stages.length,
          },
        });
      }
    };
    const frame = (now: number) => {
      if (!crashed.current) { try { tick(now); } catch (err) {
        crashed.current = err instanceof Error ? `${err.message}` : String(err);
        setCrashMsg(crashed.current); releaseAll();
        if (phaseRef.current === "playing") setPhase("paused");
      } }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [setPhase, persistUnlocks, releaseAll]);

  /** Move the a11y cursor into whatever letter just opened (the crash card first, since it can
   *  sit on top of the pause panel), and back to the canvas when the way is clear again. */
  useEffect(() => {
    const modal = phase === "paused" || phase === "upgrade" || phase === "gameover";
    if (modal) document.querySelector<HTMLElement>("[data-modal]")?.focus({ preventScroll: true });
    else if (phase === "playing") { const el = document.activeElement; if (el instanceof HTMLElement) el.blur(); }
  }, [phase, crashMsg, glLost]);

  const recoverFromCrash = () => { crashed.current = null; setCrashMsg(null); releaseAll(); sfx("click"); if (game.current) game.current.over = false; setPhase("playing"); };

  const choose = (id: string) => { if (game.current) applyUpgrade(game.current, id); sfx("levelup"); setPhase("playing"); };
  const buyItem = (idx: number) => { if (game.current && buyShopItem(game.current, idx)) { sfx("coin"); } };
  /** the marquee dials: the four settings people flip most, one tap each, no digging through OPTIONS */
  const quickDials = () => (
    <div className="quick-dials">
      <button className="dial" title={TEXT_HINT[quality.text]} onClick={() => { setQuality({ text: quality.text === "all" ? "quiet" : quality.text === "quiet" ? "none" : "all" }); sfx("click"); }}><small>WORDS</small><b>{TEXT_NAME[quality.text]}</b></button>
      <button className="dial" title={HUD_HINT[quality.hud]} onClick={() => { setQuality({ hud: quality.hud === "full" ? "minimal" : quality.hud === "minimal" ? "off" : "full" }); sfx("click"); }}><small>HUD</small><b>{HUD_NAME[quality.hud]}</b></button>
      <button className="dial" title="How the show is drawn" onClick={() => { const ids = STYLES.map((x) => x.id); setQuality({ style: ids[(ids.indexOf(quality.style) + 1) % ids.length] }); sfx("click"); }}><small>ART</small><b>{STYLES.find((x) => x.id === quality.style)?.name.split(" ")[0] ?? "INK"}</b></button>
      <button className="dial" title="Toggle sound" onClick={() => { setMuted(!muted); unlock(); }}><small>SOUND</small><b>{muted ? "OFF" : "ON"}</b></button>
    </div>
  );
  const toMenu = () => { const s = shellRef.current!; game.current = createState(s.clientWidth, s.clientHeight, loadout, charm, unlocks, character, undefined, "endless", undefined, undefined, qualityRef.current.world); game.current.player.skin = skins[character] ?? ""; setPhase("menu"); playMusic("menu"); };

  const cpos = (e: React.PointerEvent) => { const r = canvasRef.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") setTouch(true);
    mouse.current = { ...cpos(e), active: true, down: true };
  };
  const onMove = (e: React.PointerEvent) => {
    if (mouse.current.down || e.pointerType !== "touch") {
      mouse.current = { ...mouse.current, ...cpos(e), active: true };
    }
  };
  const onUp = () => { mouse.current.down = false; };
  const joyStart = (e: React.PointerEvent<HTMLDivElement>) => { e.currentTarget.setPointerCapture(e.pointerId); joy.current.id = e.pointerId; joyMove(e); };
  const joyMove = (e: React.PointerEvent<HTMLDivElement>) => { if (joy.current.id !== e.pointerId) return; const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2), d = Math.max(1, Math.hypot(x, y)), max = r.width * .34, k = Math.min(d, max) / max; joy.current.x = k * x / d; joy.current.y = k * y / d; setJoyPos({ x: joy.current.x * 28, y: joy.current.y * 28 }); };
  const joyEnd = () => { joy.current = { x: 0, y: 0, id: -1 }; setJoyPos({ x: 0, y: 0 }); };
  // right stick: push it anywhere and you aim that way while you fire — one thumb, both jobs
  const aimStart = (e: React.PointerEvent<HTMLDivElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); aimJoy.current = { x: 0, y: 0, id: e.pointerId, active: true }; setAimPos({ x: 0, y: 0, on: true }); };
  const aimMove = (e: React.PointerEvent<HTMLDivElement>) => { if (aimJoy.current.id !== e.pointerId) return; const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2), d = Math.max(1, Math.hypot(x, y)), max = r.width * .34, k = Math.min(d, max) / max; aimJoy.current.x = k * x / d; aimJoy.current.y = k * y / d; setAimPos({ x: aimJoy.current.x * 28, y: aimJoy.current.y * 28, on: true }); };
  const aimEnd = () => { aimJoy.current = { x: 0, y: 0, id: -1, active: false }; setAimPos({ x: 0, y: 0, on: false }); };
  const act = (key: "dash" | "parry" | "ex" | "superMove" | "swap") => (e: React.PointerEvent) => { e.preventDefault(); input.current[key] = true; };

  /** the how-to-play letter reads the live key map, so rebinding a key cannot leave the manual lying */
  // keyRev is state, so a rebinding re-renders this whole letter and the labels below read fresh
  /** A modifier pair (ShiftLeft + ShiftRight) pretty-prints to the same word — dedupe after
   *  mapping so the manual never reads "SHIFT · SHIFT". */
  const kh = (a: ActName, n = 2) => [...new Set(keysMap.current[a].map(prettyKey))].slice(0, n).join(" · ");
  const wA = WEAPONS[loadout[0]], wB = WEAPONS[loadout[1]], sel = WEAPONS[loadout[slot]];
  const cards = Math.floor(hud.cards);
  const lockedCount = WEAPON_KEYS.length - unlocks.length;

  return <main className="game-page">
    <div className="grain" aria-hidden="true" />
    <section ref={shellRef} className={`game-shell txt-${quality.text} hud-${quality.hud}`} aria-label="Rubber Requiem">
      <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { mouse.current.down = false; }} onContextMenu={(e) => e.preventDefault()} />

      {phase !== "menu" && <>
        {phase === "playing" && hud.mode !== "endless" && <div className={`mode-badge${hud.mode === "beat" && hud.onBeat ? " in-beat" : ""}${hud.mode === "bulletdance" && hud.dance.streak >= 6 ? " in-dance" : ""}`}>
          {hud.mode === "bulletdance"
            ? `BULLET DANCE · ${hud.dance.streak} IN A ROW${hud.dance.heat > .05 ? ` · ×${(1 + hud.dance.heat * .9).toFixed(2)} DMG` : ""}`
            : hud.mode === "glass"
              ? "GLASS CANNON · ONE HIT KILLS YOU"
              : hud.mode === "beat"
                ? hud.onBeat ? "♪ NOW! ×1.75" : "♪ WAIT FOR THE PULSE"
                : hud.mode === "blackout"
                  ? `BLACKOUT · LIGHT ${hud.lightR}`
                  : ""}
        </div>}
        <div className={`hud${hud.health / hud.maxHealth < .28 ? " danger" : ""}`}>
          <div className="hud-left">
            <div className="portrait"><span>R</span></div>
            <div className="health-wrap">
              <div className="health-label">GUMPTION <b>{Math.ceil(hud.health)}/{hud.maxHealth}</b></div>
              <div className="health-bar" role="progressbar" aria-label="Gumption" aria-valuemin={0} aria-valuemax={hud.maxHealth} aria-valuenow={Math.ceil(hud.health)}><i style={{ width: `${hud.health / hud.maxHealth * 100}%` }} /></div>
              <div className="cards" title="Super meter">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < cards ? "full" : ""} style={i === cards ? { ["--fill" as string]: `${(hud.cards - cards) * 100}%` } : undefined}><b>{i + 1}</b></i>)}</div>
              <div className="buffs">{hud.shield > 0 && <span className="buff shield"><Icon n="umbrella" />×{hud.shield}</span>}{hud.rapid > 0 && <span className="buff rapid">HOT HANDS {hud.rapid.toFixed(0)}s</span>}{hud.star > 0 && <span className="buff star"><Icon n="star" />STAR {hud.star.toFixed(0)}s</span>}{hud.clock > 0 && <span className="buff clock"><Icon n="clock" />TIME OUT {hud.clock.toFixed(0)}s</span>}{hud.wind > 0 && <span className="buff wind"><Icon n="heart" />SPARE ×{hud.wind}</span>}</div>
            </div>
          </div>
          <div className="score">
            <small>SCORE</small><i className="score-num">{hud.score.toLocaleString()}</i>
            <span className="biome-sub" title={`${hud.biome} · level ${hud.level}`}><small className="lv">LV. {hud.level}{hud.biome ? " ·" : ""}</small> {hud.biome}</span>
            <div className="coin-badge"><Icon n="coin" label="coins" />{hud.coins}<span>¢</span></div>
          </div>
          <div className="hud-right">
            <button className="round-btn" onClick={() => { if (phase === "playing") { releaseAll(); setPhase("paused"); } else setPhase("playing"); }} aria-label={phase === "playing" ? "Pause" : "Resume"} aria-keyshortcuts="Escape" title={phase === "playing" ? "Pause (Esc)" : "Resume (Esc)"}><Icon n={phase === "playing" ? "pause" : "play"} /></button>
            {(DEBUG || hud.fps < 50) && <small className="fps" title={hud.fps < 50 ? "the projector is struggling — lower the options for more speed" : undefined}>{hud.fps} FPS</small>}
            {hud.shopOpen && hud.shopItems.length > 0 && (
              <button className="shop-hud-btn" onClick={() => setShopView(true)} aria-label="Open Porbo's shop" title={`Porbo's ledger (${keysMap.current.interact.map(prettyKey).join(" / ")})`}>
                <span><Icon n="cart" />PORBO'S SHOP · {keysMap.current.interact.map(prettyKey).join("/")}</span>
              </button>
            )}
          </div>
          {hud.combo > 2 && <div className="combo" key={hud.combo}>{hud.combo} HIT!<small>HOT STREAK</small></div>}
          {hud.boss && (
            <div className="boss-bar" role="progressbar" aria-label={hud.boss.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.boss.hp * 100)}>
              <span>{hud.boss.name.toUpperCase()} · PHASE {hud.boss.phase}/3</span>
              <div><i style={{ width: `${hud.boss.hp * 100}%` }} /></div>
            </div>
          )}
          {hud.modifier && <div className={`modifier ${hud.modifier.id}`}><b>{hud.modifier.name}</b><i style={{ width: `${Math.min(100, hud.modifier.time / 12 * 100)}%` }} /></div>}
        </div>

        {shopView && (
          <div className="overlay center-overlay shop-overlay">
            <div className="shop-panel">
              <span className="kicker">PORBO'S TRAVELING EMPORIUM</span>
              <h2>TRADE YER SHINY COINS!</h2>
              <p className="shop-quote">"Fine wares for fine chaps! You got the coin, I got the heat!"</p>
              <div className="shop-grid">
                {hud.shopItems.map((item, idx) => (
                  <div key={item.id} className={`shop-card ${item.bought ? "bought" : ""}`}>
                    <div className="shop-icon"><Glyph d={item.icon} /></div>
                    <b>{item.name}</b>
                    <small>{item.desc}</small>
                    <button
                      className="shop-buy-btn"
                      disabled={item.bought || hud.coins < item.price}
                      onClick={() => buyItem(idx)}
                    >
                      {item.bought ? "SOLD OUT" : `BUY · ${item.price}¢`}
                    </button>
                  </div>
                ))}
              </div>
              <button className="play-btn close-shop-btn" onClick={() => setShopView(false)}>
                <span>BACK TO THE NIGHTMARE</span><i>→</i>
              </button>
            </div>
          </div>
        )}
        {hud.announce && phase === "playing" && <div className="announce" role="status" aria-live="polite" key={hud.announce.title + hud.announce.sub}><small>{hud.announce.sub}</small><b>{hud.announce.title}</b></div>}
        {phase === "playing" && <button className="weapon-switch" onPointerDown={act("swap")} aria-label="Swap weapon">
          <Glyph d={WEAPONS[hud.weapon].icon} /><span><small>{keysMap.current.swap.map(prettyKey).join(" / ").toUpperCase()} · SWAP TO {WEAPONS[hud.other].name.toUpperCase()}</small>{WEAPONS[hud.weapon].name}</span>
          <em className="dash-ind" style={{ ["--cd" as string]: `${(1 - hud.dash) * 100}%` }}>DASH</em>
          {hud.weapon === "kettle" && <em className="charge-ind"><i style={{ width: `${hud.charge * 100}%` }} /></em>}
        </button>}
      </>}

      {phase === "playing" && touch && <div className="mobile-controls">
        <div className="joystick" onPointerDown={joyStart} onPointerMove={joyMove} onPointerUp={joyEnd} onPointerCancel={joyEnd}><i style={{ transform: `translate(${joyPos.x}px, ${joyPos.y}px)` }} /></div>
        <div className="action-cluster">
          <div className={`aim-stick${aimPos.on ? " on" : ""}`} onPointerDown={aimStart} onPointerMove={aimMove} onPointerUp={aimEnd} onPointerCancel={aimEnd}>
            <b>AIM · FIRE</b>
            <i style={{ transform: `translate(${aimPos.x}px, ${aimPos.y}px)` }} />
          </div>
          <button className={`act dash${hud.dash > 0 ? " cooling" : ""}`} onPointerDown={act("dash")}>DASH<i className="cd" style={{ width: `${Math.round((1 - hud.dash) * 100)}%` }} /></button>
          <button className="act parry" onPointerDown={act("parry")}>PARRY</button>
          <button className={`act ex ${cards >= 1 ? "ready" : ""}`} onPointerDown={act("ex")}>EX</button>
          <button className={`act auto-toggle ${autoFire ? "on" : ""}`} onPointerDown={(e) => { e.preventDefault(); setAutoFire(!autoFire); sfx("click"); }}>{autoFire ? "AUTO" : "FREE"}</button>
          {cards >= 5 && <button className="act super" onPointerDown={act("superMove")}>SUPER!</button>}
        </div>
      </div>}

      {phase === "menu" && <div className="overlay menu-overlay">
        <div className="title-block">
          <span className="kicker">A NEVER-ENDING NIGHTMARE IN GLORIOUS INK</span>
          <h1>RUBBER<br /><em>REQUIEM</em></h1>
          <p>Outrun the ink. Outgun the dark. Parry everything pink.</p>
          <div className="best">BEST SCORE <b>{best.toLocaleString()}</b><span>ARMORY {unlocks.length}/{WEAPON_KEYS.length}</span><span>MAP {MAPS[quality.world]?.label ?? "ONE SCREEN"}{quality.dressing ? "" : " · BARE"}</span></div>
          {quickDials()}
          <div className="mode-label">MAIN BILL</div>
          <div className="mode-row">{MODES.filter((m) => m.group === "bill").map((m) => <button key={m.id} className={`mode-btn${mode === m.id ? " on" : ""}`} onClick={() => { setMode(m.id); sfx("click"); }}><b>{m.name}</b><small>{m.sub}</small>{modeBest[m.id] ? <em className="mbest">BEST {modeBest[m.id]!.toLocaleString()}</em> : null}</button>)}</div>
          <div className="mode-label gold">SHOWSTOPPERS · OWN RULES</div>
          <div className="mode-row">{MODES.filter((m) => m.group === "show").map((m) => <button key={m.id} className={`mode-btn${mode === m.id ? " on" : ""}`} onClick={() => { setMode(m.id); sfx("click"); }}><b>{m.name}</b><small>{m.sub}</small>{modeBest[m.id] ? <em className="mbest">BEST {modeBest[m.id]!.toLocaleString()}</em> : null}</button>)}</div>
          <button className="play-btn" onClick={() => startRun()}><span>PLAY {MODES.find((m) => m.id === mode)?.name ?? "ENDLESS"}</span><i>→</i></button>
          <button className="play-btn daily" onClick={() => startRun({ daily: true, mode: "endless" })}><span><Icon n="star" /> DAILY REEL · #{dailySeed()}</span><i>★</i></button>
          {!started && <small className="tap-hint">TAP ANYWHERE TO WAKE THE BAND</small>}
          <div className="loadout-summary">
            <div><small>STARRING · {skinFor(character, skins[character]).name}</small><Glyph d={CHARACTERS[character].icon} /><b>{CHARACTERS[character].name.split(" ")[0]}</b></div>
            <div><small>SLOT A</small><Glyph d={wA.icon} /><b>{wA.name}</b></div>
            <div><small>SLOT B</small><Glyph d={wB.icon} /><b>{wB.name}</b></div>
            <div><small>CHARM</small><Glyph d={CHARMS[charm].icon} className="charm-glyph" /><b>{CHARMS[charm].name}</b></div>
          </div>
        </div>
        <div className="menu-panel">
          <div className="tabs">{(["cast", "arms", "charm", "foes", "how"] as const).map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => { setTab(t); sfx("click"); }}>{t === "cast" ? "CAST" : t === "arms" ? "ARMORY" : t === "charm" ? "CHARMS" : t === "foes" ? "BESTIARY" : "HOW TO PLAY"}{t !== "how" && <em>{t === "cast" ? CHARACTER_KEYS.length : t === "arms" ? WEAPON_KEYS.length : t === "charm" ? CHARM_KEYS.length : ENEMY_KEYS.length + 3}</em>}</button>)}</div>
          {tab === "cast" && <div className="panel-body cast-list">
            {CHARACTER_KEYS.map((k) => { const c = CHARACTERS[k]; const sk = skinFor(k, skins[k]); const locked = k === "barnaby" && !achv.includes("boss1"); return (
              <button key={k} className={`${character === k ? "selected" : ""}${locked ? " locked" : ""}`} disabled={locked} onClick={() => { setCharacter(k); sfx("click"); }} style={{ ["--c" as string]: sk.accent }}>
                <span className="cast-portrait" style={{ ["--accent" as string]: sk.accent, ["--skin" as string]: sk.port }}>
                  <svg viewBox="0 0 64 72"><ellipse cx="32" cy="66" rx="18" ry="4" fill="rgba(0,0,0,.25)" />
                    <path d="M22 44h20l3 22H19Z" fill={sk.accent} stroke="#1a1418" strokeWidth="3" />
                    <circle cx="32" cy="30" r="15" fill={sk.port} stroke="#1a1418" strokeWidth="3" />
                    {k === "dixie" && <><ellipse cx="31" cy="17" rx="15" ry="7" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><path d="M38 14q10-9 15-4" stroke={sk.detail} strokeWidth="3" fill="none" strokeLinecap="round" /></>}
                    {k === "barnaby" && <><ellipse cx="32" cy="20" rx="19" ry="4.5" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><path d="M21 20V9q11-6 22 0v11Z" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><rect x="21" y="16" width="22" height="3.5" fill={sk.detail} /></>}
                    {k === "milo" && <><rect x="20" y="12" width="24" height="10" rx="3" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><rect x="20" y="19" width="24" height="2.5" fill={sk.detail} /></>}
                    {k === "coco" && <><ellipse cx="32" cy="18" rx="21" ry="5" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><path d="M24 17q0-10 8-10t8 10Z" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><path d="M40 12q9-7 13-2" stroke={sk.detail} strokeWidth="3" fill="none" strokeLinecap="round" /></>}
                    {k === "rusty" && <><path d="M20 20q0-13 12-13t12 13Z" fill={sk.trim} stroke="#1a1418" strokeWidth="3" /><rect x="20" y="17" width="24" height="4" fill={sk.detail} /><circle cx="27" cy="24" r="3.4" fill={sk.detail} stroke="#1a1418" strokeWidth="2" /><circle cx="38" cy="24" r="3.4" fill={sk.detail} stroke="#1a1418" strokeWidth="2" /></>}
                    <path d="M26 27a3 6 0 1 0 4 0a3 6 0 1 0-4 0" fill="#1a1418" /><path d="M36 27a3 6 0 1 0 4 0a3 6 0 1 0-4 0" fill="#1a1418" />
                    <path d="M26 38q6 5 12 0" stroke="#1a1418" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="cast-copy"><b>{c.name}</b><em>{locked ? <><Icon n="lock" /> BEAT ANY BOSS TO UNLOCK</> : `${c.title} · ${c.trait}`}</em><small>{c.desc}</small>
                  <span className="cast-stats"><span>POWER<Pip n={c.power} /></span><span>PACE<Pip n={c.pace} /></span><span>GRIT<Pip n={c.grit} /></span></span>
                </span>
              </button>); })}
            <div className="skin-rack">
              <small>WARDROBE · {CHARACTERS[character].name.toUpperCase()}<em>the outfit follows them into the run</em></small>
              <div className="skin-row">
                {SKINS[character].map((sk) => { const lock = !!sk.encore && !achv.includes("boss1"); const on = (skins[character] ?? "house") === sk.id; return (
                  <button key={sk.id} className={`skin-btn${on ? " on" : ""}${lock ? " locked" : ""}`} disabled={lock} title={lock ? "Beat any Ringmaster to unlock" : sk.name}
                    onClick={() => { pickSkin(character, sk.id); sfx("click"); }}>
                    <i style={{ background: `linear-gradient(140deg, ${sk.head} 0 42%, ${sk.accent} 42% 72%, ${sk.trim} 72%)` }} />
                    <b>{sk.name}</b>{lock ? <Icon n="lock" /> : null}
                  </button>); })}
              </div>
            </div>
          </div>}
          {tab === "arms" && <div className="panel-body">
            <div className="slot-tabs"><button className={slot === 0 ? "on" : ""} onClick={() => setSlot(0)}>SLOT A · {wA.name}</button><button className={slot === 1 ? "on" : ""} onClick={() => setSlot(1)}>SLOT B · {wB.name}</button></div>
            <div className="weapon-grid">{WEAPON_KEYS.map((k) => { const locked = !unlocks.includes(k); return <button key={k} className={locked ? "locked" : loadout[slot] === k ? "selected" : loadout[1 - slot] === k ? "other" : ""} onClick={() => { unlock(); if (locked) { sfx("deny"); return; } sfx("click"); setLoadout((l) => { const n: [WeaponKey, WeaponKey] = [...l]; if (n[1 - slot] === k) n[1 - slot] = n[slot]; n[slot] = k; return n; }); }} aria-label={locked ? "Locked weapon" : WEAPONS[k].name}><Glyph d={WEAPONS[k].icon} /><small>{locked ? "LOCKED" : WEAPONS[k].name}</small>{locked && <i className="lock" />}</button>; })}</div>
            <div className="weapon-detail">
              <div><b>{sel.name}</b><em>{sel.trait}</em><p>{sel.blurb}</p><p className="ex"><strong>EX · {sel.ex}</strong> {sel.exDesc}</p></div>
              <div className="stats"><span>POWER<Pip n={sel.power} /></span><span>PACE<Pip n={sel.pace} /></span><span>REACH<Pip n={sel.range} /></span></div>
            </div>
            <div className="shop-preview">
              <small>PORBO'S STALL · TONIGHT'S STANDING MENU<em>he sets up after every knockout — walk up and talk, or peek with {kh("interact", 1)}</em></small>
              <div className="shop-row"><b>HEART PIE</b><span>a warm slice, half your scratches gone</span><i>15¢</i></div>
              <div className="shop-row"><b>GOLDEN CARD PACK</b><span>two super cards, no questions asked</span><i>20¢</i></div>
              <div className="shop-row"><b>PRIZE WEAPON</b><span>whatever was in the crate out back</span><i>25¢</i></div>
              <div className="shop-row"><b>BOON OF THE NIGHT</b><span>one of tonight's three, your pick</span><i>30¢</i></div>
              <small className="shop-note">Four-Leaf Clover takes 30% off every line. Coins come from creeps, crates and parries.</small>
            </div>
            {lockedCount > 0 && <small className="hint dark">{lockedCount} weapon{lockedCount > 1 ? "s" : ""} still hidden in the field — grab PRIZE CRATES mid-run to unlock them for good.</small>}
          </div>}
          {tab === "charm" && <div className="panel-body charm-list">{CHARM_KEYS.map((k) => { const locked = k === "varnish" && !achv.includes("parry50"); return <button key={k} className={`${charm === k ? "selected" : ""}${locked ? " locked" : ""}`} disabled={locked} onClick={() => { setCharm(k); sfx("click"); }} style={{ ["--c" as string]: CHARMS[k].color }}><Glyph d={CHARMS[k].icon} className="charm-glyph" /><span><b>{CHARMS[k].name}</b><small>{locked ? <><Icon n="lock" /> PARRY 50 SHOTS IN ONE RUN</> : CHARMS[k].desc}</small></span></button>; })}</div>}
          {tab === "foes" && <div className="panel-body foes">{ENEMY_KEYS.map((k) => <div key={k}><i style={{ background: ENEMIES[k].color }} /><span><b>{ENEMIES[k].name}</b><small>{ENEMIES[k].note}</small></span><em>{ENEMIES[k].unlock === 0 ? "FROM START" : `AT ${ENEMIES[k].unlock}s`}</em></div>)}<div><i style={{ background: "#ffd75a" }} /><span><b>Elites</b><small>Crowned, gilded versions of any creep. Tough — but they always drop a crate or power-up.</small></span><em>AFTER 40s</em></div><div><i style={{ background: ENEMIES.boss.color }} /><span><b>Ringmasters</b><small>Three-phase cartoon titans every 90 seconds. Knock one out for a full heal, a crate, and a visit from Porbo.</small></span><em>AT 80s</em></div></div>}
          {tab === "how" && <div className="panel-body how">
            <div><b>MOVE</b><span>{kh("left", 1)} · {kh("right", 1)} · {kh("up", 1)} · {kh("down", 1)} · left stick · left thumb-stick on touch</span></div>
            <div><b>THE WHOLE SHOW</b><span>{MAPS.gigantic.stages.length} hand-laid stages in one continuous map, stepped {MAPS.gigantic.cols} screens across and {MAPS.gigantic.rows} down, so the world has edges you can see. Walk through a lit doorway to change act, up or down the gangway to change row; a plank over each door names the stage you are about. Pick PORBO'S ALLEY in OPTIONS → THE MAP for one dense screen instead, or ONE SCREEN for the original arena.</span></div>
            <div><b>GETTING BACK</b><span>Difficulty runs on the clock, not on where you stand — wander off and come back, the map waits. A chevron on the screen edge points at the nearest creep and how far off it is.</span></div>
            <div><b>AIM STICK</b><span>Touch: push the right stick anywhere and you aim that way while you fire</span></div>
            <div><b>AIM & FIRE</b><span>Mouse (hold click) · {kh("fire")} · Auto-fire aims at whatever you can actually hit and sweeps ahead when you cannot. Every pull is remembered: a press that lands mid-dash, mid-hit-stop or mid-reload still comes out the moment the gun is ready, and no weapon can come up dry.</span></div>
            <div><b>ART STYLE</b><span>Five ways the show is drawn — {STYLES.map((s) => s.name).join(" · ")} — plus a toggle for the set dressing</span></div>
            <div><b>CLEAN SCREEN</b><span>WORDS takes the writing out of the picture — {TEXT_NAME.all} · {TEXT_NAME.quiet} (no damage pops, no banners) · {TEXT_NAME.none} (not one word on the stage). HUD takes the overlay down — {HUD_NAME.full} · {HUD_NAME.minimal} (bars, pips and icons only) · {HUD_NAME.off} (nothing but the pause button). Both live in OPTIONS and apply mid-run.</span></div>
            <div><b>DASH</b><span>{kh("dash")} · brief invincibility, longer with Smoke Bomb</span></div>
            <div><b>PARRY</b><span>{kh("parry")} · slap anything <i className="pink">PINK</i> to gain a super card · right-click works too</span></div>
            <div><b>EX MOVE</b><span>{kh("ex")} · spend 1 card for your weapon's signature</span></div>
            <div><b>SUPER</b><span>{kh("superMove")} · 5 cards for the GRAND FINALE</span></div>
            <div><b>SWAP</b><span>{kh("swap")} · switch between your two weapons</span></div>
            <div><b>TALK</b><span>{kh("interact")} · walk up to Porbo after a knockout to keep his stall open · B peeks at the ledger from anywhere in the act</span></div>
            <div><b>PAUSE</b><span>{kh("pause")} · leaving the tab pauses the run and lets go of every key you were holding</span></div>
            <div><b>CRATES</b><span>Walk over a prize crate to take its weapon into your active slot</span></div>
            <div><b>POWER-UPS</b><span>{Object.values(POWERUPS).map((p) => p.name).join(" · ")}</span></div>
            <div><b>STAGE HAZARDS</b><span>Every act throws its own threat — {BIOMES.map((b) => b.hazardName).join(" · ")}. They always telegraph first.</span></div>
            <div><b>THE CAST</b><span>{CHARACTER_KEYS.map((k) => `${CHARACTERS[k].name} (${CHARACTERS[k].trait})`).join(" · ")}</span></div>
            <div className="opts-head"><b>OPTIONS</b><small>saved on this device</small></div>
            <div className="opts-grid">{optionsBlock(false)}</div>
            <small className="credits">Music: Eric Matyas — soundimage.org · SFX: hand-sculpted synth · Resolution scales automatically if frame rate drops</small>
          </div>}
        </div>
        <button className="round-btn sound" onClick={() => { setMuted(!muted); unlock(); }} aria-label="Toggle sound"><svg viewBox="0 0 24 24"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15 9c1.4 1.7 1.4 4.3 0 6M18 6c3.3 3.4 3.3 8.6 0 12" /></svg>{muted && <i />}</button>
      </div>}

      {crashMsg && <div className="overlay center-overlay"><div className="letter small-letter crash-letter" data-modal tabIndex={-1} role="alertdialog" aria-modal="true" aria-label="The game stopped">
        <span className="kicker">THE PROJECTIONIST SLIPPED</span>
        <h2>THE SHOW STOPPED</h2>
        <p>Something unexpected happened while the reel was running, so the frame loop was halted before it could spoil your score. Your run is waiting on the pause panel.</p>
        <p className="crash-detail">{crashMsg}</p>
        <button className="play-btn" onClick={recoverFromCrash}><span>CONTINUE THE SHOW</span><i>→</i></button>
        <button className="text-btn" onClick={() => window.location.reload()}>RELOAD THE PAGE</button>
        {DEBUG && <button className="text-btn" onClick={() => { crashed.current = null; setCrashMsg(null); }}>IGNORE AND KEEP GOING</button>}
      </div></div>}

      {glLost && !postOk && <div className="overlay center-overlay"><div className="letter small-letter" data-modal tabIndex={-1} role="alertdialog" aria-modal="true" aria-label="Hardware acceleration was lost">
        <span className="kicker">THE PROJECTOR JAMMED</span>
        <h2>NO HARDWARE ACCELERATION</h2>
        <p>The browser took the drawing context away — usually a phone putting the tab to sleep, or a driver reset on a desktop. Your run is paused, not lost.</p>
        <button className="play-btn" onClick={() => { window.location.reload(); }}><span>RELOAD THE SHOW</span><i>→</i></button>
      </div></div>}

      {phase === "paused" && <div className="overlay center-overlay"><div className="pause-panel" data-modal tabIndex={-1} role="dialog" aria-modal="true" aria-label="Paused"><span className="kicker">THE NIGHT WAITS</span><h2>PAUSED</h2>
        <div className="build-row">
          <small>YOUR ACT</small>
          <b>{WEAPONS[hud.weapon].name}{hud.weapon !== hud.other ? ` + ${WEAPONS[hud.other].name}` : ""} &middot; {CHARMS[hud.charm].name}</b>
          <span>{hud.up.length ? hud.up.map(([id, lv]) => `${UPGRADES.find((u) => u.id === id)?.title ?? id}${lv > 1 ? ` L${lv}` : ""}`).join(" &middot; ") : "no boons yet"}</span>
          {hud.world.total > 1 && <em className="act-place">STAGE {hud.world.act} of {hud.world.total} · {hud.world.name.toUpperCase()} · W {hud.world.c + 1} · S {hud.world.r + 1}</em>}
        </div>
        {quickDials()}
        <label className="toggle"><input type="checkbox" checked={!muted} onChange={(e) => setMuted(!e.target.checked)} /><span>Sound</span></label>
        <div className="opts-head"><b>OPTIONS</b><small>changes stick after you quit</small></div>
        <div className="opts-grid">{optionsBlock(true)}</div>
        <div className="opts-head keys-head"><b>CONTROLS</b><small>click a key, then press the one you want · ESC cancels</small></div>
        <div className="keys-grid">{(Object.keys(DEFAULT_KEYS) as ActName[]).map((act) => (
          <button key={act} className={`keybtn${binding === act ? " binding" : ""}`} onClick={() => { bindingRef.current = act; setBinding(act); sfx("click"); }}>
            <small>{act === "superMove" ? "SUPER" : act.toUpperCase()}</small>
            <b>{binding === act ? "PRESS…" : keysMap.current[act].map(prettyKey).join(" / ")}</b>
          </button>))}
        </div>
        <button className="text-btn" onClick={() => { keysMap.current = { ...DEFAULT_KEYS }; store.set(KEYS_KEY, "{}"); setKeyRev((r) => r + 1); setBinding(null); bindingRef.current = null; sfx("click"); }}>RESET KEYS TO DEFAULT</button>
        <button className="play-btn" onClick={() => setPhase("playing")}><span>KEEP SWINGING</span><i>→</i></button>
        <button className="text-btn restart" onClick={() => startRun({ mode: game.current?.mode ?? "endless" })}>↻ RESTART RUN</button>
        <button className="text-btn" onClick={toMenu}>RETURN TO TITLE</button></div></div>}

      {phase === "upgrade" && <div className="overlay center-overlay"><div className="upgrade-panel" data-modal tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choose a boon"><span className="kicker">PICK YOUR POISON</span><h2>A LITTLE STRONGER</h2>
        <div className="upgrade-list">{choices.map((u, i) => <button key={u.id} onClick={() => choose(u.id)}><b>0{i + 1}</b><span><strong>{u.title}</strong><small>{u.desc}</small></span><i>{(game.current?.upgrades[u.id] || 0) > 0 ? `LV ${(game.current?.upgrades[u.id] || 0) + 1}` : "+"}</i></button>)}</div>
        <small className="hint">{UPGRADES.length} boons in the pool · picks stack</small></div></div>}

      {phase === "gameover" && <div className="overlay center-overlay"><div className="pause-panel gameover" data-modal tabIndex={-1} role="dialog" aria-modal="true" aria-label="Run over">
        <span className="kicker">{hud.daily ? `DAILY REEL · #${dailySeed()}` : hud.mode === "glass" ? "SHATTERED" : hud.mode === "beat" ? "OFF BEAT AT THE END" : hud.mode === "blackout" ? "SWALLOWED BY THE DARK" : hud.mode === "bulletdance" ? "THE DANCE BROKE" : `CURTAIN CALL${hud.revives > 0 ? ` · ${hud.revives} SECOND WIND${hud.revives > 1 ? "S" : ""}` : ""}`}</span>
        <h2>FLATTENED!</h2>
        {hud.threat && <div className="taken">TAKEN OUT BY <b>{hud.threat}</b></div>}
        {(hud.world.total > 1 || hud.world.cols * hud.world.rows > 1) && <div className="fell">FELL IN <b>{hud.world.name.toUpperCase()}</b> · STAGE {hud.world.total > 1 ? hud.world.act : hud.world.r * hud.world.cols + hud.world.c + 1} of {hud.world.total > 1 ? hud.world.total : hud.world.cols * hud.world.rows}</div>}
        <div className="grade" data-g={grade(hud)}>{grade(hud)}</div>
        <div className="final-score"><small>FINAL SCORE</small>{hud.score.toLocaleString()}<span>BEST {best.toLocaleString()} &middot; {(MODES.find((m) => m.id === hud.mode)?.name ?? "ENDLESS")} BEST {(modeBest[hud.mode] ?? 0).toLocaleString()}</span></div>
        <div className="stat-grid"><div><b>{hud.kills}</b><small>KNOCKOUTS</small></div><div><b>{hud.parries}</b><small>PARRIES</small></div><div><b>{hud.maxCombo}</b><small>BEST COMBO</small></div><div><b>{hud.bosses}</b><small>BOSSES</small></div><div><b>{Math.floor(hud.elapsed / 60)}:{String(Math.floor(hud.elapsed % 60)).padStart(2, "0")}</b><small>SURVIVED</small></div><div><b>{hud.crates}</b><small>CRATES</small></div><div><b>{hud.waves}</b><small>WAVES</small></div><div><b>{Math.floor(hud.parries * 1.5 + hud.bosses * 12)}</b><small>STYLE PTS</small></div><div><b>{hud.kills > 0 ? Math.round(hud.score / hud.kills) : 0}</b><small>PER K.O.</small></div><div><b>{hud.stats.shots ? Math.round((hud.stats.hits / hud.stats.shots) * 100) : 0}%</b><small>ACCURACY</small></div><div><b>{(() => { const en = Object.entries(hud.stats.byWeapon) as [WeaponKey, number][]; en.sort((x, y) => y[1] - x[1]); return en[0] ? WEAPONS[en[0][0]].name.split(" ")[0].toUpperCase() : "\u2014"; })()}</b><small>FAVORITE</small></div></div>
        {hud.daily && <div className="daily-badge"><small>DAILY REEL · SEED #{dailySeed()}</small>BEST TODAY {dailyBest.toLocaleString()}</div>}
        {newAchv.length > 0 && <div className="achv-row"><small>ACHIEVEMENTS UNLOCKED</small>{newAchv.map((id) => <span key={id}>{ACHIEVEMENTS.find((x) => x.id === id)?.name}</span>)}</div>}
        {hud.found.length > 0 && <div className="found"><small>NEW IN THE ARMORY</small>{hud.found.map((k) => <span key={k}><Glyph d={WEAPONS[k].icon} />{WEAPONS[k].name}</span>)}</div>}
        <button className="play-btn" onClick={() => startRun({ daily: game.current?.dailySeed !== undefined, mode: game.current?.mode ?? "endless" })}><span>ONE MORE RIFF</span><i>↻</i></button>
        <button className="text-btn" onClick={toMenu}>CHANGE LOADOUT</button></div></div>}

      <div className="vignette" aria-hidden="true" /><div className="scanlines" aria-hidden="true" /><div className="scratches" aria-hidden="true" />
    </section>
    <footer><span>RUBBER REQUIEM</span><p>MUSIC BY ERIC MATYAS · SOUNDIMAGE.ORG — AN ORIGINAL ENDLESS ARCADE NIGHTMARE</p></footer>
  </main>;
}
