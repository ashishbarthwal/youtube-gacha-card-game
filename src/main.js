/* main — wiring only. Composes the pure core, the gacha engine, the data
   seam and the UI modules; holds nothing of its own but the pull glue. */

import { pull } from './gacha.js';
import { currentPool, addToCollection } from './state.js';
import { initBanner } from './ui/banner.js';
import { renderCollection } from './ui/collection.js';
import { openReveal } from './ui/reveal.js';

function doPull(count) {
  const pool = currentPool();
  if (!pool.length) return;
  const results = pull(pool, count).map(addToCollection);
  renderCollection();
  openReveal(results);
}

initBanner({ onPull: doPull });
renderCollection();
