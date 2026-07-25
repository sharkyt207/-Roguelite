/**
 * End screen — victory or defeat. Shows the result and returns to the title,
 * ready for a one-tap new run (the "just one more run" loop).
 */

import type { Game, Scene } from "../Game";
import { COLOR } from "../../core/theme";
import { button, pointInRect, text, type Rect } from "../../ui/draw";
import { TitleScene } from "./TitleScene";

export class EndScene implements Scene {
  private btn: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(
    private game: Game,
    private won: boolean,
  ) {}

  update(_dt: number): void {
    const { width, height } = this.game.vp;
    this.btn = { x: width / 2 - 130, y: height * 0.6, w: 260, h: 64 };
    for (const p of this.game.input.active) {
      if (p.justPressed && pointInRect(p.x, p.y, this.btn)) {
        this.game.setScene(new TitleScene(this.game));
      }
    }
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const run = this.game.run;

    text(ctx, this.won ? "SECTORS CLEARED" : "CHASSIS DESTROYED", width / 2, height * 0.36, {
      size: 34,
      color: this.won ? COLOR.ok : COLOR.danger,
      align: "center",
      weight: "900",
    });
    text(
      ctx,
      this.won ? "The Reclaimer falls. You survive the salvage — for now." : "The salvage reclaims you.",
      width / 2,
      height * 0.36 + 34,
      { size: 15, color: COLOR.textDim, align: "center" },
    );
    text(ctx, `Waves cleared: ${run.waveIndex}${this.won ? " (all)" : ""}`, width / 2, height * 0.48, {
      size: 16,
      color: COLOR.text,
      align: "center",
    });
    text(ctx, `Salvage collected: ${run.salvage}`, width / 2, height * 0.48 + 26, {
      size: 16,
      color: COLOR.amber,
      align: "center",
    });

    button(ctx, this.btn, "TITLE");
  }
}
