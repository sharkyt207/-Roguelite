import type { Game, Scene } from "../Game";
import { COLOR } from "../../core/theme";
import { CHASSIS } from "../chassis";
import { button, pointInRect, text, type Rect } from "../../ui/draw";
import { BuildScene } from "./BuildScene";
import { WorkshopScene } from "./WorkshopScene";

export class TitleScene implements Scene {
  private playBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private shopBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private t = 0;

  constructor(private game: Game) {}

  update(dt: number): void {
    this.t += dt;
    const { width, height } = this.game.vp;
    this.playBtn = { x: width / 2 - 130, y: height * 0.6, w: 260, h: 64 };
    this.shopBtn = { x: width / 2 - 130, y: height * 0.6 + 78, w: 260, h: 58 };

    for (const p of this.game.input.active) {
      if (!p.justPressed) continue;
      this.game.audio.resume();
      if (pointInRect(p.x, p.y, this.playBtn)) {
        this.game.audio.play("ui");
        this.game.newRun();
        this.game.setScene(new BuildScene(this.game));
      } else if (pointInRect(p.x, p.y, this.shopBtn)) {
        this.game.audio.play("ui");
        this.game.setScene(new WorkshopScene(this.game));
      }
    }
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const cx = width / 2;
    const meta = this.game.meta;

    // Animated backdrop grid.
    ctx.strokeStyle = COLOR.gridLine;
    ctx.lineWidth = 1;
    const step = 44;
    ctx.globalAlpha = 0.25;
    for (let x = (this.t * 8) % step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    text(ctx, "GRID", cx, height * 0.3, { size: 72, color: COLOR.text, align: "center", baseline: "middle", weight: "900" });
    text(ctx, "FORGE", cx, height * 0.3 + 66, { size: 72, color: COLOR.amber, align: "center", baseline: "middle", weight: "900" });
    text(ctx, "Build the machine. Survive the salvage.", cx, height * 0.3 + 122, {
      size: 15,
      color: COLOR.textDim,
      align: "center",
      baseline: "middle",
    });

    // Meta status line.
    const chassis = CHASSIS[meta.selectedChassis] ?? CHASSIS.scrapheap;
    text(ctx, `◆ ${meta.cores} Cores   ·   Chassis: ${chassis.name}`, cx, height * 0.48, {
      size: 14,
      color: COLOR.energy,
      align: "center",
    });
    if (meta.stats.wins > 0) {
      text(ctx, `Wins: ${meta.stats.wins}   Best wave: ${meta.stats.bestWave}`, cx, height * 0.48 + 22, {
        size: 12,
        color: COLOR.textDim,
        align: "center",
      });
    }

    button(ctx, this.playBtn, "▶  NEW RUN");
    button(ctx, this.shopBtn, "◆  WORKSHOP", { color: COLOR.energy, textColor: "#05070a" });
    text(ctx, "Prototype v0.2", cx, height - 24, { size: 12, color: COLOR.textDim, align: "center" });
  }
}
