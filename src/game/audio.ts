/**
 * Audio: fully SYNTHESIZED sound effects — every cue is a designed patch of
 * oscillators and filtered noise with real envelopes, so nothing depends on the
 * network and nothing ever degrades into a placeholder beep.
 * Music: royalty-free big band by Eric Matyas (soundimage.org — attribution
 * required, credited in-game) with a built-in synth band fallback when the
 * stream is unreachable.
 */
let ac: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let muted = false;
/** true while the tab is hidden — see holdAudio(): the context must stay asleep until it returns. */
let musicHeld = false;
export type Volumes = { master: number; music: number; sfx: number };
let vol: Volumes = { master: .85, music: 1, sfx: 1 };
let noiseBuf: AudioBuffer | null = null;
const lastPlayed = new Map<string, number>();

/** One scheduled voice: oscillator (default) or filtered noise when `n: 1`. */
type Layer = {
  n?: 1;                 // noise voice
  t?: OscillatorType;    // oscillator type
  f: number;             // start frequency (noise: filter cutoff)
  f2?: number;           // end frequency glide (noise: cutoff sweep)
  d: number;             // total duration (s)
  v: number;             // peak gain
  a?: number;            // attack (s)
  dl?: number;           // delay before voice starts (s)
  vib?: number;          // vibrato rate (Hz)
  q?: number;            // noise: Q — when set the filter is bandpass, else lowpass
};
type Patch = { layers: Layer[]; vol?: number; throttle?: number };

