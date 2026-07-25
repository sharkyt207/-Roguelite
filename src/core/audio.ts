/**
 * Tiny Web Audio synth for SFX (Block C). No audio assets — every sound is
 * generated from oscillators, so it stays self-contained and weightless.
 *
 * The AudioContext is created lazily and resumed on the first user gesture to
 * satisfy mobile autoplay policies.
 */

type Sfx = "hit" | "kill" | "hurt" | "place" | "deploy" | "overcharge" | "ui" | "win" | "lose" | "boss";

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted: boolean;
  private hitThrottle = 0;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  private ensure(): void {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  /** Call on any user gesture to unlock audio on mobile. */
  resume(): void {
    this.ensure();
    this.ctx?.resume();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slideTo?: number): void {
    if (this.muted || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  play(name: Sfx): void {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    switch (name) {
      case "hit":
        // Throttle so dense combat doesn't machine-gun the speaker.
        if (this.ctx.currentTime < this.hitThrottle) return;
        this.hitThrottle = this.ctx.currentTime + 0.04;
        this.tone(180 + Math.random() * 40, 0.05, "square", 0.05);
        break;
      case "kill":
        this.tone(320, 0.12, "triangle", 0.07, 120);
        break;
      case "hurt":
        this.tone(140, 0.18, "sawtooth", 0.09, 70);
        break;
      case "place":
        this.tone(520, 0.06, "triangle", 0.08, 700);
        break;
      case "ui":
        this.tone(660, 0.05, "square", 0.05);
        break;
      case "deploy":
        this.tone(160, 0.18, "sawtooth", 0.08, 320);
        break;
      case "overcharge":
        this.tone(200, 0.35, "sawtooth", 0.1, 1600);
        break;
      case "boss":
        this.tone(90, 0.5, "sawtooth", 0.12, 60);
        break;
      case "win":
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => this.tone(f, 0.22, "triangle", 0.08), i * 130),
        );
        break;
      case "lose":
        [400, 320, 240, 160].forEach((f, i) =>
          setTimeout(() => this.tone(f, 0.3, "sawtooth", 0.09), i * 150),
        );
        break;
    }
  }
}
