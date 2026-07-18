/* gacha — weighted pull, x1/x10, dupes stack.
   RNG is injectable; Math.random is only ever a default parameter so tests
   can inject a deterministic seed. */

import { RARITY } from './core.js';

export function pullOne(pool, rng = Math.random) {
  const total = pool.reduce((sum, card) => sum + RARITY[card.rarity].weight, 0);
  let roll = rng() * total;
  for (const card of pool) {
    roll -= RARITY[card.rarity].weight;
    if (roll < 0) return card;
  }
  return pool[pool.length - 1]; // float edge: roll never dipped below zero
}

export function pull(pool, count, rng = Math.random) {
  if (!pool.length) return [];
  return Array.from({ length: count }, () => pullOne(pool, rng));
}
