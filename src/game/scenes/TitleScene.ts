import type { Game, Scene } from "../Game";
import { COLOR } from "../../core/theme";
import { button, pointInRect, text, type Rect } from "../../ui/draw";
import { BuildScene } from "./BuildScene";

export class TitleScene implements Scene {
  private playBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private t = 0;

  constructor(private game: Game) {}

  update(dt: number): void {
    this.t += dt;
    const { width, height } = this.game.vp;
    this.playBtn = { x: width / 2 - 130, y: height * 0.62, w: 260, h: 66 };

    for (const p of this.game.input.active) {
      if (p.justPressed && pointInRect(p.x, p.y, this.playBtn)) {
        this.game.newRun();
        this.game.setScene(new BuildScene(this.game));
      }
    }
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const cx = width / 2;

    // Backdrop grid motif.
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

    text(ctx, "GRID", cx, height * 0.34, {
      size: 72,
      color: COLOR.text,
      align: "center",
      baseline: "middle",
      weight: "900",
    });
    text(ctx, "FORGE", cx, height * 0.34 + 66, {
      size: 72,
      color: COLOR.amber,
      align: "center",
      baseline: "middle",
      weight: "900",
    });
    text(ctx, "Build the machine. Survive the salvage.", cx, height * 0.34 + 128, {
      size: 16,
      color: COLOR.textDim,
      align: "center",
      baseline: "middle",
    });

    button(ctx, this.playBtn, "NEW RUN");
    text(ctx, "Prototype v0.1", cx, height - 28, {
      size: 12,
      color: COLOR.textDim,
      align: "center",
    });
  }
}
