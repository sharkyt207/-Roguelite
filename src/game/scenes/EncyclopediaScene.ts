/**
 * Encyclopedia (Block 3) — a scrollable reference of every component and enemy,
 * so players can learn synergies and threats outside a run.
 */

import type { Game, Scene } from "../Game";
import { COLOR, RARITY } from "../../core/theme";
import { COMPONENT_LIST } from "../components";
import { ENEMIES } from "../enemies";
import { drawComponentIcon } from "../../ui/icons";
import { pointInRect, roundRect, text, button, type Rect } from "../../ui/draw";
import { TitleScene } from "./TitleScene";

const HEADER_H = 64;

export class EncyclopediaScene implements Scene {
  private scrollY = 0;
  private contentH = 0;
  private backBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private dragId: number | null = null;
  private dragStartY = 0;
  private startScroll = 0;

  constructor(private game: Game) {
    game.audio.setMusic("menu");
  }

  update(_dt: number): void {
    const pad = 14;
    this.backBtn = { x: pad, y: 20, w: 60, h: 34 };
    const input = this.game.input;
    for (const p of input.active) {
      if (!p.justPressed) continue;
      if (pointInRect(p.x, p.y, this.backBtn)) {
        this.game.audio.play("ui");
        this.game.setScene(new TitleScene(this.game));
        return;
      }
      if (this.dragId === null && p.y > HEADER_H) {
        this.dragId = p.id;
        this.dragStartY = p.y;
        this.startScroll = this.scrollY;
      }
    }
    const drag = input.active.find((a) => a.id === this.dragId);
    if (drag) {
      const dy = this.dragStartY - drag.y;
      const viewH = this.game.vp.height - HEADER_H;
      this.scrollY = Math.max(0, Math.min(Math.max(0, this.contentH - viewH + 16), this.startScroll + dy));
    }
    if (input.releasedThisFrame.some((r) => r.id === this.dragId)) this.dragId = null;
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const pad = 14;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HEADER_H, width, height - HEADER_H);
    ctx.clip();

    let y = HEADER_H + 8 - this.scrollY;
    const line = (label: string) => {
      text(ctx, label, pad, y + 14, { size: 12, color: COLOR.textDim, weight: "700" });
      y += 26;
    };

    const cats: Array<[string, string]> = [
      ["WEAPONS", "weapon"],
      ["SUPPORTS", "support"],
      ["CORES & ROUTING", "core"],
    ];
    for (const [label, cat] of cats) {
      line(label);
      const list = COMPONENT_LIST.filter((c) =>
        cat === "core" ? c.category === "core" || c.category === "conduit" : c.category === cat,
      );
      for (const def of list) {
        const r = { x: pad, y, w: width - pad * 2, h: 52 };
        roundRect(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fillStyle = COLOR.bgPanel;
        ctx.fill();
        ctx.strokeStyle = RARITY[def.rarity].color;
        ctx.lineWidth = 1;
        ctx.stroke();
        drawComponentIcon(ctx, def, r.x + 28, r.y + 26, 34, true);
        text(ctx, def.name, r.x + 54, r.y + 18, { size: 13, color: COLOR.text, weight: "700" });
        text(ctx, RARITY[def.rarity].name, r.x + r.w - 8, r.y + 18, {
          size: 10,
          color: RARITY[def.rarity].color,
          align: "right",
          weight: "700",
        });
        this.wrap(def.desc, r.x + 54, r.y + 34, r.w - 62, 12, 10.5, COLOR.textDim);
        y += 58;
      }
      y += 6;
    }

    line("ENEMIES");
    for (const e of Object.values(ENEMIES)) {
      const r = { x: pad, y, w: width - pad * 2, h: 40 };
      roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fillStyle = COLOR.bgPanel;
      ctx.fill();
      ctx.fillStyle = e.color;
      ctx.beginPath();
      ctx.arc(r.x + 24, r.y + 20, e.boss ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, e.name, r.x + 46, r.y + 18, { size: 13, color: COLOR.text, weight: "700" });
      const role = e.boss
        ? "Boss"
        : e.ai === "spitter"
          ? "Ranged"
          : e.splitInto
            ? "Splits on death"
            : e.speed > 100
              ? "Fast rusher"
              : "Bruiser";
      text(ctx, `${role} · ${e.hp} HP`, r.x + 46, r.y + 32, { size: 10.5, color: COLOR.textDim });
      y += 46;
    }
    y += 20;

    this.contentH = y - (HEADER_H + 8 - this.scrollY);
    ctx.restore();

    // Header.
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, width, HEADER_H);
    button(ctx, this.backBtn, "‹", { color: COLOR.metal, textColor: COLOR.text });
    text(ctx, "ENCYCLOPEDIA", width / 2, 42, { size: 20, color: COLOR.text, align: "center", weight: "900" });
    ctx.strokeStyle = COLOR.gridLine;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(width, HEADER_H);
    ctx.stroke();
  }

  private wrap(str: string, x: number, y: number, maxW: number, lh: number, size: number, color: string): void {
    const { ctx } = this.game.vp;
    ctx.font = `500 ${size}px -apple-system, "Segoe UI", Roboto, sans-serif`;
    const words = str.split(" ");
    let lineStr = "";
    let yy = y;
    for (const word of words) {
      const testStr = lineStr ? `${lineStr} ${word}` : word;
      if (ctx.measureText(testStr).width > maxW && lineStr) {
        text(ctx, lineStr, x, yy, { size, color, weight: "500" });
        lineStr = word;
        yy += lh;
      } else lineStr = testStr;
    }
    if (lineStr) text(ctx, lineStr, x, yy, { size, color, weight: "500" });
  }
}
