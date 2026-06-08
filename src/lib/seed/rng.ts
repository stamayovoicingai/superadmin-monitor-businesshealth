/** Deterministic PRNG (mulberry32) so the demo dataset is reproducible. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;
  constructor(seed: number) {
    this.next = mulberry32(seed);
  }
  float(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[this.int(0, arr.length - 1)];
  }
  /** Weighted pick: items with weights. */
  weighted<T>(items: readonly { value: T; weight: number }[]): T {
    const total = items.reduce((s, i) => s + i.weight, 0);
    let r = this.float(0, total);
    for (const it of items) {
      if (r < it.weight) return it.value;
      r -= it.weight;
    }
    return items[items.length - 1].value;
  }
  bool(pTrue: number): boolean {
    return this.next() < pTrue;
  }
  /** Approx normal via sum of uniforms, clamped to [min,max]. */
  gaussian(mean: number, std: number, min: number, max: number): number {
    const u = (this.next() + this.next() + this.next() + this.next() - 2) / 2; // ~N(0,~0.4)
    const v = mean + u * std * 2.5;
    return Math.min(max, Math.max(min, v));
  }
}
