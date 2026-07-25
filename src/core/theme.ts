/**
 * Visual identity — "Salvage-Mech": dark industrial world, brushed-metal grays,
 * amber warning-light accents, teal energy. Element colors read at a glance on
 * small displays (high contrast, distinct hues).
 */

export const COLOR = {
  bg: "#05070a",
  bgPanel: "#0d1117",
  bgPanel2: "#161c26",
  grid: "#1f2733",
  gridLine: "#2b3543",
  metal: "#3a4757",
  metalLight: "#5a6b80",
  text: "#e6edf3",
  textDim: "#8b98a8",
  amber: "#ff9e3d", // primary accent / UI highlight
  energy: "#3dd7d0", // reactor power
  danger: "#ff4d5e",
  ok: "#5ad17a",
} as const;

export type ElementId = "kinetic" | "ember" | "frost" | "volt";

export const ELEMENT: Record<
  ElementId,
  { name: string; color: string; glow: string }
> = {
  kinetic: { name: "Kinetic", color: "#cfd8e3", glow: "#ffffff" },
  ember: { name: "Ember", color: "#ff6b35", glow: "#ffb03a" },
  frost: { name: "Frost", color: "#4fc3ff", glow: "#a9e6ff" },
  volt: { name: "Volt", color: "#ffe14d", glow: "#fff6a8" },
};

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const RARITY: Record<Rarity, { name: string; color: string }> = {
  common: { name: "Common", color: "#9aa7b5" },
  uncommon: { name: "Uncommon", color: "#5ad17a" },
  rare: { name: "Rare", color: "#4fc3ff" },
  epic: { name: "Epic", color: "#c07bff" },
  legendary: { name: "Legendary", color: "#ff9e3d" },
};
