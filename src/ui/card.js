/* ui/card — card markup + render, plus the per-channel accent logic.
   Remember the constraint: the avatar is a low-res uncontrolled 120px
   image. The frame and finish carry the look; the avatar is a small inset,
   the accent is sampled from it, the channel initial is a monogram. */

import { toCount } from '../core.js';
import { escapeHtml, formatCount } from './util.js';

function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4;
  }
  return [h * 60, s, l];
}

function hashAccent(seed) {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return `hsl(${h % 360} 70% 55%)`;
}

/* Accent color per channel: sample the avatar when the canvas stays clean,
   fall back to a hash of the id when CORS taints it. Cached as a promise. */
const accentCache = new Map();

function accentFor(channel) {
  if (accentCache.has(channel.id)) return accentCache.get(channel.id);
  const fallback = hashAccent(channel.id);
  const promise = new Promise(resolve => {
    if (!channel.avatarUrl) return resolve(fallback);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const size = 12;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0, g = 0, b = 0, n = 0;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
        const [h, s, l] = rgbToHsl(r / n, g / n, b / n);
        if (s < 0.08) return resolve(fallback); // near-grey avatar: hash reads better
        resolve(`hsl(${Math.round(h)} ${Math.round(clamp(s, 0.45, 0.85) * 100)}% ${Math.round(clamp(l, 0.42, 0.6) * 100)}%)`);
      } catch {
        resolve(fallback); // canvas tainted by a non-CORS avatar
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = channel.avatarUrl;
  });
  accentCache.set(channel.id, promise);
  return promise;
}

export function renderCard(card, { isNew = false, count = 0 } = {}) {
  const { channel, rarity, atk, def } = card;
  const el = document.createElement('article');
  el.className = `card r-${rarity}`;
  const initial = [...channel.title][0]?.toUpperCase() ?? '?';
  const subsLabel = channel.hiddenSubscriberCount
    ? 'subs hidden'
    : `${formatCount(toCount(channel.subscriberCount))} subs`;
  el.innerHTML = `
    <div class="card-frame"></div>
    <div class="monogram" aria-hidden="true">${escapeHtml(initial)}</div>
    <span class="rarity-badge">${rarity}</span>
    ${count > 1 ? `<span class="count-badge">×${count}</span>` : ''}
    ${isNew ? '<span class="new-badge">NEW</span>' : ''}
    <div class="card-body">
      <img class="avatar" alt="" src="${escapeHtml(channel.avatarUrl)}">
      <h3 class="card-name">${escapeHtml(channel.title)}</h3>
      <p class="card-subs">${escapeHtml(subsLabel)}</p>
      <div class="card-stats">
        <span class="stat atk"><em>ATK</em>${atk}</span>
        <span class="stat def"><em>DEF</em>${def}</span>
      </div>
    </div>`;
  accentFor(channel).then(color => el.style.setProperty('--accent', color));
  return el;
}
