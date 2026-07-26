/**
 * Headless balance simulator (Block 1).
 *
 * Reuses the REAL data + resolution modules (grid synergy resolution, component
 * stats, enemy/wave/chassis data) — no browser — to compute balance signals:
 *   - build DPS (starter vs a representative mid-game layout),
 *   - per-wave clear ratio (can your DPS out-pace what spawns),
 *   - boss time-to-kill,
 * and flags values outside healthy target bands.
 *
 * Run:  npm run sim
 */

import { Grid } from "../src/game/grid";
import { WAVES } from "../src/game/run";
import { ENEMIES } from "../src/game/enemies";
import { CHASSIS, CHASSIS_LIST } from "../src/game/chassis";

const OVERCHARGE_EFFECTIVE = 1.12; // ~12% extra effective DPS from Overcharge nova/boost
const TARGET = {
  clearMin: 1.1,
  clearMax: 4.0,
  bossTtkMin: 10,
  bossTtkMax: 40,
};

/** Expected DPS of a resolved grid (crit, chain, multishot, burn folded in). */
function gridDps(grid: Grid): number {
  let dps = 0;
  for (const w of grid.resolveWeapons()) {
    const critFactor = 1 + w.crit; // crit = +100% dmg
    const perShot = w.damage * critFactor * Math.max(1, w.projectiles) * (1 + w.chain * 0.6);
    const aoeFactor = w.aoe > 0 ? 1.5 : 1; // splash hits extra targets in a crowd
    dps += perShot * w.fireRate * aoeFactor + w.burn * 1.5;
  }
  return dps * OVERCHARGE_EFFECTIVE;
}

/** A representative strong mid-game layout on a chassis. */
function midGrid(chassisId: string): Grid {
  const ch = CHASSIS[chassisId];
  const g = new Grid(ch.cols, ch.rows, ch.locked, ch.mods);
  const place = (x: number, y: number, id: string) => {
    if (g.canPlace(x, y)) g.place(x, y, id);
  };
  place(2, 2, "reactor_core");
  place(2, 1, "rivet_gun");
  place(1, 2, "arc_coil");
  place(3, 2, "rivet_gun");
  place(2, 3, "flak_pod");
  place(1, 1, "amplifier");
  place(3, 1, "targeting_chip");
  place(1, 3, "ember_cell");
  place(3, 3, "amplifier");
  return g;
}

function starterGrid(chassisId: string): Grid {
  const ch = CHASSIS[chassisId];
  const g = new Grid(ch.cols, ch.rows, ch.locked, ch.mods);
  for (const [x, y, id] of ch.start) g.place(x, y, id);
  // place starter inventory adjacent where possible
  let idx = 0;
  const spots: Array<[number, number]> = [
    [1, 2],
    [3, 2],
    [2, 3],
    [1, 1],
  ];
  for (const id of ch.startInventory) {
    const s = spots[idx++];
    if (s && g.canPlace(s[0], s[1])) g.place(s[0], s[1], id);
  }
  return g;
}

function waveHp(waveIndex: number): { total: number; bossTtkHp: number; peakRate: number } {
  const w = WAVES[waveIndex];
  const scale = 1 + waveIndex * 0.1;
  let total = 0;
  let peakRate = 0;
  for (const [id, rate] of w.spawns) {
    total += rate * w.duration * ENEMIES[id].hp * scale;
    peakRate += rate;
  }
  let bossTtkHp = 0;
  if (w.boss) {
    bossTtkHp = ENEMIES[w.boss].hp * scale;
    total += bossTtkHp;
  }
  return { total, bossTtkHp, peakRate };
}

function flag(v: number, min: number, max: number): string {
  if (v < min) return " LOW";
  if (v > max) return " HIGH";
  return "";
}

function pad(s: string | number, n: number): string {
  return String(s).padStart(n);
}

console.log("=== GRID-FORGE BALANCE SIM ===\n");

for (const ch of CHASSIS_LIST) {
  const sDps = gridDps(starterGrid(ch.id));
  const mDps = gridDps(midGrid(ch.id));
  console.log(
    `CHASSIS ${ch.name.padEnd(10)}  starterDPS=${pad(sDps.toFixed(0), 4)}  midDPS=${pad(mDps.toFixed(0), 4)}  hp=${ch.baseHp}`,
  );
}

console.log("\nWAVE ANALYSIS (using Scrapheap mid build):");
const dps = gridDps(midGrid("scrapheap"));
const sdps = gridDps(starterGrid("scrapheap"));
console.log(`  starterDPS=${sdps.toFixed(0)}  midDPS=${dps.toFixed(0)}\n`);
console.log("  wave  label                       enemyHP  clearRatio  bossTTK");
for (let i = 0; i < WAVES.length; i++) {
  const w = WAVES[i];
  const { total, bossTtkHp } = waveHp(i);
  // Early waves judged with starter DPS, later with mid DPS (progression).
  const useDps = i <= 1 ? sdps : dps;
  const clear = (useDps * w.duration) / total;
  const bossTtk = bossTtkHp > 0 ? bossTtkHp / useDps : 0;
  const cf = flag(clear, TARGET.clearMin, TARGET.clearMax);
  const bf = bossTtkHp > 0 ? flag(bossTtk, TARGET.bossTtkMin, TARGET.bossTtkMax) : "";
  console.log(
    `  ${pad(i + 1, 4)}  ${w.label.padEnd(28)}  ${pad(total.toFixed(0), 6)}  ${pad(clear.toFixed(2), 8)}${cf.padEnd(5)}  ${bossTtkHp > 0 ? pad(bossTtk.toFixed(0) + "s", 6) + bf : "   -"}`,
  );
}
console.log("\n(target: clearRatio 1.1–4.0, boss TTK 10–40s)");
