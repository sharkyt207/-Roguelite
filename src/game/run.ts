/**
 * Run state — everything that persists across the build/combat/reward loop of a
 * single run. Built from the selected chassis and the player's meta upgrades.
 */

import { Grid } from "./grid";
import { CHASSIS } from "./chassis";
import type { MetaSave } from "./meta";

export interface WaveDef {
  duration: number;
  spawns: Array<[string, number]>;
  boss?: string;
  label: string;
}

export const WAVES: WaveDef[] = [
  { duration: 30, label: "Sector 1 · Wave 1", spawns: [["rusher", 1.1]] },
  { duration: 34, label: "Sector 1 · Wave 2", spawns: [["rusher", 1.3], ["grunt", 0.4]] },
  { duration: 38, label: "Sector 2 · Wave 3", spawns: [["rusher", 1.4], ["grunt", 0.7]] },
  {
    duration: 42,
    label: "Sector 2 · Wave 4",
    spawns: [["rusher", 1.6], ["grunt", 0.9], ["tank", 0.18]],
  },
  {
    duration: 60,
    label: "Sector 3 · BOSS",
    spawns: [["rusher", 1.0], ["grunt", 0.5]],
    boss: "boss",
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

  constructor(meta: MetaSave) {
    const chassis = CHASSIS[meta.selectedChassis] ?? CHASSIS.scrapheap;
    this.chassisId = chassis.id;

    // Expanded-Chassis upgrade unlocks the first N locked cells.
    const locked = chassis.locked.slice(meta.upgrades.reactor);
    this.grid = new Grid(chassis.cols, chassis.rows, locked, chassis.mods);

    this.maxHp = chassis.baseHp + meta.upgrades.hull * 25;
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
