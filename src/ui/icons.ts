/**
 * Programmatic component icons — no image assets, drawn from primitives so they
 * stay crisp at any DPR and are trivial to recolour by element/rarity.
 */

import { COLOR, ELEMENT, RARITY, type ElementId } from "../core/theme";
import type { ComponentDef } from "../game/components";
import { roundRect } from "./draw";

export function drawComponentIcon(
  ctx: CanvasRenderingContext2D,
  def: ComponentDef,
  cx: number,
  cy: number,
  size: number,
  powered: boolean,
): void {
  const el = ELEMENT[def.element as ElementId];
  const r = size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);

  if (powered) {
    ctx.shadowColor = def.category === "core" ? COLOR.energy : el.glow;
    ctx.shadowBlur = size * 0.35;
  } else {
    ctx.globalAlpha = 0.5;
  }

  switch (def.category) {
    case "core": {
      ctx.fillStyle = COLOR.energy;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0a1512";
      ctx.lineWidth = size * 0.08;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "conduit": {
      ctx.strokeStyle = powered ? COLOR.energy : COLOR.metalLight;
      ctx.lineWidth = size * 0.12;
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, 0);
      ctx.lineTo(r * 0.6, 0);
      ctx.moveTo(0, -r * 0.6);
      ctx.lineTo(0, r * 0.6);
      ctx.stroke();
      ctx.fillStyle = powered ? COLOR.energy : COLOR.metalLight;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "weapon": {
      // Barrel pointing up, coloured by element.
      ctx.fillStyle = el.color;
      roundRect(ctx, -r * 0.28, -r * 0.72, r * 0.56, r * 1.3, size * 0.06);
      ctx.fill();
      ctx.fillStyle = COLOR.metal;
      roundRect(ctx, -r * 0.5, r * 0.1, r * 1.0, r * 0.5, size * 0.06);
      ctx.fill();
      break;
    }
    case "support": {
      ctx.fillStyle = COLOR.bgPanel2;
      roundRect(ctx, -r * 0.62, -r * 0.62, r * 1.24, r * 1.24, size * 0.14);
      ctx.fill();
      ctx.strokeStyle = el.color;
      ctx.lineWidth = size * 0.09;
      roundRect(ctx, -r * 0.62, -r * 0.62, r * 1.24, r * 1.24, size * 0.14);
      ctx.stroke();
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  ctx.restore();

  // Rarity pip (top-right).
  if (def.rarity !== "common") {
    ctx.fillStyle = RARITY[def.rarity].color;
    ctx.beginPath();
    ctx.arc(cx + size * 0.34, cy - size * 0.34, size * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}
