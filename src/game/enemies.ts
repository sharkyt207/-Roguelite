/**
 * Enemy archetypes. `ai` drives behaviour in CombatScene:
 *   chase     — walk straight at the chassis (default).
 *   spitter   — keep distance and fire slow projectiles.
 *   reclaimer — boss: periodically summons adds.
 *   harvester — boss: fires telegraphed radial bullet bursts.
 *   overmind  — final boss: summons + radial bursts + enrage under 40% HP.
 */

export type EnemyAI = "chase" | "spitter" | "reclaimer" | "harvester" | "overmind";

export interface EnemyDef {
  id: string;
  name: string;
  color: string;
  hp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  salvage: number;
  boss?: boolean;
  ai?: EnemyAI;
  /** Ranged AI: fire cadence (shots/sec) and projectile damage. */
  shootRate?: number;
  shootDmg?: number;
  shootRange?: number;
  /** On death, spawn this many of splitInto. */
  splitInto?: string;
  splitCount?: number;
}

export const ENEMIES: Record<string, EnemyDef> = {
  rusher: {
    id: "rusher",
    name: "Scrapling",
    color: "#ff7a59",
    hp: 12,
    speed: 118,
    radius: 12,
    contactDamage: 6,
    salvage: 1,
    ai: "chase",
  },
  grunt: {
    id: "grunt",
    name: "Husk",
    color: "#c9d2dd",
    hp: 34,
    speed: 74,
    radius: 16,
    contactDamage: 9,
    salvage: 2,
    ai: "chase",
  },
  spitter: {
    id: "spitter",
    name: "Spitter",
    color: "#b07bff",
    hp: 26,
    speed: 58,
    radius: 15,
    contactDamage: 7,
    salvage: 3,
    ai: "spitter",
    shootRate: 0.7,
    shootDmg: 8,
    shootRange: 340,
  },
  brood: {
    id: "brood",
    name: "Brood",
    color: "#6ad17a",
    hp: 40,
    speed: 66,
    radius: 18,
    contactDamage: 8,
    salvage: 3,
    ai: "chase",
    splitInto: "rusher",
    splitCount: 3,
  },
  tank: {
    id: "tank",
    name: "Hauler",
    color: "#8a93a3",
    hp: 130,
    speed: 44,
    radius: 26,
    contactDamage: 16,
    salvage: 5,
    ai: "chase",
  },

  // ---- Bosses ---------------------------------------------------------
  reclaimer: {
    id: "reclaimer",
    name: "Reclaimer",
    color: "#ff9e3d",
    hp: 1200,
    speed: 50,
    radius: 44,
    contactDamage: 22,
    salvage: 30,
    boss: true,
    ai: "reclaimer",
  },
  harvester: {
    id: "harvester",
    name: "Harvester",
    color: "#4fc3ff",
    hp: 1000,
    speed: 46,
    radius: 46,
    contactDamage: 24,
    salvage: 40,
    boss: true,
    ai: "harvester",
    shootDmg: 10,
  },
  overmind: {
    id: "overmind",
    name: "The Overmind",
    color: "#ff4d5e",
    hp: 1700,
    speed: 44,
    radius: 52,
    contactDamage: 28,
    salvage: 60,
    boss: true,
    ai: "overmind",
    shootDmg: 12,
  },
};
