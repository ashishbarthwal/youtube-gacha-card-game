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
  setsPool: [],
  currentSet: null,                            // { slug, title, snapshotDate } once loaded
  collection: new Map(),                       // channel id -> { card, count }
};

export function currentPool() {
  if (state.mode === 'live') return state.livePool;
  if (state.mode === 'sets') return state.setsPool;
  return state.demoPool;
}

/* Load a parsed set (from data/sets.parseSet) as the active sets pool. Channels
   become cards through the same pure bridge as demo, so nothing downstream can
   tell a set from demo or live. */
export function setSetsPool(set) {
  state.setsPool = set.channels.map(toCard);
  state.currentSet = { slug: set.slug, title: set.title, snapshotDate: set.snapshotDate };
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
