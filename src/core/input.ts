/**
 * Unified pointer/touch input. Supports multi-touch so that steering (one
 * thumb) and UI taps (another thumb) can happen simultaneously.
 *
 * Coordinates are reported in CSS pixels, matching the Viewport coordinate space.
 */

export interface Pointer {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  /** Set on the frame the pointer went down. */
  justPressed: boolean;
  /** Set on the frame the pointer was released (kept for one poll). */
  justReleased: boolean;
}

export class Input {
  private pointers = new Map<number, Pointer>();
  private released: Pointer[] = [];

  constructor(target: HTMLElement) {
    const rect = () => target.getBoundingClientRect();

    target.addEventListener(
      "pointerdown",
      (e) => {
        const r = rect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        this.pointers.set(e.pointerId, {
          id: e.pointerId,
          x,
          y,
          startX: x,
          startY: y,
          justPressed: true,
          justReleased: false,
        });
        target.setPointerCapture?.(e.pointerId);
        e.preventDefault();
      },
      { passive: false },
    );

    target.addEventListener(
      "pointermove",
      (e) => {
        const p = this.pointers.get(e.pointerId);
        if (!p) return;
        const r = rect();
        p.x = e.clientX - r.left;
        p.y = e.clientY - r.top;
        e.preventDefault();
      },
      { passive: false },
    );

    const end = (e: PointerEvent) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      p.justReleased = true;
      this.released.push(p);
      this.pointers.delete(e.pointerId);
      e.preventDefault();
    };
    target.addEventListener("pointerup", end, { passive: false });
    target.addEventListener("pointercancel", end, { passive: false });
  }

  /** Currently held pointers. */
  get active(): Pointer[] {
    return [...this.pointers.values()];
  }

  /** Pointers released since the previous frame. */
  get releasedThisFrame(): Pointer[] {
    return this.released;
  }

  /** First currently-held pointer, if any. */
  get primary(): Pointer | undefined {
    return this.pointers.values().next().value;
  }

  /** Must be called at the end of each frame to clear per-frame flags. */
  endFrame(): void {
    for (const p of this.pointers.values()) p.justPressed = false;
    this.released = [];
  }
}
