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
  /** Projectiles steer toward the nearest enemy. */
  homing: boolean;
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
  /** Pierce added to adjacent weapons. */
  pierceAdd?: number;
  /** Extra projectiles added to adjacent weapons. */
  projectilesAdd?: number;
  /** Integrity healed whenever an adjacent weapon gets a kill. */
  lifesteal?: number;
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
  /** Core power pattern (rule-changing). Default "neighbors" (4 orthogonal). */
  corePower?: "neighbors" | "cross" | "diagonal";
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
  homing: false,
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
  frost_lance: {
    id: "frost_lance",
    name: "Frost Lance",
    category: "weapon",
    rarity: "uncommon",
    element: "frost",
    desc: "Piercing icicle that chills and slows the line it hits.",
    weapon: W({ damage: 11, fireRate: 1.4, range: 340, pierce: 2, projectileSpeed: 720 }),
    weight: 3,
  },
  pulse_drone: {
    id: "pulse_drone",
    name: "Pulse Drone",
    category: "weapon",
    rarity: "uncommon",
    element: "volt",
    desc: "Fires homing pulses that steer into enemies.",
    weapon: W({ damage: 7, fireRate: 1.8, range: 320, homing: true, projectileSpeed: 340 }),
    weight: 3,
  },
  flamethrower: {
    id: "flamethrower",
    name: "Flamethrower",
    category: "weapon",
    rarity: "rare",
    element: "ember",
    desc: "Short-range cone of flames that ignites everything it touches.",
    weapon: W({ damage: 3, fireRate: 6, range: 150, projectiles: 3, spread: 0.5, projectileSpeed: 380 }),
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
  piercing_lens: {
    id: "piercing_lens",
    name: "Piercing Lens",
    category: "support",
    rarity: "uncommon",
    element: "kinetic",
    desc: "Adjacent weapons' shots pierce +2 enemies.",
    support: { pierceAdd: 2 },
    weight: 3,
  },
  multiloader: {
    id: "multiloader",
    name: "Multiloader",
    category: "support",
    rarity: "rare",
    element: "kinetic",
    desc: "Adjacent weapons fire +1 projectile (in a small spread).",
    support: { projectilesAdd: 1 },
    weight: 2,
  },
  siphon: {
    id: "siphon",
    name: "Siphon",
    category: "support",
    rarity: "uncommon",
    element: "frost",
    desc: "Restore 3 Integrity whenever an adjacent weapon scores a kill.",
    support: { lifesteal: 3 },
    weight: 3,
  },
  focus_array: {
    id: "focus_array",
    name: "Focus Array",
    category: "support",
    rarity: "uncommon",
    element: "volt",
    desc: "Adjacent weapons: +90 range and +15% damage.",
    support: { rangeAdd: 90, damageMult: 1.15 },
    weight: 3,
  },

  // ---- Legendaries (rule-changing, meta-gated) -------------------------
  singularity_core: {
    id: "singularity_core",
    name: "Singularity Core",
    category: "core",
    rarity: "legendary",
    element: "volt",
    corePower: "cross",
    desc: "Powers its ENTIRE row and column. Build long lines of weapons.",
    weight: 1,
    blueprint: true,
  },
  fusion_core: {
    id: "fusion_core",
    name: "Fusion Core",
    category: "core",
    rarity: "legendary",
    element: "ember",
    corePower: "diagonal",
    desc: "Powers all 8 surrounding cells, including diagonals.",
    weight: 1,
    blueprint: true,
  },
  prism_lens: {
    id: "prism_lens",
    name: "Prism Lens",
    category: "support",
    rarity: "legendary",
    element: "volt",
    desc: "Adjacent weapons gain burn AND chill AND +15% crit at once.",
    support: { burn: 6, slow: 0.4, critAdd: 0.15 },
    weight: 1,
    blueprint: true,
  },
  twin_loader: {
    id: "twin_loader",
    name: "Twin Loader",
    category: "support",
    rarity: "legendary",
    element: "kinetic",
    desc: "Adjacent weapons fire +2 projectiles and 20% faster.",
    support: { projectilesAdd: 2, fireRateMult: 1.2 },
    weight: 1,
    blueprint: true,
  },
  siege_frame: {
    id: "siege_frame",
    name: "Siege Frame",
    category: "weapon",
    rarity: "legendary",
    element: "ember",
    desc: "Devastating piercing shells with a large explosion.",
    weapon: W({ damage: 30, fireRate: 1.0, range: 400, aoe: 90, pierce: 3, crit: 0.15, projectileSpeed: 620 }),
    weight: 1,
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