const P: Record<string, Patch> = {
  // ---------- weapons (each has its own voice) ----------
  "shoot:popper":    { layers: [{ t: "square", f: 760, f2: 280, d: .07, v: .16 }, { n: 1, f: 2200, d: .05, v: .1 }], throttle: .05 },
  "shoot:choir":     { layers: [{ n: 1, f: 1500, f2: 400, d: .14, v: .26 }, { t: "triangle", f: 180, f2: 90, d: .12, v: .18 }] },
  "shoot:note":      { layers: [{ f: 880, f2: 1760, d: .09, v: .13 }, { f: 1320, f2: 2640, d: .07, v: .05, dl: .02 }], throttle: .06 },
  "shoot:mortar":    { layers: [{ f: 320, f2: 55, d: .38, v: .28 }, { n: 1, f: 600, f2: 100, d: .3, v: .16 }] },
  "shoot:halo":      { layers: [{ t: "triangle", f: 520, f2: 900, d: .14, v: .14 }, { t: "triangle", f: 900, f2: 520, d: .14, v: .1, dl: .12 }] },
  "shoot:kettle":    { layers: [{ t: "sawtooth", f: 180, f2: 950, d: .28, v: .16 }] },
  "shoot:shard":     { layers: [{ f: 1700, f2: 2300, d: .06, v: .11 }, { f: 2500, d: .05, v: .06, dl: .04 }] },
  "shoot:lobber":    { layers: [{ f: 420, f2: 140, d: .18, v: .2 }, { n: 1, f: 900, f2: 300, d: .12, v: .09, dl: .05 }] },
  "shoot:fountain":  { layers: [{ n: 1, f: 3200, q: 1, d: .08, v: .07 }], throttle: .09 },
  "shoot:trio":      { layers: [{ t: "square", f: 1300, f2: 700, d: .05, v: .09 }, { t: "square", f: 1300, f2: 700, d: .05, v: .09, dl: .06 }] },
  "shoot:cuckoo":    { layers: [{ t: "square", f: 1500, f2: 1900, d: .06, v: .09 }, { t: "square", f: 1900, f2: 1400, d: .07, v: .09, dl: .08 }] },
  "shoot:accordion": { layers: [{ t: "square", f: 420, d: .18, v: .08, vib: 6 }, { t: "square", f: 630, d: .18, v: .04, vib: 6 }], throttle: .08 },
  "shoot:yoyo":      { layers: [{ f: 900, f2: 350, d: .14, v: .13 }, { f: 350, f2: 900, d: .16, v: .09, dl: .14 }] },
  "shoot:harp":      { layers: [{ n: 1, f: 2600, f2: 900, d: .18, v: .13 }, { f: 1200, d: .1, v: .07 }, { f: 1600, d: .1, v: .05, dl: .03 }, { f: 2000, d: .12, v: .04, dl: .06 }] },
  "shoot:frost":     { layers: [{ n: 1, f: 2400, f2: 1200, d: .2, v: .09 }, { f: 1000, f2: 650, d: .18, v: .09 }] },
  "shoot:quill":     { layers: [{ n: 1, f: 400, f2: 2400, q: 1.2, d: .16, v: .14 }, { t: "triangle", f: 300, f2: 160, d: .1, v: .07 }] },
  "shoot:popcorn":   { layers: [{ t: "square", f: 1900, f2: 2400, d: .04, v: .09 }, { n: 1, f: 2500, d: .04, v: .08 }] },
  "shoot:trumpet":   { layers: [{ t: "sawtooth", f: 330, f2: 440, d: .22, v: .09, vib: 5 }, { t: "sawtooth", f: 660, f2: 880, d: .22, v: .04, vib: 5 }] },
  "shoot:mitt":      { layers: [{ f: 200, f2: 120, d: .1, v: .15 }, { f: 700, f2: 900, d: .14, v: .05, dl: .03 }] },
  "shoot:anvil":     { layers: [{ f: 1700, f2: 180, d: .45, v: .12 }, { n: 1, f: 700, f2: 100, d: .2, v: .16, dl: .42 }] },
  "shoot:bubbles":   { layers: [{ f: 700, f2: 1100, d: .07, v: .07 }, { f: 900, f2: 1300, d: .07, v: .06, dl: .06 }, { f: 1100, f2: 1500, d: .08, v: .05, dl: .12 }], throttle: .06 },
  "shoot:boombox":   { layers: [{ f: 160, f2: 42, d: .35, v: .26 }, { n: 1, f: 800, d: .12, v: .1, dl: .01 }] },
  "shoot:phonograph":{ layers: [{ f: 620, d: .2, v: .09, vib: 9 }, { t: "square", f: 310, d: .2, v: .035, vib: 9 }] },
  "shoot:peel":      { layers: [{ t: "square", f: 1000, f2: 1500, d: .05, v: .08 }, { n: 1, f: 1800, d: .06, v: .08 }], throttle: .06 },
  "shoot:kazoo":     { layers: [{ t: "sawtooth", f: 240, d: .12, v: .11, vib: 24 }, { t: "sawtooth", f: 360, d: .12, v: .045, vib: 24 }], throttle: .08 },
  "shoot:barrel":    { layers: [{ n: 1, f: 300, f2: 150, q: .7, d: .25, v: .14 }, { f: 110, f2: 80, d: .25, v: .14 }] },
  "shoot:syrup":     { layers: [{ f: 300, f2: 240, d: .3, v: .15, vib: 3 }, { n: 1, f: 500, d: .1, v: .04, dl: .1 }] },
  "shoot:whistle":   { layers: [{ t: "square", f: 2350, f2: 2950, d: .18, v: .09, vib: 7 }, { t: "square", f: 2950, d: .12, v: .06, dl: .14 }] },
  "shoot:umbrella":  { layers: [{ t: "triangle", f: 300, f2: 700, d: .1, v: .11 }, { n: 1, f: 2000, f2: 800, d: .1, v: .07, dl: .02 }] },
  "shoot:grapple":   { layers: [{ t: "sawtooth", f: 300, f2: 1500, d: .12, v: .11 }, { n: 1, f: 3000, d: .04, v: .1, dl: .11 }] },
  "shoot:slots":     { layers: [{ t: "square", f: 1500, d: .03, v: .08 }, { t: "square", f: 1500, d: .03, v: .08, dl: .07 }, { t: "square", f: 1500, d: .03, v: .08, dl: .14 }, { f: 2100, d: .12, v: .09, dl: .22 }], throttle: .05 },
  "shoot:paint":     { layers: [{ n: 1, f: 700, f2: 250, q: .8, d: .12, v: .13 }, { f: 250, f2: 150, d: .1, v: .07 }], throttle: .06 },
  "shoot:pie":       { layers: [{ n: 1, f: 500, f2: 180, q: .6, d: .14, v: .16 }, { f: 200, f2: 90, d: .12, v: .1 }] },
  "shoot:stamp":     { layers: [{ f: 160, f2: 90, d: .08, v: .18 }, { n: 1, f: 1200, d: .05, v: .12 }] },
  "shoot:lance":     { layers: [{ n: 1, f: 2600, f2: 900, q: .9, d: .11, v: .12 }, { t: "square", f: 990, f2: 1980, d: .07, v: .06 }], throttle: .06 },
  "shoot:sprinkler": { layers: [{ f: 520, f2: 980, d: .06, v: .08 }, { f: 660, f2: 1240, d: .06, v: .06, dl: .05 }, { f: 420, f2: 780, d: .06, v: .05, dl: .1 }], throttle: .08 },
  "shoot:candle":    { layers: [{ f: 320, f2: 150, d: .16, v: .12 }, { n: 1, f: 1400, f2: 2600, q: 1.3, d: .1, v: .045, dl: .05 }] },
  // ---------- combat & feedback ----------
  hit:        { layers: [{ n: 1, f: 1600, d: .04, v: .12 }, { f: 220, f2: 150, d: .05, v: .09 }], throttle: .04 },
  bosshit:    { layers: [{ t: "triangle", f: 140, f2: 90, d: .12, v: .18 }, { n: 1, f: 900, d: .08, v: .1 }], throttle: .12 },
  kill:       { layers: [{ t: "square", f: 500, f2: 200, d: .12, v: .11 }, { f: 800, f2: 300, d: .1, v: .07, dl: .04 }, { n: 1, f: 1200, d: .08, v: .08 }], throttle: .03 },
  elitekill:  { layers: [{ f: 700, f2: 1400, d: .15, v: .11 }, { n: 1, f: 800, f2: 200, d: .25, v: .14 }, { f: 1800, d: .1, v: .05, dl: .1 }] },
  knockout:   { layers: [{ f: 90, f2: 30, d: .6, v: .28 }, { n: 1, f: 700, f2: 80, d: .5, v: .2 }, { t: "sawtooth", f: 220, d: .3, v: .07, dl: .05 }] },
  boom:       { layers: [{ n: 1, f: 900, f2: 80, q: .5, d: .4, v: .2 }, { f: 100, f2: 35, d: .4, v: .22 }], throttle: .08 },
  splat:      { layers: [{ n: 1, f: 600, f2: 200, q: 1, d: .15, v: .14 }, { f: 220, f2: 110, d: .1, v: .07 }] },
  thud:       { layers: [{ f: 100, f2: 50, d: .2, v: .2 }, { n: 1, f: 400, d: .1, v: .1 }] },
  pop:        { layers: [{ f: 900, f2: 300, d: .05, v: .12 }, { n: 1, f: 2000, d: .03, v: .08 }], throttle: .04 },
  peck:       { layers: [{ t: "square", f: 2200, f2: 1800, d: .04, v: .07 }], throttle: .12 },
  parry:      { layers: [{ f: 880, d: .08, v: .15 }, { f: 1320, d: .1, v: .1, dl: .05 }, { f: 1760, d: .14, v: .07, dl: .1 }] },
  block:      { layers: [{ t: "triangle", f: 190, f2: 140, d: .08, v: .16 }, { n: 1, f: 1500, d: .05, v: .1 }] },
  dash:       { layers: [{ n: 1, f: 700, f2: 2600, q: .8, d: .18, v: .09 }] },
  hurt:       { layers: [{ t: "sawtooth", f: 320, f2: 90, d: .28, v: .18 }, { n: 1, f: 500, d: .15, v: .12 }] },
  charge:     { layers: [{ f: 300, f2: 1200, d: .3, v: .07 }], throttle: .3 },
  laser:      { layers: [{ t: "sawtooth", f: 1400, f2: 150, d: .28, v: .16 }, { n: 1, f: 2000, f2: 400, d: .2, v: .1 }] },
  freeze:     { layers: [{ f: 1400, f2: 700, d: .2, v: .09 }, { f: 2100, f2: 1050, d: .18, v: .045 }], throttle: .1 },
  boing:      { layers: [{ f: 280, f2: 620, d: .12, v: .15 }, { f: 620, f2: 280, d: .14, v: .12, dl: .12 }], throttle: .1 },
  web:        { layers: [{ n: 1, f: 900, f2: 300, q: 2, d: .18, v: .09 }], throttle: .2 },
  cheer:      { layers: [{ n: 1, f: 700, f2: 1400, d: .3, v: .1 }, { n: 1, f: 900, f2: 1800, d: .25, v: .07, dl: .12 }, { f: 1046, f2: 1568, d: .2, v: .06, dl: .1 }], throttle: .4 },
  whiff:      { layers: [{ n: 1, f: 1800, f2: 500, d: .1, v: .07 }], throttle: .1 },
  stamp:      { layers: [{ f: 190, f2: 70, d: .2, v: .22 }, { n: 1, f: 900, d: .08, v: .1, dl: .02 }], throttle: .2 },
  // ---------- pickups & progression ----------
  pickup:     { layers: [{ f: 1046, d: .06, v: .09 }, { f: 1568, d: .1, v: .09, dl: .05 }] },
  coin:       { layers: [{ t: "square", f: 1568, d: .04, v: .07 }, { t: "square", f: 2093, d: .09, v: .07, dl: .04 }], throttle: .05 },
  powerup:    { layers: [{ t: "square", f: 523, d: .07, v: .09 }, { t: "square", f: 659, d: .07, v: .09, dl: .06 }, { t: "square", f: 784, d: .07, v: .09, dl: .12 }, { t: "square", f: 1046, d: .14, v: .09, dl: .18 }] },
  levelup:    { layers: [{ t: "triangle", f: 523, d: .08, v: .09 }, { t: "triangle", f: 784, d: .08, v: .09, dl: .07 }, { t: "triangle", f: 1046, d: .16, v: .09, dl: .14 }] },
  unlock:     { layers: [{ f: 784, d: .08, v: .09 }, { f: 1046, d: .08, v: .09, dl: .07 }, { f: 1318, d: .08, v: .09, dl: .14 }, { f: 1568, d: .25, v: .09, dl: .21 }, { f: 2093, d: .3, v: .045, dl: .21 }] },
  crate:      { layers: [{ t: "triangle", f: 180, f2: 120, d: .1, v: .15 }, { n: 1, f: 1000, d: .06, v: .09 }] },
  crateopen:  { layers: [{ f: 660, d: .06, v: .08 }, { f: 880, d: .06, v: .08, dl: .06 }, { f: 1174, d: .12, v: .08, dl: .12 }] },
  ex:         { layers: [{ t: "square", f: 660, d: .08, v: .1 }, { t: "square", f: 880, d: .08, v: .1, dl: .07 }, { t: "square", f: 1320, d: .15, v: .1, dl: .14 }] },
  super:      { layers: [{ t: "sawtooth", f: 200, f2: 1600, d: .4, v: .12 }, { n: 1, f: 600, f2: 3000, d: .4, v: .14, dl: .1 }, { f: 80, d: .5, v: .18, dl: .35 }] },
  star:       { layers: [{ f: 1046, d: .1, v: .09 }, { f: 1318, d: .1, v: .09, dl: .07 }, { f: 1568, d: .1, v: .09, dl: .14 }, { f: 2093, d: .2, v: .09, dl: .21 }] },
  // ---------- enemies & stage ----------
  boss:       { layers: [{ t: "sawtooth", f: 110, d: .7, v: .16, vib: 4 }, { t: "sawtooth", f: 165, d: .7, v: .08, vib: 4 }, { n: 1, f: 200, f2: 60, d: .3, v: .14, dl: .05 }] },
  bossattack: { layers: [{ t: "sawtooth", f: 150, f2: 90, d: .25, v: .12, vib: 6 }, { n: 1, f: 600, d: .15, v: .07 }] },
  bosstransform: { layers: [{ t: "sawtooth", f: 100, f2: 800, d: .5, v: .14 }, { n: 1, f: 400, f2: 2000, d: .5, v: .12, dl: .1 }, { f: 60, d: .6, v: .22, dl: .45 }] },
  growl:      { layers: [{ t: "sawtooth", f: 90, f2: 70, d: .4, v: .1, vib: 7 }], throttle: .3 },
  blink:      { layers: [{ f: 2200, f2: 2800, d: .05, v: .06 }], throttle: .1 },
  croak:      { layers: [{ t: "square", f: 180, f2: 120, d: .15, v: .09, vib: 12 }], throttle: .2 },
  spore:      { layers: [{ n: 1, f: 800, f2: 400, d: .12, v: .06 }] },
  hex:        { layers: [{ f: 1200, d: .12, v: .06 }, { f: 1600, d: .12, v: .045, dl: .04 }], throttle: .1 },
  steam:      { layers: [{ n: 1, f: 1800, f2: 900, d: .3, v: .07 }] },
  bell:       { layers: [{ f: 880, d: .6, v: .14 }, { f: 1320, d: .5, v: .07 }, { f: 2200, d: .35, v: .035 }] },
  revive:     { layers: [{ t: "square", f: 400, f2: 900, d: .3, v: .1, vib: 8 }] },
  wave:       { layers: [{ t: "sawtooth", f: 392, f2: 523, d: .25, v: .1 }, { t: "sawtooth", f: 523, d: .2, v: .08, dl: .2 }] },
  whistle:    { layers: [{ t: "square", f: 2500, f2: 3200, d: .25, v: .1, vib: 8 }] },
  // ---------- UI & meta ----------
  click:      { layers: [{ t: "square", f: 1000, d: .03, v: .06 }] },
  swap:       { layers: [{ t: "square", f: 800, f2: 1200, d: .05, v: .08 }] },
  deny:       { layers: [{ t: "square", f: 150, f2: 110, d: .14, v: .11 }] },
  biome:      { layers: [{ f: 523, d: .15, v: .07 }, { f: 784, d: .2, v: .05, dl: .1 }] },
  modifier:   { layers: [{ t: "square", f: 400, f2: 800, d: .2, v: .09 }, { t: "square", f: 800, f2: 1200, d: .15, v: .06, dl: .15 }] },
  shopopen:   { layers: [{ f: 880, d: .15, v: .1 }, { f: 660, d: .25, v: .1, dl: .18 }] },
  gameover:   { layers: [{ t: "sawtooth", f: 392, d: .25, v: .12 }, { t: "sawtooth", f: 370, d: .25, v: .12, dl: .25 }, { t: "sawtooth", f: 349, d: .25, v: .12, dl: .5 }, { t: "sawtooth", f: 330, f2: 160, d: .6, v: .12, dl: .75 }] },
  clock:      { layers: [{ t: "square", f: 1200, d: .05, v: .09 }, { t: "square", f: 900, d: .05, v: .09, dl: .15 }] },
};
const DEFAULT_PATCH: Patch = { layers: [{ t: "triangle", f: 700, f2: 500, d: .06, v: .06 }] };

