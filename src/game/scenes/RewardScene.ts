/**
 * Reward phase — the draft moment. Pick 1 of 3 salvaged components (weighted by
 * rarity), or spend salvage to reroll the offer. The picked part goes to the
 * tray to be placed in the next build phase.
 */

import type { Game, Scene } from "../Game";
import { COLOR, ELEMENT, RARITY } from "../../core/theme";
import { draftPool, type ComponentDef } from "../components";
import { button, pointInRect, roundRect, text, type Rect } from "../../ui/draw";
import { drawComponentIcon } from "../../ui/icons";
import { BuildScene } from "./BuildScene";

const REROLL_COST = 4;

export class RewardScene implements Scene {
  private offer: ComponentDef[] = [];
  private cards: Rect[] = [];
  private rerollBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(private game: Game) {
    this.offer = this.roll();
    game.audio.setMusic("menu");
  }

  private roll(): ComponentDef[] {
    const pool = draftPool(this.game.meta.unlockedBlueprints);
    const out: ComponentDef[] = [];
    const rng = this.game.rng;
    while (out.length < 3 && pool.length > 0) {
      const total = pool.reduce((s, c) => s + c.weight, 0);
      let t = rng.range(0, total);
      let idx = 0;
      for (let i = 0; i < pool.length; i++) {
        t -= pool[i].weight;
        if (t <= 0) {
          idx = i;
          break;
        }
      }
      out.push(pool.splice(idx, 1)[0]);
    }
    return out;
  }

  update(_dt: number): void {
    this.layout();
    for (const p of this.game.input.active) {
      if (!p.justPressed) continue;
      for (let i = 0; i < this.cards.length; i++) {
        if (pointInRect(p.x, p.y, this.cards[i])) {
          this.game.audio.play("place");
          this.game.run.inventory.push(this.offer[i].id);
          this.game.setScene(new BuildScene(this.game));
          return;
        }
      }
      if (pointInRect(p.x, p.y, this.rerollBtn) && this.game.run.salvage >= REROLL_COST) {
        this.game.audio.play("ui");
        this.game.run.salvage -= REROLL_COST;
        this.offer = this.roll();
      }
    }
  }

  private layout(): void {
    const { width, height } = this.game.vp;
    const pad = 20;
    const top = height * 0.22;
    const cardH = Math.min(120, (height * 0.5) / 3);
    const gap = 14;
    this.cards = this.offer.map((_, i) => ({
      x: pad,
      y: top + i * (cardH + gap),
      w: width - pad * 2,
      h: cardH,
    }));
    this.rerollBtn = { x: width / 2 - 110, y: height - 90, w: 220, h: 56 };
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const run = this.game.run;

    text(ctx, "SALVAGE RECOVERED", width / 2, height * 0.13, {
      size: 24,
      color: COLOR.amber,
      align: "center",
      weight: "900",
    });
    text(ctx, "Choose one part for your Forge", width / 2, height * 0.13 + 26, {
      size: 14,
      color: COLOR.textDim,
      align: "center",
    });

    for (let i = 0; i < this.cards.length; i++) {
      const r = this.cards[i];
      const def = this.offer[i];
      const rar = RARITY[def.rarity];
      roundRect(ctx, r.x, r.y, r.w, r.h, 14);
      ctx.fillStyle = COLOR.bgPanel;
      ctx.fill();
      ctx.strokeStyle = rar.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      const iconCx = r.x + r.h * 0.5;
      const iconCy = r.y + r.h * 0.5;
      drawComponentIcon(ctx, def, iconCx, iconCy, r.h * 0.6, true);

      const tx = r.x + r.h + 6;
      text(ctx, def.name, tx, r.y + 30, { size: 18, color: COLOR.text, weight: "800" });
      text(ctx, `${rar.name} · ${ELEMENT[def.element].name} · ${def.category}`, tx, r.y + 52, {
        size: 12,
        color: rar.color,
      });
      // Wrap description.
      this.wrap(def.desc, tx, r.y + 74, r.w - r.h - 20, 16, 12, COLOR.textDim);
    }

    const canReroll = run.salvage >= REROLL_COST;
    button(ctx, this.rerollBtn, `↻ Reroll (${REROLL_COST})`, {
      color: COLOR.metal,
      textColor: COLOR.text,
      disabled: !canReroll,
    });
    text(ctx, `Salvage: ${run.salvage}`, width / 2, height - 24, {
      size: 14,
      color: COLOR.amber,
      align: "center",
    });
  }

  private wrap(
    str: string,
    x: number,
    y: number,
    maxW: number,
    lh: number,
    size: number,
    color: string,
  ): void {
    const { ctx } = this.game.vp;
    ctx.font = `500 ${size}px -apple-system, "Segoe UI", Roboto, sans-serif`;
    const words = str.split(" ");
    let line = "";
    let yy = y;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        text(ctx, line, x, yy, { size, color, weight: "500" });
        line = w;
        yy += lh;
      } else {
        line = test;
      }
    }
    if (line) text(ctx, line, x, yy, { size, color, weight: "500" });
  }
}
