/**
 * Build phase — the spatial-puzzle heart of Grid-Forge.
 *
 * Drag components from the tray onto the grid; drag placed components to move
 * them or drop them on the tray to unequip. Power flow (teal) and support
 * synergies (element-coloured links) are drawn live so the build is readable.
 */

import type { Game, Scene } from "../Game";
import { COLOR, ELEMENT } from "../../core/theme";
import { COMPONENTS } from "../components";
import { button, pointInRect, roundRect, text, type Rect } from "../../ui/draw";
import { drawComponentIcon } from "../../ui/icons";
import { saveRun } from "../persistence";
import { CombatScene } from "./CombatScene";

interface Drag {
  defId: string;
  origin: { type: "tray" } | { type: "cell"; x: number; y: number };
  pointerId: number;
  x: number;
  y: number;
}

export class BuildScene implements Scene {
  private gx = 0;
  private gy = 0;
  private gsize = 0;
  private cell = 0;
  private trayRects: Rect[] = [];
  private trayZone: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private deployBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private drag: Drag | null = null;

  constructor(private game: Game) {
    // Checkpoint: persist the run so it can be resumed after closing the tab.
    saveRun(game.run);
  }

  private layout(): void {
    const { width, height } = this.game.vp;
    const pad = 16;
    const hudH = 92;
    const deployH = 62;
    const trayH = 92;
    const gridTop = hudH + pad;
    const availH = height - hudH - trayH - deployH - pad * 4;
    this.gsize = Math.min(width - pad * 2, availH);
    this.cell = this.gsize / this.game.run.grid.cols;
    this.gx = (width - this.gsize) / 2;
    this.gy = gridTop;

    const trayY = this.gy + this.gsize + pad;
    this.trayZone = { x: pad, y: trayY, w: width - pad * 2, h: trayH };

    // Tray item slots.
    const inv = this.game.run.inventory;
    const slot = Math.min(72, trayH - 20);
    const gap = 12;
    const totalW = inv.length * slot + Math.max(0, inv.length - 1) * gap;
    let sx = width / 2 - totalW / 2;
    const sy = trayY + (trayH - slot) / 2;
    this.trayRects = inv.map((_, i) => {
      const r = { x: sx + i * (slot + gap), y: sy, w: slot, h: slot };
      return r;
    });

    this.deployBtn = {
      x: pad,
      y: height - deployH - pad,
      w: width - pad * 2,
      h: deployH,
    };
  }

  private cellAt(px: number, py: number): { x: number; y: number } | null {
    if (px < this.gx || py < this.gy || px > this.gx + this.gsize || py > this.gy + this.gsize)
      return null;
    const x = Math.floor((px - this.gx) / this.cell);
    const y = Math.floor((py - this.gy) / this.cell);
    const grid = this.game.run.grid;
    if (x < 0 || y < 0 || x >= grid.cols || y >= grid.rows) return null;
    return { x, y };
  }

  update(_dt: number): void {
    this.layout();
    const input = this.game.input;
    const run = this.game.run;

    if (!this.drag) {
      for (const p of input.active) {
        if (!p.justPressed) continue;
        if (pointInRect(p.x, p.y, this.deployBtn)) {
          this.game.setScene(new CombatScene(this.game));
          return;
        }
        // Pick up from a placed grid cell.
        const gc = this.cellAt(p.x, p.y);
        if (gc) {
          const c = run.grid.at(gc.x, gc.y);
          if (c?.comp) {
            const defId = run.grid.remove(gc.x, gc.y)!;
            this.drag = { defId, origin: { type: "cell", x: gc.x, y: gc.y }, pointerId: p.id, x: p.x, y: p.y };
            break;
          }
        }
        // Pick up from tray.
        for (let i = 0; i < this.trayRects.length; i++) {
          if (pointInRect(p.x, p.y, this.trayRects[i])) {
            const defId = run.inventory.splice(i, 1)[0];
            this.drag = { defId, origin: { type: "tray" }, pointerId: p.id, x: p.x, y: p.y };
            break;
          }
        }
        if (this.drag) break;
      }
    } else {
      // Update drag position.
      const p = input.active.find((a) => a.id === this.drag!.pointerId);
      if (p) {
        this.drag.x = p.x;
        this.drag.y = p.y;
      }
      // Finalise on release.
      if (input.releasedThisFrame.some((r) => r.id === this.drag!.pointerId)) {
        this.finalizeDrop();
      }
    }
  }

