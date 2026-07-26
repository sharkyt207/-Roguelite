/**
 * Achievements — persistent long-term goals that grant Cores once, checked at
 * the end of every run. Purely additive meta motivation.
 */

import type { MetaSave } from "./meta";
import type { RunState } from "./run";
import { CHASSIS_LIST } from "./chassis";

export interface AchContext {
  meta: MetaSave;
  run: RunState;
  won: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  cores: number;
  check: (c: AchContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_forge", name: "First Forge", desc: "Win a run (clear all 3 sectors).", cores: 12, check: (c) => c.won },
  { id: "veteran", name: "Veteran", desc: "Win 5 runs.", cores: 25, check: (c) => c.meta.stats.wins >= 5 },
  { id: "the_deep", name: "Into the Deep", desc: "Reach Depth 5 in endless mode.", cores: 15, check: (c) => c.meta.stats.bestDepth >= 5 },
  { id: "abyssal", name: "Abyssal", desc: "Reach Depth 12.", cores: 30, check: (c) => c.meta.stats.bestDepth >= 12 },
  { id: "engineer", name: "Engineer", desc: "Unlock 5 blueprints.", cores: 15, check: (c) => c.meta.unlockedBlueprints.length >= 5 },
  { id: "overkill", name: "Overkill", desc: "Deal 200+ damage in a single hit.", cores: 12, check: (c) => c.run.maxHit >= 200 },
  { id: "hoard", name: "Hoarder", desc: "Collect 200 salvage in one run.", cores: 15, check: (c) => c.run.salvage >= 200 },
  { id: "daily_grind", name: "Daily Grind", desc: "Finish a Daily Run.", cores: 10, check: (c) => c.run.daily },
  { id: "tycoon", name: "Tycoon", desc: "Reach 150 total Cores.", cores: 0, check: (c) => c.meta.cores >= 150 },
  { id: "armory", name: "Full Armory", desc: "Unlock every chassis.", cores: 25, check: (c) => c.meta.unlockedChassis.length >= CHASSIS_LIST.length },
];

/**
 * Evaluate all achievements, unlock newly-earned ones, grant their Cores, and
 * return the list of newly unlocked achievements (for a toast).
 */
export function checkAchievements(ctx: AchContext): Achievement[] {
  const owned = new Set(ctx.meta.achievements);
  const newly: Achievement[] = [];
  for (const a of ACHIEVEMENTS) {
    if (owned.has(a.id)) continue;
    if (a.check(ctx)) {
      ctx.meta.achievements.push(a.id);
      ctx.meta.cores += a.cores;
      newly.push(a);
    }
  }
  return newly;
}
