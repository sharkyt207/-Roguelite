/**
 * The Forge grid — model + synergy resolution.
 *
 * The grid stores placed components. Two derived computations drive everything:
 *   1. Power flood-fill: which cells are powered (reachable from a Core through
 *      Cores/Conduits).
 *   2. Weapon resolution: each powered weapon's final stats after applying the
 *      support components orthogonally adjacent to it.
 */

import { COMPONENTS, type ComponentDef } from "./components";
import type { ElementId } from "../core/theme";

export interface Cell {
  x: number;
  y: number;
  locked: boolean;
  /** Component def id, or undefined if empty. */
  comp?: string;
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
  chain: number;
  aoe: number;
  pierce: number;
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

  constructor(cols: number, rows: number, lockedCells: Array<[number, number]> = []) {
    this.cols = cols;
    this.rows = rows;
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

  /** Set of "x,y" keys for every powered cell. */
  computePowered(): Set<string> {
    const powered = new Set<string>();
    const frontier: Cell[] = [];

    // Seed with cores.
    for (const c of this.cells) {
      if (this.def(c)?.category === "core") {
        powered.add(`${c.x},${c.y}`);
        frontier.push(c);
      }
    }

    // Flood: cores and powered conduits emit to neighbours.
    while (frontier.length) {
      const cur = frontier.pop()!;
      for (const [dx, dy] of DIRS) {
        const n = this.at(cur.x + dx, cur.y + dy);
        if (!n || n.locked) continue;
        const key = `${n.x},${n.y}`;
        if (powered.has(key)) continue;
        powered.add(key);
        const cat = this.def(n)?.category;
        if (cat === "conduit" || cat === "core") frontier.push(n);
      }
    }
    return powered;
  }

  /** Resolve every powered weapon's final stats (applies adjacent supports). */
  resolveWeapons(powered = this.computePowered()): ResolvedWeapon[] {
    const out: ResolvedWeapon[] = [];
    for (const c of this.cells) {
      const d = this.def(c);
      if (!d?.weapon) continue;
      if (!powered.has(`${c.x},${c.y}`)) continue; // unpowered weapons don't fire

      let damageMult = 1;
      let fireRateMult = 1;
      let element = d.element;
      let burn = 0;
      let slow = 0;
      let rangeAdd = 0;

      for (const [dx, dy] of DIRS) {
        const n = this.at(c.x + dx, c.y + dy);
        if (!n || !powered.has(`${n.x},${n.y}`)) continue;
        const nd = this.def(n);
        const s = nd?.support;
        if (!s) continue;
        if (s.damageMult) damageMult *= s.damageMult;
        if (s.fireRateMult) fireRateMult *= s.fireRateMult;
        if (s.injectElement) element = s.injectElement;
        if (s.burn) burn += s.burn;
        if (s.slow) slow = Math.max(slow, s.slow);
        if (s.rangeAdd) rangeAdd += s.rangeAdd;
      }

      const w = d.weapon;
      out.push({
        x: c.x,
        y: c.y,
        defId: d.id,
        element,
        damage: w.damage * damageMult,
        fireRate: w.fireRate * fireRateMult,
        range: w.range + rangeAdd,
        projectileSpeed: w.projectileSpeed,
        projectiles: w.projectiles,
        chain: w.chain,
        aoe: w.aoe,
        pierce: w.pierce,
        burn,
        slow,
      });
    }
    return out;
  }

  /** Rough total DPS for build-phase feedback. */
  estimateDps(): number {
    let dps = 0;
    for (const w of this.resolveWeapons()) {
      const perShot = w.damage * Math.max(1, w.projectiles) * (1 + w.chain * 0.6);
      dps += perShot * w.fireRate + w.burn * 0.5;
    }
    return Math.round(dps);
  }

  /** Serialisable snapshot (for future save system). */
  snapshot(): Array<{ x: number; y: number; comp: string }> {
    return this.cells
      .filter((c) => c.comp)
      .map((c) => ({ x: c.x, y: c.y, comp: c.comp! }));
  }
}
