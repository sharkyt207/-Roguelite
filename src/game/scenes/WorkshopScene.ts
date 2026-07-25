/**
 * Workshop (meta screen, Block B) — spend Cores between runs.
 *
 * - Choose / unlock a Chassis (different grids, rules and starter kits).
 * - Buy horizontal upgrades (integrity, unlocked cells, starting salvage).
 * - Unlock Blueprints that add rare components to the draft pool.
 * - Toggle sound.
 */

import type { Game, Scene } from "../Game";
import { COLOR, RARITY } from "../../core/theme";
import { CHASSIS_LIST } from "../chassis";
import { UPGRADES, BLUEPRINTS } from "../meta";
import { COMPONENTS } from "../components";
import { button, pointInRect, roundRect, text, type Rect } from "../../ui/draw";
import { TitleScene } from "./TitleScene";

interface Widget {
  rect: Rect;
  action: () => void;
  enabled: boolean;
}

export class WorkshopScene implements Scene {
  private widgets: Widget[] = [];
  private backBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };

  constructor(private game: Game) {}

  update(_dt: number): void {
    this.build();
    for (const p of this.game.input.active) {
      if (!p.justPressed) continue;
      if (pointInRect(p.x, p.y, this.backBtn)) {
        this.game.audio.play("ui");
        this.game.setScene(new TitleScene(this.game));
        return;
      }
      for (const w of this.widgets) {
        if (w.enabled && pointInRect(p.x, p.y, w.rect)) {
          w.action();
          this.game.saveMeta();
          this.game.audio.play("ui");
          return;
        }
      }
    }
  }

  private build(): void {
    this.widgets = [];
    const { width } = this.game.vp;
    const meta = this.game.meta;
    const pad = 14;
    this.backBtn = { x: pad, y: 20, w: 64, h: 34 };

    let y = 84;

    // ---- Chassis --------------------------------------------------
    const cw = (width - pad * 2 - 16) / 3;
    CHASSIS_LIST.forEach((ch, i) => {
      const rect = { x: pad + i * (cw + 8), y, w: cw, h: 96 };
      const unlocked = meta.unlockedChassis.includes(ch.id);
      this.widgets.push({
        rect,
        enabled: unlocked || meta.cores >= ch.cost,
        action: () => {
          if (unlocked) {
            meta.selectedChassis = ch.id;
          } else if (meta.cores >= ch.cost) {
            meta.cores -= ch.cost;
            meta.unlockedChassis.push(ch.id);
            meta.selectedChassis = ch.id;
          }
        },
      });
    });
    y += 96 + 24;

    // ---- Upgrades -------------------------------------------------
    for (const up of UPGRADES) {
      const level = meta.upgrades[up.id];
      const maxed = level >= up.maxLevel;
      const cost = up.cost(level);
      const rect = { x: width - pad - 96, y, w: 96, h: 40 };
      this.widgets.push({
        rect,
        enabled: !maxed && meta.cores >= cost,
        action: () => {
          if (!maxed && meta.cores >= cost) {
            meta.cores -= cost;
            meta.upgrades[up.id] += 1;
          }
        },
      });
      y += 54;
    }
    y += 16;

    // ---- Blueprints ----------------------------------------------
    const bw = (width - pad * 2 - 8) / 2;
    BLUEPRINTS.forEach((bp, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const rect = { x: pad + col * (bw + 8), y: y + row * 52, w: bw, h: 44 };
      const owned = meta.unlockedBlueprints.includes(bp.id);
      this.widgets.push({
        rect,
        enabled: !owned && meta.cores >= bp.cost,
        action: () => {
          if (!owned && meta.cores >= bp.cost) {
            meta.cores -= bp.cost;
            meta.unlockedBlueprints.push(bp.id);
          }
        },
      });
    });

    // ---- Mute -----------------------------------------------------
    const muteRect = { x: width / 2 - 80, y: this.game.vp.height - 52, w: 160, h: 38 };
    this.widgets.push({
      rect: muteRect,
      enabled: true,
      action: () => {
        meta.muted = this.game.audio.toggleMute();
      },
    });
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const meta = this.game.meta;
    const pad = 14;

    button(ctx, this.backBtn, "‹", { color: COLOR.metal, textColor: COLOR.text });
    text(ctx, "WORKSHOP", width / 2, 42, { size: 20, color: COLOR.text, align: "center", weight: "900" });
    text(ctx, `◆ ${meta.cores}`, width - pad, 42, { size: 18, color: COLOR.energy, align: "right", weight: "800" });

    const w = this.widgets;
    let wi = 0;

    // Chassis cards.
    text(ctx, "CHASSIS", pad, 78, { size: 12, color: COLOR.textDim, weight: "700" });
    CHASSIS_LIST.forEach((ch) => {
      const r = w[wi++].rect;
      const unlocked = meta.unlockedChassis.includes(ch.id);
      const selected = meta.selectedChassis === ch.id;
      roundRect(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fillStyle = selected ? "#12232a" : COLOR.bgPanel;
      ctx.fill();
      ctx.strokeStyle = selected ? COLOR.energy : unlocked ? COLOR.metal : COLOR.gridLine;
      ctx.lineWidth = 2;
      ctx.stroke();
      text(ctx, ch.name, r.x + r.w / 2, r.y + 22, { size: 14, color: COLOR.text, align: "center", weight: "800" });
      this.wrap(ch.desc, r.x + 6, r.y + 40, r.w - 12, 12, 9.5, COLOR.textDim);
      if (!unlocked) {
        text(ctx, `◆ ${ch.cost}`, r.x + r.w / 2, r.y + r.h - 10, {
          size: 12,
          color: meta.cores >= ch.cost ? COLOR.energy : COLOR.danger,
          align: "center",
          weight: "800",
        });
      } else if (selected) {
        text(ctx, "SELECTED", r.x + r.w / 2, r.y + r.h - 10, { size: 10, color: COLOR.energy, align: "center", weight: "800" });
      }
    });

    // Upgrades.
    let uy = 84 + 96 + 24;
    text(ctx, "UPGRADES", pad, uy - 6, { size: 12, color: COLOR.textDim, weight: "700" });
    for (const up of UPGRADES) {
      const level = meta.upgrades[up.id];
      const maxed = level >= up.maxLevel;
      const cost = up.cost(level);
      text(ctx, `${up.name}  (${level}/${up.maxLevel})`, pad, uy + 18, { size: 13, color: COLOR.text, weight: "700" });
      text(ctx, up.desc(level), pad, uy + 34, { size: 10.5, color: COLOR.textDim });
      const r = w[wi++].rect;
      button(ctx, r, maxed ? "MAX" : `◆ ${cost}`, {
        color: maxed ? COLOR.bgPanel2 : COLOR.energy,
        textColor: maxed ? COLOR.textDim : "#05070a",
        disabled: maxed || meta.cores < cost,
      });
      uy += 54;
    }

    // Blueprints.
    const by = uy + 16;
    text(ctx, "BLUEPRINTS", pad, by - 6, { size: 12, color: COLOR.textDim, weight: "700" });
    BLUEPRINTS.forEach((bp, i) => {
      const r = w[wi++].rect;
      const def = COMPONENTS[bp.id];
      const owned = meta.unlockedBlueprints.includes(bp.id);
      roundRect(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fillStyle = COLOR.bgPanel;
      ctx.fill();
      ctx.strokeStyle = owned ? COLOR.ok : RARITY[def.rarity].color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, def.name, r.x + 8, r.y + 18, { size: 12, color: COLOR.text, weight: "700" });
      text(ctx, owned ? "UNLOCKED" : `◆ ${bp.cost}`, r.x + r.w - 8, r.y + 18, {
        size: 12,
        color: owned ? COLOR.ok : meta.cores >= bp.cost ? COLOR.energy : COLOR.danger,
        align: "right",
        weight: "800",
      });
      text(ctx, RARITY[def.rarity].name, r.x + 8, r.y + 34, { size: 9.5, color: RARITY[def.rarity].color });
      void i;
    });

    // Mute.
    const r = w[wi++].rect;
    button(ctx, r, meta.muted ? "🔇 Sound: OFF" : "🔊 Sound: ON", {
      color: COLOR.metal,
      textColor: COLOR.text,
    });

    void height;
  }

  private wrap(str: string, x: number, y: number, maxW: number, lh: number, size: number, color: string): void {
    const { ctx } = this.game.vp;
    ctx.font = `500 ${size}px -apple-system, "Segoe UI", Roboto, sans-serif`;
    const words = str.split(" ");
    let line = "";
    let yy = y;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxW && line) {
        text(ctx, line, x, yy, { size, color, weight: "500" });
        line = word;
        yy += lh;
      } else {
        line = test;
      }
    }
    if (line) text(ctx, line, x, yy, { size, color, weight: "500" });
  }
}
