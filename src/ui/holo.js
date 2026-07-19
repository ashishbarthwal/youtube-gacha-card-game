/* ui/holo — the WP3 pointer tilt + poke-holo shine.
   Purely presentational: it writes CSS custom properties the card's own rules
   read, and toggles the .lit class. The rarity gating and every visual value
   live in styles.css (the three --*-strength / --tilt-max properties); this
   file only supplies the pointer coordinates.

   Bound by delegation on a container, so it survives the collection grid
   re-rendering its children. Enabled only where it can work well: a fine
   pointer with motion allowed. Touch and reduced-motion fall back to the
   static CSS finish, so cards are never left broken — see styles.css. */

export function enableCardTilt(root) {
  if (!root) return;
  // Coarse pointers can't hover-track; reduced-motion opts out of tilt/shine.
  // Both cases are handled statically in CSS, so we simply don't bind here.
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let lit = null;
  const clear = () => {
    if (lit) { lit.classList.remove('lit'); lit = null; }
  };

  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.card');
    if (!card || !root.contains(card)) { clear(); return; }
    if (card !== lit) { clear(); lit = card; card.classList.add('lit'); }

    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;   // 0..1 across the card
    const py = (e.clientY - r.top) / r.height;   // 0..1 down the card
    card.style.setProperty('--px', ((px - 0.5) * 2).toFixed(3)); // -1..1 for tilt
    card.style.setProperty('--py', ((py - 0.5) * 2).toFixed(3));
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%'); // shine position
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
  });

  root.addEventListener('pointerleave', clear);
}
