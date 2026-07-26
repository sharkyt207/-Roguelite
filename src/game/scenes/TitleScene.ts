import type { Game, Scene } from "../Game";
import { COLOR } from "../../core/theme";
import { CHASSIS } from "../chassis";
import { dailyFor } from "../daily";
import { loadRun } from "../persistence";
import { todayKey } from "../daily";
import { button, pointInRect, text, vignette, type Rect } from "../../ui/draw";
import { BuildScene } from "./BuildScene";
import { WorkshopScene } from "./WorkshopScene";
import { EncyclopediaScene } from "./EncyclopediaScene";

interface Btn {
  rect: Rect;
  label: string;
  primary: boolean;
  action: () => void;
}

export class TitleScene implements Scene {
  private btns: Btn[] = [];
  private t = 0;

  constructor(private game: Game) {
    game.audio.setMusic("menu");
  }

  update(dt: number): void {
    this.t += dt;
    this.layout();
    for (const p of this.game.input.active) {
      if (!p.justPressed) continue;
      this.game.audio.resume();
      for (const b of this.btns) {
        if (pointInRect(p.x, p.y, b.rect)) {
          this.game.audio.play("ui");
          b.action();
          return;
        }
      }
    }
  }

  private layout(): void {
    const { width, height } = this.game.vp;
    const g = this.game;
    const w = 260;
    const x = width / 2 - w / 2;
    const h = 54;
    const gap = 10;

    this.btns = [];
    const defs: Array<Omit<Btn, "rect">> = [];

    if (loadRun()) {
      defs.push({
        label: "▶  CONTINUE",
        primary: true,
        action: () => {
          if (g.resumeRun()) g.setScene(new BuildScene(g));
        },
      });
    }
    defs.push({
      label: "＋  NEW RUN",
      primary: !loadRun(),
      action: () => {
        g.newRun();
        g.setScene(new BuildScene(g));
      },
    });
    defs.push({
      label: "◷  DAILY RUN",
      primary: false,
      action: () => {
        g.newDailyRun();
        g.setScene(new BuildScene(g));
      },
    });
    defs.push({ label: "◆  WORKSHOP", primary: false, action: () => g.setScene(new WorkshopScene(g)) });
    defs.push({ label: "❔  ENCYCLOPEDIA", primary: false, action: () => g.setScene(new EncyclopediaScene(g)) });

    const totalH = defs.length * h + (defs.length - 1) * gap;
    let y = Math.max(height * 0.44, height / 2 - totalH / 2 + 40);
    for (const d of defs) {
      this.btns.push({ ...d, rect: { x, y, w, h } });
      y += h + gap;
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
    ctx.globalAlpha = 0.22;
    for (let gx = (this.t * 8) % step; gx < width; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    vignette(ctx, width, height, 0.45);

    const top = height * 0.15;

    // Soft amber glow behind the logo.
    const glow = ctx.createRadialGradient(cx, top + 30, 10, cx, top + 30, Math.min(width, height) * 0.5);
    glow.addColorStop(0, "rgba(255,158,61,0.16)");
    glow.addColorStop(1, "rgba(255,158,61,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    text(ctx, "GRID", cx, top, { size: 64, color: COLOR.text, align: "center", baseline: "middle", weight: "900" });
    text(ctx, "FORGE", cx, top + 58, { size: 64, color: COLOR.amber, align: "center", baseline: "middle", weight: "900" });
    text(ctx, "Build the machine. Survive the salvage.", cx, top + 108, {
      size: 14,
      color: COLOR.textDim,
      align: "center",
      baseline: "middle",
    });

    const chassis = CHASSIS[meta.selectedChassis] ?? CHASSIS.scrapheap;
    text(ctx, `◆ ${meta.cores} Cores   ·   ${chassis.name}`, cx, top + 140, {
      size: 13,
      color: COLOR.energy,
      align: "center",
    });

    for (const b of this.btns) {
      button(ctx, b.rect, b.label, b.primary ? {} : { color: COLOR.bgPanel2, textColor: COLOR.text });
      // Daily subline: modifier + best.
      if (b.label.includes("DAILY")) {
        const { modifier } = dailyFor();
        const best = meta.daily && meta.daily.date === todayKey() ? `  ·  best ${meta.daily.bestWave}` : "";
        text(ctx, `Today: ${modifier.name}${best}`, cx, b.rect.y + b.rect.h - 8, {
          size: 10,
          color: COLOR.textDim,
          align: "center",
        });
      }
    }

    if (meta.stats.wins > 0) {
      const deep = meta.stats.bestDepth > 0 ? `  ·  Deepest ${meta.stats.bestDepth}` : "";
      text(ctx, `Wins ${meta.stats.wins}  ·  Best wave ${meta.stats.bestWave}${deep}`, cx, height - 40, {
        size: 12,
        color: COLOR.textDim,
        align: "center",
      });
    }
    text(ctx, "Prototype v0.5.1", cx, height - 20, { size: 11, color: COLOR.textDim, align: "center" });
  }
}
