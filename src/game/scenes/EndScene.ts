/**
 * End screen — victory, defeat, or lost-in-the-deep. Awards Cores, persists the
 * save, and offers next actions. After a campaign victory you can descend into
 * the endless "Deep" instead of ending the run.
 */

import type { Game, Scene } from "../Game";
import { COLOR } from "../../core/theme";
import { button, pointInRect, text, type Rect } from "../../ui/draw";
import { TitleScene } from "./TitleScene";
import { WorkshopScene } from "./WorkshopScene";
import { RewardScene } from "./RewardScene";
import { todayKey } from "../daily";
import { checkAchievements, type Achievement } from "../achievements";

interface Btn {
  rect: Rect;
  label: string;
  primary: boolean;
  action: () => void;
}

export class EndScene implements Scene {
  private btns: Btn[] = [];
  private coresEarned: number;
  private wasEndless: boolean;
  private unlocked: Achievement[] = [];

  constructor(
    private game: Game,
    private won: boolean,
  ) {
    const run = game.run;
    this.wasEndless = run.endless;
    const depthBonus = run.endless ? run.depth * 3 : 0;
    this.coresEarned = run.waveIndex + (won ? 6 : 0) + depthBonus + Math.floor(run.salvage / 10);
    game.meta.cores += this.coresEarned;
    game.meta.stats.runs += 1;
    if (won) game.meta.stats.wins += 1;
    if (run.endless) game.meta.stats.bestDepth = Math.max(game.meta.stats.bestDepth, run.depth);
    game.audio.setMusic("menu");

    // Newly earned achievements (grants their Cores too).
    this.unlocked = checkAchievements({ meta: game.meta, run, won });

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
    game.endRun();
    game.audio.play(won ? "win" : "lose");
  }

  update(_dt: number): void {
    const { width, height } = this.game.vp;
    const g = this.game;
    const w = 260;
    const x = width / 2 - w / 2;
    const h = 58;
    const gap = 10;

    const defs: Array<Omit<Btn, "rect">> = [];
    // Campaign victory (not already in the Deep) → offer the endless descent.
    if (this.won && !this.wasEndless) {
      defs.push({
        label: "⬇  ENTER THE DEEP",
        primary: true,
        action: () => {
          g.run.endless = true;
          g.run.waveIndex += 1;
          g.run.hp = g.run.maxHp;
          g.setScene(new RewardScene(g));
        },
      });
    }
    defs.push({ label: "TITLE", primary: !(this.won && !this.wasEndless), action: () => g.setScene(new TitleScene(g)) });
    defs.push({ label: "◆ WORKSHOP", primary: false, action: () => g.setScene(new WorkshopScene(g)) });

    let y = height * 0.6;
    this.btns = defs.map((d) => {
      const b = { ...d, rect: { x, y, w, h } };
      y += h + gap;
      return b;
    });

    for (const p of this.game.input.active) {
      if (!p.justPressed) continue;
      for (const b of this.btns) {
        if (pointInRect(p.x, p.y, b.rect)) {
          this.game.audio.play("ui");
          b.action();
          return;
        }
      }
    }
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const run = this.game.run;

    const title = this.won ? "SECTORS CLEARED" : this.wasEndless ? "LOST IN THE DEEP" : "CHASSIS DESTROYED";
    const subtitle = this.won
      ? "The Overmind falls. Will you descend into the Deep?"
      : this.wasEndless
        ? "The salvage claims you at last."
        : "The salvage reclaims you.";
    text(ctx, title, width / 2, height * 0.32, {
      size: 30,
      color: this.won ? COLOR.ok : COLOR.danger,
      align: "center",
      weight: "900",
    });
    text(ctx, subtitle, width / 2, height * 0.32 + 30, { size: 14, color: COLOR.textDim, align: "center" });

    const line = this.wasEndless ? `Reached Depth ${run.depth}` : `Waves cleared: ${run.waveIndex}${this.won ? " (all)" : ""}`;
    text(ctx, line, width / 2, height * 0.44, { size: 16, color: COLOR.text, align: "center" });
    text(ctx, `Salvage: ${run.salvage}`, width / 2, height * 0.44 + 24, { size: 15, color: COLOR.amber, align: "center" });
    text(ctx, `◆ +${this.coresEarned} Cores  (total ${this.game.meta.cores})`, width / 2, height * 0.44 + 50, {
      size: 18,
      color: COLOR.energy,
      align: "center",
      weight: "800",
    });

    for (const b of this.btns) {
      button(ctx, b.rect, b.label, b.primary ? {} : { color: COLOR.bgPanel2, textColor: COLOR.text });
    }

    // Achievement summary (compact, never overlaps the buttons).
    if (this.unlocked.length) {
      const bonus = this.unlocked.reduce((s, a) => s + a.cores, 0);
      const names = this.unlocked.map((a) => a.name).join(", ");
      const label = `🏆 ${this.unlocked.length} unlocked${bonus > 0 ? `  (+${bonus} Cores)` : ""}`;
      text(ctx, label, width / 2, height * 0.44 + 76, { size: 13, color: COLOR.amber, align: "center", weight: "800" });
      text(ctx, names, width / 2, height * 0.44 + 94, { size: 11, color: COLOR.textDim, align: "center" });
    }
  }
}