function ctx() {
  if (!ac) {
    ac = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    master = ac.createGain(); master.gain.value = muted ? 0 : vol.master; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = vol.sfx;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; sfxBus.connect(comp); comp.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ac.state === "suspended" && !musicHeld) resumeCtx();
  return ac;
}

/** Browsers reject resume() until a gesture has unlocked audio; that rejection is expected, so it
 *  has to be swallowed or it lands in the console as an unhandled promise on every page load. */
function resumeCtx() { try { void ac?.resume().catch(() => { /* still behind the autoplay policy */ }); } catch { /* no context yet */ } }

function playPatch(p: Patch, a: AudioContext) {
  const vol = p.vol ?? 1;
  for (const L of p.layers) {
    const t0 = a.currentTime + (L.dl || 0);
    const g = a.createGain();
    const at = Math.min(L.a ?? .006, L.d * .3);
    g.gain.setValueAtTime(.0001, t0);
    g.gain.linearRampToValueAtTime(Math.max(.0002, L.v * vol), t0 + at);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + L.d);
    g.connect(sfxBus!);
    if (L.n) {
      const s = a.createBufferSource(); s.buffer = noiseBuf!;
      const f = a.createBiquadFilter();
      f.type = L.q !== undefined ? "bandpass" : "lowpass";
      f.frequency.setValueAtTime(Math.max(30, L.f), t0);
      if (L.f2) f.frequency.exponentialRampToValueAtTime(Math.max(30, L.f2), t0 + L.d);
      f.Q.value = L.q ?? .8;
      s.connect(f); f.connect(g);
      s.start(t0, Math.random() * .4); s.stop(t0 + L.d + .02);
    } else {
      const o = a.createOscillator();
      o.type = L.t || "sine";
      o.frequency.setValueAtTime(Math.max(20, L.f), t0);
      if (L.f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, L.f2), t0 + L.d);
      if (L.vib) {
        const lfo = a.createOscillator(), lg = a.createGain();
        lfo.frequency.value = L.vib; lg.gain.value = Math.max(20, L.f) * .03;
        lfo.connect(lg); lg.connect(o.frequency);
        lfo.start(t0); lfo.stop(t0 + L.d + .02);
      }
      o.connect(g); o.start(t0); o.stop(t0 + L.d + .02);
    }
  }
}

