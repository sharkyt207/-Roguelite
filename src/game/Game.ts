/**
 * Game orchestrator: owns the viewport, input, RNG and run state, runs the
 * fixed render/update loop, and switches between scenes (title → build →
 * combat → reward → …).
 */

import { createViewport, type Viewport } from "../core/canvas";
import { Input } from "../core/input";
import { RNG } from "../core/rng";
import { COLOR } from "../core/theme";
import { RunState } from "./run";

export interface Scene {
  update(dt: number): void;
  render(): void;
}

export class Game {
  readonly vp: Viewport;
  readonly input: Input;
  rng: RNG;
  run: RunState;
  private scene!: Scene;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.vp = createViewport(canvas);
    this.input = new Input(canvas);
    this.rng = new RNG();
    this.run = new RunState();
  }

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  newRun(): void {
    this.rng = new RNG();
    this.run = new RunState();
  }

  start(scene: Scene): void {
    this.scene = scene;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    // Clamp dt to avoid huge jumps after backgrounding the tab.
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const { ctx, width, height } = this.vp;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, width, height);

    this.scene.update(dt);
    this.scene.render();
    this.input.endFrame();

    requestAnimationFrame(this.frame);
  };
}
