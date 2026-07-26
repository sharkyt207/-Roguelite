/**
 * Daily Run (Block 4) — a deterministic run of the day: the same seed and
 * modifier for everyone on a given date. Built on our seedable RNG.
 */

import type { ElementId } from "../core/theme";

export interface DailyModifier {
  id: string;
  name: string;
  desc: string;
  hpMult?: number;
  salvageMult?: number;
  spawnRateMult?: number;
  enemyHpMult?: number;
  overchargeMult?: number;
  fireRateMult?: number;
  forceElement?: ElementId;
}

export const MODIFIERS: DailyModifier[] = [
  { id: "swarm", name: "Swarm", desc: "50% more enemies spawn.", spawnRateMult: 1.5, salvageMult: 1.2 },
  { id: "glass", name: "Glass Cannon", desc: "Half integrity, double salvage.", hpMult: 0.5, salvageMult: 2 },
  { id: "inferno", name: "Inferno", desc: "All weapons ignite (burn).", forceElement: "ember" },
  { id: "supercharge", name: "Supercharge", desc: "Overcharge builds twice as fast.", overchargeMult: 2 },
  { id: "elite", name: "Elite Forces", desc: "Enemies +35% HP, +60% salvage.", enemyHpMult: 1.35, salvageMult: 1.6 },
  { id: "blitz", name: "Blitz", desc: "All weapons fire 30% faster.", fireRateMult: 1.3 },
];

/** Local date string YYYY-MM-DD (the daily key). */
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Stable 32-bit hash of a string (FNV-1a). */
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function dailyFor(key = todayKey()): { seed: number; modifier: DailyModifier } {
  const seed = hash(key);
  return { seed, modifier: MODIFIERS[seed % MODIFIERS.length] };
}