export function sfx(name: string) {
  if (muted) return;
  try {
    const a = ctx();
    const patch = P[name] || DEFAULT_PATCH;
    const now = a.currentTime;
    const last = lastPlayed.get(name) || -1;
    if (patch.throttle && now - last < patch.throttle) return;
    lastPlayed.set(name, now);
    playPatch(patch, a);
  } catch { /* audio unavailable */ }
}
export function preload() { try { ctx(); } catch { /* noop */ } }
export function unlock() { try { ctx(); music.el?.play().catch(() => { /* wait for gesture */ }); } catch { /* noop */ } }
export function setMuted(m: boolean) { muted = m; if (master && ac) master.gain.setTargetAtTime(m ? 0 : vol.master, ac.currentTime, .05); if (music.el) music.el.muted = m; }
/** Mix desk. Values are 0..1 and applied live, no restart needed. */
export function setVolumes(v: Partial<Volumes>) {
  vol = { ...vol, ...v };
  try {
    if (master && ac) master.gain.setTargetAtTime(muted ? 0 : vol.master, ac.currentTime, .04);
    if (sfxBus && ac) sfxBus.gain.setTargetAtTime(vol.sfx, ac.currentTime, .04);
    if (music.el) music.el.volume = Math.min(1, music.target * vol.music);
  } catch { /* audio not up yet — values apply when it is */ }
}
export function getVolumes(): Volumes { return { ...vol }; }

