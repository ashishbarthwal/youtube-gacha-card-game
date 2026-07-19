/* ui/inspect — click a collection card to admire it large.
   A centered overlay over a blurred backdrop, holding one enlarged card with
   the same pointer tilt + holo finish enabled, so the card can be turned in
   the light. Self-contained close wiring (button, backdrop click, Escape),
   and it restores focus to whatever opened it. main just imports nothing —
   collection.js calls openInspect. */

import { renderCard } from './card.js';
import { enableCardTilt } from './holo.js';

const inspectEl = document.getElementById('inspect');
const inspectHolder = document.getElementById('inspect-holder');
const inspectClose = document.getElementById('inspect-close');
let lastTrigger = null;

/* Delegated on the persistent holder, so it keeps working as the card inside
   is swapped out on each open. */
enableCardTilt(inspectHolder);

export function openInspect(card, meta = {}) {
  lastTrigger = document.activeElement;
  inspectHolder.innerHTML = '';
  inspectHolder.appendChild(renderCard(card, meta));
  inspectEl.hidden = false;
  inspectClose.focus();
}

export function closeInspect() {
  inspectEl.hidden = true;
  inspectHolder.innerHTML = '';
  if (lastTrigger?.focus) lastTrigger.focus();
  lastTrigger = null;
}

inspectClose.addEventListener('click', closeInspect);
inspectEl.addEventListener('click', e => { if (e.target === inspectEl) closeInspect(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !inspectEl.hidden) closeInspect(); });
