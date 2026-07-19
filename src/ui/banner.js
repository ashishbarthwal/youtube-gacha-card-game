/* ui/banner — the banner section: mode toggle, live channel add/remove,
   pool chips, pull buttons, rates line and status messages.
   Owns its own DOM refs and events. initBanner({ onPull }) wires it up;
   the pull buttons call onPull(count) so main stays the composition root. */

import { RARITY, RARITY_ORDER, toCard } from '../core.js';
import { state, currentPool } from '../state.js';
import { resolveChannelInput, fetchLiveChannel } from '../data/index.js';
import { escapeHtml } from './util.js';

const modeDemoBtn = document.getElementById('mode-demo');
const modeLiveBtn = document.getElementById('mode-live');
const liveControls = document.getElementById('live-controls');
const apiKeyInput = document.getElementById('api-key');
const addInput = document.getElementById('add-input');
const addBtn = document.getElementById('add-btn');
const chipsEl = document.getElementById('pool-chips');
const statusEl = document.getElementById('status');
const pullBtn1 = document.getElementById('pull-1');
const pullBtn10 = document.getElementById('pull-10');
const pullBtnDev = document.getElementById('pull-dev');
const ratesEl = document.getElementById('rates');

let statusTimer = null;

function showStatus(message, isError = false) {
  clearTimeout(statusTimer);
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
  if (!isError && message) {
    statusTimer = setTimeout(() => { statusEl.textContent = ''; }, 3500);
  }
}

function renderPool() {
  const pool = currentPool();
  chipsEl.innerHTML = '';
  for (const card of pool) {
    const chip = document.createElement('span');
    chip.className = `chip r-${card.rarity}`;
    chip.innerHTML =
      `<img src="${escapeHtml(card.channel.avatarUrl)}" alt="">` +
      `<span>${escapeHtml(card.channel.title)}</span>` +
      `<b class="dot" title="${card.rarity}"></b>` +
      (state.mode === 'live'
        ? `<button class="chip-x" type="button" data-id="${escapeHtml(card.channel.id)}" aria-label="Remove ${escapeHtml(card.channel.title)}">×</button>`
        : '');
    chipsEl.appendChild(chip);
  }
  if (!pool.length) {
    chipsEl.innerHTML = '<p class="empty">Banner is empty — add a channel above to start pulling.</p>';
  }
  pullBtn1.disabled = pullBtn10.disabled = pullBtnDev.disabled = !pool.length;
}

function setMode(mode) {
  state.mode = mode;
  modeDemoBtn.classList.toggle('active', mode === 'demo');
  modeLiveBtn.classList.toggle('active', mode === 'live');
  liveControls.hidden = mode !== 'live';
  showStatus('');
  renderPool();
}

async function onAddChannel() {
  const resolved = resolveChannelInput(addInput.value);
  if (resolved.error) return showStatus(resolved.error, true);
  if (!state.apiKey) return showStatus('Paste your YouTube Data API key first.', true);

  addBtn.disabled = true;
  addBtn.textContent = 'Adding…';
  try {
    const channel = await fetchLiveChannel(resolved, state.apiKey);
    if (state.livePool.some(card => card.channel.id === channel.id)) {
      showStatus(`${channel.title} is already in the banner.`, true);
    } else {
      state.livePool.push(toCard(channel));
      addInput.value = '';
      showStatus(`Added ${channel.title}.`);
      renderPool();
    }
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Add';
  }
}

export function initBanner({ onPull, onDevPull }) {
  modeDemoBtn.addEventListener('click', () => setMode('demo'));
  modeLiveBtn.addEventListener('click', () => setMode('live'));
  apiKeyInput.addEventListener('input', () => { state.apiKey = apiKeyInput.value.trim(); });
  addBtn.addEventListener('click', onAddChannel);
  addInput.addEventListener('keydown', e => { if (e.key === 'Enter') onAddChannel(); });
  pullBtn1.addEventListener('click', () => onPull(1));
  pullBtn10.addEventListener('click', () => onPull(10));
  pullBtnDev.addEventListener('click', () => onDevPull());

  chipsEl.addEventListener('click', e => {
    const btn = e.target.closest('.chip-x');
    if (!btn) return;
    state.livePool = state.livePool.filter(card => card.channel.id !== btn.dataset.id);
    renderPool();
  });

  ratesEl.textContent =
    'Pull weights per channel — ' + RARITY_ORDER.map(r => `${r} ${RARITY[r].weight}`).join(' · ');
  setMode('demo');
}
