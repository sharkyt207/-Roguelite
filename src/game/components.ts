/**
 * Component catalogue — the building blocks placed on the Forge grid.
 *
 * Four categories:
 *  - weapon  : auto-fires in combat.
 *  - support : modifies orthogonally-adjacent powered weapons (the synergy layer).
 *  - core    : a power source; powers its 4 neighbours.
 *  - conduit : when powered, extends power to its neighbours (routing puzzle).
 *
 * Adjacency + power routing is what turns "an inventory" into "a spatial puzzle".
 */

import type { ElementId, Rarity } from "../core/theme";

export type Category = "weapon" | "support" | "core" | "conduit";

export interface WeaponStats {
  damage: number;
  /** Shots per second. */
  fireRate: number;
  /** Targeting range in px. */
  range: number;
  projectileSpeed: number;
  /** Projectiles per shot (spread). */
  projectiles: number;
  /** Volt chain jumps. */
  chain: number;
  /** Splash radius (0 = single target). */
  aoe: number;
  /** Projectile pierces this many enemies. */
  pierce: number;
}

export interface SupportMods {
  damageMult?: number;
  fireRateMult?: number;
  /** Overrides the weapon's element for VFX + effect. */
  injectElement?: ElementId;
  /** Ember: burn damage-per-second added for 3s. */
  burn?: number;
  /** Frost: movement slow factor (0..1) applied to hit enemies. */
  slow?: number;
  /** Range added in px. */
  rangeAdd?: number;
}

export interface ComponentDef {
  id: string;
  name: string;
  category: Category;
  rarity: Rarity;
  element: ElementId;
  desc: string;
  weapon?: WeaponStats;
  support?: SupportMods;
  /** Weight in the reward draft pool (higher = more common). */
  weight: number;
}

const W = (s: Partial<WeaponStats>): WeaponStats => ({
  damage: 8,
  fireRate: 2,
  range: 260,
  projectileSpeed: 520,
  projectiles: 1,
  chain: 0,
  aoe: 0,
  pierce: 0,
  ...s,
});

export const COMPONENTS: Record<string, ComponentDef> = {
  // ---- Cores & routing -------------------------------------------------
  reactor_core: {
    id: "reactor_core",
    name: "Reactor Core",
    category: "core",
    rarity: "common",
    element: "kinetic",
    desc: "Powers the 4 adjacent cells. Weapons must be powered to fire.",
    weight: 3,
  },
  conduit: {
    id: "conduit",
    name: "Conduit",
    category: "conduit",
    rarity: "common",
    element: "kinetic",
    desc: "When powered, extends power to its neighbours. Route power to distant weapons.",
    weight: 6,
  },

  // ---- Weapons ---------------------------------------------------------
  rivet_gun: {
    id: "rivet_gun",
    name: "Rivet Gun",
    category: "weapon",
    rarity: "common",
    element: "kinetic",
    desc: "Reliable single-target bolts.",
    weapon: W({ damage: 8, fireRate: 3, range: 270 }),
    weight: 6,
  },
  flak_pod: {
    id: "flak_pod",
    name: "Flak Pod",
    category: "weapon",
    rarity: "common",
    element: "kinetic",
    desc: "Short-range spread of 4 pellets. Great against swarms.",
    weapon: W({ damage: 4, fireRate: 1.6, range: 170, projectiles: 4, projectileSpeed: 440 }),
    weight: 5,
  },
  arc_coil: {
    id: "arc_coil",
    name: "Arc Coil",
    category: "weapon",
    rarity: "uncommon",
    element: "volt",
    desc: "Lightning that chains to 2 extra enemies.",
    weapon: W({ damage: 6, fireRate: 2, range: 240, chain: 2, projectileSpeed: 760 }),
    weight: 4,
  },
  mortar: {
    id: "mortar",
    name: "Salvo Mortar",
    category: "weapon",
    rarity: "uncommon",
    element: "ember",
    desc: "Slow, heavy shells that explode on impact.",
    weapon: W({ damage: 16, fireRate: 0.7, range: 300, aoe: 70, projectileSpeed: 360 }),
    weight: 3,
  },
  rail_lance: {
    id: "rail_lance",
    name: "Rail Lance",
    category: "weapon",
    rarity: "rare",
    element: "kinetic",
    desc: "Long-range piercing shot that punches through a line of enemies.",
    weapon: W({ damage: 24, fireRate: 0.9, range: 460, pierce: 4, projectileSpeed: 980 }),
    weight: 2,
  },

  // ---- Support ---------------------------------------------------------
  ember_cell: {
    id: "ember_cell",
    name: "Ember Cell",
    category: "support",
    rarity: "common",
    element: "ember",
    desc: "Adjacent weapons ignite enemies (burn over time).",
    support: { injectElement: "ember", burn: 7 },
    weight: 5,
  },
  cryo_cell: {
    id: "cryo_cell",
    name: "Cryo Cell",
    category: "support",
    rarity: "common",
    element: "frost",
    desc: "Adjacent weapons chill enemies, slowing them.",
    support: { injectElement: "frost", slow: 0.45 },
    weight: 5,
  },
  amplifier: {
    id: "amplifier",
    name: "Amplifier",
    category: "support",
    rarity: "uncommon",
    element: "kinetic",
    desc: "Adjacent weapons deal +40% damage.",
    support: { damageMult: 1.4 },
    weight: 4,
  },
  targeting_chip: {
    id: "targeting_chip",
    name: "Targeting Chip",
    category: "support",
    rarity: "uncommon",
    element: "kinetic",
    desc: "Adjacent weapons fire 50% faster.",
    support: { fireRateMult: 1.5 },
    weight: 4,
  },
  overclocker: {
    id: "overclocker",
    name: "Overclocker",
    category: "support",
    rarity: "rare",
    element: "volt",
    desc: "Adjacent weapons: +30% damage and +30% fire rate.",
    support: { damageMult: 1.3, fireRateMult: 1.3 },
    weight: 2,
  },
};

export const COMPONENT_LIST = Object.values(COMPONENTS);

/** The draftable pool (everything except the guaranteed starter core). */
export const DRAFT_POOL = COMPONENT_LIST.filter((c) => c.id !== "reactor_core");
