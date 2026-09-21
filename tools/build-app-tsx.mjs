import fs from "node:fs";
import path from "node:path";

const appTsxContent = `import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import logoBumbi from "./assets/logo-bumbi.png";
import { BIOMES, CHARACTERS, CHARACTER_KEYS, CHARMS, CHARM_KEYS, ENEMIES, ENEMY_KEYS, STARTER_WEAPONS, UNLOCK_KEY, UPGRADES, WEAPONS, WEAPON_KEYS, SKINS } from "./game/data";
import { ACHIEVEMENTS, applyUpgrade, buyShopItem, createState, currentWeapon, earnedAchievements, pickUpgrades, update } from "./game/engine";
import { render, setFxOpts, setPostEnabled } from "./game/render";
import { PostFX } from "./game/post";
import { playMusic, preload, setMuted as setAudioMuted, setMusicIntensity, setVolumes, sfx, stopMusic, unlock } from "./game/audio";
import { readPad, resetPadEdges, rumble } from "./game/pad";
import { mergeKeyMap } from "./game/util";
import { MAPS, worldOf, type MapId } from "./game/world";
import { STYLE_INDEX, STYLES, type StyleId } from "./game/styles";
import type { TextMode } from "./game/render";
import type { CharmKey, CharacterKey, GameState, Input, Mode, ShopItem, WeaponKey } from "./game/types";
import type { PadFrame } from "./game/pad";
import {
  fetchTopScores,
  submitScore,
  getPlayerNickname,
  setPlayerNickname,
  getSupabaseConfig,
  saveSupabaseConfig,
  getLocalProfile,
  getLocalCoinHistory,
  getPlayerProfile,
  getCoinHistory,
  type LeaderboardEntry,
  type CoinTransaction,
} from "./supabase";

type Tab = "home" | "cast" | "arms" | "charm" | "foes" | "how" | "shop" | "board" | "vault" | "settings";
type Orientation = "auto" | "portrait" | "landscape";

const TABS: { id: Tab; label: string; count?: number }[] = [
  { id: "home", label: "HOME" },
  { id: "cast", label: "CAST", count: 5 },
  { id: "arms", label: "ARMORY", count: 37 },
  { id: "charm", label: "CHARMS", count: 13 },
  { id: "foes", label: "BESTIARY", count: 43 },
  { id: "how", label: "HOW TO PLAY" },
  { id: "shop", label: "SHOP" },
  { id: "board", label: "LEADERBOARD" },
  { id: "vault", label: "VAULT" },
  { id: "settings", label: "SETTINGS" },
];

const UI_MODES = [
  { id: "endless" as Mode, icon: "∞", title: "ENDLESS", desc: "SURVIVE AS LONG AS YOU CAN. SCORE HIGH. REPEAT.", foot: "★ SURVIVE & SCORE", art: "art-endless" },
  { id: "endless" as Mode, icon: "▦", title: "STAGES", desc: "56 HAND-LAID STAGES. DIFFERENT CHALLENGES.", foot: "⚑︎ MAP 56/56", art: "art-stages" },
  { id: "glass" as Mode, icon: "♛", title: "BOSS RUSH", desc: "FACE THE NIGHTMARES. ONE AFTER ANOTHER.", foot: "★ 1 HP · BIG HURT", art: "art-boss" },
  { id: "blackout" as Mode, icon: "▣", title: "BLACKOUT", desc: "THE LAMPS ARE OUT. FIND THE LIGHT. PARRY.", foot: "★ CIRCLE OF LIGHT", art: "art-blackout" },
  { id: "bulletdance" as Mode, icon: "◈", title: "BULLET DANCE", desc: "PINK SHOTS. PARRY ALL.", foot: "★ PARRY EVERYTHING", art: "art-bullet" },
  { id: "beat" as Mode, icon: "♪", title: "ON THE BEAT", desc: "HIT ON THE PULSE. ×1.75.", foot: "★ TIMED BEAT HITS", art: "art-beat" },
] as const;

const SHOP_CATALOG = [
  { id: "sugar_shield", name: "SUGAR SHIELD", price: 80, desc: "Blocks one hit. Tastes like victory.", glyph: "⬟" },
  { id: "hot_hands", name: "HOT HANDS", price: 120, desc: "Fire rate up for one night.", glyph: "✦" },
  { id: "second_wind", name: "SECOND WIND", price: 200, desc: "Revive once at half health.", glyph: "↻︎" },
  { id: "map_pack", name: "MAP PACK", price: 150, desc: "Reveals two blackout rooms.", glyph: "▦" },
  { id: "extra_life", name: "EXTRA LIFE", price: 350, desc: "A spare Milo. Do not wind him.", glyph: "♥" },
  { id: "golden_bullet", name: "GOLDEN BULLET", price: 500, desc: "Deletes one boss phase.", glyph: "●" },
];

const GUIDE: [string, string][] = [
  ["MOVE", "W A S D / ARROWS / LEFT STICK"],
  ["AIM & FIRE", "MOUSE / AUTO-FIRE / F"],
  ["DASH", "SHIFT / L"],
  ["PARRY", "SPACE / K (SLAP PINK)"],
  ["EX ATTACK", "E / J (1 CARD)"],
  ["SUPER MOVE", "Q / I (5 CARDS)"],
  ["SWAP WEAPON", "TAB / R"],
  ["PAUSE", "ESC / P"],
];

const TIPS = [
  "Pink shots can be parried. Everything else must be dodged.",
  "Dashing through a foe reloads one charm instantly.",
  "The bellhop always rings twice. Count it. Move on two.",
  "Blackout rooms hide exits behind the paper moon.",
];

const ORIENTATIONS: Orientation[] = ["auto", "portrait", "landscape"];
const ORIENTATION_LABEL: Record<Orientation, string> = { auto: "AUTO", portrait: "PORTRAIT", landscape: "LANDSCAPE" };
const WORDS_OPTIONS = ["ALL", "SIGNS", "NO TEXT"] as const;
const HUD_OPTIONS = ["FULL", "MIN", "OFF"] as const;
const ART_OPTIONS = ["INK", "SEPIA", "BLOOD"] as const;

const QUALITY_KEY = "rubberRequiemQuality";
const DEBUG = (() => {
  if (typeof window === "undefined") return false;
  const frag = window.location.hash.replace(/^#/, "").split(/[&,/\\s]+/);
  return frag.includes("debug") || new URLSearchParams(window.location.search).has("debug");
})();

const store = {
  get(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* no storage */ } },
};

type Quality = {
  shaders: boolean; lowFx: boolean; reduced: boolean; look: "crystal" | "crt" | "vintage" | "noir";
  style: StyleId; shake: number; palette: "house" | "sepia" | "toons" | "midnight"; speedlines: boolean;
  contrast: boolean; world: MapId; dressing: boolean; text: TextMode; hud: "full" | "minimal" | "off";
};

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

const PREF_KEY = "rubberRequiemPrefs";
type Prefs = { loadout: [WeaponKey, WeaponKey]; charm: CharmKey; mode: Mode; muted: boolean; autoFire: boolean; skins: Record<string, string> };

const loadUnlocks = (): WeaponKey[] => {
  try {
    const saved = JSON.parse(store.get(UNLOCK_KEY) || "[]") as WeaponKey[];
    return Array.from(new Set([...STARTER_WEAPONS, ...saved.filter((k) => WEAPON_KEYS.includes(k))]));
  } catch {
    return [...STARTER_WEAPONS];
  }
};

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
    if (r.skins && typeof r.skins === "object") {
      for (const [k, v] of Object.entries(r.skins as Record<string, unknown>)) {
        if (typeof v === "string" && SKINS[k as CharacterKey]?.some((x) => x.id === v)) d.skins[k] = v;
      }
    }
  } catch { /* defaults */ }
  return d;
};
let prefsCache: Prefs | null = null;
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
    return {
      shaders: typeof raw.shaders === "boolean" ? raw.shaders : true,
      lowFx: typeof raw.lowFx === "boolean" ? raw.lowFx : false,
      reduced: typeof raw.reduced === "boolean" ? raw.reduced : (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches),
      look: raw.look === "vintage" ? "vintage" : raw.look === "crt" ? "crt" : raw.look === "noir" ? "noir" : "crystal",
      shake: typeof raw.shake === "number" ? Math.min(1.5, Math.max(0, raw.shake)) : 1,
      palette: raw.palette === "sepia" ? "sepia" : raw.palette === "toons" ? "toons" : raw.palette === "midnight" ? "midnight" : "house",
      speedlines: typeof raw.speedlines === "boolean" ? raw.speedlines : true,
      contrast: typeof raw.contrast === "boolean" ? raw.contrast : (typeof matchMedia === "function" && matchMedia("(prefers-contrast: more)").matches),
      world: raw.world === "strip" || raw.world === "arena" || raw.world === "alley" || raw.world === "gigantic" ? raw.world : "gigantic",
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
const PALS: Record<Quality["palette"], [number, number, number]> = {
  house: [1, 1, 1], sepia: [1.1, .96, .78], toons: [1.14, 1.12, .98], midnight: [.78, .86, 1.24],
};
const TEXT_NAME: Record<TextMode, string> = { all: "EVERYTHING", quiet: "QUIET", none: "NO TEXT" };
const TEXT_HINT: Record<TextMode, string> = {
  all: "Words: every damage pop, call-out, banner and door sign.",
  quiet: "Words: no damage numbers or combat pops over the fight.",
  none: "Words: none at all — picture only.",
};
const HUD_NAME: Record<Quality["hud"], string> = { full: "FULL", minimal: "BARS ONLY", off: "HIDDEN" };
const HUD_HINT: Record<Quality["hud"], string> = {
  full: "Overlay: meters, labels, captions and score.",
  minimal: "Overlay: bars and icons only.",
  off: "Overlay: hidden. Pause button only.",
};
const VOL_KEY = "rubberRequiemVol";
const MODE_BEST_KEY = "rubberRequiemModeBest";
type Vols = { master: number; music: number; sfx: number };
const loadVols = (): Vols => {
  try { const r = JSON.parse(store.get(VOL_KEY) || "{}"); const n = (v: unknown, d: number) => (typeof v === "number" && v >= 0 && v <= 1 ? v : d); return { master: n(r.master, .85), music: n(r.music, 1), sfx: n(r.sfx, 1) }; }
  catch { return { master: .85, music: 1, sfx: 1 }; }
};

type Phase = "menu" | "loadout" | "cutscene" | "playing" | "paused" | "upgrade" | "gameover";
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
  world: { cols: number; rows: number; c: number; r: number; name: string; act: number; total: number };
};

const Glyph = ({ d, className = "" }: { d: string; className?: string }) => <svg viewBox="0 0 64 44" className={className}><path d={d} /></svg>;
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
  refresh: "M20 11a8 8 0 0 0-14.9-3.7L3 10m0 0V5m0 5h5M4 13a8 8 0 0 0 14.9 3.7L21 14m0 0v5m0-5h-5",
};
const Icon = ({ n, label }: { n: keyof typeof ICONS; label?: string }) => (
  <svg className={\`icon icon-\${n}\`} viewBox="0 0 24 24" aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined}><path d={ICONS[n]} /></svg>
);

function Pips({ value, max, label }: { value: number; max: number; label: string }) {
  return (
    <span className="pips" role="img" aria-label={\`\${label} \${value} of \${max}\`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? "pip on" : "pip"} aria-hidden="true" />
      ))}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
  onBack,
  onPlay,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  onBack: () => void;
  onPlay: () => void;
}) {
  return (
    <header className="section-head">
      <button className="btn-ghost" type="button" onClick={onBack}>
        ← BACK
      </button>
      <h2 className="section-title">
        <span className="h-eyebrow">{eyebrow}</span>
        {title}
      </h2>
      <button className="btn-play-sm" type="button" onClick={onPlay}>
        PLAY <span aria-hidden="true">▶</span>
      </button>
      <p className="section-sub flavor">{sub}</p>
    </header>
  );
}

function cycle<T>(options: readonly T[], current: T): T {
  return options[(options.indexOf(current) + 1) % options.length];
}

function tabFromHash(): Tab {
  const hash = window.location.hash.replace(/^#\\/?/, "");
  return TABS.some((t) => t.id === hash) ? (hash as Tab) : "home";
}

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
  const [keyRev, setKeyRev] = useState(0);
  void keyRev;
  const bindingRef = useRef<ActName | null>(null);
  const mouse = useRef({ x: 0, y: 0, active: false, down: false });
  const padHeld = useRef<PadFrame>({ present: false, mx: 0, my: 0, ax: 0, ay: 0, fire: false, dash: false, parry: false, ex: false, sup: false, swap: false, interact: false, pause: false });
  const phaseRef = useRef<Phase>("menu");
  const bossMusic = useRef(false);
  const [phase, setPhaseState] = useState<Phase>("menu");
  const setPhase = useCallback((p: Phase) => { phaseRef.current = p; setPhaseState(p); }, []);
  const [unlocks, setUnlocks] = useState<WeaponKey[]>(loadUnlocks);
  const [loadout, setLoadout] = useState<[WeaponKey, WeaponKey]>(() => loadPrefs().loadout);
  const [charm, setCharm] = useState<CharmKey>(() => loadPrefs().charm);
  const [mode, setMode] = useState<Mode>(() => loadPrefs().mode);
  const [character, setCharacterState] = useState<CharacterKey>(loadCharacter);
  const setCharacter = (c: CharacterKey) => { setCharacterState(c); store.set(CHAR_KEY, c); };
  const pickSkin = (k: CharacterKey, id: string) => { setSkins((sp) => ({ ...sp, [k]: id })); if (game.current && game.current.player.character === k) game.current.player.skin = id; };
  const [muted, setMuted] = useState(() => loadPrefs().muted);
  const [autoFire, setAutoFire] = useState(() => loadPrefs().autoFire);
  const [skins, setSkins] = useState<Record<string, string>>(() => loadPrefs().skins);

  const [tab, setTab] = useState<Tab>(() => tabFromHash());
  const [modeIdx, setModeIdx] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>(() => (store.get("rr-orientation") as Orientation) || "auto");
  const [query, setQuery] = useState("");
  const [foeQuery, setFoeQuery] = useState("");
  const [words, setWords] = useState<(typeof WORDS_OPTIONS)[number]>("ALL");
  const [hudLevel, setHudLevel] = useState<(typeof HUD_OPTIONS)[number]>("FULL");
  const [artStyle, setArtStyle] = useState<(typeof ART_OPTIONS)[number]>("INK");
  const [fullScreen, setFullScreen] = useState(false);
  const modeListRef = useRef<HTMLDivElement>(null);

  const [playerTag, setPlayerTag] = useState<string>(getPlayerNickname);
  const [tagInput, setTagInput] = useState<string>(playerTag);
  const [editingTag, setEditingTag] = useState(false);
  const [boardMode, setBoardMode] = useState<string>("all");
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => getSupabaseConfig().url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState<string>(() => getSupabaseConfig().key);
  const [urlConfigSaved, setUrlConfigSaved] = useState<boolean>(() => !!getSupabaseConfig().url);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  const [vaultCoins, setVaultCoins] = useState<number>(() => getLocalProfile().total_coins);
  const [vaultLifetime, setVaultLifetime] = useState<number>(() => getLocalProfile().lifetime_coins);
  const [coinHistory, setCoinHistory] = useState<CoinTransaction[]>(() => getLocalCoinHistory());
  const [ownedShopItems, setOwnedShopItems] = useState<string[]>(() => {
    try { return JSON.parse(store.get("rr-owned-shop") || "[]"); } catch { return []; }
  });

  const refreshVault = useCallback(async () => {
    const prof = await getPlayerProfile(playerTag);
    setVaultCoins(prof.total_coins);
    setVaultLifetime(prof.lifetime_coins);
    const history = await getCoinHistory(playerTag, 25);
    setCoinHistory(history);
  }, [playerTag]);

  const refreshScores = useCallback(async (selectedMode: string = boardMode) => {
    setScoresLoading(true);
    setScoresError(null);
    const res = await fetchTopScores(selectedMode === "daily" ? undefined : selectedMode, selectedMode === "daily" ? dailySeed() : undefined, 30);
    setScoresLoading(false);
    if (res.error) setScoresError(res.error);
    else setScores(res.data);
  }, [boardMode]);

  useEffect(() => {
    if (tab === "board") void refreshScores(boardMode);
    else if (tab === "vault") void refreshVault();
  }, [tab, boardMode, refreshScores, refreshVault]);

  useEffect(() => { store.set(PREF_KEY, JSON.stringify({ loadout, charm, mode, muted, autoFire, skins })); }, [loadout, charm, mode, muted, autoFire, skins]);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goTab = (next: Tab) => {
    setTab(next);
    if (tabFromHash() !== next) window.location.hash = \`#/\${next}\`;
    sfx("click");
  };

  const scrollToMode = (i: number) => {
    const clamped = Math.max(0, Math.min(UI_MODES.length - 1, i));
    setModeIdx(clamped);
    const list = modeListRef.current;
    const card = list?.querySelectorAll(".mode-card")[clamped] as HTMLElement | undefined;
    if (list && card) {
      const listBox = list.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const left = list.scrollLeft + (cardBox.left - listBox.left) - (list.clientWidth - cardBox.width) / 2;
      list.scrollTo({ left, behavior: quality.reduced ? "auto" : "smooth" });
    }
  };

  const toggleFullScreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setFullScreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setFullScreen(false);
      }
    } catch { /* ignored */ }
  };

  const buyItem = (id: string, price: number) => {
    if (ownedShopItems.includes(id) || vaultCoins < price) return;
    const nextCoins = vaultCoins - price;
    setVaultCoins(nextCoins);
    const nextOwned = [...ownedShopItems, id];
    setOwnedShopItems(nextOwned);
    store.set("rr-owned-shop", JSON.stringify(nextOwned));
    sfx("unlock");
  };

  useEffect(() => {
    store.set("rr-orientation", orientation);
    try {
      const o = window.screen?.orientation as unknown as { lock?: (m: string) => Promise<void>; unlock?: () => void };
      if (orientation === "landscape") o?.lock?.("landscape")?.catch(() => {});
      else if (orientation === "portrait") o?.lock?.("portrait")?.catch(() => {});
      else o?.unlock?.();
    } catch { /* unsupported */ }
  }, [orientation]);

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
    <label className="toggle"><input type="checkbox" checked={quality.lowFx} onChange={(e) => setQuality({ lowFx: e.target.checked })} /><span>{inPause ? "Low FX mode" : "Low FX mode for older phones"}</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.reduced} onChange={(e) => setQuality({ reduced: e.target.checked })} /><span>Calm FX</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.speedlines} onChange={(e) => setQuality({ speedlines: e.target.checked })} /><span>Speed lines</span></label>
    <label className="toggle"><input type="checkbox" checked={quality.contrast} onChange={(e) => { setQuality({ contrast: e.target.checked }); sfx("click"); }} /><span>High-contrast danger cue</span></label>
    <div className="slider-row"><span>SCREEN SHAKE</span><input type="range" min={0} max={1.5} step={.05} value={quality.shake} onChange={(e) => setQuality({ shake: Number(e.target.value) })} /><b>{quality.shake === 0 ? "OFF" : Math.round(quality.shake * 100) + "%"}</b></div>
    <div className="opt-sect">SOUND</div>
    <div className="slider-row"><span>MASTER</span><input type="range" min={0} max={1} step={.02} value={vols.master} onChange={(e) => setVols({ master: Number(e.target.value) })} /><b>{Math.round(vols.master * 100)}</b></div>
    <div className="slider-row"><span>MUSIC</span><input type="range" min={0} max={1} step={.02} value={vols.music} onChange={(e) => setVols({ music: Number(e.target.value) })} /><b>{Math.round(vols.music * 100)}</b></div>
    <div className="slider-row"><span>SFX</span><input type="range" min={0} max={1} step={.02} value={vols.sfx} onChange={(e) => setVols({ sfx: Number(e.target.value) })} /><b>{Math.round(vols.sfx * 100)}</b></div>
    <div className="opt-sect">ART STYLE</div>
    <div className="style-row">
      {STYLES.map((st) => <button key={st.id} data-style={st.id} className={\`style-btn\${quality.style === st.id ? " on" : ""}\`} onClick={() => { setQuality({ style: st.id }); sfx("click"); }} title={st.blurb}>
        <i style={{ background: \`linear-gradient(135deg, \${st.swatch[0]} 0 40%, \${st.swatch[1]} 40% 72%, \${st.swatch[2]} 72% 100%)\` }} />
        <span>{st.name}</span>
      </button>)}
    </div>
    <p className="opt-hint">{STYLES.find((x) => x.id === quality.style)?.blurb}</p>
    <label className="toggle"><input type="checkbox" checked={quality.dressing} onChange={(e) => { setQuality({ dressing: e.target.checked }); sfx("click"); }} /><span>Set dressing on the stages</span></label>
    <div className="opt-sect">CLEAN SCREEN</div>
    <div className="look-row text-row">
      <span>WORDS</span>
      {(["all", "quiet", "none"] as const).map((id) => <button key={id} data-text={id} className={quality.text === id ? "on" : ""} title={TEXT_HINT[id]} onClick={() => { setQuality({ text: id }); sfx("click"); }}>{TEXT_NAME[id]}</button>)}
    </div>
    <div className="look-row hud-row">
      <span>HUD</span>
      {(["full", "minimal", "off"] as const).map((id) => <button key={id} data-hud={id} className={quality.hud === id ? "on" : ""} title={HUD_HINT[id]} onClick={() => { setQuality({ hud: id }); sfx("click"); }}>{HUD_NAME[id]}</button>)}
    </div>
    <div className="opt-sect">THE MAP</div>
    <div className="look-row map-row">
      <span>MAP</span>
      {(Object.keys(MAPS) as MapId[]).map((id) => <button key={id} className={quality.world === id ? "on" : ""} onClick={() => { setQuality({ world: id }); sfx("click"); }} title={MAPS[id].blurb}>{MAPS[id].name} · {MAPS[id].label}</button>)}
    </div>
    <div className="look-row"><span>GRADED</span>{(["house", "sepia", "toons", "midnight"] as const).map((pal) => <button key={pal} className={quality.palette === pal ? "on" : ""} onClick={() => { setQuality({ palette: pal }); sfx("click"); }}>{pal.toUpperCase()}</button>)}</div>
    <div className="pad-row"><small>CONTROLLER</small><b className={padOn ? "on" : ""}>{padOn ? "CONNECTED" : "NOT DETECTED"}</b></div>
    <div className="opt-btns">
      <button className="text-btn" onClick={() => { toggleFullscreen(); sfx("click"); }}>{isFs ? "EXIT FULLSCREEN" : "FULLSCREEN"}</button>
      <button className="text-btn" onClick={() => { setBest(0); store.set("rubberRequiemBest", "0"); setModeBest({}); modeBestRef.current = {}; store.set(MODE_BEST_KEY, "{}"); setDailyBest(0); sfx("click"); }}>RESET SCORES</button>
    </div>
  </>;
  const [best, setBest] = useState(() => Number(store.get("rubberRequiemBest") || 0));
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
  const [postOk, setPostOk] = useState(true);
  const crashed = useRef<string | null>(null);
  const [crashMsg, setCrashMsg] = useState<string | null>(null);
  const [quality, setQualityState] = useState<Quality>(loadQuality);
  const qualityRef = useRef(quality);
  const setQuality = (q: Partial<Quality>) => { const n = { ...qualityRef.current, ...q }; qualityRef.current = n; setQualityState(n); store.set(QUALITY_KEY, JSON.stringify(n)); };
  const [vols, setVolsState] = useState<Vols>(loadVols);
  const setVols = (v: Partial<Vols>) => { const n = { ...vols, ...v }; setVolsState(n); store.set(VOL_KEY, JSON.stringify(n)); setVolumes(n); };
  useEffect(() => { setVolumes(vols); }, []);
  const [modeBest, setModeBest] = useState<Partial<Record<Mode, number>>>(() => { try { const r = JSON.parse(store.get(MODE_BEST_KEY) || "{}"); return r && typeof r === "object" ? r : {}; } catch { return {}; } });
  const modeBestRef = useRef(modeBest);
  const [isFs, setIsFs] = useState(false);
  const toggleFullscreen = () => { try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.(); else void document.exitFullscreen?.(); } catch { /* refused */ } };
  const [padOn, setPadOn] = useState(false);
  const [glLost, setGlLost] = useState(false);
  const padRef = useRef(false);
  useEffect(() => { const on = () => setIsFs(!!document.fullscreenElement); document.addEventListener("fullscreenchange", on); return () => document.removeEventListener("fullscreenchange", on); }, []);

  useEffect(() => { input.current.autoFire = autoFire; }, [autoFire]);
  useEffect(() => { setAudioMuted(muted); }, [muted]);
  useEffect(() => {
    if (!DEBUG) return;
    const w = window as unknown as { __rr_game?: () => GameState | null; __rr_input?: () => Input };
    w.__rr_game = () => game.current;
    w.__rr_input = () => input.current;
    return () => { delete w.__rr_game; delete w.__rr_input; };
  }, []);

  useEffect(() => { const wake = () => { unlock(); preload(); if (phaseRef.current === "menu") playMusic("menu"); window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); }; window.addEventListener("pointerdown", wake); window.addEventListener("keydown", wake); return () => { window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); }; }, []);

  const persistUnlocks = useCallback((list: WeaponKey[]) => { const merged = Array.from(new Set([...loadUnlocks(), ...list])); store.set(UNLOCK_KEY, JSON.stringify(merged)); setUnlocks(merged); }, []);

  const startRun = useCallback((opts?: { daily?: boolean; mode?: Mode }) => {
    unlock(); const shell = shellRef.current!;
    const daily = !!opts?.daily;
    const chosenMode = opts?.mode ?? UI_MODES[modeIdx].id ?? mode;
    setMode(chosenMode);
    game.current = createState(shell.clientWidth, shell.clientHeight, loadout, charm, unlocks, character, daily ? dailySeed() : undefined, chosenMode, undefined, undefined, qualityRef.current.world);
    game.current.player.skin = skins[character] ?? "";
    setNewAchv([]); setShopView(false); setChoices([]); releaseAll();
    bossMusic.current = false; setPhase("cutscene"); playMusic("menu"); sfx("click");
  }, [loadout, charm, unlocks, character, mode, modeIdx, skins, setPhase]);

  useEffect(() => {
    if (phase !== "cutscene") return;
    const timer = window.setTimeout(() => { setPhase("playing"); playMusic("play"); }, 4200);
    return () => window.clearTimeout(timer);
  }, [phase, setPhase]);

  useEffect(() => {
    const press = (a: ActName | null, code: string) => {
      const inp = input.current, ph = phaseRef.current;
      if (a === "pause") { if (ph === "playing") setPhase("paused"); else if (ph === "paused") setPhase("playing"); return; }
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
      if (bindingRef.current) return;
      const a = actionFor(e.code);
      const onControl = (() => { const el = document.activeElement; return !!el && (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA"); })();
      if (e.code === "Tab" && !onControl) e.preventDefault();
      if (!keys.current[e.code]) press(a, e.code);
      keys.current[e.code] = true;
    };
    const up = (e: KeyboardEvent) => {
      if (bindingRef.current) {
        const actName = bindingRef.current;
        bindingRef.current = null;
        setBinding(null);
        if (e.code === "Escape") return;
        const current = { ...keysMap.current };
        for (const k of Object.keys(current) as ActName[]) current[k] = current[k].filter((c) => c !== e.code);
        current[actName] = [e.code, ...(current[actName] || []).filter((c) => c !== e.code)].slice(0, 3);
        keysMap.current = current;
        store.set(KEYS_KEY, JSON.stringify(current));
        setKeyRev((r) => r + 1);
        sfx("click");
        return;
      }
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [setPhase]);

  const releaseAll = useCallback(() => {
    keys.current = {};
    joy.current = { x: 0, y: 0, id: -1 };
    aimJoy.current = { x: 0, y: 0, id: -1, active: false };
    mouse.current.down = false;
    input.current = { mx: 0, my: 0, aim: null, fire: false, dash: false, parry: false, ex: false, superMove: false, autoFire, swap: false, interact: false };
    setJoyPos({ x: 0, y: 0 });
    setAimPos({ x: 0, y: 0, on: false });
    resetPadEdges();
  }, [autoFire]);

  useEffect(() => {
    const lose = () => { releaseAll(); setGlLost(true); };
    const onVis = () => { if (document.hidden) { releaseAll(); if (phaseRef.current === "playing") setPhase("paused"); } };
    window.addEventListener("blur", lose);
    document.addEventListener("visibilitychange", onVis);
    return () => { window.removeEventListener("blur", lose); document.removeEventListener("visibilitychange", onVis); };
  }, [releaseAll, setPhase]);

  useEffect(() => {
    const canvas = canvasRef.current!, shell = shellRef.current!;
    const scene = document.createElement("canvas");
    const sctx = scene.getContext("2d", { alpha: false, desynchronized: true })!;
    const direct = canvas.getContext("2d");
    let post: PostFX;
    try { post = new PostFX(canvas); }
    catch { post = { ok: false, draw: () => {}, destroy: () => {} } as unknown as PostFX; setPostOk(false); }
    const onLost = (e: Event) => { e.preventDefault(); setPostOk(false); setGlLost(true); };
    const onRest = () => { setGlLost(false); setPostOk(true); };
    canvas.addEventListener("webglcontextlost", onLost as EventListener);
    canvas.addEventListener("webglcontextrestored", onRest);
    let raf = 0, last = performance.now(), acc = 0, hudClock = 0, fps = 60, hurtGlow = 0;
    const ro = new ResizeObserver(() => {
      const w = Math.max(320, shell.clientWidth), h = Math.max(180, shell.clientHeight);
      canvas.width = w; canvas.height = h; scene.width = w; scene.height = h;
      if (game.current) { game.current.viewW = w; game.current.viewH = h; }
    });
    ro.observe(shell);
    const tick = (now: number) => {
      const dt = Math.min(.1, (now - last) / 1000); last = now;
      fps = fps * .9 + (1 / Math.max(.001, dt)) * .1;
      const w = scene.width, h = scene.height;
      const g = game.current;
      if (!g) {
        if (direct) direct.clearRect(0, 0, w, h);
        return;
      }
      const ph = phaseRef.current;
      const q0 = qualityRef.current;
      setFxOpts({ contrast: q0.contrast, speedlines: q0.speedlines, dressing: q0.dressing, text: q0.text, style: q0.style });
      setPostEnabled(q0.shaders);
      {
        const padNow = readPad();
        if (padNow.present !== padRef.current) { padRef.current = padNow.present; setPadOn(padNow.present); }
        padHeld.current = padNow;
        if (padNow.pause && ph === "playing") setPhase("paused");
        const inp = input.current;
        if (padNow.dash) inp.dash = true;
        if (padNow.parry) inp.parry = true;
        if (padNow.ex) inp.ex = true;
        if (padNow.sup) inp.superMove = true;
        if (padNow.swap) inp.swap = true;
        if (padNow.interact) {
          if (ph === "playing" && g.shopOpen) setShopView(true);
          inp.interact = true;
        }
        let kx = 0, ky = 0;
        if (held("left")) kx -= 1; if (held("right")) kx += 1; if (held("up")) ky -= 1; if (held("down")) ky += 1;
        if (kx !== 0 && ky !== 0) { kx *= .7071; ky *= .7071; }
        if (joy.current.id >= 0) { kx = joy.current.x; ky = joy.current.y; }
        if (padNow.present && (Math.abs(padNow.mx) > 0.05 || Math.abs(padNow.my) > 0.05)) { kx = padNow.mx; ky = padNow.my; }
        inp.mx = kx; inp.my = ky;
        if (aimJoy.current.active) {
          inp.aim = { x: g.player.x + aimJoy.current.x * 100, y: g.player.y + aimJoy.current.y * 100 };
          inp.fire = Math.hypot(aimJoy.current.x, aimJoy.current.y) > 0.3;
        } else if (padNow.present && (Math.abs(padNow.ax) > 0.2 || Math.abs(padNow.ay) > 0.2)) {
          inp.aim = { x: g.player.x + padNow.ax * 100, y: g.player.y + padNow.ay * 100 };
          inp.fire = true;
        } else {
          inp.aim = mouse.current.active ? { x: mouse.current.x, y: mouse.current.y } : null;
        }
        inp.fire = held("fire") || mouse.current.down || aimJoy.current.active || padNow.fire;
        acc += dt; let steps = 0;
        while (acc >= STEP && steps < 6) { update(g, inp, STEP, w, h); acc -= STEP; steps++; }
        if (steps === 6) acc = 0;
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
      }
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
        crashed.current = err instanceof Error ? \`\${err.message}\` : String(err);
        setCrashMsg(crashed.current); releaseAll();
        if (phaseRef.current === "playing") setPhase("paused");
      } }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [setPhase, persistUnlocks, releaseAll]);

  useEffect(() => {
    const modal = phase === "paused" || phase === "upgrade" || phase === "gameover";
    if (modal) document.querySelector<HTMLElement>("[data-modal]")?.focus({ preventScroll: true });
    else if (phase === "playing") { const el = document.activeElement; if (el instanceof HTMLElement) el.blur(); }
  }, [phase, crashMsg, glLost]);

  const recoverFromCrash = () => { crashed.current = null; setCrashMsg(null); releaseAll(); sfx("click"); if (game.current) game.current.over = false; setPhase("playing"); };
  const choose = (id: string) => { if (game.current) applyUpgrade(game.current, id); sfx("levelup"); setPhase("playing"); };
  const buyShop = (idx: number) => { if (game.current && buyShopItem(game.current, idx)) { sfx("coin"); } };
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
  const aimStart = (e: React.PointerEvent<HTMLDivElement>) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); aimJoy.current = { x: 0, y: 0, id: e.pointerId, active: true }; setAimPos({ x: 0, y: 0, on: true }); };
  const aimMove = (e: React.PointerEvent<HTMLDivElement>) => { if (aimJoy.current.id !== e.pointerId) return; const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2), d = Math.max(1, Math.hypot(x, y)), max = r.width * .34, k = Math.min(d, max) / max; aimJoy.current.x = k * x / d; aimJoy.current.y = k * y / d; setAimPos({ x: aimJoy.current.x * 28, y: aimJoy.current.y * 28, on: true }); };
  const aimEnd = () => { aimJoy.current = { x: 0, y: 0, id: -1, active: false }; setAimPos({ x: 0, y: 0, on: false }); };
  const act = (key: "dash" | "parry" | "ex" | "superMove" | "swap") => (e: React.PointerEvent) => { e.preventDefault(); input.current[key] = true; };

  const cards = Math.floor(hud.cards);

  const filteredWeapons = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = WEAPON_KEYS.map((k) => ({ key: k, def: WEAPONS[k] }));
    if (!q) return list;
    return list.filter(({ key, def }) => def.name.toLowerCase().includes(q) || key.toLowerCase().includes(q));
  }, [query]);

  const filteredFoes = useMemo(() => {
    const q = foeQuery.trim().toLowerCase();
    const list = ENEMY_KEYS.map((k) => ({ key: k, def: ENEMIES[k] }));
    if (!q) return list;
    return list.filter(({ def }) => def.name.toLowerCase().includes(q) || def.note.toLowerCase().includes(q));
  }, [foeQuery]);

  return <main className={\`game-page orientation-\${orientation}\${quality.reduced ? " reduced-motion" : ""}\`}>
    <div className="grain" aria-hidden="true" />
    <section ref={shellRef} className="game-shell" data-art={artStyle} data-words={words} data-hud={hudLevel} aria-label="Rubber Requiem">
      <canvas ref={canvasRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => { mouse.current.down = false; }} onContextMenu={(e) => e.preventDefault()} />

      {/* ── IN-GAME OVERLAYS ── */}
      {phase !== "menu" && <>
        {phase === "playing" && hud.mode !== "endless" && <div className={\`mode-badge\${hud.mode === "beat" && hud.onBeat ? " in-beat" : ""}\${hud.mode === "bulletdance" && hud.dance.streak >= 6 ? " in-dance" : ""}\`}>
          {hud.mode === "bulletdance"
            ? \`BULLET DANCE · \${hud.dance.streak} IN A ROW\${hud.dance.heat > .05 ? \` · ×\${(1 + hud.dance.heat * .9).toFixed(2)} DMG\` : ""}\`
            : hud.mode === "glass"
              ? "GLASS CANNON · ONE HIT KILLS YOU"
              : hud.mode === "beat"
                ? hud.onBeat ? "♪ NOW! ×1.75" : "♪ WAIT FOR THE PULSE"
                : hud.mode === "blackout"
                  ? \`BLACKOUT · LIGHT \${hud.lightR}\`
                  : ""}
        </div>}
        <div className={\`hud\${hud.health / hud.maxHealth < .28 ? " danger" : ""}\`}>
          <div className="hud-left">
            <div className="portrait"><span>{character.slice(0, 1).toUpperCase()}</span></div>
            <div className="health-wrap">
              <div className="health-label">GUMPTION <b>{Math.ceil(hud.health)}/{hud.maxHealth}</b></div>
              <div className="health-bar" role="progressbar" aria-label="Gumption" aria-valuemin={0} aria-valuemax={hud.maxHealth} aria-valuenow={Math.ceil(hud.health)}><i style={{ width: \`\${hud.health / hud.maxHealth * 100}%\` }} /></div>
              <div className="cards" title="Super meter">{[0, 1, 2, 3, 4].map((i) => <i key={i} className={i < cards ? "full" : ""} style={i === cards ? { ["--fill" as string]: \`\${(hud.cards - cards) * 100}%\` } : undefined}><b>{i + 1}</b></i>)}</div>
              <div className="buffs">{hud.shield > 0 && <span className="buff shield"><Icon n="umbrella" />×{hud.shield}</span>}{hud.rapid > 0 && <span className="buff rapid">HOT HANDS {hud.rapid.toFixed(0)}s</span>}{hud.star > 0 && <span className="buff star"><Icon n="star" />STAR {hud.star.toFixed(0)}s</span>}{hud.clock > 0 && <span className="buff clock"><Icon n="clock" />TIME OUT {hud.clock.toFixed(0)}s</span>}{hud.wind > 0 && <span className="buff wind"><Icon n="heart" />SPARE ×{hud.wind}</span>}</div>
            </div>
          </div>
          <div className="score">
            <small>SCORE</small><i className="score-num">{hud.score.toLocaleString()}</i>
            <span className="biome-sub" title={\`\${hud.biome} · level \${hud.level}\`}><small className="lv">LV. {hud.level}{hud.biome ? " ·" : ""}</small> {hud.biome}</span>
            <div className="coin-badge"><Icon n="coin" label="coins" />{hud.coins}<span>¢</span></div>
          </div>
          <div className="hud-right">
            <button className="round-btn" onClick={() => { if (phase === "playing") { releaseAll(); setPhase("paused"); } else setPhase("playing"); }} aria-label={phase === "playing" ? "Pause" : "Resume"} aria-keyshortcuts="Escape" title={phase === "playing" ? "Pause (Esc)" : "Resume (Esc)"}><Icon n={phase === "playing" ? "pause" : "play"} /></button>
            {(DEBUG || hud.fps < 50) && <small className="fps">{hud.fps} FPS</small>}
            {hud.shopOpen && hud.shopItems.length > 0 && (
              <button className="shop-hud-btn" onClick={() => setShopView(true)} aria-label="Open Porbo's shop">
                <span><Icon n="cart" />PORBO'S SHOP · {keysMap.current.interact.map(prettyKey).join("/")}</span>
              </button>
            )}
          </div>
          {hud.combo > 2 && <div className="combo" key={hud.combo}>{hud.combo} HIT!<small>HOT STREAK</small></div>}
          {hud.boss && (
            <div className="boss-bar" role="progressbar" aria-label={hud.boss.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hud.boss.hp * 100)}>
              <span>{hud.boss.name.toUpperCase()} · PHASE {hud.boss.phase}/3</span>
              <div><i style={{ width: \`\${hud.boss.hp * 100}%\` }} /></div>
            </div>
          )}
          {hud.modifier && <div className={\`modifier \${hud.modifier.id}\`}><b>{hud.modifier.name}</b><i style={{ width: \`\${Math.min(100, hud.modifier.time / 12 * 100)}%\` }} /></div>}
        </div>

        {shopView && (
          <div className="overlay center-overlay shop-overlay">
            <div className="shop-panel">
              <span className="kicker">PORBO'S TRAVELING EMPORIUM</span>
              <h2>TRADE YER SHINY COINS!</h2>
              <p className="shop-quote">"Fine wares for fine chaps! You got the coin, I got the heat!"</p>
              <div className="shop-grid">
                {hud.shopItems.map((item, idx) => (
                  <div key={item.id} className={\`shop-card \${item.bought ? "bought" : ""}\`}>
                    <div className="shop-icon"><Glyph d={item.icon} /></div>
                    <b>{item.name}</b>
                    <small>{item.desc}</small>
                    <button
                      className="shop-buy-btn"
                      disabled={item.bought || hud.coins < item.price}
                      onClick={() => buyShop(idx)}
                    >
                      {item.bought ? "SOLD OUT" : \`BUY · \${item.price}¢\`}
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
          <em className="dash-ind" style={{ ["--cd" as string]: \`\${(1 - hud.dash) * 100}%\` }}>DASH</em>
          {hud.weapon === "kettle" && <em className="charge-ind"><i style={{ width: \`\${hud.charge * 100}%\` }} /></em>}
        </button>}
      </>}

      {phase === "playing" && touch && <div className="mobile-controls">
        <div className="joystick" onPointerDown={joyStart} onPointerMove={joyMove} onPointerUp={joyEnd} onPointerCancel={joyEnd}><i style={{ transform: \`translate(\${joyPos.x}px, \${joyPos.y}px)\` }} /></div>
        <div className="action-cluster">
          <div className={\`aim-stick\${aimPos.on ? " on" : ""}\`} onPointerDown={aimStart} onPointerMove={aimMove} onPointerUp={aimEnd} onPointerCancel={aimEnd}>
            <b>AIM · FIRE</b>
            <i style={{ transform: \`translate(\${aimPos.x}px, \${aimPos.y}px)\` }} />
          </div>
          <button className={\`act dash\${hud.dash > 0 ? " cooling" : ""}\`} onPointerDown={act("dash")}>DASH<i className="cd" style={{ width: \`\${Math.round((1 - hud.dash) * 100)}%\` }} /></button>
          <button className="act parry" onPointerDown={act("parry")}>PARRY</button>
          <button className={\`act ex \${cards >= 1 ? "ready" : ""}\`} onPointerDown={act("ex")}>EX</button>
          <button className={\`act auto-toggle \${autoFire ? "on" : ""}\`} onPointerDown={(e) => { e.preventDefault(); setAutoFire(!autoFire); sfx("click"); }}>{autoFire ? "AUTO" : "FREE"}</button>
          {cards >= 5 && <button className="act super" onPointerDown={act("superMove")}>SUPER!</button>}
        </div>
      </div>}

      {/* ── NEW BUMBI MENU UI ── */}
      {phase === "menu" && (
        <div className="menu-container">
          <div className="strip">
            <nav className="tab-strip" aria-label="Sections">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={tab === t.id ? "tab active" : "tab"}
                  onClick={() => goTab(t.id)}
                  aria-current={tab === t.id ? "page" : undefined}
                >
                  {t.label}
                  {typeof t.count === "number" && <span className="tab-count">{t.count}</span>}
                </button>
              ))}
            </nav>
            <div className="strip-actions">
              <button
                className="orient-btn"
                type="button"
                onClick={() => setOrientation(cycle(ORIENTATIONS, orientation))}
                title="Switch display orientation: auto, portrait, or landscape"
                aria-label={\`Display orientation: \${ORIENTATION_LABEL[orientation]}. Activate to switch.\`}
              >
                <span aria-hidden="true">⇄</span>
                {ORIENTATION_LABEL[orientation]}
              </button>
              <span className="coins-chip" title="House coins">
                ¢ {vaultCoins}
              </span>
            </div>
          </div>

          <div className="screen">
            {/* ── HOME SCREEN ── */}
            {tab === "home" && (
              <section className="home" aria-label="Main menu">
                <header className="hero">
                  <div className="brand">
                    <h1>
                      <img className="brand-logo" src={logoBumbi} alt="Bumbi game logo" width={640} height={360} />
                      <span className="brand-sub">A NEVER-ENDING NIGHTMARE IN GLORIOUS INK</span>
                    </h1>
                  </div>

                  <div className="hero-center">
                    <div className="stats" role="group" aria-label="House records">
                      <div className="stat">
                        <small>BEST SCORE</small>
                        <b>{best.toLocaleString()}</b>
                      </div>
                      <div className="stat">
                        <small>DAILY RECORD</small>
                        <b>{dailyBest.toLocaleString()}</b>
                      </div>
                      <div className="stat">
                        <small>ARMORY</small>
                        <b>{unlocks.length}/{WEAPON_KEYS.length}</b>
                      </div>
                    </div>
                    <div className="plaque" role="note">
                      <span aria-hidden="true">♛</span> SURVIVE • SCORE • REPEAT <span aria-hidden="true">♛</span>
                    </div>
                  </div>

                  <div className="hero-actions">
                    <button className="icon-btn" type="button" onClick={() => goTab("board")} title="Leaderboard" aria-label="Leaderboard">
                      ★
                    </button>
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => { setMuted(!muted); unlock(); }}
                      title={!muted ? "Mute sound" : "Unmute sound"}
                      aria-label={!muted ? "Mute sound" : "Unmute sound"}
                      aria-pressed={!muted}
                    >
                      {!muted ? "♪" : "×"}
                    </button>
                    <button className="icon-btn" type="button" onClick={() => goTab("settings")} title="Settings" aria-label="Settings">
                      ⚙
                    </button>
                  </div>
                </header>

                <div className="home-main">
                  <aside className="mascot-col" aria-label="House mascot">
                    <img className="mascot-img" src="/mascot-cutout.jpg" alt="Milo, the rubber-hose house imp" />
                    <p className="stanza flavor">
                      Outrun the ink.
                      <br />
                      Outgun the dark.
                      <br />
                      Parry everything pink.
                    </p>
                  </aside>

                  <div className="mode-carousel">
                    <div className="mode-list" ref={modeListRef} role="group" aria-label="Game modes">
                      {UI_MODES.map((m, i) => (
                        <article
                          key={m.title}
                          className={i === modeIdx ? "mode-card selected" : "mode-card"}
                          onClick={() => scrollToMode(i)}
                        >
                          <div className={\`mode-art \${m.art}\`} role="img" aria-label={\`\${m.title} artwork\`} />
                          <div className="mode-body">
                            <span className="mode-medal" aria-hidden="true">
                              {m.icon}
                            </span>
                            <h2>{m.title}</h2>
                            <span className="mode-desc">{m.desc}</span>
                            <button
                              className={i === modeIdx ? "btn-play" : "btn-play dim"}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                startRun({ mode: m.id });
                              }}
                            >
                              {i === modeIdx ? "PLAY ▶" : "SELECT"}
                            </button>
                            <div className="mode-foot">
                              {modeBest[m.id] ? \`★ BEST \${modeBest[m.id]!.toLocaleString()}\` : m.foot}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    <div className="mode-controls">
                      <button
                        className="btn-ghost mode-arrow"
                        type="button"
                        onClick={() => scrollToMode((modeIdx + UI_MODES.length - 1) % UI_MODES.length)}
                        aria-label="Previous mode"
                      >
                        ◀ PREV
                      </button>
                      <div className="mode-pos-wrap">
                        <div className="mode-dots" role="group" aria-label="Choose mode">
                          {UI_MODES.map((m, i) => (
                            <button
                              key={m.title}
                              type="button"
                              className={i === modeIdx ? "mode-dot active" : "mode-dot"}
                              onClick={() => scrollToMode(i)}
                              aria-label={\`Go to \${m.title}\`}
                              aria-pressed={i === modeIdx}
                            />
                          ))}
                        </div>
                        <span className="mode-pos" aria-live="polite">
                          {String(modeIdx + 1).padStart(2, "0")} / {String(UI_MODES.length).padStart(2, "0")}
                        </span>
                      </div>
                      <button
                        className="btn-ghost mode-arrow"
                        type="button"
                        onClick={() => scrollToMode((modeIdx + 1) % UI_MODES.length)}
                        aria-label="Next mode"
                      >
                        NEXT ▶
                      </button>
                    </div>
                  </div>

                  <aside className="sign-col" aria-label="House notice">
                    <span className="moon" aria-hidden="true">☾</span>
                    <div className="sign-board">
                      <p>INK NEVER FORGETS.</p>
                    </div>
                  </aside>
                </div>

                <div className="home-foot">
                  <div className="chip-row" role="group" aria-label="Quick settings">
                    <button type="button" className="chip" onClick={() => { setWords(cycle(WORDS_OPTIONS, words)); sfx("click"); }} title="Cycle words mode">
                      WORDS <b>{words}</b>
                    </button>
                    <button type="button" className="chip" onClick={() => { setHudLevel(cycle(HUD_OPTIONS, hudLevel)); sfx("click"); }} title="Cycle HUD mode">
                      HUD <b>{hudLevel}</b>
                    </button>
                    <button type="button" className="chip" onClick={() => { setArtStyle(cycle(ART_OPTIONS, artStyle)); sfx("click"); }} title="Cycle art treatment">
                      ART <b>{artStyle}</b>
                    </button>
                    <button type="button" className="chip" onClick={() => { setMuted(!muted); unlock(); }} title="Toggle sound">
                      SOUND <b>{!muted ? "ON" : "OFF"}</b>
                    </button>
                  </div>
                  <p className="quote flavor flavor-long">“In ink we run, in pink we live.”</p>
                  <button className="how-btn" type="button" onClick={() => goTab("how")}>
                    <span aria-hidden="true">▤</span> HOW TO PLAY <span className="how-q" aria-hidden="true">?</span>
                  </button>
                </div>
              </section>
            )}

            {/* ── CAST TAB ── */}
            {tab === "cast" && (
              <section aria-label="Cast">
                <SectionHead
                  eyebrow="BUMBI"
                  title="THE CAST"
                  sub="Every performer has a part to play. Choose who takes the stage."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="cast-grid">
                  {CHARACTER_KEYS.map((k) => {
                    const c = CHARACTERS[k];
                    const isSelected = character === k;
                    return (
                      <article key={k} className={isSelected ? "cast-card on-stage" : "cast-card"}>
                        <div className="cast-medal" aria-hidden="true">
                          {k.slice(0, 1).toUpperCase()}
                        </div>
                        <b className="cast-name">{c.name.toUpperCase()}</b>
                        <small className="cast-role">{c.title.toUpperCase()} · {c.trait}</small>
                        <div className="cast-stats">
                          <div>
                            <small>SPEED</small>
                            <Pips value={c.pace} max={5} label={\`\${c.name} speed\`} />
                          </div>
                          <div>
                            <small>POWER</small>
                            <Pips value={c.power} max={5} label={\`\${c.name} power\`} />
                          </div>
                          <div>
                            <small>LUCK / GRIT</small>
                            <Pips value={c.grit} max={5} label={\`\${c.name} grit\`} />
                          </div>
                        </div>
                        <p className="flavor">{c.desc}</p>
                        <button
                          className={isSelected ? "btn-play" : "btn-ghost"}
                          type="button"
                          onClick={() => { setCharacter(k); sfx("click"); }}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? "ON STAGE ★" : "TAKE STAGE"}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <div style={{ marginTop: 24 }}>
                  <div className="opts-head">
                    <span>WARDROBE · {CHARACTERS[character].name.toUpperCase()}</span>
                    <small>the outfit follows them onto the reel</small>
                  </div>
                  <div className="style-row">
                    {SKINS[character].map((sk) => {
                      const on = (skins[character] ?? "house") === sk.id;
                      return (
                        <button
                          key={sk.id}
                          className={\`style-btn\${on ? " on" : ""}\`}
                          onClick={() => { pickSkin(character, sk.id); sfx("click"); }}
                        >
                          <i style={{ background: \`linear-gradient(135deg, \${sk.head} 0 42%, \${sk.accent} 42% 72%, \${sk.trim} 72%)\` }} />
                          <span>{sk.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── ARMORY TAB ── */}
            {tab === "arms" && (
              <section aria-label="Armory">
                <SectionHead
                  eyebrow="BUMBI"
                  title="THE ARMORY"
                  sub="Pick your instruments. Click equips Slot A, double-click sets Slot B."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="armory-grid">
                  {filteredWeapons.map(({ key: k, def }) => {
                    const locked = !unlocks.includes(k);
                    const isEquipped = loadout[0] === k;
                    const isSlotB = loadout[1] === k;
                    const state = locked ? "locked" : isEquipped ? "equipped" : isSlotB ? "slot-b" : "available";
                    return (
                      <button
                        key={k}
                        type="button"
                        className={\`arm-card \${state}\`}
                        disabled={locked}
                        onClick={() => {
                          if (locked) { sfx("deny"); return; }
                          sfx("click");
                          setLoadout((l) => {
                            const n: [WeaponKey, WeaponKey] = [...l];
                            if (n[1] === k) { n[1] = n[0]; n[0] = k; }
                            else { n[0] = k; }
                            return n;
                          });
                        }}
                        onDoubleClick={() => {
                          if (locked) return;
                          sfx("click");
                          setLoadout((l) => [l[0], k]);
                        }}
                        title={locked ? \`\${def.name} — locked\` : \`\${def.name} — click for Slot A, double-click for Slot B\`}
                        aria-label={\`\${def.name}, \${state}\`}
                      >
                        <span className="arm-glyph" aria-hidden="true">
                          <Glyph d={def.icon} />
                        </span>
                        <span className="arm-name">{locked ? "LOCKED" : def.name.toUpperCase()}</span>
                        {state === "equipped" && <span className="arm-state">SLOT A</span>}
                        {state === "slot-b" && <span className="arm-state">SLOT B</span>}
                        {locked && (
                          <span className="padlock" aria-hidden="true">
                            <span className="padlock-shackle" />
                            <span className="padlock-body" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {filteredWeapons.length === 0 && <p className="empty-note">No instruments match “{query}”. The house keeps its secrets.</p>}
                <footer className="armory-foot">
                  <ul className="legend" aria-label="Legend">
                    <li><span className="swatch equipped" aria-hidden="true" /> SLOT A</li>
                    <li><span className="swatch slot-b" aria-hidden="true" /> SLOT B</li>
                    <li><span className="swatch available" aria-hidden="true" /> AVAILABLE</li>
                    <li><span className="swatch locked" aria-hidden="true" /> LOCKED</li>
                  </ul>
                  <div className="search-wrap">
                    <span className="search-icon" aria-hidden="true">⌕</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search armory…"
                      aria-label="Search armory"
                    />
                    <span className="search-count" aria-live="polite">
                      {filteredWeapons.length}/{WEAPON_KEYS.length}
                    </span>
                  </div>
                </footer>
              </section>
            )}

            {/* ── CHARMS TAB ── */}
            {tab === "charm" && (
              <section aria-label="Charms">
                <SectionHead
                  eyebrow="BUMBI"
                  title="CHARM DEPARTMENT"
                  sub="Small miracles for difficult rooms. Click to equip your active charm."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="charm-grid">
                  {CHARM_KEYS.map((k) => {
                    const c = CHARMS[k];
                    const active = charm === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        className={active ? "charm-card active" : "charm-card"}
                        onClick={() => { setCharm(k); sfx("click"); }}
                        aria-pressed={active}
                      >
                        <span className="charm-glyph" aria-hidden="true">
                          <Glyph d={c.icon} />
                        </span>
                        <b>{c.name.toUpperCase()}</b>
                        <small>{c.desc}</small>
                        <span className="charm-state">{active ? "CHARMED ★" : "SELECT CHARM"}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── BESTIARY TAB ── */}
            {tab === "foes" && (
              <section aria-label="Bestiary">
                <SectionHead
                  eyebrow="BUMBI"
                  title="BESTIARY"
                  sub="Study the house guests before they arrive."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="search-wrap foe-search">
                  <span className="search-icon" aria-hidden="true">⌕</span>
                  <input
                    type="search"
                    value={foeQuery}
                    onChange={(e) => setFoeQuery(e.target.value)}
                    placeholder="Search the house guests…"
                    aria-label="Search bestiary"
                  />
                  <span className="search-count" aria-live="polite">
                    {filteredFoes.length}/{ENEMY_KEYS.length}
                  </span>
                </div>
                <div className="foe-grid">
                  {filteredFoes.map(({ key: k, def }) => {
                    const threatLevel = Math.min(6, Math.max(1, Math.round(def.hp / 25 + def.speed / 50)));
                    return (
                      <article key={k} className="foe-card">
                        <div className="foe-top">
                          <b>{def.name.toUpperCase()}</b>
                          <Pips value={threatLevel} max={6} label={\`\${def.name} threat level\`} />
                        </div>
                        <small>THREAT LEVEL {threatLevel} / 6</small>
                        <p className="flavor">{def.note}</p>
                      </article>
                    );
                  })}
                </div>
                {filteredFoes.length === 0 && <p className="empty-note">No guest by that name. Lucky you.</p>}
              </section>
            )}

            {/* ── HOW TO PLAY TAB ── */}
            {tab === "how" && (
              <section aria-label="How to play">
                <SectionHead
                  eyebrow="BUMBI"
                  title="THE PLAYBILL"
                  sub="A few notes before the curtain rises."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="guide-wrap">
                  <div className="guide-list">
                    {GUIDE.map(([action, defaultKey]) => (
                      <div key={action} className="guide-row">
                        <b>{action}</b>
                        <span className="keys">{defaultKey}</span>
                      </div>
                    ))}
                  </div>
                  <div className="tips">
                    <b className="tips-head">HOUSE RULES</b>
                    <ol>
                      {TIPS.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </section>
            )}

            {/* ── SHOP TAB ── */}
            {tab === "shop" && (
              <section aria-label="Shop">
                <SectionHead
                  eyebrow="BUMBI"
                  title="PORBO'S TRAVELLING SHOP"
                  sub={\`Fresh stock. Questionable provenance. Purse: ¢ \${vaultCoins}.\`}
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="shop-grid">
                  {SHOP_CATALOG.map((item) => {
                    const has = ownedShopItems.includes(item.id);
                    const afford = vaultCoins >= item.price;
                    return (
                      <article key={item.id} className="shop-card">
                        <span className="shop-glyph" aria-hidden="true">
                          {item.glyph}
                        </span>
                        <b>{item.name}</b>
                        <small className="flavor">{item.desc}</small>
                        <div className="shop-price">¢ {item.price}</div>
                        <button
                          className={has ? "btn-ghost" : "btn-play"}
                          type="button"
                          disabled={has || !afford}
                          onClick={() => buyItem(item.id, item.price)}
                        >
                          {has ? "OWNED ★" : afford ? "BUY" : "TOO RICH"}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── LEADERBOARD TAB ── */}
            {tab === "board" && (
              <section aria-label="Leaderboard">
                <SectionHead
                  eyebrow="BUMBI"
                  title="THE MARQUEE"
                  sub="The names that stayed after closing."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="rr-board-panel">
                  <div className="rr-player-tag-box">
                    <small>YOUR ARCADE TAG</small>
                    {editingTag ? (
                      <div className="rr-tag-display-row">
                        <input
                          type="text"
                          maxLength={16}
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value.toUpperCase())}
                          placeholder="TAG"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPlayerNickname(tagInput);
                            setPlayerTag(tagInput);
                            setEditingTag(false);
                            sfx("click");
                          }}
                        >
                          SAVE
                        </button>
                        <button type="button" onClick={() => { setTagInput(playerTag); setEditingTag(false); }}>
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <div className="rr-tag-display-row">
                        <b>{playerTag}</b>
                        <button type="button" onClick={() => { setTagInput(playerTag); setEditingTag(true); sfx("click"); }}>
                          CHANGE
                        </button>
                      </div>
                    )}
                    <button className="rr-mini-btn" type="button" style={{ marginLeft: "auto" }} onClick={() => refreshScores(boardMode)}>
                      ↻ REFRESH
                    </button>
                  </div>

                  <div className="rr-board-filters">
                    {(["all", "endless", "daily", "glass", "blackout", "bulletdance"] as const).map((m) => (
                      <button
                        key={m}
                        className={\`rr-filter-btn\${boardMode === m ? " on" : ""}\`}
                        type="button"
                        onClick={() => { setBoardMode(m); sfx("click"); }}
                      >
                        {m === "all" ? "GLOBAL TOP" : m === "daily" ? \`DAILY #\${dailySeed()}\` : m.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  {!urlConfigSaved && (
                    <div className="rr-setup-card">
                      <span className="rr-setup-kicker">SUPABASE CLOUD LEADERBOARD</span>
                      <p className="flavor">Connect your Supabase database to enable global real-time rankings:</p>
                      <div className="rr-input-wrap">
                        <label>PROJECT URL</label>
                        <input type="text" placeholder="https://xyz.supabase.co" value={supabaseUrlInput} onChange={(e) => setSupabaseUrlInput(e.target.value)} />
                      </div>
                      <div className="rr-input-wrap">
                        <label>ANON / PUBLIC KEY</label>
                        <input type="text" placeholder="sb_publishable_..." value={supabaseKeyInput} onChange={(e) => setSupabaseKeyInput(e.target.value)} />
                      </div>
                      <button
                        className="rr-connect-btn"
                        type="button"
                        onClick={() => {
                          saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
                          setUrlConfigSaved(true);
                          sfx("unlock");
                          refreshScores(boardMode);
                        }}
                      >
                        CONNECT DATABASE →
                      </button>
                    </div>
                  )}

                  {scoresError && <div className="rr-board-empty" style={{ color: "#ff6659" }}>{scoresError}</div>}
                  {scoresLoading ? (
                    <div className="rr-board-empty">FETCHING ARCHIVE RECORDS…</div>
                  ) : (
                    <ol className="board-list">
                      {scores.length === 0 ? (
                        <li className="board-row">
                          <span className="board-name">No scores posted yet. Complete a run to place your name on the marquee!</span>
                        </li>
                      ) : (
                        scores.map((s, i) => (
                          <li key={s.id || i} className={i < 3 ? \`board-row top-\${i + 1}\` : "board-row"}>
                            <b className="board-rank">{String(i + 1).padStart(2, "0")}</b>
                            <span className="board-name">{s.player_name}</span>
                            <strong className="board-score">{Number(s.score).toLocaleString()}</strong>
                          </li>
                        ))
                      )}
                    </ol>
                  )}
                </div>
              </section>
            )}

            {/* ── VAULT TAB ── */}
            {tab === "vault" && (
              <section aria-label="Vault">
                <SectionHead
                  eyebrow="BUMBI"
                  title="THE VAULT"
                  sub="A record of every night worth remembering."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="vault-stats">
                  <div>
                    <small>TOTAL COINS</small>
                    <b>¢ {vaultCoins.toLocaleString()}</b>
                  </div>
                  <div>
                    <small>LIFETIME COINS</small>
                    <b>¢ {vaultLifetime.toLocaleString()}</b>
                  </div>
                  <div>
                    <small>HIGHEST SCORE</small>
                    <b>{best.toLocaleString()}</b>
                  </div>
                </div>

                <div className="opts-head">
                  <span>TRANSACTION LEDGER</span>
                  <button className="rr-mini-btn" type="button" onClick={() => void refreshVault()}>↻ REFRESH</button>
                </div>
                <div className="rr-vault-history-list">
                  {coinHistory.length === 0 ? (
                    <div className="rr-board-empty">No transaction history yet. Play a run to bank coins!</div>
                  ) : (
                    coinHistory.map((tx, idx) => (
                      <div key={tx.id || idx} className="rr-tx-item">
                        <div className="rr-tx-desc">
                          <b>{tx.description}</b>
                          <small>{tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""} · {tx.source.toUpperCase()}</small>
                        </div>
                        <div className={\`rr-tx-amount \${tx.amount >= 0 ? "pos" : "neg"}\`}>
                          {tx.amount >= 0 ? \`+\${tx.amount}¢\` : \`\${tx.amount}¢\`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {/* ── SETTINGS TAB ── */}
            {tab === "settings" && (
              <section aria-label="Settings">
                <SectionHead
                  eyebrow="BUMBI"
                  title="SHOW SETTINGS"
                  sub="Tune the house to your liking. Everything saves itself."
                  onBack={() => goTab("home")}
                  onPlay={() => startRun()}
                />
                <div className="settings-wrap">
                  <div className="settings-col">
                    <label className="slider-row">
                      <span>MASTER VOLUME <b>{Math.round(vols.master * 100)}</b></span>
                      <input type="range" min={0} max={1} step={0.02} value={vols.master} onChange={(e) => setVols({ master: Number(e.target.value) })} />
                    </label>
                    <label className="slider-row">
                      <span>MUSIC VOLUME <b>{Math.round(vols.music * 100)}</b></span>
                      <input type="range" min={0} max={1} step={0.02} value={vols.music} onChange={(e) => setVols({ music: Number(e.target.value) })} />
                    </label>
                    <label className="slider-row">
                      <span>SFX VOLUME <b>{Math.round(vols.sfx * 100)}</b></span>
                      <input type="range" min={0} max={1} step={0.02} value={vols.sfx} onChange={(e) => setVols({ sfx: Number(e.target.value) })} />
                    </label>
                    <label className="slider-row">
                      <span>SCREEN SHAKE <b>{Math.round(quality.shake * 100)}%</b></span>
                      <input type="range" min={0} max={1.5} step={0.05} value={quality.shake} onChange={(e) => setQuality({ shake: Number(e.target.value) })} />
                    </label>
                  </div>

                  <div className="settings-col">
                    <div className="orient-group" role="group" aria-label="Display orientation">
                      <small className="group-label">DISPLAY ORIENTATION</small>
                      <div className="segmented">
                        {ORIENTATIONS.map((o) => (
                          <button
                            key={o}
                            type="button"
                            className={orientation === o ? "seg active" : "seg"}
                            aria-pressed={orientation === o}
                            onClick={() => setOrientation(o)}
                          >
                            {ORIENTATION_LABEL[o]}
                          </button>
                        ))}
                      </div>
                      <p className="group-hint flavor">
                        {orientation === "landscape"
                          ? "Wide marquee framing. Best on TVs, monitors, and rotated phones."
                          : orientation === "portrait"
                          ? "Tall playbill framing. Best on phones held upright."
                          : "The house follows your screen. Turn your device freely."}
                      </p>
                    </div>
                    <button type="button" className="toggle-row" onClick={toggleFullScreen} aria-pressed={fullScreen}>
                      FULL SCREEN <span>{fullScreen ? "ON" : "OFF"}</span>
                    </button>
                    <button type="button" className="toggle-row" onClick={() => setQuality({ reduced: !quality.reduced })} aria-pressed={quality.reduced}>
                      REDUCED MOTION <span>{quality.reduced ? "ON" : "OFF"}</span>
                    </button>
                    <button type="button" className="toggle-row" onClick={() => { setMuted(!muted); unlock(); }} aria-pressed={!muted}>
                      SOUND <span>{!muted ? "ON" : "OFF"}</span>
                    </button>
                    <button type="button" className="toggle-row" onClick={() => setAutoFire(!autoFire)} aria-pressed={autoFire}>
                      AUTO-FIRE <span>{autoFire ? "ON" : "OFF"}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* SHELL FOOTER */}
          <footer className="shell-foot">
            <span>BUMBI • INK. NIGHT. REPEAT.</span>
            <span>
              DISPLAY <b>{ORIENTATION_LABEL[orientation]}</b> • CAST <b>{CHARACTERS[character].name.toUpperCase()}</b> • CHARM <b>{CHARMS[charm].name.toUpperCase()}</b>
            </span>
          </footer>
        </div>
      )}

      {/* ── MODALS: CRASH, PAUSE, UPGRADE, GAMEOVER ── */}
      {crashMsg && <div className="overlay center-overlay"><div className="letter small-letter crash-letter" data-modal tabIndex={-1} role="alertdialog" aria-modal="true" aria-label="The game stopped">
        <span className="kicker">THE PROJECTIONIST SLIPPED</span>
        <h2>THE SHOW STOPPED</h2>
        <p>Something unexpected happened while the reel was running. Your run is waiting on the pause panel.</p>
        <p className="crash-detail">{crashMsg}</p>
        <button className="play-btn" onClick={recoverFromCrash}><span>CONTINUE THE SHOW</span><i>→</i></button>
        <button className="text-btn" onClick={() => window.location.reload()}>RELOAD THE PAGE</button>
      </div></div>}

      {glLost && !postOk && <div className="overlay center-overlay"><div className="letter small-letter" data-modal tabIndex={-1} role="alertdialog" aria-modal="true" aria-label="Hardware acceleration was lost">
        <span className="kicker">THE PROJECTOR JAMMED</span>
        <h2>NO HARDWARE ACCELERATION</h2>
        <p>The browser took the drawing context away. Your run is paused, not lost.</p>
        <button className="play-btn" onClick={() => { window.location.reload(); }}><span>RELOAD THE SHOW</span><i>→</i></button>
      </div></div>}

      {phase === "paused" && <div className="overlay center-overlay"><div className="pause-panel" data-modal tabIndex={-1} role="dialog" aria-modal="true" aria-label="Paused">
        <span className="kicker">THE NIGHT WAITS</span>
        <h2>PAUSED</h2>
        <div className="build-row">
          <small>YOUR ACT</small>
          <b>{WEAPONS[hud.weapon].name}{hud.weapon !== hud.other ? \` + \${WEAPONS[hud.other].name}\` : ""} &middot; {CHARMS[hud.charm].name}</b>
          <span>{hud.up.length ? hud.up.map(([id, lv]) => \`\${UPGRADES.find((u) => u.id === id)?.title ?? id}\${lv > 1 ? \` L\${lv}\` : ""}\`).join(" &middot; ") : "no boons yet"}</span>
        </div>
        <label className="toggle"><input type="checkbox" checked={!muted} onChange={(e) => setMuted(!e.target.checked)} /><span>Sound</span></label>
        <div className="opts-head"><b>OPTIONS</b><small>changes stick after you quit</small></div>
        <div className="opts-grid">{optionsBlock(true)}</div>
        <div className="opts-head keys-head"><b>CONTROLS</b><small>click a key, then press the one you want · ESC cancels</small></div>
        <div className="keys-grid">{(Object.keys(DEFAULT_KEYS) as ActName[]).map((actName) => (
          <button key={actName} className={\`keybtn\${binding === actName ? " binding" : ""}\`} onClick={() => { bindingRef.current = actName; setBinding(actName); sfx("click"); }}>
            <small>{actName === "superMove" ? "SUPER" : actName.toUpperCase()}</small>
            <b>{binding === actName ? "PRESS…" : keysMap.current[actName].map(prettyKey).join(" / ")}</b>
          </button>))}
        </div>
        <button className="text-btn" onClick={() => { keysMap.current = { ...DEFAULT_KEYS }; store.set(KEYS_KEY, "{}"); setKeyRev((r) => r + 1); setBinding(null); bindingRef.current = null; sfx("click"); }}>RESET KEYS TO DEFAULT</button>
        <button className="play-btn" onClick={() => setPhase("playing")}><span>KEEP SWINGING</span><i>→</i></button>
        <button className="text-btn restart" onClick={() => startRun({ mode: game.current?.mode ?? "endless" })}>↻ RESTART RUN</button>
        <button className="text-btn" onClick={toMenu}>RETURN TO TITLE</button></div></div>}

      {phase === "upgrade" && <div className="overlay center-overlay"><div className="upgrade-panel" data-modal tabIndex={-1} role="dialog" aria-modal="true" aria-label="Choose a boon"><span className="kicker">PICK YOUR POISON</span><h2>A LITTLE STRONGER</h2>
        <div className="upgrade-list">{choices.map((u, i) => <button key={u.id} onClick={() => choose(u.id)}><b>0{i + 1}</b><span><strong>{u.title}</strong><small>{u.desc}</small></span><i>{(game.current?.upgrades[u.id] || 0) > 0 ? \`LV \${(game.current?.upgrades[u.id] || 0) + 1}\` : "+"}</i></button>)}</div>
        <small className="hint">{UPGRADES.length} boons in the pool · picks stack</small></div></div>}

      {phase === "gameover" && <div className="overlay center-overlay"><div className="pause-panel gameover" data-modal tabIndex={-1} role="dialog" aria-modal="true" aria-label="Run over">
        <span className="kicker">{hud.daily ? \`DAILY REEL · #\${dailySeed()}\` : hud.mode === "glass" ? "SHATTERED" : hud.mode === "beat" ? "OFF BEAT AT THE END" : hud.mode === "blackout" ? "SWALLOWED BY THE DARK" : hud.mode === "bulletdance" ? "THE DANCE BROKE" : \`CURTAIN CALL\${hud.revives > 0 ? \` · \${hud.revives} SECOND WIND\${hud.revives > 1 ? "S" : ""}\` : ""}\`}</span>
        <h2>FLATTENED!</h2>
        {hud.threat && <div className="taken">TAKEN OUT BY <b>{hud.threat}</b></div>}
        <div className="grade" data-g={grade(hud)}>{grade(hud)}</div>
        <div className="final-score"><small>FINAL SCORE</small>{hud.score.toLocaleString()}<span>BEST {best.toLocaleString()}</span></div>
        <div className="stat-grid"><div><b>{hud.kills}</b><small>KNOCKOUTS</small></div><div><b>{hud.parries}</b><small>PARRIES</small></div><div><b>{hud.maxCombo}</b><small>BEST COMBO</small></div><div><b>{hud.bosses}</b><small>BOSSES</small></div><div><b>{Math.floor(hud.elapsed / 60)}:{String(Math.floor(hud.elapsed % 60)).padStart(2, "0")}</b><small>SURVIVED</small></div><div><b>{hud.crates}</b><small>CRATES</small></div></div>
        {newAchv.length > 0 && <div className="achv-row"><small>ACHIEVEMENTS UNLOCKED</small>{newAchv.map((id) => <span key={id}>{ACHIEVEMENTS.find((x) => x.id === id)?.name}</span>)}</div>}
        {hud.found.length > 0 && <div className="found"><small>NEW IN THE ARMORY</small>{hud.found.map((k) => <span key={k}><Glyph d={WEAPONS[k].icon} />{WEAPONS[k].name}</span>)}</div>}
        <div className="leaderboard-submit-box">
          {!scoreSubmitted ? (
            <button className="text-btn board-submit-btn" disabled={submittingScore} onClick={async () => {
              setSubmittingScore(true);
              const res = await submitScore({
                player_name: playerTag,
                score: hud.score,
                mode: hud.mode,
                character: character,
                weapon: hud.weapon,
                kills: hud.kills,
                waves: hud.waves,
                coins_earned: hud.coins,
                daily_seed: hud.daily ? dailySeed() : null,
              });
              setSubmittingScore(false);
              if (res.success) {
                setScoreSubmitted(true);
                setSubmitResult("SCORE POSTED TO THE MARQUEE!");
                sfx("unlock");
              } else {
                setSubmitResult(res.error || "Score recorded locally.");
              }
            }}>
              {submittingScore ? "POSTING SCORE…" : \`POST TO ONLINE BOARD AS \${playerTag}\`}
            </button>
          ) : (
            <div className="submit-success">★ {submitResult}</div>
          )}
        </div>
        <button className="play-btn" onClick={() => startRun({ daily: game.current?.dailySeed !== undefined, mode: game.current?.mode ?? "endless" })}><span>ONE MORE RIFF</span><i>↻</i></button>
        <button className="text-btn" onClick={toMenu}>CHANGE LOADOUT</button></div></div>}

      <div className="vignette" aria-hidden="true" /><div className="scanlines" aria-hidden="true" /><div className="scratches" aria-hidden="true" />
    </section>
    <footer><span>BUMBI</span><p>AN AUTHENTIC ENDLESS RUBBER-HOSE RUN & GUN</p></footer>
  </main>;
}
`;

fs.writeFileSync(path.resolve("src/App.tsx"), appTsxContent, "utf8");
console.log("src/App.tsx written successfully.");
