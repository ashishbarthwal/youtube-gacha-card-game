/* ui/reveal — the flip + light-ray pull reveal overlay.
   Self-contained: owns its own close wiring (Done button, backdrop click,
   Escape). main just calls openReveal(results). */

import { renderCard } from './card.js';

const revealEl = document.getElementById('reveal');
const revealGrid = document.getElementById('reveal-grid');
const revealDone = document.getElementById('reveal-done');
let revealTimers = [];

const CARD_BACK_HTML =
  '<div class="back-rings"></div><div class="back-play"></div><div class="back-word">YOUTUBE GACHA</div>';

export function openReveal(results) {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  revealGrid.innerHTML = '';
  /* Pin the column count so a x10 is always 5-across (2 rows); a scrollbar
     stealing width can't reflow it to 4. Fewer cards use fewer columns. */
  revealGrid.style.setProperty('--reveal-cols', Math.min(results.length, 5));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  results.forEach((result, i) => {
    const cell = document.createElement('div');
    cell.className = `reveal-cell glow-${result.card.rarity}`;

    if (['SR', 'SSR', 'UR'].includes(result.card.rarity)) {
      const rays = document.createElement('div');
      rays.className = 'rays';
      cell.appendChild(rays);
    }

    const flip = document.createElement('div');
    flip.className = 'flip';
    const inner = document.createElement('div');
    inner.className = 'flip-inner';
    const back = document.createElement('div');
    back.className = 'face back card-back';
    back.innerHTML = CARD_BACK_HTML;
    const front = document.createElement('div');
    front.className = 'face front';
    front.appendChild(renderCard(result.card, { isNew: result.isNew }));
    inner.append(back, front);
    flip.appendChild(inner);
    cell.appendChild(flip);

    const flipNow = () => cell.classList.add('flipped');
    if (reduced) flipNow();
    else {
      revealTimers.push(setTimeout(flipNow, 450 + i * 160));
      cell.addEventListener('click', flipNow);
    }
    revealGrid.appendChild(cell);
  });

  revealEl.hidden = false;
  revealDone.focus();
}

export function closeReveal() {
  revealTimers.forEach(clearTimeout);
  revealTimers = [];
  revealEl.hidden = true;
}

revealDone.addEventListener('click', closeReveal);
revealEl.addEventListener('click', e => { if (e.target === revealEl) closeReveal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !revealEl.hidden) closeReveal(); });
