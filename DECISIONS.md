# Decisions

Append-only. One entry per decision that closes off an option. Newest at the bottom.

---

**No monetization in the game.** No paid pulls, currency, perks, or ads. YouTube API ToS
restricts commercial use, cards use creators' names and likenesses, and paid gacha invites
gambling and minor-protection regulation. Harusugi ran Wikigacha free at launch with only a
Buy Me a Coffee link. We do the same.

**One Buy Me a Coffee link, no strings.** Passive tip jar in the footer. It buys Ash a
coffee and never unlocks anything in-game. If a donation ever grants in-game value, every
IP and legal problem above comes back.

**Client-side only, user-supplied API key.** Static host, no backend. This is what makes
the cost question mostly evaporate, which is what makes the monetization question easy.

**No build step.** Plain ES modules. Vitest is a dev dependency and does not touch the
shipped artifact.

**Split the single file into modules (WP0).** Vitest cannot import functions out of a
`<script>` tag inside an HTML file, so the single-file build made the test suite
impossible. The tests are a portfolio goal, so the file structure has to serve them.

**Handles and UC ids only.** `/c/` vanity URLs are not resolved. They require an extra
search API call and a heuristic match, and the cost is not worth it.

**No persistence yet.** In-memory state only, to stay safe in sandboxed previews.
Revisit once the app is being served from a real static host.

**Hidden subscriber counts read as N.** The API omits `subscriberCount` and sets
`hiddenSubscriberCount: true` for channels that hide it. The core treats that — and any
malformed count — as the lowest band rather than throwing, so a card always renders.
To be pinned by tests in WP1.

**Accent color: sample the avatar, fall back to a hash.** Live avatars are cross-origin;
when canvas sampling is blocked (CORS taint) or the avatar is near-grey, the accent is
derived from a hash of the channel id instead. Deterministic either way, never blocks
rendering.

**Card sets are the primary pull source.** Curated, versioned channel snapshots ("Series")
ship as static JSON — players never need an API key. Demo mode becomes the built-in starter
set; live BYO-key mode stays as a power feature. Chosen over shipping a shared
referrer-restricted key as the default (that stays open as a fallback idea).

**Series are monthly printings of ~300–500 cards.** YouTube's Developer Policies cap stored
statistics at 30 days, so a scheduled snapshot refresh re-cuts each set monthly and cards
carry a "stats as of <month>" label. Compliance and TCG set-symbol flavor from one mechanism.
Curation flow: candidate lists are drafted with a target rarity mix (~N 40 / R 30 / SR 18 /
SSR 9 / UR 3 %), then human-approved before snapshotting.

**One app, many banners — the codebase never forks.** Genre sets (gaming, commentary, …) are
banners inside a single deployment. Themed sister deployments stay possible later from the
same code with different default set + palette, but they are a deploy config, not a fork.

**Opt-out for channel owners.** Real people become cards, so the footer gains a contact
line and removal requests are honored promptly (policy requires deletion within 7 days for
user-data requests; we extend the courtesy to set membership).

**WP0 done: monolith split, entry is `index.html`.** `youtube-gacha.html` is deleted; the
app is ES modules under `src/`, loaded via `<script type="module" src="src/main.js">`.
Behavior is unchanged (verified: pure-core values match, and demo mode boots to the
identical 8-chip banner). `toCard` moved into `core.js` (it is pure — the model bridge,
not a renderer) so `state.js` depends on `core`, never the reverse.

**Two files beyond the planned tree: `src/state.js` and `src/ui/util.js`.** `state.js`
holds the shared in-memory `state` + `currentPool`/`addToCollection` so `banner`,
`collection`, and `main` import one owner instead of threading it through every call.
`ui/util.js` holds `escapeHtml` (used by both `card` and `banner`) rather than coupling
`banner → card` for a generic helper. `main.js` stays wiring-only; `banner` takes an
`onPull` callback so it never imports the pull glue.

**Live adapter normalizes `customUrl` to the `@handle` shape.** The API's
`customUrl` is not guaranteed handle-shaped — older channels return a bare,
lowercased vanity string ("mkbhd") where the modern format is "@mkbhd". The
live adapter prepends `@` when missing so the `handle` field always matches the
Channel typedef and the demo/sets adapters. Empty stays empty.

**WP1 done: 56 tests pin the pure core and the pull engine.** Vitest is the repo's first
and only dependency, dev-only — the shipped app still has zero. `test/core.test.js` pins
every rarity boundary from both sides (string and number inputs), the hidden-subs-read-as-N
rule, junk-input safety, and monotonic/multiplier stat scaling. `test/gacha.test.js` injects
mulberry32 (a tiny seeded PRNG) so x10 size, dupe stacking, and the N>R>SR>SSR>UR frequency
order are exact, reproducible assertions rather than flaky statistics.

**Local dev needs a JS-MIME static server, not `file://`.** ES modules are blocked over
`file://`, and browsers reject module scripts served as `text/plain` (Python's
`http.server` does this on Windows). `npx serve` is the recommended local server;
GitHub Pages / Netlify serve correct types, so hosting is unaffected. README updated.

**Test report is a self-contained monolith HTML, rendered from the JUnit XML.**
`@vitest/ui`'s HTML report was tried and dropped: it is an app (assets folder, gzipped
metadata, needs a server), and a report should be a document — double-clickable,
mailable, archivable. `tools/test-report.js` renders the JUnit XML we already emit into
one dependency-free HTML file per run, timestamped, failure traces inline. Dev
dependencies are back down to Vitest alone. The failure path is verified, not assumed:
a deliberately failing test must render a FAIL report and exit non-zero for CI.
