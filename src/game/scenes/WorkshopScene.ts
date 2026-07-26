/**
 * Workshop (meta screen) — spend Cores between runs. Scrollable so it scales
 * with the growing roster of chassis and blueprints.
 *
 * - Choose / unlock a Chassis (different grids, rules and starter kits).
 * - Buy horizontal upgrades (integrity, unlocked cells, starting salvage).
 * - Unlock Blueprints (rare + legendary rule-changing components).
 * - Toggle sound.
 */

import type { Game, Scene } from "../Game";
import { COLOR, RARITY } from "../../core/theme";
import { CHASSIS_LIST } from "../chassis";
import { UPGRADES, BLUEPRINTS } from "../meta";
import { COMPONENTS } from "../components";
import { button, pointInRect, roundRect, text, type Rect } from "../../ui/draw";
import { TitleScene } from "./TitleScene";

const HEADER_H = 64;

type Item =
  | { kind: "label"; y: number; h: number; text: string }
  | { kind: "chassis"; y: number; h: number; rect: Rect; index: number }
  | { kind: "upgrade"; y: number; h: number; rect: Rect; index: number }
  | { kind: "blueprint"; y: number; h: number; rect: Rect; index: number }
  | { kind: "mute"; y: number; h: number; rect: Rect };

export class WorkshopScene implements Scene {
  private items: Item[] = [];
  private contentH = 0;
  private scrollY = 0;
  private backBtn: Rect = { x: 0, y: 0, w: 0, h: 0 };

  // Scroll / tap tracking.
  private dragId: number | null = null;
  private dragStartY = 0;
  private startScroll = 0;
  private moved = false;

  constructor(private game: Game) {}

