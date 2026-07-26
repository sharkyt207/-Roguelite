/**
 * Meta progression — persistent state between runs (Block B).
 *
 * Stored in localStorage. Kept horizontal on purpose: meta unlocks *options*
 * (cells, chassis, blueprints) and modest survivability, never raw in-run power
 * that would trivialise the build puzzle.
 */

const SAVE_KEY = "gridforge.save.v2";

export interface UpgradeDef {
  id: keyof MetaSave["upgrades"];
  name: string;
  desc: (level: number) => string;
  maxLevel: number;
  cost: (level: number) => number;
}

export interface MetaSave {
  cores: number;
  upgrades: {
    hull: number; // +max integrity
    reactor: number; // unlock locked cells
    magnet: number; // +starting salvage
  };
  unlockedChassis: string[];
  selectedChassis: string;
  unlockedBlueprints: string[];
  muted: boolean;
  seenTutorial: boolean;
  daily: { date: string; bestWave: number; won: boolean } | null;
  stats: { runs: number; wins: number; bestWave: number; bestDepth: number };
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "hull",
    name: "Reinforced Hull",
    desc: (l) => `Max Integrity +${l * 25} (next +25)`,
    maxLevel: 4,
    cost: (l) => 3 + l * 3,
  },
  {
    id: "reactor",
    name: "Expanded Chassis",
    desc: (l) => `Unlocks ${l} locked cell(s) (next +1)`,
    maxLevel: 4,
    cost: (l) => 4 + l * 4,
  },
  {
    id: "magnet",
    name: "Salvage Magnet",
    desc: (l) => `+${l * 2} starting salvage (next +2)`,
    maxLevel: 5,
    cost: (l) => 2 + l * 2,
  },
];

/** Blueprints that must be unlocked before they appear in the draft pool. */
export const BLUEPRINTS: Array<{ id: string; cost: number }> = [
  { id: "rail_lance", cost: 8 },
  { id: "overclocker", cost: 8 },
  { id: "catalyst", cost: 10 },
  { id: "splitter", cost: 10 },
  { id: "flamethrower", cost: 12 },
  { id: "singularity_core", cost: 22 },
  { id: "fusion_core", cost: 20 },
  { id: "prism_lens", cost: 24 },
  { id: "twin_loader", cost: 22 },
  { id: "siege_frame", cost: 24 },
];

export function defaultSave(): MetaSave {
  return {
    cores: 0,
    upgrades: { hull: 0, reactor: 0, magnet: 0 },
    unlockedChassis: ["scrapheap"],
    selectedChassis: "scrapheap",
    unlockedBlueprints: [],
    muted: false,
    seenTutorial: false,
    daily: null,
    stats: { runs: 0, wins: 0, bestWave: 0, bestDepth: 0 },
  };
}

export function loadMeta(): MetaSave {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<MetaSave>;
    const base = defaultSave();
    return {
      ...base,
      ...parsed,
      upgrades: { ...base.upgrades, ...parsed.upgrades },
      stats: { ...base.stats, ...parsed.stats },
    };
  } catch {
    return defaultSave();
  }
}

export function saveMeta(meta: MetaSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(meta));
  } catch {
    /* storage unavailable (private mode) — run is still playable, just not saved */
  }
}
