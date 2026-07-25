/**
 * Deterministic, seedable RNG (mulberry32). Deterministic seeds let us later
 * support Daily Runs (same seed → same run) and reproducible balancing tests.
 */

export class RNG {
  private state: number;

  constructor(seed: number = (Math.random() * 2 ** 32) >>> 0) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max]. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** Pick `n` distinct elements (or fewer if the pool is smaller). */
  sample<T>(arr: readonly T[], n: number): T[] {
    const pool = [...arr];
    const out: T[] = [];
    while (out.length < n && pool.length > 0) {
      const i = Math.floor(this.next() * pool.length);
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }
}
