/**
 * Run state — everything that persists across the build/combat/reward loop of a
 * single run. Built from the selected chassis and the player's meta upgrades.
 */

import { Grid } from "./grid";
import { CHASSIS } from "./chassis";
import type { MetaSave } from "./meta";
import type { DailyModifier } from "./daily";

export interface WaveDef {
  duration: number;
  spawns: Array<[string, number]>;
  boss?: string;
  label: string;
}

export const WAVES: WaveDef[] = [
  // ---- Sector 1 ----
  { duration: 28, label: "Sector 1 · Wave 1", spawns: [["rusher", 1.1]] },
  { duration: 32, label: "Sector 1 · Wave 2", spawns: [["rusher", 1.3], ["grunt", 0.4]] },
  { duration: 55, label: "Sector 1 · RECLAIMER", spawns: [["rusher", 0.8]], boss: "reclaimer" },
  // ---- Sector 2 ----
  { duration: 34, label: "Sector 2 · Wave 4", spawns: [["grunt", 0.7], ["spitter", 0.35]] },
  {
    duration: 38,
    label: "Sector 2 · Wave 5",
    spawns: [["rusher", 1.1], ["brood", 0.35], ["tank", 0.16]],
  },
  {
    duration: 58,
    label: "Sector 2 · HARVESTER",
    spawns: [["spitter", 0.3], ["rusher", 0.6]],
    boss: "harvester",
  },
  // ---- Sector 3 ----
  {
    duration: 42,
    label: "Sector 3 · Wave 7",
    spawns: [["rusher", 1.0], ["grunt", 0.5], ["spitter", 0.35], ["brood", 0.25], ["tank", 0.12]],
  },
  {
    duration: 70,
    label: "Sector 3 · THE OVERMIND",
    spawns: [["rusher", 0.7], ["spitter", 0.25]],
    boss: "overmind",
  },
];

export class RunState {
  grid: Grid;
  hp: number;
  maxHp: number;
  salvage: number;
  waveIndex: number;
  inventory: string[];
  chassisId: string;
  daily: boolean;
  modifier?: DailyModifier;

  constructor(meta: MetaSave, modifier?: DailyModifier, chassisId?: string) {
    const chassis = CHASSIS[chassisId ?? meta.selectedChassis] ?? CHASSIS.scrapheap;
    this.chassisId = chassis.id;
    this.daily = !!modifier;
    this.modifier = modifier;

    // Expanded-Chassis upgrade unlocks the first N locked cells.
    const locked = chassis.locked.slice(meta.upgrades.reactor);
    this.grid = new Grid(chassis.cols, chassis.rows, locked, chassis.mods);

    this.maxHp = Math.round((chassis.baseHp + meta.upgrades.hull * 25) * (modifier?.hpMult ?? 1));
    this.hp = this.maxHp;
    this.salvage = meta.upgrades.magnet * 2;
    this.waveIndex = 0;
    this.inventory = [...chassis.startInventory];

    for (const [x, y, id] of chassis.start) this.grid.place(x, y, id);
  }

  get isLastWave(): boolean {
    return this.waveIndex >= WAVES.length - 1;
  }

  get currentWave(): WaveDef {
    return WAVES[this.waveIndex];
  }
}
