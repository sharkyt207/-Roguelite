/**
 * Enemy archetypes for the vertical slice. Kept data-driven so waves and
 * balancing live in one place.
 */

export interface EnemyDef {
  id: string;
  name: string;
  color: string;
  hp: number;
  speed: number; // px/s
  radius: number;
  contactDamage: number;
  salvage: number;
  boss?: boolean;
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
  },
  grunt: {
    id: "grunt",
    name: "Husk",
    color: "#c9d2dd",
    hp: 32,
    speed: 74,
    radius: 16,
    contactDamage: 9,
    salvage: 2,
  },
  tank: {
    id: "tank",
    name: "Hauler",
    color: "#8a93a3",
    hp: 120,
    speed: 44,
    radius: 26,
    contactDamage: 16,
    salvage: 5,
  },
  boss: {
    id: "boss",
    name: "Reclaimer",
    color: "#ff9e3d",
    hp: 900,
    speed: 52,
    radius: 46,
    contactDamage: 24,
    salvage: 40,
    boss: true,
  },
};
