/* test/gacha — pins the pull engine with a seeded RNG.
   gacha.js takes rng as a parameter precisely so these tests can inject a
   deterministic sequence: with a fixed seed the distribution is exact and
   repeatable, so "rare cards are rare" is a real assertion, not a vibe. */

import { describe, it, expect } from 'vitest';
import { pull, pullOne } from '../src/gacha.js';

/* mulberry32 — tiny seedable PRNG, deterministic across runs and platforms. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Minimal pool: gacha only reads card.rarity; ids identify pulls. */
function poolOfEachRarity() {
  return ['N', 'R', 'SR', 'SSR', 'UR'].map(rarity => ({ rarity, channel: { id: `id-${rarity}` } }));
}

describe('pull — shape', () => {
  it('x10 returns exactly 10 cards', () => {
    expect(pull(poolOfEachRarity(), 10, mulberry32(1))).toHaveLength(10);
  });

  it('x1 returns exactly 1 card', () => {
    expect(pull(poolOfEachRarity(), 1, mulberry32(1))).toHaveLength(1);
  });

  it('empty pool returns an empty result, never throws', () => {
    expect(pull([], 10, mulberry32(1))).toEqual([]);
  });

  it('every result is a member of the pool', () => {
    const pool = poolOfEachRarity();
    for (const card of pull(pool, 50, mulberry32(7))) {
      expect(pool).toContain(card);
    }
  });
});

describe('pull — dupes stack rather than drop', () => {
  it('a rigged rng returns the same card ten times, and all ten are kept', () => {
    const pool = poolOfEachRarity();
    const alwaysZero = () => 0; // roll 0 always lands on the first (N) card
    const results = pull(pool, 10, alwaysZero);
    expect(results).toHaveLength(10);
    expect(new Set(results).size).toBe(1);
    expect(results[0].channel.id).toBe('id-N');
  });

  it('a seeded x10 keeps its duplicates — result length beats unique count', () => {
    /* Seed chosen so the draw contains at least one dupe; with weights
       55/27/12/5/1 over 10 draws that is near-certain, and the seed pins it. */
    const results = pull(poolOfEachRarity(), 10, mulberry32(42));
    expect(results.length).toBe(10);
    expect(new Set(results).size).toBeLessThan(10);
  });
});

describe('pull — weighting favors low rarity (seeded, deterministic)', () => {
  it('over 1000 seeded pulls, frequency follows the weight table strictly', () => {
    const pool = poolOfEachRarity();
    const rng = mulberry32(2026);
    const counts = { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 };
    for (const card of pull(pool, 1000, rng)) counts[card.rarity]++;

    /* Weights are 55/27/12/5/1 — the observed order must match exactly. */
    expect(counts.N).toBeGreaterThan(counts.R);
    expect(counts.R).toBeGreaterThan(counts.SR);
    expect(counts.SR).toBeGreaterThan(counts.SSR);
    expect(counts.SSR).toBeGreaterThan(counts.UR);

    /* And the commonest band dominates: N alone is a majority of all pulls. */
    expect(counts.N).toBeGreaterThan(500);
  });

  it('the same seed reproduces the identical sequence', () => {
    const pool = poolOfEachRarity();
    const a = pull(pool, 100, mulberry32(99)).map(c => c.rarity);
    const b = pull(pool, 100, mulberry32(99)).map(c => c.rarity);
    expect(a).toEqual(b);
  });
});

describe('pullOne — float edge', () => {
  it('an rng returning 1.0 (past Math.random range) still lands on the last card', () => {
    const pool = poolOfEachRarity();
    expect(pullOne(pool, () => 1)).toBe(pool[pool.length - 1]);
  });
});
