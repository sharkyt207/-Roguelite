/**
 * Small canvas drawing helpers shared across scenes. Keeps rendering code
 * declarative and consistent (rounded panels, buttons, text).
 */

import { COLOR } from "../core/theme";

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (w <= 0 || h <= 0) return;
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  opts: {
    size?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    weight?: string;
  } = {},
): void {
  const { size = 16, color = COLOR.text, align = "left", baseline = "alphabetic", weight = "600" } =
    opts;
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px -apple-system, "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

/** Soft radial vignette over the whole viewport for depth/focus. */
export function vignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength = 0.55): void {
  const g = ctx.createRadialGradient(w / 2, h * 0.46, Math.min(w, h) * 0.28, w / 2, h * 0.5, Math.max(w, h) * 0.75);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function button(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  label: string,
  opts: { color?: string; textColor?: string; disabled?: boolean } = {},
): void {
  const { color = COLOR.amber, textColor = "#05070a", disabled = false } = opts;
  ctx.save();
  ctx.globalAlpha = disabled ? 0.4 : 1;
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = color;
  ctx.fill();
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2, {
    size: Math.min(22, r.h * 0.42),
    color: textColor,
    align: "center",
    baseline: "middle",
    weight: "800",
  });
  ctx.restore();
}
