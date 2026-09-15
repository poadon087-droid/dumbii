/** Run-end achievements. Pure evaluation over a finished GameState. */
import type { GameState } from "./types";

/** Achievement definitions — evaluated once per finished run. */
export type AchievementDef = { id: string; name: string; desc: string; check: (g: GameState) => boolean };
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "boss1", name: "Ringmaster Down", desc: "Beat any boss", check: (g) => g.bossesBeaten >= 1 },
  { id: "parry50", name: "Sugar Rush", desc: "Parry 50 shots in one run", check: (g) => g.parries >= 50 },
  { id: "combo30", name: "Showstopper", desc: "Reach a 30-hit combo", check: (g) => g.maxCombo >= 30 },
  { id: "rich", name: "Penny Pincher", desc: "Bank 400 coins in one run", check: (g) => g.player.coins >= 400 },
];
export const earnedAchievements = (g: GameState): string[] => ACHIEVEMENTS.filter((a) => a.check(g)).map((a) => a.id);
