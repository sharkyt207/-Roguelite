/**
 * End screen — victory or defeat. Awards meta currency ("Cores"), persists the
 * save, and offers a one-tap return to the title or the Workshop.
 */

import type { Game, Scene } from "../Game";
import { COLOR } from "../../core/theme";
import { button, pointInRect, text, type Rect } from "../../ui/draw";
import { TitleScene } from "./TitleScene";
import { WorkshopScene } from "./WorkshopScene";
import { todayKey } from "../daily";

export class EndScene implements Scene {
  private titleBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private shopBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private coresEarned: number;

  constructor(
    private game: Game,
    private won: boolean,
  ) {
    const run = game.run;
    this.coresEarned = run.waveIndex + (won ? 6 : 0) + Math.floor(run.salvage / 10);
    game.meta.cores += this.coresEarned;
    game.meta.stats.runs += 1;
    if (won) game.meta.stats.wins += 1;

    if (run.daily) {
      const key = todayKey();
      const prev = game.meta.daily && game.meta.daily.date === key ? game.meta.daily : null;
      game.meta.daily = {
        date: key,
        bestWave: Math.max(prev?.bestWave ?? 0, run.waveIndex + (won ? 1 : 0)),
        won: (prev?.won ?? false) || won,
      };
    }
    game.saveMeta();
    game.endRun(); // clear the in-progress save
    game.audio.play(won ? "win" : "lose");
  }

  update(_dt: number): void {
    const { width, height } = this.game.vp;
    this.titleBtn = { x: width / 2 - 130, y: height * 0.66, w: 260, h: 60 };
    this.shopBtn = { x: width / 2 - 130, y: height * 0.66 + 74, w: 260, h: 60 };
    for (const p of this.game.input.active) {
      if (!p.justPressed) continue;
      if (pointInRect(p.x, p.y, this.titleBtn)) {
        this.game.audio.play("ui");
        this.game.setScene(new TitleScene(this.game));
      } else if (pointInRect(p.x, p.y, this.shopBtn)) {
        this.game.audio.play("ui");
        this.game.setScene(new WorkshopScene(this.game));
      }
    }
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const run = this.game.run;

    text(ctx, this.won ? "SECTORS CLEARED" : "CHASSIS DESTROYED", width / 2, height * 0.34, {
      size: 32,
      color: this.won ? COLOR.ok : COLOR.danger,
      align: "center",
      weight: "900",
    });
    text(
      ctx,
      this.won ? "The Reclaimer falls. You survive the salvage — for now." : "The salvage reclaims you.",
      width / 2,
      height * 0.34 + 32,
      { size: 14, color: COLOR.textDim, align: "center" },
    );
    text(ctx, `Waves cleared: ${run.waveIndex}${this.won ? " (all)" : ""}`, width / 2, height * 0.46, {
      size: 16,
      color: COLOR.text,
      align: "center",
    });
    text(ctx, `Salvage collected: ${run.salvage}`, width / 2, height * 0.46 + 24, {
      size: 16,
      color: COLOR.amber,
      align: "center",
    });
    text(ctx, `◆ +${this.coresEarned} Cores  (total ${this.game.meta.cores})`, width / 2, height * 0.46 + 52, {
      size: 18,
      color: COLOR.energy,
      align: "center",
      weight: "800",
    });

    button(ctx, this.titleBtn, "TITLE");
    button(ctx, this.shopBtn, "◆ WORKSHOP", { color: COLOR.energy, textColor: "#05070a" });
  }
}