  update(_dt: number): void {
    this.layout();
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
        this.moved = false;
      }
    }

    const drag = input.active.find((a) => a.id === this.dragId);
    if (drag) {
      const dy = this.dragStartY - drag.y;
      if (Math.abs(dy) > 6) this.moved = true;
      this.scrollY = Math.max(0, Math.min(this.maxScroll(), this.startScroll + dy));
    }
    const released = input.releasedThisFrame.find((r) => r.id === this.dragId);
    if (released) {
      if (!this.moved) this.handleTap(released.x, released.y);
      this.dragId = null;
    }
  }

  private maxScroll(): number {
    const viewH = this.game.vp.height - HEADER_H;
    return Math.max(0, this.contentH - viewH + 16);
  }

  private handleTap(px: number, py: number): void {
    const meta = this.game.meta;
    for (const it of this.items) {
      if (it.kind === "label") continue;
      const r = this.screenRect(it.rect);
      if (!pointInRect(px, py, r)) continue;

      if (it.kind === "chassis") {
        const ch = CHASSIS_LIST[it.index];
        const unlocked = meta.unlockedChassis.includes(ch.id);
        if (unlocked) meta.selectedChassis = ch.id;
        else if (meta.cores >= ch.cost) {
          meta.cores -= ch.cost;
          meta.unlockedChassis.push(ch.id);
          meta.selectedChassis = ch.id;
        } else return;
      } else if (it.kind === "upgrade") {
        const up = UPGRADES[it.index];
        const level = meta.upgrades[up.id];
        const cost = up.cost(level);
        if (level >= up.maxLevel || meta.cores < cost) return;
        meta.cores -= cost;
        meta.upgrades[up.id] += 1;
      } else if (it.kind === "blueprint") {
        const bp = BLUEPRINTS[it.index];
        if (meta.unlockedBlueprints.includes(bp.id) || meta.cores < bp.cost) return;
        meta.cores -= bp.cost;
        meta.unlockedBlueprints.push(bp.id);
      } else if (it.kind === "mute") {
        meta.muted = this.game.audio.toggleMute();
      }
      this.game.saveMeta();
      this.game.audio.play("ui");
      return;
    }
  }

  private screenRect(r: Rect): Rect {
    return { x: r.x, y: HEADER_H + r.y - this.scrollY, w: r.w, h: r.h };
  }

  private layout(): void {
    const { width } = this.game.vp;
    const pad = 14;
    this.backBtn = { x: pad, y: 20, w: 60, h: 34 };
    this.items = [];
    let y = 8; // content-space Y (0 = just below header)

    this.items.push({ kind: "label", y, h: 18, text: "CHASSIS" });
    y += 22;
    const cw = (width - pad * 2 - 16) / 3;
    CHASSIS_LIST.forEach((_, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      this.items.push({
        kind: "chassis",
        y: y + row * 108,
        h: 100,
        rect: { x: pad + col * (cw + 8), y: y + row * 108, w: cw, h: 100 },
        index: i,
      });
    });
    y += Math.ceil(CHASSIS_LIST.length / 3) * 108 + 12;

    this.items.push({ kind: "label", y, h: 18, text: "UPGRADES" });
    y += 22;
    UPGRADES.forEach((_, i) => {
      this.items.push({
        kind: "upgrade",
        y,
        h: 44,
        rect: { x: width - pad - 96, y, w: 96, h: 40 },
        index: i,
      });
      y += 50;
    });
    y += 12;

    this.items.push({ kind: "label", y, h: 18, text: "BLUEPRINTS" });
    y += 22;
    const bw = (width - pad * 2 - 8) / 2;
    BLUEPRINTS.forEach((_, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      this.items.push({
        kind: "blueprint",
        y: y + row * 50,
        h: 44,
        rect: { x: pad + col * (bw + 8), y: y + row * 50, w: bw, h: 44 },
        index: i,
      });
    });
    y += Math.ceil(BLUEPRINTS.length / 2) * 50 + 14;

    this.items.push({ kind: "mute", y, h: 40, rect: { x: width / 2 - 90, y, w: 180, h: 38 } });
    y += 48;

    this.contentH = y;
    this.scrollY = Math.min(this.scrollY, this.maxScroll());
  }

  render(): void {
    const { ctx, width, height } = this.game.vp;
    const meta = this.game.meta;
    const pad = 14;

    // Scrollable content (clipped below header).
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, HEADER_H, width, height - HEADER_H);
    ctx.clip();

    for (const it of this.items) {
      if (it.kind === "label") {
        text(ctx, it.text, pad, HEADER_H + it.y - this.scrollY + 14, {
          size: 12,
          color: COLOR.textDim,
          weight: "700",
        });
      } else if (it.kind === "chassis") {
        this.drawChassis(it.rect, it.index);
      } else if (it.kind === "upgrade") {
        this.drawUpgrade(it.rect, it.index);
      } else if (it.kind === "blueprint") {
        this.drawBlueprint(it.rect, it.index);
      } else if (it.kind === "mute") {
        const r = this.screenRect(it.rect);
        button(ctx, r, meta.muted ? "🔇 Sound: OFF" : "🔊 Sound: ON", { color: COLOR.metal, textColor: COLOR.text });
      }
    }
    ctx.restore();

    // Scroll hint.
    if (this.maxScroll() > 0) {
      const frac = this.scrollY / this.maxScroll();
      const barH = 60;
      const track = height - HEADER_H - barH - 16;
      roundRect(ctx, width - 5, HEADER_H + 8 + frac * track, 3, barH, 2);
      ctx.fillStyle = COLOR.metalLight;
      ctx.fill();
    }

    // Fixed header.
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, width, HEADER_H);
    button(ctx, this.backBtn, "‹", { color: COLOR.metal, textColor: COLOR.text });
    text(ctx, "WORKSHOP", width / 2, 42, { size: 20, color: COLOR.text, align: "center", weight: "900" });
    text(ctx, `◆ ${meta.cores}`, width - pad, 42, { size: 18, color: COLOR.energy, align: "right", weight: "800" });
    ctx.strokeStyle = COLOR.gridLine;
    ctx.beginPath();
    ctx.moveTo(0, HEADER_H);
    ctx.lineTo(width, HEADER_H);
    ctx.stroke();
  }

  private drawChassis(rect: Rect, i: number): void {
    const { ctx } = this.game.vp;
    const meta = this.game.meta;
    const ch = CHASSIS_LIST[i];
    const r = this.screenRect(rect);
    const unlocked = meta.unlockedChassis.includes(ch.id);
    const selected = meta.selectedChassis === ch.id;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fillStyle = selected ? "#12232a" : COLOR.bgPanel;
    ctx.fill();
    ctx.strokeStyle = selected ? COLOR.energy : unlocked ? COLOR.metal : COLOR.gridLine;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, ch.name, r.x + r.w / 2, r.y + 20, { size: 13, color: COLOR.text, align: "center", weight: "800" });
    this.wrap(ch.desc, r.x + 6, r.y + 38, r.w - 12, 12, 9.5, COLOR.textDim);
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
  }

  private drawUpgrade(rect: Rect, i: number): void {
    const { ctx } = this.game.vp;
    const meta = this.game.meta;
    const up = UPGRADES[i];
    const r = this.screenRect(rect);
    const level = meta.upgrades[up.id];
    const maxed = level >= up.maxLevel;
    const cost = up.cost(level);
    text(ctx, `${up.name}  (${level}/${up.maxLevel})`, 14, r.y + 16, { size: 13, color: COLOR.text, weight: "700" });
    text(ctx, up.desc(level), 14, r.y + 32, { size: 10.5, color: COLOR.textDim });
    button(ctx, r, maxed ? "MAX" : `◆ ${cost}`, {
      color: maxed ? COLOR.bgPanel2 : COLOR.energy,
      textColor: maxed ? COLOR.textDim : "#05070a",
      disabled: maxed || meta.cores < cost,
    });
  }

  private drawBlueprint(rect: Rect, i: number): void {
    const { ctx } = this.game.vp;
    const meta = this.game.meta;
    const bp = BLUEPRINTS[i];
    const def = COMPONENTS[bp.id];
    const r = this.screenRect(rect);
    const owned = meta.unlockedBlueprints.includes(bp.id);
    roundRect(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fillStyle = COLOR.bgPanel;
    ctx.fill();
    ctx.strokeStyle = owned ? COLOR.ok : RARITY[def.rarity].color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, def.name, r.x + 8, r.y + 17, { size: 12, color: COLOR.text, weight: "700" });
    text(ctx, owned ? "OWNED" : `◆ ${bp.cost}`, r.x + r.w - 8, r.y + 17, {
      size: 12,
      color: owned ? COLOR.ok : meta.cores >= bp.cost ? COLOR.energy : COLOR.danger,
      align: "right",
      weight: "800",
    });
    text(ctx, RARITY[def.rarity].name, r.x + 8, r.y + 34, { size: 9.5, color: RARITY[def.rarity].color });
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
      } else line = test;
    }
    if (line) text(ctx, line, x, yy, { size, color, weight: "500" });
  }
}
