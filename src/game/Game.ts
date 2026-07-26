/**
 * Game orchestrator: owns the viewport, input, RNG, meta save and run state,
 * runs the render/update loop, and switches between scenes.
 */

import { createViewport, type Viewport } from "../core/canvas";
import { Input } from "../core/input";
import { RNG } from "../core/rng";
import { COLOR } from "../core/theme";
import { Audio } from "../core/audio";
import { RunState } from "./run";
import { loadMeta, saveMeta, type MetaSave } from "./meta";

export interface Scene {
  update(dt: number): void;
  render(): void;
}

export class Game {
  readonly vp: Viewport;
  readonly input: Input;
  readonly audio: Audio;
  rng: RNG;
  meta: MetaSave;
  run: RunState;
  /** Screen-shake magnitude in px, decays over time (Block C). */
  shake = 0;
  /** True during a run while first-time coach marks should be shown. */
  tutorialActive = false;
  private scene!: Scene;
  private lastTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.vp = createViewport(canvas);
    this.input = new Input(canvas);
    this.meta = loadMeta();
    this.audio = new Audio(this.meta.muted);
    this.rng = new RNG();
    this.run = new RunState(this.meta);
  }

  setScene(scene: Scene): void {
    this.scene = scene;
  }

  newRun(): void {
    this.rng = new RNG();
    this.run = new RunState(this.meta);
    this.tutorialActive = !this.meta.seenTutorial;
  }

  saveMeta(): void {
    saveMeta(this.meta);
  }

  addShake(amount: number): void {
    this.shake = Math.min(16, this.shake + amount);
  }

  start(scene: Scene): void {
    this.scene = scene;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    const { ctx, width, height } = this.vp;
    ctx.fillStyle = COLOR.bg;
    ctx.fillRect(0, 0, width, height);

    // Screen shake (applied around the whole scene render).
    ctx.save();
    if (this.shake > 0.2) {
      const a = this.shake;
      ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
      this.shake *= Math.pow(0.001, dt); // fast exponential decay
    } else {
      this.shake = 0;
    }

    // If a scene switches during update, defer the new scene's first render to
    // next frame so its update (layout) always runs before it renders.
    const active = this.scene;
    active.update(dt);
    if (this.scene === active) this.scene.render();
    ctx.restore();

    this.input.endFrame();
    requestAnimationFrame(this.frame);
  };
}
