import fs from "node:fs";
import path from "node:path";

const newUiCss = fs.readFileSync(path.resolve("ui ux/ui/new-ui/src/styles.css"), "utf8");

const runtimeCss = `
/* ==========================================================================
   GAME RUNTIME, CANVAS, IN-GAME HUD & OVERLAY MODALS
   ========================================================================== */

canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  image-rendering: auto;
  z-index: 1;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 15;
}

.center-overlay {
  position: absolute;
  inset: 0;
  z-index: 25;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 16px;
  background: rgba(8, 5, 4, 0.88);
  backdrop-filter: blur(4px);
}

.vignette, .scanlines, .scratches {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;
}
.vignette { box-shadow: inset 0 0 60px 14px rgba(8, 5, 8, 0.5); }
.scanlines { display: none; }
.scratches {
  opacity: .07;
  background: linear-gradient(90deg, transparent 0 31%, #fff3 31.2%, transparent 31.4%, transparent 66%, #fff2 66.1%, transparent 66.2%);
  animation: scratch 1.7s steps(6) infinite;
}
@keyframes scratch {
  0% { transform: translateX(0); opacity: .1; }
  30% { opacity: .22; }
  50% { transform: translateX(-38%); }
  51% { opacity: 0; }
  80% { transform: translateX(22%); opacity: .16; }
  100% { transform: translateX(-10%); opacity: .08; }
}

.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: .08;
  z-index: 50;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
  animation: grain .4s steps(2) infinite;
}
@keyframes grain {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-2%, 1%); }
  100% { transform: translate(1%, -2%); }
}

/* ── HUD ── */
.hud {
  position: absolute;
  inset: 0 0 auto;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 18px;
  pointer-events: none;
  background: linear-gradient(rgba(10, 7, 5, 0.8), transparent);
}
.hud-left {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
  flex: 1;
}
.portrait {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  transform: rotate(-3deg);
  background: var(--cream);
  border: 3px solid #000;
  color: var(--red);
  font-family: var(--font-display);
  font-size: 26px;
  box-shadow: 3px 3px 0 var(--gold);
  flex: none;
}
.health-wrap {
  width: clamp(120px, 22vw, 260px);
  min-width: 0;
  flex: 1;
  max-width: 280px;
}
.health-label {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-shadow: 1px 1px 0 #000;
  margin-bottom: 3px;
  line-height: 1.2;
}
.health-label b {
  color: var(--gold-bright);
}
.health-bar {
  height: 14px;
  padding: 2px;
  background: #000;
  border: 1px solid var(--line-bright);
  transform: skew(-8deg);
  box-shadow: 2px 2px 0 #000;
}
.health-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, var(--red-bright), var(--red));
  transition: width .2s;
}
.cards {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.cards i {
  position: relative;
  width: 16px;
  height: 22px;
  border: 2px solid #000;
  background: #2a201b;
  display: grid;
  place-items: center;
  overflow: hidden;
  transform: rotate(-4deg);
}
.cards i:nth-child(even) { transform: rotate(4deg); }
.cards i::before {
  content: "";
  position: absolute;
  inset: auto 0 0;
  height: var(--fill, 0%);
  background: var(--gold-bright);
}
.cards i.full {
  background: var(--gold-bright);
  box-shadow: 0 0 10px rgba(242, 198, 109, 0.6);
}
.cards i.full::before { display: none; }
.cards b {
  position: relative;
  font-size: 9px;
  font-weight: 900;
  color: #000;
  font-style: normal;
}
.score {
  text-align: center;
  font-family: var(--font-display);
  font-size: clamp(20px, 3.2vw, 36px);
  line-height: 0.9;
  text-shadow: 3px 3px 0 #000;
  color: var(--paper);
  flex: none;
}
.score small {
  display: block;
  color: var(--gold-bright);
  font-family: var(--font-ui);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.15em;
  margin-bottom: 2px;
}
.score .biome-sub {
  display: block;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--dim);
  margin-top: 4px;
}
.combo {
  position: absolute;
  right: 18px;
  top: 70px;
  transform: rotate(4deg);
  color: var(--gold-bright);
  font-family: var(--font-display);
  font-size: clamp(24px, 4.5vw, 40px);
  text-shadow: 3px 3px 0 #000;
  line-height: .9;
}
.combo small {
  display: block;
  font-family: var(--font-ui);
  font-size: 10px;
  letter-spacing: 0.15em;
  text-align: center;
  color: var(--paper);
  margin-top: 2px;
}
.boss-bar {
  position: absolute;
  left: 50%;
  top: 68px;
  transform: translateX(-50%);
  width: min(520px, 60vw);
  max-width: calc(100vw - 32px);
  text-align: center;
}
.boss-bar span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--red-bright);
  text-shadow: 2px 2px 0 #000;
  display: block;
}
.boss-bar div {
  margin-top: 3px;
  height: 14px;
  padding: 2px;
  background: #000;
  border: 2px solid var(--gold);
}
.boss-bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ff6b5e, var(--red));
  transition: width .15s;
}
.announce {
  position: absolute;
  left: 0;
  right: 0;
  top: 34%;
  text-align: center;
  z-index: 9;
  pointer-events: none;
  animation: announce 3s both;
  padding: 0 16px;
}
.announce small {
  display: block;
  font-size: 12px;
  letter-spacing: .3em;
  color: var(--gold);
  font-weight: 700;
  text-shadow: 2px 2px 0 #000;
  margin-bottom: 4px;
}
.announce b {
  display: block;
  font-family: var(--font-display);
  font-size: clamp(32px, 5.5vw, 68px);
  color: var(--paper);
  text-shadow: 4px 4px 0 #000, 6px 6px 0 var(--red-deep);
  line-height: .95;
}
@keyframes announce {
  0% { opacity: 0; transform: scale(.7) rotate(-3deg); }
  12% { opacity: 1; transform: scale(1.05) rotate(1deg); }
  20% { transform: scale(1) rotate(0); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-20px); }
}

.weapon-switch {
  position: absolute;
  z-index: 11;
  left: 16px;
  bottom: 16px;
  min-width: min(250px, 48vw);
  max-width: min(320px, 62vw);
  height: 52px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  color: var(--card-ink);
  background: var(--cream);
  border: 3px solid #000;
  box-shadow: 4px 4px 0 #000;
  cursor: pointer;
  text-align: left;
  transform: rotate(-1deg);
}
.weapon-switch svg {
  width: 38px;
  height: 28px;
  fill: var(--red);
  stroke: #000;
  stroke-width: 2.5;
  stroke-linejoin: round;
  flex: none;
}
.weapon-switch span {
  display: flex;
  flex: 1;
  flex-direction: column;
  font-family: var(--font-display);
  font-size: 14px;
  text-transform: uppercase;
  line-height: 1.1;
  min-width: 0;
  overflow: hidden;
}
.weapon-switch small {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--gold-deep);
}
.dash-ind {
  position: relative;
  padding: 5px 8px;
  border: 2px solid #000;
  background: var(--panel-3);
  color: var(--paper);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  overflow: hidden;
  flex: none;
}
.dash-ind::before {
  content: "";
  position: absolute;
  inset: 0;
  width: var(--cd, 100%);
  background: rgba(110, 224, 138, 0.4);
}
.charge-ind {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8px;
  height: 6px;
  background: #000;
  border: 1px solid var(--line-bright);
}
.charge-ind i {
  display: block;
  height: 100%;
  background: var(--gold-bright);
}

.hud-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.fps {
  font-size: 11px;
  letter-spacing: .08em;
  color: var(--faint);
  text-shadow: 1px 1px 0 #000;
}
.buffs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.buff {
  padding: 3px 8px;
  border: 1px solid var(--line-bright);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  background: var(--panel);
  color: var(--paper);
}

/* ── MOBILE CONTROLS ── */
.mobile-controls {
  position: absolute;
  inset: auto 0 16px;
  padding: 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  z-index: 12;
  pointer-events: none;
}
.joystick, .act {
  pointer-events: auto;
  touch-action: none;
}
.joystick {
  width: clamp(84px, 18vw, 110px);
  height: clamp(84px, 18vw, 110px);
  border: 3px solid var(--line-bright);
  border-radius: 50%;
  background: rgba(10, 7, 5, 0.6);
  display: grid;
  place-items: center;
  margin-bottom: 24px;
}
.joystick i {
  width: clamp(36px, 8vw, 48px);
  height: clamp(36px, 8vw, 48px);
  border-radius: 50%;
  background: var(--cream);
  border: 3px solid #000;
  box-shadow: 2px 3px 0 #000;
}
.action-cluster {
  position: relative;
  width: clamp(190px, 50vw, 250px);
  height: clamp(140px, 34vw, 190px);
  flex: none;
}
.act {
  position: absolute;
  width: clamp(46px, 11vw, 62px);
  height: clamp(46px, 11vw, 62px);
  border-radius: 50%;
  border: 3px solid #000;
  color: var(--paper);
  box-shadow: 3px 4px 0 #000;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  display: grid;
  place-items: center;
  text-align: center;
  line-height: 1.1;
}
.act:active {
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0 #000;
}
.act.dash { right: 48%; bottom: 4%; background: #2a6fb8; }
.act.parry { right: 48%; bottom: 42%; background: #d6338f; }
.act.ex { right: 74%; bottom: 22%; background: #6b4fbf; }
.act.ex.ready { background: var(--gold); color: #000; box-shadow: 0 0 16px var(--gold-bright); }
.act.auto-toggle { right: 76%; bottom: 60%; width: 42px; height: 42px; background: var(--panel-3); font-size: 8px; }
.act.auto-toggle.on { background: #3d8b4e; color: #fff; }
.act.super { right: 2%; bottom: 64%; width: 68px; height: 36px; border-radius: 6px; background: var(--gold-bright); color: #000; font-size: 10px; }

/* ── MODALS: PAUSE, UPGRADE, GAMEOVER, CRASH, CUTSCENE ── */
.pause-panel, .upgrade-panel, .letter {
  width: min(560px, 94vw);
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 24px;
  background: var(--panel);
  color: var(--paper);
  border: 3px solid var(--line-bright);
  box-shadow: var(--shadow-hard);
  text-align: center;
}
.pause-panel h2, .upgrade-panel h2, .letter h2 {
  font-family: var(--font-display);
  font-size: clamp(32px, 5vw, 56px);
  color: var(--paper);
  margin: 4px 0 16px;
  line-height: 1;
}
.kicker {
  display: block;
  font-family: var(--font-ui);
  color: var(--gold);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin-bottom: 4px;
}
.build-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line-bright);
  margin-bottom: 16px;
}
.build-row small { font-size: 11px; color: var(--gold); font-weight: 700; letter-spacing: 0.08em; }
.build-row b { font-size: 16px; }
.build-row span { font-size: 13px; color: var(--dim); font-style: italic; }
.build-row em { font-size: 12px; color: var(--gold-bright); font-style: normal; margin-top: 4px; }

.opts-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--gold);
  margin: 16px 0 8px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 4px;
}
.opts-head small { font-size: 11px; color: var(--dim); font-style: italic; }
.opts-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.keys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
  margin: 10px 0;
}
.keybtn {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  background: var(--panel-3);
  border: 1px solid var(--line-bright);
  color: var(--paper);
  cursor: pointer;
  text-align: center;
}
.keybtn small { font-size: 10px; color: var(--dim); font-weight: 700; letter-spacing: 0.08em; }
.keybtn b { font-size: 13px; color: var(--gold-bright); }
.keybtn.binding { border-color: var(--red-bright); background: var(--red-deep); }

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 16px 0;
}
.upgrade-list button {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  background: var(--panel-2);
  border: 2px solid var(--line-bright);
  color: var(--paper);
  text-align: left;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease;
}
.upgrade-list button:hover {
  border-color: var(--gold-bright);
  transform: translateY(-2px);
}
.upgrade-list button b {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--gold);
}
.upgrade-list strong {
  display: block;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.upgrade-list small {
  font-size: 13px;
  color: var(--dim);
}
.upgrade-list i {
  font-style: normal;
  font-size: 14px;
  font-weight: 700;
  color: var(--gold-bright);
}

.pause-panel.gameover {
  border-color: var(--red-bright);
}
.taken, .fell {
  font-size: 14px;
  color: var(--dim);
  margin-bottom: 6px;
}
.taken b, .fell b {
  color: var(--red-bright);
}
.grade {
  display: inline-grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin: 10px auto;
  font-family: var(--font-display);
  font-size: 32px;
  background: var(--red);
  color: var(--paper);
  border: 3px solid #000;
  outline: 2px solid var(--gold);
}
.final-score {
  font-family: var(--font-display);
  font-size: clamp(28px, 4.5vw, 44px);
  color: var(--gold-bright);
  line-height: 1;
  margin: 8px 0;
}
.final-score small {
  display: block;
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--dim);
  letter-spacing: 0.15em;
}
.final-score span {
  display: block;
  font-family: var(--font-ui);
  font-size: 13px;
  color: var(--dim);
  margin-top: 4px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 14px 0;
  padding: 12px;
  background: var(--panel-2);
  border: 1px solid var(--line);
}
.stat-grid > div {
  text-align: center;
}
.stat-grid b {
  display: block;
  font-size: 17px;
  color: var(--gold-bright);
}
.stat-grid small {
  font-size: 10px;
  color: var(--dim);
  letter-spacing: 0.08em;
}

.daily-badge, .vault-run-banner {
  padding: 8px 12px;
  background: var(--panel-3);
  border: 1px solid var(--gold);
  color: var(--gold-bright);
  font-weight: 700;
  font-size: 13px;
  margin: 10px 0;
}
.vault-run-banner {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.vault-run-banner small {
  font-size: 11px;
  color: var(--dim);
}

.leaderboard-submit-box {
  margin: 14px 0;
}
.board-submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--red);
  color: var(--paper);
  border: 2px solid var(--red-bright);
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.submit-success {
  color: var(--gold-bright);
  font-weight: 700;
}
.submit-error {
  color: var(--red-bright);
}

.text-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: var(--panel-2);
  border: 1px solid var(--line-bright);
  color: var(--paper);
  cursor: pointer;
  margin: 4px;
}
.text-btn:hover {
  background: var(--panel-3);
  border-color: var(--gold);
}
.text-btn.restart {
  background: var(--red-deep);
  border-color: var(--red-bright);
}

.cutscene-overlay {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: radial-gradient(circle at 50% 35%, rgba(45, 20, 30, 0.95), rgba(10, 7, 5, 0.98) 72%);
}
.cutscene-card {
  width: min(620px, 92%);
  padding: 32px 24px;
  color: var(--paper);
  text-align: center;
  border: 3px solid var(--gold);
  background: var(--panel);
  box-shadow: var(--shadow-hard);
}
.cutscene-card h2 {
  margin: 12px 0;
  font-family: var(--font-display);
  font-size: clamp(34px, 6vw, 64px);
  color: var(--paper);
  line-height: .9;
}
.cutscene-card h2 em {
  color: var(--red-bright);
  font-style: normal;
}
.cutscene-card p {
  max-width: 480px;
  margin: 0 auto 18px;
  color: var(--dim);
  font-style: italic;
  font-size: 15px;
}
.cutscene-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}
.cutscene-skip {
  padding: 10px 20px;
  font-weight: 700;
  background: var(--panel-2);
  border: 1px solid var(--line-bright);
  color: var(--paper);
  cursor: pointer;
}

.opt-sect {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--gold);
  margin-top: 10px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 2px;
}
.opt-hint {
  font-size: 12px;
  color: var(--dim);
  font-style: italic;
  margin: 4px 0 8px;
}
.style-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin: 8px 0;
}
.style-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--panel-3);
  border: 1px solid var(--line-bright);
  color: var(--paper);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}
.style-btn i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #000;
}
.style-btn.on {
  border-color: var(--gold-bright);
  background: var(--red-deep);
}
.look-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 6px 0;
}
.look-row span {
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
  margin-right: 4px;
}
.look-row button {
  padding: 6px 10px;
  background: var(--panel-3);
  border: 1px solid var(--line-bright);
  color: var(--paper);
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
}
.look-row button.on {
  background: var(--gold);
  color: #000;
}
.pad-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  margin: 8px 0;
  font-size: 11px;
}
.pad-row small {
  color: var(--gold);
  font-weight: 700;
}
.pad-row b.on {
  color: #6fe08a;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--dim);
}
.toggle input {
  accent-color: var(--gold);
  width: 16px;
  height: 16px;
}

/* Fix board styling */
.rr-board-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rr-player-tag-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--line-bright);
}
.rr-player-tag-box small {
  color: var(--gold);
  font-weight: 700;
  font-size: 12px;
}
.rr-tag-display-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rr-tag-display-row b {
  font-size: 16px;
  color: var(--paper);
}
.rr-tag-display-row button {
  padding: 4px 8px;
  background: var(--panel-3);
  border: 1px solid var(--line-bright);
  color: var(--gold-bright);
  font-size: 11px;
}
.rr-board-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.rr-filter-btn {
  padding: 8px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line-bright);
  color: var(--dim);
  font-size: 12px;
  font-weight: 700;
}
.rr-filter-btn.on {
  background: var(--red);
  color: var(--paper);
  border-color: var(--red-bright);
}
.rr-board-table-wrap {
  overflow-x: auto;
}
.rr-board-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}
.rr-board-table th, .rr-board-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}
.rr-board-table th {
  background: var(--panel-3);
  color: var(--gold);
  font-weight: 700;
  letter-spacing: 0.06em;
}
.rr-board-table tr:hover {
  background: var(--panel-2);
}
.rr-board-table tr.highlight {
  background: rgba(229, 50, 62, 0.15);
}
.rr-board-empty {
  text-align: center;
  color: var(--dim);
  padding: 24px;
  font-style: italic;
}
.rr-setup-card {
  padding: 16px;
  background: var(--panel-2);
  border: 1px solid var(--gold);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rr-setup-kicker {
  color: var(--gold);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.1em;
}
.rr-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rr-input-wrap label {
  font-size: 11px;
  font-weight: 700;
  color: var(--dim);
}
.rr-input-wrap input {
  padding: 8px 10px;
  background: var(--panel-3);
  border: 1px solid var(--line-bright);
  color: var(--paper);
}
.rr-connect-btn {
  padding: 10px;
  background: var(--red);
  color: var(--paper);
  font-weight: 700;
  border: 1px solid var(--red-bright);
  cursor: pointer;
}
.rr-conn-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  font-size: 12px;
  font-weight: 700;
}
.rr-conn-bar.online { color: #6fe08a; }
.rr-conn-bar.offline { color: var(--dim); }
.rr-mini-btn {
  padding: 5px 10px;
  background: var(--panel-3);
  border: 1px solid var(--line-bright);
  color: var(--gold-bright);
  font-size: 11px;
  cursor: pointer;
}
.rr-vault-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rr-vault-balance-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--panel);
  border: 2px solid var(--gold);
  flex-wrap: wrap;
  gap: 16px;
}
.rr-vault-big-amt {
  font-family: var(--font-display);
  font-size: 38px;
  color: var(--gold-bright);
  line-height: 1;
}
.rr-vault-sub-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--dim);
}
.rr-vault-sub-stats b {
  color: var(--paper);
}
.rr-vault-history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rr-tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--panel);
  border: 1px solid var(--line);
}
.rr-tx-desc {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rr-tx-desc b {
  font-size: 14px;
  color: var(--paper);
}
.rr-tx-desc small {
  font-size: 11px;
  color: var(--dim);
}
.rr-tx-amount {
  font-size: 16px;
  font-weight: 700;
}
.rr-tx-amount.pos { color: #6fe08a; }
.rr-tx-amount.neg { color: var(--red-bright); }
`;

const combined = '@import "tailwindcss";\n\n' + newUiCss + '\n\n' + runtimeCss;
fs.writeFileSync(path.resolve("src/index.css"), combined, "utf8");
console.log("src/index.css created successfully.");
