/**
 * The Forge grid — model + synergy resolution.
 *
 * Derived computations:
 *   1. Power flood-fill: which cells are powered (reachable from a Core through
 *      Cores/Conduits).
 *   2. Support potency (pass 1): each support's numeric effect is boosted by
 *      adjacent Resonators (support-of-support).
 *   3. Weapon resolution (pass 2): each powered weapon's final stats after
 *      applying adjacent supports, line-set bonuses and chassis modifiers.
 */

import { COMPONENTS, type ComponentDef } from "./components";
import type { ElementId } from "../core/theme";

export interface Cell {
  x: number;
  y: number;
  locked: boolean;
  comp?: string;
}

export interface ChassisMods {
  damageMult?: number;
  fireRateMult?: number;
  rangeAdd?: number;
  moveSpeedMult?: number;
}

export interface ResolvedWeapon {
  x: number;
  y: number;
  defId: string;
  element: ElementId;
  damage: number;
  fireRate: number;
  range: number;
  projectileSpeed: number;
  projectiles: number;
  spread: number;
  chain: number;
  aoe: number;
  pierce: number;
  crit: number;
  homing: boolean;
  lifesteal: number;
  burn: number;
  slow: number;
}

const DIRS: ReadonlyArray<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

export class Grid {
  readonly cols: number;
  readonly rows: number;
  readonly cells: Cell[];
  mods: ChassisMods;

