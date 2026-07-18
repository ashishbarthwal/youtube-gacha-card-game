/* state — shared in-memory app state and its mutators.
   No persistence by design (DECISIONS.md): in-memory only, safe in
   sandboxed previews. The API key lives here in memory too, and nowhere
   else. */

import { toCard } from './core.js';
import { DEMO_CHANNELS } from './data/index.js';

export const state = {
  mode: 'demo',
  apiKey: '',                                  // memory only, by design
  demoPool: DEMO_CHANNELS.map(toCard),
  livePool: [],
  collection: new Map(),                       // channel id -> { card, count }
};

export function currentPool() {
  return state.mode === 'demo' ? state.demoPool : state.livePool;
}

export function addToCollection(card) {
  const owned = state.collection.get(card.channel.id);
  if (owned) {
    owned.count += 1;
    return { card, isNew: false };
  }
  state.collection.set(card.channel.id, { card, count: 1 });
  return { card, isNew: true };
}