// simple helpers kept for the fallback band below
function tone(freq: number, dur: number, type: OscillatorType, vol: number, slide = 0, delay = 0) {
  const a = ctx(); const o = a.createOscillator(), g = a.createGain(); const t0 = a.currentTime + delay;
  o.type = type; o.frequency.setValueAtTime(freq, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  o.connect(g); g.connect(sfxBus!); o.start(t0); o.stop(t0 + dur + .02);
}
function noise(dur: number, vol: number, freq = 1200, q = .8, delay = 0) {
  const a = ctx(); const s = a.createBufferSource(); s.buffer = noiseBuf!; const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
  const g = a.createGain(); const t0 = a.currentTime + delay; g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus!); s.start(t0); s.stop(t0 + dur + .02);
}

// ---------- music ----------
export const MUSIC = {
  play: "https://soundimage.org/wp-content/uploads/2021/09/Big-Band-Swingin_Looping.mp3",
  boss: "https://soundimage.org/wp-content/uploads/2026/07/Slapstick.ogg",
  menu: "https://soundimage.org/wp-content/uploads/2026/06/Shufflin.ogg",
};
const music: { el: HTMLAudioElement | null; track: string; synth: number | null; target: number; gen: number } = { el: null, track: "", synth: null, target: .5, gen: 0 };
const BASS = [[130.8, 164.8, 196, 164.8], [146.8, 174.6, 220, 174.6], [196, 246.9, 293.7, 246.9], [130.8, 196, 164.8, 123.5]];
const LEAD = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7];
function startSynth() {
  if (music.synth !== null) return;
  const a = ctx(); const beat = 60 / 176; let step = 0; let next = a.currentTime + .1;
  music.synth = window.setInterval(() => {
    if (muted) { return; }
    while (next < a.currentTime + .25) {
      const bar = Math.floor(step / 8) % 4, eighth = step % 8, t = next - a.currentTime, swing = eighth % 2 ? beat * .17 : 0;
      if (eighth % 2 === 0) tone(BASS[bar][Math.floor(eighth / 2)], beat * .9, "triangle", .3, 0, t + swing);
      noise(eighth % 2 ? .05 : .09, eighth % 2 ? .06 : .1, 7000, 1.5, t + swing);
      if (Math.random() < (eighth % 2 ? .35 : .55) && step % 32 > 4) tone(LEAD[Math.floor(Math.random() * LEAD.length)], beat * .6, "sawtooth", .04, 0, t + swing);
      step++; next += beat / 2;
    }
  }, 80);
}
function stopSynth() { if (music.synth !== null) { clearInterval(music.synth); music.synth = null; } }

