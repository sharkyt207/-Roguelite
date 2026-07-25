/**
 * Run state — everything that persists across the build/combat/reward loop of a
 * single run. Reset when a new run begins.
 */

import { Grid } from "./grid";

export interface WaveDef {
  duration: number; // seconds
  /** Enemy spawn table: [enemyId, per-second rate]. */
  spawns: Array<[string, number]>;
  boss?: string;
  label: string;
}

/** Vertical-slice wave progression (3 sectors compressed into 5 waves). */
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
  /** Drafted components not yet placed on the grid. */
  inventory: string[];

  constructor() {
    this.grid = new Grid(5, 5, [
      // A few starter-locked cells (unlockable via meta later).
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
    ]);
    this.maxHp = 100;
    this.hp = 100;
    this.salvage = 0;
    this.waveIndex = 0;
    this.inventory = [];

    // Starter kit: a core + first weapon placed, plus pieces to teach placement.
    this.grid.place(2, 2, "reactor_core");
    this.grid.place(2, 1, "rivet_gun");
    this.inventory.push("flak_pod", "ember_cell", "conduit");
  }

  get isLastWave(): boolean {
    return this.waveIndex >= WAVES.length - 1;
  }

  get currentWave(): WaveDef {
    return WAVES[this.waveIndex];
  }
}
