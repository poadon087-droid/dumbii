import fs from "node:fs";

let content = fs.readFileSync("tools/build-app-tsx.mjs", "utf8");

// 1. Fix imports
content = content.replace(
  'import { BIOMES, CHARACTERS, CHARACTER_KEYS, CHARMS, CHARM_KEYS, ENEMIES, ENEMY_KEYS, POWERUPS, STARTER_WEAPONS, UNLOCK_KEY, UPGRADES, WEAPONS, WEAPON_KEYS, SKINS, skinFor } from "./game/data";',
  'import { BIOMES, CHARACTERS, CHARACTER_KEYS, CHARMS, CHARM_KEYS, ENEMIES, ENEMY_KEYS, STARTER_WEAPONS, UNLOCK_KEY, UPGRADES, WEAPONS, WEAPON_KEYS, SKINS } from "./game/data";'
);
content = content.replace(
  'import { holdAudio, playMusic, preload, setMuted as setAudioMuted, setMusicIntensity, setVolumes, sfx, stopMusic, unlock } from "./game/audio";',
  'import { playMusic, preload, setMuted as setAudioMuted, setMusicIntensity, setVolumes, sfx, stopMusic, unlock } from "./game/audio";'
);
content = content.replace(
  'import { MAPS, stageAt, worldOf, type MapId } from "./game/world";',
  'import { MAPS, worldOf, type MapId } from "./game/world";'
);
content = content.replace(
  'import { STYLE_INDEX, STYLES, flagsOf, type StyleId } from "./game/styles";',
  'import { STYLE_INDEX, STYLES, type StyleId } from "./game/styles";'
);

// 2. Remove unused Pip component
content = content.replace(/const Pip = [^\n]+\n/g, "");

// 3. Remove unused slot, setSlot
content = content.replace(/\s+const \[slot, setSlot\] = useState<0 \| 1>\(0\);/g, "");

// 4. Fix ResizeObserver w/h
content = content.replace(
  'if (game.current) { game.current.w = w; game.current.h = h; }',
  'if (game.current) { game.current.viewW = w; game.current.viewH = h; }'
);

// 5. Fix setFxOpts
content = content.replace(
  'setFxOpts({ low: q0.lowFx, calm: q0.reduced, contrast: q0.contrast, speedlines: q0.speedlines, dressing: q0.dressing, text: q0.text, hud: q0.hud, style: q0.style });',
  'setFxOpts({ contrast: q0.contrast, speedlines: q0.speedlines, dressing: q0.dressing, text: q0.text, style: q0.style });'
);

// 6. Fix g null check and tick flow
const oldTick = `      const w = scene.width, h = scene.height;
      const g = game.current;
      const ph = phaseRef.current;
      const q0 = qualityRef.current;
      setFxOpts({ contrast: q0.contrast, speedlines: q0.speedlines, dressing: q0.dressing, text: q0.text, style: q0.style });
      setPostEnabled(q0.shaders);
      if (g) {`;

const newTick = `      const w = scene.width, h = scene.height;
      const g = game.current;
      if (!g) {
        if (direct) direct.clearRect(0, 0, w, h);
        return;
      }
      const ph = phaseRef.current;
      const q0 = qualityRef.current;
      setFxOpts({ contrast: q0.contrast, speedlines: q0.speedlines, dressing: q0.dressing, text: q0.text, style: q0.style });
      setPostEnabled(q0.shaders);
      {`;

content = content.replace(oldTick, newTick);

// 7. Fix aim positions
const oldAim = `        if (aimJoy.current.active) {
          inp.aim = Math.atan2(aimJoy.current.y, aimJoy.current.x);
          inp.fire = Math.hypot(aimJoy.current.x, aimJoy.current.y) > 0.3;
        } else if (padNow.present && (Math.abs(padNow.ax) > 0.2 || Math.abs(padNow.ay) > 0.2)) {
          inp.aim = Math.atan2(padNow.ay, padNow.ax);
          inp.fire = true;
        } else {
          inp.aim = mouse.current.active ? Math.atan2(mouse.current.y - g.player.y, mouse.current.x - g.player.x) : null;
        }`;

const newAim = `        if (aimJoy.current.active) {
          inp.aim = { x: g.player.x + aimJoy.current.x * 100, y: g.player.y + aimJoy.current.y * 100 };
          inp.fire = Math.hypot(aimJoy.current.x, aimJoy.current.y) > 0.3;
        } else if (padNow.present && (Math.abs(padNow.ax) > 0.2 || Math.abs(padNow.ay) > 0.2)) {
          inp.aim = { x: g.player.x + padNow.ax * 100, y: g.player.y + padNow.ay * 100 };
          inp.fire = true;
        } else {
          inp.aim = mouse.current.active ? { x: mouse.current.x, y: mouse.current.y } : null;
        }`;

content = content.replace(oldAim, newAim);

// Replace closing `} else { g.events.length = 0; }`
content = content.replace(
  `        setMusicIntensity(g.boss ? 1 : Math.min(1, g.enemies.length / 10));\n      } else { g.events.length = 0; }`,
  `        setMusicIntensity(g.boss ? 1 : Math.min(1, g.enemies.length / 10));\n      }`
);

// 8. Remove unused kh
content = content.replace(
  '  const kh = (a: ActName, n = 2) => [...new Set(keysMap.current[a].map(prettyKey))].slice(0, n).join(" · ");\n',
  ''
);

// 9. Use scoresError and dailyBest
content = content.replace(
  '{scoresLoading ? (',
  `{scoresError && <div className="rr-board-empty" style={{ color: "#ff6659" }}>{scoresError}</div>}\n                  {scoresLoading ? (`
);

content = content.replace(
  `<div className="stat">\n                        <small>MAPS CLEARED</small>\n                        <b>56/56</b>\n                      </div>`,
  `<div className="stat">\n                        <small>DAILY RECORD</small>\n                        <b>{dailyBest.toLocaleString()}</b>\n                      </div>`
);

fs.writeFileSync("tools/build-app-tsx.mjs", content, "utf8");
console.log("Updated tools/build-app-tsx.mjs successfully.");
