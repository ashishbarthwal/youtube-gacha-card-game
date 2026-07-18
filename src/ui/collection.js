/* ui/collection — the collection grid.
   Reads shared state; owns its own DOM refs. */

import { RARITY_ORDER, toCount } from '../core.js';
import { state } from '../state.js';
import { renderCard } from './card.js';

const collGrid = document.getElementById('collection-grid');
const collSummary = document.getElementById('coll-summary');
const collEmpty = document.getElementById('coll-empty');

export function renderCollection() {
  const items = [...state.collection.values()].sort((a, b) =>
    RARITY_ORDER.indexOf(b.card.rarity) - RARITY_ORDER.indexOf(a.card.rarity)
    || toCount(b.card.channel.subscriberCount) - toCount(a.card.channel.subscriberCount));
  collGrid.innerHTML = '';
  let total = 0;
  for (const item of items) {
    total += item.count;
    collGrid.appendChild(renderCard(item.card, { count: item.count }));
  }
  collSummary.textContent = items.length ? `${items.length} unique · ${total} cards` : '';
  collEmpty.hidden = items.length > 0;
}
