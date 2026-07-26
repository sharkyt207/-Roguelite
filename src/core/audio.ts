/**
 * Tiny Web Audio synth for SFX (Block C). No audio assets — every sound is
 * generated from oscillators, so it stays self-contained and weightless.
 *
 * The AudioContext is created lazily and resumed on the first user gesture to
 * satisfy mobile autoplay policies.
 */

type Sfx = "hit" | "kill" | "hurt" | "place" | "deploy" | "overcharge" | "ui" | "win" | "lose" | "boss";

export type MusicMode = "menu" | "combat" | "boss";

interface MusicConf {
  root: number; // root frequency
  beat: number; // seconds per 16th step
  bassPattern: number[]; // semitone offsets for bass hits
  bassGain: number;
  lead: boolean;
  leadEvery: number; // play a lead note every N steps
  leadOffset: number;
  leadGain: number;
  pad: boolean;
  padGain: number;
}

const MUSIC: Record<MusicMode, MusicConf> = {
  menu: {
    root: 220,
    beat: 0.34,
    bassPattern: [0, 5, 3, 7],
    bassGain: 0.05,
    lead: true,
    leadEvery: 8,
    leadOffset: 0,
    leadGain: 0.03,
    pad: true,
    padGain: 0.025,
  },
  combat: {
    root: 220,
    beat: 0.19,
    bassPattern: [0, 0, 7, 5],
    bassGain: 0.06,
    lead: true,
    leadEvery: 2,
    leadOffset: 2,
    leadGain: 0.035,
    pad: false,
    padGain: 0,
  },
  boss: {
    root: 196, // slightly lower, tenser
    beat: 0.16,
    bassPattern: [0, 1, 0, -2],
    bassGain: 0.07,
    lead: true,
    leadEvery: 2,
    leadOffset: 1,
    leadGain: 0.04,
    pad: true,
    padGain: 0.04,
  },
};

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  muted: boolean;
  musicOn: boolean;
  private hitThrottle = 0;

  // Generative music state.
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private nextNote = 0;
  private step = 0;
  private mode: MusicMode = "menu";

  constructor(muted: boolean, musicOn = true) {
    this.muted = muted;
    this.musicOn = musicOn;
  }

  private ensure(): void {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
  }

  /** Call on any user gesture to unlock audio on mobile. */
  resume(): void {
    this.ensure();
    this.ctx?.resume();
    if (this.musicOn && !this.musicTimer) this.startMusicLoop();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  toggleMusic(): boolean {
    this.musicOn = !this.musicOn;
    if (this.musicOn) this.startMusicLoop();
    else this.stopMusic();
    return this.musicOn;
  }

  /** Switch the musical mood (menu / combat / boss). */
  setMusic(mode: MusicMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.step = 0;
  }

  private stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private startMusicLoop(): void {
    this.ensure();
    if (!this.ctx || this.musicTimer !== null) return;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.musicTimer = window.setInterval(() => this.scheduleMusic(), 30);
  }

  /** Lookahead scheduler: queue notes slightly ahead of the audio clock. */
  private scheduleMusic(): void {
    if (!this.ctx || !this.musicGain) return;
    if (this.muted || !this.musicOn) return;
    const beat = MUSIC[this.mode].beat;
    while (this.nextNote < this.ctx.currentTime + 0.12) {
      this.playMusicStep(this.nextNote);
      this.nextNote += beat;
      this.step = (this.step + 1) % 16;
    }
  }

  private playMusicStep(when: number): void {
    if (!this.ctx || !this.musicGain) return;
    const conf = MUSIC[this.mode];
    const root = conf.root;
    const scale = [0, 3, 5, 7, 10, 12]; // minor pentatonic + octave

    // Bass on beats 0,4,8,12.
    if (this.step % 4 === 0) {
      const bassSemi = conf.bassPattern[(this.step / 4) % conf.bassPattern.length];
      this.musicNote(root * Math.pow(2, bassSemi / 12) / 2, when, conf.beat * 3.2, "triangle", conf.bassGain);
    }
    // Lead / arpeggio.
    if (conf.lead && this.step % conf.leadEvery === 0) {
      const note = scale[(this.step + conf.leadOffset) % scale.length];
      this.musicNote(root * Math.pow(2, note / 12), when, conf.beat * 1.6, "sine", conf.leadGain);
    }
    // Boss tension pad.
    if (conf.pad && this.step % 8 === 0) {
      this.musicNote(root * Math.pow(2, -5 / 12), when, conf.beat * 7, "sawtooth", conf.padGain);
    }
  }

  private musicNote(freq: number, when: number, dur: number, type: OscillatorType, gain: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(this.musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.05);
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