  private finalizeDrop(): void {
    const d = this.drag!;
    const run = this.game.run;
    const target = this.cellAt(d.x, d.y);

    if (target && run.grid.canPlace(target.x, target.y)) {
      run.grid.place(target.x, target.y, d.defId);
      this.game.audio.play("place");
    } else if (pointInRect(d.x, d.y, this.trayZone)) {
      run.inventory.push(d.defId);
    } else if (d.origin.type === "cell" && run.grid.canPlace(d.origin.x, d.origin.y)) {
      run.grid.place(d.origin.x, d.origin.y, d.defId);
    } else {
      run.inventory.push(d.defId);
    }
    this.drag = null;
  }

  render(): void {
    const { ctx, width } = this.game.vp;
    const run = this.game.run;
    const powered = run.grid.computePowered();

    this.renderHud();

    // ---- Grid cells --------------------------------------------------
    const grid = run.grid;
    for (const c of grid.cells) {
      const x = this.gx + c.x * this.cell;
      const y = this.gy + c.y * this.cell;
      const inset = 3;
      const isPowered = powered.has(`${c.x},${c.y}`);

      roundRect(ctx, x + inset, y + inset, this.cell - inset * 2, this.cell - inset * 2, 8);
      if (c.locked) {
        ctx.fillStyle = "#0a0d12";
        ctx.fill();
        ctx.strokeStyle = "#161c26";
        ctx.lineWidth = 2;
        ctx.stroke();
        text(ctx, "\u{1F512}", x + this.cell / 2, y + this.cell / 2, {
          size: this.cell * 0.28,
          align: "center",
          baseline: "middle",
          color: "#2b3543",
        });
        continue;
      }
      ctx.fillStyle = isPowered ? "#0f1a1c" : COLOR.grid;
      ctx.fill();
      ctx.strokeStyle = isPowered ? COLOR.energy : COLOR.gridLine;
      ctx.lineWidth = isPowered ? 2 : 1;
      ctx.globalAlpha = isPowered ? 0.8 : 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ---- Synergy + power links --------------------------------------
    this.renderLinks(powered);

    // ---- Placed components ------------------------------------------
    for (const c of grid.cells) {
      if (!c.comp) continue;
      const def = COMPONENTS[c.comp];
      const cx = this.gx + c.x * this.cell + this.cell / 2;
      const cy = this.gy + c.y * this.cell + this.cell / 2;
      drawComponentIcon(ctx, def, cx, cy, this.cell * 0.78, powered.has(`${c.x},${c.y}`));
    }

    // ---- Tray -------------------------------------------------------
    roundRect(ctx, this.trayZone.x, this.trayZone.y, this.trayZone.w, this.trayZone.h, 12);
    ctx.fillStyle = COLOR.bgPanel;
    ctx.fill();
    if (run.inventory.length === 0) {
      text(ctx, "Tray empty — deploy or earn parts", width / 2, this.trayZone.y + this.trayZone.h / 2, {
        size: 13,
        color: COLOR.textDim,
        align: "center",
        baseline: "middle",
      });
    }
    for (let i = 0; i < this.trayRects.length; i++) {
      const r = this.trayRects[i];
      const def = COMPONENTS[run.inventory[i]];
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fillStyle = COLOR.bgPanel2;
      ctx.fill();
      drawComponentIcon(ctx, def, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.7, true);
    }

    // ---- Deploy -----------------------------------------------------
    button(ctx, this.deployBtn, "▶  DEPLOY");
    if (this.game.tutorialActive && !this.drag) this.renderTutorial();

    // ---- Dragged piece ---------------------------------------------
    if (this.drag) {
      const def = COMPONENTS[this.drag.defId];
      const target = this.cellAt(this.drag.x, this.drag.y);
      if (target && run.grid.canPlace(target.x, target.y)) {
        const x = this.gx + target.x * this.cell;
        const y = this.gy + target.y * this.cell;
        roundRect(ctx, x + 2, y + 2, this.cell - 4, this.cell - 4, 8);
        ctx.strokeStyle = COLOR.amber;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      drawComponentIcon(ctx, def, this.drag.x, this.drag.y - this.cell * 0.4, this.cell * 0.9, true);
      // Name label.
      text(ctx, def.name, this.drag.x, this.drag.y - this.cell * 0.95, {
        size: 13,
        color: COLOR.text,
        align: "center",
        baseline: "middle",
      });
      text(ctx, def.desc, this.drag.x, this.drag.y + this.cell * 0.15, {
        size: 11,
        color: COLOR.textDim,
        align: "center",
        baseline: "middle",
      });
    }
  }

  private renderTutorial(): void {
    const { ctx, width } = this.game.vp;
    const run = this.game.run;
    let msg: string;
    if (run.grid.estimateDps() === 0)
      msg = "Drag a weapon next to the Reactor Core (teal) so it's powered.";
    else if (run.inventory.length > 0) msg = "Place your parts on glowing cells, then DEPLOY.";
    else msg = "Line up 3 weapons in a row for a bonus. Ready? DEPLOY!";

    const w = Math.min(width - 32, 360);
    const x = width / 2 - w / 2;
    const y = this.deployBtn.y - 46;
    roundRect(ctx, x, y, w, 38, 10);
    ctx.fillStyle = "rgba(13,17,23,0.92)";
    ctx.fill();
    ctx.strokeStyle = COLOR.amber;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, msg, width / 2, y + 19, { size: 12.5, color: COLOR.text, align: "center", baseline: "middle" });
  }

  private renderLinks(powered: Set<string>): void {
    const { ctx } = this.game.vp;
    const grid = this.game.run.grid;
    const center = (x: number, y: number): [number, number] => [
      this.gx + x * this.cell + this.cell / 2,
      this.gy + y * this.cell + this.cell / 2,
    ];

    ctx.save();
    // Power links (teal) between adjacent powered core/conduit cells.
    ctx.strokeStyle = COLOR.energy;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = Math.max(3, this.cell * 0.06);
    for (const c of grid.cells) {
      const cat = grid.def(c)?.category;
      if (cat !== "core" && cat !== "conduit") continue;
      if (!powered.has(`${c.x},${c.y}`)) continue;
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ] as const) {
        const n = grid.at(c.x + dx, c.y + dy);
        if (!n || !powered.has(`${n.x},${n.y}`)) continue;
        const ncat = grid.def(n)?.category;
        if (ncat !== "core" && ncat !== "conduit") continue;
        const [ax, ay] = center(c.x, c.y);
        const [bx, by] = center(n.x, n.y);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }

    // Synergy links: powered support → adjacent powered weapon (element colour).
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = Math.max(2, this.cell * 0.045);
    for (const c of grid.cells) {
      const d = grid.def(c);
      if (!d?.support || !powered.has(`${c.x},${c.y}`)) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const n = grid.at(c.x + dx, c.y + dy);
        if (!n) continue;
        const nd = grid.def(n);
        if (!nd?.weapon || !powered.has(`${n.x},${n.y}`)) continue;
        ctx.strokeStyle = ELEMENT[d.element].color;
        const [ax, ay] = center(c.x, c.y);
        const [bx, by] = center(n.x, n.y);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderHud(): void {
    const { ctx, width } = this.game.vp;
    const run = this.game.run;
    const pad = 16;

    text(ctx, run.currentWave.label, pad, 30, { size: 18, color: COLOR.text, weight: "800" });
    text(ctx, `Salvage ${run.salvage}`, width - pad, 30, {
      size: 15,
      color: COLOR.amber,
      align: "right",
    });

    // HP bar.
    const barY = 46;
    const barW = width - pad * 2;
    roundRect(ctx, pad, barY, barW, 12, 6);
    ctx.fillStyle = COLOR.bgPanel2;
    ctx.fill();
    roundRect(ctx, pad, barY, barW * (run.hp / run.maxHp), 12, 6);
    ctx.fillStyle = COLOR.danger;
    ctx.fill();

    const dps = run.grid.estimateDps();
    text(ctx, `Integrity ${Math.ceil(run.hp)}/${run.maxHp}`, pad, barY + 34, {
      size: 13,
      color: COLOR.textDim,
    });
    text(ctx, `~${dps} DPS`, width - pad, barY + 34, {
      size: 13,
      color: dps > 0 ? COLOR.ok : COLOR.danger,
      align: "right",
    });
    if (dps === 0) {
      text(ctx, "No powered weapon! Connect a weapon to the Reactor Core.", width / 2, barY + 34, {
        size: 12,
        color: COLOR.danger,
        align: "center",
      });
    }
  }
}
