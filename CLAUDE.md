# YouTube Gacha

Browser-based gacha game where YouTube channels become collectible trading cards.
Card stats are derived from real channel data, the same trick Wikigacha (Harusugi, Feb 2026)
plays with Wikipedia article metrics.

This is a portfolio piece and fan tribute. Not a business.

## Owner context

Ash — SDET moving into AI engineering. This repo doubles as a portfolio artifact,
so **test quality is a first-class feature, not an afterthought**. The pure derivation
functions exist partly to be tested in public.

## The core mapping

| Wikigacha | YouTube Gacha |
|---|---|
| Article quality rank -> rarity | Subscriber count -> rarity |
| Pageviews -> ATK | View count -> ATK |
| Article length -> DEF | Video count -> DEF |

Rarity bands: N (<100K) -> R (<1M) -> SR (<10M) -> SSR (<50M) -> UR (50M+)

## Locked decisions — do not reopen

1. **No monetization inside the game.** No paid pulls, no currency, no perks, no ads.
   Reasons: YouTube API ToS restricts commercial use, cards use creators' names and
   likenesses, and paid gacha invites gambling and minor-protection regulation.
2. **One exception:** a single Buy Me a Coffee link in the footer. Passive, understated,
   no popups, no nags. **Hard rule: the coffee buys Ash a coffee. It never unlocks
   anything in the game.** The moment a donation grants in-game value, every IP and legal
   problem comes back.
3. **Client-side only.** Static host (GitHub Pages / Netlify). Users bring their own
   YouTube Data API key. No backend, no server, near-zero hosting cost.
4. **No build step.** Plain ES modules, served as-is. Vitest runs in dev only.
5. **Unofficial.** Footer must carry a disclaimer: not affiliated with or endorsed by
   YouTube or Google. (Wikigacha does the same for Wikipedia.)

## Scope boundaries

Currently out of scope: battles, decks, pity system, `/c/` vanity URL resolution
(handles and UC ids only), server-side persistence, accounts.

Deliberate constraint: card "art" is a low-res, uncontrolled ~120px avatar. **Lean on the
frame and the finish, not the art.** Avatar goes in as a small inset. Pull an accent color
from it. Use the channel initial as a monogram.

## Architecture

Two things matter structurally:

**The data seam.** `demo`, `sets` (curated snapshot JSON), and `live` sources produce an
identical channel object shape, so nothing downstream can tell them apart. This is why the
app works offline, why the tests never need an API key, why demo mode is not a hack but a
real adapter, and why versioned card sets ship as plain static files.

**The pure core.** `rarityFromSubs` and `statsFrom` are pure and deterministic — no I/O,
no randomness, no DOM. They sit between the seam and everything stateful. This is the
test target.

```
input (@handle | URL | UC id)
        |
   resolve to channelId
        |
   +----+----+---------+      <- the seam
   |         |         |
 demo   sets (JSON)  live (YouTube Data API v3)
   |         |         |
   +----+----+---------+
        |
  derivation core (PURE)  <- rarityFromSubs, statsFrom
        |
  gacha engine (weighted RNG, x1/x10, dupes stack)
        |
  collection state
        |
  card render + reveal
```

## Conventions

- Vanilla JS, ES modules, no framework, no bundler.
- Pure logic lives in `src/core.js` and imports nothing.
- Anything touching the network lives behind `src/data/`.
- Anything touching the DOM lives in `src/ui/`.
- Fonts: Anton (display), Space Grotesk (body), Space Mono (stats/numbers).
- Palette: dark plum stage, YouTube-red accents.
- Record any new decision that closes off an option in `DECISIONS.md`.
