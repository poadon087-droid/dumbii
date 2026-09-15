/**
 * Gamepad polling. One read per frame, edge-detected so buttons that are "presses"
 * (dash, parry, EX, swap) fire once per tap instead of every frame.
 *
 * Layout (Xbox / Standard mapping):
 *   left stick   move            right stick  aim (auto-aim when centred)
 *   A            dash            X            parry
 *   Y            EX move         B            super
 *   LB           swap weapon     RB / RT      fire
 *   Back         talk to Porbo   Start        pause
 */
export type PadFrame = {
  present: boolean; mx: number; my: number; ax: number; ay: number;
  fire: boolean; dash: boolean; parry: boolean; ex: boolean; sup: boolean; swap: boolean; interact: boolean; pause: boolean;
};

const EMPTY: PadFrame = { present: false, mx: 0, my: 0, ax: 0, ay: 0, fire: false, dash: false, parry: false, ex: false, sup: false, swap: false, interact: false, pause: false };
const DEAD = 0.24;
let prev: boolean[] = [];

const dead = (v: number) => (Math.abs(v) < DEAD ? 0 : Math.sign(v) * Math.min(1, (Math.abs(v) - DEAD) / (1 - DEAD)));

export function readPad(): PadFrame {
  let pads: (Gamepad | null)[] = [];
  try { pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : []; } catch { return EMPTY; }
  const connected = pads.filter((p) => p && p.connected) as Gamepad[];
  const pad = connected[0] as Gamepad | undefined;
  if (!pad) { prev = []; return EMPTY; }

  const b = (i: number) => !!pad.buttons[i]?.pressed || !!pad.buttons[i]?.value;
  const now = [b(0), b(1), b(2), b(3), b(4), b(5), b(6), b(7), b(8), b(9)];
  const edge = (i: number) => now[i] && !prev[i];
  const held = (i: number) => now[i];

  const f: PadFrame = {
    present: true,
    mx: dead(pad.axes[0] ?? 0), my: dead(pad.axes[1] ?? 0),
    ax: dead(pad.axes[2] ?? 0), ay: dead(pad.axes[3] ?? 0),
    fire: held(5) || held(7),
    dash: edge(0),
    parry: edge(2),
    ex: edge(3),
    sup: edge(1),
    swap: edge(4),
    interact: edge(8),
    pause: edge(9),
  };
  prev = now;
  return f;
}

/** Forget the button edges — called when the run pauses or restarts so a pad that was held down
 *  through the pause panel cannot fire a lunge the instant play resumes. */
export function resetPadEdges() { prev = []; }

/** Short rumble on a hard beat — silently ignored where the browser has no actuator. */
export function rumble(ms = 60, strong = .6, weak = .3) {
  try {
    const pad = (navigator.getGamepads?.() ?? []).find((p) => p && p.connected) as Gamepad | undefined;
    const act = pad?.vibrationActuator as { playEffect?: (t: string, o: object) => unknown } | undefined;
    act?.playEffect?.("dual-rumble", { duration: ms, strongMagnitude: strong, weakMagnitude: weak });
  } catch { /* no haptics — nothing to do */ }
}
