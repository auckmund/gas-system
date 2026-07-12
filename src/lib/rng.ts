/** Deterministic seeded PRNG (mulberry32) for stable mock data */
export function createRng(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function randInt(rng: () => number, min: number, max: number) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function randFloat(rng: () => number, min: number, max: number, decimals = 1) {
  const v = rng() * (max - min) + min;
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

export function jitter(rng: () => number, value: number, amount: number) {
  return value + (rng() - 0.5) * amount * 2;
}