  constructor(
    cols: number,
    rows: number,
    lockedCells: Array<[number, number]> = [],
    mods: ChassisMods = {},
  ) {
    this.cols = cols;
    this.rows = rows;
    this.mods = mods;
    this.cells = [];
    const lockedSet = new Set(lockedCells.map(([x, y]) => `${x},${y}`));
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        this.cells.push({ x, y, locked: lockedSet.has(`${x},${y}`) });
      }
    }
  }

  index(x: number, y: number): number {
    return y * this.cols + x;
  }

  at(x: number, y: number): Cell | undefined {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return undefined;
    return this.cells[this.index(x, y)];
  }

  def(cell: Cell | undefined): ComponentDef | undefined {
    return cell?.comp ? COMPONENTS[cell.comp] : undefined;
  }

  canPlace(x: number, y: number): boolean {
    const c = this.at(x, y);
    return !!c && !c.locked && !c.comp;
  }

  place(x: number, y: number, defId: string): boolean {
    const c = this.at(x, y);
    if (!c || c.locked || c.comp) return false;
    c.comp = defId;
    return true;
  }

  remove(x: number, y: number): string | undefined {
    const c = this.at(x, y);
    if (!c || !c.comp) return undefined;
    const id = c.comp;
    c.comp = undefined;
    return id;
  }

  /** Cells a given powering cell emits to (respects core power patterns). */
  private emitTargets(cell: Cell): Cell[] {
    const d = this.def(cell);
    const out: Cell[] = [];
    const push = (x: number, y: number) => {
      const n = this.at(x, y);
      if (n && !n.locked) out.push(n);
    };
    if (d?.category === "core" && d.corePower === "cross") {
      for (let x = 0; x < this.cols; x++) if (x !== cell.x) push(x, cell.y);
      for (let y = 0; y < this.rows; y++) if (y !== cell.y) push(cell.x, y);
    } else if (d?.category === "core" && d.corePower === "diagonal") {
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) if (dx || dy) push(cell.x + dx, cell.y + dy);
    } else {
      for (const [dx, dy] of DIRS) push(cell.x + dx, cell.y + dy);
    }
    return out;
  }

  /** Set of "x,y" keys for every powered cell. */
  computePowered(): Set<string> {
    const powered = new Set<string>();
    const frontier: Cell[] = [];
    for (const c of this.cells) {
      if (this.def(c)?.category === "core") {
        powered.add(`${c.x},${c.y}`);
        frontier.push(c);
      }
    }
    while (frontier.length) {
      const cur = frontier.pop()!;
      for (const n of this.emitTargets(cur)) {
        const key = `${n.x},${n.y}`;
        if (powered.has(key)) continue;
        powered.add(key);
        const cat = this.def(n)?.category;
        if (cat === "conduit" || cat === "core") frontier.push(n);
      }
    }
    return powered;
  }

  /** Pass 1: each powered support's potency multiplier (Resonator boosts). */
  private supportPotency(powered: Set<string>): Map<string, number> {
    const pot = new Map<string, number>();
    for (const c of this.cells) {
      const d = this.def(c);
      if (!d?.support || !powered.has(`${c.x},${c.y}`)) continue;
      let boost = 1;
      for (const [dx, dy] of DIRS) {
        const n = this.at(c.x + dx, c.y + dy);
        if (!n || !powered.has(`${n.x},${n.y}`)) continue;
        const sb = this.def(n)?.support?.supportBoost;
        if (sb) boost *= sb;
      }
      pot.set(`${c.x},${c.y}`, boost);
    }
    return pot;
  }

  /** Resolve every powered weapon's final stats. */
  resolveWeapons(powered = this.computePowered()): ResolvedWeapon[] {
    const pot = this.supportPotency(powered);
    const out: ResolvedWeapon[] = [];

    for (const c of this.cells) {
      const d = this.def(c);
      if (!d?.weapon) continue;
      if (!powered.has(`${c.x},${c.y}`)) continue;

      let damageMult = 1;
      let fireRateMult = 1;
      let element = d.element;
      let burn = 0;
      let slow = 0;
      let rangeAdd = 0;
      let crit = d.weapon.crit;
      let pierceAdd = 0;
      let projectilesAdd = 0;
      let lifesteal = 0;

      for (const [dx, dy] of DIRS) {
        const n = this.at(c.x + dx, c.y + dy);
        if (!n || !powered.has(`${n.x},${n.y}`)) continue;
        const s = this.def(n)?.support;
        if (!s) continue;
        const p = pot.get(`${n.x},${n.y}`) ?? 1;
        if (s.damageMult) damageMult *= 1 + (s.damageMult - 1) * p;
        if (s.fireRateMult) fireRateMult *= 1 + (s.fireRateMult - 1) * p;
        if (s.injectElement) element = s.injectElement;
        if (s.burn) burn += s.burn * p;
        if (s.slow) slow = Math.min(0.9, Math.max(slow, s.slow * p));
        if (s.critAdd) crit += s.critAdd * p;
        if (s.rangeAdd) rangeAdd += s.rangeAdd * p;
        if (s.pierceAdd) pierceAdd += Math.round(s.pierceAdd * p);
        if (s.projectilesAdd) projectilesAdd += Math.round(s.projectilesAdd * p);
        if (s.lifesteal) lifesteal = Math.max(lifesteal, s.lifesteal * p);
      }

      const w = d.weapon;
      const m = this.mods;
      const projectiles = w.projectiles + projectilesAdd;
      // Multishot fans out even single-shot weapons.
      const spread = w.spread === 0 && projectiles > 1 ? 0.35 : w.spread;
      out.push({
        x: c.x,
        y: c.y,
        defId: d.id,
        element,
        damage: w.damage * damageMult * (m.damageMult ?? 1),
        fireRate: w.fireRate * fireRateMult * (m.fireRateMult ?? 1),
        range: w.range + rangeAdd + (m.rangeAdd ?? 0),
        projectileSpeed: w.projectileSpeed,
        projectiles,
        spread,
        chain: w.chain,
        aoe: w.aoe,
        pierce: w.pierce + pierceAdd,
        crit: Math.min(0.9, crit),
        homing: w.homing,
        lifesteal,
        burn,
        slow,
      });
    }

    this.applyLineSets(out);
    return out;
  }

  /** Line sets: 3+ weapons in a powered row/column gain an Array bonus. */
  private applyLineSets(weapons: ResolvedWeapon[]): void {
    const byRow = new Map<number, ResolvedWeapon[]>();
    const byCol = new Map<number, ResolvedWeapon[]>();
    for (const w of weapons) {
      (byRow.get(w.y) ?? byRow.set(w.y, []).get(w.y)!).push(w);
      (byCol.get(w.x) ?? byCol.set(w.x, []).get(w.x)!).push(w);
    }
    const boost = (line: ResolvedWeapon[]) => {
      if (line.length < 3) return;
      for (const w of line) {
        w.damage *= 1.1;
        w.crit = Math.min(0.9, w.crit + 0.2);
      }
    };
    byRow.forEach(boost);
    byCol.forEach(boost);
  }

  /** Rough total DPS for build-phase feedback. */
  estimateDps(): number {
    let dps = 0;
    for (const w of this.resolveWeapons()) {
      const critFactor = 1 + w.crit;
      const perShot = w.damage * critFactor * Math.max(1, w.projectiles) * (1 + w.chain * 0.6);
      dps += perShot * w.fireRate + w.burn * 0.5;
    }
    return Math.round(dps);
  }

  snapshot(): Array<{ x: number; y: number; comp: string }> {
    return this.cells
      .filter((c) => c.comp)
      .map((c) => ({ x: c.x, y: c.y, comp: c.comp! }));
  }
}
