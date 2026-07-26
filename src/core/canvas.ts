/**
 * Canvas + rendering context management.
 *
 * Handles device-pixel-ratio scaling (crisp rendering on retina phones) and
 * resize. All game logic works in CSS pixels; the DPR transform is applied to
 * the context so drawing code never has to think about it.
 */

export interface Viewport {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  /** Logical width in CSS pixels. */
  width: number;
  /** Logical height in CSS pixels. */
  height: number;
  /** true for portrait phone-like aspect ratios. */
  portrait: boolean;
}

export function createViewport(canvas: HTMLCanvasElement): Viewport {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("2D canvas context unavailable");

  const vp: Viewport = { canvas, ctx, width: 0, height: 0, portrait: true };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    // Use the canvas's rendered size (CSS controls it via safe-area insets),
    // so all game coordinates live inside the safe area — never under the notch.
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    vp.width = w;
    vp.height = h;
    vp.portrait = h >= w;
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  // Mobile browser chrome show/hide changes the visual viewport height.
  window.visualViewport?.addEventListener("resize", resize);

  return vp;
}
