/* ui/banner — the banner section: mode toggle, live channel add/remove,
   pool chips, pull buttons, rates line and status messages.
   Owns its own DOM refs and events. initBanner({ onPull }) wires it up;
   the pull buttons call onPull(count) so main stays the composition root. */

import { RARITY, RARITY_ORDER, toCard } from '../core.js';
import { state, currentPool, setSetsPool } from '../state.js';
import { resolveChannelInput, fetchLiveChannel, loadSet, parseSet, STARTER_SET } from '../data/index.js';
import { escapeHtml } from './util.js';

/* The bundled starter set is offered as the first, always-present option. Its
   picker value is this sentinel (real sets use their file path), so selecting
   it skips the fetch and loads from memory. */
const STARTER_VALUE = '@starter';

const modeSetsBtn = document.getElementById('mode-sets');
const modeLiveBtn = document.getElementById('mode-live');
const setsControls = document.getElementById('sets-controls');
const setSelect = document.getElementById('set-select');
const setMeta = document.getElementById('set-meta');
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
    const msg = state.mode === 'live'
      ? 'Banner is empty — add a channel above to start pulling.'
      : 'Loading set…';
    chipsEl.innerHTML = `<p class="empty">${msg}</p>`;
  }
  pullBtn1.disabled = pullBtn10.disabled = pullBtnDev.disabled = !pool.length;
}

function setMode(mode) {
  state.mode = mode;
  modeSetsBtn.classList.toggle('active', mode === 'sets');
  modeLiveBtn.classList.toggle('active', mode === 'live');
  liveControls.hidden = mode !== 'live';
  setsControls.hidden = mode !== 'sets';
  showStatus('');
  if (mode === 'sets') ensureSets();
  renderPool();
}

/* The picker is seeded once: the bundled starter set goes in first and loads
   synchronously (no fetch, so the default view paints instantly and still works
   offline), then the fetchable-set manifest is appended when it arrives. If
   that fetch fails, the starter set is untouched and remains pullable. */
let setsSeeded = false;

function ensureSets() {
  if (setsSeeded) return;
  setsSeeded = true;
  const opt = document.createElement('option');
  opt.value = STARTER_VALUE;
  opt.textContent = STARTER_SET.title;
  setSelect.appendChild(opt);
  selectStarter();          // synchronous: setsPool is ready before renderPool runs
  appendManifestSets();     // async: offer the fetchable sets once loaded
}

/* Load the bundled starter set from memory, through the same parseSet → toCard
   path a fetched set uses. No snapshot label — the starter set isn't dated. */
function selectStarter() {
  setSetsPool(parseSet(STARTER_SET));
  setMeta.textContent = '';
  renderPool();
}

async function appendManifestSets() {
  try {
    const res = await fetch('sets/index.json');
    if (!res.ok) throw new Error();
    const { sets } = await res.json();
    for (const s of sets ?? []) {
      const opt = document.createElement('option');
      opt.value = s.file;
      opt.textContent = s.title;
      setSelect.appendChild(opt);
    }
  } catch {
    // The starter set still works; the extra sets just aren't offered.
    showStatus('Could not load the additional set list.', true);
  }
}

async function loadSelectedSet() {
  const value = setSelect.value;
  if (value === STARTER_VALUE) return selectStarter();
  showStatus('Loading set…');
  try {
    const set = await loadSet(value);
    setSetsPool(set);
    setMeta.textContent = set.snapshotDate ? `Stats as of ${set.snapshotDate}` : '';
    showStatus('');
  } catch (err) {
    setMeta.textContent = '';
    showStatus(err.message, true);
  }
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
  modeSetsBtn.addEventListener('click', () => setMode('sets'));
  modeLiveBtn.addEventListener('click', () => setMode('live'));
  setSelect.addEventListener('change', loadSelectedSet);
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
  setMode('sets');

  /* Local dev convenience: if a gitignored src/config.local.js exists and
     exports a YOUTUBE_API_KEY, pre-fill the Live API field so testing live
     mode needs no re-paste. The file never ships (see .gitignore), so the
     dynamic import simply rejects — and is ignored — everywhere else. */
  import('../config.local.js')
    .then(({ YOUTUBE_API_KEY }) => {
      const key = String(YOUTUBE_API_KEY ?? '').trim();
      if (!key) return;
      apiKeyInput.value = key;
      state.apiKey = key;
    })
    .catch(() => { /* no local config — the normal case */ });
}
