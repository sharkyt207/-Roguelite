/**
 * Chassis definitions (Block B) — the "characters" of Grid-Forge. Each chassis
 * defines the grid, which cells start locked, the starter loadout and a
 * distinctive rule/modifier that shapes how you build.
 */

export interface ChassisDef {
  id: string;
  name: string;
  cols: number;
  rows: number;
  /** Cells that start locked (may be unlocked by the Expanded Chassis meta upgrade). */
  locked: Array<[number, number]>;
  /** Components pre-placed at run start: [x, y, defId]. */
  start: Array<[number, number, string]>;
  startInventory: string[];
  baseHp: number;
  /** Flat multipliers applied to every resolved weapon + movement. */
  mods: { damageMult?: number; fireRateMult?: number; rangeAdd?: number; moveSpeedMult?: number };
  desc: string;
  cost: number; // meta cost to unlock (0 = starter)
}

export const CHASSIS: Record<string, ChassisDef> = {
  scrapheap: {
    id: "scrapheap",
    name: "Scrapheap",
    cols: 5,
    rows: 5,
    locked: [
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
    ],
    start: [
      [2, 2, "reactor_core"],
      [2, 1, "rivet_gun"],
    ],
    startInventory: ["flak_pod", "ember_cell", "conduit"],
    baseHp: 100,
    mods: {},
    desc: "Balanced all-rounder. Four corner cells unlock via the Workshop.",
    cost: 0,
  },
  lattice: {
    id: "lattice",
    name: "Lattice",
    cols: 5,
    rows: 5,
    // Cross layout: corners AND edge-mids locked → forces tight, connected builds.
    locked: [
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
      [0, 1],
      [1, 0],
    ],
    start: [
      [2, 2, "reactor_core"],
      [2, 1, "arc_coil"],
    ],
    startInventory: ["conduit", "conduit", "targeting_chip"],
    baseHp: 85,
    mods: { fireRateMult: 1.15 },
    desc: "Fragile but fast: +15% fire rate. Extra conduits reward clever routing.",
    cost: 12,
  },
  bulwark: {
    id: "bulwark",
    name: "Bulwark",
    cols: 5,
    rows: 5,
    locked: [
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
      [2, 0],
    ],
    start: [
      [2, 2, "reactor_core"],
      [2, 1, "mortar"],
      [1, 2, "amplifier"],
    ],
    startInventory: ["rivet_gun", "conduit"],
    baseHp: 150,
    mods: { damageMult: 1.1, fireRateMult: 0.92 },
    desc: "Heavy frame: +50 integrity, +10% damage, slightly slower fire.",
    cost: 16,
  },
  sentinel: {
    id: "sentinel",
    name: "Sentinel",
    cols: 5,
    rows: 5,
    locked: [
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
    ],
    start: [
      [2, 2, "reactor_core"],
      [2, 1, "rivet_gun"],
      [3, 2, "targeting_chip"],
    ],
    startInventory: ["conduit", "focus_array"],
    baseHp: 110,
    mods: { rangeAdd: 70 },
    desc: "Long-range specialist: +70 weapon range. Pick off enemies early.",
    cost: 20,
  },
  nomad: {
    id: "nomad",
    name: "Nomad",
    cols: 5,
    rows: 5,
    locked: [
      [0, 0],
      [4, 0],
      [0, 4],
      [4, 4],
    ],
    start: [
      [2, 2, "reactor_core"],
      [2, 1, "flak_pod"],
    ],
    startInventory: ["rivet_gun", "conduit", "targeting_chip"],
    baseHp: 90,
    mods: { moveSpeedMult: 1.3 },
    desc: "Hit-and-run: +30% movement speed, lighter frame. Kiting is king.",
    cost: 22,
  },
};

export const CHASSIS_LIST = Object.values(CHASSIS);
