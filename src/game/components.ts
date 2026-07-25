/**
 * Component catalogue — the building blocks placed on the Forge grid.
 *
 * Four categories:
 *  - weapon  : auto-fires in combat.
 *  - support : modifies orthogonally-adjacent powered weapons (the synergy layer).
 *  - core    : a power source; powers its 4 neighbours.
 *  - conduit : when powered, extends power to its neighbours (routing puzzle).
 *
 * Build depth (Block A) comes from three stacking layers:
 *  1. Support → weapon adjacency (element injection, damage, fire rate, crit).
 *  2. Support → support amplification (Resonator boosts adjacent supports).
 *  3. Line sets (3+ weapons in a powered row/column gain an Array bonus) and
 *     elemental reactions resolved in combat (chill amplifies, burn+volt detonates).
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
  /** Projectiles per shot. */
  projectiles: number;
  /** Total spread angle in radians across the projectiles. */
  spread: number;
  /** Volt chain jumps. */
  chain: number;
  /** Splash radius (0 = single target). */
  aoe: number;
  /** Projectile pierces this many enemies. */
  pierce: number;
  /** Crit chance (0..1); crits deal 2x. */
  crit: number;
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
  /** Crit chance added to adjacent weapons. */
  critAdd?: number;
  /** Multiplies the numeric effects of ADJACENT supports (support-of-support). */
  supportBoost?: number;
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
  /** If true, must be unlocked in the Workshop before appearing in the pool. */
  blueprint?: boolean;
}

const W = (s: Partial<WeaponStats>): WeaponStats => ({
  damage: 8,
  fireRate: 2,
  range: 260,
  projectileSpeed: 520,
  projectiles: 1,
  spread: 0,
  chain: 0,
  aoe: 0,
  pierce: 0,
  crit: 0.05,
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
    weapon: W({ damage: 4, fireRate: 1.6, range: 170, projectiles: 4, spread: 0.42, projectileSpeed: 440 }),
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
    weapon: W({ damage: 24, fireRate: 0.9, range: 460, pierce: 4, crit: 0.12, projectileSpeed: 980 }),
    weight: 2,
    blueprint: true,
  },
  splitter: {
    id: "splitter",
    name: "Splitter",
    category: "weapon",
    rarity: "rare",
    element: "frost",
    desc: "Fires a full radial burst of 6 shards in all directions.",
    weapon: W({ damage: 5, fireRate: 1.3, range: 220, projectiles: 6, spread: Math.PI * 2, projectileSpeed: 420 }),
    weight: 2,
    blueprint: true,
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
    desc: "Adjacent weapons chill enemies, slowing them. Chilled enemies take +35% damage.",
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
    desc: "Adjacent weapons fire 50% faster and gain +8% crit.",
    support: { fireRateMult: 1.5, critAdd: 0.08 },
    weight: 4,
  },
  resonator: {
    id: "resonator",
    name: "Resonator",
    category: "support",
    rarity: "rare",
    element: "volt",
    desc: "Boosts the effect of ADJACENT support components by 60%.",
    support: { supportBoost: 1.6 },
    weight: 3,
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
    blueprint: true,
  },
  catalyst: {
    id: "catalyst",
    name: "Catalyst",
    category: "support",
    rarity: "rare",
    element: "ember",
    desc: "Adjacent weapons gain +20% crit.",
    support: { critAdd: 0.2 },
    weight: 2,
    blueprint: true,
  },
};

export const COMPONENT_LIST = Object.values(COMPONENTS);

/**
 * The draftable pool for a run: everything except the guaranteed starter core
 * and any blueprint not yet unlocked in the Workshop.
 */
export function draftPool(unlockedBlueprints: string[]): ComponentDef[] {
  const unlocked = new Set(unlockedBlueprints);
  return COMPONENT_LIST.filter(
    (c) => c.id !== "reactor_core" && (!c.blueprint || unlocked.has(c.id)),
  );
}