export function playMusic(track: keyof typeof MUSIC) {
  const url = MUSIC[track]; if (music.track === url && music.el && !music.el.paused) return;
  music.track = url;
  const gen = ++music.gen; // invalidates any in-flight fade from an older play/stop
  if (!music.el) {
    music.el = new Audio(); music.el.loop = true; music.el.preload = "auto"; music.el.volume = 0;
    music.el.addEventListener("error", () => { startSynth(); });
    music.el.addEventListener("playing", () => { stopSynth(); });
  }
  const el = music.el; el.muted = muted;
  const target = track === "menu" ? .35 : track === "boss" ? .55 : .48; music.target = target;
  const fadeOut = () => new Promise<void>((res) => { if (el.paused || el.volume <= .02) { res(); return; } const iv = setInterval(() => { el.volume = Math.max(0, el.volume - .06); if (el.volume <= 0) { clearInterval(iv); res(); } }, 40); });
  fadeOut().then(() => {
    if (gen !== music.gen) return;
    el.src = url; el.currentTime = 0; el.volume = 0;
    el.play().then(() => { const goal = () => music.target * vol.music; const iv = setInterval(() => { if (gen !== music.gen) { clearInterval(iv); return; } el.volume = Math.min(goal(), el.volume + .03); if (el.volume >= goal()) clearInterval(iv); }, 60); }).catch(() => { /* needs gesture; retried on unlock */ });
  });
}
export function stopMusic() { stopSynth(); music.gen++; if (music.el) { const el = music.el, gen = music.gen; const iv = setInterval(() => { if (gen !== music.gen) { clearInterval(iv); return; } el.volume = Math.max(0, el.volume - .08); if (el.volume <= 0) { clearInterval(iv); el.pause(); if (music.track !== "") music.track = ""; } }, 40); } }
/** The game pauses itself when the tab is hidden; the band has to stop with it. A silent
 *  background tab is polite, and on a phone it is real battery. */
export function holdAudio(hidden: boolean) {
  musicHeld = hidden;
  if (hidden) {
    try { if (ac && ac.state === "running") void ac.suspend(); } catch { /* nothing to suspend */ }
    if (music.el && !music.el.paused) music.el.pause();
  } else {
    try { if (ac && ac.state === "suspended") resumeCtx(); } catch { /* not unlocked yet */ }
    if (music.el && music.track && music.el.paused && !muted) { try { void music.el.play().catch(() => { /* gesture needed */ }); } catch { /* ignore */ } }
  }
}

export function setMusicIntensity(v: number) { if (music.el && !music.el.paused) { const goal = music.target * (.75 + v * .25) * vol.music; music.el.volume += (goal - music.el.volume) * .05; } }
